import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { BookOpen, Sparkles, Search, Layers, AlertCircle, RefreshCw, Star, ShieldCheck, BrainCircuit } from 'lucide-react';
import UrlInputForm from '../components/UrlInputForm';
import LoadingPipeline from '../components/LoadingPipeline';
import CourseCard from '../components/CourseCard';
import AdminModal from '../components/AdminModal';
import CourseSuccessModal from '../components/CourseSuccessModal';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import Footer from '../components/Footer';
import ChangelogModal from '../components/ChangelogModal';
import { listCourses, saveLocalCourse } from '../lib/appwrite';
import { getAuthState, checkAppwriteSession } from '../lib/auth';

export default function Dashboard() {
  const navigate = useNavigate();
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

    try {
      const currentAuth = getAuthState();
      const isAdmin = currentAuth.isAdmin;
      const userId = currentAuth.user?.id || null;

      let response;
      if (inputPayload && typeof inputPayload === 'object' && inputPayload.type === 'document') {
        // Document OCR extraction flow
        response = await fetch('/api/summarize-text', {
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
            isAdmin
          })
        });
      } else {
        // URL extraction flow
        const targetUrl = typeof inputPayload === 'object' ? inputPayload.url : inputPayload;
        const targetModel = typeof inputPayload === 'object' ? inputPayload.model : legacyModel;

        response = await fetch('/api/summarize', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-mode': isAdmin ? 'true' : 'false'
          },
          body: JSON.stringify({
            url: targetUrl,
            model: targetModel,
            userId,
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
      await fetch('/api/courses/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId: course.$id })
      });

      const updated = courses.filter((c) => c.$id !== course.$id);
      setCourses(updated);
      try {
        localStorage.setItem('courseit_saved_courses', JSON.stringify(updated));
      } catch {}
      setCourseToDelete(null);
    } catch (err) {
      console.error('Failed to delete course:', err);
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

  return (
    <div className="min-h-screen flex flex-col justify-between animate-page-load">
      <div>
        {/* Hero Header */}
        <section className="relative pt-12 pb-8 sm:pt-16 sm:pb-12 overflow-hidden">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-mono mb-6">
                <BrainCircuit className="w-3.5 h-3.5 text-indigo-400" />
                <span>SaaS v1.4.1 BETA &bull; ADHD Anti-Fluff Action Engine &bull; Multi-Framework</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.1] mb-6">
                Turn dense docs & scans into{' '}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-violet-300 to-emerald-400">
                  action-first courses.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-300/90 leading-relaxed max-w-2xl mx-auto mb-8">
                Paste a developer documentation URL or drop a tutorial scan. CourseIT removes 100% of conversational AI fluff and distills it into practical numbered steps, code commands, and verified pro tips.
              </p>
            </div>

            {/* Form / URL & Document Dropzone */}
            <UrlInputForm
              onSubmit={handleGenerate}
              isLoading={isGenerating}
              quota={quota}
              isAdmin={authState.isAdmin}
              isAuthenticated={authState.isAuthenticated}
              onOpenAdmin={() => setIsAuthModalOpen(true)}
            />

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
          </div>
        </section>

        {/* Saved Courses Section */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12 border-t border-slate-800/80">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight">Interactive Course Catalog</h2>
              <p className="text-xs text-slate-400 mt-1">
                Browse curated starter tutorials and your generated courses across React, Godot, Rust, and Docker
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
                    ? 'No courses match your filter. Try a different keyword.'
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
                  onDelete={(c) => setCourseToDelete(c)}
                />
              ))}
            </div>
          )}
        </section>
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
        onClose={() => setSuccessCourse(null)}
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
