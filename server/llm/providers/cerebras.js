import { callCompatibleProvider } from '../errors.js';

/**
 * Calls Cerebras fast inference API.
 */
export async function callCerebras(options) {
  const apiKey = options.apiKey || process.env.CEREBRAS_API_KEY;
  return callCompatibleProvider({
    ...options,
    name: 'Cerebras',
    prefix: 'cerebras',
    endpoint: process.env.CEREBRAS_BASE_URL || 'https://api.cerebras.ai/v1/chat/completions',
    model: process.env.CEREBRAS_MODEL || 'llama3.1-8b',
    key: apiKey,
    sourceLimit: 35000,
    outputLimit: 3500,
    useMaxCompletionTokens: false
  });
}

export default callCerebras;
