import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BookOpen, Sparkles, User, ShieldCheck, LogIn, LogOut, LayoutDashboard, Terminal, Compass, MessageSquarePlus, RefreshCw, CheckCircle2 } from 'lucide-react';
import { isAppwriteConfigured } from '../lib/appwrite';
import { getAuthState, checkAppwriteSession, logoutUser } from '../lib/auth';
import ChangelogModal from './ChangelogModal';
import AdminModal from './AdminModal';
import FeedbackModal from './FeedbackModal';
import ThemeToggle from './ThemeToggle';

export default function Navbar() {
  const isLive = isAppwriteConfigured();
  const location = useLocation();
  const [authState, setAuthState] = useState(getAuthState());
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutNotice, setSignOutNotice] = useState(false);
  const [signInNotice, setSignInNotice] = useState(false);
  const [isChangelogOpen, setIsChangelogOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

  useEffect(() => {
    // Check if session exists on load or OAuth redirect
    checkAppwriteSession().then(state => {
      setAuthState(state);
      setIsCheckingSession(false);
    }).catch(() => {
      setIsCheckingSession(false);
    });

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
      checkAppwriteSession().then(state => {
        const wasAuthenticated = authState?.isAuthenticated;
        setAuthState(state);
        setIsCheckingSession(false);
        if (!wasAuthenticated && state?.isAuthenticated) {
          setSignInNotice(true);
          setTimeout(() => setSignInNotice(false), 2500);
        }
      });
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
  }, [authState?.isAuthenticated]);

  const handleCloseChangelog = () => {
    setIsChangelogOpen(false);
    try {
      localStorage.setItem('courseit_changelog_seen', Date.now().toString());
    } catch {}
  };

  const handleHeaderSignOut = async () => {
    setIsSigningOut(true);
    try {
      await logoutUser();
      setSignOutNotice(true);
      setTimeout(() => {
        setSignOutNotice(false);
        setIsSigningOut(false);
      }, 1500);
    } catch (err) {
      console.error('Sign out failed:', err);
      setIsSigningOut(false);
    }
  };

  const handleOpenAuth = (mode = 'login') => {
    setAuthMode(mode);
    setIsAuthOpen(true);
  };

  const remainingCredits = authState?.quota?.quota_remaining ?? 250;
  const isAppRoute = location.pathname === '/app' || location.pathname === '/dashboard';

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-slate-950/85 backdrop-blur-md transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
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
                  <span>v1.7.0 BETA</span>
                </button>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">Action-first docs learning paths</p>
            </div>
          </Link>

          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Quick Transition Feedback Banners */}
            {signInNotice && (
              <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold animate-in fade-in zoom-in-95">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Welcome back, {authState?.user?.name || 'User'}!</span>
              </div>
            )}

            {signOutNotice && (
              <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 text-xs font-semibold animate-in fade-in zoom-in-95">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
                <span>Signed out cleanly</span>
              </div>
            )}

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

            {/* AUTH STATE CONTROLS IN HEADER */}
            {isCheckingSession ? (
              // Verifying-session skeleton/loader to avoid flash of wrong UI
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-400 font-mono animate-pulse">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                <span className="hidden sm:inline">Verifying session...</span>
              </div>
            ) : authState?.isAuthenticated ? (
              // Authenticated User Controls: Profile pill + Direct Sign Out
              <div className="flex items-center gap-1.5">
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

                <button
                  type="button"
                  onClick={handleHeaderSignOut}
                  disabled={isSigningOut}
                  className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-rose-300 hover:bg-rose-500/10 border border-slate-800 hover:border-rose-500/30 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                  title="Sign Out"
                >
                  {isSigningOut ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-rose-400" />
                  ) : (
                    <LogOut className="w-3.5 h-3.5 text-slate-400 group-hover:text-rose-300" />
                  )}
                  <span className="hidden sm:inline">{isSigningOut ? 'Signing out...' : 'Sign Out'}</span>
                </button>
              </div>
            ) : (
              // Unauthenticated User Controls: Direct Sign In in Header
              <button
                type="button"
                onClick={() => handleOpenAuth('login')}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 transition-all cursor-pointer active:scale-95"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In / Join</span>
              </button>
            )}

            {/* Theme Toggle (Universal Light / Dark with PixelSwap animation) */}
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
        initialMode={authMode}
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
