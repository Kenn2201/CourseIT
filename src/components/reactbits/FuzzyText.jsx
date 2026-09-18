import React, { useRef, useEffect } from 'react';

/**
 * FuzzyText
 * Subtle canvas-based fuzzy / glitch text effect.
 * Perfect for 404 and error screens.
 * Respects prefers-reduced-motion and pauses when not visible.
 */
export default function FuzzyText({
  text = '404',
  fontSize = 72,
  fontWeight = 900,
  fontFamily = 'monospace',
  color = '#818cf8',
  fuzziness = 1.2,
  className = ''
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Respect reduced motion
    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;

    const dpr = window.devicePixelRatio || 1;
    const fontStr = `${fontWeight} ${fontSize}px ${fontFamily}`;
    ctx.font = fontStr;
    const textMetrics = ctx.measureText(text);

    const width = Math.ceil(textMetrics.width + fontSize * 0.5);
    const height = Math.ceil(fontSize * 1.3);

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    if (prefersReducedMotion) {
      ctx.font = fontStr;
      ctx.fillStyle = color;
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'center';
      ctx.fillText(text, width / 2, height / 2);
      return;
    }

    let animId;
    let isVisible = true;

    const handleVisibility = () => {
      isVisible = !document.hidden;
    };
    document.addEventListener('visibilitychange', handleVisibility);

    const render = () => {
      if (!isVisible) {
        animId = requestAnimationFrame(render);
        return;
      }

      ctx.clearRect(0, 0, width, height);
      ctx.font = fontStr;
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'center';

      // Multi-layer fuzzy jitter
      const jitterX = (Math.random() - 0.5) * fuzziness;
      const jitterY = (Math.random() - 0.5) * fuzziness;

      // Glow layer
      ctx.shadowColor = 'rgba(99, 102, 241, 0.6)';
      ctx.shadowBlur = 12;
      ctx.fillStyle = color;
      ctx.fillText(text, width / 2 + jitterX, height / 2 + jitterY);

      // Reset shadow for crisp layer
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#ffffff';
      ctx.fillText(text, width / 2, height / 2);

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [text, fontSize, fontWeight, fontFamily, color, fuzziness]);

  return (
    <div className={`inline-block relative ${className}`} aria-label={text}>
      <canvas ref={canvasRef} className="block mx-auto" />
      <span className="sr-only">{text}</span>
    </div>
  );
}
