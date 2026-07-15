"use client";

import { useState } from "react";
import { Reveal } from "@/components/transitions/reveal";
import { EXPERIMENTS, type Experiment } from "@/content/site-content";
import { ExperimentModal } from "@/components/features/sequencer/experiment-modal";
import { ExperimentMiniViz } from "@/components/features/sequencer/experiment-mini-viz";

export default function ArchivePage() {
  const [active, setActive] = useState<Experiment | null>(null);

  return (
    <div className="pt-20 md:pt-24">
      <section className="px-4 md:px-8 pt-12 md:pt-20 pb-10 md:pb-14 hairline-b">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-12 md:col-span-3">
              <span className="label-t-bright">ARCHIVE / 03</span>
            </div>
            <div className="col-span-12 md:col-span-9">
              <h1 className="headline-t text-4xl md:text-6xl lg:text-7xl text-bone">
                Experiments
              </h1>
              <p className="body-t text-base md:text-lg text-dust/70 mt-6 max-w-2xl">
                Six original experiments translating quantitative systems into spatial form. Each entry is a hypothesis, a mathematical basis, and a visual system. Open any entry to interact with the full artwork.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 md:px-8 py-12 md:py-16">
        <div className="max-w-7xl mx-auto">
          <div className="space-y-0">
            {EXPERIMENTS.map((exp, i) => (
              <Reveal key={exp.slug} y={20} delay={i * 0.06}>
                <button
                  onClick={() => setActive(exp)}
                  className="group w-full grid grid-cols-12 gap-4 py-6 md:py-8 px-2 md:px-4 hairline-b text-left transition-colors hover:bg-mineral/40"
                  data-cursor="enter"
                  data-cursor-label={`EXP ${exp.number}`}
                  aria-label={`Open experiment ${exp.number}: ${exp.title}`}
                >
                  {/* Number */}
                  <div className="col-span-2 md:col-span-1">
                    <span className="font-mono text-sm md:text-base text-amber tracking-[0.15em]">
                      {exp.number}
                    </span>
                  </div>

                  {/* Mini viz */}
                  <div className="col-span-10 md:col-span-3">
                    <div className="relative aspect-[16/9] bg-mineral hairline overflow-hidden">
                      <ExperimentMiniViz slug={exp.slug} seed={exp.seed} />
                    </div>
                  </div>

                  {/* Title + hypothesis */}
                  <div className="col-span-12 md:col-span-5">
                    <h2 className="font-display text-xl md:text-2xl font-bold tracking-tight text-bone group-hover:text-amber transition-colors">
                      {exp.title}
                    </h2>
                    <p className="body-t text-sm text-dust/70 mt-2">{exp.hypothesis}</p>
                  </div>

                  {/* Meta */}
                  <div className="col-span-12 md:col-span-3 flex flex-col gap-1 md:items-end">
                    <span className="font-mono text-[10px] tracking-[0.15em] uppercase text-dust/40">
                      {exp.year} · {exp.status.toUpperCase()}
                    </span>
                    <span className="font-mono text-[10px] tracking-[0.08em] text-amber">
                      {exp.formula}
                    </span>
                    <span className="font-mono text-[9px] tracking-[0.15em] uppercase text-dust/40">
                      SEED 0x{exp.seed.toString(16).toUpperCase().padStart(8, "0")}
                    </span>
                  </div>
                </button>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <ExperimentModal experiment={active} onClose={() => setActive(null)} />
    </div>
  );
}
