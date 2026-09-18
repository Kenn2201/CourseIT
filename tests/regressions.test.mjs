import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const temporary = await mkdtemp(path.join(os.tmpdir(), 'courseit-tests-'));
for (const key of Object.keys(process.env)) {
  if (/^(APPWRITE_|VITE_APPWRITE_|NETLIFY|AWS_LAMBDA_|VITE_MAINTENANCE|RESEND_)/.test(key)) delete process.env[key];
}
Object.assign(process.env, { COURSEIT_DATA_DIR: temporary, APPWRITE_ENDPOINT: 'https://auth.test/v1',
  APPWRITE_PROJECT_ID: 'test-project', ADMIN_EMAIL: 'admin@example.test', LLM_API_KEY: 'test-only', LLM_PROVIDER: 'gemini' });
let providerCalls = 0;
let providerFailure = false;
const originalFetch = globalThis.fetch;
globalThis.fetch = async (input, options = {}) => {
  const url = typeof input === 'string' ? input : input.url || String(input);
  if (url.startsWith('https://auth.test/v1/account')) {
    const jwt = new Headers(options.headers || input.headers).get('x-appwrite-jwt');
    if (['admin', 'author'].includes(jwt)) return Response.json({ $id: jwt, email: jwt + '@example.test', name: jwt });
    return Response.json({ message: 'Invalid session', code: 401 }, { status: 401 });
  }
  if (url.includes('generativelanguage.googleapis.com')) {
    providerCalls++;
    if (providerFailure) return Response.json({ error: { message: 'Service Unavailable', code: 503 } }, { status: 503 });
    const course = { title: 'Test generated course', steps: [{ title: 'Build a test', summary: 'Run the test.' }] };
    return Response.json({ candidates: [{ content: { role: 'model', parts: [{ text: JSON.stringify(course) }] }, finishReason: 'STOP' }],
      usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 20, totalTokenCount: 30 } });
  }
  if (url === 'https://docs.test/guide') return new Response('<html><head><title>Example docs</title></head><body><article><h1>Build a test</h1><p>Install the package, create a test file and run the test command to check your application. These instructions provide enough text for extraction.</p></article></body></html>');
  throw new Error('Unexpected external request: ' + url);
};
after(async () => { globalThis.fetch = originalFetch; await rm(temporary, { recursive: true, force: true }); });
const { handler } = await import('../server/api.js');
const { writeState, readState, updateState } = await import('../server/state.js');
const { listCatalog, readCourse, cleanupGuestCourses, publishCourse, listDocumentsAll } = await import('../server/catalog.js');
const { getUserQuota, topUpUserCredits, deductCredit, getCreditHistory, processDocumentText, processDocumentationUrl, listAllUsers } = await import('../server/handler.js');
const { normalizeCourse, canReadCourse } = await import('../shared/courses.js');
const { readApiResponse } = await import('../src/lib/api.js');
const api = (route, method = 'GET', body, token) => handler({ path: '/api' + route, httpMethod: method,
  body: body ? JSON.stringify(body) : '', queryStringParameters: {}, headers: token ? { 'x-appwrite-jwt': token } : {} });
const fixture = (id, extra = {}) => normalizeCourse({ $id: id, title: 'Course', steps: [],
  $createdAt: new Date().toISOString(), creator_id: 'author', creator_email: 'private@example.test', ...extra });

