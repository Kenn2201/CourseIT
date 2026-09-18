import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  checkAppwriteSession,
  getAuthState,
  logoutUser,
  loginWithEmail,
  signupWithEmail,
  ADMIN_EMAIL,
  authenticatedFetch
} from '../lib/auth';

const AuthContext = createContext({
  user: null,
  isAuthenticated: false,
  isAdmin: false,
  isPending: false,
  quota: null,
  credits: null,
  loading: true,
  formatCredits: () => '—',
  refreshAuth: async () => {},
  refreshCredits: async () => {},
  logout: async () => {},
  login: async () => {},
  signup: async () => {}
});

export function AuthProvider({ children }) {
  const [authState, setAuthState] = useState(() => getAuthState());
  const [credits, setCredits] = useState(null);
  const [quota, setQuota] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchQuota = useCallback(async (user) => {
    try {
      const uId = user?.id || 'public_guest';
      const uEmail = user?.email || '';
      const uName = user?.name || '';

      const res = await authenticatedFetch(
        `/api/user/quota?userId=${encodeURIComponent(uId)}&email=${encodeURIComponent(uEmail)}&name=${encodeURIComponent(uName)}`
      );

      if (res.ok) {
        const data = await res.json();
        if (data && data.quota) {
          setQuota(data.quota);
          const raw = typeof data.quota.quota_remaining === 'number'
            ? data.quota.quota_remaining
            : (typeof data.quota.remaining === 'number' ? data.quota.remaining : null);
          setCredits(raw);
          return data.quota;
        }
      }
    } catch (err) {
      console.warn('[AuthContext] Failed to fetch quota:', err);
    }
    setQuota(null);
    setCredits(null);
    return null;
  }, []);

  const refreshAuth = useCallback(async () => {
    try {
      const liveState = await checkAppwriteSession();
      setAuthState(liveState);
      if (liveState?.isAuthenticated && liveState?.user) {
        setQuota(liveState.quota || null);
        setCredits(typeof liveState.quota?.quota_remaining === 'number'
          ? liveState.quota.quota_remaining : null);
      } else {
        setQuota(null);
        setCredits(3);
      }
      return liveState;
    } catch (err) {
      console.warn('[AuthContext] Session refresh error:', err);
      const cleanState = { isAuthenticated: false, isAdmin: false, user: null, quota: null };
      setAuthState(cleanState);
      setQuota(null);
      setCredits(3);
      return cleanState;
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshCredits = useCallback(async () => {
    if (authState?.user) {
      await fetchQuota(authState.user);
    } else {
      await fetchQuota(null);
    }
  }, [authState?.user, fetchQuota]);

  useEffect(() => {
    let mounted = true;

    refreshAuth().then(() => {
      if (mounted) setLoading(false);
    });

    const handleAuthEvent = () => {
      refreshAuth();
    };

    const handleQuotaEvent = (e) => {
      if (e?.detail?.quota) {
        const raw = typeof e.detail.quota.quota_remaining === 'number'
          ? e.detail.quota.quota_remaining
          : (typeof e.detail.quota.remaining === 'number' ? e.detail.quota.remaining : null);
        setCredits(raw);
        setQuota(e.detail.quota);
      } else {
        refreshCredits();
      }
    };

    window.addEventListener('courseit_auth_changed', handleAuthEvent);
    window.addEventListener('courseit_quota_updated', handleQuotaEvent);

    return () => {
      mounted = false;
      window.removeEventListener('courseit_auth_changed', handleAuthEvent);
      window.removeEventListener('courseit_quota_updated', handleQuotaEvent);
    };
  }, [refreshAuth, refreshCredits]);

  const formatCredits = useCallback((val) => {
    const num = typeof val === 'number' ? val : credits;
    return Number.isFinite(num) ? num.toFixed(1) : '—';
  }, [credits]);

  const handleLogout = useCallback(async () => {
    const res = await logoutUser();
    setAuthState(res);
    setQuota(null);
    setCredits(3);
    return res;
  }, []);

  const handleLogin = useCallback(async (email, password) => {
    const res = await loginWithEmail(email, password);
    setAuthState(res);
    if (res?.user) {
      await fetchQuota(res.user);
    }
    window.dispatchEvent(new Event('courseit_auth_changed'));
    return res;
  }, [fetchQuota]);

  const handleSignup = useCallback(async (name, email, password) => {
    return await signupWithEmail(name, email, password);
  }, []);

  const isAdmin = Boolean(
    authState?.isAdmin ||
    (authState?.user?.email && authState.user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase())
  );

  const isPending = Boolean(quota?.status === 'pending' && !isAdmin);

  return (
    <AuthContext.Provider
      value={{
        user: authState?.user || null,
        isAuthenticated: Boolean(authState?.isAuthenticated),
        isAdmin,
        isPending,
        quota: quota || authState?.quota || null,
        credits,
        loading,
        formatCredits,
        refreshAuth,
        refreshCredits,
        logout: handleLogout,
        login: handleLogin,
        signup: handleSignup
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Backward-compatible alias for CreditContext
export const useUserCredits = useAuth;
export const CreditProvider = AuthProvider;
