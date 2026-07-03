import type { DragRegionState } from "@/interact/reducer";
import { useInteractionView } from "@/interact/store";

export type DragView = Pick<
  DragRegionState,
  "phase" | "fromIid" | "hoverIid" | "start" | "last" | "target" | "cancelled"
>;

export function useDrag(): DragView {
  return useInteractionView((s) => ({
    phase: s.drag.phase,
    fromIid: s.drag.fromIid,
    hoverIid: s.drag.hoverIid,
    start: s.drag.start,
    last: s.drag.last,
    target: s.drag.target,
    cancelled: s.drag.cancelled,
  }));
}

export function useIsDragging(): boolean {
  return useInteractionView((s) => s.drag.phase === "dragging");
}
