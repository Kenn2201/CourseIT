import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getAuthState, checkAppwriteSession } from '../lib/auth';

const CreditContext = createContext({
  credits: 250,
  quota: null,
  loading: false,
  refreshCredits: async () => {},
  formatCredits: () => '250.0'
});

export function CreditProvider({ children }) {
  const [credits, setCredits] = useState(250);
  const [quota, setQuota] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchCredits = useCallback(async (user) => {
    try {
      const uId = user?.id || 'public_guest';
      const uEmail = user?.email || '';
      const uName = user?.name || '';

      const res = await fetch(
        `/api/user/quota?userId=${encodeURIComponent(uId)}&email=${encodeURIComponent(uEmail)}&name=${encodeURIComponent(uName)}`
      );

      if (res.ok) {
        const data = await res.json();
        if (data && data.quota) {
          setQuota(data.quota);
          const raw = typeof data.quota.quota_remaining === 'number'
            ? data.quota.quota_remaining
            : (typeof data.quota.remaining === 'number' ? data.quota.remaining : 250);
          setCredits(raw);
          return raw;
        }
      }
    } catch (err) {
      console.warn('Failed to fetch credit quota:', err);
    }
    return null;
  }, []);

  const refreshCredits = useCallback(async () => {
    setLoading(true);
    try {
      const authState = await checkAppwriteSession();
      if (authState?.user) {
        await fetchCredits(authState.user);
      }
    } finally {
      setLoading(false);
    }
  }, [fetchCredits]);

  useEffect(() => {
    const authState = getAuthState();
    if (authState?.user) {
      fetchCredits(authState.user);
    }

    const handleQuotaUpdated = (e) => {
      if (e?.detail?.quota) {
        const raw = typeof e.detail.quota.quota_remaining === 'number'
          ? e.detail.quota.quota_remaining
          : (typeof e.detail.quota.remaining === 'number' ? e.detail.quota.remaining : 250);
        setCredits(raw);
        setQuota(e.detail.quota);
      } else {
        refreshCredits();
      }
    };

    const handleAuthChanged = () => {
      checkAppwriteSession().then((state) => {
        if (state?.user) {
          fetchCredits(state.user);
        }
      });
    };

    window.addEventListener('courseit_quota_updated', handleQuotaUpdated);
    window.addEventListener('courseit_auth_changed', handleAuthChanged);

    return () => {
      window.removeEventListener('courseit_quota_updated', handleQuotaUpdated);
      window.removeEventListener('courseit_auth_changed', handleAuthChanged);
    };
  }, [fetchCredits, refreshCredits]);

  const formatCredits = useCallback((val) => {
    const num = typeof val === 'number' ? val : credits;
    return num.toFixed(1);
  }, [credits]);

  return (
    <CreditContext.Provider
      value={{
        credits,
        quota,
        loading,
        refreshCredits,
        formatCredits
      }}
    >
      {children}
    </CreditContext.Provider>
  );
}

export function useUserCredits() {
  const context = useContext(CreditContext);
  if (!context) {
    throw new Error('useUserCredits must be used within a CreditProvider');
  }
  return context;
}
