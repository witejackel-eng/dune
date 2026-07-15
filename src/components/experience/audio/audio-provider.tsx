"use client";

/**
 * DUST//SIGNAL — Procedural audio engine.
 * Brief §24: Original synthesis using oscillators, filtered noise, envelopes, gain nodes, filters, timing scheduler.
 * Brief §11: 16-step / 4-channel (Pulse, Grain, Air, Sub) sequencer. 112-132 BPM. Original procedural sound only.
 * Brief §24: Audio disabled by default. No autoplay. Persistent mute preference. Master limiter / safe gain.
 */

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

export type Channel = "pulse" | "grain" | "air" | "sub";

export interface SequencerPattern {
  bpm: number;
  swing: number;       // 0..0.5 — delay applied to odd 16th steps
  density: number;     // 0..1 — fraction of steps active
  steps: Record<Channel, boolean[]>; // each channel: 16 booleans
}

interface AudioState {
  enabled: boolean;
  muted: boolean;
  volume: number;       // 0..1
  bpm: number;
  playing: boolean;
  currentStep: number;  // 0..15 or -1 when stopped
}

interface AudioContextValue extends AudioState {
  enable: () => Promise<void>;
  disable: () => void;
  toggleMute: () => void;
  setVolume: (v: number) => void;
  play: (pattern: SequencerPattern) => void;
  stop: () => void;
  /** Trigger a one-shot sound for a channel (used by models page interactions). */
  trigger: (channel: Channel, time?: number) => void;
}

const DEFAULTS: AudioState = {
  enabled: false,
  muted: false,
  volume: 0.6,
  bpm: 124,
  playing: false,
  currentStep: -1,
};

const AudioContext = createContext<AudioContextValue | null>(null);

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AudioState>(DEFAULTS);
  const ctxRef = useRef<AudioContext | null>(null);
  const masterRef = useRef<GainNode | null>(null);
  const limiterRef = useRef<DynamicsCompressorNode | null>(null);
  const schedulerRef = useRef<number | null>(null);
  const nextStepTimeRef = useRef(0);
  const currentStepRef = useRef(0);
  const patternRef = useRef<SequencerPattern | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  /** Create the audio context lazily after a user gesture. */
  const ensureContext = useCallback(async () => {
    if (ctxRef.current) {
      if (ctxRef.current.state === "suspended") {
        await ctxRef.current.resume();
      }
      return ctxRef.current;
    }
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return null;
    const ctx = new Ctx({ latencyHint: "interactive" });
    const master = ctx.createGain();
    master.gain.value = stateRef.current.volume;
    // Safety limiter — never let transients clip
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -8;
    limiter.knee.value = 4;
    limiter.ratio.value = 12;
    limiter.attack.value = 0.003;
    limiter.release.value = 0.2;
    master.connect(limiter);
    limiter.connect(ctx.destination);
    ctxRef.current = ctx;
    masterRef.current = master;
    limiterRef.current = limiter;
    await ctx.resume();
    return ctx;
  }, []);

  const enable = useCallback(async () => {
    const ctx = await ensureContext();
    if (!ctx) return;
    setState((s) => ({ ...s, enabled: true, muted: false }));
  }, [ensureContext]);

  const disable = useCallback(() => {
    if (schedulerRef.current) {
      clearTimeout(schedulerRef.current);
      schedulerRef.current = null;
    }
    setState((s) => ({ ...s, enabled: false, playing: false, currentStep: -1 }));
  }, []);

  const toggleMute = useCallback(() => {
    setState((s) => {
      const muted = !s.muted;
      if (masterRef.current && ctxRef.current) {
        masterRef.current.gain.setTargetAtTime(
          muted ? 0 : s.volume,
          ctxRef.current.currentTime,
          0.02
        );
      }
      return { ...s, muted };
    });
  }, []);

  const setVolume = useCallback((v: number) => {
    setState((s) => {
      if (masterRef.current && ctxRef.current && !s.muted) {
        masterRef.current.gain.setTargetAtTime(v, ctxRef.current.currentTime, 0.02);
      }
      return { ...s, volume: v };
    });
  }, []);

  /** Trigger a single channel sound at a specific time (or now). */
  const trigger = useCallback((channel: Channel, time?: number) => {
    const ctx = ctxRef.current;
    const master = masterRef.current;
    if (!ctx || !master) return;
    const t = time ?? ctx.currentTime;
    switch (channel) {
      case "pulse":
        triggerPulse(ctx, master, t);
        break;
      case "grain":
        triggerGrain(ctx, master, t);
        break;
      case "air":
        triggerAir(ctx, master, t);
        break;
      case "sub":
        triggerSub(ctx, master, t);
        break;
    }
  }, []);

  const play = useCallback((pattern: SequencerPattern) => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    patternRef.current = pattern;
    setState((s) => ({ ...s, playing: true, bpm: pattern.bpm }));
    nextStepTimeRef.current = ctx.currentTime + 0.05;
    currentStepRef.current = 0;
    scheduleLoop();
  }, []);

  const stop = useCallback(() => {
    if (schedulerRef.current) {
      clearTimeout(schedulerRef.current);
      schedulerRef.current = null;
    }
    setState((s) => ({ ...s, playing: false, currentStep: -1 }));
  }, []);

  const scheduleLoop = useCallback(() => {
    const ctx = ctxRef.current;
    const pattern = patternRef.current;
    if (!ctx || !pattern) return;

    const stepDur = 60 / pattern.bpm / 4; // 16th note duration
    const lookahead = 0.1; // schedule 100ms ahead

    while (nextStepTimeRef.current < ctx.currentTime + lookahead) {
      const stepIdx = currentStepRef.current;
      const swingOffset = stepIdx % 2 === 1 ? stepDur * pattern.swing : 0;
      const t = nextStepTimeRef.current + swingOffset;

      // Trigger active channels
      (["pulse", "grain", "air", "sub"] as Channel[]).forEach((ch) => {
        if (pattern.steps[ch]?.[stepIdx]) {
          trigger(ch, t);
        }
      });

      // Update current step UI (slightly delayed to match audio)
      const uiStep = stepIdx;
      const uiTime = t;
      const delay = Math.max(0, (uiTime - ctx.currentTime) * 1000);
      setTimeout(() => {
        setState((s) => (s.playing ? { ...s, currentStep: uiStep } : s));
      }, delay);

      nextStepTimeRef.current += stepDur;
      currentStepRef.current = (currentStepRef.current + 1) % 16;
    }

    schedulerRef.current = window.setTimeout(scheduleLoop, 25);
  }, [trigger]);

  // Pause when tab inactive
  useEffect(() => {
    const handler = () => {
      if (document.visibilityState === "hidden" && stateRef.current.playing) {
        stop();
      }
    };
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, [stop]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (schedulerRef.current) clearTimeout(schedulerRef.current);
      if (ctxRef.current) {
        ctxRef.current.close().catch(() => {});
      }
    };
  }, []);

  const value: AudioContextValue = {
    ...state,
    enable,
    disable,
    toggleMute,
    setVolume,
    play,
    stop,
    trigger,
  };

  return <AudioContext.Provider value={value}>{children}</AudioContext.Provider>;
}

