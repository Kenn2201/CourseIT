import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { History, Link2, UploadCloud, Trash2, ArrowUpRight, Search, Clock, Layers, Sparkles, Filter } from 'lucide-react';

export default function GenerationHistory({ courses = [], onDeleteCourse, currentUser = null, isAdmin = false }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all' | 'url' | 'document'

  // Filter out starter templates so history focuses on real user generations/prompts
  const userGenerations = courses.filter((c) => {
    const isStarter = Boolean(c.is_curated || c.$id?.startsWith('starter-'));
    return !isStarter;
  });

  const filtered = userGenerations.filter((c) => {
    const isDoc = Boolean(c.source_url?.startsWith('upload://') || c.source_url?.includes('ocr'));
    if (filterType === 'url' && isDoc) return false;
    if (filterType === 'document' && !isDoc) return false;

    const q = searchTerm.toLowerCase();
    return (
      (c.title || '').toLowerCase().includes(q) ||
      (c.source_url || '').toLowerCase().includes(q) ||
      (c.creator_email || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-mono mb-2">
            <History className="w-3.5 h-3.5" />
            <span>Generation History & OCR Uploads</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Past Prompts & Documents
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Review all past curriculum generations, extracted documentation links, and OCR scans. Each item is permanently deletable.
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs text-slate-400 bg-slate-900/90 border border-slate-800 px-3.5 py-2 rounded-xl">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <span>Total Records: <strong className="text-white">{userGenerations.length}</strong></span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search past prompts, URLs, or file titles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          />
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-slate-900/90 border border-slate-800 rounded-xl">
          <button
            type="button"
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              filterType === 'all'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All ({userGenerations.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('url')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              filterType === 'url'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Web URLs
          </button>
          <button
            type="button"
            onClick={() => setFilterType('document')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              filterType === 'document'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            OCR Documents
          </button>
        </div>
      </div>

      {/* History Items List */}
      {filtered.length === 0 ? (
        <div className="glass-panel p-12 text-center rounded-3xl border border-slate-800 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
            <History className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white">No Generation History Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
            {searchTerm
              ? 'No generations match your search query. Try clearing filters.'
              : 'You have not generated any courses or uploaded OCR scans yet. Switch to the Studio tab to create your first curriculum!'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {filtered.map((item) => {
            const isDoc = Boolean(item.source_url?.startsWith('upload://') || item.source_url?.includes('ocr'));
            const dateStr = item.$createdAt
              ? new Date(item.$createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
              : 'Recent';
            const stepsCount = (item.steps || []).length;

            return (
              <div
                key={item.$id}
                className="glass-panel p-4 sm:p-5 rounded-2xl border border-slate-800 hover:border-indigo-500/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
              >
                <div className="flex items-start gap-3.5">
                  <div className={`p-2.5 rounded-xl shrink-0 mt-0.5 border ${
                    isDoc
                      ? 'bg-violet-500/10 border-violet-500/20 text-violet-400'
                      : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
                  }`}>
                    {isDoc ? <UploadCloud className="w-5 h-5" /> : <Link2 className="w-5 h-5" />}
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                        isDoc
                          ? 'bg-violet-500/10 text-violet-300 border-violet-500/20'
                          : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20'
                      }`}>
                        {isDoc ? 'OCR Document' : 'Documentation URL'}
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {dateStr}
                      </span>
                    </div>

                    <h4 className="text-sm sm:text-base font-bold text-white group-hover:text-indigo-300 transition-colors">
                      {item.title}
                    </h4>

                    <p className="text-xs text-slate-400 font-mono truncate max-w-xl">
                      {item.source_url}
                    </p>

                    <div className="flex items-center gap-3 pt-1 text-xs text-slate-500 font-mono">
                      <span>{stepsCount} action steps</span>
                      <span>&bull;</span>
                      <span>Created by: <strong className="text-slate-400 font-semibold">{item.creator_email || item.creator_name || (item.is_curated ? 'CourseIT Team' : 'Guest User (24h)')}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <Link
                    to={`/course/${item.$id}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-600 hover:text-white transition-all cursor-pointer"
                  >
                    <span>View</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>

                  <button
                    type="button"
                    onClick={() => onDeleteCourse && onDeleteCourse(item)}
                    title="Delete permanently from history"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-rose-300 hover:bg-rose-500/10 border border-slate-800 hover:border-rose-500/30 transition-all cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
