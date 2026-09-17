import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Clock, Layers, Sparkles, CheckCircle2, Share2, Check, Download, Printer, FileText, FileCode, ChevronDown, Lock } from 'lucide-react';
import StepItem from '../components/StepItem';
import ProgressBar from '../components/ProgressBar';
import CourseTutor from '../components/CourseTutor';
import AdminModal from '../components/AdminModal';
import { getCourse } from '../lib/appwrite';
import { getCompletedSteps, toggleStep, resetCourseProgress } from '../lib/storage';
import { useAuth } from '../context/AuthContext';

export default function CourseDetail() {
  const { id } = useParams();
  const { user, isAuthenticated, isAdmin, loading: authLoading } = useAuth();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [completedSteps, setCompletedSteps] = useState([]);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const exportRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (exportRef.current && !exportRef.current.contains(e.target)) {
        setIsExportOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (authLoading) return;

    async function fetchCourse() {
      setLoading(true);
      setError('');
      try {
        const data = await getCourse(id, user, isAdmin);
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
  }, [id, user, isAdmin, authLoading]);

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

  const handleExportMarkdown = () => {
    if (!course) return;
    const stepsList = course.steps || [];
    let md = `# ${course.title}\n\n`;
    if (course.source_url) {
      md += `*Source Documentation: [${course.source_url}](${course.source_url})*\n\n`;
    }
    if (course.overview) {
      md += `## Overview\n${course.overview}\n\n`;
    }
    md += `## Learning Path (${stepsList.length} Steps)\n\n`;
    stepsList.forEach((s, idx) => {
      md += `### Step ${s.step_number || idx + 1}: ${s.title} (${s.time_estimate || '~10 min'})\n\n`;
      if (s.summary) {
        md += `${s.summary}\n\n`;
      }
      if (s.implementation) {
        md += `#### How to Implement:\n${s.implementation}\n\n`;
      }
      if (s.code_snippet) {
        md += `\`\`\`\n${s.code_snippet}\n\`\`\`\n\n`;
      }
      if (s.pro_tip) {
        md += `> **Pro Tip:** ${s.pro_tip}\n\n`;
      }
      md += `---\n\n`;
    });
    if (course.recommended_next_step) {
      md += `## Recommended Next Step\n${course.recommended_next_step}\n`;
    }

    const slug = (course.title || 'course').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${slug}.md`;
    a.click();
    URL.revokeObjectURL(url);
    setIsExportOpen(false);
  };

  const handleExportDocx = () => {
    if (!course) return;
    const stepsList = course.steps || [];
    const slug = (course.title || 'course').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${course.title}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; padding: 40px; max-width: 800px; margin: auto; }
          h1 { color: #0f172a; font-size: 28px; border-bottom: 2px solid #6366f1; padding-bottom: 8px; }
          h2 { color: #334155; font-size: 20px; margin-top: 24px; }
          h3 { color: #4338ca; font-size: 16px; margin-top: 20px; }
          .meta { color: #64748b; font-size: 12px; margin-bottom: 20px; }
          .overview { background: #f8fafc; border-left: 4px solid #6366f1; padding: 14px 18px; margin: 16px 0; border-radius: 4px; font-size: 14px; }
          .step-card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0; background: #ffffff; }
          pre { background: #0f172a; color: #f8fafc; padding: 14px; border-radius: 6px; font-family: monospace; font-size: 12px; overflow-x: auto; white-space: pre-wrap; }
          .pro-tip { background: #eff6ff; border: 1px solid #bfdbfe; color: #1e40af; padding: 10px 14px; border-radius: 6px; font-size: 13px; margin-top: 12px; }
        </style>
      </head>
      <body>
        <h1>${course.title}</h1>
        <div class="meta">Generated by CourseIT &bull; ${stepsList.length} Action-First Steps</div>
        ${course.overview ? `<div class="overview"><strong>Overview:</strong> ${course.overview}</div>` : ''}
        <h2>Course Steps</h2>
        ${stepsList.map((s, idx) => `
          <div class="step-card">
            <h3>STEP ${s.step_number || idx + 1}: ${s.title} (${s.time_estimate || '~10 min'})</h3>
            <p>${s.summary || ''}</p>
            ${s.implementation ? `<p><strong>How to Implement:</strong><br>${s.implementation.replace(/\n/g, '<br>')}</p>` : ''}
            ${s.code_snippet ? `<pre><code>${s.code_snippet.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>` : ''}
            ${s.pro_tip ? `<div class="pro-tip"><strong>💡 Pro Tip:</strong> ${s.pro_tip}</div>` : ''}
          </div>
        `).join('')}
        ${course.recommended_next_step ? `<h2>Recommended Next Step</h2><p>${course.recommended_next_step}</p>` : ''}
      </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'application/msword;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${slug}.doc`;
    a.click();
    URL.revokeObjectURL(url);
    setIsExportOpen(false);
  };

  const handlePrintPdf = () => {
    setIsExportOpen(false);
    setTimeout(() => {
      window.print();
    }, 150);
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
    const isAuthRequired = error.includes('Authentication Required');
    const isForbidden = error.includes('Access Denied');

    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center animate-in fade-in">
        <div className={`glass-panel p-8 rounded-3xl border ${isAuthRequired ? 'border-indigo-500/30' : isForbidden ? 'border-rose-500/30' : 'border-slate-800'} space-y-4`}>
          <div className={`w-14 h-14 mx-auto rounded-2xl ${isAuthRequired ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30' : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'} flex items-center justify-center`}>
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-white">
            {isAuthRequired ? 'Private Course — Authentication Required' : isForbidden ? 'Access Restricted' : 'Course Not Found'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-md mx-auto">
            {isAuthRequired
              ? 'This custom-generated course is private to its author. Please sign in to verify your access credentials.'
              : isForbidden
              ? 'You do not have permission to view this custom course. Only the original author or system administrators may access it.'
              : (error || 'The requested course does not exist or may have expired.')}
          </p>
          <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3">
            {isAuthRequired && (
              <button
                type="button"
                onClick={() => setIsAuthModalOpen(true)}
                className="btn-primary py-2.5 px-5 rounded-xl font-semibold text-xs text-white cursor-pointer"
              >
                Sign In to View Course
              </button>
            )}
            <Link
              to="/app"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </Link>
          </div>
        </div>

        <AdminModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          initialMode="login"
          authState={{ isAuthenticated: false, user: null, isAdmin: false }}
          onAuthChange={() => window.location.reload()}
        />
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
        <div className="flex items-center justify-between gap-4 mb-6 print:hidden">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Back to Dashboard</span>
          </Link>

          <div className="flex items-center gap-2">
            {/* Export Menu Dropdown */}
            <div className="relative" ref={exportRef}>
              <button
                type="button"
                onClick={() => setIsExportOpen(!isExportOpen)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-200 bg-slate-900 border border-slate-700/80 hover:border-slate-600 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-indigo-400" />
                <span>Export</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {isExportOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-50 p-1.5 backdrop-blur-xl animate-in fade-in zoom-in-95">
                  <div className="px-2.5 py-1 text-[10px] uppercase font-bold tracking-wider text-slate-500 border-b border-slate-800 mb-1">
                    Export Format
                  </div>
                  <button
                    type="button"
                    onClick={handlePrintPdf}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-200 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer text-left"
                  >
                    <Printer className="w-4 h-4 text-indigo-400 shrink-0" />
                    <div>
                      <p className="font-semibold leading-none">Print / Save as PDF</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Clean textbook format</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={handleExportDocx}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-200 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer text-left"
                  >
                    <FileText className="w-4 h-4 text-blue-400 shrink-0" />
                    <div>
                      <p className="font-semibold leading-none">Word Document (.doc)</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Word & Docs flow</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={handleExportMarkdown}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-200 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer text-left"
                  >
                    <FileCode className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <p className="font-semibold leading-none">Markdown (.md)</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Raw developer notes</p>
                    </div>
                  </button>
                </div>
              )}
            </div>

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
        </div>

        {/* Course Header Banner */}
        <div className="glass-panel rounded-3xl p-6 sm:p-10 border border-slate-800 shadow-2xl relative overflow-hidden mb-8">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span className="text-xs font-mono text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full">
                {sourceDomain}
              </span>

              {/* Creator Attribution Badge */}
              <span className="inline-flex items-center gap-1.5 text-xs text-slate-300 bg-slate-900/80 border border-slate-700/60 px-3 py-1 rounded-full font-medium">
                <span className="text-slate-400">Created by</span>
                <strong className="text-white font-semibold">
                  {Boolean(course.is_curated || course.$id?.startsWith('starter-'))
                    ? 'CourseIT Team'
                    : Boolean(course.is_guest || course.creator_id === 'public_guest' || (!course.creator_id))
                    ? 'Guest (24h Trial)'
                    : (course.creator_name || course.creator_email?.split('@')[0] || 'Member')}
                </strong>
                {Boolean(course.is_guest || course.creator_id === 'public_guest') && (
                  <span className="text-[10px] font-mono text-amber-300 bg-amber-500/20 px-1.5 py-0.5 rounded border border-amber-500/30">
                    Expires in 24h
                  </span>
                )}
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

        {/* Scripted Technical Companion Bot */}
        <CourseTutor course={course} mode="course" />
      </div>
    </div>
  );
}
