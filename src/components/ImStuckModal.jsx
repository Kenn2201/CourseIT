import React, { useState } from 'react';
import { AlertTriangle, X, Send, HelpCircle, Terminal, CheckCircle2, ChevronRight } from 'lucide-react';

const STUCK_REASONS = [
  { id: 'not_understanding', label: "I don't understand the instruction", prompt: "I don't understand the step instruction. Can you explain what needs to be done in plain English?" },
  { id: 'missing_option', label: "I can't find the option/button", prompt: "I cannot find the required option, button, or menu in my environment. Where should it be located?" },
  { id: 'error_occurred', label: "I got an error", requiresTextarea: true },
  { id: 'different_result', label: "My result looks different", prompt: "My output or result looks different from what was expected. What might have caused this discrepancy?" },
  { id: 'something_else', label: "Something else", prompt: "I am stuck on this step and need troubleshooting guidance on what to check." }
];

export default function ImStuckModal({
  isOpen,
  onClose,
  stepNumber,
  stepTitle,
  onSubmit
}) {
  const [selectedReason, setSelectedReason] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [customNote, setCustomNote] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!selectedReason) return;

    if (selectedReason.id === 'error_occurred') {
      onSubmit({
        troubleCategory: 'error',
        errorMessage: errorMessage.trim(),
        question: customNote.trim() || 'How do I fix this error?'
      });
    } else {
      onSubmit({
        troubleCategory: selectedReason.id,
        errorMessage: null,
        question: selectedReason.prompt
      });
    }

    onClose();
    // Reset state
    setSelectedReason(null);
    setErrorMessage('');
    setCustomNote('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl p-6 relative overflow-hidden space-y-5"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                I'm Stuck on Step {stepNumber}
              </h3>
              <p className="text-xs text-slate-400 truncate max-w-xs sm:max-w-sm">
                {stepTitle || 'Active learning step'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Options */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-300">
            What's happening?
          </p>

          <div className="space-y-1.5">
            {STUCK_REASONS.map((r) => {
              const isSelected = selectedReason?.id === r.id;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setSelectedReason(r)}
                  className={`w-full text-left p-3 rounded-xl border transition-all text-xs flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? 'bg-rose-500/15 border-rose-500/50 text-white font-medium shadow-sm'
                      : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800/60 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                      isSelected ? 'border-rose-400 bg-rose-500' : 'border-slate-600'
                    }`}>
                      {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </span>
                    <span>{r.label}</span>
                  </div>
                  <ChevronRight className={`w-3.5 h-3.5 ${isSelected ? 'text-rose-400' : 'text-slate-600'}`} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Error Textarea if "I got an error" */}
        {selectedReason?.requiresTextarea && (
          <form onSubmit={handleSubmit} className="space-y-3 animate-in fade-in duration-150">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Paste the error message:
              </label>
              <textarea
                rows={4}
                required
                value={errorMessage}
                onChange={(e) => setErrorMessage(e.target.value)}
                placeholder="e.g. FirebaseError: No Firebase App '[DEFAULT]' has been created"
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-rose-500 resize-none"
              />
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">
                Any additional context? (optional)
              </label>
              <input
                type="text"
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                placeholder="e.g. Occurs right when calling initializeApp()"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!errorMessage.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-xs font-semibold text-white transition-all shadow-md shadow-rose-600/30 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Ask CourseIT</span>
              </button>
            </div>
          </form>
        )}

        {/* Simple Submit for other options */}
        {selectedReason && !selectedReason.requiresTextarea && (
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition-all shadow-md shadow-indigo-600/25 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Get Immediate Help</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
