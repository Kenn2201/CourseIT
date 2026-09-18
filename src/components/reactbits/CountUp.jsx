import React, { useRef, useEffect, useState } from 'react';
import gsap from 'gsap';

/**
 * CountUp
 * GSAP-powered smooth number counter for real metrics and telemetry.
 * Respects prefers-reduced-motion.
 */
export default function CountUp({
  from = 0,
  to = 0,
  duration = 0.8,
  decimals = 0,
  separator = ',',
  prefix = '',
  suffix = '',
  className = ''
}) {
  const [displayValue, setDisplayValue] = useState(from);
  const valRef = useRef({ value: from });

  useEffect(() => {
    // If target value changes or is invalid
    const target = Number(to);
    if (isNaN(target)) {
      setDisplayValue(to);
      return;
    }

    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    if (prefersReducedMotion) {
      setDisplayValue(target);
      return;
    }

    valRef.current.value = from;

    const tween = gsap.to(valRef.current, {
      value: target,
      duration,
      ease: 'power2.out',
      onUpdate: () => {
        setDisplayValue(valRef.current.value);
      }
    });

    return () => tween.kill();
  }, [from, to, duration]);

  const formatNumber = (num) => {
    if (typeof num !== 'number' || isNaN(num)) return num;
    const fixed = num.toFixed(decimals);
    const [intPart, decPart] = fixed.split('.');
    const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, separator);
    return decPart !== undefined ? `${formattedInt}.${decPart}` : formattedInt;
  };

  return (
    <span className={`tabular-nums ${className}`}>
      {prefix}
      {formatNumber(displayValue)}
      {suffix}
    </span>
  );
}
