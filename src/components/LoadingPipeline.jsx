import React, { useEffect, useState } from 'react';
import { Globe, FileText, Cpu, Database, CheckCircle2 } from 'lucide-react';

const PIPELINE_STEPS = [
  {
    id: 'fetch',
    label: 'Fetching raw HTML from documentation URL',
    icon: Globe,
    description: 'Bypassing browser CORS and fetching complete HTML'
  },
  {
    id: 'readability',
    label: 'Extracting content with Mozilla Readability',
    icon: FileText,
    description: 'Stripping navbars, sidebars, headers, and advertisement DOM nodes'
  },
  {
    id: 'gemini',
    label: 'Generating action-first steps with Gemini',
    icon: Cpu,
    description: 'Enforcing 5 rules: 1 concept/step, time estimates, zero filler language'
  },
  {
    id: 'save',
    label: 'Finalizing and persisting course',
    icon: Database,
    description: 'Saving structured learning path to Appwrite'
  }
];

export default function LoadingPipeline() {
  const [activeStepIndex, setActiveStepIndex] = useState(0);

  useEffect(() => {
    // Progress through visual stages to give rich feedback while LLM call executes
    const timer1 = setTimeout(() => setActiveStepIndex(1), 1200);
    const timer2 = setTimeout(() => setActiveStepIndex(2), 2400);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  return (
    <div className="w-full glass-panel rounded-2xl p-6 sm:p-8 border border-indigo-500/30 shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-3 h-3 rounded-full bg-indigo-500 animate-ping" />
        <h3 className="text-lg font-semibold text-white">Pipeline in Progress...</h3>
      </div>

      <div className="space-y-4">
        {PIPELINE_STEPS.map((step, idx) => {
          const Icon = step.icon;
          const isDone = idx < activeStepIndex;
          const isCurrent = idx === activeStepIndex;

          return (
            <div
              key={step.id}
              className={`flex items-start gap-4 p-3.5 rounded-xl border transition-all ${
                isCurrent
                  ? 'bg-indigo-500/10 border-indigo-500/40 text-white'
                  : isDone
                  ? 'bg-slate-900/60 border-slate-800 text-slate-400'
                  : 'bg-slate-950/40 border-slate-900 text-slate-600'
              }`}
            >
              <div
                className={`p-2 rounded-lg mt-0.5 ${
                  isCurrent
                    ? 'bg-indigo-600 text-white animate-bounce'
                    : isDone
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-slate-900 text-slate-600'
                }`}
              >
                {isDone ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className={`text-sm font-medium ${isCurrent ? 'text-indigo-200' : isDone ? 'text-slate-300' : 'text-slate-500'}`}>
                    {step.label}
                  </p>
                  {isCurrent && (
                    <span className="text-xs font-mono text-indigo-400 animate-pulse">Running...</span>
                  )}
                  {isDone && (
                    <span className="text-xs font-mono text-emerald-400">Done</span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{step.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
