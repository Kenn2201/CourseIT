import { Account } from 'appwrite';
import { client, isAppwriteConfigured } from './appwrite';

const ADMIN_STORAGE_KEY = 'courseit_admin_session';

let account = null;
if (client && isAppwriteConfigured()) {
  try {
    account = new Account(client);
  } catch (err) {
    console.warn('Appwrite Account init error:', err);
  }
}

/**
 * Checks if current user is authenticated as Admin
 * @returns {{ isAdmin: boolean, user: object|null }}
 */
export function getAdminState() {
  try {
    const raw = localStorage.getItem(ADMIN_STORAGE_KEY);
    if (!raw) return { isAdmin: false, user: null };
    const parsed = JSON.parse(raw);
    return { isAdmin: Boolean(parsed?.isAdmin), user: parsed?.user || null };
  } catch {
    return { isAdmin: false, user: null };
  }
}

/**
 * Log in via Appwrite Email and Password
 */
export async function loginWithEmail(email, password) {
  if (account) {
    try {
      const session = await account.createEmailPasswordSession(email, password);
      const user = await account.get();
      const adminState = { isAdmin: true, user: { email: user.email, name: user.name, id: user.$id } };
      localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(adminState));
      return adminState;
    } catch (err) {
      throw new Error(`Email login failed: ${err.message}`);
    }
  }

  // Fallback direct Admin passkey check
  if (password === 'admin123' || password === 'courseit2026') {
    const adminState = { isAdmin: true, user: { email, name: 'Admin (Local Passkey)' } };
    localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(adminState));
    return adminState;
  }

  throw new Error('Invalid credentials. Please verify your Appwrite account or admin passkey.');
}

/**
 * Trigger Appwrite Google OAuth2 Login
 */
export function loginWithGoogle() {
  if (!account) {
    throw new Error('Appwrite client is not configured.');
  }

  const redirectUrl = window.location.origin;
  // Appwrite OAuth flow redirects to Google and returns to current URL
  account.createOAuth2Session('google', redirectUrl, redirectUrl);
}

/**
 * Check active Appwrite session upon redirect / page reload
 */
export async function checkAppwriteSession() {
  if (!account) return getAdminState();

  try {
    const user = await account.get();
    if (user) {
      const adminState = { isAdmin: true, user: { email: user.email, name: user.name, id: user.$id } };
      localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(adminState));
      return adminState;
    }
  } catch {
    // Not logged in via Appwrite session
  }

  return getAdminState();
}

/**
 * Log out current admin session
 */
export async function logoutAdmin() {
  if (account) {
    try {
      await account.deleteSession('current');
    } catch (err) {
      console.warn('Session delete warning:', err.message);
    }
  }

  localStorage.removeItem(ADMIN_STORAGE_KEY);
  return { isAdmin: false, user: null };
}
