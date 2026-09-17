import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MessageSquarePlus } from 'lucide-react';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import CourseDetail from './pages/CourseDetail';
import Admin from './pages/Admin';
import Profile from './pages/Profile';
import AuthCallback from './pages/AuthCallback';
import FeedbackModal from './components/FeedbackModal';
import LegalConsentModal from './components/LegalConsentModal';
import { CreditProvider } from './context/CreditContext';
import { getAuthState, checkAppwriteSession, hasUserConsented } from './lib/auth';

export default function App() {
  const [authState, setAuthState] = useState(getAuthState());
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [showConsent, setShowConsent] = useState(false);

  useEffect(() => {
    checkAppwriteSession().then((state) => {
      setAuthState(state);
      if (state?.isAuthenticated && !hasUserConsented(state.user)) {
        setShowConsent(true);
      }
    });

    const handleAuthEvent = () => {
      checkAppwriteSession().then((state) => {
        setAuthState(state);
        if (state?.isAuthenticated && !hasUserConsented(state.user)) {
          setShowConsent(true);
        }
      });
    };

    window.addEventListener('courseit_auth_changed', handleAuthEvent);
    window.addEventListener('courseit_quota_updated', handleAuthEvent);

    return () => {
      window.removeEventListener('courseit_auth_changed', handleAuthEvent);
      window.removeEventListener('courseit_quota_updated', handleAuthEvent);
    };
  }, []);

  const handleConsentAccepted = () => {
    setShowConsent(false);
    // Trigger Changelog "What's New" modal right after consent agreement
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('courseit_open_changelog'));
    }, 200);
  };

  return (
    <BrowserRouter>
      <CreditProvider>
        <div className="min-h-screen flex flex-col font-sans transition-colors duration-200 selection:bg-indigo-500/30 selection:text-indigo-200">
          <Navbar />
          <main className="flex-1">
            <Routes>
              {/* Root route renders Landing page. When logged in, Navbar and Hero feature direct 'Dashboard ->' link */}
              <Route
                path="/"
                element={<Landing onLaunchApp={() => (window.location.href = '/app')} />}
              />
              {/* Direct App Generator Route */}
              <Route path="/app" element={<Dashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />

              <Route path="/course/:id" element={<CourseDetail />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/auth/success" element={<AuthCallback type="success" />} />
              <Route path="/auth/failure" element={<AuthCallback type="failure" />} />
              <Route path="/auth" element={<Navigate to="/" replace />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>

          {/* Floating Beta Feedback Button for Logged-In Users */}
          {authState?.isAuthenticated && (
            <button
              type="button"
              onClick={() => setIsFeedbackOpen(true)}
              className="fixed bottom-6 right-24 z-40 flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xl shadow-emerald-900/40 border border-emerald-400/40 hover:scale-105 active:scale-95 transition-all cursor-pointer"
              title="Submit Beta Feedback"
            >
              <MessageSquarePlus className="w-4 h-4" />
              <span className="hidden sm:inline">Beta Feedback</span>
            </button>
          )}

          <FeedbackModal
            isOpen={isFeedbackOpen}
            onClose={() => setIsFeedbackOpen(false)}
            user={authState?.user}
          />

          {/* Mandatory First-Login Legal Consent Modal */}
          <LegalConsentModal
            isOpen={showConsent}
            user={authState?.user}
            onConsentAccepted={handleConsentAccepted}
          />
        </div>
      </CreditProvider>
    </BrowserRouter>
  );
}
