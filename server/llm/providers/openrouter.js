import { callCompatibleProvider } from '../errors.js';

/**
 * Calls OpenRouter AI chat completions API.
 */
export async function callOpenRouter(options) {
  const apiKey = options.apiKey || process.env.OPENROUTER_API_KEY;
  return callCompatibleProvider({
    ...options,
    name: 'OpenRouter',
    prefix: 'openrouter',
    endpoint: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1/chat/completions',
    model: process.env.OPENROUTER_MODEL || 'openrouter/free',
    key: apiKey,
    sourceLimit: 35000,
    outputLimit: 3500,
    useMaxCompletionTokens: false
  });
}

export default callOpenRouter;
