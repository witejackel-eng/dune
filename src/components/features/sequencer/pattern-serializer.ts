/**
 * DUST//SIGNAL — Sequencer pattern serialization.
 * Brief §10: Seeded random, deterministic patterns, strict validation.
 *
 * Pattern format: `bpm|swing|density|pulsebits|grainbits|airbits|subbits`
 *   - bpm: hex (2-3 chars)
 *   - swing: hex 00-64 (0-100, divided by 100)
 *   - density: hex 00-64 (0-100, divided by 100)
 *   - *bits: 16 binary chars (0 or 1)
 */

import { mulberry32 } from "@/lib/seeded-random";
import type { SequencerPattern, Channel } from "@/components/experience/audio/audio-provider";

export const CHANNELS: Channel[] = ["pulse", "grain", "air", "sub"];
export const STEP_COUNT = 16;

export function serializePattern(pattern: SequencerPattern): string {
  const toBits = (arr: boolean[]) => arr.map((b) => (b ? "1" : "0")).join("");
  const bpm = pattern.bpm.toString(16);
  const swing = Math.round(pattern.swing * 100).toString(16).padStart(2, "0");
  const density = Math.round(pattern.density * 100).toString(16).padStart(2, "0");
  return [
    bpm,
    swing,
    density,
    toBits(pattern.steps.pulse),
    toBits(pattern.steps.grain),
    toBits(pattern.steps.air),
    toBits(pattern.steps.sub),
  ].join("|");
}

export interface ParseResult {
  ok: boolean;
  pattern?: SequencerPattern;
  error?: string;
}

export function parsePattern(input: string): ParseResult {
  if (!input || typeof input !== "string") {
    return { ok: false, error: "Empty input" };
  }
  if (input.length > 200) {
    return { ok: false, error: "Input too long (max 200 chars)" };
  }
  if (!/^[\da-fA-F|01]+$/.test(input)) {
    return { ok: false, error: "Invalid characters — only hex, |, 0, 1 allowed" };
  }
  const parts = input.split("|");
  if (parts.length !== 7) {
    return { ok: false, error: `Expected 7 segments, got ${parts.length}` };
  }
  const [bpmHex, swingHex, densityHex, pulse, grain, air, sub] = parts;

  const bpm = parseInt(bpmHex, 16);
  if (!Number.isFinite(bpm) || bpm < 60 || bpm > 200) {
    return { ok: false, error: `BPM out of range (60-200): ${bpm}` };
  }

  const swingInt = parseInt(swingHex, 16);
  if (!Number.isFinite(swingInt) || swingInt > 100) {
    return { ok: false, error: `Swing out of range: ${swingInt}` };
  }
  const swing = swingInt / 100;

  const densityInt = parseInt(densityHex, 16);
  if (!Number.isFinite(densityInt) || densityInt > 100) {
    return { ok: false, error: `Density out of range: ${densityInt}` };
  }
  const density = densityInt / 100;

  const parseChannel = (bits: string, name: string): boolean[] | { error: string } => {
    if (!/^[01]{16}$/.test(bits)) {
      return { error: `${name} must be exactly 16 binary digits, got "${bits}"` };
    }
    return bits.split("").map((c) => c === "1");
  };

  const channels: Record<Channel, boolean[]> = {} as Record<Channel, boolean[]>;
  for (const [name, bits] of [["pulse", pulse], ["grain", grain], ["air", air], ["sub", sub]] as const) {
    const result = parseChannel(bits, name);
    if (Array.isArray(result)) {
      channels[name] = result;
    } else {
      return { ok: false, error: result.error };
    }
  }

  return {
    ok: true,
    pattern: { bpm, swing, density, steps: channels },
  };
}

/**
 * Brief §10: Replace Math.random() with seeded RNG.
 * A given seed always recreates the same pattern.
 */
export function generateSeededPattern(seed: number, density: number): SequencerPattern {
  const rng = mulberry32(seed);
  const steps: Record<Channel, boolean[]> = {
    pulse: [], grain: [], air: [], sub: [],
  };
  // Pulse: heavy on the beat (0, 4, 8, 12) — kick pattern
  for (let i = 0; i < STEP_COUNT; i++) {
    if (i % 4 === 0) steps.pulse.push(rng() < density + 0.4);
    else steps.pulse.push(rng() < density * 0.3);
  }
  // Grain: off-beat hats (2, 6, 10, 14)
  for (let i = 0; i < STEP_COUNT; i++) {
    if (i % 4 === 2) steps.grain.push(rng() < density + 0.3);
    else steps.grain.push(rng() < density * 0.2);
  }
  // Air: sparse atmospheric
  for (let i = 0; i < STEP_COUNT; i++) {
    steps.air.push(rng() < density * 0.4);
  }
  // Sub: deep hits on 0 and 8
  for (let i = 0; i < STEP_COUNT; i++) {
    if (i === 0 || i === 8) steps.sub.push(rng() < density + 0.4);
    else steps.sub.push(rng() < density * 0.15);
  }
  return {
    bpm: 124,
    swing: 0.12,
    density,
    steps,
  };
}

export const DEFAULT_PATTERN: SequencerPattern = {
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
