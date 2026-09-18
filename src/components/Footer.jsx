import React, { useState } from 'react';
import { BookOpen, Sparkles, ExternalLink, Mail, Shield, FileText, Heart } from 'lucide-react';
import TermsPrivacyModal from './TermsPrivacyModal';
import { CURRENT_VERSION_LABEL } from '../constants/version';

export default function Footer({ onOpenChangelog, showPoweredBy = true }) {
  const [legalModalOpen, setLegalModalOpen] = useState(false);
  const [legalInitialTab, setLegalInitialTab] = useState('terms');

  const triggerChangelog = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (e && e.stopPropagation) e.stopPropagation();
    if (onOpenChangelog) {
      onOpenChangelog();
    } else {
      window.dispatchEvent(new Event('courseit_open_changelog'));
    }
  };

  const openLegal = (tab) => {
    setLegalInitialTab(tab);
    setLegalModalOpen(true);
  };

  return (
    <>
      <footer className="w-full border-t border-slate-800/80 bg-slate-950/90 backdrop-blur-md text-slate-400 py-12 px-4 sm:px-6 relative z-20">
        <div className="max-w-6xl mx-auto space-y-10">
          {/* Top Tier: Branding & Quick Links */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Col 1: CourseIT Brand */}
            <div className="md:col-span-2 space-y-3.5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md">
                  <BookOpen className="w-4 h-4" />
                </div>
                <span className="font-bold text-lg text-white tracking-tight">CourseIT Ai</span>
                <button
                  type="button"
                  onClick={triggerChangelog}
                  className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 transition-colors cursor-pointer"
                >
                  {CURRENT_VERSION_LABEL}
                </button>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 max-w-md leading-relaxed">
                The anti-fluff documentation synthesizer designed for developers with ADHD, documentation fatigue, and low attention spans. Turns 40-page API manuals into progressive action steps.
              </p>
              {showPoweredBy && (
                <div className="pt-2 space-y-2">
                  <div className="inline-flex flex-wrap items-center gap-2 p-1.5 px-3 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] font-mono text-slate-400">
                    <span className="text-slate-500 font-semibold uppercase tracking-wider text-[10px]">Powered by</span>
                    <span className="text-teal-400 font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                      Netlify
                    </span>
                    <span className="text-slate-700">&bull;</span>
                    <span className="text-pink-400 font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-pink-400" />
                      Appwrite
                    </span>
                    <span className="text-slate-700">&bull;</span>
                    <span className="text-violet-400 font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                      Multi-Provider AI
                    </span>
                    <span className="text-slate-700">&bull;</span>
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      Resend
                    </span>
                    <span className="text-slate-700">&bull;</span>
                    <span className="text-amber-400 font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      Sentry
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 px-1 text-[10px] font-mono text-slate-500">
                    <span className="text-slate-600 uppercase tracking-wider font-semibold">AI Providers:</span>
                    <span className="text-slate-400">Google Gemini</span>
                    <span className="text-slate-700">&bull;</span>
                    <span className="text-slate-400">Groq</span>
                    <span className="text-slate-700">&bull;</span>
                    <span className="text-slate-400">Mistral</span>
                    <span className="text-slate-700">&bull;</span>
                    <span className="text-slate-400">OpenRouter</span>
                  </div>
                </div>
              )}
            </div>

            {/* Col 2: Navigation & Changelog */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
                Product & Updates
              </h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <button
                    type="button"
                    onClick={triggerChangelog}
                    className="hover:text-indigo-400 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Changelog & Release Notes</span>
                  </button>
                </li>
                <li>
                  <a href="/app" className="hover:text-indigo-400 transition-colors">
                    App Generator Dashboard
                  </a>
                </li>
                <li>
                  <span className="text-slate-500">Document OCR Engine (Tesseract)</span>
                </li>
                <li>
                  <span className="text-slate-500">Zero-AI-Fluff Mode</span>
                </li>
              </ul>
            </div>

            {/* Col 3: Developer & Portfolio Links */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
                Developer & Socials
              </h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <a
                    href="https://kenncode.me"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-indigo-400 transition-colors flex items-center gap-1 font-medium text-slate-300"
                  >
                    <span>Kenn Nacario (Portfolio)</span>
                    <ExternalLink className="w-3 h-3 text-indigo-400" />
                  </a>
                </li>
                <li>
                  <a
                    href="https://github.com/Kenn2201"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-indigo-400 transition-colors flex items-center gap-1.5"
                  >
                    <svg className="w-3.5 h-3.5 fill-current text-slate-400" viewBox="0 0 24 24">
                      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                    </svg>
                    <span>GitHub (@Kenn2201)</span>
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.linkedin.com/in/kenn-vincent-a-nacario-31929b297/"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-indigo-400 transition-colors flex items-center gap-1.5"
                  >
                    <svg className="w-3.5 h-3.5 fill-current text-indigo-400" viewBox="0 0 24 24">
                      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                    </svg>
                    <span>LinkedIn Profile</span>
                  </a>
                </li>
                <li>
                  {(() => {
                    const adminEmail = import.meta.env.VITE_ADMIN_EMAIL || 'hello@courseit.kenncode.me';
                    return (
                      <a
                        href={`mailto:${adminEmail}`}
                        className="hover:text-indigo-400 transition-colors flex items-center gap-1.5"
                      >
                        <Mail className="w-3.5 h-3.5 text-amber-400" />
                        <span>{adminEmail}</span>
                      </a>
                    );
                  })()}
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Strip: Copyright & Terms */}
          <div className="pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 font-mono">
            <div className="flex items-center gap-2">
              <span>&copy; {new Date().getFullYear()} CourseIT Ai. All rights reserved.</span>
              <span>•</span>
              <span>Built by Kenn Nacario</span>
            </div>

            <div className="flex items-center gap-4 text-[11px]">
              <button
                type="button"
                onClick={() => openLegal('privacy')}
                className="hover:text-indigo-400 transition-colors cursor-pointer"
              >
                Privacy Policy
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => openLegal('terms')}
                className="hover:text-indigo-400 transition-colors cursor-pointer"
              >
                Terms of Service
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={triggerChangelog}
                className="hover:text-indigo-400 transition-colors cursor-pointer"
              >
                {CURRENT_VERSION_LABEL} Release Notes
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* Terms & Privacy Modal */}
      <TermsPrivacyModal
        isOpen={legalModalOpen}
        onClose={() => setLegalModalOpen(false)}
        initialTab={legalInitialTab}
      />
    </>
  );
}
