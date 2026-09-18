import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import useModalViewport from './useModalViewport';
import { Archive, AlertTriangle, X, Loader2, CheckCircle2, Heart } from 'lucide-react';
import { archiveAccount } from '../lib/auth';

const REASONS = [
  'Taking a break from current projects',
  'Switching to different documentation tools',
  'Too many emails or notifications',
  'Achieved my learning goals',
  'Other reasons'
];

export default function ArchiveAccountModal({ isOpen, onClose, userEmail, onArchived }) {
  const [selectedReason, setSelectedReason] = useState(REASONS[0]);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isDone, setIsDone] = useState(false);
  const dialogRef = useModalViewport(isOpen, isSubmitting ? null : onClose);

  if (!isOpen) return null;

  const handleArchive = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      await archiveAccount(selectedReason, feedback);
      setIsDone(true);
      setTimeout(() => {
        if (onArchived) onArchived();
        window.location.href = '/';
      }, 1800);
    } catch (err) {
      setError(err.message || 'Failed to archive account.');
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 overflow-y-auto bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-150">
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-label="Archive account" className="relative w-full max-w-lg max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute right-4 top-4 p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {isDone ? (
          <div className="py-8 text-center space-y-3 animate-in fade-in">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-white">Account Archived</h3>
            <p className="text-sm text-slate-400 max-w-sm mx-auto">
              Confirmation email sent to <span className="text-indigo-400 font-mono">{userEmail}</span>. You can reactivate anytime by logging back in!
            </p>
          </div>
        ) : (
          <form onSubmit={handleArchive} className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <Archive className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Archive Account</h3>
                <p className="text-xs text-slate-400 mt-0.5">Take a break without losing your courses</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 leading-relaxed space-y-1.5">
              <div className="flex items-center gap-1.5 font-semibold text-amber-300">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>What happens when you archive:</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-slate-400 pl-1">
                <li>Your course history and generated prompts remain securely saved.</li>
                <li>Your active subscription & email updates are paused.</li>
                <li>You can instantly reactivate anytime simply by signing back in.</li>
              </ul>
            </div>

            {/* Reason selector */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">
                Reason for archiving:
              </label>
              <div className="space-y-1.5">
                {REASONS.map((r) => (
                  <label
                    key={r}
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                      selectedReason === r
                        ? 'bg-indigo-600/20 border-indigo-500 text-white font-medium'
                        : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <input
                      type="radio"
                      name="reason"
                      value={r}
                      checked={selectedReason === r}
                      onChange={() => setSelectedReason(r)}
                      className="text-indigo-600 focus:ring-0"
                    />
                    <span>{r}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Feedback notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Any feedback for CourseIT? (Optional)
              </label>
              <textarea
                rows={3}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="What could we have done better?"
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {error && (
              <p className="text-xs text-rose-400 bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20">
                {error}
              </p>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-600/20 transition-all cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Archiving...</span>
                  </>
                ) : (
                  <>
                    <Archive className="w-4 h-4" />
                    <span>Archive My Account</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>, document.body
  );
}
