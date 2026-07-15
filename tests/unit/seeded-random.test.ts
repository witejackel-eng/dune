import { describe, it, expect } from "vitest";
import { mulberry32, hashSeed, randomSeed, gaussian, formatSeed } from "@/lib/seeded-random";

describe("seeded-random", () => {
  describe("mulberry32", () => {
    it("produces deterministic values for the same seed", () => {
      const rng1 = mulberry32(0x12345678);
      const rng2 = mulberry32(0x12345678);
      const seq1 = Array.from({ length: 10 }, () => rng1());
      const seq2 = Array.from({ length: 10 }, () => rng2());
      expect(seq1).toEqual(seq2);
    });

    it("produces different sequences for different seeds", () => {
      const rng1 = mulberry32(0x12345678);
      const rng2 = mulberry32(0x87654321);
      const seq1 = Array.from({ length: 10 }, () => rng1());
      const seq2 = Array.from({ length: 10 }, () => rng2());
      expect(seq1).not.toEqual(seq2);
    });

    it("returns values in [0, 1)", () => {
      const rng = mulberry32(42);
      for (let i = 0; i < 1000; i++) {
        const v = rng();
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThan(1);
      }
    });
  });

  describe("hashSeed", () => {
    it("hashes the same string consistently", () => {
      expect(hashSeed("dust-signal")).toBe(hashSeed("dust-signal"));
    });
    it("hashes different strings differently", () => {
      expect(hashSeed("a")).not.toBe(hashSeed("b"));
    });
    it("returns a uint32", () => {
      const h = hashSeed("anything");
      expect(h).toBeGreaterThanOrEqual(0);
      expect(h).toBeLessThanOrEqual(0xffffffff);
      expect(Number.isInteger(h)).toBe(true);
    });
  });

  describe("randomSeed", () => {
    it("returns a uint32 integer", () => {
      const s = randomSeed();
      expect(s).toBeGreaterThanOrEqual(0);
      expect(s).toBeLessThanOrEqual(0xffffffff);
      expect(Number.isInteger(s)).toBe(true);
    });
  });

  describe("gaussian", () => {
    it("produces deterministic output for the same RNG state", () => {
      const rng1 = mulberry32(99);
      const rng2 = mulberry32(99);
      const a = gaussian(rng1);
      const b = gaussian(rng2);
      expect(a).toBeCloseTo(b, 10);
    });
    it("returns finite numbers", () => {
      const rng = mulberry32(7);
      for (let i = 0; i < 100; i++) {
        const v = gaussian(rng);
        expect(Number.isFinite(v)).toBe(true);
      }
    });
  });

  describe("formatSeed", () => {
    it("formats as 0x-prefixed uppercase hex padded to 8 chars", () => {
      expect(formatSeed(0x4d535f47)).toBe("0x4D535F47");
      expect(formatSeed(0xff)).toBe("0x000000FF");
      expect(formatSeed(0)).toBe("0x00000000");
    });
  });
});
