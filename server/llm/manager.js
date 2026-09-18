import { callGemini } from './providers/gemini.js';
import { callCerebras } from './providers/cerebras.js';
import { callGroq } from './providers/groq.js';
import { callMistral } from './providers/mistral.js';
import { callOpenRouter } from './providers/openrouter.js';
import {
  LLMError,
  isTransientError,
  isTransientProviderError,
  SYSTEM_INSTRUCTION,
  parseAndValidateSteps
} from './errors.js';

export {
  SYSTEM_INSTRUCTION,
  parseAndValidateSteps,
  isTransientError,
  isTransientProviderError,
  LLMError
};

/**
 * Fallback order: Gemini -> Cerebras -> Groq -> Mistral -> OpenRouter
 */
export const PROVIDERS = [
  {
    name: 'Gemini',
    id: 'gemini',
    getKey: () => process.env.GEMINI_API_KEY || process.env.LLM_API_KEY,
    call: callGemini,
    sourceLimit: 35000,
    isPrimary: true
  },
  {
    name: 'Cerebras',
    id: 'cerebras',
    getKey: () => process.env.CEREBRAS_API_KEY,
    call: callCerebras,
    sourceLimit: 35000,
    isPrimary: false
  },
  {
    name: 'Groq',
    id: 'groq',
    getKey: () => process.env.GROQ_API_KEY,
    call: callGroq,
    sourceLimit: 12000,
    isPrimary: false
  },
  {
    name: 'Mistral',
    id: 'mistral',
    getKey: () => process.env.MISTRAL_API_KEY,
    call: callMistral,
    sourceLimit: 35000,
    isPrimary: false
  },
  {
    name: 'OpenRouter',
    id: 'openrouter',
    getKey: () => process.env.OPENROUTER_API_KEY,
    call: callOpenRouter,
    sourceLimit: 35000,
    isPrimary: false
  }
];

/**
 * Calls the configured LLM pipeline to generate structured learning steps from cleaned text.
 * Cascades across providers in order: Gemini -> Cerebras -> Groq -> Mistral -> OpenRouter.
 */
export async function summarizeWithLLM(
  rawText,
  fallbackTitle = 'Documentation Learning Path',
  customModel = null,
  learningTopic = null,
  onProvider = null,
  options = {}
) {
  const providerOverride = (process.env.LLM_PROVIDER || 'gemini').toLowerCase();
  const deadline = Date.now() + 42000;

  if (providerOverride === 'openai') {
    const apiKey = process.env.LLM_API_KEY;
    if (!apiKey) throw new LLMError('LLM_API_KEY is not set. Please provide a server API key.', { status: 401 });
    const { callCompatibleProvider } = await import('./errors.js');
    return callCompatibleProvider({
      rawText,
      fallbackTitle,
      learningTopic,
      deadline,
      name: 'OpenAI',
      prefix: 'openai',
      key: apiKey,
      endpoint: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1/chat/completions',
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      sourceLimit: 35000,
      outputLimit: 3500
    });
  }

  if (providerOverride !== 'gemini') {
    throw new LLMError('Unsupported LLM_PROVIDER. Use gemini or openai.', { status: 400 });
  }

  // Filter providers that have a configured key (skip providers with no API key)
  const availableProviders = PROVIDERS.filter(p => {
    const key = p.getKey();
    return typeof key === 'string' && key.trim().length > 0;
  });

  if (availableProviders.length === 0) {
    throw new LLMError(
      'No AI provider API key is configured. Please provide GEMINI_API_KEY, CEREBRAS_API_KEY, GROQ_API_KEY, MISTRAL_API_KEY, or OPENROUTER_API_KEY.',
      {
        status: 503,
        safeCode: 'PROVIDER_UNAVAILABLE'
      }
    );
  }

  let lastError;

  for (let i = 0; i < availableProviders.length; i++) {
    const provider = availableProviders[i];
    const isPrimary = provider.isPrimary;

    const remaining = deadline - Date.now();
    if (remaining < 1500) {
      const timeoutErr = new LLMError('AI generation timed out.', { status: 504, safeCode: 'PROVIDER_TIMEOUT' });
      throw lastError || timeoutErr;
    }

    try {
      if (!isPrimary) {
        await onProvider?.(`Generating with ${provider.name}`);
      }

      const apiKey = provider.getKey();
      const result = await provider.call({
        rawText,
        fallbackTitle,
        apiKey,
        customModel,
        learningTopic,
        deadline,
        options
      });

      if (isPrimary) {
        return result;
      } else {
        const isFallback = true;
        const fallbackNotice = `Gemini was unavailable; generated with ${provider.name}${
          rawText.length > provider.sourceLimit ? ' using a shorter source excerpt' : ''
        }.`;
        return {
          ...result,
          requestedModel: customModel || 'gemini-flash-lite-latest',
          isFallback,
          fallbackNotice
        };
      }
    } catch (error) {
      lastError = error;
      if (!isPrimary) {
        console.warn('[CourseIT] Fallback provider failed:', provider.name, Number(error.status) || error.name);
      }

      // DO NOT fallback on bad request, invalid input, or auth/config errors
      // Fallback only on 429, timeout, temporary 5xx, or provider unavailable
      if (!isTransientError(error)) {
        throw error;
      }
    }
  }

  throw lastError;
}

export default { summarizeWithLLM, PROVIDERS };
