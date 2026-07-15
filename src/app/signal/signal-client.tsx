"use client";

import { Reveal } from "@/components/transitions/reveal";
import { SignalSequencer } from "@/components/features/sequencer/signal-sequencer";

export function SignalClient() {
  return (
    <div className="pt-20 md:pt-24">
      <section className="px-4 md:px-8 pt-12 md:pt-20 pb-10 md:pb-14 hairline-b">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-12 md:col-span-3">
              <span className="label-t-bright">SIGNAL / 02</span>
            </div>
            <div className="col-span-12 md:col-span-9">
              <h1 className="headline-t text-4xl md:text-6xl lg:text-7xl text-bone">
                Audio-Visual
                <br />
                <span className="text-amber">Sequencer</span>
              </h1>
              <p className="body-t text-base md:text-lg text-dust/70 mt-6 max-w-2xl">
                A 16-step, 4-channel procedural house-music instrument. Sound is generated live by the Web Audio API — no samples, no commercial audio. Every beat affects the visual field.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 md:px-8 py-12 md:py-16">
        <div className="max-w-7xl mx-auto">
          <Reveal y={20}>
            <SignalSequencer />
          </Reveal>
        </div>
      </section>
    </div>
  );
}
