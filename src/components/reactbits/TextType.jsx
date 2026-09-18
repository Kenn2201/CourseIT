import React, { useState, useEffect } from 'react';

/**
 * TextType
 * Terminal-style typewriter effect cycling through status phrases.
 * Ideal for live status and generation progress.
 * Respects prefers-reduced-motion and cleans up timers on unmount.
 */
export default function TextType({
  text = [],
  typingSpeed = 35,
  deletingSpeed = 20,
  pauseDuration = 1000,
  cursorCharacter = '_',
  showCursor = true,
  className = ''
}) {
  const strings = Array.isArray(text) ? text : [text];
  const [displayedText, setDisplayedText] = useState('');
  const [stringIndex, setStringIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!strings.length) return;

    // Respect reduced motion
    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    if (prefersReducedMotion) {
      setDisplayedText(strings[0]);
      return;
    }

    const currentTarget = strings[stringIndex] || '';

    let timeout;
    if (!isDeleting) {
      if (displayedText.length < currentTarget.length) {
        timeout = setTimeout(() => {
          setDisplayedText(currentTarget.slice(0, displayedText.length + 1));
        }, typingSpeed);
      } else {
        // Finished typing word, wait before deleting (only if more than 1 string)
        if (strings.length > 1) {
          timeout = setTimeout(() => {
            setIsDeleting(true);
          }, pauseDuration);
        }
      }
    } else {
      if (displayedText.length > 0) {
        timeout = setTimeout(() => {
          setDisplayedText(currentTarget.slice(0, displayedText.length - 1));
        }, deletingSpeed);
      } else {
        // Finished deleting, move to next word
        setIsDeleting(false);
        setStringIndex((prev) => (prev + 1) % strings.length);
      }
    }

    return () => clearTimeout(timeout);
  }, [displayedText, isDeleting, stringIndex, strings, typingSpeed, deletingSpeed, pauseDuration]);

  return (
    <span className={`inline-flex items-center font-mono ${className}`} aria-live="polite">
      <span>{displayedText}</span>
      {showCursor && (
        <span className="ml-0.5 inline-block text-indigo-400 animate-pulse font-bold">
          {cursorCharacter}
        </span>
      )}
    </span>
  );
}
