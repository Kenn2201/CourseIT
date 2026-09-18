import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import useModalViewport from './useModalViewport';
import { ShieldCheck, Check, Sparkles, ExternalLink, Lock, FileText, Cookie } from 'lucide-react';
import { recordUserConsent } from '../lib/auth';
import TermsPrivacyModal from './TermsPrivacyModal';
import { CURRENT_VERSION_LABEL } from '../constants/version';

export default function LegalConsentModal({ isOpen, user, onConsentAccepted }) {
  const [agreed, setAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [legalModalOpen, setLegalModalOpen] = useState(false);
  const [legalTab, setLegalTab] = useState('terms');
  const dialogRef = useModalViewport(isOpen && Boolean(user), null);

  if (!isOpen || !user) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!agreed) return;
    setIsSubmitting(true);

    try {
      await recordUserConsent('1.8.0');
      if (onConsentAccepted) {
        onConsentAccepted();
      }
    } catch (err) {
      console.error('Failed to record consent:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openLegal = (tab) => {
    setLegalTab(tab);
    setLegalModalOpen(true);
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-start sm:items-center justify-center p-4 overflow-y-auto bg-slate-950/85 backdrop-blur-md animate-in fade-in">
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-label="Legal consent" className="glass-panel w-full max-w-lg max-h-[calc(100dvh-2rem)] rounded-3xl p-6 sm:p-8 border border-indigo-500/40 shadow-2xl relative overflow-y-auto text-slate-100">
        <div className="absolute -right-16 -top-16 w-48 h-48 bg-indigo-500/15 rounded-full blur-2xl pointer-events-none" />

        {/* Icon & Heading */}
        <div className="text-center space-y-3 mb-6 relative z-10">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-lg shadow-indigo-500/10">
            <ShieldCheck className="w-7 h-7" />
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-[11px] font-mono mb-1">
              <span>{CURRENT_VERSION_LABEL} Onboarding</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Welcome to CourseIT
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
              Before accessing the action-first documentation engine, please review and accept our beta usage terms.
            </p>
          </div>
        </div>

        {/* Informative Highlights */}
        <div className="space-y-3 mb-6 relative z-10">
          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-start gap-3">
            <Sparkles className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <div className="text-xs">
              <p className="font-semibold text-slate-200">Fair API Use & Reasoning Quota</p>
              <p className="text-slate-400 mt-0.5 leading-relaxed">
                Free beta access provides shared and approved AI quota for transforming technical documentation. Automated scraping or abusive traffic is strictly prohibited.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-start gap-3">
            <Cookie className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs">
              <p className="font-semibold text-slate-200">Essential Session Storage</p>
              <p className="text-slate-400 mt-0.5 leading-relaxed">
                We store essential authentication sessions and theme cookies. We never track you across external websites or sell data to third parties.
              </p>
            </div>
          </div>
        </div>

        {/* Action Form */}
        <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
          {/* Checkbox Agreement */}
          <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-indigo-500/5 border border-indigo-500/20 hover:border-indigo-500/40 cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-900 cursor-pointer"
            />
            <span className="text-xs text-slate-300 leading-relaxed">
              I have read and agree to the{' '}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  openLegal('terms');
                }}
                className="text-indigo-400 hover:text-indigo-300 underline font-medium"
              >
                Terms of Service
              </button>
              {' '}and{' '}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  openLegal('privacy');
                }}
                className="text-indigo-400 hover:text-indigo-300 underline font-medium"
              >
                Privacy Policy
              </button>
              .
            </span>
          </label>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!agreed || isSubmitting}
            className="w-full py-3.5 px-6 rounded-2xl text-sm font-semibold bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-xl shadow-indigo-600/30 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <span>Saving agreement...</span>
            ) : (
              <>
                <span>Agree & Continue to CourseIT</span>
                <Check className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>

      {/* Sub-modal for Terms & Privacy full text */}
      <TermsPrivacyModal
        isOpen={legalModalOpen}
        onClose={() => setLegalModalOpen(false)}
        initialTab={legalTab}
      />
    </div>,
    document.body
  );
}
