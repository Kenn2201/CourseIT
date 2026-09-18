import React, { useState, useEffect } from 'react';

/**
 * CardSwap
 * Interactive 3D stacked card swapper that visually demonstrates CourseIT's synthesis pipeline:
 * Documentation -> Action-First Course -> Practice
 * Supports auto-swap with hover-pause, clickable tabs, and respects prefers-reduced-motion.
 */
export default function CardSwap({
  cards = [],
  interval = 4000,
  className = ''
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (!cards || cards.length <= 1 || isPaused) return;

    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    if (prefersReducedMotion) return;

    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % cards.length);
    }, interval);

    return () => clearInterval(timer);
  }, [cards, interval, isPaused]);

  if (!cards.length) return null;

  return (
    <div
      className={`relative w-full max-w-xl mx-auto ${className}`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Interactive Step Switcher Tabs */}
      <div className="flex items-center justify-center gap-2 mb-4">
        {cards.map((card, idx) => (
          <button
            key={card.id || idx}
            type="button"
            onClick={() => setActiveIndex(idx)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
              activeIndex === idx
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25 border border-indigo-400/40'
                : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <span className="font-mono text-[10px] opacity-75">0{idx + 1}</span>
            <span>{card.tabLabel || card.title}</span>
          </button>
        ))}
      </div>

      {/* Stacked Cards Container */}
      <div className="relative h-[270px] sm:h-[260px] w-full">
        {cards.map((card, idx) => {
          // Calculate offset position relative to active card
          const total = cards.length;
          const offset = (idx - activeIndex + total) % total;

          // Styles based on stack order
          let zIndex = 30 - offset * 10;
          let translateY = offset * 14;
          let scale = 1 - offset * 0.05;
          let opacity = offset === 0 ? 1 : offset === 1 ? 0.65 : 0.35;
          let pointerEvents = offset === 0 ? 'auto' : 'none';

          if (offset > 2) {
            opacity = 0;
            pointerEvents = 'none';
          }

          return (
            <div
              key={card.id || idx}
              onClick={() => offset !== 0 && setActiveIndex(idx)}
              className="absolute inset-x-0 top-0 rounded-3xl border border-slate-800/90 bg-slate-950/95 p-6 shadow-2xl transition-all duration-500 ease-out backdrop-blur-xl cursor-pointer select-none"
              style={{
                zIndex,
                transform: `translateY(${translateY}px) scale(${scale})`,
                opacity,
                pointerEvents
              }}
            >
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800/70">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                  <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-indigo-400">
                    {card.phase}
                  </span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-slate-400">
                  {card.badge}
                </span>
              </div>

              <h4 className="text-base font-bold text-white mb-2">{card.title}</h4>
              <p className="text-xs text-slate-300 leading-relaxed mb-3">{card.description}</p>

              {card.codeSnippet && (
                <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-3 font-mono text-[11px] text-indigo-200 overflow-x-auto">
                  <code>{card.codeSnippet}</code>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
