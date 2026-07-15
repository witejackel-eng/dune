import type { Metadata, Viewport } from "next";
import { Space_Grotesk, IBM_Plex_Mono, Instrument_Serif } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { SystemStatusProvider } from "@/components/layout/system-status";
import { LoadingSequence } from "@/components/transitions/loading-sequence";
import { CustomCursor } from "@/components/layout/custom-cursor";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { AudioProvider } from "@/components/experience/audio/audio-provider";
import { GrainOverlay } from "@/components/layout/grain-overlay";

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

const SITE_URL = "https://dust-signal.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "DUST//SIGNAL — Probability Has a Pulse",
    template: "%s — DUST//SIGNAL",
  },
  description:
    "An interactive computational observatory exploring mathematics, uncertainty, rhythm, and motion through WebGL, GSAP, and procedural sound.",
  keywords: [
    "DUST//SIGNAL",
    "computational observatory",
    "probability",
    "stochastic processes",
    "WebGL",
    "Three.js",
    "GSAP",
    "generative art",
    "procedural audio",
    "Monte Carlo",
    "geometric Brownian motion",
    "Fourier synthesis",
  ],
  authors: [{ name: "DUST//SIGNAL Field Research" }],
  creator: "DUST//SIGNAL",
  applicationName: "DUST//SIGNAL",
  category: "experimental-art",
  icons: {
    icon: [
      { url: "/emblem.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/emblem.svg" }],
  },
  manifest: "/manifest.webmanifest",
  openGraph: {
    title: "DUST//SIGNAL — Probability Has a Pulse",
    description:
      "An interactive computational observatory exploring mathematics, uncertainty, rhythm, and motion through WebGL, GSAP, and procedural sound.",
    url: SITE_URL,
    siteName: "DUST//SIGNAL",
    type: "website",
    images: [
      {
        url: "/social-preview.svg",
        width: 1200,
        height: 630,
        alt: "DUST//SIGNAL — A computational observatory studying motion, uncertainty, and rhythm.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "DUST//SIGNAL — Probability Has a Pulse",
    description:
      "An interactive computational observatory exploring mathematics, uncertainty, rhythm, and motion.",
    images: ["/social-preview.svg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: SITE_URL,
  },
};

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
