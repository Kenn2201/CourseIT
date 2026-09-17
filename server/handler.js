import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import { Client, Databases, ID, Query, Account as ServerAccount } from 'node-appwrite';
import { Resend } from 'resend';
import { extractDocumentation } from './extract.js';
import { summarizeWithLLM } from './llm.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In serverless / AWS Lambda / Netlify environments, root is read-only.
// Use os.tmpdir() for runtime fallback files.
const isServerless = Boolean(
  process.env.NETLIFY ||
  process.env.AWS_LAMBDA_FUNCTION_NAME ||
  process.env.LAMBDA_TASK_ROOT ||
  process.env.VERCEL
);

const DATA_DIR = isServerless
  ? path.join(os.tmpdir(), 'courseit_data')
  : path.join(__dirname, 'data');

const USERS_QUOTA_FILE = path.join(DATA_DIR, 'users_quota.json');
const PUBLIC_SANDBOX_FILE = path.join(DATA_DIR, 'public_sandbox.json');
const FEEDBACK_FILE = path.join(DATA_DIR, 'feedback.json');
const TOKEN_USAGE_FILE = path.join(DATA_DIR, 'token_usage.json');

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
export const ADMIN_EMAIL = process.env.ADMIN_EMAIL || process.env.VITE_ADMIN_EMAIL || '';

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
    const user = await account.get();

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

function loadTokenUsage() {
  try {
    if (fs.existsSync(TOKEN_USAGE_FILE)) {
      const raw = fs.readFileSync(TOKEN_USAGE_FILE, 'utf-8');
      return JSON.parse(raw || '{}');
    }
  } catch {}
  return {
    totalTokens: 0,
    promptTokens: 0,
    candidateTokens: 0,
    estimatedCostUsd: 0,
    totalGenerations: 0,
    perUser: {},
    history: []
  };
}

