import React, { useState, useRef, useEffect } from 'react';
import { Bot, Sparkles, X, Send, Code, Lightbulb, AlertTriangle, CheckCircle, HelpCircle, Terminal, RefreshCw, ChevronRight, Zap, FileText, Cpu, Clock } from 'lucide-react';
import FormattedChatText from './FormattedChatText';

export default function CourseTutor({ course, activeStepIndex = 0, mode = 'course', floating = true }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputQuestion, setInputQuestion] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedStep, setSelectedStep] = useState(activeStepIndex);
  const chatBottomRef = useRef(null);

  const isLandingMode = mode === 'landing';
  const steps = course?.steps || [];
  const currentStep = steps[selectedStep] || steps[0] || {};

  // Auto-scroll chat
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  // Initial welcome message
  useEffect(() => {
    if (messages.length === 0) {
      if (isLandingMode) {
        setMessages([
          {
            id: 'welcome_landing',
            sender: 'tutor',
            text: `👋 **Welcome to CourseIT!** I'm your interactive demo guide.\n\nAsk me how our **ADHD-friendly anti-fluff engine** turns 5,000-word documentation pages into numbered, action-first steps, or tap one of the quick questions below!`
          }
        ]);
      } else if (course?.title) {
        setMessages([
          {
            id: 'welcome_course',
            sender: 'tutor',
            text: `👋 Hey! I'm your **Technical Companion** for *${course.title}*. Select a step focus or ask any question about implementation details, code snippets, and common gotchas!`
          }
        ]);
      }
    }
  }, [course, isLandingMode]);

  const addMessage = (sender, text, code = null, quiz = null) => {
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now() + Math.random().toString(),
        sender,
        text,
        code,
        quiz,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  const handleLandingScriptedAction = (actionType) => {
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);

      if (actionType === 'anti-fluff') {
        addMessage('user', '⚡ How does CourseIT remove AI fluff?');
        addMessage(
          'tutor',
          `Traditional LLMs waste time with conversational filler: *"Great question! Let me think about this... As an AI language model..."*\n\n**CourseIT strips 100% of that out.** Our Gemini prompt constraints strictly enforce:\n• Numbered, actionable steps only\n• Exact shell commands and code syntax\n• Direct "How to Implement" instructions\n• High-signal "Pro Tips" for subtle bugs\n\nResult: Learn in 10 minutes what used to take 2 hours of skimming.`
        );
      } else if (actionType === 'inputs') {
        addMessage('user', '📄 What documentation & scans can I upload?');
        addMessage(
          'tutor',
          `CourseIT supports two powerful input modes:\n\n1. **Live Web Documentation URLs**: Paste official docs from Godot, React, Rust, Docker, Python, Tailwind, or any technical library.\n2. **Client-Side OCR Scans**: Drag and drop tutorial screenshots, scanned cheat-sheets, or PDF slides (PNG, JPG, WEBP, PDF, TXT, MD). Text is extracted directly in your browser via Tesseract.js before synthesizing.`
        );
      } else if (actionType === 'credits') {
        addMessage('user', '💎 How do model tiers and credits work?');
        addMessage(
          'tutor',
          `We offer flexible reasoning tiers based on your task complexity:\n\n• **Gemini Flash Lite** (0.5 credits): Ultra-fast synthesis for standard API docs\n• **Gemini 3.5 Lite** (1.0 credit): Balanced depth for setup guides\n• **Gemini 3.6 Flash** (2.0 credits): Complex multi-file architectures\n• **Gemini 3.7 Flash** (5.0 credits): Deep architectural reasoning & tricky debugging\n\nVerified beta testers receive **250 free credits** upon admin approval!`
        );
      } else if (actionType === 'trial') {
        addMessage('user', '⏱️ What is the 3/3 guest free trial?');
        addMessage(
          'tutor',
          `Unauthenticated guests can generate up to **3 free courses** every 24 hours using Gemini Flash Lite — no credit card or login needed!\n\nGuest courses are saved for 24 hours. If you want permanent course saving, multi-tier models (3.5/3.6/3.7), and 250 credits, you can create a free account and request beta approval.`
        );
      }
    }, 350);
  };

  const handleCourseScriptedAction = (actionType) => {
    const stepTitle = currentStep.title || `Step ${selectedStep + 1}`;
    const stepSummary = currentStep.summary || '';
    const stepImpl = currentStep.implementation || '';
    const stepCode = currentStep.code_snippet || '';
    const stepTip = currentStep.pro_tip || '';

    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);

      if (actionType === 'explain') {
        addMessage('user', `💡 Explain "${stepTitle}" in simple terms`);
        addMessage(
          'tutor',
          `**Here is the plain-English breakdown of ${stepTitle}:**\n\n${stepSummary || 'In this step, you are setting up the core structure.'}\n\n**Key Objective:**\n${stepImpl || 'Follow the step-by-step checklist to configure the code and scenes in your editor.'}`
        );
      } else if (actionType === 'code') {
        addMessage('user', `💻 Show runnable code snippet for "${stepTitle}"`);
        if (stepCode) {
          addMessage('tutor', `Here is the verified syntax for **${stepTitle}**:`, stepCode);
        } else if (stepImpl) {
          addMessage(
            'tutor',
            `**Actionable Implementation Instructions for ${stepTitle}:**\n\n${stepImpl}\n\n\`\`\`bash\n# Follow numbered steps above to configure this component\n\`\`\``
          );
        } else {
          addMessage(
            'tutor',
            `**${stepTitle}**\n\n${stepSummary || 'Follow the step checklist in the course viewer to complete this action.'}`
          );
        }
      } else if (actionType === 'gotcha') {
        addMessage('user', `⚠️ Common bugs & gotchas for "${stepTitle}"`);
        addMessage(
          'tutor',
          `**Watch out for these common issues in ${stepTitle}:**\n\n${stepTip ? `• **Pro Gotcha:** ${stepTip}` : '• Ensure casing and paths match exactly in your configuration.'}\n• Remember to test incremental changes early.\n• Verify dependencies and imports are satisfied before running.`
        );
      } else if (actionType === 'quiz') {
        addMessage('user', `🎯 Quick knowledge check on "${stepTitle}"`);
        addMessage(
          'tutor',
          `**Concept Check for ${stepTitle}:**\nWhat is the primary objective of this step?`,
          null,
          {
            question: `Which statement best describes the purpose of "${stepTitle}"?`,
            options: [
              `A) ${stepSummary.slice(0, 80) || 'Implement the core step requirements'}...`,
              `B) Reinstalling all system development tools`,
              `C) Skipping ahead without verifying tests`
            ],
            correct: 0
          }
        );
      }
    }, 350);
  };

  const handleCustomQuestion = async (e) => {
    e.preventDefault();
    const q = inputQuestion.trim();
    if (!q) return;

    addMessage('user', q);
    setInputQuestion('');
    setIsTyping(true);

    if (isLandingMode) {
      setTimeout(() => {
        setIsTyping(false);
        addMessage(
          'tutor',
          `CourseIT is designed for fast, practical execution. You can paste any developer documentation URL or upload an OCR scan right now on the **Launch App** page to see it convert into an action-first curriculum!`
        );
      }, 500);
      return;
    }

    try {
      const promptText = `User is learning: ${course?.title} (Step ${selectedStep + 1}: ${currentStep.title}). Context: ${currentStep.summary}. Question: ${q}. Give a concise, action-first technical answer with code if helpful. No conversational filler.`;

      const res = await fetch('/api/summarize-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Tutor Query',
          text: promptText,
          model: 'gemini-flash-lite-latest'
        })
      });

      const data = await res.json();
      setIsTyping(false);

      if (data.course?.overview || data.course?.recommended_next_step) {
        addMessage('tutor', data.course.overview || data.course.recommended_next_step);
      } else {
        addMessage(
          'tutor',
          `Regarding **${currentStep.title}**: Ensure you follow the implementation steps and test using your editor console or test runner.`
        );
      }
    } catch {
      setIsTyping(false);
      addMessage(
        'tutor',
        `To implement **${currentStep.title}**, review the code snippet and ensure your environment variables and imports are properly aligned!`
      );
    }
  };

  return (
    <>
      {/* Launcher Button: Floating or Inline in Lower Stack */}
      <div className={floating ? "fixed bottom-6 right-6 z-40" : "relative z-20 inline-block"}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-2.5 px-5 py-3 rounded-full text-white shadow-xl transition-all transform hover:scale-105 active:scale-95 cursor-pointer border group ${
            isLandingMode
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 border-emerald-400/30 shadow-emerald-900/30'
              : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 border-indigo-400/30 shadow-indigo-600/30'
          }`}
          title={isLandingMode ? 'Ask CourseIT Demo Bot' : 'Open Technical Companion'}
        >
          <div className="relative">
            <Bot className="w-5 h-5 text-white group-hover:rotate-12 transition-transform" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-slate-900 animate-pulse" />
          </div>
          <span className="font-semibold text-xs tracking-wide">
            {isLandingMode ? 'CourseIT Guide (Demo Tutor)' : 'Course Companion'}
          </span>
        </button>
      </div>

      {/* Drawer / Companion Modal */}
      {isOpen && (
        <div className="fixed bottom-6 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-[420px] h-[560px] max-h-[85vh] flex flex-col rounded-3xl bg-slate-950/95 border border-indigo-500/30 shadow-2xl backdrop-blur-xl animate-in slide-in-from-bottom-5 duration-200 overflow-hidden">
          {/* Header */}
          <div className="p-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center border ${
                isLandingMode
                  ? 'bg-emerald-600/20 border-emerald-500/40 text-emerald-300'
                  : 'bg-indigo-600/30 border-indigo-500/40 text-indigo-300'
              }`}>
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-white tracking-tight">
                    {isLandingMode ? 'CourseIT Guide' : 'Scripted Companion'}
                  </span>
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full border ${
                    isLandingMode
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                  }`}>
                    {isLandingMode ? 'Public Demo' : 'Live Course'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 truncate max-w-[220px]">
                  {isLandingMode ? 'Interactive Overview & FAQ' : (course?.title || 'Active Course')}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Scope-specific Quick Action Chips & Controls */}
          {isLandingMode ? (
            <div className="p-2.5 bg-slate-900/40 border-b border-slate-800/60 flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => handleLandingScriptedAction('anti-fluff')}
                className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-300 font-medium transition-colors cursor-pointer"
              >
                <Zap className="w-3 h-3 text-indigo-400" />
                <span>Anti-Fluff Engine</span>
              </button>

              <button
                type="button"
                onClick={() => handleLandingScriptedAction('inputs')}
                className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-300 font-medium transition-colors cursor-pointer"
              >
                <FileText className="w-3 h-3 text-emerald-400" />
                <span>Supported Inputs</span>
              </button>

              <button
                type="button"
                onClick={() => handleLandingScriptedAction('credits')}
                className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/20 text-violet-300 font-medium transition-colors cursor-pointer"
              >
                <Cpu className="w-3 h-3 text-violet-400" />
                <span>Model Credits</span>
              </button>

              <button
                type="button"
                onClick={() => handleLandingScriptedAction('trial')}
                className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-300 font-medium transition-colors cursor-pointer"
              >
                <Clock className="w-3 h-3 text-amber-400" />
                <span>Guest 3/3 Trial</span>
              </button>
            </div>
          ) : (
            <>
              {/* Step Context Selector */}
              {steps.length > 0 && (
                <div className="px-3 py-2 bg-slate-900/50 border-b border-slate-800/80 flex items-center gap-2 overflow-x-auto text-[11px]">
                  <span className="text-slate-500 font-mono shrink-0">Focus:</span>
                  {steps.map((s, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedStep(idx)}
                      className={`px-2.5 py-1 rounded-lg font-mono shrink-0 transition-all cursor-pointer ${
                        selectedStep === idx
                          ? 'bg-indigo-600 text-white font-bold shadow-sm'
                          : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Step {idx + 1}
                    </button>
                  ))}
                </div>
              )}

              {/* Quick Action Chips */}
              <div className="p-2.5 bg-slate-900/30 border-b border-slate-800/60 flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => handleCourseScriptedAction('explain')}
                  className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-300 font-medium transition-colors cursor-pointer"
                >
                  <Lightbulb className="w-3 h-3 text-indigo-400" />
                  <span>Explain Step</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleCourseScriptedAction('code')}
                  className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-300 font-medium transition-colors cursor-pointer"
                >
                  <Code className="w-3 h-3 text-emerald-400" />
                  <span>Show Code</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleCourseScriptedAction('gotcha')}
                  className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-300 font-medium transition-colors cursor-pointer"
                >
                  <AlertTriangle className="w-3 h-3 text-amber-400" />
                  <span>Common Bugs</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleCourseScriptedAction('quiz')}
                  className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/20 text-violet-300 font-medium transition-colors cursor-pointer"
                >
                  <HelpCircle className="w-3 h-3 text-violet-400" />
                  <span>Quiz Me</span>
                </button>
              </div>
            </>
          )}

          {/* Messages Feed */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 font-sans">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[88%] p-3 rounded-2xl text-xs sm:text-[13px] leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-none shadow-md shadow-indigo-600/20'
                      : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none shadow-sm'
                  }`}
                >
                  <div className="text-xs sm:text-[13px] leading-relaxed">
                    <FormattedChatText text={m.text} />
                  </div>

                  {/* Code snippet in message */}
                  {m.code && (
                    <div className="mt-2.5 rounded-xl bg-slate-950 p-2.5 border border-slate-800 overflow-x-auto font-mono text-[11px] text-emerald-300">
                      <code>{m.code}</code>
                    </div>
                  )}

                  {/* Interactive Quiz card */}
                  {m.quiz && (
                    <div className="mt-3 p-3 rounded-xl bg-slate-950 border border-violet-500/30 space-y-2">
                      <p className="font-semibold text-violet-300">{m.quiz.question}</p>
                      <div className="space-y-1.5">
                        {m.quiz.options.map((opt, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => {
                              if (i === m.quiz.correct) {
                                addMessage('tutor', '🎉 Correct! That is the exact objective of this step.');
                              } else {
                                addMessage('tutor', '❌ Not quite. Review the step summary and try again!');
                              }
                            }}
                            className="w-full text-left p-2 rounded-lg bg-slate-900 hover:bg-violet-600/20 border border-slate-800 hover:border-violet-500/40 text-slate-300 text-[11px] transition-colors cursor-pointer flex items-center justify-between group"
                          >
                            <span>{opt}</span>
                            <ChevronRight className="w-3 h-3 text-slate-600 group-hover:text-violet-400" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-slate-600 mt-1 px-1">{m.timestamp}</span>
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center gap-1.5 p-3 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 text-xs w-fit">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" />
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.4s]" />
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Question Input Form */}
          <form onSubmit={handleCustomQuestion} className="p-3 bg-slate-900/90 border-t border-slate-800 flex items-center gap-2">
            <input
              type="text"
              placeholder={isLandingMode ? 'Ask about CourseIT features, ADHD synthesis, or models...' : `Ask about Step ${selectedStep + 1} or code...`}
              value={inputQuestion}
              onChange={(e) => setInputQuestion(e.target.value)}
              className="flex-1 px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              disabled={!inputQuestion.trim() || isTyping}
              className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white transition-all cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
