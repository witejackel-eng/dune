"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useSystemStatus, formatSimulationTime } from "./system-status";
import { useAudio } from "@/components/experience/audio/audio-provider";
import { ROUTES } from "@/content/site-content";
import { Emblem } from "@/components/typography/emblem";

/**
 * Brief §25: Emblem on the left, route links centre/right, audio control, system status.
 * Brief §17: On mobile, simplify without removing essential navigation.
 */
export function SiteHeader() {
  const pathname = usePathname();
  const status = useSystemStatus();
  const audio = useAudio();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 80);
    handler();
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Keep system status in sync with audio
  useEffect(() => {
    status.setAudioState({
      enabled: audio.enabled,
      playing: audio.playing,
      muted: audio.muted,
      bpm: audio.bpm,
    });
  }, [audio.enabled, audio.playing, audio.muted, audio.bpm]);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-carbon/85 backdrop-blur-sm hairline-b"
            : "bg-transparent"
        }`}
        style={{ borderColor: scrolled ? undefined : "transparent" }}
      >
        <div className="grid grid-cols-12 items-center h-14 px-4 md:px-6">
          {/* Emblem + name */}
          <div className="col-span-3 md:col-span-3 flex items-center gap-2.5">
            <Link
              href="/"
              className="flex items-center gap-2.5 group"
              aria-label="DUST//SIGNAL — Observatory"
            >
              <Emblem className="w-5 h-5 md:w-6 md:h-6 transition-transform group-hover:scale-110" />
              <span className="font-display text-sm md:text-base font-bold tracking-tight text-bone">
                DUST<span className="text-amber">{"//"}</span>SIGNAL
              </span>
            </Link>
          </div>

          {/* Desktop nav */}
          <nav
            className="hidden md:flex col-span-6 items-center justify-center gap-6"
            aria-label="Primary"
          >
            {ROUTES.map((r) => {
              const active = pathname === r.path;
              return (
                <Link
                  key={r.path}
                  href={r.path}
                  className={`group flex items-center gap-1.5 font-mono text-[11px] tracking-[0.18em] uppercase transition-colors ${
                    active ? "text-amber" : "text-dust/60 hover:text-bone"
                  }`}
                >
                  <span className="opacity-50">{r.code}</span>
                  <span>{r.label}</span>
                  {active && (
                    <span className="ml-1 w-1 h-1 bg-amber blink" aria-hidden="true" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right cluster: audio + status trigger (mobile: menu) */}
          <div className="col-span-9 md:col-span-3 flex items-center justify-end gap-3">
            {/* Audio control */}
            <button
              onClick={() => {
                if (!audio.enabled) {
                  audio.enable();
                } else {
                  audio.toggleMute();
                }
              }}
              className="hidden md:flex items-center gap-2 font-mono text-[10px] tracking-[0.18em] uppercase px-2 py-1.5 hairline-l hairline-r text-dust/70 hover:text-amber transition-colors focus-visible:outline-1 focus-visible:outline-amber focus-visible:outline-offset-2"
              aria-label={audio.enabled ? (audio.muted ? "Unmute audio" : "Mute audio") : "Enable audio"}
              aria-pressed={audio.muted}
            >
              <AudioGlyph
                enabled={audio.enabled}
                muted={audio.muted}
                playing={audio.playing}
              />
              <span className="hidden lg:inline">
                {!audio.enabled ? "SIGNAL OFF" : audio.muted ? "MUTED" : audio.playing ? "PLAYING" : "READY"}
              </span>
            </button>

            {/* System status pill (desktop) */}
            <div
              className="hidden lg:flex items-center gap-3 font-mono text-[10px] tracking-[0.15em] uppercase text-dust/50"
              aria-live="polite"
            >
              <span>{formatSimulationTime(status.simulationTime)}</span>
              <span className="w-px h-3 bg-dust/20" />
              <span>SEED {status.seedHex.slice(0, 6)}</span>
              <span className="w-px h-3 bg-dust/20" />
              <span>{status.quality.toUpperCase()}</span>
            </div>

            {/* Mobile menu trigger */}
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="md:hidden flex flex-col gap-1 p-2"
              aria-label="Open menu"
              aria-expanded={menuOpen}
            >
              <span className={`block w-5 h-px bg-bone transition-transform ${menuOpen ? "rotate-45 translate-y-[3px]" : ""}`} />
              <span className={`block w-5 h-px bg-bone transition-transform ${menuOpen ? "-rotate-45 -translate-y-[2px]" : ""}`} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu overlay */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-40 bg-carbon/95 backdrop-blur-md md:hidden flex flex-col justify-center px-8"
          role="dialog"
          aria-modal="true"
          aria-label="Site navigation"
        >
          <nav className="flex flex-col gap-6" aria-label="Mobile primary">
            {ROUTES.map((r) => {
              const active = pathname === r.path;
              return (
                <Link
                  key={r.path}
                  href={r.path}
                  className={`flex items-baseline gap-4 ${
                    active ? "text-amber" : "text-bone"
                  }`}
                >
                  <span className="font-mono text-[11px] tracking-[0.18em] uppercase opacity-60">
                    {r.code}
                  </span>
                  <span className="font-display text-3xl font-bold tracking-tight uppercase">
                    {r.label}
                  </span>
                </Link>
              );
            })}
          </nav>
          <div className="mt-12 flex items-center justify-between font-mono text-[10px] tracking-[0.15em] uppercase text-dust/50">
            <button
              onClick={() => {
                if (!audio.enabled) audio.enable();
                else audio.toggleMute();
              }}
              className="flex items-center gap-2 text-dust/70"
            >
              <AudioGlyph enabled={audio.enabled} muted={audio.muted} playing={audio.playing} />
              {!audio.enabled ? "ENABLE SIGNAL" : audio.muted ? "UNMUTE" : "MUTE"}
            </button>
            <span>SEED {status.seedHex.slice(0, 6)}</span>
          </div>
        </div>
      )}
    </>
  );
}

function AudioGlyph({
  enabled,
  muted,
  playing,
}: {
  enabled: boolean;
  muted: boolean;
  playing: boolean;
}) {
  if (!enabled) {
    return (
      <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
        <circle cx="5" cy="5" r="1" fill="currentColor" opacity="0.5" />
        <circle cx="5" cy="5" r="3.5" stroke="currentColor" strokeWidth="0.5" fill="none" opacity="0.3" />
      </svg>
    );
  }
  if (muted) {
    return (
      <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
        <circle cx="5" cy="5" r="1" fill="currentColor" opacity="0.3" />
        <line x1="2" y1="2" x2="8" y2="8" stroke="currentColor" strokeWidth="0.5" />
      </svg>
    );
  }
  if (playing) {
    return (
      <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true" className="text-amber">
        <rect x="2" y="3" width="1" height="4" fill="currentColor" />
        <rect x="4.5" y="1.5" width="1" height="7" fill="currentColor" />
        <rect x="7" y="3" width="1" height="4" fill="currentColor" />
      </svg>
    );
  }
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
      <circle cx="5" cy="5" r="1.5" fill="currentColor" />
    </svg>
  );
}