test('legacy account courses stay private even with course_ IDs', () => {
  const course = normalizeCourse({ $id: 'course_legacy', steps: JSON.stringify({ creator_id: 'author', items: [] }) });
  assert.equal(course.visibility, 'private');
  assert.equal(canReadCourse(course), false);
});
test('public guest course is readable in an independent request without author email', async () => {
  await writeState('courses/guest', fixture('guest', { is_guest: true, creator_id: 'public_guest' }));
  const result = await api('/courses/guest');
  assert.equal(result.statusCode, 200);
  assert.equal(JSON.parse(result.body).course.creator_email, undefined);
  assert.ok((await listCatalog()).some(c => c.$id === 'guest'));
});
test('private course requires author or admin and is absent from public catalog', async () => {
  await writeState('courses/private', fixture('private'));
  assert.equal((await api('/courses/private')).statusCode, 401);
  assert.equal((await api('/courses/private', 'GET', undefined, 'author')).statusCode, 200);
  assert.ok(!(await listCatalog()).some(c => c.$id === 'private'));
  await assert.rejects(readCourse('private', { userId: 'other' }), { status: 403 });
});
test('explicit author publishing grants guest access', async () => {
  await assert.rejects(publishCourse('private', { userId: 'other' }), { status: 403 });
  await publishCourse('private', { userId: 'author' });
  assert.equal((await api('/courses/private')).statusCode, 200);
});
test('30-minute expiry blocks reads; cleanup preserves active and account courses', async () => {
  await writeState('courses/expired', fixture('expired', { is_guest: true, creator_id: 'public_guest', $createdAt: new Date(Date.now() - 1800001).toISOString() }));
  assert.equal((await api('/courses/expired')).statusCode, 410);
  assert.ok(!(await listCatalog()).some(c => c.$id === 'expired'));
  assert.equal(await cleanupGuestCourses(), 1);
  assert.equal(await readState('courses/expired'), null);
  assert.ok(await readState('courses/guest'));
  assert.ok(await readState('courses/private'));
});
test('persistent maintenance is admin-only and blocks generation before AI calls', async () => {
  assert.equal((await api('/maintenance')).statusCode, 200);
  assert.equal((await api('/maintenance', 'POST', { enabled: true })).statusCode, 403);
  assert.equal((await api('/maintenance', 'POST', { enabled: true }, 'admin')).statusCode, 200);
  assert.equal(JSON.parse((await api('/maintenance')).body).enabled, true);
  const before = providerCalls;
  assert.equal((await api('/summarize-text', 'POST', { text: 'Example text' })).statusCode, 503);
  assert.equal(providerCalls, before);
  await api('/maintenance', 'POST', { enabled: false }, 'admin');
});
test('forged identity cannot read history, delete or grant admin rights', async () => {
  assert.equal((await api('/admin/users', 'GET', { isAdmin: true })).statusCode, 403);
  assert.equal((await api('/user/history')).statusCode, 401);
  assert.equal((await api('/courses/delete', 'POST', { courseId: 'private', userId: 'author', userEmail: 'admin@example.test' })).statusCode, 401);
  assert.equal((await api('/summarize-text', 'POST', { text: 'Example', userId: 'author' })).statusCode, 401);
});
test('account/top-up survive independent reads with fractional balance and history', async () => {
  assert.equal((await getUserQuota('author', 'author@example.test', 'Author')).status, 'pending');
  await topUpUserCredits('author', 1.5);
  assert.equal((await getUserQuota('author')).quota_remaining, 1.5);
  assert.equal((await getCreditHistory('author'))[0].credits, 1.5);
  assert.ok((await listAllUsers()).some(u => u.user_id === 'author'));
  assert.ok(!(await listAllUsers()).some(u => u.user_id === 'user_yopmail_kenn_2026'));
});
test('concurrent deductions cannot overspend fractional credits', async () => {
  await updateState('users/author', u => ({ ...u, status: 'approved', quota_remaining: 0.5 }));
  const results = await Promise.allSettled([deductCredit('author'), deductCredit('author')]);
  assert.equal(results.filter(r => r.status === 'fulfilled').length, 1);
  assert.equal((await readState('users/author')).quota_remaining, 0);
});
test('exhausted account fails before provider call', async () => {
  const before = providerCalls;
  await assert.rejects(processDocumentText({ text: 'Example source', userId: 'author' }), { status: 402 });
  assert.equal(providerCalls, before);
});
test('same URL produces distinct persisted guest courses; quota is shared', async () => {
  await writeState('settings/guest-quota', { lastReset: Date.now(), totalGenerations: 0 });
  const first = await processDocumentationUrl('https://docs.test/guide');
  const second = await processDocumentationUrl('https://docs.test/guide');
  assert.notEqual(first.course.$id, second.course.$id);
  assert.equal(second.quota.remaining, 1);
  assert.equal((await readCourse(first.course.$id)).visibility, 'public');
  assert.ok((await listCatalog()).some(c => c.$id === second.course.$id));
});
test('account OCR defaults private and records token and credit history', async () => {
  await topUpUserCredits('author', 2);
  const result = await processDocumentText({ title: 'Notes', text: 'Example source', userId: 'author', userEmail: 'author@example.test' });
  assert.equal(result.course.visibility, 'private');
  assert.equal(result.quota.remaining, 1.5);
  assert.ok((await getCreditHistory('author')).some(h => h.courseId === result.course.$id && h.credits === -0.5 && h.totalTokens === 30));
});
test('provider failure has a useful error and does not charge credits', async () => {
  providerFailure = true;
  try {
    const before = (await readState('users/author')).quota_remaining;
    const result = await api('/summarize-text', 'POST', { text: 'Example', userId: 'author' }, 'author');
    assert.equal(result.statusCode, 503);
    assert.match(JSON.parse(result.body).error, /temporarily unavailable/);
    assert.equal((await readState('users/author')).quota_remaining, before);
  } finally { providerFailure = false; }
});
test('HTML gateway failures show actionable errors instead of JSON errors', async () => {
  await assert.rejects(readApiResponse(new Response('<html>Bad gateway</html>', { status: 502 })), /Flash Lite/);
});
test('Appwrite catalog pagination returns every page', async () => {
  let calls = 0;
  const db = { listDocuments: async () => ({ documents: calls++ === 0 ? Array.from({ length: 100 }, (_, i) => ({ $id: String(i) })) : [{ $id: 'last' }] }) };
  assert.equal((await listDocumentsAll(db, 'db', 'courses')).length, 101);
  assert.equal(calls, 2);
});
test('maintenance env override cannot report a successful disable', async () => {
  process.env.VITE_MAINTENANCE_MODE = 'true';
  try { assert.equal((await api('/maintenance', 'POST', { enabled: false }, 'admin')).statusCode, 409); }
  finally { delete process.env.VITE_MAINTENANCE_MODE; }
});

test('modern Netlify entrypoints preserve routing, responses and auth', async () => {
  const { default: entrypoint } = await import('../netlify/functions/api.js');
  for (const route of ['/api/maintenance', '/.netlify/functions/api/maintenance']) {
    const response = await entrypoint(new Request('https://courseit.test' + route));
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.equal((await response.json()).enabled, false);
  }
  const { default: summarize } = await import('../netlify/functions/summarize.js');
  const response = await summarize(new Request('https://courseit.test/.netlify/functions/summarize', {
    method: 'POST', body: JSON.stringify({ url: 'https://docs.test/guide', userId: 'author' })
  }));
  assert.equal(response.status, 401);
});
