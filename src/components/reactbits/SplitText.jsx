import React, { useRef, useEffect } from 'react';
import gsap from 'gsap';

/**
 * SplitText
 * High-performance GSAP word-by-word entrance animation.
 * Optimized for ADHD-friendly readability: animates by words rather than slow character-by-character.
 * Respects prefers-reduced-motion.
 */
export default function SplitText({
  text = '',
  className = '',
  wordClassName = 'inline-block mr-[0.25em]',
  delay = 0.05,
  duration = 0.6,
  ease = 'power3.out',
  from = { opacity: 0, y: 20 },
  to = { opacity: 1, y: 0 },
  splitType = 'words',
  onComplete
}) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || !text) return;

    // Respect reduced motion
    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    if (prefersReducedMotion) return;

    const targets = containerRef.current.querySelectorAll('.split-item');
    if (!targets.length) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        targets,
        { ...from },
        {
          ...to,
          duration,
          ease,
          stagger: delay,
          onComplete
        }
      );
    }, containerRef);

    return () => ctx.revert();
  }, [text, delay, duration, ease, onComplete]);

  if (!text) return null;

  const words = text.split(' ');

  return (
    <span ref={containerRef} className={`inline-block ${className}`} aria-label={text}>
      {words.map((word, i) => (
        <span key={`${word}-${i}`} className={`split-item ${wordClassName}`}>
          {word}
        </span>
      ))}
    </span>
  );
}
