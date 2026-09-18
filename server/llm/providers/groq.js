import { callCompatibleProvider } from '../errors.js';

/**
 * Calls Groq LPU inference API.
 */
export async function callGroq(options) {
  const apiKey = options.apiKey || process.env.GROQ_API_KEY;
  return callCompatibleProvider({
    ...options,
    name: 'Groq',
    prefix: 'groq',
    endpoint: process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1/chat/completions',
    model: process.env.GROQ_MODEL || 'openai/gpt-oss-20b',
    key: apiKey,
    sourceLimit: 12000,
    outputLimit: 2500,
    useMaxCompletionTokens: true
  });
}

export default callGroq;