export function useAudio() {
  const ctx = useContext(AudioContext);
  if (!ctx) throw new Error("useAudio must be used within AudioProvider");
  return ctx;
}

/* -------------------------------------------------------------
 * Channel sound generators — original procedural synthesis.
 * Brief: Low synthetic kick, muted click, filtered noise, deep atmospheric tone, sparse sub pulse.
 * ----------------------------------------------------------- */

function triggerPulse(ctx: AudioContext, dest: AudioNode, t: number) {
  // Low synthetic kick — sine sweep from 110Hz down to 45Hz with fast decay
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(110, t);
  osc.frequency.exponentialRampToValueAtTime(45, t + 0.08);
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(0.85, t + 0.002);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
  osc.connect(gain);
  gain.connect(dest);
  osc.start(t);
  osc.stop(t + 0.25);
}

function triggerGrain(ctx: AudioContext, dest: AudioNode, t: number) {
  // Muted click — short noise burst through bandpass
  const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.05, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  }
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 2400;
  filter.Q.value = 6;
  const gain = ctx.createGain();
  gain.gain.value = 0.35;
  src.connect(filter);
  filter.connect(gain);
  gain.connect(dest);
  src.start(t);
}

function triggerAir(ctx: AudioContext, dest: AudioNode, t: number) {
  // Filtered noise — atmospheric texture
  const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.4, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.setValueAtTime(4500, t);
  filter.frequency.exponentialRampToValueAtTime(1200, t + 0.3);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(0.12, t + 0.04);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
  src.connect(filter);
  filter.connect(gain);
  gain.connect(dest);
  src.start(t);
}

function triggerSub(ctx: AudioContext, dest: AudioNode, t: number) {
  // Deep atmospheric tone — sparse sub pulse at 49Hz with slow swell
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(49, t);
  osc.frequency.linearRampToValueAtTime(42, t + 0.5);
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(0.45, t + 0.08);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
  osc.connect(gain);
  gain.connect(dest);
  osc.start(t);
  osc.stop(t + 0.7);
}
