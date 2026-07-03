import type { SelectBoxRegionState } from "@/interact/reducer";
import { useInteractionView } from "@/interact/store";

export function useSelectBox(): SelectBoxRegionState {
  return useInteractionView((s) => s.selectBox);
}

export function selectBoxRect(
  state: SelectBoxRegionState
): { x: number; y: number; w: number; h: number } | null {
  if (state.phase !== "active" || !state.start || !state.last) return null;
  const x = Math.min(state.start.x, state.last.x);
  const y = Math.min(state.start.y, state.last.y);
  const w = Math.abs(state.last.x - state.start.x);
  const h = Math.abs(state.last.y - state.start.y);
  return { x, y, w, h };
}
