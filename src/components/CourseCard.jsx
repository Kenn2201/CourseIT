import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, Layers, ExternalLink, ArrowUpRight, CheckCircle } from 'lucide-react';
import { getCompletedSteps } from '../lib/storage';

export default function CourseCard({ course }) {
  const steps = course.steps || [];
  const completedSteps = getCompletedSteps(course.$id);
  const isComplete = steps.length > 0 && completedSteps.length >= steps.length;

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

  return (
    <Link
      to={`/course/${course.$id}`}
      className="glass-card rounded-2xl p-6 flex flex-col justify-between group relative overflow-hidden"
    >
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="text-xs font-mono text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 rounded-md truncate max-w-[200px]">
            {hostname}
          </span>
          <div className="flex items-center gap-2">
            {isComplete ? (
              <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                <CheckCircle className="w-3 h-3" />
                Done
              </span>
            ) : (
              <span className="text-xs text-slate-500">{formattedDate}</span>
            )}
            <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
          </div>
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
