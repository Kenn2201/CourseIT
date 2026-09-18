import { createHash, randomUUID } from 'node:crypto';
import { readState, updateState } from './state.js';
import { readCourse } from './catalog.js';
import { apiError } from './errors.js';
import { captureUnexpectedError } from './observability.js';

const JOB_TTL_MS = 24 * 60 * 60 * 1000;
const STALE_MS = 2 * 60 * 1000;
const STAGES = new Set(['Preparing request', 'Inspecting source', 'Extracting documentation',
  'Generating with Gemini', 'Saving course', 'Recording usage', 'Complete']);
const keyFor = id => `generation-jobs/${id}`;

export function validGenerationId(id) {
  return typeof id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
}

function view(job) {
  const retryAfterSeconds = job.retryAt ? Math.max(0, Math.ceil((job.retryAt - Date.now()) / 1000)) : null;
  return { requestId: job.id, state: job.state, stage: job.stage, events: job.events || [],
    startedAt: job.startedAt, updatedAt: job.updatedAt,
    ...(job.code ? { code: job.code } : {}), ...(job.error ? { error: job.error } : {}),
    ...(retryAfterSeconds !== null ? { retryAfterSeconds } : {}) };
}

export async function getGenerationJob(id, actor, session = null) {
  if (!validGenerationId(id)) return { status: 400, body: { error: 'Invalid generation request ID.' } };
  const job = await readState(keyFor(id));
  if (!job || Date.now() - job.startedAt > JOB_TTL_MS) return { status: 404, body: { error: 'Generation request not found.' } };
  if (job.actor !== actor) return { status: 403, body: { error: 'This generation belongs to another account.' } };
  if (job.state === 'running' && Date.now() - job.updatedAt > STALE_MS) {
    return { status: 409, body: { ...view(job), state: 'uncertain', code: 'GENERATION_UNKNOWN',
      error: 'The request stopped reporting progress. Check your course history before starting another generation.' } };
  }
  if (job.state === 'succeeded') {
    try {
      const course = await readCourse(job.courseId, session);
      return { status: 200, body: { success: true, ...view(job),
        result: { course, quota: job.quota, fallbackNotice: job.fallbackNotice } } };
    } catch {
      return { status: 409, body: { ...view(job), code: 'GENERATION_UNKNOWN',
        error: 'The generation record exists, but its course is unavailable. Contact an administrator.' } };
    }
  }
  return { status: 200, body: { success: true, ...view(job) } };
}

export async function runGenerationJob({ id = randomUUID(), actor, payload, session, work }) {
  if (!validGenerationId(id)) return { status: 400, body: { error: 'Invalid generation request ID.' } };
  const digest = createHash('sha256').update(JSON.stringify(payload)).digest('hex');
  let decision = 'start';
  let job;
  const now = Date.now();
  job = await updateState(keyFor(id), current => {
    if (current) {
      if (current.actor !== actor || current.digest !== digest) { decision = 'conflict'; return current; }
      if (current.state === 'succeeded') { decision = 'complete'; return current; }
      if (current.state === 'running') { decision = 'running'; return current; }
      if (current.state === 'failed' && current.retryAllowed && (!current.retryAt || current.retryAt <= now)) {
        decision = 'start';
        return { ...current, state: 'running', stage: 'Preparing request', updatedAt: now,
          events: [{ stage: 'Preparing request', at: new Date(now).toISOString() }],
          error: null, code: null, retryAt: null, retryAllowed: false };
      }
      decision = 'failed';
      return current;
    }
    return { id, actor, digest, state: 'running', stage: 'Preparing request', startedAt: now, updatedAt: now,
      events: [{ stage: 'Preparing request', at: new Date(now).toISOString() }] };
  });
  if (decision === 'conflict') return { status: 409, body: { error: 'Generation request ID was already used for different input.' } };
  if (decision === 'running') return { status: 202, body: { success: true, ...view(job) } };
  if (decision === 'complete') {
    const previous = await getGenerationJob(id, actor, session);
    return previous.body.result ? { status: 200, body: { success: true, requestId: id, ...previous.body.result } } : previous;
  }
  if (decision === 'failed') return { status: job.code === 'RATE_LIMITED' ? 429 : 409,
    body: { success: false, ...view(job), retryable: Boolean(job.retryAllowed) } };

  const onStage = async stage => {
    if (!STAGES.has(stage)) throw new Error('Invalid generation stage.');
    job = await updateState(keyFor(id), current => ({ ...current, stage, updatedAt: Date.now(),
      events: [...(current.events || []), { stage, at: new Date().toISOString() }] }));
  };
  try {
    const result = await work(onStage, id);
    await updateState(keyFor(id), current => ({ ...current, state: 'succeeded', stage: 'Complete',
      updatedAt: Date.now(), events: [...(current.events || []), { stage: 'Complete', at: new Date().toISOString() }],
      courseId: result.course.$id, quota: result.quota, fallbackNotice: result.fallbackNotice }));
    return { status: 200, body: { success: true, requestId: id, ...result } };
  } catch (error) {
    const failure = apiError(error);
    console.warn('[CourseIT generation status]', { requestId: id, stage: job?.stage || 'unknown',
      status: failure.status, code: failure.body.code || 'GENERATION_FAILED' });
    if (failure.status >= 500 && !['PROVIDER_TIMEOUT', 'PROVIDER_UNAVAILABLE'].includes(failure.body.code)) {
      await captureUnexpectedError(error, { requestId: id, stage: job?.stage || 'unknown' });
    }
    const retryAllowed = ['RATE_LIMITED', 'PROVIDER_TIMEOUT', 'PROVIDER_UNAVAILABLE'].includes(failure.body.code);
    const retryAt = retryAllowed ? Date.now() + (failure.body.retryAfterSeconds || 0) * 1000 : null;
    await updateState(keyFor(id), current => ({ ...current, state: 'failed', updatedAt: Date.now(),
      code: failure.body.code || 'GENERATION_FAILED', error: failure.body.error, retryAllowed, retryAt }));
    return { status: failure.status, body: { ...failure.body, requestId: id } };
  }
}
