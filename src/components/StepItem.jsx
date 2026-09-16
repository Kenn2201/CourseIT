import React, { useState } from 'react';
import { Clock, Check, Copy, CheckCheck, Terminal, Wrench, Lightbulb, ChevronDown, ChevronUp } from 'lucide-react';

export default function StepItem({ step, isCompleted, onToggle }) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  const handleCopyAll = (e) => {
    e.stopPropagation();
    let text = `${step.title}\nTime: ${step.time_estimate}\n${step.summary}`;
    if (step.implementation) text += `\n\nImplementation:\n${step.implementation}`;
    if (step.code_snippet) text += `\n\nCode:\n${step.code_snippet}`;
    if (step.pro_tip) text += `\n\nPro-Tip:\n${step.pro_tip}`;

    navigator.clipboard.writeText(text);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const handleCopyCodeOnly = (e) => {
    e.stopPropagation();
    if (!step.code_snippet) return;
    navigator.clipboard.writeText(step.code_snippet);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const stepNumber = String(step.step_number || 1).padStart(2, '0');
  const hasRichContent = Boolean(step.implementation || step.code_snippet || step.pro_tip);

  return (
    <div
      className={`glass-panel rounded-2xl p-6 transition-all border relative overflow-hidden group ${
        isCompleted
          ? 'bg-slate-900/40 border-emerald-500/20 opacity-85'
          : 'hover:border-indigo-500/40 hover:bg-slate-900/70 border-slate-800'
      }`}
    >
      <div className="flex items-start gap-4">
        {/* Interactive Checkbox */}
        <button
          type="button"
          aria-label={isCompleted ? 'Mark step as incomplete' : 'Mark step as complete'}
          onClick={onToggle}
          className={`w-7 h-7 mt-0.5 rounded-lg flex items-center justify-center transition-all cursor-pointer border shrink-0 ${
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

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleCopyAll}
                title="Copy all step content"
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                {copiedAll ? <CheckCheck className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>

              {hasRichContent && (
                <button
                  type="button"
                  onClick={() => setIsExpanded(!isExpanded)}
                  title={isExpanded ? 'Collapse implementation' : 'Expand implementation'}
                  className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              )}
            </div>
          </div>

          <h3
            onClick={onToggle}
            className={`text-base sm:text-lg font-bold transition-colors cursor-pointer ${
              isCompleted ? 'text-slate-400 line-through' : 'text-white hover:text-indigo-200'
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

          {/* Rich Implementation & Code Section */}
          {hasRichContent && isExpanded && (
            <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-3 animate-in fade-in duration-200">
              {/* Practical Implementation Steps */}
              {step.implementation && (
                <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-300 mb-1.5">
                    <Wrench className="w-3.5 h-3.5" />
                    <span>How to Implement / Setup:</span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-mono whitespace-pre-line">
                    {step.implementation}
                  </p>
                </div>
              )}

              {/* Code Snippet Box */}
              {step.code_snippet && (
                <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
                  <div className="flex items-center justify-between px-3.5 py-2 bg-slate-900/90 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-[11px] font-mono text-slate-400">Code / Example Syntax</span>
                    </div>

                    <button
                      type="button"
                      onClick={handleCopyCodeOnly}
                      className="flex items-center gap-1 text-[11px] font-mono text-slate-400 hover:text-white px-2 py-0.5 rounded hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      {copiedCode ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy Code</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="p-3.5 overflow-x-auto">
                    <pre className="text-xs font-mono text-emerald-300 leading-relaxed">
                      <code>{step.code_snippet}</code>
                    </pre>
                  </div>
                </div>
              )}

              {/* Pro-Tip Callout */}
              {step.pro_tip && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2.5">
                  <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-semibold text-amber-300">Pro-Tip / Gotcha: </span>
                    <span className="text-xs text-amber-200/90 leading-relaxed">{step.pro_tip}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
