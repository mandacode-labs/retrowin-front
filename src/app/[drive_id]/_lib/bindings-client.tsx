"use client";

import { usePointerRuntime } from "@/runtime";

// Mounts the single document-level listener + rAF loop that drives
// the XState pointer runtime. Used once per drive workspace at the
// page shell. The hook is mount-counted so it is safe to invoke from
// multiple components.
export function BindingsClient() {
  usePointerRuntime();
  return null;
}
