import { Client, Databases, Storage, ID, Query } from 'appwrite';

const ENDPOINT = import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
const PROJECT_ID = import.meta.env.VITE_APPWRITE_PROJECT_ID || '';
const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID || '';
const COLLECTION_ID = import.meta.env.VITE_APPWRITE_COLLECTION_ID || '6aaa6fef000b2b0129c4';
export const BUCKET_DOCS_ID = 'course_docs';

const LOCAL_STORAGE_KEY = 'courseit_saved_courses';

// Pre-seeded starter course for instant showcase
const SAMPLE_GODOT_COURSE = {
  $id: 'godot-sample-nodes-scenes',
  title: 'Nodes and Scenes in Godot 4',
  source_url: 'https://docs.godotengine.org/en/stable/getting_started/step_by_step/nodes_and_scenes.html',
  $createdAt: '2026-09-16T10:00:00.000Z',
  steps: [
    {
      step_number: 1,
      title: 'Understand the Node as Godot\'s Basic Building Block',
      time_estimate: '~5 min',
      summary: 'Nodes are the fundamental objects in Godot. Every node has a name, editable properties, can receive callbacks to process each frame, and can be extended with scripts. Nodes only perform specific jobs (e.g. Sprite2D displays an image, Camera2D controls the viewport).'
    },
    {
      step_number: 2,
      title: 'Organize Nodes into a Hierarchical Scene Tree',
      time_estimate: '~10 min',
      summary: 'A scene is a collection of nodes arranged hierarchically in a tree. The tree has one single root node. When a parent node moves or transforms, all child nodes move along with it automatically.'
    },
    {
      step_number: 3,
      title: 'Create and Save a Scene in the Godot Editor',
      time_estimate: '~8 min',
      summary: 'In the Scene dock, click \'+\' to add a root node (such as Node2D or Control). Add child nodes under it. Save the scene file using Ctrl+S as a .tscn file inside your project\'s res:// folder.'
    },
    {
      step_number: 4,
      title: 'Instance Scenes to Reuse Game Components',
      time_estimate: '~12 min',
      summary: 'Scenes can be saved as templates and instanced inside other scenes (like a character or coin inside a game level). Click the link icon in the Scene dock to instance a saved .tscn file. Modifying the original scene updates all instances.'
    }
  ]
};

// Initialize Appwrite Client if project ID exists
export let client = null;
export let databases = null;
export let storage = null;

export function isAppwriteConfigured() {
  return Boolean(PROJECT_ID && DATABASE_ID && COLLECTION_ID);
}

if (isAppwriteConfigured()) {
  try {
    client = new Client().setEndpoint(ENDPOINT).setProject(PROJECT_ID);
    databases = new Databases(client);
    storage = new Storage(client);
  } catch (err) {
    console.warn('Appwrite client initialization error:', err);
  }
}

/**
 * Uploads a document or image file to Appwrite Storage bucket 'course_docs'
 */
export async function uploadFileToAppwrite(file) {
  if (!storage) {
    console.warn('Appwrite storage is not initialized');
    return null;
  }

  try {
    const fileId = ID.unique();
    const result = await storage.createFile(BUCKET_DOCS_ID, fileId, file);
    console.log('[CourseIT Storage] File uploaded to Appwrite course_docs:', result.$id);
    return result;
  } catch (err) {
    console.warn('Failed to upload file to Appwrite Storage bucket course_docs:', err.message);
    return null;
  }
}

/**
 * Normalizes course document format ensuring steps is an array and rich fields are preserved
 */
function normalizeCourse(doc) {
  let steps = doc.steps;
  let overview = doc.overview || '';
  let recommendedNext = doc.recommended_next_step || '';
  let creatorId = doc.creator_id || null;
  let creatorEmail = doc.creator_email || null;

  if (typeof steps === 'string') {
    try {
      const parsed = JSON.parse(steps);
      if (Array.isArray(parsed)) {
        steps = parsed;
      } else if (parsed && typeof parsed === 'object') {
        steps = parsed.items || parsed.steps || [];
        overview = parsed.overview || overview;
        recommendedNext = parsed.recommended_next_step || recommendedNext;
        creatorId = parsed.creator_id || creatorId;
        creatorEmail = parsed.creator_email || creatorEmail;
      }
    } catch {
      steps = [];
    }
  }

  return {
    ...doc,
    overview,
    recommended_next_step: recommendedNext,
    steps: Array.isArray(steps) ? steps : [],
    creator_id: creatorId,
    creator_email: creatorEmail
  };
}

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

