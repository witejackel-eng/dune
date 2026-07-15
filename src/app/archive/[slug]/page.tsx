import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { EXPERIMENTS } from "@/content/site-content";
import { getExperimentMetadata } from "@/lib/metadata";
import { ExperimentClient } from "./experiment-client";

/**
 * Brief §8: /archive/[slug] routes for all 6 experiments.
 * Shareable URLs, browser back/forward navigation works.
 * Brief §11: Server page exports metadata, client component handles interaction.
 */

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return EXPERIMENTS.map((exp) => ({ slug: exp.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const experiment = EXPERIMENTS.find((e) => e.slug === slug);
  if (!experiment) return { title: "Experiment Not Found" };
  return getExperimentMetadata(experiment.slug, experiment.title, experiment.hypothesis);
}

export default async function ExperimentPage({ params }: PageProps) {
  const { slug } = await params;
  const experiment = EXPERIMENTS.find((e) => e.slug === slug);
  if (!experiment) notFound();
  return <ExperimentClient experiment={experiment} />;
}
