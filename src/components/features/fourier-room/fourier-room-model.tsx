"use client";

import { useMemo, useState } from "react";
import { useCanvas2D } from "@/components/experience/hooks/use-canvas-2d";
import { ParameterSlider, ParameterReadout } from "@/components/controls/parameter-controls";
import { fourierCompose, type FourierComponent } from "@/lib/math";

/**
 * Brief §10 Model 04: Fourier Room — combine frequencies.
 * Controls: frequency, amplitude, phase, number of components.
 * Show: individual waves, combined wave, circular phase representation, 3D spatial form.
 */
export function FourierRoomModel() {
  const [components, setComponents] = useState<FourierComponent[]>([
    { frequency: 1, amplitude: 1, phase: 0 },
    { frequency: 2, amplitude: 0.5, phase: Math.PI / 4 },
    { frequency: 4, amplitude: 0.25, phase: Math.PI / 2 },
  ]);
  const [activeIdx, setActiveIdx] = useState(0);

  const result = useMemo(
    () => fourierCompose({ components, duration: 2 * Math.PI, samples: 240 }),
    [components]
  );

  const updateActive = (patch: Partial<FourierComponent>) => {
    setComponents((prev) => {
      const next = [...prev];
      next[activeIdx] = { ...next[activeIdx], ...patch };
      return next;
    });
  };

  const addComponent = () => {
    setComponents((prev) => [
      ...prev,
      { frequency: prev.length + 1, amplitude: 0.3, phase: 0 },
    ]);
    setActiveIdx(components.length);
  };

  const removeActive = () => {
    if (components.length <= 1) return;
    setComponents((prev) => prev.filter((_, i) => i !== activeIdx));
    setActiveIdx(Math.max(0, activeIdx - 1));
  };

  const active = components[activeIdx] || components[0];

  // Combined + individual waves
  const wavesCanvas = useCanvas2D(
    (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      const cy = h / 2;
      const pad = 12;
      // Individual waves (faint, stacked)
      result.individual.forEach((wave, i) => {
        ctx.strokeStyle = `rgba(216,199,169,${0.2 + (i === activeIdx ? 0.5 : 0)})`;
        ctx.lineWidth = i === activeIdx ? 1 : 0.5;
        ctx.beginPath();
        for (let j = 0; j < wave.length; j++) {
          const x = pad + (j / (wave.length - 1)) * (w - 2 * pad);
          const y = cy + wave[j] * h * 0.2;
          if (j === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      });
      // Combined wave (bright)
      ctx.strokeStyle = "#D89A48";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let i = 0; i < result.combined.length; i++) {
        const x = pad + (i / (result.combined.length - 1)) * (w - 2 * pad);
        const y = cy + result.combined[i] * h * 0.2;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      // Center axis
      ctx.strokeStyle = "rgba(216,199,169,0.15)";
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(0, cy);
      ctx.lineTo(w, cy);
      ctx.stroke();
    },
    [result, activeIdx]
  );

  // Circular phase representation
  const phaseCanvas = useCanvas2D(
    (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      const cx = w / 2, cy = h / 2;
      const r = Math.min(w, h) * 0.35;
      // Circle
      ctx.strokeStyle = "rgba(216,199,169,0.2)";
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
      // Axes
      ctx.beginPath();
      ctx.moveTo(cx - r - 8, cy);
      ctx.lineTo(cx + r + 8, cy);
      ctx.moveTo(cx, cy - r - 8);
      ctx.lineTo(cx, cy + r + 8);
      ctx.stroke();
      // Component points
      components.forEach((c, i) => {
        const px = cx + Math.cos(c.phase) * r * Math.min(1, c.amplitude);
        const py = cy + Math.sin(c.phase) * r * Math.min(1, c.amplitude);
        ctx.fillStyle = i === activeIdx ? "#D89A48" : "rgba(216,199,169,0.4)";
        ctx.beginPath();
        ctx.arc(px, py, i === activeIdx ? 5 : 3, 0, Math.PI * 2);
        ctx.fill();
        // Line from center
        ctx.strokeStyle = i === activeIdx ? "rgba(216,154,72,0.6)" : "rgba(216,199,169,0.2)";
        ctx.lineWidth = i === activeIdx ? 1 : 0.5;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(px, py);
        ctx.stroke();
      });
    },
    [components, activeIdx]
  );

  // 3D spatial form — a tube extruded along the combined wave
  const spatialCanvas = useCanvas2D(
    (ctx, w, h, t) => {
      ctx.clearRect(0, 0, w, h);
      const cy = h / 2;
      const samples = result.combined.length;
      const angle = t * 0.15;
      for (let i = 0; i < samples; i++) {
        const x = (i / samples) * w;
        const v = result.combined[i];
        // Two parallel curves offset by perspective
        const depth = Math.sin(i * 0.05 + angle) * 0.5 + 0.5;
        const y1 = cy + v * h * 0.2 - depth * 8;
        const y2 = cy + v * h * 0.2 + depth * 8;
        ctx.fillStyle = `rgba(216,154,72,${0.2 + depth * 0.4})`;
        ctx.fillRect(x, y1, 2, y2 - y1);
      }
    },
    [result]
  );

  return (
    <div className="grid grid-cols-12 gap-4">
      {/* Controls */}
      <div className="col-span-12 lg:col-span-3 space-y-4">
        <p className="body-t text-sm text-dust/80">
          Any periodic signal can be decomposed into a sum of sine waves. Here you compose them — choose frequencies, amplitudes, and phases, and watch the combined waveform emerge from the chorus.
        </p>
        <div className="hairline-t pt-3">
          <span className="label-t">COMPONENTS ({components.length})</span>
          <div className="mt-2 flex flex-wrap gap-1">
            {components.map((c, i) => (
              <button
                key={i}
                onClick={() => setActiveIdx(i)}
                className={`px-2 py-1 font-mono text-[10px] tracking-[0.15em] uppercase hairline ${
                  i === activeIdx ? "bg-amber text-carbon" : "text-dust/60 hover:text-bone"
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={addComponent}
              className="px-2 py-1 font-mono text-[10px] tracking-[0.15em] uppercase hairline text-amber hover:bg-amber hover:text-carbon"
            >
              +
            </button>
            {components.length > 1 && (
              <button
                onClick={removeActive}
                className="px-2 py-1 font-mono text-[10px] tracking-[0.15em] uppercase hairline text-signal hover:bg-signal hover:text-bone"
              >
                −
              </button>
            )}
          </div>
        </div>
        <div className="hairline-t pt-3">
          <span className="label-t">ACTIVE COMPONENT {activeIdx + 1}</span>
        </div>
        <ParameterSlider label="FREQUENCY" value={active?.frequency || 1} min={1} max={12} step={1} precision={0} unit="Hz" onChange={(v) => updateActive({ frequency: v })} />
        <ParameterSlider label="AMPLITUDE" value={active?.amplitude || 0} min={0} max={2} step={0.05} precision={2} onChange={(v) => updateActive({ amplitude: v })} />
        <ParameterSlider label="PHASE" value={active?.phase || 0} min={0} max={6.28} step={0.05} precision={2} unit="rad" onChange={(v) => updateActive({ phase: v })} />
      </div>

      {/* Main wave view */}
      <div className="col-span-12 lg:col-span-6 space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="label-t">COMBINED + INDIVIDUAL WAVES</span>
            <span className="label-t text-amber">f(t) = Σ Aₙ · sin(2π fₙ t + φₙ)</span>
          </div>
          <div className="relative aspect-[16/7] bg-mineral hairline">
            <canvas ref={wavesCanvas} className="absolute inset-0 w-full h-full" aria-label="Combined waveform (bright) overlaid on individual sine wave components (faint)." />
          </div>
        </div>
        <div>
          <span className="label-t">3D SPATIAL FORM</span>
          <div className="relative aspect-[16/5] bg-mineral hairline mt-1">
            <canvas ref={spatialCanvas} className="absolute inset-0 w-full h-full" aria-label="Three-dimensional spatial form extruded along the combined wave path." />
          </div>
        </div>
      </div>

      {/* Phase circle + stats */}
      <div className="col-span-12 lg:col-span-3 space-y-4">
        <div>
          <span className="label-t">CIRCULAR PHASE</span>
          <div className="relative aspect-square bg-mineral hairline mt-1">
            <canvas ref={phaseCanvas} className="absolute inset-0 w-full h-full" aria-label="Circular phase representation — each component plotted by its phase angle and amplitude." />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <ParameterReadout label="COMPONENTS" value={components.length} precision={0} />
          <ParameterReadout label="PEAK" value={Math.max(...result.combined.map(Math.abs))} precision={3} />
        </div>
      </div>
    </div>
  );
}
