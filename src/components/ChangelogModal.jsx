import React, { useState } from 'react';
import { X, Sparkles, UploadCloud, ShieldCheck, Mail, Zap, CheckCircle2, Bot, Layers, Trash2, Archive, Compass, History, BrainCircuit, FileDown, Cpu } from 'lucide-react';
import { CHANGELOG_DATA } from '../data/changelog';

export default function ChangelogModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('whatsNew'); // 'whatsNew' | 'history'

  if (!isOpen) return null;

  const latest = CHANGELOG_DATA[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="glass-panel w-full max-w-2xl rounded-3xl p-6 sm:p-8 border border-indigo-500/30 shadow-2xl relative overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="absolute -right-20 -top-20 w-60 h-60 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-4 relative z-10">
          <div className="min-w-0 flex-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-mono mb-2 flex-wrap">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span className="font-semibold">{latest.version}</span>
              <span>&bull;</span>
              <span className="shrink-0">{latest.date}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              CourseIT Release Notes & Changelog
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Explore the latest features, zero-fluff enhancements, and complete version history.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-5 relative z-10 flex-wrap">
          <button
            type="button"
            onClick={() => setActiveTab('whatsNew')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'whatsNew'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>What's New in {latest.version}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'history'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Version History ({CHANGELOG_DATA.length})</span>
          </button>
        </div>

        {/* Tab 1: What's New */}
        {activeTab === 'whatsNew' && (
          <div className="space-y-4 mb-6 relative z-10">
            <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/20 mb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-1.5">
                <span className="text-sm font-bold text-white leading-tight">{latest.title}</span>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full shrink-0 self-start sm:self-auto whitespace-nowrap">
                  {latest.date}
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Action-first synthesis, OAuth resilience, shared guest trial security, and complete course exports.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {latest.highlights?.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-indigo-500/30 transition-all flex flex-col gap-1.5"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-400 shrink-0" />
                    <h4 className="text-xs font-bold text-white">{item.title}</h4>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: Version History */}
        {activeTab === 'history' && (
          <div className="space-y-4 mb-6 relative z-10">
            {CHANGELOG_DATA.map((entry) => (
              <div
                key={entry.version}
                className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2.5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                  <div className="flex items-center gap-2 flex-wrap min-w-0">
                    <span className="font-bold text-sm text-white font-mono shrink-0">{entry.version}</span>
                    <span className="text-xs text-slate-300 font-medium break-words">— {entry.title}</span>
                  </div>
                  <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 rounded-full shrink-0 self-start sm:self-auto whitespace-nowrap">
                    {entry.date}
                  </span>
                </div>
                <ul className="space-y-1 text-xs text-slate-300 list-disc list-inside pl-1">
                  {entry.notes.map((note, idx) => (
                    <li key={idx} className="text-slate-400">
                      <span className="text-slate-300">{note}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        {/* Footer info */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500 font-mono relative z-10">
          <span>CourseIT &bull; Action-First Learning Engine</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
