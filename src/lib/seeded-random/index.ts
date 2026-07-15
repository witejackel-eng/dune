/**
 * Seeded pseudo-random number generator (mulberry32).
 * Deterministic across runs and devices — required for reproducible simulations.
 *
 * Brief §23: "Seed randomness where reproducibility matters."
 */
export type RNG = () => number;

export function mulberry32(seed: number): RNG {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Hash a string seed into a uint32 for mulberry32. */
export function hashSeed(str: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Generate a fresh 32-bit seed. */
export function randomSeed(): number {
  return (Math.random() * 4294967296) >>> 0;
}

/** Box-Muller transform — produces standard-normal samples. */
export function gaussian(rng: RNG): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

/** Format a seed as a hex string for display/copy. */
export function formatSeed(seed: number): string {
  return "0x" + seed.toString(16).toUpperCase().padStart(8, "0");
}
