/**
 * CourseIT Contextual Technical Tutor Engine
 *
 * Implements context-aware tutoring, token-budgeted prompt construction,
 * source chunk relevance retrieval, credit/quota enforcement,
 * and structured action responses.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { randomUUID } from 'node:crypto';
import { readState, updateState } from './state.js';
import { readCourse } from './catalog.js';
import { getCourseChunks, retrieveRelevantChunks } from './courseChunks.js';
import { PROVIDERS } from './llm/manager.js';
import { isTransientError, LLMError } from './llm/errors.js';

export const TUTOR_CREDIT_COSTS = {
  quick: 0.1,
  normal: 0.25,
  deep: 0.5
};

export const MAX_OUTPUT_TOKENS_BY_MODE = {
  quick: 350,
  normal: 600,
  deep: 1200
};

export const GUEST_TUTOR_DAILY_LIMIT = 15;

/**
 * Executes a single completion across available LLM providers with automatic fallback.
 */
export async function executeTutorCompletion({
  systemInstruction,
  userPrompt,
  maxTokens = 350,
  preferredModel = 'gemini-flash-lite-latest'
}) {
  const geminiKey = process.env.GEMINI_API_KEY || process.env.LLM_API_KEY;

  // Try Gemini first if key available
  if (geminiKey) {
    try {
      const genAI = new GoogleGenerativeAI(geminiKey);
      const model = genAI.getGenerativeModel({
        model: preferredModel || 'gemini-flash-lite-latest',
        systemInstruction,
        generationConfig: {
          maxOutputTokens: maxTokens,
          temperature: 0.2
        }
      }, { timeout: 15000 });

      const result = await model.generateContent(userPrompt);
      const answer = result.response.text();
      const usage = result.response.usageMetadata ? {
        promptTokens: result.response.usageMetadata.promptTokenCount || 0,
        candidateTokens: result.response.usageMetadata.candidatesTokenCount || 0,
        totalTokens: result.response.usageMetadata.totalTokenCount || 0
      } : {
        totalTokens: Math.round((systemInstruction.length + userPrompt.length + answer.length) / 4)
      };

      return { answer, usage, model: preferredModel };
    } catch (err) {
      console.warn('[CourseIT Tutor] Primary Gemini failed, falling back:', err.message);
      if (!isTransientError(err) && err.status === 401) {
        throw new LLMError('Gemini API key is invalid.', { status: 401 });
      }
    }
  }

  // Fallback to OpenAI-compatible secondary providers (Cerebras, Groq, Mistral, OpenRouter)
  const fallbacks = PROVIDERS.filter(p => !p.isPrimary && p.getKey());
  for (const provider of fallbacks) {
    try {
      const key = provider.getKey();
      const endpoint = provider.id === 'cerebras' ? 'https://api.cerebras.ai/v1/chat/completions' :
        provider.id === 'groq' ? 'https://api.groq.com/openai/v1/chat/completions' :
        provider.id === 'mistral' ? 'https://api.mistral.ai/v1/chat/completions' :
        'https://openrouter.ai/api/v1/chat/completions';

      const model = provider.id === 'cerebras' ? 'llama3.1-8b' :
        provider.id === 'groq' ? 'llama-3.3-70b-versatile' :
        provider.id === 'mistral' ? 'mistral-small-latest' :
        'meta-llama/llama-3.1-8b-instruct:free';

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key}`
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemInstruction },
            { role: 'user', content: userPrompt }
          ],
          max_tokens: maxTokens,
          temperature: 0.2
        })
      });

      if (!res.ok) continue;
      const data = await res.json();
      const answer = data.choices?.[0]?.message?.content;
      if (answer) {
        return {
          answer,
          usage: {
            promptTokens: data.usage?.prompt_tokens || 0,
            candidateTokens: data.usage?.completion_tokens || 0,
            totalTokens: data.usage?.total_tokens || 0
          },
          model: `${provider.name} (${model})`
        };
      }
    } catch (e) {
      console.warn('[CourseIT Tutor] Fallback failed:', provider.name, e.message);
    }
  }

  throw new LLMError('Tutor service is temporarily unavailable. Please retry in a few seconds.', {
    status: 503,
    safeCode: 'PROVIDER_UNAVAILABLE'
  });
}

/**
 * Manages guest and user quotas for tutor messages.
 */
export async function enforceAndDeductTutorQuota({ userId, isAdmin, mode = 'quick', courseId }) {
  const cost = TUTOR_CREDIT_COSTS[mode] || 0.1;

  if (userId && userId !== 'public_guest') {
    // Registered account quota
    const user = await updateState('users/' + userId, current => {
      if (!current || (!isAdmin && current.status !== 'approved')) {
        throw Object.assign(new Error('Account approval required to use CourseTutor.'), { status: 403 });
      }
      if (!isAdmin && (current.quota_remaining ?? 0) < cost) {
        throw Object.assign(new Error(`Insufficient credits. Tutor question in ${mode} mode costs ${cost} credits. Please request a top-up.`), { status: 402 });
      }

      const balance = Math.max(0, (current.quota_remaining ?? 0) - cost);
      const event = {
        id: randomUUID(),
        timestamp: new Date().toISOString(),
        type: 'tutor',
        userId,
        courseId,
        mode,
        cost,
        credits: -cost,
        balanceBefore: current.quota_remaining,
        balanceAfter: balance
      };

      return {
        ...current,
        quota_remaining: balance,
        creditHistory: [...(current.creditHistory || []), event]
      };
    });

    return { remaining: user.quota_remaining, cost, deducted: true, isGuest: false };
  }

  // Guest tutor quota (separate from 3-course generation quota)
  const quota = await updateState('settings/guest-tutor-quota', current => {
    const isWithinDay = current && Date.now() - current.lastReset < 86400000;
    const state = isWithinDay ? current : { totalMessages: 0, lastReset: Date.now() };

    if (state.totalMessages >= GUEST_TUTOR_DAILY_LIMIT) {
      throw Object.assign(new Error(`Guest tutor limit reached (${GUEST_TUTOR_DAILY_LIMIT} questions per 24 hours). Sign in to continue asking questions.`), {
        status: 429,
        code: 'GUEST_TUTOR_LIMIT'
      });
    }

    return {
      ...state,
      totalMessages: state.totalMessages + 1
    };
  });

  return {
    remaining: Math.max(0, GUEST_TUTOR_DAILY_LIMIT - quota.totalMessages),
    cost: 0,
    deducted: true,
    isGuest: true
  };
}

/**
 * Handles incoming tutor queries with contextual prompt assembly, source retrieval,
 * and structured response format.
 */
export async function handleTutorQuery({
  courseId,
  stepIndex = 0,
  question = '',
  mode = 'quick',
  recentMessages = [],
  troubleCategory = null,
  errorMessage = null,
  session = null
}) {
  if (!courseId) {
    throw Object.assign(new Error('courseId is required.'), { status: 400 });
  }

  const cleanQuestion = String(question || '').trim();
  const cleanError = String(errorMessage || '').trim();

  if (!cleanQuestion && !cleanError) {
    throw Object.assign(new Error('Question or error message is required.'), { status: 400 });
  }

  // Load course details
  const course = await readCourse(courseId, session);
  const steps = course.steps || [];
  const targetStep = steps[stepIndex] || steps[0] || {};
  const stepNumber = targetStep.step_number || (stepIndex + 1);

  // Guests are restricted to 'quick' mode
  const effectiveMode = !session ? 'quick' : (['quick', 'normal', 'deep'].includes(mode) ? mode : 'quick');
  const maxTokens = MAX_OUTPUT_TOKENS_BY_MODE[effectiveMode] || 350;

  // Retrieve relevant source chunks (max 2 chunks to strictly conserve tokens)
  const allChunks = await getCourseChunks(courseId);
  const retrievedChunks = retrieveRelevantChunks({
    chunks: allChunks,
    stepSourceRefs: targetStep.sourceRefs || [],
    stepTitle: targetStep.title || '',
    stepGoal: targetStep.goal || targetStep.summary || '',
    userQuery: cleanQuestion || cleanError,
    maxChunks: 2
  });

  // Assemble strictly bounded prompt
  const systemInstruction = `You are CourseIT Technical Tutor, an action-first technical assistant helping an engineer on a specific course step.
Strict Rules:
1. Direct, concise, action-first technical answer.
2. NO conversational filler, greetings, or fluff (do NOT say "Hello", "Great question", "Hope this helps").
3. Use numbered implementation steps and exact code/commands where helpful.
4. Response length guideline: ${effectiveMode === 'quick' ? 'Under 150 words' : effectiveMode === 'normal' ? 'Under 250 words' : 'Around 400-500 words with thorough technical explanation'}.
5. When referencing documentation, base your facts on the provided Source Excerpt. If you add general knowledge beyond the source, state so concisely without fabricating citations.`;

  let userPrompt = `[Course Context]
Title: ${course.title}
${course.overview ? `Overview: ${course.overview}\n` : ''}
[Current Step ${stepNumber}: ${targetStep.title}]
Goal: ${targetStep.goal || targetStep.summary || 'Follow step instructions'}
Actions:
${(targetStep.actions || []).map((a, i) => `  ${i + 1}. ${a}`).join('\n') || targetStep.implementation || 'Follow standard checklist'}
${targetStep.expectedResult ? `Expected Result: ${targetStep.expectedResult}\n` : ''}${targetStep.commonMistakes?.length ? `Watch Out: ${targetStep.commonMistakes.join('; ')}\n` : ''}`;

  if (retrievedChunks.length > 0) {
    userPrompt += `\n[Relevant Source Excerpt]\n${retrievedChunks.map(c => `### ${c.heading}\n${c.text.slice(0, 1200)}`).join('\n\n')}\n`;
  }

  // Add recent chat window (max last 6 messages)
  const boundedHistory = (Array.isArray(recentMessages) ? recentMessages.slice(-6) : [])
    .filter(m => m && m.text)
    .map(m => `${m.sender === 'user' ? 'User' : 'Tutor'}: ${m.text.slice(0, 300)}`);

  if (boundedHistory.length > 0) {
    userPrompt += `\n[Recent Conversation]\n${boundedHistory.join('\n')}\n`;
  }

  // Add user query or troubleshooting request
  userPrompt += `\n[Current Question]\n`;
  if (troubleCategory === 'error' && cleanError) {
    userPrompt += `User got an error while executing Step ${stepNumber}:\n\`\`\`\n${cleanError.slice(0, 1500)}\n\`\`\`\n${cleanQuestion ? `Additional question: ${cleanQuestion}\n` : ''}Provide immediate troubleshooting: 1. Diagnosis in 1 sentence, 2. Numbered fix steps, 3. How to verify.`;
  } else {
    userPrompt += `${cleanQuestion || 'Explain this step simply and tell me what to do next.'}`;
  }

  // Quota verification & charge
  const quotaResult = await enforceAndDeductTutorQuota({
    userId: session?.userId || 'public_guest',
    isAdmin: Boolean(session?.isAdmin),
    mode: effectiveMode,
    courseId
  });

  // Call LLM
  const completion = await executeTutorCompletion({
    systemInstruction,
    userPrompt,
    maxTokens,
    preferredModel: 'gemini-flash-lite-latest'
  });

  // Build suggested actions
  const suggestedActions = [];
  let sourceExcerpt = null;
  if (retrievedChunks.length > 0) {
    sourceExcerpt = retrievedChunks[0].text;
    suggestedActions.push({
      type: 'show_source',
      label: `Show source (${retrievedChunks[0].heading})`,
      chunkId: retrievedChunks[0].id
    });
  }

  return {
    success: true,
    answer: completion.answer.trim(),
    sourceRefs: retrievedChunks.map(c => c.id),
    sourceExcerpt,
    suggestedActions,
    usage: {
      mode: effectiveMode,
      cost: quotaResult.cost,
      remaining: quotaResult.remaining,
      isGuest: quotaResult.isGuest
    }
  };
}
