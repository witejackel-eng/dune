import type { Metadata } from "next";
import { getRouteMetadata } from "@/lib/metadata";
import { SignalClient } from "./signal-client";

export const metadata: Metadata = getRouteMetadata("/signal");

export default function SignalPage() {
  return <SignalClient />;
}
