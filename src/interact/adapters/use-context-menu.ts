import type { ContextMenuRegionState } from "@/interact/reducer";
import { useInteractionView } from "@/interact/store";

export function useContextMenuState(): ContextMenuRegionState {
  return useInteractionView((s) => s.contextMenu);
}
