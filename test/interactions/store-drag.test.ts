import { describe, expect, it } from "vitest";
import {
  type InteractionRootState,
  initialState,
  transition,
} from "@/interactions/store";

const POINTER = {
  pointerId: 1,
  x: 10,
  y: 10,
  button: 0,
  buttons: 1,
  shiftKey: false,
  ctrlKey: false,
  metaKey: false,
  altKey: false,
} as const;

function step(
  state: InteractionRootState,
  ev: Parameters<typeof transition>[1]
) {
  return transition(state, ev);
}

const EV_DOWN = (iid: string, x: number, y: number) => ({
  type: "pointer-down" as const,
  pointer: { ...POINTER, x, y },
  zone: { kind: "file-item" as const, iid },
});

const EV_MOVE = (
  x: number,
  y: number,
  zone: { kind: "folder-target"; iid: string } | null = null
) => ({
  type: "pointer-move" as const,
  pointer: { ...POINTER, x, y },
  zone,
});

const EV_UP = () => ({
  type: "pointer-up" as const,
  pointer: POINTER,
  zone: null,
});

describe("drag-and-drop reducer (integrated)", () => {
  it("starts pending on left click on a file-item", () => {
    const s = step(initialState, EV_DOWN("file-1", 10, 10));
    expect(s.drag.phase).toBe("pending");
    expect(s.drag.fromIid).toBe("file-1");
  });

  it("promotes to dragging once movement exceeds threshold", () => {
    let s = step(initialState, EV_DOWN("file-1", 10, 10));
    s = step(s, EV_MOVE(50, 60));
    expect(s.drag.phase).toBe("dragging");
  });

  it("stays pending when movement is below threshold", () => {
    let s = step(initialState, EV_DOWN("file-1", 10, 10));
    s = step(s, EV_MOVE(12, 11));
    expect(s.drag.phase).toBe("pending");
  });

  it("sets hover only when pointer over a folder-target or background", () => {
    let s = step(initialState, EV_DOWN("file-1", 10, 10));
    s = step(s, EV_MOVE(50, 60));
    s = step(s, EV_MOVE(80, 80, { kind: "folder-target", iid: "/folder-1" }));
    expect(s.drag.phase).toBe("dragging");
    if (s.drag.phase === "dragging") expect(s.drag.hoverIid).toBe("/folder-1");
  });

  it("drops on pointer-up after dragging", () => {
    let s = step(initialState, EV_DOWN("file-1", 10, 10));
    s = step(s, EV_MOVE(50, 60));
    s = step(s, EV_UP());
    expect(s.drag.phase).toBe("dropping");
  });

  it("cancels on Escape", () => {
    let s = step(initialState, EV_DOWN("file-1", 10, 10));
    s = step(s, EV_MOVE(50, 60));
    s = step(s, {
      type: "key-down",
      key: {
        key: "Escape",
        code: "Escape",
        shiftKey: false,
        ctrlKey: false,
        metaKey: false,
        altKey: false,
      },
    });
    expect(s.drag.phase).toBe("ended-cancelled");
  });

  it("cancels on window blur", () => {
    let s = step(initialState, EV_DOWN("file-1", 10, 10));
    s = step(s, EV_MOVE(50, 60));
    s = step(s, { type: "focus-out" });
    expect(s.drag.phase).toBe("ended-cancelled");
  });
});
