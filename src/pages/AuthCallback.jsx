import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { ShieldCheck, AlertCircle, RefreshCw, ArrowRight } from 'lucide-react';
import { handleOAuthSuccess } from '../lib/auth';

export default function AuthCallback({ type = 'success' }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const hasRun = useRef(false);

  useEffect(() => {
    // Prevent React StrictMode double invocation from burning the one-time OAuth secret
    if (hasRun.current) return;
    hasRun.current = true;

    if (type === 'failure') {
      setLoading(false);
      setError('OAuth sign-in was cancelled or failed with the provider.');
      return;
    }

    const params = new URLSearchParams(location.search);
    const userId = params.get('userId');
    const secret = params.get('secret');

    // Immediately scrub secret from browser address bar to prevent reuse on reload
    try {
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch {}

    if (!userId || !secret) {
      setError('Missing OAuth authentication credentials from provider.');
      setLoading(false);
      return;
    }

    handleOAuthSuccess(userId, secret)
      .then(() => {
        window.dispatchEvent(new Event('courseit_auth_changed'));
        window.dispatchEvent(new Event('courseit_quota_updated'));
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 500);
      })
      .catch((err) => {
        console.error('OAuth token callback error:', err);
        // If session was already established, redirect gracefully
        if (err.message && (err.message.includes('creation of a session is prohibited') || err.message.includes('already active'))) {
          window.dispatchEvent(new Event('courseit_auth_changed'));
          navigate('/', { replace: true });
          return;
        }
        setError(err.message || 'Failed to complete OAuth authentication session.');
        setLoading(false);
      });
  }, [location, type, navigate]);

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4">
      <div className="glass-panel w-full max-w-md p-8 rounded-3xl border border-indigo-500/20 shadow-2xl text-center space-y-6">
        {loading ? (
          <div className="space-y-4">
            <div className="w-12 h-12 border-3 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto" />
            <div>
              <h2 className="text-xl font-bold text-white">Completing Sign-In...</h2>
              <p className="text-xs text-slate-400 mt-1">
                Verifying OAuth security token with Appwrite and loading your account credits.
              </p>
            </div>
          </div>
        ) : error ? (
          <div className="space-y-4 animate-in fade-in">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <AlertCircle className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Authentication Issue</h2>
              <p className="text-sm text-slate-400 mt-1 leading-relaxed">{error}</p>
            </div>
            <div className="pt-2">
              <Link
                to="/"
                className="btn-primary inline-flex items-center gap-2 py-2.5 px-6 rounded-xl text-xs font-semibold"
              >
                <span>Return to Home</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4 animate-in fade-in">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 animate-bounce">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Signed In Successfully!</h2>
              <p className="text-xs text-slate-400 mt-1">Redirecting you to CourseIT...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
