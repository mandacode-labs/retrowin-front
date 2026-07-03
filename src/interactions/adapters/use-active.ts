import { useInteractionStore } from "@/interactions/store";

export function usePressedKeys(): ReadonlyArray<string> {
  return useInteractionStore((s) => s.pressedKeys);
}

export function useActiveInteraction() {
  return useInteractionStore((s) => s.active);
}
