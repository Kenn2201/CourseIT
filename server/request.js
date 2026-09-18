import { handler } from './api.js';

export async function handleApiRequest(request, context, overridePath) {
  const url = new URL(request.url);
  const result = await handler({
    httpMethod: request.method,
    path: overridePath || url.pathname,
    headers: Object.fromEntries(request.headers),
    queryStringParameters: Object.fromEntries(url.searchParams),
    body: await request.text()
  });
  return new Response(result.body, { status: result.statusCode, headers: result.headers });
}
