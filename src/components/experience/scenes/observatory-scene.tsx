"use client";

import { useEffect, useRef } from "react";
import { useSystemStatus } from "@/components/layout/system-status";

/**
 * Brief §9 Section 1: Procedural granular landscape, long shadows, atmospheric particulate matter,
 * distant celestial object, monumental abstract instrument, slowly changing light, near-black sky,
 * controlled depth fog, fine surface displacement.
 *
 * Implemented as Canvas2D for stability and broad device support. The scene is procedural — no
 * downloaded images — and uses the seeded simulation time from the system status.
 */
export function ObservatoryScene({ far }: { far?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { seed } = useSystemStatus();
  const seedRef = useRef(seed);
  seedRef.current = seed;
  const pointerRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let visible = true;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isMobile = window.matchMedia("(max-width: 768px)").matches;

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

    const onPointer = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointerRef.current = {
        x: (e.clientX - rect.left) / rect.width - 0.5,
        y: (e.clientY - rect.top) / rect.height - 0.5,
      };
    };
    canvas.addEventListener("pointermove", onPointer);

    const start = performance.now();

    // Procedural terrain height function (FBM-like via layered sines + seed)
    const terrain = (x: number, time: number) => {
      const s = seedRef.current * 0.0001;
      const w = canvas.getBoundingClientRect().width;
      const nx = x / w;
      const t = time * 0.04;
      return (
        Math.sin(nx * 4 + s + t * 0.3) * 18 +
        Math.sin(nx * 8 + s * 2 + t * 0.5) * 9 +
        Math.sin(nx * 16 + s * 3 + t * 0.8) * 4.5 +
        Math.sin(nx * 32 + s * 4) * 2.2
      );
    };

    const tick = (now: number) => {
      if (!visible) {
        raf = 0;
        return;
      }
      const time = (now - start) / 1000;
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;

      // Sky gradient — near-black with subtle warm shift
      const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.7);
      skyGrad.addColorStop(0, "#080806");
      skyGrad.addColorStop(0.6, "#0c0a07");
      skyGrad.addColorStop(1, "#15110b");
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, h);

      // Distant celestial object — slowly shifting eclipse
      const celX = w * 0.72 + pointerRef.current.x * 30;
      const celY = h * 0.32 + pointerRef.current.y * 10;
      const celR = Math.max(40, Math.min(w, h) * 0.09);
      // Halo
      const halo = ctx.createRadialGradient(celX, celY, celR * 0.5, celX, celY, celR * 3.5);
      halo.addColorStop(0, "rgba(216,154,72,0.18)");
      halo.addColorStop(0.4, "rgba(164,108,59,0.08)");
      halo.addColorStop(1, "rgba(8,8,6,0)");
      ctx.fillStyle = halo;
      ctx.fillRect(0, 0, w, h);
      // Eclipse shadow moves across the disc — 30s cycle
      const eclipsePhase = (Math.sin(time * 0.06) + 1) / 2; // 0..1
      const shadowOffset = (eclipsePhase - 0.5) * celR * 1.8;
      ctx.fillStyle = "#D8C7A9";
      ctx.beginPath();
      ctx.arc(celX, celY, celR, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#080806";
      ctx.beginPath();
      ctx.arc(celX + shadowOffset, celY, celR * 0.98, 0, Math.PI * 2);
      ctx.fill();
      // Thin ring of light at edge during partial eclipse
      if (eclipsePhase > 0.3 && eclipsePhase < 0.7) {
        ctx.strokeStyle = `rgba(216,154,72,${0.3 * Math.sin((eclipsePhase - 0.3) * Math.PI / 0.4)})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(celX, celY, celR + 1, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Atmospheric particulate matter
      const particleCount = isMobile ? 80 : 200;
      ctx.fillStyle = "rgba(216,199,169,0.35)";
      for (let i = 0; i < particleCount; i++) {
        const seed_i = (i * 9301 + 49297) % 233280;
        const r1 = (seed_i / 233280);
        const r2 = ((seed_i * 2) % 233280) / 233280;
        const px = (r1 * w + time * 8) % w;
        const py = r2 * h * 0.7 + Math.sin(time * 0.5 + i) * 4;
        const size = (i % 3) * 0.4 + 0.3;
        ctx.globalAlpha = 0.1 + (i % 5) * 0.04;
        ctx.fillRect(px, py, size, size);
      }
      ctx.globalAlpha = 1;

      // Procedural granular landscape — multiple layers for depth
      const layers = isMobile ? 3 : 5;
      for (let l = 0; l < layers; l++) {
        const depth = (l + 1) / layers;
        const layerY = h * (0.55 + l * 0.07);
        const amplitude = 18 + l * 8;
        const colorMix = Math.floor(8 + l * 4);
        ctx.fillStyle = `rgb(${colorMix + 8},${colorMix + 4},${colorMix})`;
        ctx.beginPath();
        ctx.moveTo(0, h);
        for (let x = 0; x <= w; x += 6) {
          const y = layerY + terrain(x + l * 200, time) * (1 - depth * 0.3);
          ctx.lineTo(x, y);
        }
        ctx.lineTo(w, h);
        ctx.closePath();
        ctx.fill();

        // Fine surface displacement highlight on the closest layer
        if (l === layers - 1) {
          ctx.strokeStyle = "rgba(164,108,59,0.25)";
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          for (let x = 0; x <= w; x += 6) {
            const y = layerY + terrain(x + l * 200, time) * (1 - depth * 0.3);
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
        }
      }

      // Monumental abstract instrument — vertical monolith split by narrow light channel
      const instrW = far ? Math.max(8, w * 0.012) : Math.max(40, w * 0.06);
      const instrH = far ? h * 0.32 : h * 0.55;
      const instrX = w * 0.5 - instrW / 2 + pointerRef.current.x * 12;
      const instrY = h * 0.55 - instrH + 40;

      // Instrument shadow — long geometric, low angle
      const shadowGrad = ctx.createLinearGradient(instrX, instrY + instrH, instrX + instrW * 6, instrY + instrH);
      shadowGrad.addColorStop(0, "rgba(8,8,6,0.6)");
      shadowGrad.addColorStop(1, "rgba(8,8,6,0)");
      ctx.fillStyle = shadowGrad;
      ctx.beginPath();
      ctx.moveTo(instrX, instrY + instrH);
      ctx.lineTo(instrX + instrW, instrY + instrH);
      ctx.lineTo(instrX + instrW + instrW * 5, instrY + instrH + 30);
      ctx.lineTo(instrX + instrW * 5, instrY + instrH + 30);
      ctx.closePath();
      ctx.fill();

      // Monolith body
      const bodyGrad = ctx.createLinearGradient(instrX, 0, instrX + instrW, 0);
      bodyGrad.addColorStop(0, "#080806");
      bodyGrad.addColorStop(0.5, "#1c1813");
      bodyGrad.addColorStop(1, "#080806");
      ctx.fillStyle = bodyGrad;
      ctx.fillRect(instrX, instrY, instrW, instrH);

      // Narrow vertical light channel down the center
      const channelW = Math.max(1, instrW * 0.08);
      const channelX = instrX + instrW / 2 - channelW / 2;
      const channelPulse = 0.7 + Math.sin(time * 0.8) * 0.3;
      const channelGrad = ctx.createLinearGradient(0, instrY, 0, instrY + instrH);
      channelGrad.addColorStop(0, `rgba(216,154,72,${0.9 * channelPulse})`);
      channelGrad.addColorStop(0.5, `rgba(216,154,72,${0.4 * channelPulse})`);
      channelGrad.addColorStop(1, `rgba(164,108,59,${0.2 * channelPulse})`);
      ctx.fillStyle = channelGrad;
      ctx.fillRect(channelX, instrY, channelW, instrH);

      // Horizontal calibration lines on the instrument (instrumentation feel)
      ctx.strokeStyle = "rgba(216,199,169,0.12)";
      ctx.lineWidth = 0.5;
      for (let i = 1; i < 8; i++) {
        const y = instrY + (instrH / 8) * i;
        ctx.beginPath();
        ctx.moveTo(instrX + 2, y);
        ctx.lineTo(instrX + instrW - 2, y);
        ctx.stroke();
      }

      // Slowly changing directional light — long shadow angle shifts
      const lightAngle = Math.sin(time * 0.05) * 0.3;
      ctx.save();
      ctx.translate(instrX + instrW / 2, instrY);
      ctx.rotate(lightAngle);
      ctx.strokeStyle = "rgba(238,231,218,0.08)";
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -instrH * 0.2);
      ctx.stroke();
      ctx.restore();

      // Depth fog at horizon
      const fogGrad = ctx.createLinearGradient(0, h * 0.55, 0, h * 0.8);
      fogGrad.addColorStop(0, "rgba(8,8,6,0.85)");
      fogGrad.addColorStop(1, "rgba(8,8,6,0)");
      ctx.fillStyle = fogGrad;
      ctx.fillRect(0, h * 0.55, w, h * 0.25);

      raf = reduced ? 0 : requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      canvas.removeEventListener("pointermove", onPointer);
    };
  }, [far]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      aria-hidden="true"
    />
  );
}
