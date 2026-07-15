"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ObservatoryScene } from "@/components/experience/scenes/observatory-scene";
import { CTA } from "@/components/controls/cta";
import { Reveal } from "@/components/transitions/reveal";
import { useAudio } from "@/components/experience/audio/audio-provider";
import { useSystemStatus } from "@/components/layout/system-status";
import {
  FOUR_FORCES,
  FOUR_FORCES_COPY,
  EXPERIMENTS,
  DISCLAIMER,
  SITE,
} from "@/content/site-content";
import { mulberry32, formatSeed } from "@/lib/seeded-random";
import { simulateGBM } from "@/lib/math";
import { MonteCarloChamber } from "@/components/features/monte-carlo/monte-carlo-chamber";
import { FourForcesPanel } from "@/components/features/monte-carlo/four-forces-panel";
import { RhythmArchitecture } from "@/components/features/sequencer/rhythm-architecture";
import { ArchivePreview } from "@/components/features/sequencer/archive-preview";

const ObservatorySceneDynamic = dynamic(
  () => import("@/components/experience/scenes/observatory-scene").then((m) => m.ObservatoryScene),
  { ssr: false, loading: () => null }
);

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <FieldStatement />
      <FourForcesSection />
      <MonteCarloSection />
      <RhythmSection />
      <ArchivePreviewSection />
      <FinalHorizonSection />
    </>
  );
}

/* ============================================================
   SECTION 1 — ENTRY FIELD
   ============================================================ */
