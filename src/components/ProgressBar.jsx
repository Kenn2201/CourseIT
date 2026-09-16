import React from 'react';
import { CheckCircle2, RotateCcw } from 'lucide-react';

export default function ProgressBar({ totalSteps, completedCount, onReset }) {
  const percentage = totalSteps > 0 ? Math.round((completedCount / totalSteps) * 100) : 0;

  return (
    <div className="glass-panel rounded-2xl p-5 border border-slate-800">
      <div className="flex items-center justify-between gap-4 mb-3">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-semibold text-white">Course Progress</span>
          <span className="text-xs font-mono text-slate-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded">
            {completedCount} of {totalSteps} steps ({percentage}%)
          </span>
        </div>

        {completedCount > 0 && (
          <button
            type="button"
            onClick={onReset}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        )}
      </div>

      <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 via-violet-500 to-emerald-400 transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
