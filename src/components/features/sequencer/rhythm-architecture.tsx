"use client";

import { useCanvas2D } from "@/components/experience/hooks/use-canvas-2d";

/**
 * Brief §9 Section 5: 16-column rhythmic grid. As visitor scrolls (or here, time progresses),
 * kick positions appear, hi-hat subdivisions enter, a syncopated element shifts, visual geometry
 * becomes increasingly complex, the landscape from the hero is reconstructed as a rhythmic waveform.
 *
 * When audio is enabled, link visual pulses to audio.trigger("pulse", time) calls on a schedule.
 */
export function RhythmArchitecture() {
  const canvas = useCanvas2D(
    (ctx, w, h, t) => {
      ctx.clearRect(0, 0, w, h);
      const time = t;

      // Beat grid — 16 steps, 4 bars visible
      const bpm = 124;
      const beatDur = 60 / bpm;
      const stepDur = beatDur / 4;
      const currentStep = Math.floor(time / stepDur) % 16;

      // Kick on 0, 4, 8, 12
      // Hat on 2, 6, 10, 14
      // Sub on 0, 8
      // Syncopation on 3, 7, 11, 15 (increasingly complex)
      const kick = [0, 4, 8, 12];
      const hat = [2, 6, 10, 14];
      const sub = [0, 8];
      const sync = [3, 7, 11, 15];

      // Layer 1: Kick positions (bottom)
      const layerY1 = h * 0.7;
      ctx.strokeStyle = "rgba(216,154,72,0.4)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i <= 64; i++) {
        const x = (i / 64) * w;
        const beatIdx = Math.floor(i / 4) % 16;
        const isKick = kick.includes(beatIdx) && i % 4 === 0;
        const phase = (time / stepDur) % 16;
        const distance = (beatIdx - phase + 16) % 16;
        const decay = Math.max(0, 1 - distance / 4);
        const y = layerY1 - (isKick ? 30 * decay : 0);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Layer 2: Hi-hat subdivisions (middle)
      const layerY2 = h * 0.5;
      ctx.strokeStyle = "rgba(216,199,169,0.3)";
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      for (let i = 0; i <= 128; i++) {
        const x = (i / 128) * w;
        const beatIdx = Math.floor(i / 8) % 16;
        const isHat = hat.includes(beatIdx) && i % 8 === 0;
        const phase = (time / stepDur) % 16;
        const distance = (beatIdx - phase + 16) % 16;
        const decay = Math.max(0, 1 - distance / 2);
        const y = layerY2 - (isHat ? 20 * decay : Math.sin(i * 0.3) * 3);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Layer 3: Syncopated element (top)
      const layerY3 = h * 0.3;
      ctx.strokeStyle = "rgba(164,108,59,0.4)";
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      for (let i = 0; i <= 64; i++) {
        const x = (i / 64) * w;
        const beatIdx = Math.floor(i / 4) % 16;
        const isSync = sync.includes(beatIdx);
        const phase = (time / stepDur) % 16;
        const distance = (beatIdx - phase + 16) % 16;
        const decay = Math.max(0, 1 - distance / 3);
        const y = layerY3 - (isSync ? 25 * decay : Math.sin(i * 0.5 + time * 2) * 5);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Sub layer — moves the horizon
      const layerY4 = h * 0.9;
      ctx.strokeStyle = "rgba(164,49,36,0.5)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let i = 0; i <= 32; i++) {
        const x = (i / 32) * w;
        const beatIdx = Math.floor(i / 2) % 16;
        const isSub = sub.includes(beatIdx) && i % 2 === 0;
        const phase = (time / stepDur) % 16;
        const distance = (beatIdx - phase + 16) % 16;
        const decay = Math.max(0, 1 - distance / 6);
        const y = layerY4 - (isSub ? 40 * decay : 0);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // 16-column grid overlay
      ctx.strokeStyle = "rgba(216,199,169,0.08)";
      ctx.lineWidth = 0.5;
      for (let i = 0; i <= 16; i++) {
        const x = (i / 16) * w;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
        if (i % 4 === 0) {
          ctx.fillStyle = "rgba(216,199,169,0.3)";
          ctx.font = "9px IBM Plex Mono, monospace";
          ctx.fillText(`${i}`, x + 3, 14);
        }
      }

      // Current step indicator
      const stepX = (currentStep / 16) * w;
      ctx.strokeStyle = "rgba(216,154,72,0.6)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(stepX, 0);
      ctx.lineTo(stepX, h);
      ctx.stroke();

      // Header label
      ctx.fillStyle = "rgba(216,199,169,0.5)";
      ctx.font = "10px IBM Plex Mono, monospace";
      ctx.fillText(`124 BPM · 16-STEP · STEP ${currentStep.toString().padStart(2, "0")}/15`, w - 200, 14);
    },
    []
  );

  return (
    <div>
      <div className="relative aspect-[16/7] bg-mineral hairline">
        <canvas ref={canvas} className="absolute inset-0 w-full h-full" aria-label="A 16-column rhythmic grid showing kick positions, hi-hat subdivisions, syncopated elements, and a sub-bass horizon. The hero landscape is reconstructed as a rhythmic waveform." />
      </div>
      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <span className="label-t">CHANNEL / 01</span>
          <p className="font-display text-base text-amber mt-1">PULSE</p>
          <p className="font-mono text-[10px] tracking-[0.08em] text-dust/50 mt-1">Deforms the landscape</p>
        </div>
        <div>
          <span className="label-t">CHANNEL / 02</span>
          <p className="font-display text-base text-dust mt-1">GRAIN</p>
          <p className="font-mono text-[10px] tracking-[0.08em] text-dust/50 mt-1">Emits particles</p>
        </div>
        <div>
          <span className="label-t">CHANNEL / 03</span>
          <p className="font-display text-base text-sand mt-1">AIR</p>
          <p className="font-mono text-[10px] tracking-[0.08em] text-dust/50 mt-1">Changes fog density</p>
        </div>
        <div>
          <span className="label-t">CHANNEL / 04</span>
          <p className="font-display text-base text-signal mt-1">SUB</p>
          <p className="font-mono text-[10px] tracking-[0.08em] text-dust/50 mt-1">Moves the horizon</p>
        </div>
      </div>
      <p className="mt-6 body-t text-sm text-dust/60 max-w-2xl">
        When the visitor enables the signal, every sound event affects the visual system — kick deforms the landscape, grain emits particles, air shifts fog density, and sub moves the horizon. Repetition establishes the system; variation reveals it.
      </p>
    </div>
  );
}
