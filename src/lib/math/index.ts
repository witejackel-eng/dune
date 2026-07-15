/**
 * DUST//SIGNAL — Mathematical core.
 * Brief §23: "Use genuine mathematical concepts. Do not display meaningless equations for decoration."
 *
 * All functions here are pure and tested independently of rendering.
 */

import { gaussian, type RNG } from "../seeded-random";

/* -------------------------------------------------------------
 * 1. Geometric Brownian Motion
 *    dS = μ S dt + σ S dW
 *
 * Used in: home Monte Carlo chamber, models/01 stochastic drift.
 * ----------------------------------------------------------- */
export interface GBMParams {
  s0: number;       // initial state
  mu: number;       // drift
  sigma: number;    // volatility
  T: number;        // time horizon (years)
  steps: number;    // discretization steps
  paths: number;    // number of independent paths
}

export interface GBMResult {
  times: number[];
  paths: number[][];
  median: number[];
  p05: number[];
  p95: number[];
  mean: number[];
  finalDistribution: number[];
}

export function simulateGBM(params: GBMParams, rng: RNG): GBMResult {
  const { s0, mu, sigma, T, steps, paths } = params;
  const dt = T / steps;
  const sqrtDt = Math.sqrt(dt);
  const times = Array.from({ length: steps + 1 }, (_, i) => (i * T) / steps);

  const allPaths: number[][] = [];
  for (let p = 0; p < paths; p++) {
    const path = new Array<number>(steps + 1);
    path[0] = s0;
    let s = s0;
    for (let i = 1; i <= steps; i++) {
      const z = gaussian(rng);
      s = s * Math.exp((mu - 0.5 * sigma * sigma) * dt + sigma * sqrtDt * z);
      path[i] = s;
    }
    allPaths.push(path);
  }

  const median: number[] = [];
  const p05: number[] = [];
  const p95: number[] = [];
  const mean: number[] = [];
  const finalDistribution: number[] = [];

  for (let i = 0; i <= steps; i++) {
    const slice = allPaths.map((p) => p[i]).sort((a, b) => a - b);
    median.push(quantile(slice, 0.5));
    p05.push(quantile(slice, 0.05));
    p95.push(quantile(slice, 0.95));
    mean.push(slice.reduce((a, b) => a + b, 0) / slice.length);
    if (i === steps) finalDistribution.push(...slice);
  }

  return { times, paths: allPaths, median, p05, p95, mean, finalDistribution };
}

export function quantile(sortedAsc: number[], q: number): number {
  if (sortedAsc.length === 0) return 0;
  const pos = (sortedAsc.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  if (lo === hi) return sortedAsc[lo];
  return sortedAsc[lo] + (sortedAsc[hi] - sortedAsc[lo]) * (pos - lo);
}

/* -------------------------------------------------------------
 * 2. Volatility Surface — synthetic SVI-like parametrisation
 *    σ²(k, τ) = a + b * {ρ(k−m) + sqrt((k−m)² + σ_sl²)}
 * ----------------------------------------------------------- */
export interface VolSurfaceParams {
  tau: number;
  baseVariance: number;
  slopeB: number;
  rho: number;
  curvature: number;
  strikeRange: number;
  moneynessSteps: number;
}

export interface VolSurfaceResult {
  moneyness: number[];
  variances: number[];
  volatilities: number[];
  skew: number;
  atmVol: number;
}

export function volSurfaceSlice(params: VolSurfaceParams): VolSurfaceResult {
  const { tau, baseVariance, slopeB, rho, curvature, strikeRange, moneynessSteps } = params;
  const moneyness: number[] = [];
  const variances: number[] = [];
  const volatilities: number[] = [];

  for (let i = 0; i < moneynessSteps; i++) {
    const k = -strikeRange + (2 * strikeRange * i) / (moneynessSteps - 1);
    const totalVariance =
      baseVariance + slopeB * (rho * k + Math.sqrt(k * k + curvature * curvature));
    moneyness.push(k);
    variances.push(Math.max(totalVariance, 1e-6));
    volatilities.push(Math.sqrt(Math.max(totalVariance, 1e-6) / Math.max(tau, 1e-6)));
  }

  const idxMid = Math.floor(moneynessSteps / 2);
  const skew =
    moneynessSteps > 2
      ? (volatilities[idxMid + 1] - volatilities[idxMid - 1]) /
        (moneyness[idxMid + 1] - moneyness[idxMid - 1])
      : 0;

  return { moneyness, variances, volatilities, skew, atmVol: volatilities[idxMid] || 0 };
}

/* -------------------------------------------------------------
 * 3. Covariance matrix → spatial network
 * ----------------------------------------------------------- */
export interface CovarianceParams {
  n: number;
  seed: number;
  sparsity: number;
}

export interface CovarianceResult {
  matrix: number[][];
  correlations: number[][];
  nodes: { i: number; magnitude: number }[];
  edges: { a: number; b: number; weight: number; sign: 1 | -1 }[];
}

export function buildCovariance(params: CovarianceParams, rng: RNG): CovarianceResult {
  const { n, sparsity } = params;
  const A: number[][] = Array.from({ length: n }, () =>
    Array.from({ length: n }, () => gaussian(rng) * 0.5)
  );

  const matrix: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      let dot = 0;
      for (let k = 0; k < n; k++) dot += A[i][k] * A[j][k];
      matrix[i][j] = dot;
    }
  }

  const mask: boolean[][] = Array.from({ length: n }, () =>
    Array.from({ length: n }, () => false)
  );
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      mask[i][j] = mask[j][i] = rng() < sparsity;
    }
    mask[i][i] = true;
  }

  const correlations: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
  const nodes = [];
  const edges = [];
  for (let i = 0; i < n; i++) {
    const di = Math.sqrt(matrix[i][i]);
    nodes.push({ i, magnitude: di });
    for (let j = 0; j < n; j++) {
      const dj = Math.sqrt(matrix[j][j]);
      const corr = di > 0 && dj > 0 ? matrix[i][j] / (di * dj) : 0;
      correlations[i][j] = corr;
      if (j > i && mask[i][j] && Math.abs(corr) > 0.1) {
        edges.push({
          a: i,
          b: j,
          weight: Math.abs(corr),
          sign: (corr >= 0 ? 1 : -1) as 1 | -1,
        });
      }
    }
  }

  return { matrix, correlations, nodes, edges };
}

