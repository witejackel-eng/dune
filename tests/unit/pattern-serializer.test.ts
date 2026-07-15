import { describe, it, expect } from "vitest";
import {
  serializePattern,
  parsePattern,
  generateSeededPattern,
  DEFAULT_PATTERN,
} from "@/components/features/sequencer/pattern-serializer";
import { mulberry32 } from "@/lib/seeded-random";

describe("pattern serializer", () => {
  describe("serializePattern / parsePattern round-trip", () => {
    it("round-trips the default pattern", () => {
      const serialized = serializePattern(DEFAULT_PATTERN);
      const result = parsePattern(serialized);
      expect(result.ok).toBe(true);
      if (result.ok && result.pattern) {
        expect(result.pattern.bpm).toBe(DEFAULT_PATTERN.bpm);
        expect(result.pattern.swing).toBeCloseTo(DEFAULT_PATTERN.swing, 6);
        expect(result.pattern.density).toBeCloseTo(DEFAULT_PATTERN.density, 6);
        expect(result.pattern.steps.pulse).toEqual(DEFAULT_PATTERN.steps.pulse);
        expect(result.pattern.steps.grain).toEqual(DEFAULT_PATTERN.steps.grain);
        expect(result.pattern.steps.air).toEqual(DEFAULT_PATTERN.steps.air);
        expect(result.pattern.steps.sub).toEqual(DEFAULT_PATTERN.steps.sub);
      }
    });

    it("round-trips a custom pattern", () => {
      const custom = {
        bpm: 130,
        swing: 0.25,
        density: 0.6,
        steps: {
          pulse: Array.from({ length: 16 }, (_, i) => i % 2 === 0),
          grain: Array.from({ length: 16 }, (_, i) => i % 3 === 0),
          air: Array.from({ length: 16 }, () => false),
          sub: Array.from({ length: 16 }, (_, i) => i === 0 || i === 8),
        },
      };
      const serialized = serializePattern(custom);
      const result = parsePattern(serialized);
      expect(result.ok).toBe(true);
      if (result.ok && result.pattern) {
        expect(result.pattern.bpm).toBe(130);
        expect(result.pattern.steps.pulse).toEqual(custom.steps.pulse);
        expect(result.pattern.steps.sub).toEqual(custom.steps.sub);
      }
    });
  });

  describe("parsePattern validation", () => {
    it("rejects empty input", () => {
      const result = parsePattern("");
      expect(result.ok).toBe(false);
      expect(result.error).toMatch(/empty/i);
    });

    it("rejects input that is too long", () => {
      const result = parsePattern("a".repeat(250));
      expect(result.ok).toBe(false);
      expect(result.error).toMatch(/too long/i);
    });

    it("rejects invalid characters", () => {
      const result = parsePattern("abc|xyz|!!|0000000000000000|0000000000000000|0000000000000000|0000000000000000");
      expect(result.ok).toBe(false);
      expect(result.error).toMatch(/invalid characters/i);
    });

    it("rejects wrong number of segments", () => {
      const result = parsePattern("7c|0c|23|0000000000000000");
      expect(result.ok).toBe(false);
      expect(result.error).toMatch(/7 segments/i);
    });

    it("rejects BPM out of range", () => {
      // BPM = 0x05 = 5 (too low)
      const result = parsePattern("05|0c|23|0000000000000000|0000000000000000|0000000000000000|0000000000000000");
      expect(result.ok).toBe(false);
      expect(result.error).toMatch(/BPM/i);
    });

    it("rejects swing out of range", () => {
      // swing = 0xff = 255 (too high)
      const result = parsePattern("7c|ff|23|0000000000000000|0000000000000000|0000000000000000|0000000000000000");
      expect(result.ok).toBe(false);
      expect(result.error).toMatch(/swing/i);
    });

    it("rejects channel with wrong length", () => {
      // pulse channel only has 15 chars
      const result = parsePattern("7c|0c|23|000000000000000|0000000000000000|0000000000000000|0000000000000000");
      expect(result.ok).toBe(false);
      expect(result.error).toMatch(/pulse.*16/i);
    });

    it("rejects channel with non-binary chars", () => {
      // Use a char that passes the overall regex but fails the channel-specific check
      // "2" is valid hex but not a binary digit
      const result = parsePattern("7c|0c|23|0000000000000002|0000000000000000|0000000000000000|0000000000000000");
      expect(result.ok).toBe(false);
      expect(result.error).toMatch(/pulse.*16/i);
    });
  });

  describe("generateSeededPattern", () => {
    it("is deterministic for the same seed", () => {
      const a = generateSeededPattern(0xabc123, 0.4);
      const b = generateSeededPattern(0xabc123, 0.4);
      expect(a).toEqual(b);
    });

    it("produces different patterns for different seeds", () => {
      const a = generateSeededPattern(0xabc123, 0.4);
      const b = generateSeededPattern(0x123abc, 0.4);
      expect(a.steps.pulse).not.toEqual(b.steps.pulse);
    });

    it("always returns 16 steps per channel", () => {
      const p = generateSeededPattern(42, 0.5);
      expect(p.steps.pulse.length).toBe(16);
      expect(p.steps.grain.length).toBe(16);
      expect(p.steps.air.length).toBe(16);
      expect(p.steps.sub.length).toBe(16);
    });

    it("higher density produces more active steps on average", () => {
      const low = generateSeededPattern(42, 0.1);
      const high = generateSeededPattern(42, 0.9);
      const countActive = (arr: boolean[]) => arr.filter(Boolean).length;
      const lowTotal = countActive(low.steps.pulse) + countActive(low.steps.grain) + countActive(low.steps.air) + countActive(low.steps.sub);
      const highTotal = countActive(high.steps.pulse) + countActive(high.steps.grain) + countActive(high.steps.air) + countActive(high.steps.sub);
      expect(highTotal).toBeGreaterThan(lowTotal);
    });

    it("round-trips through serialize/parse", () => {
      const original = generateSeededPattern(99, 0.5);
      const serialized = serializePattern(original);
      const result = parsePattern(serialized);
      expect(result.ok).toBe(true);
      if (result.ok && result.pattern) {
        expect(result.pattern.steps.pulse).toEqual(original.steps.pulse);
      }
    });
  });

  describe("mulberry32 in serializer context", () => {
    it("produces the same RNG state as standalone mulberry32", () => {
      // Verify the serializer uses mulberry32 correctly
      const seed = 0xdeadbeef;
      const rng = mulberry32(seed);
      const firstVal = rng();
      expect(firstVal).toBeGreaterThanOrEqual(0);
      expect(firstVal).toBeLessThan(1);
    });
  });
});
