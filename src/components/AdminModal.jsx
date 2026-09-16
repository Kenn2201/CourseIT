import React, { useState } from 'react';
import { X, ShieldCheck, Mail, Lock, LogOut, CheckCircle2, AlertCircle } from 'lucide-react';
import { loginWithEmail, loginWithGoogle, logoutAdmin } from '../lib/auth';

export default function AdminModal({ isOpen, onClose, adminState, onAdminChange }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const state = await loginWithEmail(email, password);
      onAdminChange(state);
      setSuccessMsg('Admin authenticated successfully!');
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      setError(err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    try {
      loginWithGoogle();
    } catch (err) {
      setError(err.message || 'Failed to initiate Google OAuth.');
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      const state = await logoutAdmin();
      onAdminChange(state);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="glass-panel w-full max-w-md rounded-3xl p-6 sm:p-8 border border-indigo-500/30 shadow-2xl relative overflow-hidden">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-mono mb-2">
              <ShieldCheck className="w-3.5 h-3.5 text-violet-400" />
              <span>Admin Authentication</span>
            </div>
            <h3 className="text-xl font-bold text-white">
              {adminState?.isAdmin ? 'Admin Dashboard Active' : 'Admin Portal'}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {adminState?.isAdmin 
                ? 'You have unlimited generation and management rights.' 
                : 'Log in to unlock unlimited course generation.'}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {adminState?.isAdmin ? (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-slate-400">Authenticated Account:</p>
                <p className="text-sm font-semibold text-white truncate">
                  {adminState.user?.email || adminState.user?.name || 'Admin'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              disabled={loading}
              className="w-full py-3 bg-slate-900 hover:bg-rose-500/20 border border-slate-800 hover:border-rose-500/30 text-slate-300 hover:text-rose-300 font-medium rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out Admin Session</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Google OAuth Login Button */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-white font-medium rounded-xl flex items-center justify-center gap-3 transition-colors cursor-pointer text-sm"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Continue with Google</span>
            </button>

            <div className="flex items-center gap-3 my-2">
              <div className="flex-1 h-px bg-slate-800" />
              <span className="text-xs text-slate-500 uppercase font-mono">or email</span>
              <div className="flex-1 h-px bg-slate-800" />
            </div>

            <form onSubmit={handleEmailLogin} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="kenn@kenncode.me"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center gap-2 text-rose-300 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2 text-emerald-300 text-xs">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-sm font-medium rounded-xl transition-all shadow-lg shadow-indigo-600/25 cursor-pointer mt-2"
              >
                {loading ? 'Authenticating...' : 'Sign In as Admin'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
