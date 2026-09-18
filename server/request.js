import { handler } from './api.js';
import { handleCourseSourceRequest } from './courseSource.js';

export async function handleApiRequest(request, context, overridePath) {
  const url = new URL(request.url);
  const sourceMatch = url.pathname.match(/(?:\/api|\/\.netlify\/functions\/api)\/courses\/([a-zA-Z0-9_-]{1,64})\/source$/);
  if (sourceMatch) return handleCourseSourceRequest(request, sourceMatch[1]);
  const maxBytes = 128 * 1024;
  if (Number(request.headers.get('content-length')) > maxBytes) {
    return Response.json({ error: 'Request is too large (128 KB limit).' }, { status: 413 });
  }
  let body = '';
  if (request.body) {
    const chunks = [];
    let size = 0;
    for await (const chunk of request.body) {
      size += chunk.byteLength;
      if (size > maxBytes) {
        return Response.json({ error: 'Request is too large (128 KB limit).' }, { status: 413 });
      }
      chunks.push(chunk);
    }
    body = Buffer.concat(chunks.map(chunk => Buffer.from(chunk))).toString('utf8');
  }
  const result = await handler({
    httpMethod: request.method,
    path: overridePath || url.pathname,
    headers: Object.fromEntries(request.headers),
    queryStringParameters: Object.fromEntries(url.searchParams),
    body
  });
  return new Response(result.body, { status: result.statusCode, headers: result.headers });
}
