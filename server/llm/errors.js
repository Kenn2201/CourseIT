export class LLMError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = options.name || 'LLMError';
    this.status = Number(options.status || options.statusCode || 500);
    this.provider = options.provider ?? true;
    if (options.code) this.code = options.code;
    if (options.safeCode) this.safeCode = options.safeCode;
    if (options.headers) this.headers = options.headers;
    if (options.retryAfter) this.retryAfter = options.retryAfter;
    if (options.retryDelay) this.retryDelay = options.retryDelay;
    if (options.errorDetails) this.errorDetails = options.errorDetails;
    if (options.actualModel) this.actualModel = options.actualModel;
    if (options.response) this.response = options.response;
  }
}

import { SYSTEM_INSTRUCTION_V2 } from './prompts.js';
import { parseAndValidateStepsV2 } from '../courseSchema.js';

export const SYSTEM_INSTRUCTION = SYSTEM_INSTRUCTION_V2;
export const parseAndValidateSteps = parseAndValidateStepsV2;


/**
 * Identifies errors that must NOT trigger fallback:
 * - 400 Bad Request
 * - 401 Unauthorized / Invalid API Key
 * - 403 Forbidden
 * - 422 Unprocessable Entity / Invalid input
 */
export function isNonRetryableError(error) {
  const status = Number(error?.status || error?.statusCode || error?.code);
  if ([400, 401, 403, 422].includes(status)) return true;
  const msg = String(error?.message || '');
  if (/API_KEY_INVALID|invalid.*(key|auth|token|credential)|unauthorized|forbidden|bad request|invalid argument|invalid input/i.test(msg)) {
    return true;
  }
  return false;
}

/**
 * Identifies errors that are transient and SHOULD trigger fallback:
 * - 429 Rate Limit / Quota Exhaustion
 * - 408 / 504 Timeout
 * - 500, 502, 503 Temporary Server Errors
 * - TimeoutError / AbortError
 */
export function isTransientError(error) {
  if (isNonRetryableError(error)) return false;
  const status = Number(error?.status || error?.statusCode || error?.code);
  if (status === 429) return true;
  if (status >= 500 && status <= 599) return true;
  if (status === 408) return true;
  if (['TimeoutError', 'AbortError'].includes(error?.name)) return true;
  const msg = String(error?.message || '');
  if (/RESOURCE_EXHAUSTED|rate limit|timed out|timeout|service unavailable|temporarily unavailable|overloaded|busy/i.test(msg)) {
    return true;
  }
  return false;
}

export const isTransientProviderError = isTransientError;

/**
 * Helper to execute OpenAI-compatible completions for Cerebras, Groq, Mistral, OpenRouter.
 */
export async function callCompatibleProvider({
  rawText,
  fallbackTitle,
  learningTopic = null,
  deadline = Date.now() + 42000,
  name,
  prefix,
  endpoint,
  model,
  key,
  sourceLimit = 35000,
  outputLimit = 3500,
  useMaxCompletionTokens = false
}) {
  const remaining = deadline - Date.now();
  if (remaining < 1500) {
    throw new LLMError('AI provider timed out.', { provider: true, status: 504, safeCode: 'PROVIDER_TIMEOUT' });
  }

  const prompt = `Documentation Topic / Page Title: ${fallbackTitle}\nRequested learning focus: ${learningTopic || 'Follow the source page'}\nUse only evidence in the source. If the requested topic is absent, say so.\n\nDocumentation Content:\n${rawText.slice(0, sourceLimit)}`;

  const body = {
    model,
    response_format: { type: 'json_object' },
    temperature: 0.2,
    messages: [
      { role: 'system', content: SYSTEM_INSTRUCTION },
      { role: 'user', content: prompt }
    ]
  };

  if (useMaxCompletionTokens) {
    body.max_completion_tokens = outputLimit;
  } else {
    body.max_tokens = outputLimit;
  }

  let response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      signal: AbortSignal.timeout(Math.min(12000, remaining)),
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`
      },
      body: JSON.stringify(body)
    });
  } catch (error) {
    throw new LLMError(error?.message || 'AI provider request failed.', {
      provider: true,
      status: ['TimeoutError', 'AbortError'].includes(error?.name) ? 504 : 503,
      name: error?.name || 'Error'
    });
  }

  if (!response.ok) {
    let errorData = null;
    try {
      errorData = await response.json();
    } catch {}
    const msg = errorData?.error?.message || errorData?.message || `AI provider rejected the request with status ${response.status}.`;
    throw new LLMError(msg, {
      provider: true,
      status: response.status,
      headers: response.headers
    });
  }

  let data;
  try {
    data = await response.json();
  } catch {
    throw new LLMError('AI provider returned invalid JSON.', { provider: true, status: 502 });
  }

  const content = data.choices?.[0]?.message?.content;
  if (typeof content !== 'string') {
    throw new LLMError('AI provider returned no course content.', { provider: true, status: 502 });
  }

  let parsed;
  try {
    parsed = parseAndValidateSteps(content, fallbackTitle);
  } catch {
    throw new LLMError('AI provider returned an incomplete course.', { provider: true, status: 502 });
  }

  const actualModel = `${prefix || name.toLowerCase()}:${data.model || model}`;
  const usage = data.usage ? {
    promptTokens: data.usage.prompt_tokens || 0,
    candidateTokens: data.usage.completion_tokens || 0,
    totalTokens: data.usage.total_tokens || 0,
    model: actualModel
  } : null;

  return { ...parsed, usage, actualModel };
}
