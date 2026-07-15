import type { Metadata } from "next";
import { getRouteMetadata } from "@/lib/metadata";
import { ProtocolClient } from "./protocol-client";

export const metadata: Metadata = getRouteMetadata("/protocol");

export default function ProtocolPage() {
  return <ProtocolClient />;
}
