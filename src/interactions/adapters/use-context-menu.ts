import type { ContextMenuState } from "@/interactions/store";
import { useInteractionStore } from "@/interactions/store";

export function useContextMenuState(): ContextMenuState {
  return useInteractionStore((s) => s.contextMenu);
}
