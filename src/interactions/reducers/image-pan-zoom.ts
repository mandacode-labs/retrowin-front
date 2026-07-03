import type { AnyInput, Iid } from "@/interactions/events";

export type ImagePanZoomState =
  | { phase: "idle" }
  | {
      phase: "panning";
      target: Iid;
      startX: number;
      startY: number;
      dx: number;
      dy: number;
      pointerId: number;
    }
  | { phase: "ended" };

export const INITIAL_IMAGE_PAN_ZOOM_STATE: ImagePanZoomState = {
  phase: "idle",
};

export function imagePanZoomReducer(
  state: ImagePanZoomState,
  ev: AnyInput
): ImagePanZoomState {
  switch (ev.type) {
    case "down":
      if (state.phase !== "idle") return state;
      if (ev.input.button !== 0) return state;
      if (!ev.iid) return state;
      return {
        phase: "panning",
        target: ev.iid,
        startX: ev.input.x,
        startY: ev.input.y,
        dx: 0,
        dy: 0,
        pointerId: ev.input.pointerId,
      };
    case "move":
      if (state.phase !== "panning") return state;
      if (ev.input.pointerId !== state.pointerId) return state;
      return {
        ...state,
        dx: ev.input.x - state.startX,
        dy: ev.input.y - state.startY,
      };
    case "up":
      if (state.phase !== "panning") return state;
      return { phase: "ended" };
    case "key":
    case "contextmenu":
    case "wheel":
    case "blur":
      return state;
  }
}
