import React, { useRef, useState, useEffect } from 'react';

/**
 * FadeContent
 * Lightweight scroll-entrance animation component using IntersectionObserver.
 * Smoothly fades and lifts content into view with zero third-party dependencies.
 * Fully respects prefers-reduced-motion.
 */
export default function FadeContent({
  children,
  delay = 0,
  duration = 500,
  blur = false,
  className = '',
  threshold = 0.1
}) {
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef(null);

  useEffect(() => {
    // Respect reduced motion preference
    if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches) {
      setIsVisible(true);
      return;
    }

    if (!('IntersectionObserver' in window)) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (elementRef.current) {
            observer.unobserve(elementRef.current);
          }
        }
      },
      { threshold }
    );

    const currentElem = elementRef.current;
    if (currentElem) {
      observer.observe(currentElem);
    }

    return () => {
      if (currentElem) observer.unobserve(currentElem);
    };
  }, [threshold]);

  return (
    <div
      ref={elementRef}
      className={`transition-all ${className}`}
      style={{
        transitionDuration: `${duration}ms`,
        transitionDelay: `${delay}ms`,
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
        filter: blur ? (isVisible ? 'blur(0px)' : 'blur(4px)') : undefined
      }}
    >
      {children}
    </div>
  );
}
