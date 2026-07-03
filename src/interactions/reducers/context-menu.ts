import type { AnyInput, Iid } from "@/interactions/events";

export type ContextMenuState =
  | { phase: "idle" }
  | {
      phase: "open";
      iid: Iid | null;
      x: number;
      y: number;
    };

export const INITIAL_CONTEXT_MENU_STATE: ContextMenuState = { phase: "idle" };

export function contextMenuReducer(
  state: ContextMenuState,
  ev: AnyInput
): ContextMenuState {
  switch (ev.type) {
    case "contextmenu":
      return {
        phase: "open",
        iid: ev.iid,
        x: ev.input.x,
        y: ev.input.y,
      };
    case "down":
    case "up":
    case "move":
    case "wheel":
    case "key":
    case "blur":
      return state;
  }
}
