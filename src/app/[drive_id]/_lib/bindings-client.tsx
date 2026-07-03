"use client";

// The runtime is mounted by `InteractionProvider` in the drive page
// shell. Keeping this file as a thin placeholder lets `_components`
// compose it the same way as before, and it gives the page-level
// `usePointerRuntime` (a no-op now) somewhere to attach if we ever
// decide to lift the runtime to the page again.
//
// In practice every page that needs the interaction FSM imports
// `InteractionProvider` directly from `@/interact/runtime`.
import { useInteraction } from "@/interact/runtime";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function BindingsClient() {
  // Touch the context once so the dev tools snapshot hook is
  // initialised as soon as the drive page mounts. The provider is
  // already mounted by the page shell, so this is just a no-op that
  // also catches the SSR-safety invariants.
  useInteraction();
  return null;
}
