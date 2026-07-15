"use client";

/**
 * DUST//SIGNAL — Persistent system status.
 * Brief §7: Display current route, local simulation time, audio state, render quality, seed number.
 * Brief §10 (footer): Field version, build year, simulation seed, local time, GitHub link, credit.
 */

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { randomSeed, formatSeed } from "@/lib/seeded-random";

interface SystemStatusValue {
  route: string;
  routeCode: string;
  simulationTime: number; // seconds since mount
  audioEnabled: boolean;
  audioPlaying: boolean;
  audioMuted: boolean;
  bpm: number;
  quality: "auto" | "high" | "balanced" | "reduced";
  seed: number;
  seedHex: string;
  setAudioState: (s: { enabled?: boolean; playing?: boolean; muted?: boolean; bpm?: number }) => void;
  setQuality: (q: "auto" | "high" | "balanced" | "reduced") => void;
  regenerateSeed: () => void;
}

const SystemStatusContext = createContext<SystemStatusValue | null>(null);

const ROUTE_CODES: Record<string, string> = {
  "/": "00",
  "/models": "01",
  "/signal": "02",
  "/archive": "03",
  "/protocol": "04",
};

export function SystemStatusProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "/";
  const [simulationTime, setSimulationTime] = useState(0);
  const [seed, setSeed] = useState(() => {
    if (typeof window === "undefined") return 0x4d535f47;
    const stored = window.sessionStorage.getItem("dust-signal:seed");
    if (stored) return parseInt(stored, 16);
    const s = 0x4d535f47;
    window.sessionStorage.setItem("dust-signal:seed", formatSeed(s));
    return s;
  });
  const [audioState, setAudioStateInner] = useState({
    enabled: false,
    playing: false,
    muted: false,
    bpm: 124,
  });
  const [quality, setQuality] = useState<"auto" | "high" | "balanced" | "reduced">("auto");

  // Simulation time — increments 1s while tab visible
  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        setSimulationTime(Math.floor((Date.now() - start) / 1000));
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const routeCode = ROUTE_CODES[pathname] ?? "??";

  const value = useMemo<SystemStatusValue>(
    () => ({
      route: pathname,
      routeCode,
      simulationTime,
      audioEnabled: audioState.enabled,
      audioPlaying: audioState.playing,
      audioMuted: audioState.muted,
      bpm: audioState.bpm,
      quality,
      seed,
      seedHex: formatSeed(seed),
      setAudioState: (s) => setAudioStateInner((prev) => ({ ...prev, ...s })),
      setQuality,
      regenerateSeed: () => {
        const s = randomSeed();
        setSeed(s);
        if (typeof window !== "undefined") {
          window.sessionStorage.setItem("dust-signal:seed", formatSeed(s));
        }
      },
    }),
    [pathname, routeCode, simulationTime, audioState, quality, seed]
  );

  return (
    <SystemStatusContext.Provider value={value}>
      {children}
    </SystemStatusContext.Provider>
  );
}

export function useSystemStatus() {
  const ctx = useContext(SystemStatusContext);
  if (!ctx) throw new Error("useSystemStatus must be used within SystemStatusProvider");
  return ctx;
}

/** Format seconds as HH:MM:SS for the system status display. */
export function formatSimulationTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map((n) => n.toString().padStart(2, "0")).join(":");
}
