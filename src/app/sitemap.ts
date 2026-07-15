import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/metadata/site-url";
import { EXPERIMENTS } from "@/content/site-content";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const staticRoutes = [
    { path: "/", priority: 1, changeFrequency: "monthly" as const },
    { path: "/models", priority: 0.9, changeFrequency: "monthly" as const },
    { path: "/signal", priority: 0.9, changeFrequency: "monthly" as const },
    { path: "/archive", priority: 0.9, changeFrequency: "monthly" as const },
    { path: "/protocol", priority: 0.8, changeFrequency: "monthly" as const },
  ];

  const staticEntries: MetadataRoute.Sitemap = staticRoutes.map((r) => ({
    url: `${SITE_URL}${r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));

  const experimentEntries: MetadataRoute.Sitemap = EXPERIMENTS.map((exp) => ({
    url: `${SITE_URL}/archive/${exp.slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [...staticEntries, ...experimentEntries];
}
