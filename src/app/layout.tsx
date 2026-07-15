import type { Metadata, Viewport } from "next";
import { Space_Grotesk, IBM_Plex_Mono, Instrument_Serif } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/layout/toaster";
import { SystemStatusProvider } from "@/components/layout/system-status";
import { LoadingSequence } from "@/components/transitions/loading-sequence";
import { CustomCursor } from "@/components/layout/custom-cursor";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { AudioProvider } from "@/components/experience/audio/audio-provider";
import { GrainOverlay } from "@/components/layout/grain-overlay";
import { ROOT_METADATA } from "@/lib/metadata";
import { SITE_URL } from "@/lib/metadata/site-url";

const display = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const mono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

const serif = Instrument_Serif({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = ROOT_METADATA;

export const viewport: Viewport = {
  themeColor: "#080806",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "CreativeWork",
  name: "DUST//SIGNAL",
  description:
    "An interactive computational observatory exploring mathematics, uncertainty, rhythm, and motion through WebGL, GSAP, and procedural sound.",
  url: SITE_URL,
  creator: { "@type": "Organization", name: "DUST//SIGNAL" },
  genre: "experimental-web",
  keywords: "probability, stochastic processes, generative art, procedural audio",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body
        className={`${display.variable} ${mono.variable} ${serif.variable} antialiased`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[300] focus:bg-amber focus:text-carbon focus:px-3 focus:py-2 focus:font-mono focus:text-[10px] focus:tracking-[0.15em] focus:uppercase"
        >
          Skip to content
        </a>
        <AudioProvider>
          <SystemStatusProvider>
            <LoadingSequence />
            <CustomCursor />
            <GrainOverlay />
            <SiteHeader />
            <main id="main-content" className="relative">
              {children}
            </main>
            <SiteFooter />
          </SystemStatusProvider>
        </AudioProvider>
        <Toaster />
      </body>
    </html>
  );
}
