import React from 'react';

/**
 * LogoLoop
 * Infinite horizontal ticker for actual technologies used in production.
 * Uses hardware-accelerated CSS marquee with pause-on-hover.
 * Gracefully degrades to a clean static flex wrap if prefers-reduced-motion is active.
 */
export default function LogoLoop({ items = [], speed = '35s', className = '' }) {
  if (!items || items.length === 0) return null;

  return (
    <div className={`relative w-full overflow-hidden py-4 ${className} group`}>
      {/* Edge gradient masks for subtle fade-in / fade-out */}
      <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-16 sm:w-24 z-10 bg-gradient-to-r from-[#070913] to-transparent" />
      <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-16 sm:w-24 z-10 bg-gradient-to-l from-[#070913] to-transparent" />

      {/* Marquee Track (duplicated for seamless wrap) */}
      <div
        className="flex items-center gap-4 sm:gap-6 w-max animate-marquee group-hover:[animation-play-state:paused] motion-reduce:animate-none motion-reduce:flex-wrap motion-reduce:justify-center motion-reduce:w-full"
        style={{
          '--marquee-duration': speed
        }}
      >
        {items.concat(items).map((item, idx) => (
          <div
            key={`${item.name}-${idx}`}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900/70 border border-slate-800/80 text-xs text-slate-300 shadow-sm hover:border-indigo-500/40 hover:text-white transition-colors select-none"
          >
            {item.icon && <span className="text-sm shrink-0">{item.icon}</span>}
            <span className="font-medium tracking-tight whitespace-nowrap">{item.name}</span>
            {item.category && (
              <span className="text-[10px] font-mono text-slate-500 px-1.5 py-0.5 rounded bg-slate-800/60 ml-1">
                {item.category}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
