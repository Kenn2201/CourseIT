export async function readApiResponse(response) {
  let data;
  try { data = await response.json(); } catch { data = null; }
  if (!response.ok || data?.success === false || !data) {
    const fallback = {
      401: 'Your session expired. Sign in again.',
      403: 'You do not have permission for this action.',
      429: 'Request limit reached. Wait 60 seconds before retrying.',
      502: 'The generation service did not respond correctly. Wait 30 seconds and retry with Flash Lite.',
      503: 'The service is temporarily unavailable. Please retry in 30 seconds.',
      504: 'The AI job timed out. Try Flash Lite or a shorter document.'
    };
    throw Object.assign(new Error(data?.error || fallback[response.status] || 'The server returned an unexpected response. Please retry.'), { status: response.status });
  }
  return data;
}
