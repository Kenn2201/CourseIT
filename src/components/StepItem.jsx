import React, { useState, useEffect } from 'react';
import {
  Clock, Check, Copy, CheckCheck, Terminal, Wrench, Lightbulb,
  ChevronDown, ChevronUp, AlertTriangle, Target, CheckCircle2,
  XCircle, HelpCircle, ArrowRight, Sparkles, RefreshCw, Zap
} from 'lucide-react';
import { recordCheckpointAnswer, getCheckpointAnswers, getUnderstandingMap } from '../lib/storage';

/**
 * Highlights technical terms / keywords with distinct badge styling
 */
function formatInstructionText(content) {
  if (!content) return '';
  const keywords = /\b(Node2D|Sprite2D|Button|CollisionShape2D|Area2D|CharacterBody2D|Timer|AnimationPlayer|Label|Control|VBoxContainer|HBoxContainer|GDScript|extends|func|_ready|_process|emit_signal|connect|npm|npx|docker|git|cargo|pnpm|yarn|pip|brew)\b/g;
  
  const tokens = String(content).split(keywords);
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

export default function StepItem({
  step,
  courseId,
  totalSteps = 1,
  isCompleted,
  understandingStatus = 'unknown',
  onToggle,
  onCheckpointChange,
  onAskTutor
}) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);

  // Collapsible sections
  const [showWhy, setShowWhy] = useState(false);
  const [showExpected, setShowExpected] = useState(false);
  const [showWatchOut, setShowWatchOut] = useState(false);

  // Checkpoint interactive state (local, zero-cost)
  const stepNum = step.step_number || 1;
  const [checkpointState, setCheckpointState] = useState(() => {
    if (!courseId) return null;
    const answers = getCheckpointAnswers(courseId);
    return answers[stepNum] || null;
  });

  useEffect(() => {
    if (courseId) {
      const answers = getCheckpointAnswers(courseId);
      setCheckpointState(answers[stepNum] || null);
    }
  }, [courseId, stepNum]);

  const handleCheckpointSelect = (optIndex) => {
    if (!step.checkpoint) return;
    const isCorrect = optIndex === step.checkpoint.correctIndex;
    const newState = { selectedIndex: optIndex, isCorrect, answeredAt: Date.now() };
    setCheckpointState(newState);

    if (courseId) {
      recordCheckpointAnswer(courseId, stepNum, optIndex, isCorrect);
      onCheckpointChange?.(stepNum, isCorrect ? 'understood' : 'needs_review');
    }
  };

  const handleRetryCheckpoint = () => {
    setCheckpointState(null);
  };

  const handleCopyAll = (e) => {
    e.stopPropagation();
    let text = `${step.title}\nTime: ${step.time_estimate || '~10 min'}\nGoal: ${step.goal || step.summary}`;
    if (step.actions?.length) {
      text += `\n\nActions:\n${step.actions.map((a, i) => `${i + 1}. ${a}`).join('\n')}`;
    } else if (step.implementation) {
      text += `\n\nImplementation:\n${step.implementation}`;
    }
    if (step.code_snippet) text += `\n\nCode:\n${step.code_snippet}`;
    if (step.proTip || step.pro_tip) text += `\n\nPro-Tip:\n${step.proTip || step.pro_tip}`;

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

  const formattedStepNum = String(stepNum).padStart(2, '0');
  const formattedTotal = String(totalSteps).padStart(2, '0');

  // Resolve v2 fields with legacy fallbacks
  const goal = step.goal || step.summary || step.title;
  const actions = Array.isArray(step.actions) && step.actions.length > 0
    ? step.actions
    : (step.implementation ? [step.implementation] : []);
  const why = step.why || null;
  const expectedResult = step.expectedResult || step.expected_result || null;
  const commonMistakes = step.commonMistakes || step.common_mistakes || [];
  const proTip = step.proTip || step.pro_tip || null;
  const checkpoint = step.checkpoint || null;
  const suggestedQuestions = step.suggestedQuestions || step.suggested_questions || [];

  return (
    <div
      id={`step-card-${stepNum}`}
      className={`glass-panel rounded-2xl p-5 sm:p-6 transition-all border relative overflow-hidden group ${
        isCompleted
          ? 'bg-slate-900/50 border-emerald-500/30 opacity-95 shadow-sm shadow-emerald-950/20'
          : understandingStatus === 'needs_review'
          ? 'bg-slate-900/80 border-amber-500/40 shadow-lg shadow-amber-950/10'
          : 'hover:border-indigo-500/50 bg-slate-900/80 border-slate-800/90 shadow-lg shadow-black/20'
      }`}
    >
      {/* Top Meta Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2.5">
          <span className="font-mono text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-lg border border-indigo-500/20 shadow-sm">
            STEP {formattedStepNum} / {formattedTotal}
          </span>
          <span className="inline-flex items-center gap-1 text-xs font-mono text-amber-400/90 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-lg">
            <Clock className="w-3 h-3" />
            {step.time_estimate || '~10 min'}
          </span>

          {/* Understanding Status Pill */}
          {understandingStatus === 'understood' && (
            <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-md">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>Understood</span>
            </span>
          )}
          {understandingStatus === 'needs_review' && (
            <span className="inline-flex items-center gap-1 text-[11px] font-mono text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-md">
              <AlertTriangle className="w-3 h-3 text-amber-400" />
              <span>Needs Review</span>
            </span>
          )}
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
        </div>
      </div>

      {/* Step Title */}
      <h3 className={`text-base sm:text-lg font-bold transition-colors ${
        isCompleted ? 'text-slate-300' : 'text-white'
      }`}>
        {step.title}
      </h3>

      {/* 🎯 Goal Box */}
      {goal && (
        <div className="mt-3 p-3 rounded-xl bg-indigo-950/30 border border-indigo-500/25 flex items-start gap-2.5">
          <Target className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans">
            <strong className="text-indigo-300 font-semibold mr-1.5">Goal:</strong>
            {goal}
          </div>
        </div>
      )}

      {/* ACTION Section: Concrete Numbered Checklist */}
      {actions.length > 0 && (
        <div className="mt-4 space-y-2">
          <div className="text-[11px] uppercase tracking-wider font-mono font-bold text-slate-400 px-0.5">
            Action Steps
          </div>

          <div className="space-y-2">
            {actions.map((act, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/90 border border-slate-800/90 hover:border-indigo-500/30 transition-all text-xs sm:text-sm text-slate-200 leading-relaxed font-sans"
              >
                <span className="shrink-0 w-6 h-6 rounded-lg bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 font-mono text-xs font-bold flex items-center justify-center mt-0.5">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div className="flex-1 min-w-0">
                  {formatInstructionText(act)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Code Snippet (if available) */}
      {step.code_snippet && (
        <div className="mt-4 rounded-xl overflow-hidden border border-slate-800/90 bg-[#0d1117] shadow-xl">
          <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-900/90 border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 mr-1" aria-hidden="true">
                <span className="w-2 h-2 rounded-full bg-rose-500/80 inline-block"></span>
                <span className="w-2 h-2 rounded-full bg-amber-500/80 inline-block"></span>
                <span className="w-2 h-2 rounded-full bg-emerald-500/80 inline-block"></span>
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

          <div className="p-3.5 overflow-x-auto bg-[#090d13]">
            <pre className="text-xs font-mono text-emerald-300/95 leading-relaxed selection:bg-emerald-900/40">
              <code>{step.code_snippet}</code>
            </pre>
          </div>
        </div>
      )}

      {/* Collapsible Explanations (Avoids Information Overload) */}
      <div className="mt-4 space-y-2">
        {/* WHY THIS MATTERS */}
        {why && (
          <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 overflow-hidden">
            <button
              type="button"
              onClick={() => setShowWhy(!showWhy)}
              className="w-full flex items-center justify-between p-3 text-left hover:bg-slate-800/40 transition-colors cursor-pointer text-xs font-semibold text-slate-300"
            >
              <span className="flex items-center gap-2">
                <Lightbulb className="w-3.5 h-3.5 text-indigo-400" />
                <span>Why This Matters</span>
              </span>
              {showWhy ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>
            {showWhy && (
              <div className="p-3.5 pt-0 text-xs text-slate-300 leading-relaxed border-t border-slate-800/60 font-sans">
                {why}
              </div>
            )}
          </div>
        )}

        {/* EXPECTED RESULT */}
        {expectedResult && (
          <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 overflow-hidden">
            <button
              type="button"
              onClick={() => setShowExpected(!showExpected)}
              className="w-full flex items-center justify-between p-3 text-left hover:bg-slate-800/40 transition-colors cursor-pointer text-xs font-semibold text-slate-300"
            >
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Expected Result</span>
              </span>
              {showExpected ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>
            {showExpected && (
              <div className="p-3.5 pt-0 text-xs text-slate-300 leading-relaxed border-t border-slate-800/60 font-sans">
                {expectedResult}
              </div>
            )}
          </div>
        )}

        {/* WATCH OUT / COMMON MISTAKES */}
        {commonMistakes.length > 0 && (
          <div className="rounded-xl border border-amber-500/20 bg-amber-950/15 overflow-hidden">
            <button
              type="button"
              onClick={() => setShowWatchOut(!showWatchOut)}
              className="w-full flex items-center justify-between p-3 text-left hover:bg-amber-900/20 transition-colors cursor-pointer text-xs font-semibold text-amber-300"
            >
              <span className="flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span>Watch Out ({commonMistakes.length} common pitfalls)</span>
              </span>
              {showWatchOut ? <ChevronUp className="w-4 h-4 text-amber-400" /> : <ChevronDown className="w-4 h-4 text-amber-400" />}
            </button>
            {showWatchOut && (
              <ul className="p-3.5 pt-0 space-y-1.5 text-xs text-amber-200/90 leading-relaxed border-t border-amber-500/20 list-disc list-inside font-sans">
                {commonMistakes.map((m, idx) => (
                  <li key={idx}>{m}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Pro-Tip Callout */}
        {proTip && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-2.5">
            <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-100/90 leading-relaxed">
              <strong className="text-amber-300 font-semibold mr-1 font-mono uppercase text-[10px]">Pro-Tip:</strong>
              {proTip}
            </div>
          </div>
        )}
      </div>

      {/* QUICK CHECK: Zero-Cost Interactive Checkpoint */}
      {checkpoint && (
        <div className="mt-5 p-4 rounded-xl bg-slate-950/80 border border-violet-500/30 shadow-md">
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-violet-300 font-mono">
              <HelpCircle className="w-4 h-4 text-violet-400" />
              <span>QUICK CHECK</span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">Zero AI tokens</span>
          </div>

          <p className="text-xs sm:text-sm font-semibold text-white mb-3">
            {checkpoint.question}
          </p>

          <div className="space-y-2">
            {checkpoint.options.map((option, idx) => {
              const isSelected = checkpointState?.selectedIndex === idx;
              const isSubmitted = checkpointState !== null;
              const isAnswerCorrect = checkpointState?.isCorrect;

              let btnStyle = 'bg-slate-900 border-slate-800 text-slate-300 hover:border-violet-500/50 hover:bg-violet-950/20';
              if (isSubmitted) {
                if (idx === checkpoint.correctIndex) {
                  btnStyle = 'bg-emerald-950/50 border-emerald-500/60 text-emerald-200 font-medium';
                } else if (isSelected && !isAnswerCorrect) {
                  btnStyle = 'bg-rose-950/50 border-rose-500/60 text-rose-200';
                } else {
                  btnStyle = 'bg-slate-900/50 border-slate-800/60 text-slate-500';
                }
              }

              return (
                <button
                  key={idx}
                  type="button"
                  disabled={isSubmitted}
                  onClick={() => handleCheckpointSelect(idx)}
                  className={`w-full text-left p-2.5 rounded-xl border transition-all text-xs leading-relaxed flex items-start gap-2.5 cursor-pointer ${btnStyle}`}
                >
                  <span className="font-mono font-bold text-[11px] shrink-0 opacity-70 mt-0.5">
                    {String.fromCharCode(65 + idx)})
                  </span>
                  <span className="flex-1">{option}</span>
                  {isSubmitted && idx === checkpoint.correctIndex && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  )}
                  {isSubmitted && isSelected && !isAnswerCorrect && (
                    <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Feedback & Explanation */}
          {checkpointState && (
            <div className={`mt-3 p-3 rounded-xl border text-xs leading-relaxed animate-in fade-in duration-150 ${
              checkpointState.isCorrect
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                : 'bg-rose-950/30 border-rose-500/30 text-rose-200'
            }`}>
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="font-bold">
                  {checkpointState.isCorrect ? 'Correct ✓' : 'Not quite.'}
                </span>
                {!checkpointState.isCorrect && (
                  <button
                    type="button"
                    onClick={handleRetryCheckpoint}
                    className="inline-flex items-center gap-1 text-[11px] text-amber-300 hover:text-amber-200 font-mono font-semibold cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Try again</span>
                  </button>
                )}
              </div>
              {checkpoint.explanation && (
                <p className="mt-1 opacity-90">{checkpoint.explanation}</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* NEED HELP? / QUICK ACTIONS & SUGGESTED QUESTIONS */}
      <div className="mt-5 pt-4 border-t border-slate-800/80 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
            Need Help With Step {stepNum}?
          </span>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => onAskTutor?.({ type: 'stuck', stepNumber: stepNum, stepTitle: step.title })}
              className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 transition-colors cursor-pointer"
            >
              <AlertTriangle className="w-3 h-3 text-rose-400" />
              <span>I'm Stuck</span>
            </button>

            <button
              type="button"
              onClick={() => onAskTutor?.({ type: 'explain', stepNumber: stepNum, stepTitle: step.title, text: `Explain step ${stepNum} (${step.title}) simpler.` })}
              className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-300 transition-colors cursor-pointer"
            >
              <Lightbulb className="w-3 h-3 text-indigo-400" />
              <span>Explain Simpler</span>
            </button>

            <button
              type="button"
              onClick={() => onAskTutor?.({ type: 'example', stepNumber: stepNum, stepTitle: step.title, text: `Show a code example for step ${stepNum} (${step.title}).` })}
              className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 transition-colors cursor-pointer"
            >
              <Terminal className="w-3 h-3 text-emerald-400" />
              <span>Show Example</span>
            </button>

            <button
              type="button"
              onClick={() => onAskTutor?.({ type: 'gotcha', stepNumber: stepNum, stepTitle: step.title, text: `What can go wrong in step ${stepNum} (${step.title})?` })}
              className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 transition-colors cursor-pointer"
            >
              <Zap className="w-3 h-3 text-amber-400" />
              <span>What Can Go Wrong?</span>
            </button>
          </div>
        </div>

        {/* Suggested Questions Pills (Pre-generated, 0 cost to show) */}
        {suggestedQuestions.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[10px] text-slate-500 font-mono mr-1">Ask:</span>
            {suggestedQuestions.map((sq, i) => (
              <button
                key={i}
                type="button"
                onClick={() => onAskTutor?.({ type: 'question', text: sq, stepNumber: stepNum, stepTitle: step.title })}
                className="text-[11px] px-2.5 py-1 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-all text-left truncate max-w-full cursor-pointer"
              >
                {sq}
              </button>
            ))}
          </div>
        )}

        {/* Complete Step Toggle Button */}
        <div className="pt-3 flex items-center justify-between gap-3 border-t border-slate-800/60">
          <div className="text-[11px] text-slate-500">
            {isCompleted ? 'Marked complete' : 'Not completed yet'}
          </div>

          <button
            type="button"
            onClick={onToggle}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
              isCompleted
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-400/30 shadow-md shadow-indigo-600/20'
            }`}
          >
            <Check className={`w-4 h-4 stroke-[2.5] ${isCompleted ? 'text-emerald-400' : 'text-white'}`} />
            <span>{isCompleted ? 'Completed ✓' : 'Complete Step'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
