"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { useCanvas2D } from "@/components/experience/hooks/use-canvas-2d";
import {
  ParameterSlider,
  ParameterReadout,
  SeedPill,
} from "@/components/controls/parameter-controls";
import { useSystemStatus } from "@/components/layout/system-status";
import { simulateGBM } from "@/lib/math";
import { mulberry32 } from "@/lib/seeded-random";

/**
 * Brief §9 Section 4: Interactive seeded Monte Carlo simulation.
 * Controls: paths, drift, volatility, time horizon, seed regeneration.
 * Display: simulated paths, median, p05/p95 bands, distribution shape, convergence behaviour.
 */
export function MonteCarloChamber() {
  const { seed, regenerateSeed } = useSystemStatus();
  const [paths, setPaths] = useState(600);
  const [mu, setMu] = useState(0.08);
  const [sigma, setSigma] = useState(0.25);
  const [T, setT] = useState(1.0);

  const result = useMemo(() => {
    const rng = mulberry32(seed);
    return simulateGBM(
      {
        s0: 100,
        mu,
        sigma,
        T,
        steps: 120,
        paths: Math.min(paths, 1500),
      },
      rng
    );
  }, [seed, mu, sigma, T, paths]);

  const pathsCanvas = useCanvas2D(
    (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      const padding = { top: 16, right: 16, bottom: 24, left: 40 };
      const plotW = w - padding.left - padding.right;
      const plotH = h - padding.top - padding.bottom;

      // Find y range
      let minY = Infinity;
      let maxY = -Infinity;
      for (const p of result.paths) {
        for (const v of p) {
          if (v < minY) minY = v;
          if (v > maxY) maxY = v;
        }
      }
      const yPad = (maxY - minY) * 0.08;
      minY -= yPad;
      maxY += yPad;
      const yRange = maxY - minY || 1;

      const xScale = (i: number) => padding.left + (i / (result.times.length - 1)) * plotW;
      const yScale = (v: number) => padding.top + plotH - ((v - minY) / yRange) * plotH;

      // Grid + axis
      ctx.strokeStyle = "rgba(216,199,169,0.08)";
      ctx.lineWidth = 0.5;
      ctx.font = "9px IBM Plex Mono, monospace";
      ctx.fillStyle = "rgba(216,199,169,0.45)";
      for (let i = 0; i <= 4; i++) {
        const y = padding.top + (plotH / 4) * i;
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(w - padding.right, y);
        ctx.stroke();
        const val = maxY - (yRange / 4) * i;
        ctx.fillText(val.toFixed(0), 4, y + 3);
      }
      for (let i = 0; i <= 4; i++) {
        const x = padding.left + (plotW / 4) * i;
        ctx.beginPath();
        ctx.moveTo(x, padding.top);
        ctx.lineTo(x, padding.top + plotH);
        ctx.stroke();
        const t = (T * i) / 4;
        ctx.fillText(`t=${t.toFixed(1)}`, x - 12, h - 8);
      }

      // p05-p95 band (filled area)
      ctx.fillStyle = "rgba(164,108,59,0.15)";
      ctx.beginPath();
      for (let i = 0; i < result.times.length; i++) {
        const x = xScale(i);
        const y = yScale(result.p95[i]);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      for (let i = result.times.length - 1; i >= 0; i--) {
        const x = xScale(i);
        const y = yScale(result.p05[i]);
        ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();

      // Individual paths (sparse — draw every Nth for clarity)
      const stride = Math.max(1, Math.floor(result.paths.length / 200));
      ctx.lineWidth = 0.5;
      for (let p = 0; p < result.paths.length; p += stride) {
        const path = result.paths[p];
        ctx.strokeStyle = "rgba(216,199,169,0.12)";
        ctx.beginPath();
        for (let i = 0; i < path.length; i++) {
          const x = xScale(i);
          const y = yScale(path[i]);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      // Median (bright)
      ctx.strokeStyle = "#D89A48";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let i = 0; i < result.median.length; i++) {
        const x = xScale(i);
        const y = yScale(result.median[i]);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Mean (dashed)
      ctx.strokeStyle = "rgba(238,231,218,0.5)";
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      for (let i = 0; i < result.mean.length; i++) {
        const x = xScale(i);
        const y = yScale(result.mean[i]);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    },
    [result]
  );

  // Distribution histogram
  const distCanvas = useCanvas2D(
    (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      const dist = result.finalDistribution;
      if (dist.length === 0) return;
      const min = Math.min(...dist);
      const max = Math.max(...dist);
      const range = max - min || 1;
      const bins = 24;
      const histogram = new Array(bins).fill(0);
      for (const v of dist) {
        const bin = Math.min(bins - 1, Math.floor(((v - min) / range) * bins));
        histogram[bin]++;
      }
      const maxCount = Math.max(...histogram) || 1;
      const barW = w / bins;
      ctx.fillStyle = "rgba(164,108,59,0.6)";
      for (let i = 0; i < bins; i++) {
        const barH = (histogram[i] / maxCount) * (h - 16);
        ctx.fillRect(i * barW + 1, h - barH - 8, barW - 2, barH);
      }
      // Median marker
      const medianFinal = result.median[result.median.length - 1];
      const medianBin = Math.min(bins - 1, Math.floor(((medianFinal - min) / range) * bins));
      ctx.strokeStyle = "#D89A48";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(medianBin * barW + barW / 2, 0);
      ctx.lineTo(medianBin * barW + barW / 2, h - 8);
      ctx.stroke();

      ctx.fillStyle = "rgba(216,199,169,0.5)";
      ctx.font = "9px IBM Plex Mono, monospace";
      ctx.fillText("DISTRIBUTION", 4, 10);
    },
    [result]
  );

  // Statistics
  const finalValues = result.finalDistribution;
  const stats = useMemo(() => {
    const sorted = [...finalValues].sort((a, b) => a - b);
    const n = sorted.length;
    if (n === 0) return { median: 0, p05: 0, p95: 0, mean: 0 };
    const q = (p: number) => sorted[Math.floor(n * p)] || 0;
    return {
      median: q(0.5),
      p05: q(0.05),
      p95: q(0.95),
      mean: sorted.reduce((a, b) => a + b, 0) / n,
    };
  }, [finalValues]);

  return (
    <div className="grid grid-cols-12 gap-4">
      {/* Controls */}
      <div className="col-span-12 lg:col-span-3 space-y-5">
        <div className="hairline-b pb-3">
          <span className="label-t">CONTROLS</span>
        </div>
        <ParameterSlider
          label="PATHS"
          value={paths}
          min={100}
          max={1500}
          step={50}
          precision={0}
          onChange={setPaths}
          hint="Number of simulated trajectories"
        />
        <ParameterSlider
          label="DRIFT μ"
          value={mu}
          min={-0.3}
          max={0.3}
          step={0.01}
          precision={3}
          onChange={setMu}
          hint="Annual drift coefficient"
        />
        <ParameterSlider
          label="VOLATILITY σ"
          value={sigma}
          min={0.05}
          max={0.6}
          step={0.01}
          precision={3}
          onChange={setSigma}
          hint="Annual volatility"
        />
        <ParameterSlider
          label="HORIZON T"
          value={T}
          min={0.25}
          max={5}
          step={0.25}
          precision={2}
          unit="y"
          onChange={setT}
          hint="Time horizon in years"
        />
        <div className="pt-2">
          <SeedPill seed={seed} onRegenerate={regenerateSeed} />
        </div>
      </div>

      {/* Main paths plot */}
      <div className="col-span-12 lg:col-span-7">
        <div className="flex items-center justify-between mb-2">
          <span className="label-t">SIMULATED PATHS / GBM</span>
          <span className="label-t text-amber">dS = μSdt + σSdW</span>
        </div>
        <div className="relative aspect-[16/9] bg-mineral hairline">
          <canvas ref={pathsCanvas} className="absolute inset-0 w-full h-full" />
        </div>
        <div className="mt-2 flex flex-wrap gap-4 font-mono text-[9px] tracking-[0.15em] uppercase text-dust/50">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-px bg-amber" /> MEDIAN
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-px bg-dust/50 border-t border-dashed border-dust/50" /> MEAN
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-2 bg-sand/30" /> 5–95 PERCENTILE BAND
          </span>
        </div>
      </div>

      {/* Distribution + stats */}
      <div className="col-span-12 lg:col-span-2 space-y-4">
        <div>
          <span className="label-t">DISTRIBUTION</span>
          <div className="relative h-32 bg-mineral hairline mt-1">
            <canvas ref={distCanvas} className="absolute inset-0 w-full h-full" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <ParameterReadout label="MEDIAN" value={stats.median} precision={2} />
          <ParameterReadout label="MEAN" value={stats.mean} precision={2} />
          <ParameterReadout label="P05" value={stats.p05} precision={2} />
          <ParameterReadout label="P95" value={stats.p95} precision={2} />
        </div>
      </div>
    </div>
  );
}
