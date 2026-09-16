import React from 'react';
import { X, Sparkles, CheckCircle2, ArrowRight, Clock, Layers, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function CourseSuccessModal({ isOpen, onClose, course, quotaResult }) {
  const navigate = useNavigate();

  if (!isOpen || !course) return null;

  const totalTime = course.steps?.reduce((acc, step) => {
    const match = (step.time_estimate || '').match(/(\d+)/);
    return acc + (match ? parseInt(match[1], 10) : 10);
  }, 0) || 25;

  const handleStart = () => {
    onClose();
    navigate(`/course/${course.$id}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="glass-panel w-full max-w-md rounded-3xl p-6 sm:p-8 border border-emerald-500/30 shadow-2xl relative overflow-hidden text-center space-y-6">
        <div className="absolute -top-20 -right-20 w-52 h-52 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-52 h-52 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-xl shadow-emerald-500/30">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-mono mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Generation Finished!</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight leading-snug">
              {course.title || 'Course Synthesized Successfully'}
            </h2>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-2 py-2">
            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <Layers className="w-4 h-4 text-indigo-400 mx-auto mb-1" />
              <p className="text-xs font-bold text-white">{course.steps?.length || 0} Steps</p>
              <p className="text-[10px] text-slate-500">Action-First</p>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <Clock className="w-4 h-4 text-violet-400 mx-auto mb-1" />
              <p className="text-xs font-bold text-white">~{totalTime} min</p>
              <p className="text-[10px] text-slate-500">Duration</p>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <Zap className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
              <p className="text-xs font-bold text-white">
                {quotaResult?.remaining !== undefined ? `${quotaResult.remaining.toFixed(1)} Left` : 'Active'}
              </p>
              <p className="text-[10px] text-slate-500">Credits</p>
            </div>
          </div>

          <div className="pt-2 flex flex-col gap-2.5">
            <button
              onClick={handleStart}
              className="btn-primary w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 cursor-pointer active:scale-98"
            >
              <span>Dive into Course</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="text-xs text-slate-400 hover:text-white py-1 transition-colors cursor-pointer"
            >
              Close and view catalog
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
