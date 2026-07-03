import type { ContextMenuRegionState } from "@/runtime/machine";
import { useMachineState } from "@/runtime/runtime";

export function useContextMenuState(): ContextMenuRegionState {
  return useMachineState().context.contextMenu;
}
