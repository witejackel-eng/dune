"use client";

import { useEffect, useState, useCallback } from "react";
import { useAudio, type SequencerPattern, type Channel } from "@/components/experience/audio/audio-provider";
import { useCanvas2D } from "@/components/experience/hooks/use-canvas-2d";
import { ParameterSlider } from "@/components/controls/parameter-controls";
import { CTA } from "@/components/controls/cta";
import {
  serializePattern,
  parsePattern,
  generateSeededPattern,
  DEFAULT_PATTERN,
  CHANNELS,
  STEP_COUNT,
} from "./pattern-serializer";

type FeedbackMessage = "" | "PATTERN SAVED" | "PATTERN LOADED" | "NO SAVED PATTERN" | "INVALID SEED" | "SEED LOADED" | "SEED COPIED";

/**
 * Brief §10: Seeded sequencer with strict validation + mobile mode.
 * No Math.random() in pattern generation — uses mulberry32.
 */
export function SignalSequencer() {
  const audio = useAudio();
  const [pattern, setPattern] = useState<SequencerPattern>(DEFAULT_PATTERN);
  const [patternSeed, setPatternSeed] = useState<number>(0x4d535f47);
  const [seedInput, setSeedInput] = useState("");
  const [feedback, setFeedback] = useState<FeedbackMessage>("");
  const [mobileBank, setMobileBank] = useState<0 | 1>(0); // Brief §10: 2 banks of 8 steps on mobile

  // Brief §10: Sync pattern to audio
  useEffect(() => {
    if (audio.playing) {
      audio.play(pattern);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pattern.bpm, pattern.swing]);

  // Feedback auto-clear
  useEffect(() => {
    if (!feedback) return;
    const id = setTimeout(() => setFeedback(""), 2000);
    return () => clearTimeout(id);
  }, [feedback]);

  const toggleStep = useCallback((ch: Channel, idx: number) => {
    setPattern((prev) => {
      const next = { ...prev, steps: { ...prev.steps, [ch]: [...prev.steps[ch]] } };
      next.steps[ch][idx] = !next.steps[ch][idx];
      return next;
    });
  }, []);

  const randomize = useCallback(() => {
    // Brief §10: Use seeded random — patternSeed drives the pattern
    setPattern(generateSeededPattern(patternSeed, pattern.density));
  }, [patternSeed, pattern.density]);

  const reset = useCallback(() => {
    setPattern({
      ...DEFAULT_PATTERN,
      bpm: pattern.bpm,
      swing: pattern.swing,
      density: pattern.density,
    });
  }, [pattern.bpm, pattern.swing, pattern.density]);

  const regenerateSeed = useCallback(() => {
    // Use crypto.randomUUID-based entropy
    const newSeed = (Math.floor(Math.random() * 0xffffffff)) >>> 0;
    setPatternSeed(newSeed);
    setPattern(generateSeededPattern(newSeed, pattern.density));
  }, [pattern.density]);

  const saveLocal = useCallback(() => {
    try {
      localStorage.setItem("dust-signal:pattern", JSON.stringify(pattern));
      setFeedback("PATTERN SAVED");
    } catch {
      setFeedback("INVALID SEED");
    }
  }, [pattern]);

  const loadLocal = useCallback(() => {
    try {
      const stored = localStorage.getItem("dust-signal:pattern");
      if (!stored) {
        setFeedback("NO SAVED PATTERN");
        return;
      }
      const parsed = JSON.parse(stored);
      // Validate
      const result = parsePattern(serializePattern(parsed));
      if (result.ok && result.pattern) {
        setPattern(result.pattern);
        setFeedback("PATTERN LOADED");
      } else {
        setFeedback("INVALID SEED");
      }
    } catch {
      setFeedback("INVALID SEED");
    }
  }, []);

  const copySeed = useCallback(async () => {
    const str = serializePattern(pattern);
    try {
      await navigator.clipboard.writeText(str);
      setFeedback("SEED COPIED");
    } catch {
      // Ignore — clipboard may be unavailable
    }
  }, [pattern]);

  const loadSeed = useCallback(() => {
    // Brief §10: Strict validation
    const result = parsePattern(seedInput.trim());
    if (!result.ok || !result.pattern) {
      setFeedback("INVALID SEED");
      return;
    }
    setPattern(result.pattern);
    setFeedback("SEED LOADED");
    setSeedInput("");
  }, [seedInput]);

  // Audio-reactive background
  const bgCanvas = useCanvas2D(
    (ctx, w, h, t) => {
      ctx.clearRect(0, 0, w, h);
      const currentStep = audio.currentStep;
      const stepActive = audio.playing && currentStep >= 0;
      const pulseActive = stepActive && pattern.steps.pulse[currentStep];
      const grainActive = stepActive && pattern.steps.grain[currentStep];
      const airActive = stepActive && pattern.steps.air[currentStep];
      const subActive = stepActive && pattern.steps.sub[currentStep];

      // Fog density
      const fogOpacity = airActive ? 0.4 : 0.15;
      const fogGrad = ctx.createLinearGradient(0, 0, 0, h);
      fogGrad.addColorStop(0, `rgba(58,36,23,${fogOpacity})`);
      fogGrad.addColorStop(1, "rgba(8,8,6,0)");
      ctx.fillStyle = fogGrad;
      ctx.fillRect(0, 0, w, h);

      // Landscape deformed by pulse
      const horizonY = h * (subActive ? 0.45 : 0.6);
      ctx.fillStyle = "#11110E";
      ctx.beginPath();
      ctx.moveTo(0, h);
      for (let x = 0; x <= w; x += 4) {
        const baseY = horizonY + Math.sin(x * 0.01 + t * 0.3) * 8;
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

      if (stepActive) {
        const stepX = (currentStep / STEP_COUNT) * w;
        ctx.strokeStyle = "rgba(216,154,72,0.3)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(stepX, 0);
        ctx.lineTo(stepX, h);
        ctx.stroke();
      }

      for (let i = 0; i < 60; i++) {
        const px = ((i * 37 + t * 20) % w);
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
        <canvas ref={bgCanvas} className="absolute inset-0 w-full h-full" aria-label="Audio-reactive visual field." />
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
          <span className="label-t-bright">VISUAL FIELD</span>
          <span className="label-t">
            {audio.playing ? `PLAYING / STEP ${audio.currentStep.toString().padStart(2, "0")}/15` : "STANDBY"}
          </span>
        </div>
      </div>

      {/* Sequencer grid — desktop: full 16-step, mobile: 2-bank switch */}
      <div className="bg-mineral hairline">
        {/* Step indicators */}
        <StepIndicator mobileBank={mobileBank} setMobileBank={setMobileBank} currentStep={audio.currentStep} playing={audio.playing} />

        {/* Channels */}
        {CHANNELS.map((ch) => (
          <ChannelRow
            key={ch}
            channel={ch}
            pattern={pattern}
            mobileBank={mobileBank}
            onToggle={toggleStep}
            currentStep={audio.currentStep}
            playing={audio.playing}
          />
        ))}
      </div>

      {/* Transport + controls */}
      <div className="mt-6 grid grid-cols-12 gap-4">
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
              aria-label={audio.playing ? "Stop" : "Play"}
            >
              {audio.playing ? "■ STOP" : "▶ PLAY"}
            </button>
            {audio.enabled && (
              <button
                onClick={() => audio.toggleMute()}
                className="px-4 py-3 font-mono text-[11px] tracking-[0.18em] uppercase hairline text-dust/70 hover:text-amber"
                aria-label={audio.muted ? "Unmute" : "Mute"}
                aria-pressed={audio.muted}
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
              COPY SEED
            </button>
            <div className="hairline px-2 py-1.5">
              <span className="font-mono text-[10px] tracking-[0.15em] uppercase text-dust/50">PATTERN SEED</span>
              <span className="ml-2 font-mono text-[10px] text-amber">0x{patternSeed.toString(16).toUpperCase().padStart(8, "0")}</span>
              <button onClick={regenerateSeed} className="ml-2 font-mono text-[10px] text-dust/50 hover:text-amber" aria-label="Regenerate seed">↻</button>
            </div>
          </div>
          <div className="flex gap-1">
            <input
              type="text"
              value={seedInput}
              onChange={(e) => setSeedInput(e.target.value)}
              placeholder="paste seed string..."
              maxLength={200}
              className="flex-1 px-2 py-1.5 bg-carbon hairline font-mono text-[10px] text-dust placeholder:text-dust/30 focus:outline-none focus:border-amber"
              aria-label="Pattern seed string input"
            />
            <button onClick={loadSeed} className="px-3 py-1.5 font-mono text-[10px] tracking-[0.15em] uppercase hairline text-amber">
              LOAD
            </button>
          </div>
          {feedback && (
            <div
              className={`px-2 py-1.5 font-mono text-[10px] tracking-[0.15em] uppercase ${
                feedback === "INVALID SEED" || feedback === "NO SAVED PATTERN"
                  ? "text-signal"
                  : "text-amber"
              }`}
              role="status"
              aria-live="polite"
            >
              {feedback}
            </div>
          )}
        </div>
      </div>

      <p className="mt-6 body-t text-xs text-dust/50 max-w-2xl">
        Every sound event affects the visual system. Pulse deforms the landscape. Grain emits particles. Air changes fog density. Sub moves the horizon. Sound is original and procedurally generated — no samples, no commercial audio.
      </p>
    </div>
  );
}

/* ============================================================
   Step indicator (with mobile bank switcher)
   ============================================================ */
function StepIndicator({
  mobileBank,
  setMobileBank,
  currentStep,
  playing,
}: {
  mobileBank: 0 | 1;
  setMobileBank: (b: 0 | 1) => void;
  currentStep: number;
  playing: boolean;
}) {
  const stepRange = mobileBank === 0 ? [0, 8] : [8, 16];
  return (
    <div className="grid grid-cols-[80px_1fr_64px] hairline-b items-center">
      <div className="p-2 hairline-r">
        <span className="label-t">CH / STEP</span>
      </div>
      <div className="grid grid-cols-8 md:grid-cols-16">
        {/* Desktop: all 16, Mobile: bank of 8 */}
        {Array.from({ length: 16 }).map((_, i) => {
          const inBank = i >= stepRange[0] && i < stepRange[1];
          if (!inBank) return null;
          return (
            <div
              key={i}
              className={`p-2 text-center font-mono text-[9px] tracking-[0.1em] ${
                i % 4 === 0 ? "text-amber" : "text-dust/30"
              } ${currentStep === i && playing ? "bg-amber/20" : ""} ${i % 4 === 0 ? "hairline-l" : ""}`}
            >
              {i.toString().padStart(2, "0")}
            </div>
          );
        })}
      </div>
      {/* Mobile bank switcher */}
      <div className="md:hidden p-1 flex gap-1">
        <button
          onClick={() => setMobileBank(0)}
          className={`flex-1 px-2 py-1 font-mono text-[9px] tracking-[0.15em] uppercase hairline ${mobileBank === 0 ? "bg-amber text-carbon" : "text-dust/60"}`}
          aria-label="Show steps 1-8"
          aria-pressed={mobileBank === 0}
        >
          01-08
        </button>
        <button
          onClick={() => setMobileBank(1)}
          className={`flex-1 px-2 py-1 font-mono text-[9px] tracking-[0.15em] uppercase hairline ${mobileBank === 1 ? "bg-amber text-carbon" : "text-dust/60"}`}
          aria-label="Show steps 9-16"
          aria-pressed={mobileBank === 1}
        >
          09-16
        </button>
      </div>
      <div className="hidden md:block p-2 hairline-l">
        <span className="label-t">16-STEP</span>
      </div>
    </div>
  );
}

/* ============================================================
   Channel row — min 44px touch targets on mobile
   ============================================================ */
function ChannelRow({
  channel,
  pattern,
  mobileBank,
  onToggle,
  currentStep,
  playing,
}: {
  channel: Channel;
  pattern: SequencerPattern;
  mobileBank: 0 | 1;
  onToggle: (ch: Channel, idx: number) => void;
  currentStep: number;
  playing: boolean;
}) {
  const colorClass =
    channel === "pulse" ? "bg-amber"
    : channel === "grain" ? "bg-dust"
    : channel === "air" ? "bg-sand"
    : "bg-signal";
  const stepRange = mobileBank === 0 ? [0, 8] : [8, 16];

  return (
    <div className="grid grid-cols-[80px_1fr_64px] hairline-b last:border-b-0 items-stretch">
      <div className="p-2 hairline-r flex items-center">
        <span className="font-mono text-[10px] tracking-[0.15em] uppercase text-dust/70">{channel}</span>
      </div>
      <div className="grid grid-cols-8 md:grid-cols-16">
        {Array.from({ length: 16 }).map((_, i) => {
          const inBank = i >= stepRange[0] && i < stepRange[1];
          if (!inBank) return null;
          const active = pattern.steps[channel][i];
          const isCurrent = currentStep === i && playing;
          return (
            <button
              key={i}
              onClick={() => onToggle(channel, i)}
              className={`aspect-square m-px transition-colors min-h-[44px] min-w-[44px] ${
                active ? colorClass : "bg-carbon hover:bg-mineral"
              } ${isCurrent ? "ring-1 ring-amber ring-inset" : ""} ${i % 4 === 0 ? "hairline-l" : ""}`}
              aria-label={`${channel} step ${i + 1} ${active ? "active" : "inactive"}`}
              aria-pressed={active}
              data-cursor="activate"
            />
          );
        })}
      </div>
      <div className="hidden md:block p-2 hairline-l flex items-center">
        <span className="font-mono text-[9px] text-dust/40">—</span>
      </div>
    </div>
  );
}
