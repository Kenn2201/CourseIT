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

/**
 * Calls the configured LLM to generate structured learning steps from cleaned text.
 * 
 * @param {string} rawText - Cleaned documentation text
 * @param {string} fallbackTitle - Title extracted from HTML metadata
 * @returns {Promise<{ title: string, steps: Array<{ step_number: number, title: string, time_estimate: string, summary: string }> }>}
 */
export async function summarizeWithLLM(rawText, fallbackTitle = 'Documentation Learning Path') {
  const provider = (process.env.LLM_PROVIDER || 'gemini').toLowerCase();
  const apiKey = process.env.LLM_API_KEY || process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('LLM_API_KEY is not set. Please provide a valid API key in Doppler or your .env file.');
  }

  if (provider === 'gemini') {
    return await callGemini(rawText, fallbackTitle, apiKey);
  } else if (provider === 'openai') {
    return await callOpenAI(rawText, fallbackTitle, apiKey);
  } else {
    // Default to Gemini
    return await callGemini(rawText, fallbackTitle, apiKey);
  }
}

async function callGemini(rawText, fallbackTitle, apiKey) {
  const genAI = new GoogleGenerativeAI(apiKey);
  
  const modelsToTry = [
    process.env.GEMINI_MODEL,
    'gemini-3.6-flash',
    'gemini-2.5-flash',
    'gemini-flash-latest'
  ].filter(Boolean);

  const prompt = `Documentation Topic / Page Title: ${fallbackTitle}\n\nDocumentation Content:\n${rawText.slice(0, 35000)}`;

  let lastError;
  for (const modelName of modelsToTry) {
    try {
      console.log(`[CourseIT] Trying Gemini model: ${modelName}`);
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: SYSTEM_INSTRUCTION,
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        }
      });
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      return parseAndValidateSteps(responseText, fallbackTitle);
    } catch (err) {
      console.warn(`[CourseIT] Model ${modelName} failed (${err.message.slice(0, 80)}). Trying next model...`);
      lastError = err;
      // If temporary overload, 404, or rate limit, proceed to next candidate model
      continue;
    }
  }
  throw lastError;
}

async function callOpenAI(rawText, fallbackTitle, apiKey) {
  const endpoint = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1/chat/completions';
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      response_format: { type: 'json_object' },
      temperature: 0.2,
      messages: [
        { role: 'system', content: SYSTEM_INSTRUCTION },
        { role: 'user', content: `Documentation Topic / Page Title: ${fallbackTitle}\n\nDocumentation Content:\n${rawText.slice(0, 35000)}` }
      ]
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  return parseAndValidateSteps(content, fallbackTitle);
}

function parseAndValidateSteps(rawJsonString, fallbackTitle) {
  let cleaned = rawJsonString.trim();
  // Strip code block markers if present
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3);
  }
  cleaned = cleaned.trim();

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch (err) {
    throw new Error(`Failed to parse structured JSON from LLM: ${err.message}`);
  }

  const title = parsed.title || fallbackTitle;
  const rawSteps = Array.isArray(parsed.steps) ? parsed.steps : (Array.isArray(parsed) ? parsed : []);

  if (!rawSteps.length) {
    throw new Error('LLM did not return any learning steps.');
  }

  const formattedSteps = rawSteps.map((step, idx) => ({
    step_number: step.step_number || (idx + 1),
    title: step.title || `Step ${idx + 1}`,
    time_estimate: step.time_estimate || '~5 min',
    summary: step.summary || (typeof step === 'string' ? step : '')
  }));

  return {
    title,
    steps: formattedSteps
  };
}