function HeroSection() {
  const audio = useAudio();
  const [scrollHint, setScrollHint] = useState(true);

  useEffect(() => {
    const onScroll = () => {
      if (window.scrollY > 80) setScrollHint(false);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <section
      className="relative w-full h-screen min-h-[640px] overflow-hidden"
      aria-labelledby="hero-heading"
    >
      <ObservatorySceneDynamic />

      {/* Hero copy overlay */}
      <div className="absolute inset-0 grid grid-cols-12 grid-rows-12 px-4 md:px-8 pt-20 md:pt-24 pb-10 pointer-events-none">
        {/* Top-left label */}
        <div className="col-span-6 row-span-1 flex items-start">
          <span className="label-t-bright">OBSERVATORY / 00</span>
        </div>

        {/* Top-right meta */}
        <div className="col-span-6 row-span-1 flex items-start justify-end gap-4">
          <span className="label-t hidden md:inline">LAT 32.7°N · LON 116.4°W</span>
          <span className="label-t">{SITE.fieldCode}</span>
        </div>

        {/* Centered headline */}
        <div className="col-span-12 row-span-6 row-start-4 flex flex-col justify-center items-start">
          <h1
            id="hero-heading"
            className="font-display font-bold uppercase tracking-[-0.04em] leading-[0.88] text-bone text-shadow-deep text-[15vw] md:text-[10vw] lg:text-[9vw] xl:text-[8rem]"
          >
            <Reveal y={24} delay={0.2}>
              <span className="block">PROBABILITY</span>
            </Reveal>
            <Reveal y={24} delay={0.5}>
              <span className="block">
                HAS A <span className="text-amber">PULSE</span>.
              </span>
            </Reveal>
          </h1>
          <Reveal y={16} delay={0.9}>
            <p className="mt-6 md:mt-8 max-w-md body-t text-sm md:text-base text-dust/80">
              A computational observatory studying uncertainty through mathematics, sound, and motion.
            </p>
          </Reveal>
        </div>

        {/* Bottom CTAs */}
        <div className="col-span-12 row-span-2 row-start-10 flex flex-col md:flex-row gap-3 md:gap-4 items-start pointer-events-auto">
          <CTA href="/models" variant="primary" cursorLabel="ENTER">
            ENTER THE FIELD
          </CTA>
          {audio.enabled ? (
            <CTA
              onClick={() => audio.toggleMute()}
              variant="outline"
              cursorLabel={audio.muted ? "UNMUTE" : "MUTE"}
            >
              {audio.muted ? "SIGNAL MUTED" : "SIGNAL READY"}
            </CTA>
          ) : (
            <CTA
              onClick={() => audio.enable()}
              variant="outline"
              cursorLabel="SOUND"
            >
              ENABLE SIGNAL
            </CTA>
          )}
        </div>

        {/* Scroll indicator */}
        <div
          className={`col-span-12 row-span-1 row-start-12 flex items-end justify-center transition-opacity duration-500 ${
            scrollHint ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className="flex flex-col items-center gap-2">
            <span className="label-t">DESCEND / 01</span>
            <div className="w-px h-8 bg-gradient-to-b from-amber to-transparent" />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   SECTION 2 — THE FIELD STATEMENT
   ============================================================ */
function FieldStatement() {
  return (
    <section
      className="relative bg-carbon py-32 md:py-48 px-4 md:px-8 overflow-hidden"
      aria-labelledby="field-statement-heading"
    >
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-12 md:col-span-2">
            <span className="label-t">02 / FIELD STATEMENT</span>
          </div>
          <div className="col-span-12 md:col-span-10">
            <div className="space-y-6 md:space-y-8">
              {FOUR_FORCES_COPY.slice(0, 4).map((line, i) => (
                <Reveal key={line} y={20} delay={i * 0.18}>
                  <p className="font-display text-3xl md:text-5xl lg:text-6xl font-light tracking-tight text-dust/70">
                    {line}
                  </p>
                </Reveal>
              ))}
              <Reveal y={24} delay={0.9}>
                <p className="font-display text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-bone mt-12">
                  {FOUR_FORCES_COPY[4]}
                </p>
              </Reveal>
              <Reveal y={20} delay={1.2}>
                <div className="mt-16 max-w-2xl">
                  <p className="editorial-t text-2xl md:text-3xl text-amber leading-snug">
                    DUST<span className="text-bone">//</span>SIGNAL studies the structures hidden inside movement.
                  </p>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   SECTION 3 — FOUR FORCES
   ============================================================ */
function FourForcesSection() {
  return (
    <section
      className="relative bg-mineral py-24 md:py-32 px-4 md:px-8 hairline-t"
      aria-labelledby="four-forces-heading"
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-12 gap-4 mb-12 md:mb-16">
          <div className="col-span-12 md:col-span-3">
            <span className="label-t">03 / FOUR FORCES</span>
          </div>
          <div className="col-span-12 md:col-span-9">
            <h2
              id="four-forces-heading"
              className="headline-t text-3xl md:text-5xl lg:text-6xl text-bone"
            >
              Four foundational systems
              <br />
              <span className="text-dust/50">govern the field.</span>
            </h2>
          </div>
        </div>
        <FourForcesPanel />
      </div>
    </section>
  );
}

/* ============================================================
   SECTION 4 — MONTE CARLO CHAMBER
   ============================================================ */
function MonteCarloSection() {
  return (
    <section
      className="relative bg-carbon py-24 md:py-32 px-4 md:px-8 hairline-t"
      aria-labelledby="monte-carlo-heading"
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-12 gap-4 mb-12 md:mb-16">
          <div className="col-span-12 md:col-span-3">
            <span className="label-t">04 / CHAMBER</span>
          </div>
          <div className="col-span-12 md:col-span-9">
            <h2
              id="monte-carlo-heading"
              className="headline-t text-3xl md:text-5xl lg:text-6xl text-bone"
            >
              THE CHAMBER OF
              <br />
              <span className="text-amber">POSSIBLE OUTCOMES</span>
            </h2>
            <p className="editorial-t text-xl md:text-2xl text-dust/70 mt-6 max-w-2xl">
              One future is a story. Ten thousand futures become a field.
            </p>
          </div>
        </div>
        <MonteCarloChamber />
        <p className="label-t mt-6 text-dust/50">{DISCLAIMER}</p>
      </div>
    </section>
  );
}

/* ============================================================
   SECTION 5 — RHYTHM ARCHITECTURE
   ============================================================ */
function RhythmSection() {
  return (
    <section
      className="relative bg-mineral py-24 md:py-32 px-4 md:px-8 hairline-t"
      aria-labelledby="rhythm-heading"
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-12 gap-4 mb-12 md:mb-16">
          <div className="col-span-12 md:col-span-3">
            <span className="label-t">05 / RHYTHM</span>
          </div>
          <div className="col-span-12 md:col-span-9">
            <h2
              id="rhythm-heading"
              className="headline-t text-3xl md:text-5xl lg:text-6xl text-bone"
            >
              REPETITION IS
              <br />
              <span className="text-amber">NOT STASIS</span>.
            </h2>
            <p className="editorial-t text-xl md:text-2xl text-dust/70 mt-6 max-w-2xl">
              A four-beat cycle returns to the same position without returning to the same moment.
            </p>
          </div>
        </div>
        <RhythmArchitecture />
      </div>
    </section>
  );
}

/* ============================================================
   SECTION 6 — ARCHIVE PREVIEW
   ============================================================ */
function ArchivePreviewSection() {
  return (
    <section
      className="relative bg-carbon py-24 md:py-32 px-4 md:px-8 hairline-t"
      aria-labelledby="archive-heading"
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-12 gap-4 mb-12 md:mb-16">
          <div className="col-span-12 md:col-span-3">
            <span className="label-t">06 / ARCHIVE</span>
          </div>
          <div className="col-span-12 md:col-span-9">
            <h2
              id="archive-heading"
              className="headline-t text-3xl md:text-5xl lg:text-6xl text-bone"
            >
              Featured experiments
            </h2>
            <p className="body-t text-base md:text-lg text-dust/70 mt-4 max-w-2xl">
              Each experiment translates a quantitative system into spatial form. Hover to reveal the live field state.
            </p>
          </div>
        </div>
        <ArchivePreview experiments={EXPERIMENTS.slice(0, 3)} />
      </div>
    </section>
  );
}

/* ============================================================
   SECTION 7 — FINAL HORIZON
   ============================================================ */
function FinalHorizonSection() {
  return (
    <section
      className="relative bg-carbon h-screen min-h-[640px] overflow-hidden"
      aria-labelledby="final-horizon-heading"
    >
      <ObservatorySceneDynamic far />

      <div className="absolute inset-0 grid grid-cols-12 grid-rows-12 px-4 md:px-8 pt-20 md:pt-24 pb-16">
        <div className="col-span-12 row-span-1">
          <span className="label-t-bright">07 / FINAL HORIZON</span>
        </div>

        <div className="col-span-12 row-span-8 row-start-3 flex flex-col justify-center items-start">
          <Reveal y={24}>
            <h2
              id="final-horizon-heading"
              className="headline-t text-4xl md:text-7xl lg:text-8xl text-bone text-shadow-deep"
            >
              THE MODEL IS
              <br />
              <span className="text-amber">NOT THE WORLD</span>.
            </h2>
          </Reveal>
          <Reveal y={20} delay={0.4}>
            <p className="editorial-t text-xl md:text-3xl text-dust/70 mt-8 max-w-xl">
              It is a temporary instrument for observing it.
            </p>
          </Reveal>
        </div>

        <div className="col-span-12 row-span-2 row-start-11 flex items-end">
          <CTA href="/models" variant="primary" cursorLabel="OPEN">
            OPEN THE MODELS
          </CTA>
        </div>
      </div>
    </section>
  );
}
