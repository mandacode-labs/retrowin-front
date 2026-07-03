import type { WindowAffordanceState } from "@/interactions/store";
import { useInteractionStore } from "@/interactions/store";

export function useWindowAffordance(): WindowAffordanceState {
  return useInteractionStore((s) => s.windowAffordance);
}
