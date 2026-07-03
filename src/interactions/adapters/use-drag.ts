import type { DragPhase, DragState } from "@/interactions/store";
import { useInteractionStore } from "@/interactions/store";

export function useDrag(): {
  phase: DragPhase;
  fromIid: string | null;
  hoverIid: string | null;
  start: DragState["start"];
  last: DragState["last"];
  target: string | null;
} {
  return useInteractionStore((s) => s.drag);
}
