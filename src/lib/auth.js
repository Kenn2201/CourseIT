import { Account, ID, OAuthProvider } from 'appwrite';
import { client, isAppwriteConfigured } from './appwrite';

const AUTH_STORAGE_KEY = 'courseit_auth_session';
export const ADMIN_EMAIL = 'kenn.nacario12@gmail.com';

export let account = null;
if (client && isAppwriteConfigured()) {
  try {
    account = new Account(client);
  } catch (err) {
    console.warn('Appwrite Account init error:', err);
  }
}

/**
 * Checks current stored auth state
 */
export function getAuthState() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return { isAuthenticated: false, isAdmin: false, user: null, quota: null };
    const parsed = JSON.parse(raw);
    const isAdmin = parsed?.user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
    return {
      isAuthenticated: Boolean(parsed?.isAuthenticated),
      isAdmin,
      user: parsed?.user || null,
      quota: parsed?.quota || null
    };
  } catch {
    return { isAuthenticated: false, isAdmin: false, user: null, quota: null };
  }
}

/**
 * Signup with Appwrite Email/Password.
 * Registers the user, creates quota with status 'pending', and DOES NOT log in.
 */
export async function signupWithEmail(name, email, password) {
  if (!account) {
    throw new Error('Appwrite Account service is not configured.');
  }

  const userId = ID.unique();
  
  // 1. Create Appwrite Auth user
  let newUser;
  try {
    newUser = await account.create(userId, email, password, name);
  } catch (err) {
    throw new Error(`Signup failed: ${err.message}`);
  }

  // 2. Register user in quota system with status 'pending'
  try {
    await fetch('/api/user/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: newUser.$id,
        name: newUser.name || name,
        email: newUser.email || email
      })
    });
  } catch (err) {
    console.warn('Failed to register quota record:', err.message);
  }

  // 3. Return exact required success message without logging in
  return {
    success: true,
    message: "Done sign up! Requested code, wait for email!",
    user: newUser
  };
}

/**
 * Log in via Appwrite Email and Password
 */
export async function loginWithEmail(email, password) {
  if (!account) {
    throw new Error('Appwrite Account service is not initialized.');
  }

  try {
    // 1. Create email password session
    await account.createEmailPasswordSession(email, password);
    const user = await account.get();
    const isAdmin = user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

    // 2. Check quota & approval status
    let quota = null;
    try {
      const quotaRes = await fetch(`/api/user/quota?userId=${encodeURIComponent(user.$id)}&email=${encodeURIComponent(user.email)}&name=${encodeURIComponent(user.name || '')}`);
      const quotaData = await quotaRes.json();
      if (quotaData.success) {
        quota = quotaData.quota;
      }
    } catch (qErr) {
      console.warn('Could not fetch user quota:', qErr.message);
    }

    // 3. Keep user authenticated with pending status (0 credits until approved)
    const authState = {
      isAuthenticated: true,
      isAdmin,
      user: {
        id: user.$id,
        email: user.email,
        name: user.name || user.email.split('@')[0]
      },
      quota: quota || { quota_remaining: isAdmin ? 250 : 0, status: isAdmin ? 'approved' : 'pending' }
    };

    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authState));
    return authState;
  } catch (err) {
    throw new Error(err.message || 'Invalid email or password.');
  }
}

/**
 * OAuth2 Token Flow for Google
 */
export async function signInWithGoogle() {
  if (!account) throw new Error('Appwrite client is not configured.');
  const success = `${window.location.origin}/auth/success`;
  const failure = `${window.location.origin}/auth/failure`;

  await account.createOAuth2Token(
    OAuthProvider.Google,
    success,
    failure
  );
}

/**
 * OAuth2 Token Flow for GitHub
 */
export async function signInWithGithub() {
  if (!account) throw new Error('Appwrite client is not configured.');
  const success = `${window.location.origin}/auth/success`;
  const failure = `${window.location.origin}/auth/failure`;

  await account.createOAuth2Token(
    OAuthProvider.Github,
    success,
    failure
  );
}

/**
 * Handles OAuth2 Success Callback (/auth/success)
 */
