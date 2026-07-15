"use client";

import { useMemo, useState } from "react";
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
 * Brief §10 Model 01: Stochastic Drift — Geometric Brownian Motion dS = μSdt + σSdW.
 * Controls: Initial state, Drift, Volatility, Time, Number of paths, Seed.
 * Render paths as strands moving through depth.
 */
export function StochasticDriftModel() {
  const { seed, regenerateSeed } = useSystemStatus();
  const [s0, setS0] = useState(100);
  const [mu, setMu] = useState(0.08);
  const [sigma, setSigma] = useState(0.25);
  const [T, setT] = useState(1);
  const [paths, setPaths] = useState(150);

  const result = useMemo(() => {
    const rng = mulberry32(seed);
    return simulateGBM(
      { s0, mu, sigma, T, steps: 120, paths: Math.min(paths, 800) },
      rng
    );
  }, [s0, mu, sigma, T, paths, seed]);

  const canvas = useCanvas2D(
    (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      const pad = 20;
      let minY = Infinity, maxY = -Infinity;
      for (const p of result.paths)
        for (const v of p) {
          if (v < minY) minY = v;
          if (v > maxY) maxY = v;
        }
      const yRange = maxY - minY || 1;
      // Depth shading: later paths are dimmer
      for (let p = 0; p < result.paths.length; p++) {
        const path = result.paths[p];
        const depthFactor = p / result.paths.length;
        const opacity = 0.15 + (1 - depthFactor) * 0.4;
        ctx.strokeStyle = `rgba(216,154,72,${opacity})`;
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        for (let i = 0; i < path.length; i++) {
          const x = pad + (i / (path.length - 1)) * (w - 2 * pad);
          const y = pad + (1 - (path[i] - minY) / yRange) * (h - 2 * pad);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      // Median bright line
      ctx.strokeStyle = "#EEE7DA";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let i = 0; i < result.median.length; i++) {
        const x = pad + (i / (result.median.length - 1)) * (w - 2 * pad);
        const y = pad + (1 - (result.median[i] - minY) / yRange) * (h - 2 * pad);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    },
    [result]
  );

  const stats = useMemo(() => {
    const sorted = [...result.finalDistribution].sort((a, b) => a - b);
    const n = sorted.length;
    if (n === 0) return { median: 0, p05: 0, p95: 0, mean: 0 };
    const q = (p: number) => sorted[Math.floor(n * p)] || 0;
    return {
      median: q(0.5),
      p05: q(0.05),
      p95: q(0.95),
      mean: sorted.reduce((a, b) => a + b, 0) / n,
    };
  }, [result.finalDistribution]);

  return (
    <div className="grid grid-cols-12 gap-4">
      {/* Explanation */}
      <div className="col-span-12 lg:col-span-3 space-y-4">
        <p className="body-t text-sm text-dust/80">
          Geometric Brownian motion is the canonical model for asset prices in continuous time. Each path is a single realisation of the same stochastic process; together they form an ensemble whose statistics reveal the underlying dynamics.
        </p>
        <div className="hairline-t pt-3">
          <span className="label-t">PARAMETERS</span>
        </div>
        <ParameterSlider label="INITIAL STATE S₀" value={s0} min={10} max={500} step={5} precision={0} onChange={setS0} />
        <ParameterSlider label="DRIFT μ" value={mu} min={-0.3} max={0.3} step={0.01} precision={3} onChange={setMu} hint="Annual drift" />
        <ParameterSlider label="VOLATILITY σ" value={sigma} min={0.05} max={0.6} step={0.01} precision={3} onChange={setSigma} />
        <ParameterSlider label="TIME T" value={T} min={0.25} max={5} step={0.25} precision={2} unit="y" onChange={setT} />
        <ParameterSlider label="PATHS" value={paths} min={50} max={800} step={50} precision={0} onChange={setPaths} />
        <div className="pt-2"><SeedPill seed={seed} onRegenerate={regenerateSeed} /></div>
      </div>

      {/* Visualization */}
      <div className="col-span-12 lg:col-span-6">
        <div className="flex items-center justify-between mb-2">
          <span className="label-t">ENSEMBLE / DEPTH-SHADED PATHS</span>
          <span className="label-t text-amber">{result.paths.length} PATHS</span>
        </div>
        <div className="relative aspect-[4/3] bg-mineral hairline">
          <canvas ref={canvas} className="absolute inset-0 w-full h-full" aria-label="Geometric Brownian motion ensemble — depth-shaded paths drifting through time, with median trajectory highlighted." />
        </div>
      </div>

      {/* Readouts */}
      <div className="col-span-12 lg:col-span-3 space-y-3">
        <span className="label-t">TERMINAL STATISTICS</span>
        <div className="grid grid-cols-2 gap-3">
          <ParameterReadout label="MEDIAN" value={stats.median} precision={2} />
          <ParameterReadout label="MEAN" value={stats.mean} precision={2} />
          <ParameterReadout label="P05" value={stats.p05} precision={2} />
          <ParameterReadout label="P95" value={stats.p95} precision={2} />
        </div>
        <div className="hairline-t pt-3 mt-4">
          <span className="label-t">NOTE</span>
          <p className="body-t text-xs text-dust/60 mt-2">
            Paths are produced by exact simulation: S(t+Δt) = S(t)·exp((μ−σ²/2)Δt + σ√Δt·Z), where Z is a standard normal draw. The median line is the empirical 50th percentile across the ensemble.
          </p>
        </div>
      </div>
    </div>
  );
}
