import React from 'react';
import { Clock, Check, Copy, CheckCheck } from 'lucide-react';

export default function StepItem({ step, isCompleted, onToggle }) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = (e) => {
    e.stopPropagation();
    const text = `${step.title}\nTime: ${step.time_estimate}\n${step.summary}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const stepNumber = String(step.step_number || 1).padStart(2, '0');

  return (
    <div
      onClick={onToggle}
      className={`glass-panel rounded-2xl p-6 transition-all cursor-pointer border relative overflow-hidden group ${
        isCompleted
          ? 'bg-slate-900/40 border-emerald-500/20 opacity-80'
          : 'hover:border-indigo-500/40 hover:bg-slate-900/70 border-slate-800'
      }`}
    >
      <div className="flex items-start gap-4">
        {/* Interactive Checkbox */}
        <button
          type="button"
          aria-label={isCompleted ? 'Mark step as incomplete' : 'Mark step as complete'}
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          className={`w-7 h-7 mt-0.5 rounded-lg flex items-center justify-center transition-all cursor-pointer border ${
            isCompleted
              ? 'bg-emerald-500 border-emerald-400 text-slate-950 shadow-md shadow-emerald-500/25'
              : 'border-slate-700 bg-slate-900/80 text-transparent group-hover:border-indigo-500/60'
          }`}
        >
          <Check className={`w-4 h-4 stroke-[3] ${isCompleted ? 'text-slate-950' : 'text-slate-600'}`} />
        </button>

        {/* Step Content */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2.5">
              <span className="font-mono text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">
                STEP {stepNumber}
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-mono text-amber-400/90 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md">
                <Clock className="w-3 h-3" />
                {step.time_estimate}
              </span>
            </div>

            <button
              type="button"
              onClick={handleCopy}
              title="Copy step details"
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              {copied ? <CheckCheck className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          <h3
            className={`text-base sm:text-lg font-bold transition-colors ${
              isCompleted ? 'text-slate-400 line-through' : 'text-white'
            }`}
          >
            {step.title}
          </h3>

          <p
            className={`mt-2 text-sm leading-relaxed transition-colors ${
              isCompleted ? 'text-slate-500' : 'text-slate-300'
            }`}
          >
            {step.summary}
          </p>
        </div>
      </div>
    </div>
  );
}
