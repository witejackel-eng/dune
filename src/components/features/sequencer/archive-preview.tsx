"use client";

import Link from "next/link";
import { useCanvas2D } from "@/components/experience/hooks/use-canvas-2d";
import type { Experiment } from "@/content/site-content";

/**
 * Brief §9 Section 6: Show 3 featured experiments with live WebGL or canvas previews.
 * Each preview is interactive — clicking opens the archive entry.
 */
export function ArchivePreview({ experiments }: { experiments: Experiment[] }) {
  return (
    <div className="grid grid-cols-12 gap-4">
      {experiments.map((exp, i) => (
        <Link
          key={exp.slug}
          href="/archive"
          className="col-span-12 md:col-span-4 group block"
          data-cursor="enter"
          data-cursor-label={`EXP ${exp.number}`}
        >
          <div className="relative aspect-[4/5] bg-mineral hairline overflow-hidden">
            {i === 0 && <VolatilityFieldPreview seed={exp.seed} />}
            {i === 1 && <CovarianceBodyPreview seed={exp.seed} />}
            {i === 2 && <FourierRoomPreview seed={exp.seed} />}
            <div className="absolute top-3 left-3 right-3 flex items-start justify-between">
              <span className="label-t-bright">EXP / {exp.number}</span>
              <span className="label-t">{exp.status.toUpperCase()}</span>
            </div>
            <div className="absolute bottom-3 left-3 right-3">
              <p className="font-display text-base md:text-lg font-bold tracking-tight text-bone group-hover:text-amber transition-colors">
                {exp.title}
              </p>
              <p className="font-mono text-[9px] tracking-[0.08em] text-dust/50 mt-1 line-clamp-2">
                {exp.hypothesis}
              </p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

function VolatilityFieldPreview({ seed }: { seed: number }) {
  const canvas = useCanvas2D(
    (ctx, w, h, t) => {
      ctx.clearRect(0, 0, w, h);
      const cols = 40, rows = 50;
      const cellW = w / cols, cellH = h / rows;
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const v =
            Math.sin(i * 0.3 + j * 0.2 + seed * 0.0001 + t * 0.4) * 0.5 +
            Math.sin(i * 0.1 - j * 0.3 + t * 0.2) * 0.3;
          const intensity = (v + 1) / 2;
          const r = Math.floor(58 + intensity * 146);
          const g = Math.floor(36 + intensity * 62);
          const b = Math.floor(23 + intensity * 49);
          ctx.fillStyle = `rgb(${r},${g},${b})`;
          ctx.globalAlpha = 0.3 + intensity * 0.6;
          ctx.fillRect(i * cellW, j * cellH, cellW, cellH);
        }
      }
      ctx.globalAlpha = 1;
    },
    [seed]
  );
  return <canvas ref={canvas} className="absolute inset-0 w-full h-full" aria-hidden="true" />;
}

function CovarianceBodyPreview({ seed }: { seed: number }) {
  const canvas = useCanvas2D(
    (ctx, w, h, t) => {
      ctx.clearRect(0, 0, w, h);
      const cx = w / 2, cy = h / 2;
      const r = Math.min(w, h) * 0.35;
      const n = 12;
      const nodes: { x: number; y: number; mag: number }[] = [];
      for (let i = 0; i < n; i++) {
        const angle = (i / n) * Math.PI * 2 + t * 0.1;
        const rad = r * (0.7 + Math.sin(i + t * 0.5) * 0.3);
        nodes.push({
          x: cx + Math.cos(angle) * rad,
          y: cy + Math.sin(angle) * rad,
          mag: 0.3 + Math.abs(Math.sin(i * 1.7 + seed * 0.0001)) * 0.7,
        });
      }
      // Edges
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
      // Nodes
      for (const node of nodes) {
        ctx.fillStyle = "#D8C7A9";
        ctx.globalAlpha = node.mag;
        ctx.beginPath();
        ctx.arc(node.x, node.y, 2 + node.mag * 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    },
    [seed]
  );
  return <canvas ref={canvas} className="absolute inset-0 w-full h-full" aria-hidden="true" />;
}

function FourierRoomPreview({ seed }: { seed: number }) {
  const canvas = useCanvas2D(
    (ctx, w, h, t) => {
      ctx.clearRect(0, 0, w, h);
      const cy = h / 2;
      // Three sine waves stacked + combined
      const waves = [
        { freq: 1, amp: 0.25, phase: 0, color: "rgba(216,154,72,0.5)" },
        { freq: 2, amp: 0.15, phase: Math.PI / 3, color: "rgba(216,199,169,0.4)" },
        { freq: 4, amp: 0.08, phase: Math.PI / 2, color: "rgba(164,108,59,0.4)" },
      ];
      // Individual waves (faint)
      waves.forEach((wave, i) => {
        ctx.strokeStyle = wave.color;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        for (let x = 0; x <= w; x += 2) {
          const y = cy + Math.sin(x * 0.02 * wave.freq + wave.phase + t) * h * wave.amp;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      });
      // Combined
      ctx.strokeStyle = "#D89A48";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (let x = 0; x <= w; x += 1) {
        let y = 0;
        for (const wave of waves) {
          y += Math.sin(x * 0.02 * wave.freq + wave.phase + t) * h * wave.amp;
        }
        if (x === 0) ctx.moveTo(x, cy + y);
        else ctx.lineTo(x, cy + y);
      }
      ctx.stroke();
    },
    [seed]
  );
  return <canvas ref={canvas} className="absolute inset-0 w-full h-full" aria-hidden="true" />;
}
