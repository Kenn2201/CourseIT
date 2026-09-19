import { Client, Databases, Query } from 'node-appwrite';
import { readState, writeState, listState, deleteState, updateState } from './state.js';
import { normalizeCourse, canReadCourse, isExpiredCourse, isSystemCourse, publicCourse } from '../shared/courses.js';
import { STARTER_COURSES } from '../shared/starterCourses.js';

const PUBLIC_FEED_KEY = 'indexes/public-feed';

export async function addPublicCourseToFeed(course) {
  if (course.visibility !== 'public' || isSystemCourse(course)) return;
  await updateState(PUBLIC_FEED_KEY, current => {
    const entries = (current?.entries || []).filter(entry => entry.id !== course.$id &&
      (!entry.expiresAt || Date.parse(entry.expiresAt) > Date.now()));
    entries.push({ id: course.$id, createdAt: course.$createdAt, expiresAt: course.expires_at || null });
    entries.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return { entries: entries.slice(0, 200) };
  });
}

export async function removePublicCourseFromFeed(id) {
  const current = await readState(PUBLIC_FEED_KEY);
  if (!current?.entries?.some(entry => entry.id === id)) return;
  await updateState(PUBLIC_FEED_KEY, value => ({ entries: (value?.entries || []).filter(entry => entry.id !== id) }));
}

export function courseDatabase() {
  const e = process.env;
  const project = e.APPWRITE_PROJECT_ID || e.VITE_APPWRITE_PROJECT_ID;
  const databaseId = e.APPWRITE_DATABASE_ID || e.VITE_APPWRITE_DATABASE_ID;
  const collectionId = e.APPWRITE_COLLECTION_ID || e.VITE_APPWRITE_COLLECTION_ID;
  if (!e.APPWRITE_API_KEY || !project || !databaseId || !collectionId) return null;
  const client = new Client().setEndpoint(e.APPWRITE_ENDPOINT || e.VITE_APPWRITE_ENDPOINT || 'https://syd.cloud.appwrite.io/v1')
    .setProject(project).setKey(e.APPWRITE_API_KEY);
  return { db: new Databases(client), databaseId, collectionId };
}

export async function listDocumentsAll(db, databaseId, collectionId, queries = []) {
  const documents = [];
  let cursor;
  while (true) {
    const page = await db.listDocuments(databaseId, collectionId, [...queries, Query.limit(100),
      ...(cursor ? [Query.cursorAfter(cursor)] : [])]);
    documents.push(...page.documents);
    if (page.documents.length < 100) return documents;
    cursor = page.documents.at(-1).$id;
  }
}

export async function cleanupGuestCourses() {
  const courses = await listState('courses/');
  let removed = 0;
  for (const doc of courses) {
    if (isExpiredCourse(normalizeCourse(doc))) {
      await deleteState(`courses/${doc.$id}`);
      await removePublicCourseFromFeed(doc.$id);
      removed++;
    }
  }
  return removed;
}

export async function listCatalog(session = null, scope = 'catalog') {
  if (!session && scope === 'catalog') {
    const feed = await readState(PUBLIC_FEED_KEY);
    if (feed?.entries?.length >= 3) {
      const indexed = await Promise.all(feed.entries.slice(0, 20).map(entry => readState(`courses/${entry.id}`)));
      const recent = indexed.filter(Boolean).map(normalizeCourse)
        .filter(course => canReadCourse(course))
        .slice(0, 3).map(course => publicCourse(course));
      if (recent.length === 3) return recent;
    }
  }
  const config = courseDatabase();
  const [stored, remote] = await Promise.all([
    listState('courses/'),
    config ? listDocumentsAll(config.db, config.databaseId, config.collectionId) : []
  ]);
  const map = new Map(remote.filter(d => !isSystemCourse(d)).map(d => [d.$id, normalizeCourse(d)]));
  stored.forEach(d => map.set(d.$id, normalizeCourse(d)));
  const visible = Array.from(map.values()).filter(c => canReadCourse(c, session?.userId, session?.isAdmin))
    .filter(c => scope !== 'mine' || c.creator_id === session?.userId)
    .map(c => publicCourse(c, session?.userId, session?.isAdmin))
    .sort((a, b) => b.$createdAt.localeCompare(a.$createdAt));
  // Keep anonymous discovery small. A storage-level index is still needed to avoid scanning legacy records.
  return !session && scope === 'catalog' ? visible.slice(0, 3) : visible;
}

export async function resolveCourse(id, session = null) {
  if (!id || typeof id !== 'string') {
    throw Object.assign(new Error('A valid courseId is required.'), { status: 400 });
  }

  let course = await readState(`courses/${id}`);
  const config = courseDatabase();
  if (!course && config) {
    try {
      course = await config.db.getDocument(config.databaseId, config.collectionId, id);
    } catch (error) {
      if (error.code !== 404) throw error;
    }
  }

  let isStarter = false;
  if (!course) {
    const starter = STARTER_COURSES.find(c => c.$id === id);
    if (starter) {
      course = starter;
      isStarter = true;
    }
  }

  if (!course || isSystemCourse(course)) {
    throw Object.assign(new Error('Course not found.'), { status: 404 });
  }

  course = normalizeCourse(course);

  if (!isStarter && isExpiredCourse(course)) {
    throw Object.assign(new Error('This guest course expired after 30 minutes. Generate a new course to continue.'), { status: 410 });
  }

  if (!isStarter && !canReadCourse(course, session?.userId, session?.isAdmin)) {
    throw Object.assign(new Error(session ? 'Access Denied: This course is private to its author.' :
      'Authentication Required: Sign in to view this private course.'), { status: session ? 403 : 401 });
  }

  const cleanCourse = isStarter ? course : publicCourse(course, session?.userId, session?.isAdmin);
  return {
    course: cleanCourse,
    isStarter,
    sourceType: isStarter ? 'curated_starter' : 'persisted_generated'
  };
}

export async function readCourse(id, session) {
  const { course } = await resolveCourse(id, session);
  return course;
}

export async function publishCourse(id, session) {
  const course = await readCourse(id, session);
  if (!session || (!session.isAdmin && course.creator_id !== session.userId)) {
    throw Object.assign(new Error('Only the author or administrator can publish a course.'), { status: 403 });
  }
  const published = { ...course, visibility: 'public' };
  // Store the sharing decision behind the API; no public write permissions are needed.
  await addPublicCourseToFeed(published);
  await writeState(`courses/${id}`, published);
  return published;
}

export async function readMaintenance() {
  if (process.env.VITE_MAINTENANCE_MODE === 'true') return true;
  return Boolean((await readState('settings/maintenance'))?.enabled);
}

export async function writeMaintenance(enabled) {
  if (process.env.VITE_MAINTENANCE_MODE === 'true' && !enabled) {
    throw Object.assign(new Error('VITE_MAINTENANCE_MODE forces maintenance on. Remove that override in the deployment settings first.'), { status: 409 });
  }
  await writeState('settings/maintenance', { enabled, updatedAt: new Date().toISOString() });
  return enabled;
}
