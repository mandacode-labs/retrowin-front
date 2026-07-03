import type { AnyInput, Iid } from "@/interactions/events";

export type AffordanceKind = "move" | "resize";

export type WindowAffordanceState =
  | { phase: "idle" }
  | {
      phase: "active";
      kind: AffordanceKind;
      target: Iid;
      cursor: string;
      startX: number;
      startY: number;
      pointerId: number;
    }
  | { phase: "ended" };

export const INITIAL_WINDOW_AFFORDANCE_STATE: WindowAffordanceState = {
  phase: "idle",
};

export function windowAffordanceReducer(
  state: WindowAffordanceState,
  ev: AnyInput
): WindowAffordanceState {
  switch (ev.type) {
    case "move":
      if (state.phase !== "active") return state;
      if (ev.input.pointerId !== state.pointerId) return state;
      return state;
    case "up":
      if (state.phase !== "active") return state;
      return { phase: "ended" };
    case "key":
    case "down":
    case "contextmenu":
    case "wheel":
    case "blur":
      return state;
  }
}

export function delta(state: WindowAffordanceState, x: number, y: number) {
  if (state.phase !== "active") return { dx: 0, dy: 0 };
  return { dx: x - state.startX, dy: y - state.startY };
}
