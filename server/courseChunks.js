/**
 * CourseIT Source Chunking & Retrieval Module
 *
 * Implements code-aware document chunking (1,500-3,000 chars with overlap),
 * heading preservation, stable chunk IDs, and multi-tier relevance retrieval
 * without requiring vector/embedding database infrastructure.
 */

import { randomUUID } from 'node:crypto';
import { readState, writeState } from './state.js';

/**
 * Common technical stopwords to filter out of keyword sets.
 */
const STOPWORDS = new Set([
  'the', 'and', 'for', 'that', 'this', 'with', 'from', 'your', 'have',
  'are', 'not', 'can', 'will', 'all', 'any', 'each', 'into', 'which',
  'use', 'using', 'used', 'how', 'when', 'what', 'then', 'than', 'some',
  'more', 'also', 'such', 'only', 'other', 'been', 'were', 'about'
]);

/**
 * Extracts normalized alphanumeric keywords from text.
 */
export function extractKeywords(text, maxCount = 25) {
  if (!text) return [];
  const words = String(text)
    .toLowerCase()
    .replace(/[`~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOPWORDS.has(w) && !/^\d+$/.test(w));

  const freq = new Map();
  for (const w of words) {
    freq.set(w, (freq.get(w) || 0) + 1);
  }

  return Array.from(freq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxCount)
    .map(([w]) => w);
}

/**
 * Splits document text into clean, contextual chunks of 1,500-3,000 characters.
 * Preserves code blocks (fenced with ```) and heading boundaries.
 * 
 * @param {string} rawText - Full document text
 * @param {string} courseId - Associated course identifier
 * @param {string} sourceId - Source document identifier/URL
 * @returns {Array<{ id: string, courseId: string, sourceId: string, index: number, heading: string, text: string, keywords: string[] }>}
 */
export function chunkDocumentText(rawText, courseId = null, sourceId = 'doc') {
  if (!rawText || typeof rawText !== 'string') return [];

  const text = rawText.replace(/\r\n/g, '\n').trim();
  if (!text) return [];

  const TARGET_MIN = 1500;
  const TARGET_MAX = 3000;
  const OVERLAP_CHARS = 250;

  // Split by markdown headings or double newlines while tracking current section heading
  const lines = text.split('\n');
  const sections = [];
  let currentHeading = 'Overview';
  let currentParagraphs = [];
  let insideCodeFence = false;

  for (const line of lines) {
    if (line.trim().startsWith('```')) {
      insideCodeFence = !insideCodeFence;
    }

    const headingMatch = !insideCodeFence && line.match(/^#{1,4}\s+(.+)$/);
    if (headingMatch) {
      if (currentParagraphs.length > 0) {
        sections.push({ heading: currentHeading, body: currentParagraphs.join('\n') });
        currentParagraphs = [];
      }
      currentHeading = headingMatch[1].trim();
    } else {
      currentParagraphs.push(line);
    }
  }

  if (currentParagraphs.length > 0) {
    sections.push({ heading: currentHeading, body: currentParagraphs.join('\n') });
  }

  // Now assemble chunks respecting target bounds (1500-3000 chars)
  const chunks = [];
  let buffer = '';
  let chunkHeading = sections[0]?.heading || 'Overview';

  for (const section of sections) {
    const sectionText = section.body.trim();
    if (!sectionText) continue;

    if (buffer.length + sectionText.length <= TARGET_MAX) {
      buffer += (buffer ? '\n\n' : '') + `## ${section.heading}\n` + sectionText;
    } else {
      if (buffer.length >= TARGET_MIN) {
        chunks.push({ heading: chunkHeading, text: buffer.trim() });
        // Retain overlap from end of buffer
        const overlap = buffer.slice(Math.max(0, buffer.length - OVERLAP_CHARS));
        buffer = overlap + '\n\n## ' + section.heading + '\n' + sectionText;
      } else {
        buffer += (buffer ? '\n\n' : '') + `## ${section.heading}\n` + sectionText;
        if (buffer.length >= TARGET_MAX) {
          chunks.push({ heading: chunkHeading, text: buffer.trim() });
          buffer = '';
        }
      }
      chunkHeading = section.heading;
    }
  }

  if (buffer.trim().length > 0) {
    chunks.push({ heading: chunkHeading, text: buffer.trim() });
  }

  // If the document was very short and produced 0 chunks (or fewer than 1)
  if (chunks.length === 0 && text.length > 0) {
    chunks.push({ heading: 'Overview', text: text.slice(0, TARGET_MAX) });
  }

  return chunks.map((chunk, idx) => ({
    id: `chunk_${idx}`,
    courseId: courseId || 'temp',
    sourceId,
    index: idx,
    heading: chunk.heading,
    text: chunk.text,
    keywords: extractKeywords(`${chunk.heading} ${chunk.text}`)
  }));
}

/**
 * Stores chunks associated with a course into persistent state (`chunks/${courseId}`).
 */
export async function saveCourseChunks(courseId, chunks) {
  if (!courseId || !Array.isArray(chunks) || chunks.length === 0) return;
  const boundChunks = chunks.map(c => ({ ...c, courseId }));
  await writeState(`chunks/${courseId}`, {
    courseId,
    totalChunks: boundChunks.length,
    updatedAt: new Date().toISOString(),
    chunks: boundChunks
  });
}

/**
 * Retrieves course chunks from persistent state.
 */
export async function getCourseChunks(courseId) {
  if (!courseId) return [];
  const record = await readState(`chunks/${courseId}`);
  return record?.chunks || [];
}

/**
 * Multi-tier retrieval order:
 * 1. Current step sourceRefs (stable IDs)
 * 2. Heading / title relevance
 * 3. Keyword relevance
 * 4. Broader course source fallback (first 1-2 chunks)
 *
 * Subject to hard max token / chunk budget (default max 3 chunks).
 */
export function retrieveRelevantChunks({
  chunks = [],
  stepSourceRefs = [],
  stepTitle = '',
  stepGoal = '',
  userQuery = '',
  maxChunks = 3
}) {
  if (!Array.isArray(chunks) || chunks.length === 0) return [];

  const chunkMap = new Map(chunks.map(c => [c.id, c]));
  const selected = [];
  const seenIds = new Set();

  // Tier 1: Current step's explicit sourceRefs
  for (const refId of stepSourceRefs) {
    const chunk = chunkMap.get(refId);
    if (chunk && !seenIds.has(chunk.id)) {
      selected.push({ ...chunk, relevanceTier: 'step_sourceRef', score: 100 });
      seenIds.add(chunk.id);
      if (selected.length >= maxChunks) return selected;
    }
  }

  // Build query keywords from step title, step goal, and user query
  const queryWords = extractKeywords(`${stepTitle} ${stepGoal} ${userQuery}`);
  const titleWords = new Set(extractKeywords(stepTitle));

  // Score remaining chunks
  const scored = [];
  for (const chunk of chunks) {
    if (seenIds.has(chunk.id)) continue;

    let score = 0;
    const chunkHeadingWords = extractKeywords(chunk.heading);
    const chunkKeywords = new Set(chunk.keywords);

    // Tier 2: Heading / Title match (weight: 10 per match)
    for (const tw of titleWords) {
      if (chunkHeadingWords.includes(tw)) score += 15;
      else if (chunkKeywords.has(tw)) score += 5;
    }

    // Tier 3: Keyword relevance across user query and goal (weight: 3 per match)
    for (const qw of queryWords) {
      if (chunkKeywords.has(qw)) score += 3;
    }

    if (score > 0) {
      scored.push({ chunk, score });
    }
  }

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  for (const item of scored) {
    selected.push({ ...item.chunk, relevanceTier: 'keyword_relevance', score: item.score });
    seenIds.add(item.chunk.id);
    if (selected.length >= maxChunks) break;
  }

  // Tier 4: Fallback to initial chunks if nothing matched
  if (selected.length === 0 && chunks.length > 0) {
    for (let i = 0; i < Math.min(chunks.length, maxChunks); i++) {
      selected.push({ ...chunks[i], relevanceTier: 'fallback', score: 1 });
    }
  }

  return selected.slice(0, maxChunks);
}
