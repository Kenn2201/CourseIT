import React from 'react';
import { Link } from 'react-router-dom';
import { Home, LayoutDashboard, Terminal } from 'lucide-react';
import FuzzyText from '../components/reactbits/FuzzyText';
import ShapeGrid from '../components/reactbits/ShapeGrid';

export default function NotFound() {
  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 overflow-hidden bg-[#070913] text-slate-100">
      {/* Background Grid */}
      <div className="absolute inset-0 z-0 opacity-30 pointer-events-none">
        <ShapeGrid
          direction="diagonal"
          speed={0.2}
          squareSize={48}
          shape="square"
          borderColor="#171b30"
          hoverFillColor="#272757"
        />
      </div>

      <div className="relative z-10 max-w-md w-full glass-panel p-8 sm:p-10 rounded-3xl border border-indigo-500/30 text-center space-y-6 shadow-2xl backdrop-blur-xl">
        <FuzzyText text="404" fontSize={80} fontWeight={900} />

        <div className="space-y-2">
          <h1 className="text-xl font-bold text-white tracking-tight">
            This learning path wandered outside the docs.
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            The page or course you requested could not be located. Head back to the studio to generate a fresh curriculum.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/app"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Back to Dashboard</span>
          </Link>
          <Link
            to="/"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Home className="w-3.5 h-3.5 text-indigo-400" />
            <span>Go Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
