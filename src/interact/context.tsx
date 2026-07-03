"use client";

import { createContext, type ReactNode, useContext } from "react";
import type { InteractionRuntime } from "@/interact/store";

/**
 * The interaction runtime is exposed via React context so consumers
 * can subscribe to the store without depending on `runtime.tsx`
 * directly. The `InteractionProvider` lives in `runtime.tsx`.
 */
const InteractionContext = createContext<InteractionRuntime | null>(null);

export function InteractionContextProvider({
  runtime,
  children,
}: {
  runtime: InteractionRuntime;
  children: ReactNode;
}) {
  return (
    <InteractionContext.Provider value={runtime}>
      {children}
    </InteractionContext.Provider>
  );
}

export function useInteractionContext(): InteractionRuntime {
  const ctx = useContext(InteractionContext);
  if (!ctx) {
    throw new Error(
      "useInteractionContext must be used inside <InteractionProvider>"
    );
  }
  return ctx;
}
