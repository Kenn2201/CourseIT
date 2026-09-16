import { Client, Databases, ID } from 'node-appwrite';
import { extractDocumentation } from './extract.js';
import { summarizeWithLLM } from './llm.js';

/**
 * Core handler to process URL -> extract text -> LLM summarize -> Appwrite document.
 * 
 * @param {string} url - Documentation URL
 * @returns {Promise<{ course: object, savedToAppwrite: boolean }>}
 */
export async function processDocumentationUrl(url, customModel = null) {
  if (!url) {
    throw new Error('URL is required');
  }

  // 1. Extract content from URL
  const extracted = await extractDocumentation(url);

  // 2. Summarize with LLM (Gemini)
  const summarized = await summarizeWithLLM(extracted.content, extracted.title, customModel);

  // 3. Save to Appwrite if server credentials exist
  const endpoint = process.env.APPWRITE_ENDPOINT || process.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
  const projectId = process.env.APPWRITE_PROJECT_ID || process.env.VITE_APPWRITE_PROJECT_ID;
  const databaseId = process.env.APPWRITE_DATABASE_ID || process.env.VITE_APPWRITE_DATABASE_ID;
  const collectionId = process.env.APPWRITE_COLLECTION_ID || process.env.VITE_APPWRITE_COLLECTION_ID || '6aaa6fef000b2b0129c4';
  const apiKey = process.env.APPWRITE_API_KEY;

  const stepsJsonString = JSON.stringify(summarized.steps);
  const now = new Date().toISOString();

  let savedToAppwrite = false;
  let documentId = `course_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

  if (apiKey && projectId && databaseId && collectionId) {
    try {
      const client = new Client()
        .setEndpoint(endpoint)
        .setProject(projectId)
        .setKey(apiKey);

      const databases = new Databases(client);

      const doc = await databases.createDocument(
        databaseId,
        collectionId,
        ID.unique(),
        {
          source_url: url,
          title: summarized.title,
          steps: stepsJsonString
        }
      );

      documentId = doc.$id;
      savedToAppwrite = true;
    } catch (appwriteErr) {
      console.warn('Could not save directly to Appwrite Server:', appwriteErr.message);
      // Continue and return course object so UI still succeeds with local fallback
    }
  }

  return {
    course: {
      $id: documentId,
      title: summarized.title,
      source_url: url,
      steps: summarized.steps,
      $createdAt: now
    },
    savedToAppwrite
  };
}
