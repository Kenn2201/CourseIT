import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { BookOpen, Sparkles, Search, Layers, AlertCircle, RefreshCw, Star, ShieldCheck, BrainCircuit, Clock, HelpCircle, Settings, User, CheckCircle2, Lock, ArrowRight, Zap, ExternalLink } from 'lucide-react';
import UrlInputForm from '../components/UrlInputForm';
import LoadingPipeline from '../components/LoadingPipeline';
import CourseCard from '../components/CourseCard';
import AdminModal from '../components/AdminModal';
import CourseSuccessModal from '../components/CourseSuccessModal';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import Footer from '../components/Footer';
import ChangelogModal from '../components/ChangelogModal';
import DashboardSidebar from '../components/DashboardSidebar';
import GenerationHistory from '../components/GenerationHistory';
import ThemeToggle from '../components/ThemeToggle';
import { listCourses, saveLocalCourse } from '../lib/appwrite';
import { getAuthState, checkAppwriteSession, authenticatedFetch } from '../lib/auth';

export default function Dashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'history' | 'profile' | 'settings' | 'help'
  const [courses, setCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [generateError, setGenerateError] = useState('');
  const [quota, setQuota] = useState({ total: 250, used: 0, remaining: 250, quota_remaining: 250 });
  const [authState, setAuthState] = useState(getAuthState());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isChangelogOpen, setIsChangelogOpen] = useState(false);
  const [successCourse, setSuccessCourse] = useState(null);
  const [successQuota, setSuccessQuota] = useState(null);
  const [successFallback, setSuccessFallback] = useState(null);
  const [courseToDelete, setCourseToDelete] = useState(null);
  const [isDeletingCourse, setIsDeletingCourse] = useState(false);

  const loadQuota = async (user) => {
    try {
      const uId = user?.id || 'public_guest';
      const uEmail = user?.email || '';
      const res = await fetch(`/api/user/quota?userId=${encodeURIComponent(uId)}&email=${encodeURIComponent(uEmail)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.quota) {
          setQuota(data.quota);
        }
      }
    } catch {}
  };

  const loadCourses = async (user = authState?.user, isAdmin = authState?.isAdmin) => {
    setLoadingCourses(true);
    try {
      const data = await listCourses(user?.id, isAdmin);
      setCourses(data);
    } catch (err) {
      console.error('Error fetching courses:', err);
    } finally {
      setLoadingCourses(false);
    }
  };

  useEffect(() => {
    checkAppwriteSession().then(state => {
      setAuthState(state);
      loadQuota(state?.user);
      loadCourses(state?.user, state?.isAdmin);
    });

    const handleQuotaEvent = () => {
      checkAppwriteSession().then(state => {
        setAuthState(state);
        loadQuota(state?.user);
      });
    };
    window.addEventListener('courseit_quota_updated', handleQuotaEvent);
    return () => window.removeEventListener('courseit_quota_updated', handleQuotaEvent);
  }, []);

  const handleGenerate = async (inputPayload, legacyModel) => {
    setIsGenerating(true);
    setGenerateError('');
    setSuccessFallback(null);

    try {
      const currentAuth = getAuthState();
      const isAdmin = currentAuth.isAdmin;
      const userId = currentAuth.user?.id || null;
      const userEmail = currentAuth.user?.email || '';

      let response;
      if (inputPayload && typeof inputPayload === 'object' && inputPayload.type === 'document') {
        // Document OCR extraction flow with verified session JWT
        response = await authenticatedFetch('/api/summarize-text', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-mode': isAdmin ? 'true' : 'false'
          },
          body: JSON.stringify({
            title: inputPayload.title,
            text: inputPayload.text,
            model: inputPayload.model,
            userId,
            userEmail,
            isAdmin
          })
        });
      } else {
        // URL extraction flow with verified session JWT
        const targetUrl = typeof inputPayload === 'object' ? inputPayload.url : inputPayload;
        const targetModel = typeof inputPayload === 'object' ? inputPayload.model : legacyModel;

        response = await authenticatedFetch('/api/summarize', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-mode': isAdmin ? 'true' : 'false'
          },
          body: JSON.stringify({
            url: targetUrl,
            model: targetModel,
            userId,
            userEmail,
            isAdmin
          })
        });
      }

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate course.');
      }

      if (data.quota) {
        setQuota(data.quota);
        window.dispatchEvent(new Event('courseit_quota_updated'));
      }

      const newCourse = data.course;
      saveLocalCourse(newCourse);
      await loadCourses();

      setIsGenerating(false);
      setSuccessQuota(data.quota);
      setSuccessFallback(data.fallbackNotice || null);
      setSuccessCourse(newCourse);
    } catch (err) {
      console.error('Generation failed:', err);
      setGenerateError(err.message || 'An unexpected error occurred while processing.');
      setIsGenerating(false);
    }
  };

  const handleConfirmDeleteCourse = async (course) => {
    if (!course) return;
    setIsDeletingCourse(true);
    try {
      const res = await authenticatedFetch('/api/courses/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: course.$id,
          userId: authState?.user?.id,
          userEmail: authState?.user?.email
        })
      });

      const data = await res.json();
      if (!res.ok || data.success === false) {
        throw new Error(data.error || 'Failed to delete course');
      }

      const updated = courses.filter((c) => c.$id !== course.$id);
      setCourses(updated);
      try {
        localStorage.setItem('courseit_saved_courses', JSON.stringify(updated));
      } catch {}
      setCourseToDelete(null);
    } catch (err) {
      console.error('Failed to delete course:', err);
      alert(err.message || 'Failed to delete course.');
    } finally {
      setIsDeletingCourse(false);
    }
  };

  const filteredCourses = courses.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      (c.title || '').toLowerCase().includes(q) ||
      (c.source_url || '').toLowerCase().includes(q)
    );
  });

  const userGenerationsCount = courses.filter(c => !c.is_curated && !c.$id?.startsWith('starter-')).length;

  return (
    <div className="min-h-screen flex flex-col justify-between animate-page-load transition-colors duration-200">
      <div className="flex flex-col md:flex-row flex-1">
        {/* Application Shell Sidebar */}
        <DashboardSidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          authState={authState}
          historyCount={userGenerationsCount}
        />

        {/* Main Content Workspace */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl w-full mx-auto">
          {/* TAB 1: STUDIO & COURSES GENERATOR */}
          {activeTab === 'dashboard' && (
            <div className="space-y-10">
              {/* Studio Header Banner */}
              <div className="text-center max-w-3xl mx-auto pt-4">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-mono mb-4">
                  <BrainCircuit className="w-3.5 h-3.5 text-indigo-400" />
                  <span>SaaS v1.7.0 &bull; ADHD Anti-Fluff Action Engine &bull; Multi-Framework</span>
                </div>

                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-[1.15] mb-4">
                  Turn dense docs & scans into{' '}
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-violet-300 to-emerald-400">
                    action-first courses.
                  </span>
                </h1>

                <p className="text-sm sm:text-base text-slate-300/90 leading-relaxed max-w-2xl mx-auto">
                  Paste a developer documentation URL or drop a tutorial scan. CourseIT removes 100% of conversational AI fluff and distills it into numbered steps, code commands, and verified pro tips.
                </p>
              </div>

              {/* Pending Admin Approval Banner */}
              {authState.isAuthenticated && authState.quota?.status === 'pending' && (
                <div className="max-w-2xl mx-auto p-4 sm:p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-sm flex items-start gap-3.5 shadow-lg shadow-amber-950/20 animate-in fade-in">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-300 shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-bold text-white text-base">Account Pending Admin Approval</p>
                    <p className="text-xs text-amber-200/90 leading-relaxed">
                      Your account ({authState.user?.email}) is currently in the queue for approval. You will receive an email once approved with <strong>250 free credits</strong>! In the meantime, you can explore the curated starter tutorials below.
                    </p>
                  </div>
                </div>
              )}

              {/* Interactive Generation Area (Clickable & Unobstructed) */}
              <div className="relative z-10">
                <UrlInputForm
                  onSubmit={handleGenerate}
                  isLoading={isGenerating}
                  quota={quota}
                  isAdmin={authState.isAdmin}
                  isAuthenticated={authState.isAuthenticated}
                  isPending={Boolean(authState.isAuthenticated && authState.quota?.status === 'pending')}
                  onOpenAdmin={() => setIsAuthModalOpen(true)}
                />
              </div>

              {/* In-Flight Pipeline Loading */}
              {isGenerating && (
                <div className="mt-8">
                  <LoadingPipeline />
                </div>
              )}

              {/* Error Message */}
              {generateError && (
                <div className="mt-8 max-w-2xl mx-auto p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-start gap-3 animate-in fade-in">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-semibold">Generation Failed</p>
                    <p className="text-xs text-rose-300/90 leading-relaxed">{generateError}</p>
                  </div>
                </div>
              )}

              {/* Saved Courses & Curated Catalog Section */}
              <section className="pt-8 border-t border-slate-800/80">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Interactive Course Catalog</h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Curated developer starters and your generated custom courses with creator attribution
                    </p>
                  </div>

                  {/* Search Filter Input */}
                  <div className="relative w-full sm:w-64">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Filter courses..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    />
                  </div>
                </div>

                {loadingCourses ? (
                  <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
                    <div className="w-8 h-8 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                    <span className="text-xs font-mono">Syncing courses from Appwrite...</span>
                  </div>
                ) : filteredCourses.length === 0 ? (
                  <div className="glass-panel p-12 rounded-3xl border border-slate-800 text-center space-y-4">
                    <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                      <BookOpen className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-white">No courses found</h3>
                      <p className="text-xs text-slate-400 mt-1">
                        {searchQuery
                          ? 'No courses match your search query.'
                          : 'Get started by entering a documentation URL or uploading an image above!'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredCourses.map((course) => (
                      <CourseCard
                        key={course.$id}
                        course={course}
                        currentUser={authState.user}
                        isAdmin={authState.isAdmin}
                        onDelete={(c) => setCourseToDelete(c)}
                      />
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}

          {/* TAB 2: GENERATION HISTORY & OCR UPLOADS */}
          {activeTab === 'history' && (
            <GenerationHistory
              courses={courses}
              onDeleteCourse={(c) => setCourseToDelete(c)}
              currentUser={authState.user}
              isAdmin={authState.isAdmin}
            />
          )}

          {/* TAB 3: PROFILE & CREDITS */}
          {activeTab === 'profile' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="border-b border-slate-800 pb-5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-mono mb-2">
                  <User className="w-3.5 h-3.5" />
                  <span>Account & Quota Overview</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  User Profile
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  Manage your credentials, verify approval status, and inspect reasoning credits.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-indigo-600/20">
                      {authState.user?.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">{authState.user?.name || 'Guest User'}</h3>
                      <p className="text-xs text-slate-400">{authState.user?.email || 'Not logged in'}</p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-800 space-y-2 text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>Status:</span>
                      <span className={`font-semibold capitalize ${authState.quota?.status === 'approved' ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {authState.quota?.status || (authState.isAuthenticated ? 'Approved' : 'Guest Trial')}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Credits Remaining:</span>
                      <span className="font-mono font-bold text-white">
                        {authState.isAuthenticated
                          ? `${(authState.quota?.quota_remaining ?? 250).toFixed(1)} / 250`
                          : `${authState.quota?.remaining ?? 3} / 3 Free Trials`}
                      </span>
                    </div>
                  </div>

                  <Link
                    to="/profile"
                    className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
                  >
                    <span>Open Full Profile & Prompt Manager</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
                  <h3 className="text-sm font-bold text-white">Need Additional Quota?</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Verified beta testers receive 250 free credits upon account approval. If you run out of credits while testing large documentation archives, administrators can issue instant credit top-ups.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsAuthModalOpen(true)}
                    className="w-full py-2.5 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-850 border border-slate-700 text-slate-200 transition-all cursor-pointer"
                  >
                    Request Quota Top-Up
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SETTINGS & PREFERENCES */}
          {activeTab === 'settings' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="border-b border-slate-800 pb-5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-mono mb-2">
                  <Settings className="w-3.5 h-3.5" />
                  <span>Workspace Preferences</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  Studio Settings
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  Customize your visual theme, synthesis pacing, and default model tiers.
                </p>
              </div>

              <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-6 max-w-2xl">
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <div>
                    <h4 className="text-sm font-semibold text-white">Color Theme</h4>
                    <p className="text-xs text-slate-400 mt-0.5">Toggle between Dark Mode and Light Mode with PixelSwap animation</p>
                  </div>
                  <ThemeToggle />
                </div>

                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <div>
                    <h4 className="text-sm font-semibold text-white">ADHD Anti-Fluff Level</h4>
                    <p className="text-xs text-slate-400 mt-0.5">Strict mode: 0 conversational filler, numbered steps, code commands only</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-xs font-bold">
                    ACTIVE (MAX)
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-white">Default Model Preference</h4>
                    <p className="text-xs text-slate-400 mt-0.5">Default reasoning tier for instant single-click generations</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 font-mono text-xs">
                    Flash Lite (0.5 cr)
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: HELP & ANTI-FLUFF DOCUMENTATION */}
          {activeTab === 'help' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="border-b border-slate-800 pb-5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-mono mb-2">
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Documentation & Guide</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  How CourseIT Works
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  Master the action-first learning engine and discover all supported documentation formats.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                    <Zap className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-white">ADHD Anti-Fluff Principles</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Most developers don't have the patience or attention span to read 20 pages of architectural context just to configure a button signal or build a container. CourseIT strips out conversational prose, leaving only the essential code snippets, step order, and pro tips.
                  </p>
                </div>

                <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-white">Supported Input Formats</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    You can paste any public documentation URL (e.g. Godot, React, Rust, Docker) or upload tutorial slides/scans via client-side OCR (PNG, JPG, WEBP, PDF, TXT, MD). Text is parsed before AI synthesis.
                  </p>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Developer Portfolio Footer */}
      <Footer onOpenChangelog={() => setIsChangelogOpen(true)} />

      {/* Modals */}
      <AdminModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        authState={authState}
        onAuthChange={(newState) => {
          setAuthState(newState);
          loadQuota(newState?.user);
        }}
      />

      <ChangelogModal
        isOpen={isChangelogOpen}
        onClose={() => setIsChangelogOpen(false)}
      />

      <CourseSuccessModal
        isOpen={Boolean(successCourse)}
        course={successCourse}
        quotaResult={successQuota}
        fallbackNotice={successFallback}
        onClose={() => {
          setSuccessCourse(null);
          setSuccessFallback(null);
        }}
      />

      <DeleteConfirmModal
        isOpen={Boolean(courseToDelete)}
        course={courseToDelete}
        onClose={() => setCourseToDelete(null)}
        onConfirm={handleConfirmDeleteCourse}
        isDeleting={isDeletingCourse}
      />
    </div>
  );
}
