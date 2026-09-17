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
import { AuthProvider, useAuth } from './context/AuthContext';
import { hasUserConsented } from './lib/auth';

function AppContent() {
  const { user, isAuthenticated } = useAuth();
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [showConsent, setShowConsent] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user && !hasUserConsented(user)) {
      setShowConsent(true);
    } else {
      setShowConsent(false);
    }
  }, [isAuthenticated, user]);

  const handleConsentAccepted = () => {
    setShowConsent(false);
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('courseit_open_changelog'));
    }, 200);
  };

  return (
    <div className="min-h-screen flex flex-col font-sans transition-colors duration-200 selection:bg-indigo-500/30 selection:text-indigo-200">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route
            path="/"
            element={<Landing onLaunchApp={() => (window.location.href = '/app')} />}
          />
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
      {isAuthenticated && (
        <button
          type="button"
          onClick={() => setIsFeedbackOpen(true)}
          className="fixed bottom-20 right-6 z-40 flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xl shadow-emerald-900/40 border border-emerald-400/40 hover:scale-105 active:scale-95 transition-all cursor-pointer"
          title="Submit Beta Feedback"
        >
          <MessageSquarePlus className="w-4 h-4" />
          <span className="hidden sm:inline">Beta Feedback</span>
        </button>
      )}

      <FeedbackModal
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
        user={user}
      />

      {/* Mandatory First-Login Legal Consent Modal */}
      <LegalConsentModal
        isOpen={showConsent}
        user={user}
        onConsentAccepted={handleConsentAccepted}
      />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}
