import fs from 'fs';
import path from 'path';
import os from 'os';
import { Client, Databases, Users, ID, Query, Account as ServerAccount } from 'node-appwrite';
import { Resend } from 'resend';
import { extractDocumentation } from './extract.js';
import { summarizeWithLLM } from './llm.js';
import { randomUUID } from 'node:crypto';
import { readState, writeState, listState, updateState, deleteState } from './state.js';
import { listDocumentsAll, readCourse, courseDatabase, addPublicCourseToFeed, removePublicCourseFromFeed } from './catalog.js';
import { normalizeCourse } from '../shared/courses.js';
import { deleteSourceFile } from './sourceStore.js';

// In serverless / AWS Lambda / Netlify environments, the root file system is read-only.
// Use os.tmpdir() for runtime fallback files.
const isServerless = Boolean(
  process.env.NETLIFY ||
  process.env.AWS_LAMBDA_FUNCTION_NAME ||
  process.env.LAMBDA_TASK_ROOT ||
  process.env.VERCEL
);

const getLocalDataDir = () => {
  if (process.env.COURSEIT_DATA_DIR) return process.env.COURSEIT_DATA_DIR;
  const defaultPath = path.join(process.cwd(), 'server', 'data');
  if (fs.existsSync(defaultPath)) return defaultPath;
  const directPath = path.join(process.cwd(), 'data');
  if (fs.existsSync(directPath)) return directPath;
  return defaultPath;
};

const DATA_DIR = isServerless
  ? path.join(os.tmpdir(), 'courseit_data')
  : getLocalDataDir();

const USERS_QUOTA_FILE = path.join(DATA_DIR, 'users_quota.json');
const FEEDBACK_FILE = path.join(DATA_DIR, 'feedback.json');

// Ensure persistent local fallback data directory exists safely
try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
} catch (e) {
  console.warn('[Storage Notice] Could not create local data directory:', e.message);
}

// 250 credits default trial quota
export const DEFAULT_CREDITS = 250;

export async function getAuthIdentityOverview() {
  const e = process.env;
  const project = e.APPWRITE_PROJECT_ID || e.VITE_APPWRITE_PROJECT_ID;
  const usersKey = e.APPWRITE_USERS_API_KEY || e.APPWRITE_API_KEY;
  if (!usersKey || !project) {
    return { available: false, total: null, users: [],
      reason: !project ? 'Appwrite project ID is missing on the server.' : 'Server-only Appwrite Users API key is missing.' };
  }
  try {
    const client = new Client().setEndpoint(e.APPWRITE_ENDPOINT || e.VITE_APPWRITE_ENDPOINT || 'https://syd.cloud.appwrite.io/v1')
      .setProject(project).setKey(usersKey);
    const usersApi = new Users(client);
    const page = await usersApi.list([Query.limit(100)]);
    let providersByUser = new Map();
    let providerAvailable = false;
    let providerPartial = false;
    try {
      const identities = await usersApi.listIdentities([Query.limit(100)]);
      providerAvailable = true;
      providerPartial = identities.total > identities.identities.length;
      for (const identity of identities.identities) {
        if (!providersByUser.has(identity.userId)) providersByUser.set(identity.userId, new Set());
        providersByUser.get(identity.userId).add(identity.provider);
      }
    } catch { /* Users list still provides an accurate count and verification state. */ }
    return { available: true, total: page.total, users: page.users.map(user => ({
      id: user.$id, email: user.email, name: user.name,
      emailVerification: typeof user.emailVerification === 'boolean' ? user.emailVerification : null,
      providers: providerAvailable ? [...(providersByUser.get(user.$id) || [])] : null,
      createdAt: user.$createdAt
    })), partial: page.total > page.users.length, providerAvailable, providerPartial };
  } catch (error) {
    if ([401, 403].includes(error.code)) {
      return { available: false, total: null, users: [], reason: 'Appwrite rejected the server Users API key. Check project/endpoint and users.read scope in Netlify or Doppler.' };
    }
    throw error;
  }
}
export const ADMIN_EMAIL = process.env.ADMIN_EMAIL || process.env.VITE_ADMIN_EMAIL || 'kenn.nacario12@gmail.com';

/**
 * Universally re-verifies the requester's session identity server-side via Appwrite JWT.
 * Returns verified session object { userId, userEmail, userName, isAdmin } or null.
 */
