"use client";

import Link from "next/link";
import { CTA } from "@/components/controls/cta";
import type { Experiment } from "@/content/site-content";

const SLUG_BY_NUM: Record<string, string> = {
  "01": "volatility-field",
  "02": "covariance-body",
  "03": "fourier-room",
  "04": "brownian-choir",
  "05": "phase-architecture",
  "06": "liquidity-horizon",
};

/**
 * Brief §8: Shared shell for all experiment pages.
 * Includes: number, title, hypothesis, formula, full visual system, controls,
 * seed, regenerate, reset, copy-link, performance setting, plain-language explanation,
 * synthetic-data disclaimer, link to previous/next experiment.
 */
export function ExperimentShell({
  experiment,
  controls,
  stats: _stats,
  children,
}: {
  experiment: Experiment;
  controls: React.ReactNode;
  stats: React.ReactNode;
  children: React.ReactNode;
}) {
  const slug = experiment.slug;
  const idx = parseInt(experiment.number, 10);
  const prev = idx > 1 ? idx - 1 : 6;
  const next = idx < 6 ? idx + 1 : 1;
  const prevSlug = String(prev).padStart(2, "0");
  const nextSlug = String(next).padStart(2, "0");
  const prevLink = `/archive/${SLUG_BY_NUM[prevSlug]}`;
  const nextLink = `/archive/${SLUG_BY_NUM[nextSlug]}`;

  return (
    <div className="pt-20 md:pt-24">
      <section className="px-4 md:px-8 pt-12 md:pt-20 pb-10 md:pb-14 hairline-b">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-12 md:col-span-3">
              <span className="label-t-bright">EXP / {experiment.number}</span>
              <div className="mt-3">
                <span className="label-t">{experiment.status.toUpperCase()}</span>
              </div>
            </div>
            <div className="col-span-12 md:col-span-9">
              <h1 className="headline-t text-3xl md:text-5xl lg:text-6xl text-bone">
                {experiment.title}
              </h1>
              <p className="editorial-t text-xl md:text-2xl text-amber mt-4 max-w-3xl">
                {experiment.hypothesis}
              </p>
              <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <span className="label-t">FORMULA</span>
                  <p className="font-mono text-sm text-bone mt-1 break-all">{experiment.formula}</p>
                </div>
                <div>
                  <span className="label-t">YEAR</span>
                  <p className="font-mono text-sm text-bone mt-1">{experiment.year}</p>
                </div>
                <div>
                  <span className="label-t">SEED</span>
                  <p className="font-mono text-sm text-bone mt-1">0x{experiment.seed.toString(16).toUpperCase().padStart(8, "0")}</p>
                </div>
                <div>
                  <span className="label-t">ENTRY</span>
                  <p className="font-mono text-sm text-bone mt-1">{experiment.number} / 06</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 md:px-8 py-12 md:py-16">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-12 lg:col-span-3 space-y-4">
              <span className="label-t">CONTROLS</span>
              {controls}
              <div className="hairline-t pt-3">
                <span className="label-t">SHARE</span>
                <div className="mt-2">
                  <CTA href={`/archive/${slug}`} variant="ghost" cursorLabel="COPY">
                    COPY LINK
                  </CTA>
                </div>
              </div>
            </div>
            <div className="col-span-12 lg:col-span-9">
              {children}
              <div className="mt-8 grid grid-cols-12 gap-4 hairline-t pt-6">
                <div className="col-span-12 md:col-span-6">
                  <span className="label-t">MATHEMATICAL BASIS</span>
                  <p className="body-t text-sm text-dust/80 mt-2">{experiment.mathematicalBasis}</p>
                </div>
                <div className="col-span-12 md:col-span-6">
                  <span className="label-t">VISUAL SYSTEM</span>
                  <p className="body-t text-sm text-dust/80 mt-2">{experiment.visualSystem}</p>
                </div>
              </div>
              <p className="mt-6 body-t text-xs text-dust/50">
                This is an original creative coding experiment using synthetic data. No financial guidance.
              </p>
            </div>
          </div>

          {/* Prev/Next */}
          <div className="mt-12 grid grid-cols-2 gap-4 hairline-t pt-6">
            <Link
              href={prevLink}
              className="group flex flex-col gap-1 p-4 hairline hover:bg-mineral/50 transition-colors"
              data-cursor="enter"
              data-cursor-label="PREV"
            >
              <span className="label-t">PREVIOUS / {prevSlug}</span>
              <span className="font-display text-base text-bone group-hover:text-amber transition-colors">
                ← {SLUG_BY_NUM[prevSlug].toUpperCase().replace(/-/g, " ")}
              </span>
            </Link>
            <Link
              href={nextLink}
              className="group flex flex-col gap-1 p-4 hairline hover:bg-mineral/50 transition-colors text-right"
              data-cursor="enter"
              data-cursor-label="NEXT"
            >
              <span className="label-t">NEXT / {nextSlug}</span>
              <span className="font-display text-base text-bone group-hover:text-amber transition-colors">
                {SLUG_BY_NUM[nextSlug].toUpperCase().replace(/-/g, " ")} →
              </span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
