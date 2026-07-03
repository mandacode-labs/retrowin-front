import type { AnyInput, Iid } from "@/interactions/events";

export type SelectBoxState =
  | { phase: "idle" }
  | {
      phase: "active";
      scope: Iid;
      startX: number;
      startY: number;
      curX: number;
      curY: number;
    }
  | { phase: "ended" };

export const INITIAL_SELECT_BOX_STATE: SelectBoxState = { phase: "idle" };

export function selectBoxReducer(
  state: SelectBoxState,
  ev: AnyInput
): SelectBoxState {
  switch (ev.type) {
    case "down":
      if (state.phase !== "idle") return state;
      if (ev.input.button !== 0) return state;
      if (!ev.iid) return state;
      return {
        phase: "active",
        scope: ev.iid,
        startX: ev.input.x,
        startY: ev.input.y,
        curX: ev.input.x,
        curY: ev.input.y,
      };
    case "move":
      if (state.phase !== "active") return state;
      return {
        ...state,
        curX: ev.input.x,
        curY: ev.input.y,
      };
    case "up":
      if (state.phase !== "active") return state;
      return { phase: "ended" };
    case "key":
    case "contextmenu":
    case "wheel":
    case "blur":
      return state;
  }
}

export type SelectBoxRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export function selectBoxRect(state: SelectBoxState): SelectBoxRect | null {
  if (state.phase !== "active") return null;
  const left = Math.min(state.startX, state.curX);
  const top = Math.min(state.startY, state.curY);
  const width = Math.abs(state.curX - state.startX);
  const height = Math.abs(state.curY - state.startY);
  return { left, top, width, height };
}
