import { Client, Databases, Storage } from 'appwrite';

// Leaf module: do not import authentication or course services here.
const ENDPOINT = import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://syd.cloud.appwrite.io/v1';
const PROJECT_ID = import.meta.env.VITE_APPWRITE_PROJECT_ID || '';
const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID || '';
const COLLECTION_ID = import.meta.env.VITE_APPWRITE_COLLECTION_ID || '';

// Initialize Appwrite Client if project ID exists
export let client = null;
export let databases = null;
export let storage = null;

export function isAppwriteConfigured() {
  return Boolean(PROJECT_ID);
}

export function isDatabaseConfigured() {
  return Boolean(PROJECT_ID && DATABASE_ID && COLLECTION_ID);
}

if (PROJECT_ID) {
  try {
    client = new Client().setEndpoint(ENDPOINT).setProject(PROJECT_ID);
    if (DATABASE_ID && COLLECTION_ID) {
      databases = new Databases(client);
    }
    storage = new Storage(client);
  } catch (err) {
    console.warn('Appwrite client initialization error:', err);
  }
}
