"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { CTA } from "@/components/controls/cta";
import { useAudio } from "@/components/experience/audio/audio-provider";
import {
  FOUR_FORCES_COPY,
  EXPERIMENTS,
  DISCLAIMER,
  SITE,
} from "@/content/site-content";
import { MonteCarloChamber } from "@/components/features/monte-carlo/monte-carlo-chamber";
import { FourForcesPanel } from "@/components/features/monte-carlo/four-forces-panel";
import { RhythmArchitecture } from "@/components/features/sequencer/rhythm-architecture";
import { ArchivePreview } from "@/components/features/sequencer/archive-preview";
import { ObservatoryScene as Canvas2DFallback } from "@/components/experience/scenes/observatory-scene";
import { useHomeSceneController } from "@/components/experience/hooks/use-home-scene-controller";

const WebGLObservatoryScene = dynamic(
  () =>
    import("@/components/experience/scenes/webgl-observatory-scene").then(
      (m) => m.WebGLObservatoryScene
    ),
  { ssr: false, loading: () => null }
);

export default function HomePage() {
  const sceneState = useHomeSceneController(true);
  const [webglFailed, setWebglFailed] = useState(false);

  // Brief §15: detect WebGL failure early so we can use Canvas2D fallback
  useEffect(() => {
    try {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
      if (!gl) setWebglFailed(true);
    } catch {
      setWebglFailed(true);
    }
  }, []);

  return (
    <div data-home-root className="relative">
      {/* Brief §6: Single shared WebGL canvas scoped to the homepage */}
      {/* It is fixed-positioned and remains mounted across all home sections. */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        {webglFailed ? (
          <Canvas2DFallback />
        ) : (
          <WebGLObservatoryScene
            mode={sceneState.mode}
            seed={0x4d535f47}
            pulse={sceneState.pulse}
          />
        )}
      </div>

      {/* Hero section overlays the canvas */}
      <HeroSection introComplete={sceneState.introComplete} />

      {/* Other sections have their own backgrounds that obscure the canvas */}
      <FieldStatement />
      <FourForcesSection />
      <MonteCarloSection />
      <RhythmSection />
      <ArchivePreviewSection />

      {/* Final horizon reuses the canvas (it's visible behind this section because of transparency) */}
      <FinalHorizonSection />
    </div>
  );
}

/* ============================================================
   SECTION 1 — ENTRY FIELD (HERO)
   ============================================================ */
function HeroSection({ introComplete }: { introComplete: boolean }) {
  const audio = useAudio();

  return (
    <section
      className="relative w-full h-screen min-h-[640px] overflow-hidden"
      aria-labelledby="hero-heading"
    >
      {/* Black overlay that fades during opening timeline */}
      <div
        data-hero-overlay
        className="absolute inset-0 z-10 bg-carbon pointer-events-none"
        style={{ opacity: 1 }}
        aria-hidden="true"
      />

      {/* Hero copy overlay */}
      <div className="absolute inset-0 z-20 grid grid-cols-12 grid-rows-12 px-4 md:px-8 pt-20 md:pt-24 pb-10 pointer-events-none">
        <div className="col-span-6 row-span-1 flex items-start">
          <span data-hero-label className="label-t-bright">OBSERVATORY / 00</span>
        </div>

        <div className="col-span-6 row-span-1 flex items-start justify-end gap-4">
          <span className="label-t hidden md:inline">LAT 32.7°N · LON 116.4°W</span>
          <span className="label-t">{SITE.fieldCode}</span>
        </div>

        <div className="col-span-12 row-span-6 row-start-4 flex flex-col justify-center items-start">
          <h1
            id="hero-heading"
            className="font-display font-bold uppercase tracking-[-0.04em] leading-[0.88] text-bone text-shadow-deep text-[15vw] md:text-[10vw] lg:text-[9vw] xl:text-[8rem]"
          >
            <span data-hero-headline-1 className="block">PROBABILITY</span>
            <span data-hero-headline-2 className="block">
              HAS A <span className="text-amber">PULSE</span>.
            </span>
          </h1>
          <p data-hero-support className="mt-6 md:mt-8 max-w-md body-t text-sm md:text-base text-dust/80">
            A computational observatory studying uncertainty through mathematics, sound, and motion.
          </p>
        </div>

        <div className="col-span-12 row-span-2 row-start-10 flex flex-col md:flex-row gap-3 md:gap-4 items-start pointer-events-auto">
          <span data-hero-cta>
            <CTA href="/models" variant="primary" cursorLabel="ENTER">
              ENTER THE FIELD
            </CTA>
          </span>
          <span data-hero-cta>
            {audio.enabled ? (
              <CTA
                onClick={() => audio.toggleMute()}
                variant="outline"
                cursorLabel={audio.muted ? "UNMUTE" : "MUTE"}
              >
                {audio.muted ? "SIGNAL MUTED" : "SIGNAL READY"}
              </CTA>
            ) : (
              <CTA onClick={() => audio.enable()} variant="outline" cursorLabel="SOUND">
                ENABLE SIGNAL
              </CTA>
            )}
          </span>
        </div>

        <div className="col-span-12 row-span-1 row-start-12 flex items-end justify-center">
          <div className={`flex flex-col items-center gap-2 transition-opacity duration-500 ${introComplete ? "opacity-100" : "opacity-0"}`}>
            <span className="label-t">DESCEND / 01</span>
            <div className="w-px h-8 bg-gradient-to-b from-amber to-transparent" />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   SECTION 2 — THE FIELD STATEMENT (full-bleed, partially intersects field)
   ============================================================ */
function FieldStatement() {
  return (
    <section
      className="relative bg-carbon/95 py-32 md:py-48 px-4 md:px-8 overflow-hidden"
      aria-labelledby="field-statement-heading"
    >
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-12 md:col-span-2">
            <span className="label-t" data-section-reveal>02 / FIELD STATEMENT</span>
          </div>
          <div className="col-span-12 md:col-span-10">
            <div className="space-y-6 md:space-y-8">
              {FOUR_FORCES_COPY.slice(0, 4).map((line) => (
                <p
                  key={line}
                  data-field-line
                  className="font-display text-3xl md:text-5xl lg:text-6xl font-light tracking-tight text-dust/70"
                >
                  {line}
                </p>
              ))}
              <p
                data-field-line
                className="font-display text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-bone mt-12"
              >
                {FOUR_FORCES_COPY[4]}
              </p>
              <div className="mt-16 max-w-2xl" data-field-line>
                <p className="editorial-t text-2xl md:text-3xl text-amber leading-snug">
                  DUST<span className="text-bone">{"//"}</span>SIGNAL studies the structures hidden inside movement.
                </p>
              </div>
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
        <div className="grid grid-cols-12 gap-4 mb-12 md:mb-16" data-section-reveal>
          <div className="col-span-12 md:col-span-3">
            <span className="label-t">03 / FOUR FORCES</span>
          </div>
          <div className="col-span-12 md:col-span-9">
            <h2 id="four-forces-heading" className="headline-t text-3xl md:text-5xl lg:text-6xl text-bone">
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
        <div className="grid grid-cols-12 gap-4 mb-12 md:mb-16" data-section-reveal>
          <div className="col-span-12 md:col-span-3">
            <span className="label-t">04 / CHAMBER</span>
          </div>
          <div className="col-span-12 md:col-span-9">
            <h2 id="monte-carlo-heading" className="headline-t text-3xl md:text-5xl lg:text-6xl text-bone">
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
        <div className="grid grid-cols-12 gap-4 mb-12 md:mb-16" data-section-reveal>
          <div className="col-span-12 md:col-span-3">
            <span className="label-t">05 / RHYTHM</span>
          </div>
          <div className="col-span-12 md:col-span-9">
            <h2 id="rhythm-heading" className="headline-t text-3xl md:text-5xl lg:text-6xl text-bone">
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
   SECTION 6 — ARCHIVE PREVIEW (with VIEW ALL SIX CTA)
   ============================================================ */
function ArchivePreviewSection() {
  return (
    <section
      className="relative bg-carbon py-24 md:py-32 px-4 md:px-8 hairline-t"
      aria-labelledby="archive-heading"
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-12 gap-4 mb-12 md:mb-16" data-section-reveal>
          <div className="col-span-12 md:col-span-3">
            <span className="label-t">06 / ARCHIVE</span>
          </div>
          <div className="col-span-12 md:col-span-9">
            <h2 id="archive-heading" className="headline-t text-3xl md:text-5xl lg:text-6xl text-bone">
              Featured experiments
            </h2>
            <p className="body-t text-base md:text-lg text-dust/70 mt-4 max-w-2xl">
              Each experiment translates a quantitative system into spatial form. Hover to reveal the live field state.
            </p>
          </div>
        </div>
        <ArchivePreview experiments={EXPERIMENTS.slice(0, 3)} />
        {/* Brief §7: clear CTA beneath the three previews */}
        <div className="mt-10 flex justify-center" data-section-reveal>
          <CTA href="/archive" variant="outline" cursorLabel="ALL">
            VIEW ALL SIX EXPERIMENTS
          </CTA>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   SECTION 7 — FINAL HORIZON (reuses the shared WebGL canvas)
   ============================================================ */
function FinalHorizonSection() {
  return (
    <section
      className="relative h-screen min-h-[640px] overflow-hidden"
      aria-labelledby="final-horizon-heading"
    >
      {/* Slight vignette to blend with the canvas */}
      <div className="absolute inset-0 z-10 bg-gradient-to-b from-carbon via-transparent to-carbon/80 pointer-events-none" />

      <div className="absolute inset-0 z-20 grid grid-cols-12 grid-rows-12 px-4 md:px-8 pt-20 md:pt-24 pb-16">
        <div className="col-span-12 row-span-1">
          <span className="label-t-bright">07 / FINAL HORIZON</span>
        </div>

        <div className="col-span-12 row-span-8 row-start-3 flex flex-col justify-center items-start">
          <h2
            id="final-horizon-heading"
            className="headline-t text-4xl md:text-7xl lg:text-8xl text-bone text-shadow-deep"
          >
            THE MODEL IS
            <br />
            <span className="text-amber">NOT THE WORLD</span>.
          </h2>
          <p className="editorial-t text-xl md:text-3xl text-dust/70 mt-8 max-w-xl">
            It is a temporary instrument for observing it.
          </p>
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
