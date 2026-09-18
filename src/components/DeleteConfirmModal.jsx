import React from 'react';
import { createPortal } from 'react-dom';
import useModalViewport from './useModalViewport';
import { Trash2, AlertCircle, X, Loader2 } from 'lucide-react';

export default function DeleteConfirmModal({ isOpen, course, onClose, onConfirm, isDeleting }) {
  const dialogRef = useModalViewport(isOpen && Boolean(course), isDeleting ? null : onClose);
  if (!isOpen || !course) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 overflow-y-auto bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div ref={dialogRef} role="alertdialog" aria-modal="true" aria-label="Delete course" className="relative w-full max-w-md max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isDeleting}
          className="absolute right-4 top-4 p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon & Warning */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
            <Trash2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">{course.historical_only ? 'Remove Browser Record' : 'Delete Course'}</h3>
            <p className="text-xs text-slate-400 mt-0.5">{course.historical_only ? 'The server course is already unavailable' : 'This action cannot be undone'}</p>
          </div>
        </div>

        {/* Course Info Preview */}
        <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-1">
          <p className="text-xs font-mono text-indigo-400">Target Course:</p>
          <p className="text-sm font-semibold text-slate-200 line-clamp-2">{course.title}</p>
          {course.source_url && (
            <p className="text-[11px] text-slate-500 truncate font-mono">{course.source_url}</p>
          )}
        </div>

        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
          <p>
            {course.historical_only ? 'Only this browser cache entry will be removed. Server usage and credit history remain unchanged.' :
              'Deleting this course removes its parsed action steps and cached prompt data from your database.'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={() => onConfirm(course)}
            disabled={isDeleting}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/20 transition-all cursor-pointer disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                <span>Confirm Delete</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>, document.body
  );
}
