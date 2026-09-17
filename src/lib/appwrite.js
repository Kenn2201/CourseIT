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

/**
 * Get courses from local storage
 */
export function getLocalCourses() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify([SAMPLE_GODOT_COURSE]));
      return [SAMPLE_GODOT_COURSE];
    }
    return JSON.parse(raw);
  } catch {
    return [SAMPLE_GODOT_COURSE];
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
  let customCourses = [];

  if (databases && isAppwriteConfigured()) {
    try {
      const queries = [Query.orderDesc('$createdAt')];
      // If regular user, only show their courses plus starters
      if (userId && !isAdmin && userId !== 'public_guest') {
        queries.push(Query.equal('creator_id', userId));
      }

      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        queries
      );

      customCourses = response.documents.map(normalizeCourse);
    } catch (err) {
      // Fallback: read from local custom storage
      customCourses = getLocalCourses().filter(c => !c.is_curated);
    }
  } else {
    customCourses = getLocalCourses().filter(c => !c.is_curated);
  }

  // Filter custom courses if guest
  if (!userId || userId === 'public_guest') {
    // Guests only see starter templates and courses generated in their current session
    const local = getLocalCourses().filter(c => c.is_guest);
    customCourses = local;
  }

  // Merge STARTER_COURSES first so catalog templates are always present
  const allMap = new Map();
  STARTER_COURSES.forEach(c => allMap.set(c.$id, c));
  customCourses.forEach(c => allMap.set(c.$id, c));

  const merged = Array.from(allMap.values());
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(merged));
  } catch {}

  return merged;
}

/**
 * Get a specific course by ID: checks STARTER_COURSES first, then Appwrite, then local storage
 */
export async function getCourse(id) {
  const starter = STARTER_COURSES.find(c => c.$id === id);
  if (starter) return starter;

  if (databases && isAppwriteConfigured()) {
    try {
      const doc = await databases.getDocument(DATABASE_ID, COLLECTION_ID, id);
      return normalizeCourse(doc);
    } catch (err) {
      console.warn(`Appwrite fetch for ${id} failed, checking local storage:`, err.message);
    }
  }

  const local = getLocalCourses();
  const found = local.find(c => c.$id === id);
  if (found) return found;

  throw new Error(`Course with ID ${id} not found.`);
}
