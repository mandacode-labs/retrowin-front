import { useInteractionView } from "@/interact/store";

export function usePressedKeys(): ReadonlyArray<string> {
  return useInteractionView((s) => s.pressedKeys);
}
