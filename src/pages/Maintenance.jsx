import React, { useState } from 'react';
import { Wrench, Shield, RefreshCw, Lock, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AdminModal from '../components/AdminModal';
import { CURRENT_VERSION_LABEL } from '../constants/version';

export default function Maintenance({ onBypass }) {
  const { isAuthenticated, isAdmin, refreshAuth } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [checking, setChecking] = useState(false);

  const handleRefresh = () => {
    setChecking(true);
    setTimeout(() => {
      window.location.reload();
    }, 600);
  };

  const handleAdminAuthSuccess = async () => {
    if (refreshAuth) await refreshAuth();
    if (onBypass) onBypass();
    window.location.href = '/admin';
  };

  return (
    <div className="min-h-screen bg-[#070913] text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Ambient background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-amber-600/15 via-indigo-600/15 to-transparent rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full glass-panel rounded-3xl p-8 border border-amber-500/30 shadow-2xl relative z-10 text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
        {/* Animated Badge & Icon */}
        <div className="relative mx-auto w-20 h-20">
          <div className="w-20 h-20 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-xl shadow-amber-500/10">
            <Wrench className="w-10 h-10 animate-pulse" />
          </div>
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500"></span>
          </span>
        </div>

        {/* Heading & Details */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-mono font-semibold">
            <Shield className="w-3.5 h-3.5" />
            <span>Scheduled Maintenance Mode</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            CourseIT Ai is Upgrading
          </h1>

          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-sm mx-auto">
            We are currently rolling out critical infrastructure updates, model reasoning optimizations, and security patches. Public generation access is temporarily paused.
          </p>
        </div>

        {/* Status Card */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-left space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">System Status:</span>
            <span className="text-amber-400 font-mono font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              Upgrades In Progress
            </span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">Estimated Return:</span>
            <span className="text-slate-200 font-mono">~15-30 Minutes</span>
          </div>

          <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/80">
            <span className="text-slate-400 font-medium">Platform Release:</span>
            <span className="text-indigo-300 font-mono">{CURRENT_VERSION_LABEL}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={checking}
            className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-lg shadow-indigo-600/25 active:scale-98 cursor-pointer flex items-center justify-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
            <span>{checking ? 'Checking Status...' : 'Check If System Is Back Online'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAuthModalOpen(true)}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-900/60 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Administrator Bypass Sign In</span>
          </button>
        </div>
      </div>

      {/* Footer Branding */}
      <div className="mt-8 text-center text-xs text-slate-500 font-mono">
        CourseIT Ai &bull; Action-First Learning Synthesis Engine
      </div>

      {/* Admin Authentication Modal for Bypass */}
      <AdminModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode="login"
        onAuthChange={handleAdminAuthSuccess}
      />
    </div>
  );
}
