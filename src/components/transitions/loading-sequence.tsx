"use client";

/**
 * Brief §8: Cinematic loading sequence.
 * - Black screen
 * - Tiny displaced point appears
 * - Vertical calibration line draws upward
 * - Emblem assembles
 * - "FIELD INITIALIZATION" text appears
 * - Real loading values update: Shaders / Geometry / Audio engine / Simulation seed
 * - Low-frequency visual pulse
 * - Experience opens
 *
 * Brief: Store session state so repeat navigation does not replay complete intro.
 * Brief: Provide a Skip control. Respect prefers-reduced-motion.
 */

import { useEffect, useRef, useState } from "react";
import { Emblem } from "@/components/typography/emblem";
import { useSystemStatus } from "@/components/layout/system-status";

type Phase = "hidden" | "point" | "axis" | "emblem" | "labels" | "pulse" | "done";

const STAGES = [
  { key: "SHADERS", duration: 380 },
  { key: "GEOMETRY", duration: 420 },
  { key: "AUDIO ENGINE", duration: 280 },
  { key: "SIMULATION SEED", duration: 220 },
] as const;

export function LoadingSequence() {
  const [phase, setPhase] = useState<Phase>("hidden");
  const [progress, setProgress] = useState(0);
  const [stageIdx, setStageIdx] = useState(0);
  const [skipped, setSkipped] = useState(false);
  const startTimeRef = useRef(0);
  const { seedHex, regenerateSeed } = useSystemStatus();

  useEffect(() => {
    // Respect reduced motion — show values but skip animation
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Only show full intro on first visit of session
    const alreadyLoaded = sessionStorage.getItem("dust-signal:loaded") === "true";
    if (alreadyLoaded || reduced) {
      setPhase("done");
      return;
    }

    startTimeRef.current = performance.now();
    setPhase("point");

    const timers: number[] = [];
    timers.push(window.setTimeout(() => setPhase("axis"), 280));
    timers.push(window.setTimeout(() => setPhase("emblem"), 680));
    timers.push(window.setTimeout(() => setPhase("labels"), 1100));
    timers.push(window.setTimeout(() => setPhase("pulse"), 1700));
    timers.push(window.setTimeout(() => {
      setPhase("done");
      sessionStorage.setItem("dust-signal:loaded", "true");
    }, 2300));

    // Progress + stages
    let p = 0;
    let sIdx = 0;
    const interval = window.setInterval(() => {
      p = Math.min(100, p + Math.random() * 9 + 4);
      setProgress(p);
      const newStageIdx = Math.min(
        STAGES.length - 1,
        Math.floor((p / 100) * STAGES.length)
      );
      if (newStageIdx !== sIdx) {
        sIdx = newStageIdx;
        setStageIdx(sIdx);
      }
      if (p >= 100) {
        window.clearInterval(interval);
      }
    }, 90);

    return () => {
      timers.forEach((t) => window.clearTimeout(t));
      window.clearInterval(interval);
    };
  }, [regenerateSeed]);

  const skip = () => {
    setSkipped(true);
    setPhase("done");
    sessionStorage.setItem("dust-signal:loaded", "true");
  };

  if (phase === "done") return null;

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
            className={`absolute w-1.5 h-1.5 bg-signal transition-opacity duration-300 ${
              phase !== "hidden" ? "opacity-100" : "opacity-0"
            }`}
            style={{ transform: "translate(28px, -22px)" }}
            aria-hidden="true"
          />
          {/* Calibration line — draws upward */}
          {phase !== "point" && phase !== "hidden" && (
            <div
              className="absolute w-px bg-gradient-to-t from-transparent via-amber to-transparent calibration-line"
              style={{ height: 120, left: "50%" }}
              aria-hidden="true"
            />
          )}
          {/* Emblem */}
          {phase !== "point" && phase !== "axis" && phase !== "hidden" && (
            <div className="text-amber transition-opacity duration-500 opacity-0" style={{ animation: "fadeIn 600ms 100ms forwards" }}>
              <Emblem size={56} />
            </div>
          )}
        </div>

        {/* Label */}
        <div
          className={`text-center transition-opacity duration-500 ${
            phase === "labels" || phase === "pulse" ? "opacity-100" : "opacity-0"
          }`}
        >
          <p className="label-t-bright mb-2">FIELD INITIALIZATION</p>
          <p className="font-display text-xl text-bone tracking-tight">
            DUST<span className="text-amber">{"//"}</span>SIGNAL
          </p>
        </div>

        {/* Stage list */}
        <div
          className={`mt-8 transition-opacity duration-500 ${
            phase === "labels" || phase === "pulse" ? "opacity-100" : "opacity-0"
          }`}
        >
          <ul className="space-y-1.5">
            {STAGES.map((s, i) => {
              const done = i < stageIdx;
              const active = i === stageIdx;
              return (
                <li
                  key={s.key}
                  className={`flex items-center justify-between font-mono text-[10px] tracking-[0.18em] uppercase ${
                    done ? "text-amber" : active ? "text-dust" : "text-dust/30"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5">
                      {done ? "●" : active ? "○" : "·"}
                    </span>
                    {s.key}
                  </span>
                  <span>{done ? "OK" : active ? `${Math.round(progress)}%` : "—"}</span>
                </li>
              );
            })}
          </ul>

          {/* Progress bar */}
          <div className="mt-3 h-px bg-dust/15 relative">
            <div
              className="absolute inset-y-0 left-0 bg-amber"
              style={{ width: `${progress}%`, transition: "width 90ms linear" }}
            />
          </div>

          {/* Seed + meta */}
          <div className="mt-3 flex items-center justify-between font-mono text-[10px] tracking-[0.15em] uppercase text-dust/40">
            <span>SEED {seedHex}</span>
            <span>{Math.round(progress)}%</span>
          </div>
        </div>

        {/* Skip control */}
        <button
          onClick={skip}
          className="absolute top-0 right-0 font-mono text-[10px] tracking-[0.18em] uppercase text-dust/40 hover:text-amber transition-colors"
          aria-label="Skip loading sequence"
        >
          SKIP ›
        </button>
      </div>

      {/* Low-frequency visual pulse */}
      {phase === "pulse" && (
        <div
          className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-amber/5 to-transparent"
          style={{ animation: "pulseSlow 1.4s ease-in-out" }}
          aria-hidden="true"
        />
      )}

      <style jsx>{`
        @keyframes fadeIn {
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
