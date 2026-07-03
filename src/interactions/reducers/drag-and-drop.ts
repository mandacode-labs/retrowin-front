import type { AnyInput, Iid, PointerInput } from "@/interactions/events";

export type DragAndDropState =
  | { phase: "idle" }
  | {
      phase: "pending";
      from: Iid;
      startX: number;
      startY: number;
      pointerId: number;
    }
  | {
      phase: "dragging";
      from: Iid;
      hover: Iid | null;
      startX: number;
      startY: number;
      dx: number;
      dy: number;
      pointerId: number;
    }
  | { phase: "ended"; reason: "completed" | "cancelled" };

export const INITIAL_DRAG_STATE: DragAndDropState = { phase: "idle" };

const DRAG_THRESHOLD = 4;

export function dragAndDropReducer(
  state: DragAndDropState,
  ev: AnyInput
): DragAndDropState {
  switch (ev.type) {
    case "down": {
      if (state.phase !== "idle") return state;
      if (ev.input.button !== 0) return state;
      if (!ev.iid) return state;
      return {
        phase: "pending",
        from: ev.iid,
        startX: ev.input.x,
        startY: ev.input.y,
        pointerId: ev.input.pointerId,
      };
    }
    case "move": {
      if (state.phase === "pending") {
        if (ev.input.pointerId !== state.pointerId) return state;
        const startX = state.startX;
        const startY = state.startY;
        const from = state.from;
        const pointerId = state.pointerId;
        const dx = ev.input.x - startX;
        const dy = ev.input.y - startY;
        if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return state;
        return {
          phase: "dragging",
          from,
          hover: null,
          startX,
          startY,
          dx,
          dy,
          pointerId,
        };
      }
      if (state.phase === "dragging") {
        if (ev.input.pointerId !== state.pointerId) return state;
        return {
          phase: "dragging",
          from: state.from,
          hover: null,
          startX: state.startX,
          startY: state.startY,
          dx: ev.input.x - state.startX,
          dy: ev.input.y - state.startY,
          pointerId: state.pointerId,
        };
      }
      return state;
    }
    case "up": {
      if (state.phase === "dragging") {
        if (ev.input.pointerId !== state.pointerId) return state;
        return { phase: "ended", reason: "completed" };
      }
      if (state.phase === "pending") {
        if (ev.input.pointerId !== state.pointerId) return state;
        return { phase: "ended", reason: "cancelled" };
      }
      return state;
    }
    case "key": {
      if (ev.input.key === "Escape" && state.phase !== "idle") {
        return { phase: "ended", reason: "cancelled" };
      }
      return state;
    }
    case "blur": {
      if (state.phase !== "idle")
        return { phase: "ended", reason: "cancelled" };
      return state;
    }
    case "contextmenu":
    case "wheel":
      return state;
  }
}

export type DragResult =
  | { kind: "none" }
  | { kind: "drop"; from: Iid; target: Iid | null }
  | { kind: "drag-internal" };

export function dragResultForHover(
  state: DragAndDropState,
  hover: Iid | null
): DragResult {
  if (state.phase !== "dragging") return { kind: "none" };
  if (hover === state.from) return { kind: "drag-internal" };
  return { kind: "drop", from: state.from, target: hover };
}

export function dragSamePath(prev: PointerInput | null, next: PointerInput) {
  if (!prev) return false;
  return prev.x === next.x && prev.y === next.y;
}