export async function handleOAuthSuccess(userId, secret) {
  if (!account) throw new Error('Appwrite client is not configured.');

  let user = null;
  // 1. Check if session already exists
  try {
    user = await account.get();
  } catch {
    // 2. No session yet, create session using token secret
    if (!userId || !secret) throw new Error('Missing OAuth credentials');
    try {
      await account.createSession(userId, secret);
      user = await account.get();
    } catch (err) {
      try {
        user = await account.get();
      } catch {
        throw err;
      }
    }
  }

  if (!user) throw new Error('Failed to retrieve user profile after OAuth authentication');
  const isAdmin = user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  // Register in quota system or fetch existing
  let quota = null;
  try {
    const qRes = await fetch(`/api/user/quota?userId=${encodeURIComponent(user.$id)}&email=${encodeURIComponent(user.email)}&name=${encodeURIComponent(user.name || '')}`);
    const qData = await qRes.json();
    if (qData.success) {
      quota = qData.quota;
    }
  } catch {}

  const authState = {
    isAuthenticated: true,
    isAdmin,
    user: {
      id: user.$id,
      email: user.email,
      name: user.name || user.email.split('@')[0]
    },
    quota: quota || { quota_remaining: isAdmin ? 250 : 0, status: isAdmin ? 'approved' : 'pending' }
  };

  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authState));
  return authState;
}

/**
 * Request password reset email via Resend
 */
export async function requestPasswordReset(email) {
  const res = await fetch('/api/user/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
  const data = await res.json();
  if (!data.success) {
    throw new Error(data.error || 'Failed to send password reset email.');
  }
  return data;
}

/**
 * Check active Appwrite session upon redirect / page reload
 */
export async function checkAppwriteSession() {
  if (!account) return getAuthState();

  try {
    const user = await account.get();
    if (user) {
      const isAdmin = user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

      // Fetch fresh quota
      let quota = null;
      try {
        const quotaRes = await fetch(`/api/user/quota?userId=${encodeURIComponent(user.$id)}&email=${encodeURIComponent(user.email)}&name=${encodeURIComponent(user.name || '')}`);
        const quotaData = await quotaRes.json();
        if (quotaData.success) {
          quota = quotaData.quota;
        }
      } catch {}

      // Keep user authenticated even if pending; pending state is handled via quota.status
      const authState = {
        isAuthenticated: true,
        isAdmin,
        user: {
          id: user.$id,
          email: user.email,
          name: user.name || user.email.split('@')[0]
        },
        quota: quota || { quota_remaining: isAdmin ? 250 : 0, status: isAdmin ? 'approved' : 'pending' }
      };

      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authState));
      return authState;
    }
  } catch {
    // Not logged in
  }

  return getAuthState();
}

/**
 * Log out current session
 */
export async function logoutUser() {
  if (account) {
    try {
      await account.deleteSession('current');
    } catch (err) {
      console.warn('Session delete warning:', err.message);
    }
  }

  localStorage.removeItem(AUTH_STORAGE_KEY);
  localStorage.removeItem('courseit_guest_quota');
  localStorage.removeItem('courseit_admin_mode');
  
  // Notify listeners across app
  window.dispatchEvent(new Event('courseit_auth_changed'));
  window.dispatchEvent(new Event('courseit_quota_updated'));

  return { isAuthenticated: false, isAdmin: false, user: null, quota: null };
}

/**
 * Archive user account via backend and trigger Resend email
 */
export async function archiveAccount(reason, feedback) {
  const current = getAuthState();
  if (!current.user?.id) throw new Error('You must be logged in to archive your account');

  const res = await fetch('/api/user/archive', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: current.user.id,
      reason,
      feedback
    })
  });

  const data = await res.json();
  if (!data.success) {
    throw new Error(data.error || 'Failed to archive account');
  }

  // Once archived, log the user out cleanly
  await logoutUser();
  return data;
}

export const loginWithGoogle = signInWithGoogle;
export const loginWithGithub = signInWithGithub;
export const getAdminState = getAuthState;
export const logoutAdmin = logoutUser;
