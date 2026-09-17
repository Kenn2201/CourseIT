import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, Layers, ArrowUpRight, CheckCircle, Trash2, User } from 'lucide-react';
import { getCompletedSteps } from '../lib/storage';

export default function CourseCard({ course, onDelete, currentUser = null, isAdmin = false }) {
  const steps = course.steps || [];
  const completedSteps = getCompletedSteps(course.$id);
  const isComplete = steps.length > 0 && completedSteps.length >= steps.length;

  const isStarter = Boolean(course.is_curated || course.$id?.startsWith('starter-'));
  const isGuest = Boolean(course.is_guest || course.creator_id === 'public_guest' || (!course.creator_id && !isStarter));
  const isOwner = Boolean(currentUser?.id && course.creator_id && course.creator_id === currentUser.id);
  const canDelete = isAdmin || (isOwner && !isStarter);

  const creatorLabel = isStarter
    ? 'CourseIT Team'
    : isGuest
    ? 'Guest (24h)'
    : (course.creator_name || course.creator_email?.split('@')[0] || 'User');

  let hostname = 'docs';
  try {
    hostname = new URL(course.source_url).hostname;
  } catch {}

  // Calculate approximate total time
  const totalMinutes = steps.reduce((acc, s) => {
    const match = (s.time_estimate || '').match(/\d+/);
    return acc + (match ? parseInt(match[0], 10) : 10);
  }, 0);

  const formattedDate = course.$createdAt 
    ? new Date(course.$createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    : 'Recent';

  const handleDelete = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onDelete && canDelete) {
      onDelete(course);
    }
  };

  return (
    <Link
      to={`/course/${course.$id}`}
      className="glass-card rounded-2xl p-6 flex flex-col justify-between group relative overflow-hidden transition-all duration-300 hover:border-indigo-500/40 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-950/20"
    >
      <div>
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <span className="text-xs font-mono text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 rounded-md truncate max-w-[170px]">
            {hostname}
          </span>
          <div className="flex items-center gap-1.5">
            {isComplete ? (
              <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                <CheckCircle className="w-3 h-3" />
                Done
              </span>
            ) : (
              <span className="text-xs text-slate-500">{formattedDate}</span>
            )}

            {onDelete && canDelete && (
              <button
                type="button"
                onClick={handleDelete}
                title="Delete this course"
                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer ml-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}

            <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
          </div>
        </div>

        {/* Creator Attribution Badge */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[11px] font-medium text-slate-400 bg-slate-900/80 border border-slate-700/60 px-2 py-0.5 rounded-md inline-flex items-center gap-1.5">
            <span className="text-slate-500">By</span>
            <span className="text-slate-200 font-semibold truncate max-w-[130px]">{creatorLabel}</span>
            {isGuest && (
              <span className="text-[9px] font-mono text-amber-300 bg-amber-500/20 px-1 py-0.2 rounded border border-amber-500/30">
                24h Expire
              </span>
            )}
          </span>
        </div>

        <h3 className="text-lg font-bold text-white group-hover:text-indigo-200 transition-colors line-clamp-2 leading-snug mb-3">
          {course.title}
        </h3>
      </div>

      <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-1.5">
          <Layers className="w-4 h-4 text-indigo-400" />
          <span>{steps.length} action steps</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-slate-400" />
          <span>~{totalMinutes} min</span>
        </div>
      </div>
    </Link>
  );
}
