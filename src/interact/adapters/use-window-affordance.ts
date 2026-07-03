import type { WindowAffordanceRegionState } from "@/interact/reducer";
import { useInteractionView } from "@/interact/store";

export function useWindowAffordance(): WindowAffordanceRegionState {
  return useInteractionView((s) => s.windowAffordance);
}
