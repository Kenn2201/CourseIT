export function apiError(error) {
  const message = error?.message || '';
  let status = error.status || (Number.isInteger(error.code) ? error.code : 500);
  let userMessage = message;
  if (error.name === 'TimeoutError' || error.name === 'AbortError' || /timeout|timed out|aborted/i.test(message)) {
    status = 504;
    userMessage = 'The AI job timed out. Retry with Flash Lite or a shorter document.';
  } else if (/429|rate limit|RESOURCE_EXHAUSTED/i.test(message)) {
    status = 429;
    userMessage = 'The AI provider is at its request limit. Wait 60 seconds before retrying.';
  } else if (/LLM_API_KEY|API.key|401.*Google|403.*Google/i.test(message)) {
    status = 503;
    userMessage = 'The AI service credentials need attention. An administrator must check the server configuration.';
  } else if (/503|high demand|Service Unavailable/i.test(message)) {
    status = 503;
    userMessage = 'The AI provider is temporarily unavailable. Wait 30 seconds and retry.';
  } else if (/structured JSON|learning steps/i.test(message)) {
    status = 502;
    userMessage = 'The AI returned an incomplete course. Retry with a shorter source.';
  } else if (/Failed to fetch documentation|extract meaningful/i.test(message)) {
    status = 422;
    userMessage = 'The source page could not be read. Check the link or upload its text instead.';
  } else if (status >= 500) {
    userMessage = 'The service could not complete this request. Please retry; contact the administrator if it continues.';
  }
  return { status, body: { success: false, error: userMessage, retryable: [429, 502, 503, 504].includes(status) } };
}
