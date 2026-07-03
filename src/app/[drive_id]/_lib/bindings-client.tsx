"use client";

import { useGlobalInteractions } from "@/interactions";

// Mounts the single document-level listener that feeds every
// interaction reducer. Used once per drive workspace at the page shell.
export function BindingsClient() {
  useGlobalInteractions();
  return null;
}
