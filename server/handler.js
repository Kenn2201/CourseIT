import { Client, Databases, ID, Query } from 'node-appwrite';
import { extractDocumentation } from './extract.js';
import { summarizeWithLLM } from './llm.js';

// Public generation quota tracker (20 free generations for public visitors)
const TOTAL_PUBLIC_CREDITS = 20;
let publicUsedCount = 0;

export function getPublicQuota() {
  return {
    total: TOTAL_PUBLIC_CREDITS,
    used: publicUsedCount,
    remaining: Math.max(0, TOTAL_PUBLIC_CREDITS - publicUsedCount)
  };
}

/**
 * Core handler to process URL -> check cache -> extract text -> LLM summarize -> Appwrite document.
 * 
 * @param {string} url - Documentation URL
 * @param {string|null} customModel - Optional selected Gemini model
 * @param {boolean} isAdmin - Whether the caller is authenticated as admin
 * @returns {Promise<{ course: object, savedToAppwrite: boolean, cached?: boolean, quota: object }>}
 */
export async function processDocumentationUrl(url, customModel = null, isAdmin = false, forceRefresh = false) {
  if (!url) {
    throw new Error('URL is required');
  }

  const endpoint = process.env.APPWRITE_ENDPOINT || process.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
  const projectId = process.env.APPWRITE_PROJECT_ID || process.env.VITE_APPWRITE_PROJECT_ID;
  const databaseId = process.env.APPWRITE_DATABASE_ID || process.env.VITE_APPWRITE_DATABASE_ID;
  const collectionId = process.env.APPWRITE_COLLECTION_ID || process.env.VITE_APPWRITE_COLLECTION_ID || '6aaa6fef000b2b0129c4';
  const apiKey = process.env.APPWRITE_API_KEY;

  let databases = null;
  if (apiKey && projectId && databaseId && collectionId) {
    try {
      const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
      databases = new Databases(client);
    } catch (clientErr) {
      console.warn('Could not initialize Appwrite Server client:', clientErr.message);
    }
  }

  let existingDocId = null;
  // 1. Check URL Deduplication Cache in Appwrite (Unless forceRefresh is requested)
  if (databases) {
    try {
      const existing = await databases.listDocuments(databaseId, collectionId, [
        Query.equal('source_url', url)
      ]);

      if (existing.documents && existing.documents.length > 0) {
        const doc = existing.documents[0];
        existingDocId = doc.$id;

        if (!forceRefresh) {
          let steps = doc.steps;
          let overview = '';
          let recommended_next_step = '';

          try {
            const parsed = JSON.parse(doc.steps);
            if (Array.isArray(parsed)) {
              steps = parsed;
            } else if (parsed && typeof parsed === 'object') {
              steps = parsed.items || parsed.steps || [];
              overview = parsed.overview || '';
              recommended_next_step = parsed.recommended_next_step || '';
            }
          } catch {
            steps = [];
          }

          console.log(`[CourseIT Cache Hit] URL already processed: ${url}. Returning existing course (0 tokens used).`);
          return {
            course: {
              $id: doc.$id,
              title: doc.title,
              source_url: doc.source_url,
              overview,
              recommended_next_step,
              steps,
              $createdAt: doc.$createdAt
            },
            savedToAppwrite: true,
            cached: true,
            quota: getPublicQuota()
          };
        }
      }
    } catch (cacheErr) {
      console.warn('Cache lookup warning:', cacheErr.message);
    }
  }

  // 2. Public Rate Limiting Check (Only applies if not in Admin Mode)
  if (!isAdmin && publicUsedCount >= TOTAL_PUBLIC_CREDITS) {
    throw new Error(
      `Public generation limit reached (${TOTAL_PUBLIC_CREDITS}/${TOTAL_PUBLIC_CREDITS} free courses used). Please log in as Admin to generate more courses, or explore all existing courses!`
    );
  }

  // 3. Extract content from URL
  const extracted = await extractDocumentation(url);

  // 4. Summarize with LLM (Gemini) with enriched schema (code snippets, implementation, gotchas)
  const summarized = await summarizeWithLLM(extracted.content, extracted.title, customModel);

  // Package rich payload inside steps field to maintain database schema compatibility
  const payloadToStore = JSON.stringify({
    overview: summarized.overview || '',
    recommended_next_step: summarized.recommended_next_step || '',
    items: summarized.steps
  });

  const now = new Date().toISOString();
  let savedToAppwrite = false;
  let documentId = existingDocId || `course_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

  // 5. Save to Appwrite if server credentials exist
  if (databases) {
    try {
      if (existingDocId) {
        console.log(`[CourseIT] Updating existing Appwrite document: ${existingDocId}`);
        const doc = await databases.updateDocument(
          databaseId,
          collectionId,
          existingDocId,
          {
            source_url: url,
            title: summarized.title,
            steps: payloadToStore
          }
        );
        documentId = doc.$id;
      } else {
        const doc = await databases.createDocument(
          databaseId,
          collectionId,
          ID.unique(),
          {
            source_url: url,
            title: summarized.title,
            steps: payloadToStore
          }
        );
        documentId = doc.$id;
      }

      savedToAppwrite = true;
    } catch (appwriteErr) {
      console.warn('Could not save directly to Appwrite Server:', appwriteErr.message);
    }
  }

  // Deduct public credit if not admin
  if (!isAdmin) {
    publicUsedCount++;
  }

  return {
    course: {
      $id: documentId,
      title: summarized.title,
      source_url: url,
      overview: summarized.overview || '',
      recommended_next_step: summarized.recommended_next_step || '',
      steps: summarized.steps,
      $createdAt: now
    },
    savedToAppwrite,
    cached: false,
    quota: getPublicQuota()
  };
}
