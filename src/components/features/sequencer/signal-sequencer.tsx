"use client";

import { useEffect, useMemo, useState } from "react";
import { useAudio, type SequencerPattern, type Channel } from "@/components/experience/audio/audio-provider";
import { useCanvas2D } from "@/components/experience/hooks/use-canvas-2d";
import { ParameterSlider, SeedPill } from "@/components/controls/parameter-controls";
import { useSystemStatus } from "@/components/layout/system-status";
import { CTA } from "@/components/controls/cta";

const CHANNELS: Channel[] = ["pulse", "grain", "air", "sub"];
const STEP_COUNT = 16;

const EMPTY_PATTERN: SequencerPattern = {
  bpm: 124,
  swing: 0.12,
  density: 0.35,
  steps: {
    pulse: [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false],
    grain: [false, false, true, false, false, false, true, false, false, false, true, false, false, false, true, false],
    air: [false, true, false, false, false, false, true, false, false, true, false, false, false, false, true, false],
    sub: [true, false, false, false, false, false, false, false, true, false, false, false, false, false, false, false],
  },
};

/**
 * Brief §11: 16-step / 4-channel procedural house-music visual sequencer.
 * Every sound event affects the visual system.
 */
export function SignalSequencer() {
  const audio = useAudio();
  const { seed, regenerateSeed } = useSystemStatus();
  const [pattern, setPattern] = useState<SequencerPattern>(EMPTY_PATTERN);
  const [seedInput, setSeedInput] = useState("");
  const [copyState, setCopyState] = useState<"idle" | "copied">("idle");

  // Sync pattern's bpm to audio when playing
  useEffect(() => {
    if (audio.playing) {
      audio.play(pattern);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pattern.bpm, pattern.swing]);

  const toggleStep = (ch: Channel, idx: number) => {
    setPattern((prev) => {
      const next = { ...prev, steps: { ...prev.steps, [ch]: [...prev.steps[ch]] } };
      next.steps[ch][idx] = !next.steps[ch][idx];
      return next;
    });
  };

  const randomize = () => {
    setPattern((prev) => {
      const next = { ...prev, steps: { ...prev.steps } };
      for (const ch of CHANNELS) {
        next.steps[ch] = Array.from({ length: STEP_COUNT }, () => Math.random() < prev.density);
      }
      return next;
    });
  };

  const reset = () => {
    setPattern((prev) => {
      const next = { ...prev, steps: { ...prev.steps } };
      for (const ch of CHANNELS) {
        next.steps[ch] = new Array(STEP_COUNT).fill(false);
      }
      return next;
    });
  };

  const saveLocal = () => {
    try {
      localStorage.setItem("dust-signal:pattern", JSON.stringify(pattern));
    } catch {
      // ignore
    }
  };

  const loadLocal = () => {
    try {
      const stored = localStorage.getItem("dust-signal:pattern");
      if (stored) setPattern(JSON.parse(stored));
    } catch {
      // ignore
    }
  };

  const serializePattern = () => {
    // Compact: bpm|swing|density|pulsebits|grainbits|airbits|subbits
    const toBits = (arr: boolean[]) => arr.map((b) => (b ? "1" : "0")).join("");
    const str = [
      pattern.bpm.toString(16),
      Math.round(pattern.swing * 100).toString(16).padStart(2, "0"),
      Math.round(pattern.density * 100).toString(16).padStart(2, "0"),
      toBits(pattern.steps.pulse),
      toBits(pattern.steps.grain),
      toBits(pattern.steps.air),
      toBits(pattern.steps.sub),
    ].join("|");
    return str;
  };

  const copySeed = async () => {
    const str = serializePattern();
    try {
      await navigator.clipboard.writeText(str);
      setCopyState("copied");
      setTimeout(() => setCopyState("idle"), 1500);
    } catch {
      // ignore
    }
  };

  const loadSeed = () => {
    try {
      const parts = seedInput.split("|");
      if (parts.length !== 7) return;
      const [bpmHex, swingHex, densityHex, pulse, grain, air, sub] = parts;
      const fromBits = (s: string) => s.split("").map((c) => c === "1");
      setPattern({
        bpm: parseInt(bpmHex, 16),
        swing: parseInt(swingHex, 16) / 100,
        density: parseInt(densityHex, 16) / 100,
        steps: {
          pulse: fromBits(pulse),
          grain: fromBits(grain),
          air: fromBits(air),
          sub: fromBits(sub),
        },
      });
    } catch {
      // ignore
    }
  };

  // Visual background that reacts to current step
  const bgCanvas = useCanvas2D(
    (ctx, w, h, t) => {
      ctx.clearRect(0, 0, w, h);
      const time = t;
      const currentStep = audio.currentStep;
      const stepActive = audio.playing && currentStep >= 0;

      // Pulse deforms the landscape
      const pulseActive = stepActive && pattern.steps.pulse[currentStep];
      const grainActive = stepActive && pattern.steps.grain[currentStep];
      const airActive = stepActive && pattern.steps.air[currentStep];
      const subActive = stepActive && pattern.steps.sub[currentStep];

      // Fog density (Air changes fog density)
      const fogOpacity = airActive ? 0.4 : 0.15;
      const fogGrad = ctx.createLinearGradient(0, 0, 0, h);
      fogGrad.addColorStop(0, `rgba(58,36,23,${fogOpacity})`);
      fogGrad.addColorStop(1, "rgba(8,8,6,0)");
      ctx.fillStyle = fogGrad;
      ctx.fillRect(0, 0, w, h);

      // Landscape deformed by pulse
      const horizonY = h * (subActive ? 0.45 : 0.6); // Sub moves the horizon
      ctx.fillStyle = "#11110E";
      ctx.beginPath();
      ctx.moveTo(0, h);
      for (let x = 0; x <= w; x += 4) {
        const baseY = horizonY + Math.sin(x * 0.01 + time * 0.3) * 8;
        const pulseDeform = pulseActive ? Math.sin(x * 0.05) * 30 : 0;
        const y = baseY - pulseDeform;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fill();

      // Grain emits particles
      if (grainActive) {
        for (let i = 0; i < 30; i++) {
          const px = Math.random() * w;
          const py = horizonY + Math.random() * (h - horizonY);
          ctx.fillStyle = `rgba(216,199,169,${Math.random() * 0.6})`;
          ctx.fillRect(px, py, 1, 1);
        }
      }

      // Current step indicator
      if (stepActive) {
        const stepX = (currentStep / STEP_COUNT) * w;
        ctx.strokeStyle = "rgba(216,154,72,0.3)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(stepX, 0);
        ctx.lineTo(stepX, h);
        ctx.stroke();
      }

      // Persistent particle field
      for (let i = 0; i < 60; i++) {
        const px = ((i * 37 + time * 20) % w);
        const py = (i * 23) % h;
        ctx.fillStyle = `rgba(216,199,169,${0.05 + (i % 3) * 0.04})`;
        ctx.fillRect(px, py, 1, 1);
      }
    },
    [audio.currentStep, audio.playing, pattern]
  );

  return (
    <div>
      {/* Enable-audio warning */}
      {!audio.enabled && (
        <div className="mb-6 p-4 hairline bg-mineral/60 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <span className="label-t-bright">NOTICE</span>
            <p className="body-t text-sm text-dust/80 mt-1">
              This instrument generates sound. Audio is disabled by default. Enable it to hear the procedural house rhythm.
            </p>
          </div>
          <CTA onClick={() => audio.enable()} variant="primary" cursorLabel="SOUND">
            ENABLE SIGNAL
          </CTA>
        </div>
      )}

      {/* Visual background */}
      <div className="relative aspect-[16/6] bg-mineral hairline mb-6">
        <canvas ref={bgCanvas} className="absolute inset-0 w-full h-full" aria-label="Audio-reactive visual field — pulse deforms the landscape, grain emits particles, air changes fog density, sub moves the horizon." />
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
          <span className="label-t-bright">VISUAL FIELD</span>
          <span className="label-t">
            {audio.playing ? `PLAYING / STEP ${audio.currentStep.toString().padStart(2, "0")}/15` : "STANDBY"}
          </span>
        </div>
      </div>

      {/* Sequencer grid */}
      <div className="bg-mineral hairline">
        {/* Step indicators */}
        <div className="grid grid-cols-[80px_1fr] hairline-b">
          <div className="p-2 hairline-r">
            <span className="label-t">CH / STEP</span>
          </div>
          <div className="grid grid-cols-16">
            {Array.from({ length: STEP_COUNT }).map((_, i) => (
              <div
                key={i}
                className={`p-2 text-center font-mono text-[9px] tracking-[0.1em] ${
                  i % 4 === 0 ? "text-amber" : "text-dust/30"
                } ${audio.currentStep === i && audio.playing ? "bg-amber/20" : ""}`}
              >
                {i.toString().padStart(2, "0")}
              </div>
            ))}
          </div>
        </div>

        {/* Channels */}
        {CHANNELS.map((ch) => (
          <div key={ch} className="grid grid-cols-[80px_1fr] hairline-b last:border-b-0">
            <div className="p-2 hairline-r flex items-center">
              <span className="font-mono text-[10px] tracking-[0.15em] uppercase text-dust/70">{ch}</span>
            </div>
            <div className="grid grid-cols-16">
              {pattern.steps[ch].map((active, i) => (
                <button
                  key={i}
                  onClick={() => toggleStep(ch, i)}
                  className={`aspect-square m-px transition-colors ${
                    active
                      ? ch === "pulse"
                        ? "bg-amber"
                        : ch === "grain"
                        ? "bg-dust"
                        : ch === "air"
                        ? "bg-sand"
                        : "bg-signal"
                      : "bg-carbon hover:bg-mineral"
                  } ${audio.currentStep === i && audio.playing ? "ring-1 ring-amber ring-inset" : ""}`}
                  aria-label={`${ch} step ${i + 1} ${active ? "active" : "inactive"}`}
                  aria-pressed={active}
                  data-cursor="activate"
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Transport + controls */}
      <div className="mt-6 grid grid-cols-12 gap-4">
        {/* Transport */}
        <div className="col-span-12 md:col-span-4 space-y-3">
          <span className="label-t">TRANSPORT</span>
          <div className="flex gap-2">
            <button
              onClick={() => {
                if (!audio.enabled) {
                  audio.enable().then(() => audio.play(pattern));
                } else if (audio.playing) {
                  audio.stop();
                } else {
                  audio.play(pattern);
                }
              }}
              className={`flex-1 px-4 py-3 font-mono text-[11px] tracking-[0.18em] uppercase ${
                audio.playing ? "bg-signal text-bone" : "bg-amber text-carbon"
              }`}
              data-cursor="activate"
              data-cursor-label={audio.playing ? "STOP" : "PLAY"}
            >
              {audio.playing ? "■ STOP" : "▶ PLAY"}
            </button>
            {audio.enabled && (
              <button
                onClick={() => audio.toggleMute()}
                className="px-4 py-3 font-mono text-[11px] tracking-[0.18em] uppercase hairline text-dust/70 hover:text-amber"
              >
                {audio.muted ? "UNMUTE" : "MUTE"}
              </button>
            )}
          </div>
          {audio.enabled && (
            <ParameterSlider
              label="VOLUME"
              value={audio.volume}
              min={0}
              max={1}
              step={0.01}
              precision={2}
              onChange={audio.setVolume}
            />
          )}
        </div>

        {/* Tempo / swing / density */}
        <div className="col-span-12 md:col-span-4 space-y-3">
          <span className="label-t">PATTERN</span>
          <ParameterSlider
            label="TEMPO"
            value={pattern.bpm}
            min={112}
            max={132}
            step={1}
            precision={0}
            unit="BPM"
            onChange={(v) => setPattern((p) => ({ ...p, bpm: v }))}
          />
          <ParameterSlider
            label="SWING"
            value={pattern.swing}
            min={0}
            max={0.5}
            step={0.02}
            precision={2}
            onChange={(v) => setPattern((p) => ({ ...p, swing: v }))}
          />
          <ParameterSlider
            label="DENSITY"
            value={pattern.density}
            min={0.1}
            max={1}
            step={0.05}
            precision={2}
            onChange={(v) => setPattern((p) => ({ ...p, density: v }))}
          />
        </div>

        {/* Pattern ops */}
        <div className="col-span-12 md:col-span-4 space-y-3">
          <span className="label-t">OPERATIONS</span>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={randomize} className="px-3 py-2.5 font-mono text-[10px] tracking-[0.15em] uppercase hairline text-dust/70 hover:text-amber">
              RANDOMIZE
            </button>
            <button onClick={reset} className="px-3 py-2.5 font-mono text-[10px] tracking-[0.15em] uppercase hairline text-dust/70 hover:text-signal">
              RESET
            </button>
            <button onClick={saveLocal} className="px-3 py-2.5 font-mono text-[10px] tracking-[0.15em] uppercase hairline text-dust/70 hover:text-amber">
              SAVE LOCAL
            </button>
            <button onClick={loadLocal} className="px-3 py-2.5 font-mono text-[10px] tracking-[0.15em] uppercase hairline text-dust/70 hover:text-amber">
              LOAD LOCAL
            </button>
          </div>
          <div className="flex gap-2 items-center">
            <button
              onClick={copySeed}
              className="px-3 py-2.5 font-mono text-[10px] tracking-[0.15em] uppercase hairline text-amber flex-1"
            >
              {copyState === "copied" ? "✓ COPIED" : "COPY SEED"}
            </button>
            <SeedPill seed={seed} onRegenerate={regenerateSeed} />
          </div>
          <div className="flex gap-1">
            <input
              type="text"
              value={seedInput}
              onChange={(e) => setSeedInput(e.target.value)}
              placeholder="paste seed string..."
              className="flex-1 px-2 py-1.5 bg-carbon hairline font-mono text-[10px] text-dust placeholder:text-dust/30 focus:outline-none focus:border-amber"
            />
            <button onClick={loadSeed} className="px-3 py-1.5 font-mono text-[10px] tracking-[0.15em] uppercase hairline text-amber">
              LOAD
            </button>
          </div>
        </div>
      </div>

      <p className="mt-6 body-t text-xs text-dust/50 max-w-2xl">
        Every sound event affects the visual system. Pulse deforms the landscape. Grain emits particles. Air changes fog density. Sub moves the horizon. Sound is original and procedurally generated — no samples, no commercial audio.
      </p>
    </div>
  );
}
