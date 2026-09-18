import { callCompatibleProvider } from '../errors.js';

/**
 * Calls Mistral AI chat completions API.
 */
export async function callMistral(options) {
  const apiKey = options.apiKey || process.env.MISTRAL_API_KEY;
  return callCompatibleProvider({
    ...options,
    name: 'Mistral',
    prefix: 'mistral',
    endpoint: process.env.MISTRAL_BASE_URL || 'https://api.mistral.ai/v1/chat/completions',
    model: process.env.MISTRAL_MODEL || 'mistral-small-latest',
    key: apiKey,
    sourceLimit: 35000,
    outputLimit: 3500,
    useMaxCompletionTokens: false
  });
}

export default callMistral;