/* -------------------------------------------------------------
 * 4. Fourier composition
 * ----------------------------------------------------------- */
export interface FourierComponent {
  frequency: number;
  amplitude: number;
  phase: number;
}

export interface FourierParams {
  components: FourierComponent[];
  duration: number;
  samples: number;
}

export interface FourierResult {
  t: number[];
  individual: number[][];
  combined: number[];
  circularPhase: { x: number; y: number }[];
}

export function fourierCompose(params: FourierParams): FourierResult {
  const { components, duration, samples } = params;
  const t = Array.from({ length: samples }, (_, i) => (i * duration) / samples);
  const individual = components.map((c) =>
    t.map((tt) => c.amplitude * Math.sin(2 * Math.PI * c.frequency * tt + c.phase))
  );
  const combined = t.map((_, i) => individual.reduce((acc, arr) => acc + arr[i], 0));
  const circularPhase = components.map((c) => ({
    x: Math.cos(c.phase),
    y: Math.sin(c.phase),
  }));
  return { t, individual, combined, circularPhase };
}

/* -------------------------------------------------------------
 * 5. Lissajous figures
 * ----------------------------------------------------------- */
export function lissajous(
  t: number[],
  freqX: number,
  freqY: number,
  phase: number,
  ampX = 1,
  ampY = 1
): { x: number; y: number }[] {
  return t.map((tt) => ({
    x: ampX * Math.sin(2 * Math.PI * freqX * tt + phase),
    y: ampY * Math.sin(2 * Math.PI * freqY * tt),
  }));
}

/* -------------------------------------------------------------
 * 6. Procedural terrain (value noise)
 * ----------------------------------------------------------- */
export function terrainHeight(
  x: number,
  z: number,
  seed: number,
  octaves = 4,
  persistence = 0.5,
  scale = 0.05
): number {
  let total = 0;
  let frequency = scale;
  let amplitude = 1;
  let maxValue = 0;
  for (let i = 0; i < octaves; i++) {
    total += interpolatedNoise(x * frequency, z * frequency, seed + i * 1000) * amplitude;
    maxValue += amplitude;
    amplitude *= persistence;
    frequency *= 2;
  }
  return total / maxValue;
}

function interpolatedNoise(x: number, z: number, seed: number): number {
  const xi = Math.floor(x);
  const zi = Math.floor(z);
  const xf = x - xi;
  const zf = z - zi;
  const v00 = valueNoise(xi, zi, seed);
  const v10 = valueNoise(xi + 1, zi, seed);
  const v01 = valueNoise(xi, zi + 1, seed);
  const v11 = valueNoise(xi + 1, zi + 1, seed);
  const u = smoothStep(xf);
  const v = smoothStep(zf);
  return lerp(lerp(v00, v10, u), lerp(v01, v11, u), v);
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
function smoothStep(t: number): number {
  return t * t * (3 - 2 * t);
}
function valueNoise(x: number, z: number, seed: number): number {
  let h = (x * 374761393 + z * 668265263 + seed * 1274126177) >>> 0;
  h = (h ^ (h >>> 13)) * 1274126177;
  h = h ^ (h >>> 16);
  return (h >>> 0) / 4294967296;
}
