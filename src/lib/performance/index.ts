/**
 * Performance / quality utilities.
 * Brief §18: Adaptive quality, device pixel ratio cap, reduced particle count.
 */

export type Quality = "auto" | "high" | "balanced" | "reduced";

export interface DeviceProfile {
  quality: Quality;
  resolved: "high" | "balanced" | "reduced";
  pixelRatio: number;
  particleMultiplier: number; // 0..1 — multiply nominal particle counts
  supportsWebGL: boolean;
  prefersReducedMotion: boolean;
  isMobile: boolean;
  isTouch: boolean;
  cores: number;
  memory: number; // GB, if reported
}

export function detectDevice(): DeviceProfile {
  if (typeof window === "undefined") {
    return {
      quality: "auto",
      resolved: "balanced",
      pixelRatio: 1,
      particleMultiplier: 0.6,
      supportsWebGL: false,
      prefersReducedMotion: false,
      isMobile: false,
      isTouch: false,
      cores: 4,
      memory: 4,
    };
  }

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isMobile = window.matchMedia("(max-width: 768px)").matches;
  const isTouch = window.matchMedia("(pointer: coarse)").matches;
  const cores = (navigator as Navigator & { hardwareConcurrency?: number }).hardwareConcurrency || 4;
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory || 4;

  // WebGL capability
  let supportsWebGL = false;
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
    supportsWebGL = !!gl;
  } catch {
    supportsWebGL = false;
  }

  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

  let resolved: "high" | "balanced" | "reduced";
  if (prefersReducedMotion) {
    resolved = "reduced";
  } else if (isMobile || cores <= 4 || memory <= 2) {
    resolved = "reduced";
  } else if (cores >= 8 && memory >= 8) {
    resolved = "high";
  } else {
    resolved = "balanced";
  }

  const particleMultiplier =
    resolved === "high" ? 1 : resolved === "balanced" ? 0.6 : 0.3;

  return {
    quality: "auto",
    resolved,
    pixelRatio,
    particleMultiplier,
    supportsWebGL,
    prefersReducedMotion,
    isMobile,
    isTouch,
    cores,
    memory,
  };
}

/** Pause rAF when tab inactive — prevents wasted GPU cycles. */
export function setupVisibilityPause(callback: () => void): () => void {
  const handler = () => {
    if (document.visibilityState === "visible") callback();
  };
  document.addEventListener("visibilitychange", handler);
  return () => document.removeEventListener("visibilitychange", handler);
}
