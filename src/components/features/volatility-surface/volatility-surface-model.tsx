"use client";

import { useMemo, useState } from "react";
import { useCanvas2D } from "@/components/experience/hooks/use-canvas-2d";
import {
  ParameterSlider,
  ParameterReadout,
} from "@/components/controls/parameter-controls";
import { volSurfaceSlice } from "@/lib/math";

/**
 * Brief §10 Model 02: Volatility Surface.
 * Synthetic SVI-style parametrisation. Controls: τ, base variance, slope, skew, curvature.
 * Show surface (2D heatmap + 3D depth view) and slice view.
 */
export function VolatilitySurfaceModel() {
  const [tau, setTau] = useState(0.5);
  const [baseVariance, setBaseVariance] = useState(0.04);
  const [slopeB, setSlopeB] = useState(0.15);
  const [rho, setRho] = useState(-0.3);
  const [curvature, setCurvature] = useState(0.1);
  const [view, setView] = useState<"surface" | "wireframe">("surface");

  // Compute surface across tau and moneyness
  const surface = useMemo(() => {
    const taus = [0.1, 0.25, 0.5, 1, 2, 3];
    const strikeRange = 1;
    const moneynessSteps = 40;
    const slices = taus.map((t) =>
      volSurfaceSlice({ tau: t, baseVariance, slopeB, rho, curvature, strikeRange, moneynessSteps })
    );
    return { taus, slices };
  }, [baseVariance, slopeB, rho, curvature]);

  const currentSlice = useMemo(
    () =>
      volSurfaceSlice({
        tau,
        baseVariance,
        slopeB,
        rho,
        curvature,
        strikeRange: 1,
        moneynessSteps: 60,
      }),
    [tau, baseVariance, slopeB, rho, curvature]
  );

  // Surface heatmap
  const surfaceCanvas = useCanvas2D(
    (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      const cols = surface.slices[0].volatilities.length;
      const rows = surface.taus.length;
      const cellW = w / cols, cellH = h / rows;
      let minV = Infinity, maxV = -Infinity;
      for (const slice of surface.slices)
        for (const v of slice.volatilities) {
          if (v < minV) minV = v;
          if (v > maxV) maxV = v;
        }
      const vRange = maxV - minV || 1;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const v = surface.slices[r].volatilities[c];
          const intensity = (v - minV) / vRange;
          const red = Math.floor(58 + intensity * 180);
          const green = Math.floor(36 + intensity * 60);
          const blue = Math.floor(23 + intensity * 30);
          ctx.fillStyle = `rgb(${red},${green},${blue})`;
          ctx.fillRect(c * cellW, r * cellH, cellW, cellH);
        }
      }
      // Labels
      ctx.fillStyle = "rgba(216,199,169,0.6)";
      ctx.font = "9px IBM Plex Mono, monospace";
      surface.taus.forEach((t, i) => {
        ctx.fillText(`τ=${t}`, 4, i * cellH + 12);
      });
    },
    [surface]
  );

  // 3D wireframe / surface view of the current slice
  const sliceCanvas = useCanvas2D(
    (ctx, w, h, t) => {
      ctx.clearRect(0, 0, w, h);
      const cx = w / 2, cy = h * 0.6;
      const xScale = 1.2;
      const yScale = 200;
      const angle = t * 0.1;
      const cosA = Math.cos(angle), sinA = Math.sin(angle);

      // Draw surface as series of slices rotating in 3D
      const slices = surface.slices;
      for (let s = 0; s < slices.length; s++) {
        const slice = slices[s];
        const tauPos = (s / (slices.length - 1) - 0.5) * 100;
        // Rotate tau position
        const dx = tauPos * cosA;
        const dz = tauPos * sinA;
        const depth = (dz + 50) / 100;
        const opacity = 0.3 + depth * 0.5;

        ctx.strokeStyle = `rgba(216,154,72,${opacity})`;
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        for (let i = 0; i < slice.volatilities.length; i++) {
          const k = slice.moneyness[i];
          const v = slice.volatilities[i];
          const x = cx + k * w * 0.35 * xScale + dx;
          const y = cy - (v - 0.2) * yScale - s * 4;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        if (view === "wireframe") ctx.stroke();
        else {
          // Fill area below for solid look on current slice only
          if (s === Math.floor(slices.length / 2)) {
            ctx.fillStyle = "rgba(216,154,72,0.15)";
            ctx.lineTo(cx + slice.moneyness[slice.moneyness.length - 1] * w * 0.35 * xScale + dx, cy);
            ctx.lineTo(cx + slice.moneyness[0] * w * 0.35 * xScale + dx, cy);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
          } else {
            ctx.stroke();
          }
        }
      }

      // Axes
      ctx.strokeStyle = "rgba(216,199,169,0.2)";
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(0, cy);
      ctx.lineTo(w, cy);
      ctx.stroke();
    },
    [surface, view]
  );

  return (
    <div className="grid grid-cols-12 gap-4">
      {/* Explanation + controls */}
      <div className="col-span-12 lg:col-span-3 space-y-4">
        <p className="body-t text-sm text-dust/80">
          The volatility surface maps implied volatility across log-moneyness and time-to-expiry. This synthetic SVI-style parametrisation captures skew (asymmetry) and smile (curvature) observed in option markets.
        </p>
        <div className="hairline-t pt-3">
          <span className="label-t">PARAMETERS</span>
        </div>
        <ParameterSlider label="TIME TO EXPIRY τ" value={tau} min={0.1} max={3} step={0.05} precision={2} unit="y" onChange={setTau} />
        <ParameterSlider label="BASE VARIANCE a" value={baseVariance} min={0.01} max={0.2} step={0.005} precision={3} onChange={setBaseVariance} />
        <ParameterSlider label="SLOPE b" value={slopeB} min={0} max={0.4} step={0.01} precision={3} onChange={setSlopeB} />
        <ParameterSlider label="SKEW ρ" value={rho} min={-1} max={1} step={0.05} precision={2} onChange={setRho} hint="Negative = left skew" />
        <ParameterSlider label="CURVATURE σ_sl" value={curvature} min={0.01} max={0.5} step={0.01} precision={3} onChange={setCurvature} />
        <div className="hairline-t pt-3">
          <span className="label-t">VIEW</span>
          <div className="flex gap-1 mt-2">
            <button
              onClick={() => setView("surface")}
              className={`px-3 py-1.5 font-mono text-[10px] tracking-[0.15em] uppercase hairline ${view === "surface" ? "bg-amber text-carbon" : "text-dust/60"}`}
            >
              SURFACE
            </button>
            <button
              onClick={() => setView("wireframe")}
              className={`px-3 py-1.5 font-mono text-[10px] tracking-[0.15em] uppercase hairline ${view === "wireframe" ? "bg-amber text-carbon" : "text-dust/60"}`}
            >
              WIREFRAME
            </button>
          </div>
        </div>
      </div>

      {/* 3D view */}
      <div className="col-span-12 lg:col-span-6">
        <div className="flex items-center justify-between mb-2">
          <span className="label-t">3D SURFACE / ROTATING</span>
          <span className="label-t text-amber">σ(k, τ)</span>
        </div>
        <div className="relative aspect-[4/3] bg-mineral hairline">
          <canvas ref={sliceCanvas} className="absolute inset-0 w-full h-full" aria-label="Three-dimensional rotating view of the synthetic volatility surface across log-moneyness and time-to-expiry." />
        </div>
      </div>

      {/* Heatmap + readouts */}
      <div className="col-span-12 lg:col-span-3 space-y-4">
        <div>
          <span className="label-t">SURFACE HEATMAP</span>
          <div className="relative h-32 bg-mineral hairline mt-1">
            <canvas ref={surfaceCanvas} className="absolute inset-0 w-full h-full" aria-hidden="true" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <ParameterReadout label="ATM VOL" value={currentSlice.atmVol} precision={3} />
          <ParameterReadout label="SKEW" value={currentSlice.skew} precision={3} />
          <ParameterReadout label="MAX σ" value={Math.max(...currentSlice.volatilities)} precision={3} />
          <ParameterReadout label="MIN σ" value={Math.min(...currentSlice.volatilities)} precision={3} />
        </div>
      </div>
    </div>
  );
}
