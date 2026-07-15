"use client";

import { Reveal } from "@/components/transitions/reveal";
import { CTA } from "@/components/controls/cta";
import { PROTOCOL_SECTIONS, PROTOCOL_PRINCIPLES } from "@/content/site-content";

export default function ProtocolPage() {
  return (
    <div className="pt-20 md:pt-24">
      {/* Header */}
      <section className="px-4 md:px-8 pt-12 md:pt-20 pb-10 md:pb-14 hairline-b">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-12 md:col-span-3">
              <span className="label-t-bright">PROTOCOL / 04</span>
            </div>
            <div className="col-span-12 md:col-span-9">
              <h1 className="headline-t text-4xl md:text-6xl lg:text-7xl text-bone">
                Philosophy
                <br />
                <span className="text-amber">and Method</span>
              </h1>
              <p className="editorial-t text-2xl md:text-3xl text-dust/80 mt-8 max-w-2xl">
                We use mathematics as material.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Sections */}
      <section className="px-4 md:px-8 py-16 md:py-24">
        <div className="max-w-5xl mx-auto space-y-20 md:space-y-32">
          {PROTOCOL_SECTIONS.map((section) => (
            <Reveal key={section.id} y={24}>
              <article className="grid grid-cols-12 gap-4">
                <div className="col-span-12 md:col-span-3">
                  <span className="label-t-bright">{section.label}</span>
                </div>
                <div className="col-span-12 md:col-span-9">
                  <h2 className="font-display text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight text-bone">
                    {section.heading}
                  </h2>
                  <p className="editorial-t text-xl md:text-2xl text-dust/80 mt-6 leading-snug max-w-2xl">
                    {section.body}
                  </p>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Principles */}
      <section className="px-4 md:px-8 py-16 md:py-24 hairline-t hairline-b bg-mineral/30">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-12 gap-4 mb-10 md:mb-14">
            <div className="col-span-12 md:col-span-3">
              <span className="label-t-bright">05 / PRINCIPLES</span>
            </div>
            <div className="col-span-12 md:col-span-9">
              <h2 className="headline-t text-3xl md:text-5xl text-bone">Nine rules of the field.</h2>
            </div>
          </div>
          <ol className="grid grid-cols-1 md:grid-cols-3 gap-px bg-dust/10">
            {PROTOCOL_PRINCIPLES.map((p, i) => (
              <Reveal key={p} y={16} delay={i * 0.04}>
                <li className="bg-mineral p-6 md:p-8 aspect-square flex flex-col justify-between">
                  <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-amber">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <p className="font-display text-lg md:text-xl font-medium tracking-tight text-bone leading-tight">
                    {p}
                  </p>
                </li>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* Closing */}
      <section className="px-4 md:px-8 py-24 md:py-32">
        <div className="max-w-5xl mx-auto text-center">
          <Reveal y={24}>
            <p className="font-display text-4xl md:text-7xl lg:text-8xl font-bold tracking-tight text-bone">
              THE FIELD
              <br />
              <span className="text-amber">REMAINS OPEN</span>.
            </p>
          </Reveal>
          <Reveal y={20} delay={0.4}>
            <div className="mt-12">
              <CTA href="/" variant="primary" cursorLabel="RETURN">
                RETURN TO THE OBSERVATORY
              </CTA>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
