import { Client, Databases, ID } from 'node-appwrite';
import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';
import { GoogleGenerativeAI } from '@google/generative-ai';

const SYSTEM_INSTRUCTION = `You are CourseIT, an action-first documentation summarizer that turns dense reference docs into structured, step-by-step learning paths for modern developers.

Rules:
1. One concept per step, never combine ideas.
2. Start each step with the concept itself — no scene-setting.
3. Attach a time estimate to each step (e.g. "~10 min").
4. No filler language, no encouragement padding.
5. If source text is thin on a topic, say so in one line.

Output strictly valid JSON with this exact schema:
{
  "title": "Concise, descriptive course title based on the documentation topic",
  "steps": [
    {
      "step_number": 1,
      "title": "Clear Concept / Action Title",
      "time_estimate": "~10 min",
      "summary": "Direct, action-oriented explanation of the concept, code mechanics, or exact steps to implement. No fluff."
    }
  ]
}`;

export default async ({ req, res, log, error }) => {
  if (req.method === 'OPTIONS') {
    return res.empty();
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      body = {};
    }
  }

  const url = body?.url;
  if (!url) {
    return res.json({ success: false, error: 'URL is required' }, 400);
  }

  try {
    log(`Fetching docs from ${url}`);
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) CourseIT/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch documentation (HTTP ${response.status})`);
    }

    const html = await response.text();
    const dom = new JSDOM(html, { url });
    const doc = dom.window.document;

    ['script', 'style', 'nav', 'header', 'footer', '.sidebar'].forEach(sel => {
      doc.querySelectorAll(sel).forEach(el => el.remove());
    });

    const reader = new Readability(doc);
    const article = reader.parse();
    const cleanText = article?.textContent ? article.textContent.replace(/\s+/g, ' ').trim() : doc.body.textContent;
    const title = article?.title || doc.title || 'Documentation Learning Path';

    log(`Content extracted. Calling Gemini...`);
    const apiKey = process.env.LLM_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('LLM_API_KEY is not set.');
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: SYSTEM_INSTRUCTION,
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.2
      }
    });

    const llmResult = await model.generateContent(`Title: ${title}\n\nContent:\n${cleanText.slice(0, 35000)}`);
    const responseText = llmResult.response.text();
    const parsed = JSON.parse(responseText.replace(/```json|```/g, '').trim());

    log(`LLM finished. Writing to Appwrite database...`);
    const endpoint = process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
    const projectId = process.env.APPWRITE_FUNCTION_PROJECT_ID || process.env.APPWRITE_PROJECT_ID;
    const databaseId = process.env.APPWRITE_DATABASE_ID;
    const collectionId = process.env.APPWRITE_COLLECTION_ID || '6aaa6fef000b2b0129c4';
    const serverKey = process.env.APPWRITE_API_KEY;

    let docId = `course_${Date.now()}`;
    if (serverKey && projectId && databaseId) {
      const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(serverKey);
      const databases = new Databases(client);

      const created = await databases.createDocument(
        databaseId,
        collectionId,
        ID.unique(),
        {
          source_url: url,
          title: parsed.title || title,
          steps: JSON.stringify(parsed.steps || [])
        }
      );
      docId = created.$id;
    }

    return res.json({
      success: true,
      course: {
        $id: docId,
        title: parsed.title || title,
        source_url: url,
        steps: parsed.steps || [],
        $createdAt: new Date().toISOString()
      }
    });
  } catch (err) {
    error(`Summarize failed: ${err.message}`);
    return res.json({ success: false, error: err.message }, 500);
  }
};
