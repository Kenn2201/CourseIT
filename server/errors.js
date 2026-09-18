const boundedRetrySeconds = value => {
  if (typeof value === 'string' && /^\d+(?:\.\d+)?s$/.test(value)) value = Number(value.slice(0, -1));
  else if (typeof value === 'string' && /^\d+(?:\.\d+)?$/.test(value)) value = Number(value);
  else if (typeof value === 'string') {
    const date = Date.parse(value);
    value = Number.isFinite(date) ? (date - Date.now()) / 1000 : NaN;
  }
  return Number.isFinite(value) ? Math.min(3600, Math.max(1, Math.ceil(value))) : null;
};

export function providerRetrySeconds(error) {
  const headers = error?.response?.headers || error?.headers;
  const candidates = [headers?.get?.('retry-after') || headers?.['retry-after'], error?.retryAfter, error?.retryDelay,
    ...(Array.isArray(error?.errorDetails) ? error.errorDetails.map(detail => detail?.retryDelay) : [])];
  const hint = String(error?.message || '').match(/retry(?:\s+in|\s+after)?\s+(\d+(?:\.\d+)?)\s*(?:seconds?|s)\b/i);
  if (hint) candidates.push(hint[1]);
  return candidates.map(boundedRetrySeconds).find(value => value !== null) ?? 60;
}

export function apiError(error) {
  const message = String(error?.message || '');
  let status = Number(error?.status || (Number.isInteger(error?.code) ? error.code : 500));
  if (!Number.isInteger(status) || status < 400 || status > 599) status = 500;
  let code = error?.safeCode || null;
  let userMessage = message;
  let retryAfterSeconds = null;
  const provider = Boolean(error?.provider);
  if ((provider && (status === 429 || /RESOURCE_EXHAUSTED|rate limit/i.test(message))) || code === 'RATE_LIMITED') {
    status = 429;
    code = 'RATE_LIMITED';
    retryAfterSeconds = providerRetrySeconds(error);
    userMessage = 'Gemini temporarily limited this request. Wait for the countdown before retrying.';
  } else if (provider && (status === 408 || status === 504 || /timeout|timed out|aborted/i.test(message) ||
      ['TimeoutError', 'AbortError'].includes(error?.name))) {
    status = 504;
    code = 'PROVIDER_TIMEOUT';
    userMessage = 'The AI provider timed out. Retry with a shorter source or Flash Lite.';
  } else if (provider && (status === 503 || /high demand|Service Unavailable/i.test(message))) {
    status = 503;
    code = 'PROVIDER_UNAVAILABLE';
    retryAfterSeconds = providerRetrySeconds(error);
    userMessage = 'The AI provider is temporarily unavailable. Please retry shortly.';
  } else if (/LLM_API_KEY|API.key|401.*Google|403.*Google/i.test(message)) {
    status = 503;
    code = 'PROVIDER_UNAVAILABLE';
    userMessage = 'The AI service credentials need attention. An administrator must check the server configuration.';
  } else if (/structured JSON|learning steps/i.test(message)) {
    status = 502;
    code = 'GENERATION_FAILED';
    userMessage = 'The AI returned an incomplete course. Retry with a shorter source.';
  } else if (/Failed to fetch documentation|extract meaningful/i.test(message)) {
    status = 422;
    userMessage = 'The source page could not be read. Check the link or upload its text instead.';
  } else if (status >= 500) {
    code ||= 'GENERATION_FAILED';
    userMessage = 'The service could not complete this request. Please retry; contact the administrator if it continues.';
  }
  return { status, body: { success: false, error: userMessage,
    ...(code ? { code } : {}), ...(retryAfterSeconds ? { retryAfterSeconds } : {}),
    retryable: [429, 502, 503, 504].includes(status) } };
}