function saveTokenUsage(data) {
  try {
    fs.writeFileSync(TOKEN_USAGE_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Failed to save token usage file:', err.message);
  }
}

export function recordTokenUsage({ userId, model, usage, courseTitle }) {
  if (!usage) return null;
  const stats = loadTokenUsage();
  if (!stats.perUser) stats.perUser = {};
  if (!stats.history) stats.history = [];

  const pTokens = usage.promptTokens || 0;
  const cTokens = usage.candidateTokens || 0;
  const tTokens = usage.totalTokens || (pTokens + cTokens);

  // Gemini pricing: Flash Lite ($0.075 / 1M prompt, $0.30 / 1M completion)
  // Others: approx ($0.15 / 1M prompt, $0.60 / 1M completion)
  const isLite = (model || '').includes('lite');
  const pRate = isLite ? 0.075 : 0.15;
  const cRate = isLite ? 0.30 : 0.60;
  const costUsd = ((pTokens * pRate) + (cTokens * cRate)) / 1000000;

  stats.totalTokens = (stats.totalTokens || 0) + tTokens;
  stats.promptTokens = (stats.promptTokens || 0) + pTokens;
  stats.candidateTokens = (stats.candidateTokens || 0) + cTokens;
  stats.estimatedCostUsd = Number(((stats.estimatedCostUsd || 0) + costUsd).toFixed(6));
  stats.totalGenerations = (stats.totalGenerations || 0) + 1;

  const uKey = userId || 'public_guest';
  if (!stats.perUser[uKey]) {
    stats.perUser[uKey] = { totalTokens: 0, generations: 0, estimatedCostUsd: 0 };
  }
  stats.perUser[uKey].totalTokens += tTokens;
  stats.perUser[uKey].generations += 1;
  stats.perUser[uKey].estimatedCostUsd = Number(((stats.perUser[uKey].estimatedCostUsd || 0) + costUsd).toFixed(6));

  stats.history.unshift({
    timestamp: new Date().toISOString(),
    userId: uKey,
    model: model || 'gemini-flash-lite-latest',
    promptTokens: pTokens,
    candidateTokens: cTokens,
    totalTokens: tTokens,
    costUsd: Number(costUsd.toFixed(6)),
    courseTitle: courseTitle || 'Generated Course'
  });

  if (stats.history.length > 100) {
    stats.history = stats.history.slice(0, 100);
  }

  saveTokenUsage(stats);
  return { ...usage, costUsd };
}

export function getTokenMetrics() {
  return loadTokenUsage();
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

function loadPublicSandbox() {
  try {
    if (fs.existsSync(PUBLIC_SANDBOX_FILE)) {
      const raw = fs.readFileSync(PUBLIC_SANDBOX_FILE, 'utf-8');
      return JSON.parse(raw || '{}');
    }
  } catch {}
  return { urlGenerations: 0, docGenerations: 0, lastReset: Date.now() };
}

function savePublicSandbox(data) {
  try {
    fs.writeFileSync(PUBLIC_SANDBOX_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch {}
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

/**
 * Get or initialize user quota record (250 credits default)
 */
export async function getUserQuota(userId, email = '', name = '') {
  if (!userId || userId === 'public_guest') {
    const sandbox = loadPublicSandbox();
    const now = Date.now();
    const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
    if (!sandbox.lastReset || now - sandbox.lastReset > TWENTY_FOUR_HOURS) {
      sandbox.totalGenerations = 0;
      sandbox.lastReset = now;
      savePublicSandbox(sandbox);
    }
    const used = sandbox.totalGenerations || 0;
    const remaining = Math.max(0, 3 - used);
    return {
      user_id: 'public_guest',
      quota_remaining: remaining,
      remaining,
      used,
      total: 3,
      isPublicSandbox: true
    };
  }

  const localData = loadLocalUsersQuota();
  const db = getAppwriteDb();
  const databaseId = process.env.APPWRITE_DATABASE_ID || process.env.VITE_APPWRITE_DATABASE_ID;

  const isAdmin = (email && email.toLowerCase() === ADMIN_EMAIL.toLowerCase());

  const tokenStats = loadTokenUsage();
  const tokensUsed = tokenStats.perUser?.[userId]?.totalTokens || 0;

  // 1. Check local file first
  if (localData[userId]) {
    if (isAdmin) {
      localData[userId].status = 'approved';
    }
    localData[userId].tokens_used = tokensUsed;
    return localData[userId];
  }

  // 2. Check Appwrite users_quota collection if available
  if (db && databaseId) {
    try {
      const existing = await db.listDocuments(databaseId, 'users_quota', [
        Query.equal('user_id', userId)
      ]);
      if (existing.documents && existing.documents.length > 0) {
        const doc = existing.documents[0];
        const record = {
          user_id: doc.user_id,
          name: doc.name,
          email: doc.email,
          quota_remaining: doc.quota_remaining ?? DEFAULT_CREDITS,
          status: isAdmin ? 'approved' : doc.status,
          tokens_used: tokensUsed,
          $id: doc.$id,
          $createdAt: doc.$createdAt
        };
        localData[userId] = record;
        saveLocalUsersQuota(localData);
        return record;
      }
    } catch {}
  }

  // 3. Initialize new quota record (250 credits for admin, 0 for pending non-admin)
  const initialStatus = isAdmin ? 'approved' : 'pending';
  const initialQuota = isAdmin ? DEFAULT_CREDITS : 0;
  const newRecord = {
    user_id: userId,
    name: name || (isAdmin ? 'Kenn Nacario' : 'User'),
    email: email || '',
    quota_remaining: initialQuota,
    status: initialStatus,
    $createdAt: new Date().toISOString()
  };

  // Try creating in Appwrite
  if (db && databaseId) {
    try {
      const created = await db.createDocument(databaseId, 'users_quota', ID.unique(), {
        user_id: newRecord.user_id,
        name: newRecord.name,
        email: newRecord.email,
        quota_remaining: newRecord.quota_remaining,
        status: newRecord.status
      });
      newRecord.$id = created.$id;
    } catch {}
  }

  localData[userId] = newRecord;
  saveLocalUsersQuota(localData);

  // Send signup request received confirmation via Resend for newly registered pending users
  if (!isAdmin && email && !email.endsWith('@example.com')) {
    try {
      sendEmail({
        to: email,
        subject: 'CourseIT - Beta Access Request Received',
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 28px; background: #0b0f19; color: #f1f5f9; border-radius: 16px; border: 1px solid #1e293b;">
            <div style="text-align: center; margin-bottom: 20px;">
              <span style="font-size: 32px;">⚡</span>
              <h1 style="color: #6366f1; font-size: 24px; margin: 8px 0 0;">CourseIT</h1>
              <p style="color: #94a3b8; font-size: 13px; margin-top: 4px;">Zero AI Fluff &bull; Action-First Learning</p>
            </div>
            <div style="background: #131c2e; padding: 20px; border-radius: 12px; border: 1px solid #1e293b;">
              <h2 style="color: #e2e8f0; font-size: 18px; margin-top: 0;">Beta Access Request Submitted!</h2>
              <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6;">
                Hi <strong>${name || 'there'}</strong>, your request for <strong>250 CourseIT credits</strong> has been received by our administrator.
              </p>
              <p style="color: #94a3b8; font-size: 13px; line-height: 1.6;">
                Your account is currently in the approval queue. You will receive an approval email shortly once your account has been approved by the administrator.
              </p>
            </div>
            <p style="color: #64748b; font-size: 12px; text-align: center; margin-top: 20px;">
              CourseIT &bull; Built with ❤️ by Kenn Nacario
            </p>
          </div>
        `
      }).catch(mailErr => console.warn('Could not dispatch signup email:', mailErr.message));
    } catch {}
  }

  return newRecord;
}

/**
 * Register user signup and dispatch signup confirmation email
 */
export async function registerUserSignup(userId, name, email) {
  const record = await getUserQuota(userId, email, name);

  // Send signup request received confirmation via Resend
  if (email && !email.endsWith('@example.com')) {
    sendEmail({
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
              Hi <strong>${name || 'there'}</strong>, your request for <strong>250 CourseIT credits</strong> has been received by our administrator.
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
    }).catch(() => {});
  }

  return record;
}

/**
 * Send password reset email via Resend
 */
export async function sendPasswordResetEmail(email) {
  if (!email) throw new Error('Email is required');

  const resetToken = Math.random().toString(36).substring(2, 10).toUpperCase();
  
  const result = await sendEmail({
    to: email,
    subject: 'CourseIT - Password Reset Request',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 28px; background: #0b0f19; color: #f1f5f9; border-radius: 16px; border: 1px solid #1e293b;">
        <h2 style="color: #6366f1;">Reset Your CourseIT Password</h2>
        <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6;">
          We received a request to reset your password. Use the security code below in your app or Appwrite account settings:
        </p>
        <div style="background: #1e293b; padding: 16px; border-radius: 8px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 4px; color: #38bdf8; margin: 20px 0;">
          ${resetToken}
        </div>
        <p style="color: #94a3b8; font-size: 12px;">If you did not request this, please ignore this email.</p>
      </div>
    `
  });

  return { success: result.success, error: result.error, senderUsed: result.senderUsed };
}

/**
 * List all users from users_quota for Admin dashboard
 */
export async function listAllUsers() {
  const localData = loadLocalUsersQuota();
  const db = getAppwriteDb();
  const databaseId = process.env.APPWRITE_DATABASE_ID || process.env.VITE_APPWRITE_DATABASE_ID;

  let records = Object.values(localData);

  if (db && databaseId) {
    try {
      const list = await db.listDocuments(databaseId, 'users_quota', [
        Query.orderDesc('$createdAt')
      ]);
      if (list.documents && list.documents.length > 0) {
        const appwriteUsers = list.documents.map(d => ({
          user_id: d.user_id,
          name: d.name,
          email: d.email,
          quota_remaining: d.quota_remaining ?? DEFAULT_CREDITS,
          status: d.status,
          $id: d.$id,
          $createdAt: d.$createdAt
        }));

        const mergedMap = new Map();
        records.forEach(r => mergedMap.set(r.user_id, r));
        appwriteUsers.forEach(r => mergedMap.set(r.user_id, r));
        records = Array.from(mergedMap.values());
      }
    } catch {}
  }

  // Ensure Admin is present
  const hasAdmin = records.some(r => r.email && r.email.toLowerCase() === ADMIN_EMAIL.toLowerCase());
  if (!hasAdmin) {
    const adminRecord = {
      user_id: process.env.ADMIN_USER_ID || 'admin_master_account',
      name: 'Kenn Nacario',
      email: ADMIN_EMAIL,
      quota_remaining: DEFAULT_CREDITS,
      status: 'approved',
      isAdmin: true,
      $createdAt: new Date().toISOString()
    };
    records.unshift(adminRecord);
    localData[adminRecord.user_id] = adminRecord;
    saveLocalUsersQuota(localData);
  }

  // Ensure unique sample test account on yopmail.com is present
  const hasSample = records.some(r => r.email && r.email.toLowerCase() === 'courseit.kenn.test@yopmail.com');
  if (!hasSample) {
    const sampleRecord = {
      user_id: 'user_yopmail_kenn_2026',
      name: 'Kenn Beta Tester',
      email: 'courseit.kenn.test@yopmail.com',
      quota_remaining: DEFAULT_CREDITS,
      status: 'approved',
      $createdAt: new Date().toISOString()
    };
    records.push(sampleRecord);
    localData[sampleRecord.user_id] = sampleRecord;
    saveLocalUsersQuota(localData);
  }

  return records;
}

/**
 * Approve a user and send approval email via Resend
 */
export async function approveUserAndSendEmail(userId, customEmail = null) {
  const localData = loadLocalUsersQuota();
  const user = localData[userId] || Object.values(localData).find(u => u.user_id === userId || u.email === customEmail);

  const targetEmail = customEmail || user?.email;
  const targetName = user?.name || 'there';

  if (!targetEmail) {
    throw new Error('User email not found for approval');
  }

  // 1. Update status to approved and quota to 250
  if (user) {
    user.status = 'approved';
    user.quota_remaining = DEFAULT_CREDITS;
    localData[user.user_id] = user;
    saveLocalUsersQuota(localData);
  }

  // Try updating in Appwrite
  const db = getAppwriteDb();
  const databaseId = process.env.APPWRITE_DATABASE_ID || process.env.VITE_APPWRITE_DATABASE_ID;
  if (db && databaseId && user?.$id) {
    try {
      await db.updateDocument(databaseId, 'users_quota', user.$id, {
        status: 'approved',
        quota_remaining: DEFAULT_CREDITS
      });
    } catch {}
  }

  // 2. Send Resend approval email
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
            Your CourseIT account is approved! You have <strong>${DEFAULT_CREDITS} course credits</strong> ready to use.
          </p>
          <p style="font-size: 14px; line-height: 1.6; color: #94a3b8;">
            Turn any complex documentation URL or scanned tutorial image into step-by-step interactive courses with code snippets and pro tips.
          </p>
        </div>

        <div style="text-align: center; margin-bottom: 28px;">
          <a href="http://localhost:5173" style="background: #4f46e5; color: #ffffff; padding: 14px 28px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 15px; display: inline-block;">
            Launch CourseIT Dashboard &rarr;
          </a>
        </div>

        <p style="color: #64748b; font-size: 12px; text-align: center; border-top: 1px solid #1e293b; padding-top: 20px; margin-bottom: 0;">
          Sent by CourseIT &bull; notifications@kenncode.me
        </p>
      </div>
    `
  });

  return {
    success: true,
    user: localData[user?.user_id || userId] || { email: targetEmail, status: 'approved', quota_remaining: DEFAULT_CREDITS },
    emailSent: emailRes.success,
    senderUsed: emailRes.senderUsed,
    emailError: emailRes.error
  };
}

/**
 * Top up user credits (e.g. +250 credits)
 */
export async function topUpUserCredits(userId, amount = DEFAULT_CREDITS) {
  const localData = loadLocalUsersQuota();
  const user = localData[userId];
  if (!user) throw new Error('User not found');

  user.quota_remaining = (user.quota_remaining || 0) + amount;
  localData[userId] = user;
  saveLocalUsersQuota(localData);

  const db = getAppwriteDb();
  const databaseId = process.env.APPWRITE_DATABASE_ID || process.env.VITE_APPWRITE_DATABASE_ID;
  if (db && databaseId && user.$id) {
    try {
      await db.updateDocument(databaseId, 'users_quota', user.$id, {
        quota_remaining: user.quota_remaining
      });
    } catch {}
  }

  return user;
}

/**
 * Delete a course document from Appwrite & local fallback
 */
/**
 * Delete a course document from Appwrite & local fallback
 * Enforces ownership or admin ACL: starter templates and non-owned courses are rejected with 403 Forbidden.
 */
export async function deleteCourse(courseId, requestingUserId = null, requestingUserEmail = '') {
  if (!courseId) {
    throw new Error('Course ID is required.');
  }

  const isAdmin = Boolean(requestingUserEmail && requestingUserEmail.toLowerCase() === ADMIN_EMAIL.toLowerCase());

  // 1. Starter catalog courses are protected public templates - only admin can delete
  const isStarter = courseId.startsWith('starter-') || [
    'starter-godot-signals',
    'starter-react19-rsc',
    'starter-rust-ownership',
    'starter-docker-prod',
    'starter-godot-2d-game'
  ].includes(courseId);

  if (isStarter && !isAdmin) {
    throw new Error('Forbidden: Starter catalog courses are shared public templates and can only be deleted by the administrator.');
  }

  const db = getAppwriteDb();
  const databaseId = process.env.APPWRITE_DATABASE_ID || process.env.VITE_APPWRITE_DATABASE_ID;
  const collectionId = process.env.APPWRITE_COLLECTION_ID || process.env.VITE_APPWRITE_COLLECTION_ID || '';

  let deleted = false;
  if (db && databaseId && collectionId) {
    // 2. If not admin, check document ownership in Appwrite
    if (!isAdmin) {
      if (!requestingUserId) {
        throw new Error('Forbidden: Authentication required. You must be signed in as the course author or administrator to delete this course.');
      }
      try {
        const doc = await db.getDocument(databaseId, collectionId, courseId);
        if (doc) {
          let authorId = doc.creator_id || null;
          let authorEmail = doc.creator_email || null;
          if (typeof doc.steps === 'string') {
            try {
              const parsed = JSON.parse(doc.steps);
              authorId = parsed.creator_id || authorId;
              authorEmail = parsed.creator_email || authorEmail;
            } catch {}
          }

          const isOwner = (authorId && authorId === requestingUserId) ||
                          (authorEmail && requestingUserEmail && authorEmail.toLowerCase() === requestingUserEmail.toLowerCase());

          if (!isOwner) {
            throw new Error('Forbidden: You do not have permission to delete this course. Only the course creator or administrator may delete it.');
          }
        }
      } catch (checkErr) {
        if (checkErr.message && checkErr.message.includes('Forbidden:')) {
          throw checkErr;
        }
        // Document might only exist in client local storage
      }
    }

    try {
      await db.deleteDocument(databaseId, collectionId, courseId);
      deleted = true;
    } catch (delErr) {
      console.warn('Appwrite course delete note:', delErr.message);
    }
  }

  return { success: true, deleted, courseId };
}

/**
 * Archive user account and send confirmation email via Resend
 */
export async function archiveUserAccount(userId, reason = 'Not specified', feedback = '') {
  const localData = loadLocalUsersQuota();
  const user = localData[userId] || Object.values(localData).find(u => u.user_id === userId);

  if (!user) {
    throw new Error('User not found');
  }

  user.status = 'archived';
  user.archive_reason = reason;
  user.archive_feedback = feedback;
  user.archived_at = new Date().toISOString();

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
  const feedbacks = loadFeedbacks();
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
  saveFeedbacks(feedbacks);

  // Send email alert to admin with beautiful template
  sendEmail({
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
            <span style="font-size: 13px; color: #94a3b8;">User: <strong style="color: #f1f5f9;">${newFeedback.name}</strong> (${newFeedback.email})</span>
            <span style="font-size: 14px; color: #fbbf24; font-weight: bold;">${'★'.repeat(newFeedback.rating)} (${newFeedback.rating}/5)</span>
          </div>
          <p style="margin: 0 0 10px 0; font-size: 13px; color: #a5b4fc;"><strong style="color: #c7d2fe;">Category:</strong> ${category}</p>
          <div style="background: #090d16; padding: 16px; border-radius: 10px; border: 1px solid #1e293b; font-size: 14px; line-height: 1.6; color: #e2e8f0; white-space: pre-wrap;">
            ${message || 'No written message provided.'}
          </div>
          ${pageUrl ? `<p style="margin: 12px 0 0 0; font-size: 12px; color: #64748b; font-family: monospace;">Page: ${pageUrl}</p>` : ''}
        </div>

        <div style="text-align: center;">
          <a href="http://localhost:5173/admin" style="background: #4f46e5; color: #ffffff; padding: 12px 26px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 13px; display: inline-block;">
            Open Admin Dashboard &rarr;
          </a>
        </div>
      </div>
    `
  }).catch(() => {});

  return { success: true, feedback: newFeedback };
}

/**
 * List all feedbacks
 */
export function listAllFeedbacks() {
  return loadFeedbacks();
}

/**
 * Update feedback status (reviewed, resolved)
 */
export function updateFeedbackStatus(feedbackId, status = 'reviewed') {
  const feedbacks = loadFeedbacks();
  const item = feedbacks.find(f => f.id === feedbackId);
  if (item) {
    item.status = status;
    saveFeedbacks(feedbacks);
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
export async function deductCredit(userId = null, isAdmin = false, model = 'gemini-flash-lite-latest', isDoc = false) {
  const cost = getModelCost(model);

  // Account-based user (including admin testing)
  if (userId && userId !== 'public_guest') {
    const user = await getUserQuota(userId);
    if (!isAdmin && user.status !== 'approved') {
      throw new Error('Your account is pending admin approval. You will receive an email once approved!');
    }
    if (!isAdmin && user.quota_remaining < cost) {
      throw new Error(`Insufficient credits. This model requires ${cost} credits, but you have ${user.quota_remaining.toFixed(1)} credits remaining.`);
    }

    user.quota_remaining = Math.max(0, user.quota_remaining - cost);
    const localData = loadLocalUsersQuota();
    localData[userId] = user;
    saveLocalUsersQuota(localData);

    // Sync to Appwrite database with guaranteed document ID resolution
    const db = getAppwriteDb();
    const databaseId = process.env.APPWRITE_DATABASE_ID || process.env.VITE_APPWRITE_DATABASE_ID;
    if (db && databaseId) {
      try {
          const exactRemaining = Number(user.quota_remaining.toFixed(1));
          if (user.$id) {
            await db.updateDocument(databaseId, 'users_quota', user.$id, {
              quota_remaining: exactRemaining
            });
          } else {
            const existing = await db.listDocuments(databaseId, 'users_quota', [
              Query.equal('user_id', userId)
            ]);
            if (existing.documents && existing.documents.length > 0) {
              user.$id = existing.documents[0].$id;
              await db.updateDocument(databaseId, 'users_quota', user.$id, {
                quota_remaining: exactRemaining
              });
            }
          }
      } catch (appwriteSyncErr) {
        console.warn('Appwrite quota sync note:', appwriteSyncErr.message);
      }
    }

    return { remaining: user.quota_remaining, deducted: true, cost, isAdmin };
  }

  // Public visitor sandbox: 3 free URL courses, 1 doc per 24 hours, only Flash Lite permitted
  if (model !== 'gemini-flash-lite-latest') {
    throw new Error('Higher tier models require an account. Please sign in or register to use this model!');
  }

  const sandbox = loadPublicSandbox();
  const now = Date.now();
  const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

  // Reset 24-hour sandbox window
  if (!sandbox.lastReset || now - sandbox.lastReset > TWENTY_FOUR_HOURS) {
    sandbox.totalGenerations = 0;
    sandbox.lastReset = now;
  }

  // Combined shared pool of 3 free runs per 24 hours across URL and OCR
  const currentUsed = sandbox.totalGenerations || 0;
  if (currentUsed >= 3) {
    throw new Error('Free trial limit reached (3/3). You can use another free trial in 24 hours, or request access to the beta test for 250 free credits!');
  }

  sandbox.totalGenerations = currentUsed + 1;
  savePublicSandbox(sandbox);
  const remaining = Math.max(0, 3 - sandbox.totalGenerations);
  return { remaining, used: sandbox.totalGenerations, total: 3, deducted: true, cost: 0, isPublicSandbox: true };
}

/**
 * Process Documentation URL
 */
export async function processDocumentationUrl(url, customModel = 'gemini-flash-lite-latest', isAdmin = false, forceRefresh = false, userId = null, userEmail = '') {
  if (!url) {
    throw new Error('URL is required');
  }

  const endpoint = process.env.APPWRITE_ENDPOINT || process.env.VITE_APPWRITE_ENDPOINT || 'https://syd.cloud.appwrite.io/v1';
  const projectId = process.env.APPWRITE_PROJECT_ID || process.env.VITE_APPWRITE_PROJECT_ID;
  const databaseId = process.env.APPWRITE_DATABASE_ID || process.env.VITE_APPWRITE_DATABASE_ID;
  const collectionId = process.env.APPWRITE_COLLECTION_ID || process.env.VITE_APPWRITE_COLLECTION_ID || '';
  const apiKey = process.env.APPWRITE_API_KEY;

  let databases = null;
  if (apiKey && projectId && databaseId && collectionId) {
    try {
      const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
      databases = new Databases(client);
    } catch (clientErr) {
      console.warn('Could not initialize Appwrite Server client:', clientErr.message);
    }
  }

  let existingDocId = null;
  // 1. Check URL Deduplication Cache in Appwrite
  if (databases) {
    try {
      const existing = await databases.listDocuments(databaseId, collectionId, [
        Query.equal('source_url', url)
      ]);

      if (existing.documents && existing.documents.length > 0) {
        const doc = existing.documents[0];
        existingDocId = doc.$id;

        if (!forceRefresh) {
          let steps = doc.steps;
          let overview = '';
          let recommended_next_step = '';
          let creator_id = doc.creator_id || null;
          let creator_email = doc.creator_email || null;

          try {
            const parsed = JSON.parse(doc.steps);
            if (Array.isArray(parsed)) {
              steps = parsed;
            } else if (parsed && typeof parsed === 'object') {
              steps = parsed.items || parsed.steps || [];
              overview = parsed.overview || '';
              recommended_next_step = parsed.recommended_next_step || '';
              creator_id = parsed.creator_id || creator_id;
              creator_email = parsed.creator_email || creator_email;
            }
          } catch {
            steps = [];
          }

          return {
            course: {
              $id: doc.$id,
              title: doc.title,
              source_url: doc.source_url,
              overview,
              recommended_next_step,
              steps,
              creator_id,
              creator_email,
              $createdAt: doc.$createdAt
            },
            savedToAppwrite: true,
            cached: true,
            quota: { remaining: DEFAULT_CREDITS }
          };
        }
      }
    } catch (cacheErr) {
      console.warn('Cache lookup warning:', cacheErr.message);
    }
  }

  // 2. Extract content from URL
  const extracted = await extractDocumentation(url);

  // 3. Summarize with LLM (with fallback tracking)
  const summarized = await summarizeWithLLM(extracted.content, extracted.title, customModel);

  // 4. Quota Check & Deduction based on actual model used (cheaper if fell back)
  const effectiveModel = summarized.actualModel || customModel;
  const quotaResult = await deductCredit(userId, isAdmin, effectiveModel, false);

  if (summarized.usage) {
    recordTokenUsage({
      userId,
      model: effectiveModel,
      usage: summarized.usage,
      courseTitle: summarized.title
    });
  }

  const payloadToStore = JSON.stringify({
    overview: summarized.overview || '',
    recommended_next_step: summarized.recommended_next_step || '',
    items: summarized.steps,
    creator_id: userId || null,
    creator_email: userEmail || null,
    actual_model: effectiveModel,
    createdAt: new Date().toISOString()
  });

  const now = new Date().toISOString();
  let savedToAppwrite = false;
  let documentId = existingDocId || `course_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

  // 5. Save to Appwrite - only persist courses for authenticated users to protect database from public flooding
  if (databases && userId && userId !== 'public_guest') {
    try {
      if (existingDocId) {
        const doc = await databases.updateDocument(databaseId, collectionId, existingDocId, {
          source_url: url,
          title: summarized.title,
          steps: payloadToStore
        });
        documentId = doc.$id;
      } else {
        const doc = await databases.createDocument(databaseId, collectionId, ID.unique(), {
          source_url: url,
          title: summarized.title,
          steps: payloadToStore
        });
        documentId = doc.$id;
      }
      savedToAppwrite = true;
    } catch (appwriteErr) {
      console.warn('Could not save to Appwrite Server:', appwriteErr.message);
    }
  }

  const isGuest = !userId || userId === 'public_guest';
  return {
    course: {
      $id: documentId,
      title: summarized.title,
      source_url: url,
      overview: summarized.overview || '',
      recommended_next_step: summarized.recommended_next_step || '',
      steps: summarized.steps,
      creator_id: userId || (isGuest ? 'public_guest' : null),
      creator_email: userEmail || null,
      is_guest: isGuest,
      $createdAt: now
    },
    savedToAppwrite,
    cached: false,
    quota: quotaResult,
    fallbackNotice: summarized.fallbackNotice || null
  };
}

/**
 * Summarize text extracted from document / OCR
 */
export async function processDocumentText({ title, text, customModel = 'gemini-flash-lite-latest', isAdmin = false, userId = null, userEmail = '' }) {
  if (!text || !text.trim()) {
    throw new Error('Document text content is empty.');
  }

  // 1. Summarize with LLM (with fallback tracking)
  const summarized = await summarizeWithLLM(text, title || 'Uploaded Document', customModel);

  // 2. Quota Check & Deduction based on actual model used
  const effectiveModel = summarized.actualModel || customModel;
  const quotaResult = await deductCredit(userId, isAdmin, effectiveModel, true);

  if (summarized.usage) {
    recordTokenUsage({
      userId,
      model: effectiveModel,
      usage: summarized.usage,
      courseTitle: summarized.title || title
    });
  }

  const payloadToStore = JSON.stringify({
    overview: summarized.overview || '',
    recommended_next_step: summarized.recommended_next_step || '',
    items: summarized.steps,
    creator_id: userId || null,
    creator_email: userEmail || null,
    actual_model: effectiveModel,
    createdAt: new Date().toISOString()
  });

  const now = new Date().toISOString();
  let savedToAppwrite = false;
  let documentId = `doc_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const virtualSourceUrl = `upload://${(title || 'doc').toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

  const db = getAppwriteDb();
  const databaseId = process.env.APPWRITE_DATABASE_ID || process.env.VITE_APPWRITE_DATABASE_ID;
  const collectionId = process.env.APPWRITE_COLLECTION_ID || process.env.VITE_APPWRITE_COLLECTION_ID || '';

  // Only persist to Appwrite for authenticated users to protect database
  if (db && databaseId && collectionId && userId && userId !== 'public_guest') {
    try {
      const doc = await db.createDocument(databaseId, collectionId, ID.unique(), {
        source_url: virtualSourceUrl,
        title: summarized.title || title,
        steps: payloadToStore
      });
      documentId = doc.$id;
      savedToAppwrite = true;
    } catch (err) {
      console.warn('Could not save uploaded document to Appwrite:', err.message);
    }
  }

  const isGuest = !userId || userId === 'public_guest';
  return {
    course: {
      $id: documentId,
      title: summarized.title || title,
      source_url: virtualSourceUrl,
      overview: summarized.overview || '',
      recommended_next_step: summarized.recommended_next_step || '',
      steps: summarized.steps,
      creator_id: userId || (isGuest ? 'public_guest' : null),
      creator_email: userEmail || null,
      is_guest: isGuest,
      $createdAt: now
    },
    savedToAppwrite,
    cached: false,
    quota: quotaResult,
    fallbackNotice: summarized.fallbackNotice || null
  };
}
