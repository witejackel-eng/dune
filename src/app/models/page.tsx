"use client";

import { useState } from "react";
import type { Metadata } from "next";
import { Reveal } from "@/components/transitions/reveal";
import { StochasticDriftModel } from "@/components/features/monte-carlo/stochastic-drift-model";
import { VolatilitySurfaceModel } from "@/components/features/volatility-surface/volatility-surface-model";
import { CovarianceBodyModel } from "@/components/features/covariance-body/covariance-body-model";
import { FourierRoomModel } from "@/components/features/fourier-room/fourier-room-model";

const MODELS = [
  { code: "01", name: "STOCHASTIC DRIFT", formula: "dS = μSdt + σSdW" },
  { code: "02", name: "VOLATILITY SURFACE", formula: "σ²(k,τ) = a + b·{ρk + √(k²+σ_sl²)}" },
  { code: "03", name: "COVARIANCE BODY", formula: "ρ_ij = C_ij / (σ_i · σ_j)" },
  { code: "04", name: "FOURIER ROOM", formula: "f(t) = Σ Aₙ · sin(2π fₙ t + φₙ)" },
];

export default function ModelsPage() {
  const [active, setActive] = useState(0);
  const model = MODELS[active];

  return (
    <div className="pt-20 md:pt-24">
      {/* Page header */}
      <section className="px-4 md:px-8 pt-12 md:pt-20 pb-10 md:pb-14 hairline-b">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-12 md:col-span-3">
              <span className="label-t-bright">MODELS / 01</span>
            </div>
            <div className="col-span-12 md:col-span-9">
              <h1 className="headline-t text-4xl md:text-6xl lg:text-7xl text-bone">
                Mathematical
                <br />
                <span className="text-amber">Fields</span>
              </h1>
              <p className="body-t text-base md:text-lg text-dust/70 mt-6 max-w-2xl">
                A modular laboratory where mathematical models become interactive spaces. Every equation is real, every parameter meaningful. Drag, tune, regenerate — and observe what the mathematics does.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Model selector */}
      <section className="px-4 md:px-8 py-6 hairline-b sticky top-14 md:top-14 bg-carbon/95 backdrop-blur-sm z-30">
        <div className="max-w-7xl mx-auto">
          <div className="flex gap-1 overflow-x-auto" role="tablist" aria-label="Mathematical models">
            {MODELS.map((m, i) => {
              const isActive = i === active;
              return (
                <button
                  key={m.code}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActive(i)}
                  className={`group flex items-center gap-3 px-4 py-3 hairline whitespace-nowrap transition-all ${
                    isActive ? "bg-mineral text-amber" : "text-dust/60 hover:text-bone hover:bg-mineral/50"
                  }`}
                  data-cursor="activate"
                  data-cursor-label={m.code}
                >
                  <span className="font-mono text-[10px] tracking-[0.18em] uppercase opacity-60">{m.code}</span>
                  <span className="font-display text-xs font-bold tracking-tight uppercase">{m.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Active model */}
      <section className="px-4 md:px-8 py-12 md:py-16">
        <div className="max-w-7xl mx-auto">
          <Reveal key={active} y={20}>
            <div className="grid grid-cols-12 gap-4 mb-8">
              <div className="col-span-12 md:col-span-6">
                <span className="label-t">MODEL {model.code}</span>
                <h2 className="headline-t text-3xl md:text-4xl text-bone mt-2">{model.name}</h2>
              </div>
              <div className="col-span-12 md:col-span-6 md:text-right">
                <span className="label-t">FORMULA</span>
                <p className="font-mono text-base md:text-lg text-amber mt-2 tracking-tight">{model.formula}</p>
              </div>
            </div>

            {active === 0 && <StochasticDriftModel />}
            {active === 1 && <VolatilitySurfaceModel />}
            {active === 2 && <CovarianceBodyModel />}
            {active === 3 && <FourierRoomModel />}
          </Reveal>
        </div>
      </section>
    </div>
  );
}
