import { GoogleGenerativeAI } from '@google/generative-ai';

const SYSTEM_INSTRUCTION = `You are CourseIT, an action-first documentation summarizer that turns dense reference docs into structured, step-by-step learning paths for modern developers.

Rules:
1. One concept per step, never combine ideas.
2. Start each step with the concept itself — zero scene-setting. NEVER use conversational filler or passive intros (e.g. "In this section", "Let's explore", "Welcome to", "It is important to understand", "Now we will", "We can see that"). Start directly with the action or technical fact.
3. Every step title MUST start with an imperative action verb (e.g., Configure, Build, Define, Connect, Export, Run, Install, Deploy, Optimize).
4. Attach a time estimate to each step (e.g. "~10 min").
5. No filler language, no motivational cheerleading, and no encouragement padding.
6. Provide concrete, actionable implementation instructions (exact CLI commands, flags, file paths, editor clicks, or workflow).
7. If the source documentation contains code, commands, or config, the code_snippet field MUST contain a clean, runnable example. Do NOT omit code in favor of a text description. If purely UI navigation, code_snippet may be null.
8. If source text is thin on a topic, state so in one direct sentence without speculation.

Output strictly valid JSON with this exact schema:
{
  "title": "Concise, descriptive course title based on the documentation topic",
  "overview": "1-2 sentences summarizing what this guide achieves and any prerequisites",
  "recommended_next_step": "Specific recommendation on what documentation topic, tutorial, or game mechanic to build next",
  "steps": [
    {
      "step_number": 1,
      "title": "Imperative Action Title (e.g., 'Configure Multi-Stage Dockerfile')",
      "time_estimate": "~10 min",
      "summary": "Direct technical explanation of the concept and why it matters. Zero fluff.",
      "implementation": "Concrete step-by-step instructions (e.g., '1. Create Dockerfile, 2. Add build stage with --from=builder, 3. Copy binary to minimal runtime image').",
      "code_snippet": "Runnable code snippet or CLI command with brief comments, or null if purely editor UI",
      "pro_tip": "Important gotcha, pitfall to avoid, or performance advice"
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
export async function summarizeWithLLM(rawText, fallbackTitle = 'Documentation Learning Path', customModel = null) {
  const provider = (process.env.LLM_PROVIDER || 'gemini').toLowerCase();
  const apiKey = process.env.LLM_API_KEY || process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('LLM_API_KEY is not set. Please provide a valid API key in Doppler or your .env file.');
  }

  if (provider === 'gemini') {
    return await callGemini(rawText, fallbackTitle, apiKey, customModel);
  } else if (provider === 'openai') {
    return await callOpenAI(rawText, fallbackTitle, apiKey, customModel);
  } else {
    // Default to Gemini
    return await callGemini(rawText, fallbackTitle, apiKey, customModel);
  }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function callGemini(rawText, fallbackTitle, apiKey, customModel = null) {
  const genAI = new GoogleGenerativeAI(apiKey);
  
  // Tested models in order of speed and stability; prioritizes customModel / GEMINI_MODEL if specified
  const modelsToTry = [
    customModel,
    process.env.GEMINI_MODEL,
    process.env.LLM_MODEL,
    'gemini-flash-lite-latest',
    'gemini-3.5-flash-lite',
    'gemini-3.6-flash',
    'gemini-3.1-flash-lite',
    'gemini-flash-latest'
  ].filter(Boolean);

  const prompt = `Documentation Topic / Page Title: ${fallbackTitle}\n\nDocumentation Content:\n${rawText.slice(0, 35000)}`;

  let lastError;
  for (const modelName of modelsToTry) {
    // Try up to 2 attempts per model for transient 503 / rate limits
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        console.log(`[CourseIT] Calling Gemini (${modelName}, attempt ${attempt})...`);
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
        const usage = result.response.usageMetadata ? {
          promptTokens: result.response.usageMetadata.promptTokenCount || 0,
          candidateTokens: result.response.usageMetadata.candidatesTokenCount || 0,
          totalTokens: result.response.usageMetadata.totalTokenCount || 0,
          model: modelName
        } : {
          promptTokens: Math.round(prompt.length / 4),
          candidateTokens: Math.round(responseText.length / 4),
          totalTokens: Math.round((prompt.length + responseText.length) / 4),
          model: modelName
        };
        const parsed = parseAndValidateSteps(responseText, fallbackTitle);
        const isFallback = Boolean(customModel && modelName !== customModel);
        const fallbackNotice = isFallback
          ? `${customModel} was temporarily busy — used ${modelName} for this result instead.`
          : null;
        return {
          ...parsed,
          usage,
          actualModel: modelName,
          requestedModel: customModel || modelName,
          isFallback,
          fallbackNotice
        };
      } catch (err) {
        lastError = err;
        const msg = err.message || '';
        const is503Or429 = msg.includes('503') || msg.includes('429') || msg.includes('high demand') || msg.includes('Service Unavailable');
        
        if (is503Or429 && attempt === 1) {
          console.warn(`[CourseIT] Model ${modelName} encountered temporary load (503). Retrying in 1.5s...`);
          await sleep(1500);
          continue;
        }

        console.warn(`[CourseIT] Model ${modelName} failed (${msg.slice(0, 80)}). Moving to next candidate...`);
        break; // Move to next model
      }
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
  const usage = data.usage ? {
    promptTokens: data.usage.prompt_tokens || 0,
    candidateTokens: data.usage.completion_tokens || 0,
    totalTokens: data.usage.total_tokens || 0,
    model
  } : null;
  const parsed = parseAndValidateSteps(content, fallbackTitle);
  return { ...parsed, usage };
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
  const overview = parsed.overview || '';
  const recommendedNextStep = parsed.recommended_next_step || '';
  const rawSteps = Array.isArray(parsed.steps) ? parsed.steps : (Array.isArray(parsed) ? parsed : []);

  if (!rawSteps.length) {
    throw new Error('LLM did not return any learning steps.');
  }

  const formattedSteps = rawSteps.map((step, idx) => ({
    step_number: step.step_number || (idx + 1),
    title: step.title || `Step ${idx + 1}`,
    time_estimate: step.time_estimate || '~5 min',
    summary: step.summary || (typeof step === 'string' ? step : ''),
    implementation: step.implementation || '',
    code_snippet: step.code_snippet || null,
    pro_tip: step.pro_tip || ''
  }));

  return {
    title,
    overview,
    recommended_next_step: recommendedNextStep,
    steps: formattedSteps
  };
}
