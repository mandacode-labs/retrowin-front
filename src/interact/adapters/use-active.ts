import type { ActiveInteraction } from "@/interact/active";
import { useInteractionView } from "@/interact/store";

export function useActiveInteraction(): ActiveInteraction {
  return useInteractionView((s) => {
    if (s.drag.phase === "dragging" || s.drag.phase === "dropping")
      return { kind: "drag" };
    if (s.selectBox.phase === "active") return { kind: "select-box" };
    if (s.windowAffordance.phase === "active")
      return { kind: "window-affordance" };
    if (s.imagePanZoom.phase === "panning") return { kind: "image-pan-zoom" };
    if (s.contextMenu.phase === "open") return { kind: "context-menu" };
    return { kind: "idle" };
  });
}
