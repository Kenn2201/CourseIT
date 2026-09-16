import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Sparkles, ShieldCheck, UserCheck, KeyRound } from 'lucide-react';
import { isAppwriteConfigured } from '../lib/appwrite';
import { getAdminState, checkAppwriteSession } from '../lib/auth';
import ChangelogModal from './ChangelogModal';
import AdminModal from './AdminModal';

export default function Navbar() {
  const isLive = isAppwriteConfigured();
  const [adminState, setAdminState] = useState(getAdminState());
  const [isChangelogOpen, setIsChangelogOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  useEffect(() => {
    // Check if session exists on load or redirect
    checkAppwriteSession().then(state => setAdminState(state));
  }, []);

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-white tracking-tight">CourseIT</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setIsChangelogOpen(true);
                  }}
                  className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 transition-colors cursor-pointer flex items-center gap-1"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                  <span>v1.1</span>
                </button>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">Action-first docs learning paths</p>
            </div>
          </Link>

          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* What's New Announcement Button */}
            <button
              type="button"
              onClick={() => setIsChangelogOpen(true)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-slate-900 border border-slate-800 hover:border-indigo-500/40 transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>What's New</span>
            </button>

            {/* Admin Portal Toggle */}
            <button
              type="button"
              onClick={() => setIsAdminOpen(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                adminState?.isAdmin
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              {adminState?.isAdmin ? (
                <>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Admin Mode</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Admin</span>
                </>
              )}
            </button>

            {/* Appwrite Live status pill */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border bg-slate-900/90 border-slate-800">
              <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              <span className={`hidden sm:inline ${isLive ? 'text-emerald-300' : 'text-amber-300'}`}>
                {isLive ? 'Appwrite Live' : 'Local'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Changelog & Admin Modals */}
      <ChangelogModal isOpen={isChangelogOpen} onClose={() => setIsChangelogOpen(false)} />
      <AdminModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        adminState={adminState}
        onAdminChange={(newState) => setAdminState(newState)}
      />
    </>
  );
}
