import React from 'react';
import { X, Sparkles, Code2, Zap, ShieldCheck, KeyRound, ArrowRight, ExternalLink } from 'lucide-react';

const HIGHLIGHTS = [
  {
    icon: Code2,
    color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
    title: 'Concrete Code Snippets & Editor Instructions',
    description: 'Steps are no longer abstract todo items. Each step now features step-by-step editor navigation, practical workflow instructions, and runnable code/GDScript snippets with 1-click copy.'
  },
  {
    icon: Zap,
    color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    title: 'Instant URL Deduplication Cache',
    description: 'Pasting any documentation link that was already summarized returns the full course instantly (<50ms) using 0 LLM tokens and 0 extra database writes.'
  },
  {
    icon: ShieldCheck,
    color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    title: 'Public Credits & Quota Safeguards',
    description: 'To protect Gemini Free Tier quotas, public visitors receive 20 free course generation credits. You can always explore and study all existing courses for free.'
  },
  {
    icon: KeyRound,
    color: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
    title: 'Admin Mode (Google Auth & Email Login)',
    description: 'Project admins can log in via Google OAuth or Appwrite Email/Password to unlock unlimited course generations and full administrative privileges.'
  }
];

export default function ChangelogModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="glass-panel w-full max-w-2xl rounded-3xl p-6 sm:p-8 border border-indigo-500/30 shadow-2xl relative overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="absolute -right-20 -top-20 w-60 h-60 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-mono mb-2">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Public Release Announcement</span>
            </div>
            <h2 className="text-2xl font-extrabold text-white tracking-tight">
              What's New in CourseIT <span className="text-indigo-400">v1.1.0</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Upgrading from a simple step list to a developer-grade interactive learning platform.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Highlights List */}
        <div className="space-y-4 relative z-10 mb-8">
          {HIGHLIGHTS.map((h) => {
            const Icon = h.icon;
            return (
              <div key={h.title} className="glass-card rounded-2xl p-4.5 border border-slate-800/80 flex items-start gap-4">
                <div className={`p-2.5 rounded-xl border shrink-0 ${h.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm sm:text-base font-bold text-white mb-1">{h.title}</h4>
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">{h.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 relative z-10">
          <span className="text-xs font-mono text-slate-500">
            Semantic Version: v1.1.0 • Built with Gemini 3.6 & Appwrite
          </span>

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-sm font-medium rounded-xl transition-all shadow-lg shadow-indigo-600/25 cursor-pointer"
          >
            Explore CourseIT
          </button>
        </div>
      </div>
    </div>
  );
}
