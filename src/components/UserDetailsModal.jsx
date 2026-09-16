import React, { useState } from 'react';
import { User, Mail, Zap, Clock, ShieldCheck, X, CheckCircle2, Archive, RotateCcw, Plus, Trash2 } from 'lucide-react';

export default function UserDetailsModal({ isOpen, user, onClose, onTopUp, onApprove, onReactivate }) {
  if (!isOpen || !user) return null;

  const [topUpAmount, setTopUpAmount] = useState(250);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleTopUp = async () => {
    setIsProcessing(true);
    await onTopUp(user.user_id, Number(topUpAmount));
    setIsProcessing(false);
  };

  const handleApprove = async () => {
    setIsProcessing(true);
    await onApprove(user.user_id, user.email);
    setIsProcessing(false);
  };

  const handleReactivate = async () => {
    if (onReactivate) {
      setIsProcessing(true);
      await onReactivate(user.user_id);
      setIsProcessing(false);
    }
  };

  const isArchived = user.status === 'archived';
  const isPending = user.status === 'pending';
  const isApproved = user.status === 'approved';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* User Identity Header */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-indigo-600/20 shrink-0">
            {user.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-white truncate">{user.name || 'Anonymous User'}</h3>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase ${
                  isApproved
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : isArchived
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                }`}
              >
                {user.status || 'unknown'}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono truncate mt-0.5">{user.email}</p>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs">
          <div className="space-y-1">
            <span className="text-slate-500 font-mono">User ID:</span>
            <p className="font-mono text-slate-300 truncate" title={user.user_id}>
              {user.user_id}
            </p>
          </div>
          <div className="space-y-1">
            <span className="text-slate-500 font-mono">Created Date:</span>
            <p className="text-slate-300">
              {user.$createdAt ? new Date(user.$createdAt).toLocaleDateString() : 'N/A'}
            </p>
          </div>
          <div className="space-y-1">
            <span className="text-slate-500 font-mono">Quota Balance:</span>
            <p className="text-indigo-400 font-mono font-bold text-sm">
              {user.quota_remaining ?? 250} Credits
            </p>
          </div>
          <div className="space-y-1">
            <span className="text-slate-500 font-mono">Account Type:</span>
            <p className="text-slate-300">{user.isAdmin ? 'Master Administrator' : 'Standard User'}</p>
          </div>
        </div>

        {/* If Archived: Show reason and feedback notes */}
        {isArchived && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-xs space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-amber-300">
              <Archive className="w-4 h-4" />
              <span>Archive Details:</span>
            </div>
            <p className="text-slate-300">
              <strong className="text-slate-200">Reason:</strong> {user.archive_reason || 'Not specified'}
            </p>
            {user.archive_feedback && (
              <p className="text-slate-300">
                <strong className="text-slate-200">Feedback:</strong> {user.archive_feedback}
              </p>
            )}
            {user.archived_at && (
              <p className="text-[11px] text-slate-500 font-mono">
                Archived on {new Date(user.archived_at).toLocaleString()}
              </p>
            )}
          </div>
        )}

        {/* Credit Management Controls */}
        <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-indigo-400" />
              <span>Credit Top-Up</span>
            </span>
            <div className="flex items-center gap-1.5">
              {[50, 100, 250].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setTopUpAmount(amt)}
                  className={`px-2 py-0.5 rounded-lg text-[11px] font-mono transition-colors cursor-pointer ${
                    topUpAmount === amt
                      ? 'bg-indigo-600 text-white font-bold'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  +{amt}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="number"
              value={topUpAmount}
              onChange={(e) => setTopUpAmount(Number(e.target.value))}
              className="w-28 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white font-mono"
            />
            <button
              type="button"
              onClick={handleTopUp}
              disabled={isProcessing}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Credits</span>
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          <div>
            {isArchived && onReactivate && (
              <button
                type="button"
                onClick={handleReactivate}
                disabled={isProcessing}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600/20 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-600/30 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reactivate Account</span>
              </button>
            )}

            {isPending && (
              <button
                type="button"
                onClick={handleApprove}
                disabled={isProcessing}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Approve & Grant 250 Credits</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
