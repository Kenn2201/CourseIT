import { randomUUID } from 'node:crypto';
import { verifyAppwriteSession } from './handler.js';
import { readCourse } from './catalog.js';
import { updateState } from './state.js';
import { writeSourceFile, readSourceFile, deleteSourceFile } from './sourceStore.js';
import { apiError } from './errors.js';

const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const json = (status, value) => Response.json(value, { status, headers: { 'Cache-Control': 'no-store' } });

function imageType(bytes) {
  if (bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return 'image/png';
  if (bytes.length >= 3 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return 'image/jpeg';
  if (bytes.length >= 12 && bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP') return 'image/webp';
  return null;
}

async function readBoundedImage(request) {
  if (Number(request.headers.get('content-length')) > MAX_IMAGE_BYTES) {
    throw Object.assign(new Error('Image exceeds the 4 MB source-file limit.'), { status: 413 });
  }
  const chunks = [];
  let size = 0;
  for await (const chunk of request.body || []) {
    size += chunk.byteLength;
    if (size > MAX_IMAGE_BYTES) throw Object.assign(new Error('Image exceeds the 4 MB source-file limit.'), { status: 413 });
    chunks.push(Buffer.from(chunk));
  }
  const bytes = Buffer.concat(chunks);
  const mimeType = imageType(bytes);
  if (!mimeType) throw Object.assign(new Error('Upload a PNG, JPEG, or WebP image.'), { status: 415 });
  return { bytes, mimeType };
}

export async function handleCourseSourceRequest(request, courseId) {
  try {
    if (!['GET', 'PUT'].includes(request.method)) return json(405, { error: 'Method not allowed.' });
    if (!/^[a-zA-Z0-9_-]{1,64}$/.test(courseId)) return json(400, { error: 'Invalid course ID.' });
    const jwt = request.headers.get('x-appwrite-jwt') || request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
    if (!jwt) return json(401, { error: 'Sign in to access the original image.' });
    const session = await verifyAppwriteSession(jwt);
    if (!session) return json(401, { error: 'Your session expired. Sign in again.' });
    const course = await readCourse(courseId, session);
    if (!session.isAdmin && course.creator_id !== session.userId) return json(403, { error: 'Only the owner can access the original image.' });
    if (course.source_type !== 'document' || course.is_guest) return json(400, { error: 'This course has no private uploaded source.' });

    if (request.method === 'GET') {
      if (!course.source_file_id) return json(404, { error: 'The original image was not saved for this course.' });
      const bytes = await readSourceFile(course.source_file_id);
      if (!bytes) return json(404, { error: 'The original image is unavailable.' });
      return new Response(bytes, { status: 200, headers: {
        'Content-Type': course.source_mime_type || 'application/octet-stream',
        'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff'
      } });
    }

    if (course.creator_id !== session.userId) return json(403, { error: 'Only the owner can save the original image.' });
    if (course.source_file_id) return json(409, { error: 'An original image is already saved for this course.' });
    const { bytes, mimeType } = await readBoundedImage(request);
    const fileId = randomUUID();
    const filename = (request.headers.get('x-source-filename') || 'source-image').replace(/[\\/\r\n<>]/g, '').slice(0, 120);
    await writeSourceFile(fileId, bytes);
    try {
      await updateState(`courses/${courseId}`, current => {
        if (!current || current.creator_id !== session.userId || current.source_file_id) {
          throw Object.assign(new Error('Course source changed while uploading. Please refresh.'), { status: 409 });
        }
        return { ...current, source_file_id: fileId, source_filename: filename,
          source_mime_type: mimeType, source_file_bytes: bytes.length,
          source_saved_at: new Date().toISOString() };
      });
    } catch (error) {
      await deleteSourceFile(fileId);
      throw error;
    }
    return json(201, { success: true, source: { filename, mimeType, bytes: bytes.length } });
  } catch (error) {
    const failure = apiError(error);
    return json(failure.status, failure.body);
  }
}
