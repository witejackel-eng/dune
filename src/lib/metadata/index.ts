import type { Metadata } from "next";
import { SITE_URL, PRODUCTION_DOMAIN } from "./site-url";
import { SITE } from "@/content/site-content";

/**
 * DUST//SIGNAL — Central metadata registry.
 * Brief §11: unique title + description per route, correct canonical domain.
 */

const BASE_TITLE = "DUST//SIGNAL";
const DEFAULT_DESCRIPTION =
  "An interactive computational observatory exploring mathematics, uncertainty, rhythm, and motion through WebGL, GSAP, and procedural sound.";

const KEYWORDS = [
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
];

const COMMON_OPEN_GRAPH = {
  type: "website" as const,
  url: SITE_URL,
  siteName: BASE_TITLE,
  images: [
    {
      url: "/opengraph-image",
      width: 1200,
      height: 630,
      alt: "DUST//SIGNAL — A computational observatory studying motion, uncertainty, and rhythm.",
    },
  ],
};

const COMMON_TWITTER = {
  card: "summary_large_image" as const,
  title: `${BASE_TITLE} — Probability Has a Pulse`,
  description: DEFAULT_DESCRIPTION,
  images: ["/opengraph-image"],
};

export const ROOT_METADATA: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${BASE_TITLE} — Probability Has a Pulse`,
    template: `%s — ${BASE_TITLE}`,
  },
  description: DEFAULT_DESCRIPTION,
  keywords: KEYWORDS,
  authors: [{ name: "DUST//SIGNAL Field Research" }],
  creator: BASE_TITLE,
  applicationName: BASE_TITLE,
  category: "experimental-art",
  icons: {
    icon: [{ url: "/emblem.svg", type: "image/svg+xml" }],
    apple: [{ url: "/emblem.svg" }],
  },
  manifest: "/manifest.webmanifest",
  openGraph: COMMON_OPEN_GRAPH,
  twitter: COMMON_TWITTER,
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

interface RouteMeta {
  title: string;
  description: string;
  path: string;
}

export const ROUTE_METADATA: Record<string, RouteMeta> = {
  "/": {
    title: "Probability Has a Pulse",
    description: DEFAULT_DESCRIPTION,
    path: "/",
  },
  "/models": {
    title: "Mathematical Fields",
    description:
      "Interactive mathematical models — stochastic drift, volatility surfaces, covariance bodies, and Fourier rooms.",
    path: "/models",
  },
  "/signal": {
    title: "Audio-Visual Sequencer",
    description:
      "A 16-step / 4-channel procedural house-music visual sequencer. Sound is generated live by the Web Audio API.",
    path: "/signal",
  },
  "/archive": {
    title: "Experiments",
    description:
      "Six original experiments translating quantitative systems into spatial form. Each entry has its own interactive experience.",
    path: "/archive",
  },
  "/protocol": {
    title: "Protocol",
    description:
      "The thinking behind DUST//SIGNAL — observation, uncertainty, rhythm, and translation.",
    path: "/protocol",
  },
};

export function getRouteMetadata(path: string): Metadata {
  const route = ROUTE_METADATA[path];
  if (!route) return {};
  return {
    title: route.title,
    description: route.description,
    alternates: { canonical: `${SITE_URL}${route.path}` },
    openGraph: {
      ...COMMON_OPEN_GRAPH,
      title: `${route.title} — ${BASE_TITLE}`,
      description: route.description,
      url: `${SITE_URL}${route.path}`,
    },
    twitter: {
      ...COMMON_TWITTER,
      title: `${route.title} — ${BASE_TITLE}`,
      description: route.description,
    },
  };
}

export function getExperimentMetadata(slug: string, title: string, hypothesis: string): Metadata {
  const path = `/archive/${slug}`;
  return {
    title: title,
    description: hypothesis,
    alternates: { canonical: `${SITE_URL}${path}` },
    openGraph: {
      ...COMMON_OPEN_GRAPH,
      title: `${title} — ${BASE_TITLE}`,
      description: hypothesis,
      url: `${SITE_URL}${path}`,
    },
    twitter: {
      ...COMMON_TWITTER,
      title: `${title} — ${BASE_TITLE}`,
      description: hypothesis,
    },
  };
}

export { SITE_URL, PRODUCTION_DOMAIN, SITE };
