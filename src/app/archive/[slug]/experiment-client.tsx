"use client";

import {
  VolatilityFieldExperiment,
  CovarianceBodyExperiment,
  FourierRoomExperiment,
  BrownianChoirExperiment,
  PhaseArchitectureExperiment,
  LiquidityHorizonExperiment,
} from "@/components/features/experiments/all-experiments";
import type { Experiment } from "@/content/site-content";

export function ExperimentClient({ experiment }: { experiment: Experiment }) {
  switch (experiment.slug) {
    case "volatility-field":
      return <VolatilityFieldExperiment experiment={experiment} />;
    case "covariance-body":
      return <CovarianceBodyExperiment experiment={experiment} />;
    case "fourier-room":
      return <FourierRoomExperiment experiment={experiment} />;
    case "brownian-choir":
      return <BrownianChoirExperiment experiment={experiment} />;
    case "phase-architecture":
      return <PhaseArchitectureExperiment experiment={experiment} />;
    case "liquidity-horizon":
      return <LiquidityHorizonExperiment experiment={experiment} />;
    default:
      return null;
  }
}
