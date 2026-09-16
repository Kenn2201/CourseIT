import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Clock, Layers, Sparkles, CheckCircle2, Share2, Check } from 'lucide-react';
import StepItem from '../components/StepItem';
import ProgressBar from '../components/ProgressBar';
import { getCourse } from '../lib/appwrite';
import { getCompletedSteps, toggleStep, resetCourseProgress } from '../lib/storage';

export default function CourseDetail() {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [completedSteps, setCompletedSteps] = useState([]);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    async function fetchCourse() {
      setLoading(true);
      setError('');
      try {
        const data = await getCourse(id);
        setCourse(data);
        setCompletedSteps(getCompletedSteps(id));
      } catch (err) {
        console.error('Failed to load course:', err);
        setError(err.message || 'Course not found.');
      } finally {
        setLoading(false);
      }
    }

    fetchCourse();
  }, [id]);

  const handleToggle = (stepNumber) => {
    const updated = toggleStep(id, stepNumber);
    setCompletedSteps(updated);
  };

  const handleReset = () => {
    resetCourseProgress(id);
    setCompletedSteps([]);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-400 text-sm">Loading course details...</p>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="glass-panel p-8 rounded-2xl border border-rose-500/20">
          <p className="text-rose-400 font-semibold mb-2">Error Loading Course</p>
          <p className="text-slate-400 text-sm mb-6">{error}</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-500 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const steps = course.steps || [];
  const totalMinutes = steps.reduce((acc, s) => {
    const match = (s.time_estimate || '').match(/\d+/);
    return acc + (match ? parseInt(match[0], 10) : 10);
  }, 0);

  const isAllComplete = steps.length > 0 && completedSteps.length >= steps.length;

  let sourceDomain = 'Documentation';
  try {
    sourceDomain = new URL(course.source_url).hostname;
  } catch {}

  return (
    <div className="min-h-screen pb-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-8">
        {/* Navigation & Header */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Back to Dashboard</span>
          </Link>

          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            {copiedLink ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Link Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5" />
                <span>Share Course</span>
              </>
            )}
          </button>
        </div>

        {/* Course Header Banner */}
        <div className="glass-panel rounded-3xl p-6 sm:p-10 border border-slate-800 shadow-2xl relative overflow-hidden mb-8">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span className="text-xs font-mono text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full">
                {sourceDomain}
              </span>

              {course.source_url && (
                <a
                  href={course.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-indigo-300 transition-colors"
                >
                  <span>View Original Documentation</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight mb-4">
              {course.title}
            </h1>

            {course.overview && (
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed mb-4 max-w-3xl">
                {course.overview}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-slate-400 pt-4 border-t border-slate-800/80">
              <div className="flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-indigo-400" />
                <span>{steps.length} Action-First Steps</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>~{totalMinutes} min Total Learning Time</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>Code Examples • 1 Concept / Step</span>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Tracker */}
        <div className="mb-8">
          <ProgressBar
            totalSteps={steps.length}
            completedCount={completedSteps.length}
            onReset={handleReset}
          />
        </div>

        {/* Completed Celebration Banner */}
        {isAllComplete && (
          <div className="mb-8 p-6 rounded-2xl bg-gradient-to-r from-emerald-950/60 to-slate-900/80 border border-emerald-500/40 shadow-xl flex items-center gap-4 animate-in fade-in">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-white">Course Complete!</h4>
              <p className="text-xs sm:text-sm text-emerald-300/80 mt-0.5">
                You have completed all {steps.length} steps in this learning path.
              </p>
            </div>
          </div>
        )}

        {/* Steps List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-bold text-white">Learning Steps & Implementation</h2>
            <span className="text-xs text-slate-400">Click any step or checkbox to mark done</span>
          </div>

          {steps.map((step) => {
            const stepNum = step.step_number;
            const isCompleted = completedSteps.includes(stepNum);

            return (
              <StepItem
                key={stepNum}
                step={step}
                isCompleted={isCompleted}
                onToggle={() => handleToggle(stepNum)}
              />
            );
          })}
        </div>

        {/* Recommended Next Step Card */}
        {course.recommended_next_step && (
          <div className="mt-10 glass-panel rounded-2xl p-6 sm:p-8 border border-indigo-500/30 bg-gradient-to-br from-indigo-950/40 to-slate-900/80 relative overflow-hidden">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shrink-0">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-indigo-400 font-semibold">
                  Recommended Next Step
                </span>
                <h3 className="text-lg font-bold text-white mt-1 mb-2">
                  What to Build / Explore Next
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {course.recommended_next_step}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
