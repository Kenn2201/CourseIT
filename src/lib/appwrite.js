import { ID } from 'appwrite';
import { storage } from './appwriteClient';
export { client, databases, storage, isAppwriteConfigured, isDatabaseConfigured } from './appwriteClient';

export const BUCKET_DOCS_ID = 'course_docs';

const LOCAL_STORAGE_KEY = 'courseit_saved_courses';
const MAINTENANCE_DOC_ID = 'system_maintenance_flag';

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

// Course ACLs and expiry are enforced again on the server for every cloud read.
import { normalizeCourse, isExpiredCourse, canReadCourse, publicCourse } from '../../shared/courses.js';
import { authenticatedFetch } from './auth';
import { STARTER_COURSES } from '../data/starterCourses';
import { readApiResponse } from './api';

export function getLocalCourses() {
  try {
    const records = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
    const valid = records.map(c => normalizeCourse({
      ...c, is_guest: c.is_guest || c.creator_id === 'public_guest'
    })).filter(c => !isExpiredCourse(c));
    if (valid.length !== records.length) localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(valid));
    return valid;
  } catch { return []; }
}

export function saveLocalCourse(course) {
  const current = getLocalCourses().filter(c => c.$id !== course.$id);
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify([normalizeCourse(course), ...current]));
}

export async function listCourses(userId = null, isAdmin = false, includeCurated = true) {
  const scope = includeCurated || isAdmin ? 'catalog' : 'mine';
  const response = await authenticatedFetch('/api/courses?scope=' + scope);
  const data = await readApiResponse(response);
  const courses = new Map(includeCurated ? STARTER_COURSES.map(c => [c.$id, c]) : []);
  // Keep locally generated results from older versions, scoped to their owner.
  for (const course of getLocalCourses()) {
    if (canReadCourse(course, userId, isAdmin) && (includeCurated || isAdmin || course.creator_id === userId)) {
      courses.set(course.$id, publicCourse(course, userId, isAdmin));
    }
  }
  for (const course of data.courses) courses.set(course.$id, course);
  return [...courses.values()];
}

export async function getCourse(id, user = null, isAdmin = false) {
  const starter = STARTER_COURSES.find(c => c.$id === id);
  if (starter) return starter;
  const response = await authenticatedFetch('/api/courses/' + encodeURIComponent(id));
  if (response.status === 404) {
    // Only legacy local IDs may use a local fallback; cloud ACL errors never do.
    const local = getLocalCourses().find(c => c.$id === id);
    if ((id.startsWith('course_') || id.startsWith('doc_')) && local && canReadCourse(local, user?.id, isAdmin)) {
      return publicCourse(local, user?.id, isAdmin);
    }
  }
  return (await readApiResponse(response)).course;
}

export async function getMaintenanceMode() {
  if (import.meta.env.VITE_MAINTENANCE_MODE === 'true') return true;
  try {
    const data = await readApiResponse(await fetch('/api/maintenance'));
    localStorage.setItem('courseit_maintenance_mode', String(data.enabled));
    return data.enabled;
  } catch (error) {
    console.warn('Maintenance status unavailable:', error.message);
    return localStorage.getItem('courseit_maintenance_mode') === 'true';
  }
}

export async function setMaintenanceMode(enabled) {
  const data = await readApiResponse(await authenticatedFetch('/api/maintenance', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ enabled })
  }));
  localStorage.setItem('courseit_maintenance_mode', String(data.enabled));
  window.dispatchEvent(new Event('courseit_maintenance_changed'));
}

export async function publishCourse(courseId) {
  const data = await readApiResponse(await authenticatedFetch('/api/courses/publish', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ courseId })
  }));
  saveLocalCourse(data.course);
  return data.course;
}
