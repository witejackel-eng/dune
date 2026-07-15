"use client";

import Link from "next/link";
import { useSystemStatus, formatSimulationTime } from "./system-status";
import { SITE, ROUTES } from "@/content/site-content";
import { Emblem } from "@/components/typography/emblem";

/** Brief §9 Section 7: Final horizon footer — field version, build year, simulation seed, local time, GitHub link, creative technology credit. */
export function SiteFooter() {
  const status = useSystemStatus();
  const localTime = new Date().toLocaleTimeString("en-GB", { hour12: false });

  return (
    <footer className="relative z-10 mt-32 bg-mineral hairline-t">
      <div className="grid grid-cols-12 gap-4 px-4 md:px-6 py-10 md:py-14">
        {/* Emblem + tagline */}
        <div className="col-span-12 md:col-span-5 flex flex-col gap-3">
          <Link href="/" className="flex items-center gap-2.5 group">
            <Emblem className="w-7 h-7 transition-transform group-hover:scale-110" />
            <span className="font-display text-base font-bold tracking-tight text-bone">
              DUST<span className="text-amber">{"//"}</span>SIGNAL
            </span>
          </Link>
          <p className="font-serif-t text-base md:text-lg text-dust/70 italic max-w-md leading-snug">
            {SITE.statement}
          </p>
          <p className="label-t max-w-md mt-1">{SITE.supporting}</p>
        </div>

        {/* Routes */}
        <nav className="col-span-6 md:col-span-3 flex flex-col gap-1.5" aria-label="Footer">
          <span className="label-t mb-1">INDEX</span>
          {ROUTES.map((r) => (
            <Link
              key={r.path}
              href={r.path}
              className="font-mono text-[11px] tracking-[0.18em] uppercase text-dust/60 hover:text-amber transition-colors"
            >
              <span className="opacity-50 mr-2">{r.code}</span>
              {r.label}
            </Link>
          ))}
        </nav>

        {/* System metadata */}
        <div className="col-span-6 md:col-span-4 flex flex-col gap-1.5">
          <span className="label-t mb-1">FIELD METADATA</span>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 font-mono text-[10px] tracking-[0.08em] text-dust/60">
            <span>FIELD v{SITE.version}</span>
            <span>BUILD {SITE.buildYear}</span>
            <span>SEED {status.seedHex}</span>
            <span>UTC {localTime}</span>
            <span>SIM {formatSimulationTime(status.simulationTime)}</span>
            <span>QUAL {status.quality.toUpperCase()}</span>
          </div>
          <div className="mt-4 flex flex-col gap-1 font-mono text-[10px] tracking-[0.15em] uppercase text-dust/40">
            <a
              href="https://github.com/witejackel-eng/dune"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-amber transition-colors"
            >
              GITHUB / witejackel-eng/dune
            </a>
            <span>Creative technology — original work</span>
          </div>
        </div>
      </div>

      {/* Bottom strip */}
      <div className="hairline-t">
        <div className="grid grid-cols-12 px-4 md:px-6 py-3 items-center">
          <span className="col-span-6 font-mono text-[10px] tracking-[0.15em] uppercase text-dust/30">
            ORIGINAL EXPERIMENTAL PROJECT — NO THIRD-PARTY IP
          </span>
          <span className="col-span-6 text-right font-mono text-[10px] tracking-[0.15em] uppercase text-dust/30">
            THE FIELD REMAINS OPEN
          </span>
        </div>
      </div>
    </footer>
  );
}