export async function verifyAppwriteSession(jwt) {
  if (!jwt) return null;
  const endpoint = process.env.APPWRITE_ENDPOINT || process.env.VITE_APPWRITE_ENDPOINT;
  const projectId = process.env.APPWRITE_PROJECT_ID || process.env.VITE_APPWRITE_PROJECT_ID;

  if (!endpoint || !projectId) return null;

  try {
    const client = new Client()
      .setEndpoint(endpoint)
      .setProject(projectId)
      .setJWT(jwt);

    const account = new ServerAccount(client);
    const user = await Promise.race([
      account.get(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Appwrite JWT session verification timeout')), 3500))
    ]);

    if (!user || !user.$id) return null;

    const isAdmin = Boolean(ADMIN_EMAIL && user.email && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase());

    return {
      userId: user.$id,
      userEmail: user.email,
      userName: user.name || user.email.split('@')[0],
      isAdmin
    };
  } catch (err) {
    const isGuest = err.message && (err.message.includes('guests') || err.message.includes('missing scopes'));
    if (!isGuest) {
      console.warn('Appwrite JWT session verification notice:', err.message);
    }
    return null;
  }
}

export async function recordTokenUsage({ userId, model, usage, courseTitle, cost = 0, balance = null, courseId }) {
  const entry = {
    id: randomUUID(), timestamp: new Date().toISOString(), type: 'generation',
    userId: userId || 'public_guest', model, courseTitle, courseId,
    promptTokens: usage?.promptTokens || 0, candidateTokens: usage?.candidateTokens || 0,
    totalTokens: usage?.totalTokens || 0, credits: -cost, balance
  };
  await writeState('usage/' + entry.id, entry);
  return entry;
}

export async function getTokenMetrics(userId = null) {
  const [users, usage, guestQuota] = await Promise.all([
    userId ? [await readState('users/' + userId)] : listState('users/'),
    listState('usage/'),
    !userId || userId === 'public_guest' ? readState('settings/guest-quota') : null
  ]);
  const records = users.filter(Boolean);
  const identities = new Map(records.map(record => [record.user_id, {
    displayName: record.name || record.email || record.user_id,
    email: record.email || null
  }]));
  const creditHistory = [...records.flatMap(record => record.creditHistory || []),
    ...(guestQuota?.generationHistory || [])]
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  const usageEntries = usage.filter(entry => !userId || entry.userId === userId);
  const usageByCourse = new Map(usageEntries.filter(entry => entry.courseId).map(entry => [entry.courseId, entry]));
  const chargedCourses = new Set();
  const chargedEntries = creditHistory.filter(entry => entry.type === 'generation').map(entry => {
    if (entry.courseId) chargedCourses.add(entry.courseId);
    const supplement = usageByCourse.get(entry.courseId);
    return { ...supplement, ...entry,
      promptTokens: entry.promptTokens ?? supplement?.promptTokens ?? null,
      candidateTokens: entry.candidateTokens ?? supplement?.candidateTokens ?? null,
      totalTokens: entry.totalTokens ?? supplement?.totalTokens ?? null,
      credits: entry.credits ?? supplement?.credits ?? 0,
      ledgerSource: 'credit-transaction' };
  });
  const unmatchedUsage = usageEntries.filter(entry => !entry.courseId || !chargedCourses.has(entry.courseId))
    .map(entry => ({ ...entry, ledgerSource: 'usage-only' }));
  const entries = [...chargedEntries, ...unmatchedUsage]
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  const stats = { totalTokens: 0, promptTokens: 0, candidateTokens: 0, totalGenerations: 0,
    creditsUsed: 0, unknownTokenGenerations: 0, unknownBreakdownGenerations: 0,
    perUser: {}, history: entries, creditHistory };
  for (const e of entries) {
    if (Number.isFinite(e.totalTokens)) stats.totalTokens += e.totalTokens;
    else stats.unknownTokenGenerations++;
    if (Number.isFinite(e.promptTokens) && Number.isFinite(e.candidateTokens)) {
      stats.promptTokens += e.promptTokens;
      stats.candidateTokens += e.candidateTokens;
    } else stats.unknownBreakdownGenerations++;
    if (e.type !== 'generation') continue;
    stats.totalGenerations++;
    stats.creditsUsed += Math.max(0, -(e.credits || 0));
    const user = stats.perUser[e.userId] ||= {
      totalTokens: 0, generations: 0, creditsUsed: 0,
      displayName: identities.get(e.userId)?.displayName || (e.userId === 'public_guest' ? 'Guest trial' : e.userId),
      email: identities.get(e.userId)?.email || null
    };
    user.totalTokens += Number(e.totalTokens) || 0;
    user.generations++;
    user.creditsUsed += Math.max(0, -(e.credits || 0));
  }
  return stats;
}

// Model Credit Pricing Tiers
export const MODEL_CREDIT_COSTS = {
  'gemini-flash-lite-latest': 0.5,
  'gemini-3.5-flash-lite': 1.0,
  'gemini-3.6-flash': 2.0,
  'gemini-3.7-flash': 5.0
};

export function getModelCost(modelId) {
  return MODEL_CREDIT_COSTS[modelId] ?? 1.0;
}

function loadLocalUsersQuota() {
  try {
    if (fs.existsSync(USERS_QUOTA_FILE)) {
      const raw = fs.readFileSync(USERS_QUOTA_FILE, 'utf-8');
      return JSON.parse(raw || '{}');
    }
  } catch (err) {
    console.warn('Failed to load local users quota file:', err.message);
  }
  return {};
}

function saveLocalUsersQuota(data) {
  try {
    fs.writeFileSync(USERS_QUOTA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Failed to save local users quota file:', err.message);
  }
}

// Initialize Appwrite Server Client
function getAppwriteDb() {
  const endpoint = process.env.APPWRITE_ENDPOINT || process.env.VITE_APPWRITE_ENDPOINT || 'https://syd.cloud.appwrite.io/v1';
  const projectId = process.env.APPWRITE_PROJECT_ID || process.env.VITE_APPWRITE_PROJECT_ID;
  const apiKey = process.env.APPWRITE_API_KEY;

  if (endpoint && projectId && apiKey) {
    try {
      const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
      return new Databases(client);
    } catch (err) {
      console.warn('Appwrite Server Client initialization warning:', err.message);
    }
  }
  return null;
}

/**
 * Resilient Resend Email Dispatcher
 * Defaults to 'CourseIT <onboarding@resend.dev>' to prevent 403 unverified domain errors
 */
export async function sendEmail({ to, subject, html }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('RESEND_API_KEY is not set');
    return { success: false, error: 'No API key' };
  }

  const resend = new Resend(apiKey);
  const guaranteedSender = 'CourseIT <onboarding@resend.dev>';
  let customSender = process.env.RESEND_FROM_EMAIL || 'CourseIT <hello@courseit.kenncode.me>';
  
  // Guard against any stale cached env with old unverified domain
  if (customSender.includes('notifications@kenncode.me')) {
    customSender = 'CourseIT <hello@courseit.kenncode.me>';
  }

  // Try verified custom sender first (hello@courseit.kenncode.me)
  if (customSender && customSender !== guaranteedSender) {
    try {
      const res = await resend.emails.send({ from: customSender, to, subject, html });
      if (!res.error) {
        return { success: true, senderUsed: customSender, data: res.data };
      }
      console.warn(`[Resend] Custom sender (${customSender}) error: ${res.error.message}. Auto-switching to ${guaranteedSender}`);
    } catch (err) {
      console.warn(`[Resend] Custom sender exception, auto-switching to ${guaranteedSender}`);
    }
  }

  try {
    const res = await resend.emails.send({ from: guaranteedSender, to, subject, html });
    if (res.error) {
      return { success: false, error: res.error.message };
    }
    return { success: true, senderUsed: guaranteedSender, data: res.data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);
}

/**
 * Get or initialize user quota record (250 credits default)
 */
export async function getUserQuota(userId, email = '', name = '', verifiedAdmin = false) {
  if (!userId || userId === 'public_guest') {
    const sandbox = await readState('settings/guest-quota');
    const used = sandbox && Date.now() - sandbox.lastReset < 86400000 ? sandbox.totalGenerations : 0;
    const reserved = sandbox && Date.now() - sandbox.lastReset < 86400000
      ? Object.values(activeReservations(sandbox.reservations)).length : 0;
    return { user_id: 'public_guest', quota_remaining: Math.max(0, 3 - used - reserved),
      remaining: Math.max(0, 3 - used - reserved), used, reserved, total: 3, isPublicSandbox: true };
  }
  const key = 'users/' + userId;
  let record = await readState(key);
  if (!record) {
    const db = getAppwriteDb();
    const databaseId = process.env.APPWRITE_DATABASE_ID || process.env.VITE_APPWRITE_DATABASE_ID;
    if (db && databaseId) {
      try {
        const result = await db.listDocuments(databaseId, 'users_quota', [Query.equal('user_id', userId)]);
        record = result.documents[0] || null;
      } catch (error) {
        if (error.code !== 404) throw error;
      }
    }
    record ||= loadLocalUsersQuota()[userId] || {
      user_id: userId, name: name || 'User', email, status: verifiedAdmin ? 'approved' : 'pending',
      quota_remaining: verifiedAdmin ? DEFAULT_CREDITS : 0, $createdAt: new Date().toISOString()
    };
    record = await updateState(key, current => current || record);
  }
  if ((email && record.email !== email) || (name && record.name !== name) ||
      (verifiedAdmin && record.status !== 'approved')) {
    record = await updateState(key, current => ({ ...current,
      email: email || current.email, name: name || current.name,
      status: verifiedAdmin ? 'approved' : current.status }));
  }
  // Credit events already carry token totals; do not scan every user's usage blobs on each quota read.
  const tokensUsed = record.tokens_used ?? (record.creditHistory || []).reduce(
    (sum, event) => sum + (Number(event.totalTokens) || 0), 0
  );
  return { ...record, isAdmin: verifiedAdmin, tokens_used: tokensUsed };
}


/**
 * Register user signup and dispatch signup confirmation email
 */
export async function registerUserSignup(userId, name, email) {
  if (!userId || !email) throw Object.assign(new Error('User ID and email are required.'), { status: 400 });
  const existing = await readState('users/' + userId);
  if (existing) return { user_id: userId, status: 'registered' };
  const record = await getUserQuota(userId, email, name);

  // Send signup request received confirmation via Resend
  if (email && !email.endsWith('@example.com')) {
    await sendEmail({
      to: email,
      subject: 'CourseIT - Access Request Received',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 28px; background: #0b0f19; color: #f1f5f9; border-radius: 16px; border: 1px solid #1e293b;">
          <div style="text-align: center; margin-bottom: 20px;">
            <span style="font-size: 32px;">⚡</span>
            <h1 style="color: #6366f1; font-size: 24px; margin: 8px 0 0;">CourseIT</h1>
          </div>
          <div style="background: #131c2e; padding: 20px; border-radius: 12px; border: 1px solid #1e293b;">
            <h2 style="color: #e2e8f0; font-size: 18px; margin-top: 0;">Access Request Submitted!</h2>
            <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6;">
              Hi <strong>${escapeHtml(name || 'there')}</strong>, your request for <strong>250 CourseIT credits</strong> has been received by our administrator.
            </p>
            <p style="color: #94a3b8; font-size: 13px; line-height: 1.6;">
              You will receive an approval email shortly as soon as your account is verified.
            </p>
          </div>
          <p style="color: #64748b; font-size: 12px; text-align: center; margin-top: 20px;">
            CourseIT &bull; Action-First Learning Engine
          </p>
        </div>
      `
    });
  }

  return record;
}

/**
 * List all users from users_quota for Admin dashboard
 */
export async function listAllUsers() {
  const db = getAppwriteDb();
  const databaseId = process.env.APPWRITE_DATABASE_ID || process.env.VITE_APPWRITE_DATABASE_ID;
  const records = new Map(Object.values(loadLocalUsersQuota()).map(r => [r.user_id, r]));
  if (db && databaseId) {
    try {
      const remote = await listDocumentsAll(db, databaseId, 'users_quota', [Query.orderDesc('$createdAt')]);
      // Preserve distinct auth accounts even when email is blank or shared.
      for (const record of remote) if (record.user_id && !records.has(record.user_id)) records.set(record.user_id, record);
    } catch (error) { if (error.code !== 404) throw error; }
  }
  for (const record of await listState('users/')) records.set(record.user_id, record);
  const courses = courseDatabase();
  if (courses) {
    for (const raw of await listDocumentsAll(courses.db, courses.databaseId, courses.collectionId)) {
      const course = normalizeCourse(raw);
      if (course.creator_id && course.creator_id !== 'public_guest' && course.creator_email && !records.has(course.creator_id)) {
        records.set(course.creator_id, { user_id: course.creator_id, email: course.creator_email,
          name: course.creator_name || 'Recovered course author', status: 'pending', quota_remaining: 0,
          recovered: true, $createdAt: course.$createdAt });
      }
    }
  }
  // No fabricated sample accounts or admin identities.
  return Array.from(records.values()).filter(r => r.user_id && !r.user_id.startsWith('system') &&
    !['admin_master_account', 'user_yopmail_kenn_2026'].includes(r.user_id));
}


/**
 * Approve a user and send approval email via Resend
 */
export async function approveUserAndSendEmail(userId, customEmail = null, credits = DEFAULT_CREDITS) {
  if (!userId || !Number.isFinite(credits) || credits < 0) throw new Error('Invalid approval credit amount.');
  const user = await getUserQuota(userId, customEmail || '');
  const targetEmail = customEmail || user.email;
  const targetName = user.name || 'there';
  if (!targetEmail) throw new Error('User email not found for approval');
  const updated = await updateState('users/' + userId, current => {
    const event = { id: randomUUID(), timestamp: new Date().toISOString(), type: 'approval', userId,
      credits: credits - current.quota_remaining, balance: credits, courseTitle: 'Account approved' };
    return { ...current, email: targetEmail, status: 'approved', quota_remaining: credits,
      creditHistory: [...(current.creditHistory || []), event] };
  });
  const localData = { [userId]: updated };


  // 3. Send Resend approval email
  const emailRes = await sendEmail({
    to: targetEmail,
    subject: 'Your CourseIT account is approved!',
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; background: #0b0f19; color: #f1f5f9; border-radius: 16px; border: 1px solid #1e293b;">
        <div style="text-align: center; margin-bottom: 24px;">
          <span style="font-size: 36px;">⚡</span>
          <h1 style="color: #6366f1; font-size: 26px; margin: 8px 0 0;">CourseIT</h1>
          <p style="color: #94a3b8; font-size: 14px; margin: 4px 0 0;">Action-First Learning Engine</p>
        </div>
        
        <div style="background: #131c2e; padding: 24px; border-radius: 12px; border: 1px solid #1e293b; margin-bottom: 24px;">
          <h2 style="color: #10b981; font-size: 20px; margin-top: 0;">🎉 Your CourseIT account is approved!</h2>
          <p style="font-size: 16px; line-height: 1.6; color: #e2e8f0;">
            Hi <strong>${targetName}</strong>,
          </p>
          <p style="font-size: 15px; line-height: 1.6; color: #cbd5e1;">
            Your CourseIT account is approved! You have <strong>${credits} course credits</strong> ready to use.
          </p>
          <p style="font-size: 14px; line-height: 1.6; color: #94a3b8;">
            Turn any complex documentation URL or scanned tutorial image into step-by-step interactive courses with code snippets and pro tips.
          </p>
        </div>

        <div style="text-align: center; margin-bottom: 28px;">
          <a href="https://courseitai.kenncode.me" style="background: #4f46e5; color: #ffffff; padding: 14px 28px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 15px; display: inline-block;">
            Launch CourseIT Dashboard &rarr;
          </a>
        </div>

        <p style="color: #64748b; font-size: 12px; text-align: center; border-top: 1px solid #1e293b; padding-top: 20px; margin-bottom: 0;">
          Sent by CourseIT &bull; hello@courseit.kenncode.me
        </p>
      </div>
    `
  });

  return {
    success: true,
    user: localData[userId] || { email: targetEmail, status: 'approved', quota_remaining: credits },
    emailSent: emailRes.success,
    senderUsed: emailRes.senderUsed,
    emailError: emailRes.error
  };
}

/**
 * Top up user credits (e.g. +250 credits)
 */
export async function topUpUserCredits(userId, amount = DEFAULT_CREDITS) {
  if (!userId || !Number.isFinite(amount) || amount <= 0) throw new Error('Credit amount must be a positive number.');
  await getUserQuota(userId);
  return updateState('users/' + userId, current => {
    const balance = current.quota_remaining + amount;
    const event = { id: randomUUID(), timestamp: new Date().toISOString(), type: 'topup',
      userId, credits: amount, balance, courseTitle: 'Credit top-up' };
    return { ...current, quota_remaining: balance, creditHistory: [...(current.creditHistory || []), event] };
  });
}


/**
 * Delete a course document from Appwrite & local fallback
 */
/**
 * Delete a course document from Appwrite & local fallback
 * Enforces ownership or admin ACL: starter templates and non-owned courses are rejected with 403 Forbidden.
 */
export async function deleteCourse(courseId, requestingUserId = null, requestingUserEmail = '') {
  const isAdmin = requestingUserEmail.toLowerCase() === ADMIN_EMAIL.toLowerCase();
  const session = { userId: requestingUserId, isAdmin };
  const course = await readCourse(courseId, session);
  if (!requestingUserId || (!isAdmin && course.creator_id !== requestingUserId)) {
    throw Object.assign(new Error('Only the author or administrator can delete this course.'), { status: 403 });
  }
  const isBlobCourse = Boolean(await readState('courses/' + courseId));
  const db = isBlobCourse ? null : getAppwriteDb();
  if (db && !course.is_guest) {
    try { await db.deleteDocument(process.env.APPWRITE_DATABASE_ID || process.env.VITE_APPWRITE_DATABASE_ID,
      process.env.APPWRITE_COLLECTION_ID || process.env.VITE_APPWRITE_COLLECTION_ID, courseId); }
    catch (error) { if (error.code !== 404) throw error; }
  }
  await deleteState('courses/' + courseId);
  await removePublicCourseFromFeed(courseId);
  if (course.source_file_id) {
    try { await deleteSourceFile(course.source_file_id); }
    catch (error) { console.error('Source image cleanup failed:', error.message); }
  }
  return { success: true, deleted: true, courseId };
}



/**
 * Archive user account and send confirmation email via Resend
 */
export async function archiveUserAccount(userId, reason = 'Not specified', feedback = '') {
  const localData = loadLocalUsersQuota();
  const user = await readState('users/' + userId) || localData[userId];

  if (!user) {
    throw new Error('User not found');
  }

  user.status = 'archived';
  user.archive_reason = reason;
  user.archive_feedback = feedback;
  user.archived_at = new Date().toISOString();
  await writeState('users/' + userId, user);

  localData[userId] = user;
  saveLocalUsersQuota(localData);

  const db = getAppwriteDb();
  const databaseId = process.env.APPWRITE_DATABASE_ID || process.env.VITE_APPWRITE_DATABASE_ID;
  if (db && databaseId && user.$id) {
    try {
      await db.updateDocument(databaseId, 'users_quota', user.$id, {
        status: 'archived'
      });
    } catch (err) {
      console.warn('Could not update archived status in Appwrite:', err.message);
    }
  }

  // Send archive confirmation email via Resend
  let emailSent = false;
  if (user.email && !user.email.endsWith('@example.com')) {
    const res = await sendEmail({
      to: user.email,
      subject: 'CourseIT - Your account has been archived',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; background: #0b0f19; color: #f1f5f9; border-radius: 16px; border: 1px solid #1e293b;">
          <div style="text-align: center; margin-bottom: 24px;">
            <span style="font-size: 36px;">⚡</span>
            <h1 style="color: #6366f1; font-size: 26px; margin: 8px 0 0;">CourseIT</h1>
            <p style="color: #94a3b8; font-size: 14px; margin: 4px 0 0;">Action-First Learning Engine</p>
          </div>
          
          <div style="background: #131c2e; padding: 24px; border-radius: 12px; border: 1px solid #1e293b; margin-bottom: 24px;">
            <h2 style="color: #f59e0b; font-size: 20px; margin-top: 0;">Account Archived</h2>
            <p style="font-size: 15px; line-height: 1.6; color: #e2e8f0;">
              Hi <strong>${user.name || 'there'}</strong>,
            </p>
            <p style="font-size: 15px; line-height: 1.6; color: #cbd5e1;">
              We have processed your request to archive your CourseIT account.
            </p>
            <div style="background: #0f172a; padding: 14px 18px; border-radius: 8px; margin: 16px 0; border: 1px solid #1e293b; font-size: 13px; color: #94a3b8;">
              <p style="margin: 0 0 6px 0;"><strong style="color: #cbd5e1;">Reason:</strong> ${reason}</p>
              ${feedback ? `<p style="margin: 0;"><strong style="color: #cbd5e1;">Feedback:</strong> ${feedback}</p>` : ''}
            </div>
            <p style="font-size: 14px; line-height: 1.6; color: #94a3b8;">
              Your saved data and courses remain preserved. If you ever want to reactivate your account, simply sign back in with your credentials or reach out to us at <a href="mailto:hello@courseit.kenncode.me" style="color: #818cf8;">hello@courseit.kenncode.me</a>.
            </p>
          </div>

          <p style="color: #64748b; font-size: 12px; text-align: center; border-top: 1px solid #1e293b; padding-top: 20px; margin-bottom: 0;">
            CourseIT &bull; Action-First Learning Engine &bull; hello@courseit.kenncode.me
          </p>
        </div>
      `
    });
    emailSent = res.success;
  }

  return { success: true, archived: true, emailSent, user };
}

function loadFeedbacks() {
  try {
    if (fs.existsSync(FEEDBACK_FILE)) {
      const raw = fs.readFileSync(FEEDBACK_FILE, 'utf-8');
      return JSON.parse(raw || '[]');
    }
  } catch {}
  return [];
}

function saveFeedbacks(data) {
  try {
    fs.writeFileSync(FEEDBACK_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch {}
}

/**
 * Submit user feedback for beta test
 */
export async function submitUserFeedback({ userId, name, email, rating = 5, category = 'General', message = '', pageUrl = '' }) {
  const feedbacks = await listAllFeedbacks();
  const newFeedback = {
    id: `fb_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    userId: userId || 'anonymous',
    name: name || 'Beta Tester',
    email: email || 'tester@example.com',
    rating: Number(rating) || 5,
    category: category || 'General',
    message: message || '',
    pageUrl: pageUrl || '',
    status: 'new',
    createdAt: new Date().toISOString()
  };

  feedbacks.unshift(newFeedback);
  await writeState('feedback/' + newFeedback.id, newFeedback);

  // Send email alert to admin with beautiful template
  const emailResult = await sendEmail({
    to: ADMIN_EMAIL,
    subject: `[CourseIT Beta Feedback] ${category} (${rating}★) - from ${newFeedback.name}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; background: #070913; color: #f1f5f9; border-radius: 20px; border: 1px solid #1e293b;">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="width: 52px; height: 52px; margin: 0 auto 12px; border-radius: 16px; background: linear-gradient(135deg, #6366f1, #a855f7); display: flex; align-items: center; justify-content: center; line-height: 52px; font-size: 26px;">
            💬
          </div>
          <h2 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 800;">New Beta Tester Feedback</h2>
          <p style="color: #818cf8; font-size: 13px; margin: 6px 0 0;">CourseIT v1.4 BETA Feedback Engine</p>
        </div>

        <div style="background: #0f172a; padding: 22px; border-radius: 14px; border: 1px solid #1e293b; margin-bottom: 20px;">
          <div style="margin-bottom: 12px; border-bottom: 1px solid #1e293b; padding-bottom: 10px; display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 13px; color: #94a3b8;">User: <strong style="color: #f1f5f9;">${escapeHtml(newFeedback.name)}</strong> (${escapeHtml(newFeedback.email)})</span>
            <span style="font-size: 14px; color: #fbbf24; font-weight: bold;">${'★'.repeat(newFeedback.rating)} (${newFeedback.rating}/5)</span>
          </div>
          <p style="margin: 0 0 10px 0; font-size: 13px; color: #a5b4fc;"><strong style="color: #c7d2fe;">Category:</strong> ${escapeHtml(category)}</p>
          <div style="background: #090d16; padding: 16px; border-radius: 10px; border: 1px solid #1e293b; font-size: 14px; line-height: 1.6; color: #e2e8f0; white-space: pre-wrap;">
            ${escapeHtml(message || 'No written message provided.')}
          </div>
          ${pageUrl ? `<p style="margin: 12px 0 0 0; font-size: 12px; color: #64748b; font-family: monospace;">Page: ${escapeHtml(pageUrl)}</p>` : ''}
        </div>

        <div style="text-align: center;">
          <a href="https://courseitai.kenncode.me/admin" style="background: #4f46e5; color: #ffffff; padding: 12px 26px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 13px; display: inline-block;">
            Open Admin Dashboard &rarr;
          </a>
        </div>
      </div>
    `
  });

  return { success: true, feedback: newFeedback, emailSent: emailResult.success };
}

/**
 * List all feedbacks
 */
export async function listAllFeedbacks() {
  const records = new Map(loadFeedbacks().map(f => [f.id, f]));
  for (const entry of await listState('feedback/')) records.set(entry.id, entry);
  return [...records.values()];
}

/**
 * Update feedback status (reviewed, resolved)
 */
export async function updateFeedbackStatus(feedbackId, status = 'reviewed') {
  const feedbacks = await listAllFeedbacks();
  const item = feedbacks.find(f => f.id === feedbackId);
  if (item) {
    item.status = status;
    await writeState('feedback/' + feedbackId, item);
    return { success: true, feedback: item };
  }
  throw new Error('Feedback not found');
}

/**
 * Test all email templates by dispatching to admin email
 */
export async function testAllEmailsToAdmin(adminEmail = ADMIN_EMAIL) {
  const target = adminEmail || ADMIN_EMAIL;
  const results = [];

  // 1. Signup Confirmation
  const r1 = await sendEmail({
    to: target,
    subject: '[TEST 1/5] CourseIT - Access Request Received',
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; background: #070913; color: #f1f5f9; border-radius: 20px; border: 1px solid #1e293b;">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="width: 52px; height: 52px; margin: 0 auto 12px; border-radius: 16px; background: linear-gradient(135deg, #4f46e5, #7c3aed); display: flex; align-items: center; justify-content: center; line-height: 52px; font-size: 26px;">⚡</div>
          <h1 style="color: #ffffff; font-size: 24px; font-weight: 800; margin: 0;">CourseIT <span style="font-size: 12px; color: #818cf8; background: rgba(99, 102, 241, 0.15); border: 1px solid rgba(99, 102, 241, 0.3); padding: 2px 8px; border-radius: 9999px;">BETA</span></h1>
          <p style="color: #94a3b8; font-size: 13px; margin: 6px 0 0;">Action-First Learning Engine for Developers</p>
        </div>
        <div style="background: #0f172a; padding: 24px; border-radius: 14px; border: 1px solid #1e293b; margin-bottom: 24px;">
          <h2 style="color: #38bdf8; font-size: 18px; margin-top: 0;">Access Request Submitted!</h2>
          <p style="font-size: 15px; line-height: 1.6; color: #cbd5e1;">Hi <strong>Kenn</strong>, your request for <strong>250 CourseIT credits</strong> has been received by our administrator.</p>
          <p style="font-size: 14px; line-height: 1.6; color: #94a3b8;">You will receive an approval email shortly as soon as your account is verified.</p>
        </div>
        <p style="color: #64748b; font-size: 12px; text-align: center; border-top: 1px solid #1e293b; padding-top: 20px;">CourseIT &bull; Sent from hello@courseit.kenncode.me</p>
      </div>
    `
  });
  results.push({ template: 'Signup Request', ...r1 });

  // 2. Account Approved
  const r2 = await sendEmail({
    to: target,
    subject: '[TEST 2/5] Your CourseIT account is approved!',
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; background: #070913; color: #f1f5f9; border-radius: 20px; border: 1px solid #1e293b;">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="width: 52px; height: 52px; margin: 0 auto 12px; border-radius: 16px; background: linear-gradient(135deg, #10b981, #059669); display: flex; align-items: center; justify-content: center; line-height: 52px; font-size: 26px;">🎉</div>
          <h1 style="color: #ffffff; font-size: 24px; font-weight: 800; margin: 0;">CourseIT <span style="font-size: 12px; color: #34d399; background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.3); padding: 2px 8px; border-radius: 9999px;">APPROVED</span></h1>
          <p style="color: #94a3b8; font-size: 13px; margin: 6px 0 0;">Action-First Learning Engine</p>
        </div>
        <div style="background: #0f172a; padding: 24px; border-radius: 14px; border: 1px solid #1e293b; margin-bottom: 24px;">
          <h2 style="color: #10b981; font-size: 20px; margin-top: 0;">🎉 Your CourseIT account is approved!</h2>
          <p style="font-size: 15px; line-height: 1.6; color: #cbd5e1;">Hi <strong>Kenn Nacario</strong>, you have <strong>250 course credits</strong> ready to use.</p>
          <p style="font-size: 14px; line-height: 1.6; color: #94a3b8;">Turn any documentation URL or scanned tutorial image into step-by-step interactive courses with code snippets and pro tips.</p>
          <div style="text-align: center; margin-top: 20px;">
            <a href="http://localhost:5173" style="background: #4f46e5; color: #ffffff; padding: 14px 28px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 15px; display: inline-block;">Launch CourseIT Dashboard &rarr;</a>
          </div>
        </div>
        <p style="color: #64748b; font-size: 12px; text-align: center; border-top: 1px solid #1e293b; padding-top: 20px;">CourseIT &bull; Sent from hello@courseit.kenncode.me</p>
      </div>
    `
  });
  results.push({ template: 'Account Approval', ...r2 });

  // 3. Password Reset
  const r3 = await sendEmail({
    to: target,
    subject: '[TEST 3/5] CourseIT - Password Reset Request',
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; background: #070913; color: #f1f5f9; border-radius: 20px; border: 1px solid #1e293b;">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="width: 52px; height: 52px; margin: 0 auto 12px; border-radius: 16px; background: linear-gradient(135deg, #0ea5e9, #6366f1); display: flex; align-items: center; justify-content: center; line-height: 52px; font-size: 26px;">🔑</div>
          <h2 style="color: #ffffff; font-size: 22px; margin: 0;">Reset Your Password</h2>
        </div>
        <div style="background: #0f172a; padding: 24px; border-radius: 14px; border: 1px solid #1e293b; margin-bottom: 24px; text-align: center;">
          <p style="color: #cbd5e1; font-size: 14px; margin-top: 0;">Your one-time security code is:</p>
          <div style="background: #020617; padding: 16px; border-radius: 10px; font-size: 28px; font-weight: 800; letter-spacing: 6px; color: #38bdf8; font-family: monospace; border: 1px solid #38bdf8/40; margin: 16px 0;">
            TEST-8K92
          </div>
          <p style="color: #64748b; font-size: 12px; margin: 0;">Valid for 15 minutes. If you did not request this, please ignore.</p>
        </div>
        <p style="color: #64748b; font-size: 12px; text-align: center; border-top: 1px solid #1e293b; padding-top: 20px;">CourseIT &bull; Sent from hello@courseit.kenncode.me</p>
      </div>
    `
  });
  results.push({ template: 'Password Reset', ...r3 });

  // 4. Account Archived
  const r4 = await sendEmail({
    to: target,
    subject: '[TEST 4/5] CourseIT - Your account has been archived',
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; background: #070913; color: #f1f5f9; border-radius: 20px; border: 1px solid #1e293b;">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="width: 52px; height: 52px; margin: 0 auto 12px; border-radius: 16px; background: linear-gradient(135deg, #f59e0b, #d97706); display: flex; align-items: center; justify-content: center; line-height: 52px; font-size: 26px;">📦</div>
          <h2 style="color: #ffffff; font-size: 22px; margin: 0;">Account Archived</h2>
        </div>
        <div style="background: #0f172a; padding: 24px; border-radius: 14px; border: 1px solid #1e293b; margin-bottom: 24px;">
          <p style="font-size: 15px; line-height: 1.6; color: #cbd5e1;">Hi <strong>Kenn</strong>, your CourseIT account has been archived as requested.</p>
          <div style="background: #020617; padding: 14px 18px; border-radius: 8px; margin: 16px 0; border: 1px solid #1e293b; font-size: 13px; color: #94a3b8;">
            <p style="margin: 0 0 6px 0;"><strong style="color: #cbd5e1;">Reason:</strong> Taking a break</p>
            <p style="margin: 0;"><strong style="color: #cbd5e1;">Feedback:</strong> Love the product, will return soon!</p>
          </div>
          <p style="font-size: 14px; line-height: 1.6; color: #94a3b8;">Your saved courses remain preserved. Reactivate anytime simply by signing back in.</p>
        </div>
        <p style="color: #64748b; font-size: 12px; text-align: center; border-top: 1px solid #1e293b; padding-top: 20px;">CourseIT &bull; Sent from hello@courseit.kenncode.me</p>
      </div>
    `
  });
  results.push({ template: 'Account Archived', ...r4 });

  // 5. Beta Feedback Alert
  const r5 = await sendEmail({
    to: target,
    subject: '[TEST 5/5] [CourseIT Beta Feedback] Feature Request (5★) - from Kenn Beta Tester',
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; background: #070913; color: #f1f5f9; border-radius: 20px; border: 1px solid #1e293b;">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="width: 52px; height: 52px; margin: 0 auto 12px; border-radius: 16px; background: linear-gradient(135deg, #6366f1, #a855f7); display: flex; align-items: center; justify-content: center; line-height: 52px; font-size: 26px;">💬</div>
          <h2 style="color: #ffffff; font-size: 22px; margin: 0;">Beta Tester Feedback</h2>
        </div>
        <div style="background: #0f172a; padding: 22px; border-radius: 14px; border: 1px solid #1e293b; margin-bottom: 20px;">
          <p style="font-size: 13px; color: #94a3b8; margin: 0 0 8px;">From: <strong style="color: #f1f5f9;">Verified Beta Tester</strong> (${target || 'beta@courseit.kenncode.me'})</p>
          <p style="font-size: 13px; color: #a5b4fc; margin: 0 0 12px;"><strong>Category:</strong> Feature Request &bull; <strong>Rating:</strong> ★★★★★ (5/5)</p>
          <div style="background: #020617; padding: 14px; border-radius: 10px; font-size: 14px; color: #e2e8f0; line-height: 1.6;">
            "The action-first breakdown saves so much time! Would love to see an export to markdown button for offline notes."
          </div>
        </div>
        <p style="color: #64748b; font-size: 12px; text-align: center; border-top: 1px solid #1e293b; padding-top: 20px;">CourseIT &bull; Sent from hello@courseit.kenncode.me</p>
      </div>
    `
  });
  results.push({ template: 'Beta Feedback Alert', ...r5 });

  return { success: true, count: results.length, results };
}

/**
 * Send custom announcement or notification to beta testers
 */
export async function sendCustomTesterEmail({ to, subject, message, isBroadcast = false }) {
  if (!subject || !message) {
    throw new Error('Subject and message content are required.');
  }

  const renderHtml = (content) => `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; background: #070913; color: #f1f5f9; border-radius: 20px; border: 1px solid #1e293b;">
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="width: 52px; height: 52px; margin: 0 auto 12px; border-radius: 16px; background: linear-gradient(135deg, #6366f1, #a855f7); display: flex; align-items: center; justify-content: center; line-height: 52px; font-size: 26px;">⚡</div>
        <h2 style="color: #ffffff; font-size: 22px; margin: 0;">CourseIT Beta Announcement</h2>
      </div>
      <div style="background: #0f172a; padding: 24px; border-radius: 14px; border: 1px solid #1e293b; margin-bottom: 24px;">
        <div style="font-size: 15px; line-height: 1.7; color: #cbd5e1; white-space: pre-wrap;">${content}</div>
      </div>
      <div style="text-align: center; margin-bottom: 20px;">
        <a href="https://courseit.kenncode.me" style="display: inline-block; padding: 12px 28px; background: #6366f1; color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 14px;">Open CourseIT App &rarr;</a>
      </div>
      <p style="color: #64748b; font-size: 12px; text-align: center; border-top: 1px solid #1e293b; padding-top: 20px;">CourseIT &bull; Sent from hello@courseit.kenncode.me</p>
    </div>
  `;

  if (isBroadcast) {
    const allUsers = await listAllUsers();
    const approvedTesters = allUsers.filter(u => u.status === 'approved' && u.email && !u.email.endsWith('@example.com'));
    const results = [];
    for (const tester of approvedTesters) {
      try {
        const res = await sendEmail({
          to: tester.email,
          subject,
          html: renderHtml(message)
        });
        results.push({ email: tester.email, success: res.success });
      } catch (err) {
        results.push({ email: tester.email, success: false, error: err.message });
      }
    }
    return { success: true, count: results.length, results };
  } else {
    if (!to) throw new Error('Recipient email is required for direct sending.');
    const result = await sendEmail({
      to,
      subject,
      html: renderHtml(message)
    });
    return { success: result.success, recipient: to, ...result };
  }
}

/**
 * Deduct credits based on selected model tier
 */
export async function checkGenerationQuota(userId, isAdmin, model) {
  if (!(model in MODEL_CREDIT_COSTS)) throw Object.assign(new Error('Select a supported model.'), { status: 400 });
  const quota = await getUserQuota(userId);
  if (quota.isPublicSandbox) {
    if (model !== 'gemini-flash-lite-latest') throw Object.assign(new Error('Sign in to use this model.'), { status: 403 });
    if (!quota.remaining) throw Object.assign(new Error('The shared guest trial is exhausted. Try after the 24-hour reset or sign in.'), { status: 429 });
  } else {
    if (!isAdmin && quota.status !== 'approved') throw Object.assign(new Error('Your account is pending admin approval.'), { status: 403 });
    if (!isAdmin && quota.quota_remaining < getModelCost(model)) throw Object.assign(new Error('Insufficient credits for this model. Request a top-up or choose Flash Lite.'), { status: 402 });
  }
}

const RESERVATION_TTL_MS = 3 * 60 * 1000;
const activeReservations = reservations => Object.fromEntries(
  Object.entries(reservations || {}).filter(([, item]) => item.expiresAt > Date.now())
);

export async function reserveGeneration(userId, isAdmin, model) {
  if (!(model in MODEL_CREDIT_COSTS)) throw Object.assign(new Error('Select a supported model.'), { status: 400 });
  const id = randomUUID();
  const entry = { cost: getModelCost(model), expiresAt: Date.now() + RESERVATION_TTL_MS };
  if (!userId || userId === 'public_guest') {
    if (model !== 'gemini-flash-lite-latest') throw Object.assign(new Error('Sign in to use this model.'), { status: 403 });
    await updateState('settings/guest-quota', current => {
      const state = current && Date.now() - current.lastReset < 86400000
        ? current : { ...current, totalGenerations: 0, lastReset: Date.now(), reservations: {} };
      const reservations = activeReservations(state.reservations);
      if (state.totalGenerations + Object.keys(reservations).length >= 3) {
        throw Object.assign(new Error('The shared guest trial is exhausted. Try after the 24-hour reset or sign in.'), { status: 429 });
      }
      return { ...state, reservations: { ...reservations, [id]: entry } };
    });
    return { id, guest: true };
  }
  await getUserQuota(userId);
  await updateState('users/' + userId, current => {
    if (!current || (!isAdmin && current.status !== 'approved')) {
      throw Object.assign(new Error('Your account is pending admin approval.'), { status: 403 });
    }
    const reservations = activeReservations(current.reservations);
    const reserved = Object.values(reservations).reduce((sum, item) => sum + item.cost, 0);
    if (!isAdmin && current.quota_remaining - reserved < entry.cost) {
      throw Object.assign(new Error('Insufficient credits for this model. Request a top-up or choose Flash Lite.'), { status: 402 });
    }
    return { ...current, reservations: { ...reservations, [id]: entry } };
  });
  return { id, guest: false };
}

export async function releaseGeneration(userId, reservation) {
  if (!reservation) return;
  const key = reservation.guest ? 'settings/guest-quota' : 'users/' + userId;
  await updateState(key, current => {
    if (!current?.reservations?.[reservation.id]) return current;
    const reservations = { ...current.reservations };
    delete reservations[reservation.id];
    return { ...current, reservations };
  });
}

export async function deductCredit(userId = null, isAdmin = false, model = 'gemini-flash-lite-latest', isDoc = false, details = {}, reservation = null) {
  const cost = getModelCost(model);
  if (userId && userId !== 'public_guest') {
    const user = await updateState('users/' + userId, current => {
      if (!current || (!isAdmin && current.status !== 'approved')) throw Object.assign(new Error('Account approval required.'), { status: 403 });
      const reservations = activeReservations(current.reservations);
      if (reservation && !reservations[reservation.id]) throw Object.assign(new Error('Generation reservation expired. Please retry.'), { status: 409 });
      const otherReserved = Object.entries(reservations).reduce((sum, [id, item]) => sum + (id === reservation?.id ? 0 : item.cost), 0);
      if (!isAdmin && current.quota_remaining - otherReserved < cost) throw Object.assign(new Error('Insufficient credits. Please request a top-up.'), { status: 402 });
      const balance = Math.max(0, current.quota_remaining - cost);
      const event = { id: randomUUID(), timestamp: new Date().toISOString(), type: 'generation',
        userId, credits: balance - current.quota_remaining,
        balanceBefore: current.quota_remaining, balanceAfter: balance, balance, model, ...details };
      if (reservation) delete reservations[reservation.id];
      const tokensUsed = current.tokens_used ?? (current.creditHistory || []).reduce(
        (sum, item) => sum + (Number(item.totalTokens) || 0), 0
      );
      return { ...current, reservations, quota_remaining: balance,
        tokens_used: tokensUsed + (Number(details.totalTokens) || 0),
        creditHistory: [...(current.creditHistory || []), event] };
    });
    return { remaining: user.quota_remaining, deducted: true, cost, isAdmin };
  }
  const quota = await updateState('settings/guest-quota', current => {
    const state = current && Date.now() - current.lastReset < 86400000
      ? current : { ...current, totalGenerations: 0, lastReset: Date.now(), reservations: {} };
    const reservations = activeReservations(state.reservations);
    if (reservation && !reservations[reservation.id]) throw Object.assign(new Error('Generation reservation expired. Please retry.'), { status: 409 });
    if (state.totalGenerations + Object.keys(reservations).length - (reservation ? 1 : 0) >= 3) {
      throw Object.assign(new Error('The shared guest trial is exhausted. Try after the 24-hour reset or sign in.'), { status: 429 });
    }
    if (reservation) delete reservations[reservation.id];
    const event = { id: randomUUID(), timestamp: new Date().toISOString(), type: 'generation',
      userId: 'public_guest', credits: 0, balanceBefore: 3 - state.totalGenerations,
      balanceAfter: 2 - state.totalGenerations, balance: 2 - state.totalGenerations,
      model, ...details };
    return { ...state, reservations, totalGenerations: state.totalGenerations + 1,
      generationHistory: [...(state.generationHistory || []), event] };
  });
  return { remaining: Math.max(0, 3 - quota.totalGenerations), deducted: true, cost: 0, isPublicSandbox: true };
}

export async function getCreditHistory(userId = null) {
  const users = userId ? [await readState('users/' + userId)] : await listState('users/');
  return users.filter(Boolean).flatMap(u => u.creditHistory || [])
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}


/**
 * Process Documentation URL
 */
export async function processDocumentationUrl(url, customModel = 'gemini-flash-lite-latest', isAdmin = false, forceRefresh = false, userId = null, userEmail = '', visibility = 'private', options = {}) {
  const startedAt = Date.now();
  const reservation = await reserveGeneration(userId, isAdmin, customModel);
  let charged = false;
  try {
    await options.onStage?.('Inspecting source');
    const extracted = await extractDocumentation(url, options);
    await options.onStage?.('Extracting documentation');
    await options.onStage?.('Generating with Gemini');
    const summarized = await summarizeWithLLM(extracted.content, extracted.title, customModel, options.topic);
    const result = await saveGeneration({ summarized, customModel, isAdmin, userId, userEmail, visibility, reservation, startedAt,
      source_url: extracted.resolvedUrl || url, input_url: options.inputUrl || url, learning_topic: options.topic || null,
      creator_name: options.userName || null, source_type: 'url', onStage: options.onStage, requestId: options.requestId });
    charged = true;
    return result;
  } finally { if (!charged) await releaseGeneration(userId, reservation); }
}

export async function processDocumentText({ title, text, customModel = 'gemini-flash-lite-latest', isAdmin = false, userId = null, userEmail = '', userName = null, visibility = 'private', onStage, requestId }) {
  if (!text || !text.trim()) throw Object.assign(new Error('Document text content is empty.'), { status: 400 });
  const startedAt = Date.now();
  const reservation = await reserveGeneration(userId, isAdmin, customModel);
  let charged = false;
  try {
    await onStage?.('Extracting documentation');
    await onStage?.('Generating with Gemini');
    const summarized = await summarizeWithLLM(text, title || 'Uploaded Document', customModel);
    const result = await saveGeneration({ summarized, customModel, isAdmin, userId, userEmail, visibility, reservation, startedAt,
      source_url: 'upload://' + encodeURIComponent(title || 'document'), creator_name: userName, source_type: 'document', onStage, requestId });
    charged = true;
    return result;
  } finally { if (!charged) await releaseGeneration(userId, reservation); }
}

async function saveGeneration({ summarized, customModel, isAdmin, userId, userEmail, visibility, source_url, input_url = null, learning_topic = null, creator_name = null, source_type, reservation, startedAt, onStage, requestId }) {
  const actualModel = summarized.actualModel || customModel;
  const isGuest = !userId || userId === 'public_guest';
  const course = normalizeCourse({
    $id: ID.unique(), $createdAt: new Date().toISOString(),
    title: summarized.title, overview: summarized.overview || '',
    recommended_next_step: summarized.recommended_next_step || '', steps: summarized.steps,
    creator_id: isGuest ? 'public_guest' : userId, creator_email: userEmail || null,
    creator_name: isGuest ? 'Guest' : (creator_name || null),
    is_guest: isGuest, visibility: isGuest ? 'public' : (['public', 'community'].includes(visibility) ? visibility : 'private'),
    source_url, input_url, learning_topic, source_type, actual_model: actualModel,
    generation_request_id: requestId || reservation.id,
    prompt_tokens: summarized.usage?.promptTokens ?? null,
    output_tokens: summarized.usage?.candidateTokens ?? null,
    total_tokens: summarized.usage?.totalTokens ?? null,
    credits_charged: isGuest ? 0 : getModelCost(actualModel),
    generation_status: 'completed'
  });
  // Every run gets its own ID; a URL cache must never return another author's private course.
  await onStage?.('Saving course');
  await writeState('courses/' + course.$id, course);
  let quota;
  try {
    quota = await deductCredit(userId, isAdmin, actualModel, source_type === 'document', {
      requestId: requestId || reservation.id, courseId: course.$id, courseTitle: course.title,
      sourceType: source_type, sourceUrl: source_url, userEmail: userEmail || null,
      promptTokens: summarized.usage?.promptTokens ?? null,
      candidateTokens: summarized.usage?.candidateTokens ?? null,
      totalTokens: summarized.usage?.totalTokens ?? null,
      durationMs: Date.now() - startedAt, generationStatus: 'completed'
    }, reservation);
  } catch (error) {
    await deleteState('courses/' + course.$id);
    throw error;
  }
  try { await onStage?.('Recording usage'); }
  catch (error) { console.warn('Generation progress update unavailable after charge:', error?.name || 'Error'); }
  let warning = null;
  try { await addPublicCourseToFeed(course); }
  catch (error) { console.warn('Public feed index update failed:', error?.name || 'Error'); }
  try {
    await recordTokenUsage({ userId, model: actualModel, usage: summarized.usage, courseTitle: course.title,
      courseId: course.$id, cost: quota.cost, balance: quota.remaining });
  } catch (error) {
    console.error('Usage log write failed:', error.message);
    warning = 'Course saved. Token reporting is temporarily unavailable; your credit transaction is retained.';
  }
  return { course, savedToCloud: true, savedToAppwrite: false, cached: false, quota,
    fallbackNotice: [summarized.fallbackNotice, warning].filter(Boolean).join(' ') || null };
}
