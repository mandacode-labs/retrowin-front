import type { SelectBoxState } from "@/interactions/store";
import { useInteractionStore } from "@/interactions/store";

export function useSelectBox(): SelectBoxState {
  return useInteractionStore((s) => s.selectBox);
}

export function selectBoxRect(
  state: SelectBoxState
): { x: number; y: number; w: number; h: number } | null {
  if (state.phase !== "active" || !state.start || !state.last) return null;
  const x = Math.min(state.start.x, state.last.x);
  const y = Math.min(state.start.y, state.last.y);
  const w = Math.abs(state.last.x - state.start.x);
  const h = Math.abs(state.last.y - state.start.y);
  return { x, y, w, h };
}
