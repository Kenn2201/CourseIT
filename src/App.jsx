import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { MessageSquarePlus } from 'lucide-react';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import CourseDetail from './pages/CourseDetail';
import Admin from './pages/Admin';
import Profile from './pages/Profile';
import AuthCallback from './pages/AuthCallback';
import PasswordRecovery from './pages/PasswordRecovery';
import FeedbackModal from './components/FeedbackModal';
import LegalConsentModal from './components/LegalConsentModal';
import Maintenance from './pages/Maintenance';
import CourseTutor from './components/CourseTutor';
import { STARTER_COURSES } from './data/starterCourses';
import { getMaintenanceMode } from './lib/appwrite';
import { AuthProvider, useAuth } from './context/AuthContext';
import { hasUserConsented } from './lib/auth';

function AppContent() {
  const { user, isAuthenticated, isAdmin } = useAuth();
  const location = useLocation();
  const isCourseDetail = location.pathname.startsWith('/course/');
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [showConsent, setShowConsent] = useState(false);
  // Initialise from localStorage instantly so there's no flash-of-content on refresh
  const [isMaintenance, setIsMaintenance] = useState(
    import.meta.env.VITE_MAINTENANCE_MODE === 'true' ||
    localStorage.getItem('courseit_maintenance_mode') === 'true'
  );

  const checkMaintenance = useCallback(async () => {
    const on = await getMaintenanceMode();
    setIsMaintenance(on);
  }, []);

  // Poll Appwrite every 30 s so ALL browsers stay in sync
  useEffect(() => {
    checkMaintenance();
    const interval = setInterval(checkMaintenance, 30_000);

    // Also react instantly when the admin toggles on the SAME browser
    const handleLocalChange = () => checkMaintenance();
    window.addEventListener('courseit_maintenance_changed', handleLocalChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('courseit_maintenance_changed', handleLocalChange);
    };
  }, [checkMaintenance]);

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

  // If maintenance mode is active, block non-admin users across the app
  if (isMaintenance && !isAdmin && !location.pathname.startsWith('/auth/')) {
    return <Maintenance />;
  }

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
          <Route path="/auth/recover" element={<PasswordRecovery />} />
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

      {/* Floating Technical Companion on Lower Left (Available across routes) */}
      {!isCourseDetail && (
        <CourseTutor course={STARTER_COURSES[0]} mode="landing" />
      )}

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
