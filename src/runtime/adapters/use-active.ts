import type { ActiveInteraction } from "@/runtime/active";
import { useMachineState } from "@/runtime/runtime";

export function useActiveInteraction(): ActiveInteraction {
  const s = useMachineState();
  const c = s.context;
  if (c.drag.phase === "dragging" || c.drag.phase === "dropping")
    return { kind: "drag" };
  if (c.selectBox.phase === "active") return { kind: "select-box" };
  if (c.windowAffordance.phase === "active")
    return { kind: "window-affordance" };
  if (c.imagePanZoom.phase === "panning") return { kind: "image-pan-zoom" };
  if (c.contextMenu.phase === "open") return { kind: "context-menu" };
  return { kind: "idle" };
}
