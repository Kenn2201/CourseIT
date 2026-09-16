import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Sparkles, Database, ExternalLink } from 'lucide-react';
import { isAppwriteConfigured } from '../lib/appwrite';

export default function Navbar() {
  const isLive = isAppwriteConfigured();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-white tracking-tight">CourseIT</span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                v1.0
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">Action-first docs learning paths</p>
          </div>
        </Link>

        <div className="flex items-center gap-3 sm:gap-4">
          {/* Domain tag */}
          <span className="hidden md:inline-flex items-center text-xs font-mono text-slate-400 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-md">
            courseit.kenncode.me
          </span>

          {/* Appwrite status pill */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border bg-slate-900/90 border-slate-800">
            <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
            <span className={isLive ? 'text-emerald-300' : 'text-amber-300'}>
              {isLive ? 'Appwrite Live' : 'Local Mode'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
