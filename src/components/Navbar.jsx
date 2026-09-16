import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BookOpen, Sparkles, User, ShieldCheck, LogIn, LayoutDashboard, Terminal, Compass, MessageSquarePlus } from 'lucide-react';
import { isAppwriteConfigured } from '../lib/appwrite';
import { getAuthState, checkAppwriteSession } from '../lib/auth';
import ChangelogModal from './ChangelogModal';
import AdminModal from './AdminModal';
import FeedbackModal from './FeedbackModal';
import ThemeToggle from './ThemeToggle';

export default function Navbar() {
  const isLive = isAppwriteConfigured();
  const location = useLocation();
  const [authState, setAuthState] = useState(getAuthState());
  const [isChangelogOpen, setIsChangelogOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

  useEffect(() => {
    // Check if session exists on load or OAuth redirect
    checkAppwriteSession().then(state => setAuthState(state));

    // First-time or 24-hour Changelog Pop-up
    try {
      const lastSeen = localStorage.getItem('courseit_changelog_seen');
      const now = Date.now();
      const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
      if (!lastSeen || now - parseInt(lastSeen, 10) > TWENTY_FOUR_HOURS) {
        setIsChangelogOpen(true);
      }
    } catch {}

    // Listen for custom quota, auth, and changelog updates
    const handleAuthEvent = () => {
      checkAppwriteSession().then(state => setAuthState(state));
    };
    const handleOpenChangelog = () => setIsChangelogOpen(true);

    window.addEventListener('courseit_quota_updated', handleAuthEvent);
    window.addEventListener('courseit_auth_changed', handleAuthEvent);
    window.addEventListener('courseit_open_changelog', handleOpenChangelog);

    return () => {
      window.removeEventListener('courseit_quota_updated', handleAuthEvent);
      window.removeEventListener('courseit_auth_changed', handleAuthEvent);
      window.removeEventListener('courseit_open_changelog', handleOpenChangelog);
    };
  }, []);

  const handleCloseChangelog = () => {
    setIsChangelogOpen(false);
    try {
      localStorage.setItem('courseit_changelog_seen', Date.now().toString());
    } catch {}
  };

  const remainingCredits = authState?.quota?.quota_remaining ?? 250;
  const isAppRoute = location.pathname === '/app' || location.pathname === '/dashboard';

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
                  <span>v1.5.0 BETA</span>
                </button>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">Action-first docs learning paths</p>
            </div>
          </Link>

          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Generator Switch Link */}
            {!isAppRoute && (
              <Link
                to="/app"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 border border-slate-800 hover:border-indigo-500/40 text-slate-300 hover:text-white transition-all shadow-sm"
              >
                <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                <span>Launch App</span>
              </Link>
            )}

            {isAppRoute && !authState?.isAuthenticated && (
              <Link
                to="/"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 border border-slate-800 hover:border-indigo-500/40 text-slate-300 hover:text-white transition-all shadow-sm"
              >
                <Compass className="w-3.5 h-3.5 text-indigo-400" />
                <span>Overview / Tour</span>
              </Link>
            )}

            {/* What's New Announcement Button */}
            <button
              type="button"
              onClick={() => setIsChangelogOpen(true)}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-slate-900 border border-slate-800 hover:border-indigo-500/40 transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>What's New</span>
            </button>

            {/* Beta Feedback Button (For Authenticated Users) */}
            {authState?.isAuthenticated && (
              <button
                type="button"
                onClick={() => setIsFeedbackOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25 transition-all cursor-pointer shadow-sm"
              >
                <MessageSquarePlus className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Beta Feedback</span>
              </button>
            )}

            {/* Admin Dashboard Quick Link (Only visible if Admin) */}
            {authState?.isAdmin && (
              <Link
                to="/admin"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-violet-600/20 border border-violet-500/40 text-violet-300 hover:bg-violet-600/30 transition-all shadow-sm"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Admin Panel</span>
              </Link>
            )}

            {/* User Session & Quotas Pill (Links to /profile) */}
            {authState?.isAuthenticated ? (
              <Link
                to="/profile"
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-900 border border-indigo-500/30 hover:border-indigo-500/60 text-slate-200 transition-all cursor-pointer shadow-sm shadow-indigo-950/30 group"
                title="View Profile & Manage Prompts"
              >
                <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-[10px] text-white font-bold group-hover:scale-105 transition-transform">
                  {authState?.user?.name?.[0]?.toUpperCase() || 'U'}
                </div>
                <span className="font-semibold text-white truncate max-w-[100px]">
                  {authState?.user?.name || 'User'}
                </span>
                <span className="text-slate-500 hidden sm:inline">•</span>
                <span className="text-indigo-300 font-mono font-bold hidden sm:inline">
                  {remainingCredits.toFixed(0)}/250 Cr
                </span>
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => setIsAuthOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 transition-all cursor-pointer active:scale-95"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In / Join</span>
              </button>
            )}

            {/* Theme Toggle (Dark / Light with PixelSwap animation) */}
            <ThemeToggle />

            {/* Database Sync Status indicator */}
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400">
              <span className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <span>{isLive ? 'Sydney' : 'Fallback'}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Modals */}
      <ChangelogModal
        isOpen={isChangelogOpen}
        onClose={handleCloseChangelog}
      />

      <AdminModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        authState={authState}
        onAuthChange={(newState) => setAuthState(newState)}
      />

      <FeedbackModal
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
        user={authState?.user}
      />
    </>
  );
}
