import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  BookOpen, 
  Sparkles, 
  User, 
  ShieldCheck, 
  LogIn, 
  LogOut, 
  LayoutDashboard, 
  Terminal, 
  Compass, 
  RefreshCw, 
  CheckCircle2, 
  ChevronDown, 
  ChevronRight,
  ArrowRight
} from 'lucide-react';
import { isAppwriteConfigured } from '../lib/appwrite';
import { getAuthState, checkAppwriteSession, logoutUser } from '../lib/auth';
import { CURRENT_VERSION_LABEL } from '../constants/version';
import { useUserCredits } from '../context/CreditContext';
import ChangelogModal from './ChangelogModal';
import AdminModal from './AdminModal';
import FeedbackModal from './FeedbackModal';

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
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  // Authoritative credit state from single source of truth
  const { credits, formatCredits } = useUserCredits();

  // Close user menu on outside click or route change
  useEffect(() => {
    setIsUserMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const isAppRoute = location.pathname === '/app' || location.pathname === '/dashboard';
  const isLandingRoute = location.pathname === '/';

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
                  <span>{CURRENT_VERSION_LABEL}</span>
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

            {/* Prominent Dashboard Link when Authenticated and on Landing Page */}
            {authState?.isAuthenticated && isLandingRoute && (
              <Link
                to="/app"
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-md shadow-indigo-600/30 transition-all cursor-pointer active:scale-95"
              >
                <span>Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}

            {/* Generator Switch Link when not on App Route and not authenticated */}
            {!isAppRoute && !authState?.isAuthenticated && (
              <Link
                to="/app"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 border border-slate-800 hover:border-indigo-500/40 text-slate-300 hover:text-white transition-all shadow-sm"
              >
                <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                <span>Launch App</span>
              </Link>
            )}

            {/* Overview Link for App Route when logged out */}
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

            {/* AUTH STATE CONTROLS */}
            {isCheckingSession ? (
              // Verifying session skeleton
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-400 font-mono animate-pulse">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                <span className="hidden sm:inline">Verifying session...</span>
              </div>
            ) : authState?.isAuthenticated ? (
              // Consolidated User Profile Menu Dropdown
              <div className="relative" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsUserMenuOpen((prev) => !prev)}
                  className="flex items-center gap-2 pl-2 pr-2.5 sm:pr-3 py-1.5 rounded-xl text-xs font-medium bg-slate-900 border border-indigo-500/30 hover:border-indigo-500/60 text-slate-200 transition-all cursor-pointer shadow-sm shadow-indigo-950/30 group"
                  aria-expanded={isUserMenuOpen}
                  aria-haspopup="true"
                >
                  <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-xs text-white font-bold group-hover:scale-105 transition-transform">
                    {authState?.user?.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <span className="font-semibold text-white truncate max-w-[90px] sm:max-w-[120px]">
                    {authState?.user?.name || 'User'}
                  </span>
                  <span className="px-1.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-300 font-mono text-[11px] font-bold border border-indigo-500/20">
                    {formatCredits(credits)}
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isUserMenuOpen ? 'rotate-180 text-white' : ''}`} />
                </button>

                {/* Animated Dropdown Menu */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-slate-800 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95">
                    {/* User Info & Credit Status Header */}
                    <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 mb-2">
                      <p className="text-xs font-bold text-white truncate">{authState?.user?.name || 'User'}</p>
                      <p className="text-[11px] text-slate-400 truncate">{authState?.user?.email || ''}</p>
                      <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between">
                        <span className="text-[11px] text-slate-400">Credits Available</span>
                        <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                          {formatCredits(credits)} Cr
                        </span>
                      </div>
                      {authState?.user?.is_active && (
                        <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-emerald-400 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          <span>Active Beta Tester</span>
                        </div>
                      )}
                    </div>

                    {/* Navigation Items */}
                    <div className="space-y-1">
                      <Link
                        to="/app"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors"
                      >
                        <Terminal className="w-4 h-4 text-indigo-400" />
                        <span>Studio / Generator</span>
                      </Link>
                      <Link
                        to="/profile"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors"
                      >
                        <User className="w-4 h-4 text-violet-400" />
                        <span>Profile & History</span>
                      </Link>
                      {authState?.isAdmin && (
                        <Link
                          to="/admin"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-amber-300 hover:text-amber-200 hover:bg-amber-500/10 transition-colors"
                        >
                          <ShieldCheck className="w-4 h-4 text-amber-400" />
                          <span>Admin Panel</span>
                        </Link>
                      )}
                    </div>

                    <div className="my-1.5 border-t border-slate-800/80" />

                    {/* Sign Out Action */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        handleHeaderSignOut();
                      }}
                      disabled={isSigningOut}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {isSigningOut ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <LogOut className="w-4 h-4" />
                      )}
                      <span>{isSigningOut ? 'Signing out...' : 'Sign Out'}</span>
                    </button>
                  </div>
                )}
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
