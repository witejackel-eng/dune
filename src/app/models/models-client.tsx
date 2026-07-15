"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Reveal } from "@/components/transitions/reveal";
import { StochasticDriftModel } from "@/components/features/monte-carlo/stochastic-drift-model";
import { VolatilitySurfaceModel } from "@/components/features/volatility-surface/volatility-surface-model";
import { CovarianceBodyModel } from "@/components/features/covariance-body/covariance-body-model";
import { FourierRoomModel } from "@/components/features/fourier-room/fourier-room-model";

const MODELS = [
  { code: "01", slug: "stochastic-drift", name: "STOCHASTIC DRIFT", formula: "dS = μSdt + σSdW" },
  { code: "02", slug: "volatility-surface", name: "VOLATILITY SURFACE", formula: "σ²(k,τ) = a + b·{ρk + √(k²+σ_sl²)}" },
  { code: "03", slug: "covariance-body", name: "COVARIANCE BODY", formula: "ρ_ij = C_ij / (σ_i · σ_j)" },
  { code: "04", slug: "fourier-room", name: "FOURIER ROOM", formula: "f(t) = Σ Aₙ · sin(2π fₙ t + φₙ)" },
];

/**
 * Brief §9: Models page with proper tab a11y + URL state + keyboard navigation.
 */
export function ModelsClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Read initial state from URL ?model=slug
  const initialSlug = searchParams.get("model");
  const initialIdx = Math.max(0, MODELS.findIndex((m) => m.slug === initialSlug));
  const [active, setActive] = useState(initialIdx);

  // Sync URL when active changes
  useEffect(() => {
    const slug = MODELS[active].slug;
    const current = searchParams.get("model");
    if (current !== slug) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("model", slug);
      router.replace(`/models?${params.toString()}`, { scroll: false });
    }
  }, [active, router, searchParams]);

  const model = MODELS[active];

  const onTabKeyDown = useCallback((e: React.KeyboardEvent, idx: number) => {
    let nextIdx: number | null = null;
    if (e.key === "ArrowRight") nextIdx = (idx + 1) % MODELS.length;
    else if (e.key === "ArrowLeft") nextIdx = (idx - 1 + MODELS.length) % MODELS.length;
    else if (e.key === "Home") nextIdx = 0;
    else if (e.key === "End") nextIdx = MODELS.length - 1;
    if (nextIdx !== null) {
      e.preventDefault();
      setActive(nextIdx);
      tabRefs.current[nextIdx]?.focus();
    }
  }, []);

  return (
    <div className="pt-20 md:pt-24">
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

      {/* Model selector — accessible tablist */}
      <section className="px-4 md:px-8 py-6 hairline-b sticky top-14 bg-carbon/95 backdrop-blur-sm z-30">
        <div className="max-w-7xl mx-auto">
          <div className="flex gap-1 overflow-x-auto" role="tablist" aria-label="Mathematical models">
            {MODELS.map((m, i) => {
              const isActive = i === active;
              const tabId = `tab-${m.slug}`;
              const panelId = `panel-${m.slug}`;
              return (
                <button
                  key={m.code}
                  ref={(el) => { tabRefs.current[i] = el; }}
                  id={tabId}
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={panelId}
                  tabIndex={isActive ? 0 : -1}
                  onClick={() => setActive(i)}
                  onKeyDown={(e) => onTabKeyDown(e, i)}
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

      <section className="px-4 md:px-8 py-12 md:py-16">
        <div className="max-w-7xl mx-auto">
          <div
            id={`panel-${model.slug}`}
            role="tabpanel"
            aria-labelledby={`tab-${model.slug}`}
            tabIndex={0}
          >
            <Reveal key={active} y={20}>
              <div className="grid grid-cols-12 gap-4 mb-8">
                <div className="col-span-12 md:col-span-6">
                  <span className="label-t">MODEL {model.code}</span>
                  <h2 className="headline-t text-3xl md:text-4xl text-bone mt-2">{model.name}</h2>
                </div>
                <div className="col-span-12 md:col-span-6 md:text-right">
                  <span className="label-t">FORMULA</span>
                  <p className="font-mono text-base md:text-lg text-amber mt-2 tracking-tight break-all">{model.formula}</p>
                </div>
              </div>
              {active === 0 && <StochasticDriftModel />}
              {active === 1 && <VolatilitySurfaceModel />}
              {active === 2 && <CovarianceBodyModel />}
              {active === 3 && <FourierRoomModel />}
            </Reveal>
          </div>
        </div>
      </section>
    </div>
  );
}
