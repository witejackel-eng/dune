"use client";

import { useEffect, useRef } from "react";
import { useCanvas2D } from "@/components/experience/hooks/use-canvas-2d";

/** Small live visualization for each archive entry, used in the list. */
export function ExperimentMiniViz({
  slug,
  seed,
}: {
  slug: string;
  seed: number;
}) {
  switch (slug) {
    case "volatility-field":
      return <VolatilityFieldMini seed={seed} />;
    case "covariance-body":
      return <CovarianceBodyMini seed={seed} />;
    case "fourier-room":
      return <FourierRoomMini seed={seed} />;
    case "brownian-choir":
      return <BrownianChoirMini seed={seed} />;
    case "phase-architecture":
      return <PhaseArchitectureMini seed={seed} />;
    case "liquidity-horizon":
      return <LiquidityHorizonMini seed={seed} />;
    default:
      return null;
  }
}

function VolatilityFieldMini({ seed }: { seed: number }) {
  const canvas = useCanvas2D(
    (ctx, w, h, t) => {
      ctx.clearRect(0, 0, w, h);
      const cols = 30, rows = 20;
      const cellW = w / cols, cellH = h / rows;
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const v = Math.sin(i * 0.3 + j * 0.2 + seed * 0.0001 + t * 0.4) * 0.5 + Math.sin(i * 0.1 - j * 0.3 + t * 0.2) * 0.3;
          const intensity = (v + 1) / 2;
          ctx.fillStyle = `rgb(${Math.floor(58 + intensity * 146)},${Math.floor(36 + intensity * 62)},${Math.floor(23 + intensity * 49)})`;
          ctx.globalAlpha = 0.4 + intensity * 0.5;
          ctx.fillRect(i * cellW, j * cellH, cellW, cellH);
        }
      }
      ctx.globalAlpha = 1;
    },
    [seed]
  );
  return <canvas ref={canvas} className="absolute inset-0 w-full h-full" aria-hidden="true" />;
}

function CovarianceBodyMini({ seed }: { seed: number }) {
  const canvas = useCanvas2D(
    (ctx, w, h, t) => {
      ctx.clearRect(0, 0, w, h);
      const cx = w / 2, cy = h / 2;
      const r = Math.min(w, h) * 0.35;
      const n = 10;
      const nodes = [];
      for (let i = 0; i < n; i++) {
        const angle = (i / n) * Math.PI * 2 + t * 0.1;
        const rad = r * (0.7 + Math.sin(i + t * 0.5) * 0.3);
        nodes.push({ x: cx + Math.cos(angle) * rad, y: cy + Math.sin(angle) * rad, mag: 0.3 + Math.abs(Math.sin(i * 1.7 + seed * 0.0001)) * 0.7 });
      }
      for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < r * 0.9) {
            const opacity = (1 - dist / (r * 0.9)) * 0.4;
            const sign = (i + j) % 3 === 0 ? 1 : -1;
            ctx.strokeStyle = sign > 0 ? `rgba(216,154,72,${opacity})` : `rgba(164,49,36,${opacity})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      }
      for (const node of nodes) {
        ctx.fillStyle = "#D8C7A9";
        ctx.globalAlpha = node.mag;
        ctx.beginPath();
        ctx.arc(node.x, node.y, 1.5 + node.mag * 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    },
    [seed]
  );
  return <canvas ref={canvas} className="absolute inset-0 w-full h-full" aria-hidden="true" />;
}

function FourierRoomMini({ seed }: { seed: number }) {
  const canvas = useCanvas2D(
    (ctx, w, h, t) => {
      ctx.clearRect(0, 0, w, h);
      const cy = h / 2;
      const waves = [
        { freq: 1, amp: 0.25, phase: 0 },
        { freq: 2, amp: 0.15, phase: Math.PI / 3 },
        { freq: 4, amp: 0.08, phase: Math.PI / 2 },
      ];
      ctx.strokeStyle = "#D89A48";
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 0; x <= w; x += 1) {
        let y = 0;
        for (const wave of waves) y += Math.sin(x * 0.02 * wave.freq + wave.phase + t) * h * wave.amp;
        if (x === 0) ctx.moveTo(x, cy + y);
        else ctx.lineTo(x, cy + y);
      }
      ctx.stroke();
    },
    [seed]
  );
  return <canvas ref={canvas} className="absolute inset-0 w-full h-full" aria-hidden="true" />;
}

function BrownianChoirMini({ seed }: { seed: number }) {
  const canvas = useCanvas2D(
    (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      // Pseudo-random seeded paths
      let s = seed >>> 0;
      const rng = () => {
        s = (s + 0x6d2b79f5) | 0;
        let t = s;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
      const paths = 30;
      const steps = 60;
      for (let p = 0; p < paths; p++) {
        ctx.strokeStyle = `rgba(216,154,72,${0.2 + (p / paths) * 0.3})`;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        let y = h / 2;
        for (let i = 0; i < steps; i++) {
          const x = (i / (steps - 1)) * w;
          y += (rng() - 0.5) * 6;
          y = Math.max(4, Math.min(h - 4, y));
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    },
    [seed]
  );
  return <canvas ref={canvas} className="absolute inset-0 w-full h-full" aria-hidden="true" />;
}

function PhaseArchitectureMini({ seed }: { seed: number }) {
  const canvas = useCanvas2D(
    (ctx, w, h, t) => {
      ctx.clearRect(0, 0, w, h);
      const cx = w / 2, cy = h / 2;
      const r = Math.min(w, h) * 0.35;
      ctx.strokeStyle = "rgba(216,154,72,0.6)";
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      for (let i = 0; i <= 200; i++) {
        const tt = (i / 200) * Math.PI * 2;
        const x = cx + Math.sin(tt * 3 + t * 0.3) * r;
        const y = cy + Math.sin(tt * 4) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    },
    [seed]
  );
  return <canvas ref={canvas} className="absolute inset-0 w-full h-full" aria-hidden="true" />;
}

function LiquidityHorizonMini({ seed }: { seed: number }) {
  const canvas = useCanvas2D(
    (ctx, w, h, t) => {
      ctx.clearRect(0, 0, w, h);
      // Ridgeline density plot
      const lines = 6;
      for (let l = 0; l < lines; l++) {
        const baseY = h * (0.2 + l * 0.13);
        ctx.fillStyle = `rgba(164,108,59,${0.15 + l * 0.08})`;
        ctx.beginPath();
        ctx.moveTo(0, h);
        for (let x = 0; x <= w; x += 3) {
          const peak = Math.exp(-Math.pow((x - w * (0.3 + Math.sin(t * 0.3 + l) * 0.2)) / (w * 0.15), 2)) * (h * 0.18);
          const y = baseY - peak;
          ctx.lineTo(x, y);
        }
        ctx.lineTo(w, h);
        ctx.closePath();
        ctx.fill();
      }
    },
    [seed]
  );
  return <canvas ref={canvas} className="absolute inset-0 w-full h-full" aria-hidden="true" />;
}
