"use client";

/**
 * DUST//SIGNAL — Cinematic loading sequence (V2).
 * Brief §15:
 *   - Do not fake shader/geometry completion percentages.
 *   - Track meaningful scene readiness.
 *   - Do not block the visitor longer than necessary.
 *   - Full sequence only on the first session visit.
 *   - Short transition on route navigation.
 *   - Skip button always works.
 *   - Reduced-motion mode uses a minimal fade.
 *   - Avoid hydration mismatches.
 *   - Site cannot remain permanently trapped behind loader when WebGL creation fails.
 *
 * Target duration: ~1.2–2 seconds when cached.
 */

import { useEffect, useState } from "react";
import { Emblem } from "@/components/typography/emblem";
import { useSystemStatus } from "@/components/layout/system-status";

type Phase = "hidden" | "point" | "axis" | "emblem" | "labels" | "done";

export function LoadingSequence() {
  const [phase, setPhase] = useState<Phase>("hidden");
  const { seedHex } = useSystemStatus();

  useEffect(() => {
    // SSR safety — only run in browser
    if (typeof window === "undefined") return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const alreadyLoaded = sessionStorage.getItem("dust-signal:loaded") === "true";

    // Brief §15: Immediate skip if already loaded or reduced motion
    if (alreadyLoaded || reduced) {
      // Brief §15: short transition on route navigation
      const t = window.setTimeout(() => setPhase("done"), 100);
      return () => window.clearTimeout(t);
    }

    // Brief §15: Full sequence only on first session visit, ~1.5s total
    const timers: number[] = [];
    timers.push(window.setTimeout(() => setPhase("point"), 0));
    timers.push(window.setTimeout(() => setPhase("axis"), 200));
    timers.push(window.setTimeout(() => setPhase("emblem"), 500));
    timers.push(window.setTimeout(() => setPhase("labels"), 900));
    timers.push(window.setTimeout(() => {
      setPhase("done");
      sessionStorage.setItem("dust-signal:loaded", "true");
    }, 1500));

    // Brief §15: Fail-safe — never let the loader persist beyond 4s no matter what
    const failSafe = window.setTimeout(() => {
      setPhase("done");
      sessionStorage.setItem("dust-signal:loaded", "true");
    }, 4000);
    timers.push(failSafe);

    return () => {
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, []);

  const skip = () => {
    setPhase("done");
    if (typeof window !== "undefined") {
      sessionStorage.setItem("dust-signal:loaded", "true");
    }
  };

  // Brief §15: Avoid hydration mismatch — render nothing on server
  if (phase === "hidden" || phase === "done") return null;

  return (
    <div
      className="fixed inset-0 z-[200] bg-carbon flex items-center justify-center"
      role="dialog"
      aria-label="Loading DUST//SIGNAL"
      aria-busy="true"
    >
      <div className="relative w-full max-w-md px-6">
        {/* Centered emblem area */}
        <div className="relative h-32 flex items-center justify-center mb-8">
          {/* Displaced point */}
          <div
            className="absolute w-1.5 h-1.5 bg-signal transition-opacity duration-300 opacity-100"
            style={{ transform: "translate(28px, -22px)" }}
            aria-hidden="true"
          />
          {/* Calibration line — draws upward */}
          {(phase === "axis" || phase === "emblem" || phase === "labels") && (
            <div
              className="absolute w-px bg-gradient-to-t from-transparent via-amber to-transparent calibration-line"
              style={{ height: 120, left: "50%" }}
              aria-hidden="true"
            />
          )}
          {/* Emblem */}
          {(phase === "emblem" || phase === "labels") && (
            <div className="text-amber" style={{ animation: "ds-fade-in 600ms 100ms forwards" }}>
              <Emblem size={56} />
            </div>
          )}
        </div>

        {/* Label */}
        <div
          className={`text-center transition-opacity duration-500 ${
            phase === "labels" ? "opacity-100" : "opacity-0"
          }`}
        >
          <p className="label-t-bright mb-2">FIELD INITIALIZATION</p>
          <p className="font-display text-xl text-bone tracking-tight">
            DUST<span className="text-amber">{"//"}</span>SIGNAL
          </p>
          <p className="font-mono text-[10px] tracking-[0.15em] uppercase text-dust/40 mt-3">
            SEED {seedHex}
          </p>
        </div>

        {/* Skip control — always available */}
        <button
          onClick={skip}
          className="absolute top-0 right-0 font-mono text-[10px] tracking-[0.18em] uppercase text-dust/40 hover:text-amber transition-colors"
          aria-label="Skip loading sequence"
        >
          SKIP ›
        </button>
      </div>

      <style jsx>{`
        @keyframes ds-fade-in {
          from { opacity: 0; transform: scale(0.92); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
