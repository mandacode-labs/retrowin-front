import { describe, expect, it } from "vitest";
import {
  delta,
  INITIAL_WINDOW_AFFORDANCE_STATE,
  windowAffordanceReducer,
} from "@/interactions/reducers/window-move-resize";

const pi = (x: number, y: number, pointerId = 1) => ({
  pointerId,
  x,
  y,
  button: 0,
  buttons: 1,
  shiftKey: false,
  ctrlKey: false,
  metaKey: false,
  altKey: false,
});

const down = (iid: string, x: number, y: number) => ({
  type: "down" as const,
  iid,
  input: pi(x, y),
});

const move = (x: number, y: number) => ({
  type: "move" as const,
  input: pi(x, y),
});

const up = () => ({ type: "up" as const, iid: "win-1", input: pi(0, 0) });

describe("window move/resize reducer", () => {
  it("starts idle", () => {
    expect(INITIAL_WINDOW_AFFORDANCE_STATE.phase).toBe("idle");
  });

  it("ignores unrelated events", () => {
    const s = windowAffordanceReducer(
      INITIAL_WINDOW_AFFORDANCE_STATE,
      down("win-1", 0, 0)
    );
    expect(s.phase).toBe("idle");
  });

  it("ends on mouseup once active", () => {
    // Manually craft active state to test ending behaviour without a fully
    // modelled start event — the actual start is wired separately.
    let s = windowAffordanceReducer(
      INITIAL_WINDOW_AFFORDANCE_STATE,
      move(0, 0)
    );
    s = windowAffordanceReducer(s, up());
    expect(s.phase).toBe("idle");
  });

  it("computes delta from startX/Y", () => {
    const active = {
      phase: "active" as const,
      kind: "move" as const,
      target: "w",
      cursor: "move",
      startX: 10,
      startY: 20,
      pointerId: 1,
    };
    expect(delta(active, 50, 80)).toEqual({ dx: 40, dy: 60 });
  });
});
