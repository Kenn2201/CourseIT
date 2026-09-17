import React, { useState } from 'react';
import { Clock, Check, Copy, CheckCheck, Terminal, Wrench, Lightbulb, ChevronDown, ChevronUp, ArrowRight } from 'lucide-react';

/**
 * Parses implementation text (often formatted like "1. Do this. 2. Do that.")
 * into distinct readable vertical instruction steps.
 */
function parseImplementationSteps(text) {
  if (!text) return [];
  
  // If it has numbered steps like "1. ... 2. ..."
  const splitRegex = /(?:^|\s)(?=\d+[\.\)]\s+)/;
  const parts = text.split(splitRegex).map(s => s.trim()).filter(Boolean);
  
  if (parts.length > 1) {
    return parts.map((part, idx) => {
      const clean = part.replace(/^\d+[\.\)]\s*/, '').trim();
      return { num: idx + 1, text: clean };
    });
  }

  // If separated by newlines
  const lines = text.split(/\r?\n/).map(l => l.trim().replace(/^[-*•]\s*/, '')).filter(Boolean);
  if (lines.length > 1) {
    return lines.map((line, idx) => ({ num: idx + 1, text: line }));
  }

  return [{ num: 1, text }];
}

/**
 * Highlights Godot / technical node identifiers with distinct badge styling
 */
function formatInstructionText(content) {
  if (!content) return '';
  // Identify common Godot nodes and keywords
  const keywords = /\b(Node2D|Sprite2D|Button|CollisionShape2D|Area2D|CharacterBody2D|Timer|AnimationPlayer|Label|Control|VBoxContainer|HBoxContainer|GDScript|extends|func|_ready|_process|emit_signal|connect)\b/g;
  
  const tokens = content.split(keywords);
  return tokens.map((tok, i) => {
    if (keywords.test(tok)) {
      return (
        <span
          key={i}
          className="inline-flex items-center px-1.5 py-0.5 mx-0.5 rounded-md bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 font-mono text-xs font-semibold"
        >
          {tok}
        </span>
      );
    }
    return tok;
  });
}

/**
 * Detects programming language or format from snippet syntax
 */
function detectSnippetLanguage(code) {
  if (!code) return 'Code Snippet';
  const trimmed = code.trim();
  if (/\b(FROM\s|RUN\s|COPY\s|WORKDIR\s|ENTRYPOINT\s|CMD\s|EXPOSE\s)/i.test(trimmed)) {
    return 'Dockerfile';
  }
  if (/^(docker\s|npm\s|npx\s|cargo\s|git\s|curl\s|yarn\s|pnpm\s|go\s|rustup\s|\$)/m.test(trimmed) || /^(bash|sh)$/i.test(trimmed)) {
    return 'Terminal / Bash';
  }
  if (/\b(extends\s|func\s|_ready|_process|emit_signal|@export|@onready)\b/.test(trimmed)) {
    return 'GDScript';
  }
  if (/\b(fn\s|let\s+mut\s|impl\s|pub\s+fn|println!|match\s|struct\s)/.test(trimmed)) {
    return 'Rust';
  }
  if (/\b(import\s|export\s|const\s|interface\s|type\s|useState|useEffect|<[A-Z]\w+)/.test(trimmed)) {
    return 'TypeScript / React';
  }
  if (/^\s*[\{\[]/.test(trimmed) && /[\}\]]\s*$/.test(trimmed)) {
    return 'JSON';
  }
  if (/\b(def\s|class\s|print\(|self\.)/.test(trimmed)) {
    return 'Python';
  }
  return 'Code Snippet';
}

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
  const parsedSteps = parseImplementationSteps(step.implementation);

  return (
    <div
      className={`glass-panel rounded-2xl p-6 transition-all border relative overflow-hidden group ${
        isCompleted
          ? 'bg-slate-900/40 border-emerald-500/25 opacity-90 shadow-sm shadow-emerald-950/20'
          : 'hover:border-indigo-500/50 hover:bg-slate-900/80 border-slate-800/90 shadow-lg shadow-black/20'
      }`}
    >
      <div className="flex items-start gap-4">
        {/* Interactive Checkbox */}
        <button
          type="button"
          aria-label={isCompleted ? 'Mark step as incomplete' : 'Mark step as complete'}
          onClick={onToggle}
          className={`w-7 h-7 mt-0.5 rounded-xl flex items-center justify-center transition-all cursor-pointer border shrink-0 ${
            isCompleted
              ? 'bg-emerald-500 border-emerald-400 text-slate-950 shadow-md shadow-emerald-500/30'
              : 'border-slate-700 bg-slate-900/80 text-transparent hover:border-indigo-500 group-hover:scale-105'
          }`}
        >
          <Check className={`w-4 h-4 stroke-[3] ${isCompleted ? 'text-slate-950' : 'text-slate-600'}`} />
        </button>

        {/* Step Content */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2.5">
              <span className="font-mono text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-lg border border-indigo-500/20 shadow-sm">
                STEP {stepNumber}
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-mono text-amber-400/90 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-lg">
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
            <div className="mt-5 pt-4 border-t border-slate-800/80 space-y-4 animate-in fade-in duration-200">
              {/* Practical Implementation Steps: Vertically Formatted Cards */}
              {parsedSteps.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-300 px-1">
                    <Wrench className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Step-by-Step Implementation:</span>
                  </div>

                  <div className="space-y-2">
                    {parsedSteps.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 hover:border-indigo-500/30 transition-all text-xs sm:text-sm text-slate-200 leading-relaxed font-sans"
                      >
                        <span className="shrink-0 w-6 h-6 rounded-lg bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 font-mono text-xs font-bold flex items-center justify-center mt-0.5">
                          {String(item.num).padStart(2, '0')}
                        </span>
                        <div className="flex-1 min-w-0">
                          {formatInstructionText(item.text)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Code Snippet Box with Modern IDE Header */}
              {step.code_snippet && (
                <div className="rounded-xl overflow-hidden border border-slate-800/90 bg-[#0d1117] shadow-xl">
                  <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-900/90 border-b border-slate-800/80">
                    {/* IDE Window Controls + Language Badge */}
                    <div className="flex items-center gap-2.5">
                      <div className="flex items-center gap-1.5 mr-1" aria-hidden="true">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block"></span>
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block"></span>
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block"></span>
                      </div>
                      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-800/70 border border-slate-700/50">
                        <Terminal className="w-3 h-3 text-indigo-400" />
                        <span className="text-[11px] font-mono text-slate-300 font-semibold tracking-wide">
                          {detectSnippetLanguage(step.code_snippet)}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleCopyCodeOnly}
                      className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400 hover:text-white px-2.5 py-1 rounded-md hover:bg-slate-800 transition-colors cursor-pointer border border-transparent hover:border-slate-700"
                    >
                      {copiedCode ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400 font-semibold">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="p-4 overflow-x-auto bg-[#090d13]">
                    <pre className="text-xs font-mono text-emerald-300/95 leading-relaxed selection:bg-emerald-900/40">
                      <code>{step.code_snippet}</code>
                    </pre>
                  </div>
                </div>
              )}

              {/* Pro-Tip / Gotcha Callout */}
              {step.pro_tip && (
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-3 shadow-sm">
                  <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 shrink-0 mt-0.5">
                    <Lightbulb className="w-4 h-4" />
                  </div>
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-amber-300 tracking-wide uppercase font-mono">
                      Pro-Tip / Common Gotcha
                    </div>
                    <p className="text-xs sm:text-sm text-amber-100/90 leading-relaxed font-sans">
                      {step.pro_tip}
                    </p>
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
