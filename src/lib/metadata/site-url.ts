/**
 * DUST//SIGNAL — Central site URL resolver.
 * Brief §11: Resolution order:
 *   1. Explicit NEXT_PUBLIC_SITE_URL
 *   2. VERCEL_PROJECT_PRODUCTION_URL
 *   3. Safe local-development fallback
 *
 * The production domain is https://dune-aditya.vercel.app.
 */

function normalize(url: string): string {
  return url.replace(/\/+$/, "");
}

export const PRODUCTION_DOMAIN = "dune-aditya.vercel.app";

export function getSiteUrl(): string {
  if (typeof process === "undefined") {
    return `https://${PRODUCTION_DOMAIN}`;
  }
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit && /^https?:\/\//.test(explicit)) {
    return normalize(explicit);
  }
  const vercelUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercelUrl) {
    return normalize(`https://${vercelUrl}`);
  }
  // Local development fallback — preserves correct metadataBase in dev
  if (process.env.NODE_ENV === "development") {
    return "http://localhost:3000";
  }
  return `https://${PRODUCTION_DOMAIN}`;
}

export const SITE_URL = getSiteUrl();
