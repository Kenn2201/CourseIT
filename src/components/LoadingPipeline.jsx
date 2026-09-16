import React, { useEffect, useState } from 'react';
import { Globe, FileText, Cpu, Database, CheckCircle2, Sparkles, RefreshCw } from 'lucide-react';

const PIPELINE_STEPS = [
  {
    id: 'fetch',
    label: 'Extracting source documentation & stripping noise',
    icon: Globe,
    description: 'Bypassing CORS, stripping navigation trees, footers, and scripts'
  },
  {
    id: 'readability',
    label: 'Parsing core concepts & hierarchical steps',
    icon: FileText,
    description: 'Isolating genuine code blocks, installation guides, and API contracts'
  },
  {
    id: 'gemini',
    label: 'Synthesizing action-first path with Google Gemini',
    icon: Cpu,
    description: 'Enforcing action-first steps, time estimates (~10 min), and pro tips'
  },
  {
    id: 'save',
    label: 'Archiving course & updating credit quotas',
    icon: Database,
    description: 'Persisting structured learning modules into Appwrite Sydney database'
  }
];

export default function LoadingPipeline() {
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [pct, setPct] = useState(15);

  useEffect(() => {
    const t1 = setTimeout(() => { setActiveStepIndex(1); setPct(40); }, 1200);
    const t2 = setTimeout(() => { setActiveStepIndex(2); setPct(75); }, 2600);
    const t3 = setTimeout(() => { setActiveStepIndex(3); setPct(92); }, 5000);

    const interval = setInterval(() => {
      setPct((p) => (p < 95 ? p + 1 : p));
    }, 400);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="w-full glass-panel rounded-3xl p-6 sm:p-8 border border-indigo-500/30 shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
      {/* Animated glowing top line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-emerald-400 animate-pulse" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <RefreshCw className="w-5 h-5 animate-spin" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">Synthesizing Course Pipeline</h3>
            <p className="text-xs text-slate-400">Extracting and structuring into practical actionable modules</p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto font-mono text-xs font-bold text-indigo-300">
          <span>{pct}% complete</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800 mb-6">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 via-violet-500 to-emerald-400 transition-all duration-300 rounded-full"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Pipeline Steps Visualizer */}
      <div className="space-y-3.5">
        {PIPELINE_STEPS.map((step, idx) => {
          const Icon = step.icon;
          const isDone = idx < activeStepIndex;
          const isCurrent = idx === activeStepIndex;

          return (
            <div
              key={step.id}
              className={`flex items-start gap-4 p-3 rounded-2xl border transition-all duration-300 ${
                isCurrent
                  ? 'bg-indigo-600/10 border-indigo-500/40 shadow-md shadow-indigo-500/5'
                  : isDone
                  ? 'bg-slate-900/30 border-emerald-500/20 opacity-85'
                  : 'bg-slate-900/15 border-transparent opacity-40'
              }`}
            >
              <div
                className={`mt-0.5 w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border transition-all ${
                  isDone
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : isCurrent
                    ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300 scale-105 animate-pulse'
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-500'
                }`}
              >
                {isDone ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
              </div>

              <div className="flex-1 min-w-0">
                <p className={`text-xs font-semibold ${isCurrent ? 'text-white' : isDone ? 'text-slate-200' : 'text-slate-400'}`}>
                  {step.label}
                </p>
                <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">
                  {step.description}
                </p>
              </div>

              {isCurrent && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 animate-pulse shrink-0">
                  Processing
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
