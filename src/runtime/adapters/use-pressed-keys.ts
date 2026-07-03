import { useMachineState } from "@/runtime/runtime";

export function usePressedKeys(): ReadonlyArray<string> {
  return useMachineState().context.pressedKeys;
}
