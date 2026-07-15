import { describe, it, expect } from "vitest";
import {
  simulateGBM,
  volSurfaceSlice,
  buildCovariance,
  fourierCompose,
  lissajous,
  quantile,
} from "@/lib/math";
import { mulberry32 } from "@/lib/seeded-random";

describe("math / simulateGBM", () => {
  it("is deterministic for the same seed and params", () => {
    const rng1 = mulberry32(123);
    const rng2 = mulberry32(123);
    const a = simulateGBM({ s0: 100, mu: 0.1, sigma: 0.2, T: 1, steps: 50, paths: 20 }, rng1);
    const b = simulateGBM({ s0: 100, mu: 0.1, sigma: 0.2, T: 1, steps: 50, paths: 20 }, rng2);
    expect(a.paths).toEqual(b.paths);
  });

  it("produces the correct number of paths and steps", () => {
    const rng = mulberry32(1);
    const result = simulateGBM({ s0: 100, mu: 0.05, sigma: 0.15, T: 2, steps: 30, paths: 50 }, rng);
    expect(result.paths.length).toBe(50);
    expect(result.paths[0].length).toBe(31); // steps + 1
    expect(result.times.length).toBe(31);
  });

  it("starts every path at s0", () => {
    const rng = mulberry32(2);
    const result = simulateGBM({ s0: 42, mu: 0, sigma: 0.3, T: 1, steps: 10, paths: 10 }, rng);
    for (const path of result.paths) {
      expect(path[0]).toBe(42);
    }
  });

  it("returns valid statistics arrays matching step count", () => {
    const rng = mulberry32(3);
    const result = simulateGBM({ s0: 100, mu: 0.1, sigma: 0.2, T: 1, steps: 20, paths: 30 }, rng);
    expect(result.median.length).toBe(21);
    expect(result.p05.length).toBe(21);
    expect(result.p95.length).toBe(21);
    expect(result.mean.length).toBe(21);
    expect(result.finalDistribution.length).toBe(30);
  });
});

describe("math / quantile", () => {
  it("returns the value at the q-th position", () => {
    expect(quantile([1, 2, 3, 4, 5], 0.5)).toBe(3);
    expect(quantile([1, 2, 3, 4, 5], 0)).toBe(1);
    expect(quantile([1, 2, 3, 4, 5], 1)).toBe(5);
  });
  it("returns 0 for empty array", () => {
    expect(quantile([], 0.5)).toBe(0);
  });
});

describe("math / volSurfaceSlice", () => {
  it("returns arrays of the requested length", () => {
    const r = volSurfaceSlice({
      tau: 1, baseVariance: 0.04, slopeB: 0.15, rho: -0.3, curvature: 0.1,
      strikeRange: 1, moneynessSteps: 40,
    });
    expect(r.moneyness.length).toBe(40);
    expect(r.variances.length).toBe(40);
    expect(r.volatilities.length).toBe(40);
  });

  it("returns positive variances only", () => {
    const r = volSurfaceSlice({
      tau: 1, baseVariance: 0.01, slopeB: 0.05, rho: -0.8, curvature: 0.05,
      strikeRange: 2, moneynessSteps: 20,
    });
    for (const v of r.variances) {
      expect(v).toBeGreaterThan(0);
    }
  });

  it("skew sign matches rho sign", () => {
    const r = volSurfaceSlice({
      tau: 1, baseVariance: 0.04, slopeB: 0.2, rho: -0.5, curvature: 0.05,
      strikeRange: 1, moneynessSteps: 40,
    });
    expect(r.skew).toBeLessThan(0); // negative rho → negative skew
  });
});

describe("math / buildCovariance", () => {
  it("produces an n×n matrix", () => {
    const rng = mulberry32(10);
    const r = buildCovariance({ n: 6, seed: 10, sparsity: 0.5 }, rng);
    expect(r.matrix.length).toBe(6);
    for (const row of r.matrix) expect(row.length).toBe(6);
    expect(r.correlations.length).toBe(6);
    for (const row of r.correlations) expect(row.length).toBe(6);
  });

  it("correlations are in [-1, 1]", () => {
    const rng = mulberry32(11);
    const r = buildCovariance({ n: 8, seed: 11, sparsity: 0.6 }, rng);
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        // Allow tiny floating-point overshoot
        expect(r.correlations[i][j]).toBeGreaterThanOrEqual(-1.0001);
        expect(r.correlations[i][j]).toBeLessThanOrEqual(1.0001);
      }
    }
  });

  it("diagonal correlations are 1", () => {
    const rng = mulberry32(12);
    const r = buildCovariance({ n: 5, seed: 12, sparsity: 1.0 }, rng);
    for (let i = 0; i < 5; i++) {
      expect(r.correlations[i][i]).toBeCloseTo(1, 6);
    }
  });

  it("is deterministic for the same seed", () => {
    const rng1 = mulberry32(13);
    const rng2 = mulberry32(13);
    const a = buildCovariance({ n: 5, seed: 13, sparsity: 0.5 }, rng1);
    const b = buildCovariance({ n: 5, seed: 13, sparsity: 0.5 }, rng2);
    expect(a.matrix).toEqual(b.matrix);
  });
});

describe("math / fourierCompose", () => {
  it("returns combined wave of correct length", () => {
    const r = fourierCompose({
      components: [{ frequency: 1, amplitude: 1, phase: 0 }],
      duration: Math.PI * 2,
      samples: 100,
    });
    expect(r.combined.length).toBe(100);
    expect(r.individual.length).toBe(1);
    expect(r.individual[0].length).toBe(100);
  });

  it("sums individual waves into combined", () => {
    const r = fourierCompose({
      components: [
        { frequency: 1, amplitude: 1, phase: 0 },
        { frequency: 2, amplitude: 0.5, phase: 0 },
      ],
      duration: Math.PI * 2,
      samples: 50,
    });
    for (let i = 0; i < 50; i++) {
      expect(r.combined[i]).toBeCloseTo(r.individual[0][i] + r.individual[1][i], 6);
    }
  });

  it("circular phase points lie on the unit circle", () => {
    const r = fourierCompose({
      components: [
        { frequency: 1, amplitude: 1, phase: 0 },
        { frequency: 2, amplitude: 1, phase: Math.PI / 2 },
      ],
      duration: 1,
      samples: 10,
    });
    for (const p of r.circularPhase) {
      const mag = Math.sqrt(p.x * p.x + p.y * p.y);
      expect(mag).toBeCloseTo(1, 6);
    }
  });
});

describe("math / lissajous", () => {
  it("returns the correct number of points", () => {
    const points = lissajous([0, 1, 2, 3], 3, 4, 0);
    expect(points.length).toBe(4);
  });
  it("with equal frequencies and zero phase produces a line", () => {
    const points = lissajous([0, Math.PI / 2, Math.PI, 3 * Math.PI / 2], 1, 1, 0);
    // x and y should be equal
    for (const p of points) {
      expect(p.x).toBeCloseTo(p.y, 6);
    }
  });
});
