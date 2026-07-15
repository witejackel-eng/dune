"use client";

import { useState, useMemo } from "react";
import { FOUR_FORCES } from "@/content/site-content";
import { useCanvas2D } from "@/components/experience/hooks/use-canvas-2d";
import { simulateGBM, lissajous, terrainHeight } from "@/lib/math";
import { mulberry32 } from "@/lib/seeded-random";
import { useSystemStatus } from "@/components/layout/system-status";

/**
 * Brief §9 Section 3: Full-width instrument panel where the active force changes the visual field.
 * NOT four generic cards — a single panel with a force selector and a live visualization.
 */
export function FourForcesPanel() {
  const [active, setActive] = useState(0);
  const force = FOUR_FORCES[active];

  return (
    <div className="grid grid-cols-12 gap-4">
      {/* Force selector */}
      <div className="col-span-12 lg:col-span-3">
        <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible">
          {FOUR_FORCES.map((f, i) => {
            const isActive = i === active;
            return (
              <button
                key={f.code}
                onClick={() => setActive(i)}
                className={`group flex-shrink-0 lg:flex-shrink flex items-start gap-3 p-4 hairline transition-all text-left ${
                  isActive ? "bg-mineral" : "bg-transparent hover:bg-mineral/50"
                }`}
                data-cursor="activate"
                data-cursor-label={f.code}
                aria-pressed={isActive}
              >
                <span
                  className={`font-mono text-[10px] tracking-[0.18em] uppercase ${
                    isActive ? "text-amber" : "text-dust/40"
                  }`}
                >
                  {f.code}
                </span>
                <div className="flex-1">
                  <div
                    className={`font-display text-base font-bold tracking-tight ${
                      isActive ? "text-bone" : "text-dust/60"
                    }`}
                  >
                    {f.name}
                  </div>
                  <div className="font-mono text-[9px] tracking-[0.1em] text-dust/40 mt-1 hidden lg:block">
                    {f.tagline}
                  </div>
                </div>
                {isActive && (
                  <span className="w-1 h-1 bg-amber blink mt-2" aria-hidden="true" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Visualization */}
      <div className="col-span-12 lg:col-span-6">
        <div className="relative aspect-[4/3] bg-mineral hairline">
          {active === 0 && <DriftViz />}
          {active === 1 && <PhaseViz />}
          {active === 2 && <PressureViz />}
          {active === 3 && <RhythmViz />}
        </div>
      </div>

      {/* Description */}
      <div className="col-span-12 lg:col-span-3 flex flex-col gap-4">
        <div>
          <span
            className="label-t-bright"
            style={{ color: force.color }}
          >
            {force.code} / {force.name}
          </span>
          <p className="editorial-t text-xl md:text-2xl text-bone mt-2 leading-snug">
            {force.tagline}
          </p>
        </div>
        <p className="body-t text-sm text-dust/70">{force.description}</p>
        <div className="hairline-t pt-3 mt-auto">
          <span className="label-t">VISUAL SYSTEM</span>
          <ul className="mt-2 space-y-1">
            {force.visualSystem.map((v) => (
              <li key={v} className="font-mono text-[10px] tracking-[0.08em] text-dust/60 flex items-start gap-2">
                <span className="text-amber/60 mt-px">·</span>
                <span>{v}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function DriftViz() {
  const { seed } = useSystemStatus();
  const result = useMemo(() => {
    const rng = mulberry32(seed);
    return simulateGBM(
      { s0: 100, mu: 0.05, sigma: 0.2, T: 1, steps: 80, paths: 60 },
      rng
    );
  }, [seed]);

  const canvas = useCanvas2D(
    (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      const pad = 8;
      let minY = Infinity, maxY = -Infinity;
      for (const p of result.paths)
        for (const v of p) {
          if (v < minY) minY = v;
          if (v > maxY) maxY = v;
        }
      const yRange = maxY - minY || 1;
      for (const path of result.paths) {
        ctx.strokeStyle = "rgba(216,154,72,0.25)";
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        for (let i = 0; i < path.length; i++) {
          const x = pad + (i / (path.length - 1)) * (w - 2 * pad);
          const y = pad + (1 - (path[i] - minY) / yRange) * (h - 2 * pad);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    },
    [result]
  );
  return <canvas ref={canvas} className="absolute inset-0 w-full h-full" aria-label="Geometric Brownian motion — thousands of seeded paths separating and converging over time." />;
}

function PhaseViz() {
  const canvas = useCanvas2D((ctx, w, h, t) => {
    ctx.clearRect(0, 0, w, h);
    const cx = w / 2, cy = h / 2;
    const r = Math.min(w, h) * 0.35;
    const time = t * 0.3;

    // Multiple sine waves with phase offsets
    const waves = [
      { freq: 3, phase: 0, color: "rgba(216,154,72,0.7)" },
      { freq: 4, phase: Math.PI / 4, color: "rgba(216,199,169,0.5)" },
      { freq: 5, phase: Math.PI / 2, color: "rgba(164,108,59,0.4)" },
    ];

    for (const wave of waves) {
      ctx.strokeStyle = wave.color;
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      for (let i = 0; i <= 200; i++) {
        const tt = (i / 200) * Math.PI * 2;
        const x = cx + Math.sin(tt * wave.freq + wave.phase + time) * r;
        const y = cy + Math.sin(tt * (wave.freq + 1) + time) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // Center dot
    ctx.fillStyle = "#A43124";
    ctx.beginPath();
    ctx.arc(cx, cy, 2, 0, Math.PI * 2);
    ctx.fill();
  });
  return <canvas ref={canvas} className="absolute inset-0 w-full h-full" aria-label="Lissajous figures — sine waves with phase offsets producing interference patterns." />;
}

function PressureViz() {
  const { seed } = useSystemStatus();
  const canvas = useCanvas2D(
    (ctx, w, h, t) => {
      ctx.clearRect(0, 0, w, h);
      const cols = 60, rows = 40;
      const cellW = w / cols, cellH = h / rows;
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const v = terrainHeight(i * 0.3, j * 0.3, seed, 3, 0.5, 0.1) +
                    Math.sin(t * 0.4 + i * 0.2) * 0.1;
          // Map to color: red for high pressure (peaks), sand for valleys
          const intensity = Math.max(0, Math.min(1, (v + 0.3) / 0.8));
          const r = Math.floor(58 + intensity * 146);
          const g = Math.floor(36 + intensity * 62);
          const b = Math.floor(23 + intensity * 49);
          ctx.fillStyle = `rgb(${r},${g},${b})`;
          ctx.globalAlpha = 0.4 + intensity * 0.5;
          ctx.fillRect(i * cellW, j * cellH, cellW, cellH);
        }
      }
      ctx.globalAlpha = 1;

      // Topographic contour lines
      ctx.strokeStyle = "rgba(216,199,169,0.25)";
      ctx.lineWidth = 0.4;
      for (let level = 0; level < 1; level += 0.15) {
        ctx.beginPath();
        for (let i = 0; i < cols; i++) {
          for (let j = 0; j < rows; j++) {
            const v = terrainHeight(i * 0.3, j * 0.3, seed, 3, 0.5, 0.1);
            if (Math.abs(v - (level - 0.3)) < 0.03) {
              ctx.rect(i * cellW, j * cellH, cellW, cellH);
            }
          }
        }
        ctx.stroke();
      }
    },
    [seed]
  );
  return <canvas ref={canvas} className="absolute inset-0 w-full h-full" aria-label="Topographic interpretation of changing uncertainty — volatility values deforming a surface." />;
}

function RhythmViz() {
  const canvas = useCanvas2D((ctx, w, h, t) => {
    ctx.clearRect(0, 0, w, h);
    const cols = 16, rows = 4;
    const pad = 12;
    const cellW = (w - 2 * pad) / cols;
    const cellH = (h - 2 * pad) / rows;

    // Pattern: kick on 0,4,8,12; hat on 2,6,10,14; sub on 0,8; air on every 3rd
    const pattern: boolean[][] = [
      [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false],
      [false, false, true, false, false, false, true, false, false, false, true, false, false, false, true, false],
      [true, false, false, false, false, false, false, false, true, false, false, false, false, false, false, false],
      [false, true, false, false, false, false, true, false, false, true, false, false, false, false, true, false],
    ];
    const channelColors = ["#D89A48", "#D8C7A9", "#A46C3B", "#A43124"];

    // Current step — 124 BPM, 16 steps
    const beatDur = 60 / 124 / 4;
    const stepIdx = Math.floor(t / beatDur) % 16;
    const stepPhase = (t / beatDur) % 1;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = pad + c * cellW;
        const y = pad + r * cellH;
        const active = pattern[r][c];
        const isCurrent = c === stepIdx;
        if (active) {
          const pulse = isCurrent ? 1 - stepPhase * 0.5 : 0.5;
          ctx.fillStyle = channelColors[r];
          ctx.globalAlpha = pulse;
          ctx.fillRect(x + 1, y + 1, cellW - 2, cellH - 2);
        } else {
          ctx.strokeStyle = "rgba(216,199,169,0.1)";
          ctx.lineWidth = 0.5;
          ctx.strokeRect(x + 1, y + 1, cellW - 2, cellH - 2);
        }
        if (isCurrent) {
          ctx.strokeStyle = "rgba(216,154,72,0.6)";
          ctx.lineWidth = 1;
          ctx.strokeRect(x + 0.5, y + 0.5, cellW - 1, cellH - 1);
        }
      }
    }
    ctx.globalAlpha = 1;

    // Channel labels
    ctx.fillStyle = "rgba(216,199,169,0.5)";
    ctx.font = "8px IBM Plex Mono, monospace";
    const labels = ["PULSE", "GRAIN", "AIR", "SUB"];
    for (let r = 0; r < rows; r++) {
      ctx.fillText(labels[r], 2, pad + r * cellH + cellH / 2 + 3);
    }
  });
  return <canvas ref={canvas} className="absolute inset-0 w-full h-full" aria-label="16-step sequencing — pulses, gates, rests, accents, and releases arranged in a 4/4 rhythmic grid." />;
}
