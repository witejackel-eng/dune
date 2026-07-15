import type { Metadata } from "next";
import { Suspense } from "react";
import { getRouteMetadata } from "@/lib/metadata";
import { ModelsClient } from "./models-client";

export const metadata: Metadata = getRouteMetadata("/models");

export default function ModelsPage() {
  return (
    <Suspense fallback={<div className="pt-32 text-center label-t">LOADING FIELD…</div>}>
      <ModelsClient />
    </Suspense>
  );
}
