import React, { useState, useEffect } from 'react';

/**
 * RotatingText
 * Lightweight, accessible text rotator for hero phrases.
 * Respects prefers-reduced-motion and avoids layout shift.
 */
export default function RotatingText({
  words = [],
  interval = 3200,
  className = '',
  highlightClassName = 'bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-violet-300 to-emerald-400'
}) {
  const [index, setIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (!words || words.length <= 1) return;

    // Respect reduced motion
    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    if (prefersReducedMotion) return;

    const timer = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % words.length);
        setIsAnimating(false);
      }, 300); // match transition out
    }, interval);

    return () => clearInterval(timer);
  }, [words, interval]);

  if (!words.length) return null;

  const currentWord = words[index];

  return (
    <span
      className={`inline-block transition-all duration-300 transform ${className} ${
        isAnimating ? 'opacity-0 -translate-y-2' : 'opacity-100 translate-y-0'
      }`}
      aria-live="polite"
    >
      <span className={highlightClassName}>{currentWord}</span>
    </span>
  );
}
