"use client";

import { useEffect, useRef } from "react";

/**
 * Reusable Canvas2D rendering hook.
 * Brief §18: Pause when offscreen (IntersectionObserver), respect reduced motion.
 */
export function useCanvas2D(
  draw: (ctx: CanvasRenderingContext2D, width: number, height: number, time: number) => void,
  deps: unknown[] = []
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawRef = useRef(draw);
  drawRef.current = draw;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let visible = true;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible && !raf) tick(performance.now());
      },
      { threshold: 0.05 }
    );
    io.observe(canvas);

    const startTime = performance.now();
    const tick = (now: number) => {
      if (!visible) {
        raf = 0;
        return;
      }
      const t = (now - startTime) / 1000;
      const rect = canvas.getBoundingClientRect();
      drawRef.current(ctx, rect.width, rect.height, t);
      if (!reduced) {
        raf = requestAnimationFrame(tick);
      } else {
        // reduced motion — draw once, no loop
        raf = 0;
      }
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return canvasRef;
}
