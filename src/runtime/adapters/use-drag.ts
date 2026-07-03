import type { DragRegionState } from "@/runtime/machine";
import { useMachineState } from "@/runtime/runtime";

export type DragView = Pick<
  DragRegionState,
  "phase" | "fromIid" | "hoverIid" | "start" | "last" | "target" | "cancelled"
>;

export function useDrag(): DragView {
  const s = useMachineState();
  return {
    phase: s.context.drag.phase,
    fromIid: s.context.drag.fromIid,
    hoverIid: s.context.drag.hoverIid,
    start: s.context.drag.start,
    last: s.context.drag.last,
    target: s.context.drag.target,
    cancelled: s.context.drag.cancelled,
  };
}

export function useIsDragging(): boolean {
  const s = useMachineState();
  return s.context.drag.phase === "dragging";
}
