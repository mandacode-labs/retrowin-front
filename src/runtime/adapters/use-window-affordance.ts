import type { WindowAffordanceRegionState } from "@/runtime/machine";
import { useMachineState } from "@/runtime/runtime";

export function useWindowAffordance(): WindowAffordanceRegionState {
  return useMachineState().context.windowAffordance;
}