/**
 * Get courses from local storage with 24-hour auto-purge for guest generations
 */
export function getLocalCourses() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const courses = JSON.parse(raw);
    const now = Date.now();

    // Automatic 24-hour self-deletion for public/guest courses
    const validCourses = courses.filter(c => {
      if (c.is_curated || c.$id?.startsWith('starter-')) return true;
      const isGuest = Boolean(c.is_guest || c.creator_id === 'public_guest' || !c.creator_id);
      if (!isGuest) return true;

      const createdTime = c.$createdAt
        ? new Date(c.$createdAt).getTime()
        : (c.createdAt ? new Date(c.createdAt).getTime() : now);

      return (now - createdTime) < TWENTY_FOUR_HOURS_MS;
    });

    if (validCourses.length !== courses.length) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(validCourses));
    }

    return validCourses;
  } catch {
    return [];
  }
}

/**
 * Save course to local storage
 */
export function saveLocalCourse(course) {
  try {
    const current = getLocalCourses();
    const existingIndex = current.findIndex(c => c.$id === course.$id);
    let updated;
    if (existingIndex >= 0) {
      updated = [...current];
      updated[existingIndex] = course;
    } else {
      updated = [course, ...current];
    }
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save course to localStorage:', err);
  }
}

import { STARTER_COURSES } from '../data/starterCourses';

/**
 * Fetch list of courses: combines curated starter templates visible to all users
 * with user-specific or admin-managed custom courses.
 */
export async function listCourses(userId = null, isAdmin = false) {
  // Guests and unauthenticated visitors ONLY see public starter templates + current session guest courses
  if (!userId || userId === 'public_guest') {
    const local = getLocalCourses().filter(c => c.is_guest);
    const allMap = new Map();
    STARTER_COURSES.forEach(c => allMap.set(c.$id, c));
    local.forEach(c => allMap.set(c.$id, c));
    return Array.from(allMap.values());
  }

  let customCourses = [];

  if (databases && isAppwriteConfigured()) {
    try {
      const queries = [Query.orderDesc('$createdAt')];
      // If regular authenticated user, strictly filter by creator_id
      if (!isAdmin) {
        queries.push(Query.equal('creator_id', userId));
      }

      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        queries
      );

      customCourses = response.documents.map(normalizeCourse);
    } catch (err) {
      // Fallback: read from local storage with creator filtering
      customCourses = getLocalCourses().filter(c => !c.is_curated && (isAdmin || c.creator_id === userId));
    }
  } else {
    customCourses = getLocalCourses().filter(c => !c.is_curated && (isAdmin || c.creator_id === userId));
  }

  // Merge STARTER_COURSES first so catalog templates are always present
  const allMap = new Map();
  STARTER_COURSES.forEach(c => allMap.set(c.$id, c));
  customCourses.forEach(c => allMap.set(c.$id, c));

  return Array.from(allMap.values());
}

/**
 * Get a specific course by ID: checks STARTER_COURSES first, then Appwrite, then local storage.
 * Enforces strict ACL: non-starter custom courses require authenticated ownership or admin privileges.
 */
export async function getCourse(id, user = null, isAdmin = false) {
  // 1. Curated starter templates are always public
  const starter = STARTER_COURSES.find(c => c.$id === id);
  if (starter) return starter;

  // 2. Fetch from Appwrite
  let found = null;
  if (databases && isAppwriteConfigured()) {
    try {
      const doc = await databases.getDocument(DATABASE_ID, COLLECTION_ID, id);
      if (doc) found = normalizeCourse(doc);
    } catch (err) {
      console.warn(`Appwrite fetch for ${id} failed, checking local storage:`, err.message);
    }
  }

  // 3. Fallback to local storage
  if (!found) {
    const local = getLocalCourses();
    found = local.find(c => c.$id === id);
  }

  if (!found) {
    throw new Error(`Course with ID "${id}" was not found.`);
  }

  // 4. Strict Access Control Verification
  if (found.is_curated || found.$id?.startsWith('starter-')) {
    return found;
  }

  // Non-starter courses require authentication
  if (!user || !user.id) {
    const err = new Error('Authentication Required: You must be signed in to view this private course.');
    err.code = 'UNAUTHORIZED';
    err.status = 401;
    throw err;
  }

  // Check creator ownership or master administrator authorization
  const isAuthor = Boolean(found.creator_id && found.creator_id === user.id);
  if (!isAuthor && !isAdmin) {
    const err = new Error('Access Denied: You do not have permission to view this custom course.');
    err.code = 'FORBIDDEN';
    err.status = 403;
    throw err;
  }

  return found;
}
