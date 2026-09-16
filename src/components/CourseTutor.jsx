import React, { useState, useRef, useEffect } from 'react';
import { Bot, Sparkles, X, Send, Code, Lightbulb, AlertTriangle, CheckCircle, HelpCircle, Terminal, RefreshCw, ChevronRight } from 'lucide-react';

export default function CourseTutor({ course, activeStepIndex = 0 }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputQuestion, setInputQuestion] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedStep, setSelectedStep] = useState(activeStepIndex);
  const chatBottomRef = useRef(null);

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
    if (messages.length === 0 && course?.title) {
      setMessages([
        {
          id: 'welcome',
          sender: 'tutor',
          text: `👋 Hey! I'm your **CourseIT Technical Companion** for *${course.title}*. Choose a quick action below or ask any question about the steps and code snippets!`
        }
      ]);
    }
  }, [course]);

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

  const handleScriptedAction = (actionType) => {
    const stepTitle = currentStep.title || `Step ${selectedStep + 1}`;
    const stepSummary = currentStep.summary || '';
    const stepImpl = currentStep.implementation || '';
    const stepCode = currentStep.code_snippet || '';
    const stepTip = currentStep.pro_tip || '';

    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);

      if (actionType === 'explain') {
        addMessage(
          'user',
          `💡 Explain "${stepTitle}" in simple terms`
        );
        addMessage(
          'tutor',
          `**Here is the plain-English breakdown of ${stepTitle}:**\n\n${stepSummary || 'In this step, you are setting up the core structure.'}\n\n**Key Objective:**\n${stepImpl || 'Follow the step-by-step checklist to configure the nodes and scenes in your editor.'}`
        );
      } else if (actionType === 'code') {
        addMessage(
          'user',
          `💻 Show runnable code snippet for "${stepTitle}"`
        );
        if (stepCode) {
          addMessage(
            'tutor',
            `Here is the verified GDScript / code syntax for **${stepTitle}**:`,
            stepCode
          );
        } else {
          addMessage(
            'tutor',
            `This step is focused on scene setup and inspector properties. Ensure your node hierarchy matches:\n\`\`\`text\n${stepTitle}\n  └── Sub-nodes configured via Inspector\n\`\`\``
          );
        }
      } else if (actionType === 'gotcha') {
        addMessage(
          'user',
          `⚠️ Common bugs & gotchas for "${stepTitle}"`
        );
        addMessage(
          'tutor',
          `**Watch out for these common issues in ${stepTitle}:**\n\n${stepTip ? `• **Gotcha:** ${stepTip}` : '• Ensure node names match exact casing in your script (e.g. `Sprite2D` vs `sprite_2d`).'}\n• Remember to save scenes before running tests (\`Ctrl + S\`).\n• Verify signal connection names match your target callable method.`
        );
      } else if (actionType === 'quiz') {
        addMessage(
          'user',
          `🎯 Quick knowledge check on "${stepTitle}"`
        );
        addMessage(
          'tutor',
          `**Concept Check for ${stepTitle}:**\nWhat is the primary function of this step in your architecture?`,
          null,
          {
            question: `Which statement best describes the goal of "${stepTitle}"?`,
            options: [
              `A) ${stepSummary.slice(0, 80)}...`,
              `B) Reinstalling Godot engine packages`,
              `C) Exporting final binary build for mobile`
            ],
            correct: 0
          }
        );
      }
    }, 400);
  };

  const handleCustomQuestion = async (e) => {
    e.preventDefault();
    const q = inputQuestion.trim();
    if (!q) return;

    addMessage('user', q);
    setInputQuestion('');
    setIsTyping(true);

    try {
      const promptText = `User is learning: ${course?.title} (Step ${selectedStep + 1}: ${currentStep.title}). Context: ${currentStep.summary}. Question: ${q}. Give a concise, action-first technical answer with code if helpful. No fluff.`;
      
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
          `Regarding **${currentStep.title}**: Make sure you wire the signals properly using \`connect()\` or the Godot Inspector Node dock. Test using F6 (Run Current Scene).`
        );
      }
    } catch {
      setIsTyping(false);
      addMessage(
        'tutor',
        `To implement **${currentStep.title}**, attach your script to the root node and verify method connections. Use \`print()\` statements inside \`_ready()\` to verify node signals trigger!`
      );
    }
  };

  return (
    <>
      {/* Floating Launcher Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-xl shadow-indigo-600/30 transition-all transform hover:scale-105 active:scale-95 cursor-pointer border border-indigo-400/30 group"
          title="Open Technical Companion"
        >
          <div className="relative">
            <Bot className="w-5 h-5 text-indigo-100 group-hover:rotate-12 transition-transform" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-indigo-600 animate-pulse" />
          </div>
          <span className="font-semibold text-xs tracking-wide">Course Companion</span>
        </button>
      </div>

      {/* Drawer / Companion Modal */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-[420px] h-[560px] max-h-[80vh] flex flex-col rounded-3xl bg-slate-950/95 border border-indigo-500/30 shadow-2xl backdrop-blur-xl animate-in slide-in-from-bottom-5 duration-200 overflow-hidden">
          {/* Header */}
          <div className="p-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-300">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-white tracking-tight">Scripted Companion</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Live
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 truncate max-w-[220px]">
                  {course?.title || 'Active Course'}
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
              onClick={() => handleScriptedAction('explain')}
              className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-300 font-medium transition-colors cursor-pointer"
            >
              <Lightbulb className="w-3 h-3 text-indigo-400" />
              <span>Explain Step</span>
            </button>

            <button
              type="button"
              onClick={() => handleScriptedAction('code')}
              className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-300 font-medium transition-colors cursor-pointer"
            >
              <Code className="w-3 h-3 text-emerald-400" />
              <span>Show Code</span>
            </button>

            <button
              type="button"
              onClick={() => handleScriptedAction('gotcha')}
              className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-300 font-medium transition-colors cursor-pointer"
            >
              <AlertTriangle className="w-3 h-3 text-amber-400" />
              <span>Common Bugs</span>
            </button>

            <button
              type="button"
              onClick={() => handleScriptedAction('quiz')}
              className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/20 text-violet-300 font-medium transition-colors cursor-pointer"
            >
              <HelpCircle className="w-3 h-3 text-violet-400" />
              <span>Quiz Me</span>
            </button>
          </div>

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
                  <p className="whitespace-pre-line">{m.text}</p>

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
              placeholder={`Ask about Step ${selectedStep + 1} or GDScript...`}
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
