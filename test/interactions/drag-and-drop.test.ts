import { describe, expect, it } from "vitest";
import {
  type DragAndDropState,
  dragAndDropReducer,
  INITIAL_DRAG_STATE,
} from "@/interactions/reducers/drag-and-drop";

function pointer(
  x: number,
  y: number,
  overrides: Partial<{ pointerId: number; button: number }> = {}
) {
  return {
    pointerId: overrides.pointerId ?? 1,
    x,
    y,
    y2: y,
    button: overrides.button ?? 0,
    buttons: 1,
    shiftKey: false,
    ctrlKey: false,
    metaKey: false,
    altKey: false,
  };
}

function down(
  state: DragAndDropState,
  iid: string | null,
  x: number,
  y: number
) {
  return dragAndDropReducer(state, {
    type: "down",
    iid,
    input: { ...pointer(x, y), x, y },
  });
}

function move(state: DragAndDropState, x: number, y: number) {
  return dragAndDropReducer(state, {
    type: "move",
    input: { ...pointer(x, y, { pointerId: 1 }), x, y },
  });
}

function up(state: DragAndDropState, x: number, y: number) {
  return dragAndDropReducer(state, {
    type: "up",
    iid: "folder-1",
    input: { ...pointer(x, y, { pointerId: 1 }), x, y },
  });
}

const key = (k: string) => ({
  type: "key" as const,
  input: {
    key: k,
    code: k,
    shiftKey: false,
    ctrlKey: false,
    metaKey: false,
    altKey: false,
  },
});

describe("drag-and-drop reducer", () => {
  it("starts idle and ignores right-click", () => {
    expect(INITIAL_DRAG_STATE.phase).toBe("idle");
    const s = dragAndDropReducer(INITIAL_DRAG_STATE, {
      type: "down",
      iid: "file-1",
      input: { ...pointer(10, 10, { button: 2 }), x: 10, y: 10 },
    });
    expect(s.phase).toBe("idle");
  });

  it("transitions idle → pending on left click", () => {
    const s = down(INITIAL_DRAG_STATE, "file-1", 10, 10);
    expect(s).toMatchObject({ phase: "pending", from: "file-1" });
  });

  it("promotes to dragging when movement exceeds threshold", () => {
    let s = down(INITIAL_DRAG_STATE, "file-1", 10, 10);
    s = move(s, 50, 60);
    expect(s.phase).toBe("dragging");
    if (s.phase === "dragging") {
      expect(s.from).toBe("file-1");
      expect(s.dx).toBe(40);
      expect(s.dy).toBe(50);
    }
  });

  it("stays pending when movement is below threshold", () => {
    let s = down(INITIAL_DRAG_STATE, "file-1", 10, 10);
    s = move(s, 12, 11);
    expect(s.phase).toBe("pending");
  });

  it("completes drag on mouseup after dragging", () => {
    let s = down(INITIAL_DRAG_STATE, "file-1", 10, 10);
    s = move(s, 50, 60);
    s = up(s, 80, 80);
    expect(s).toEqual({ phase: "ended", reason: "completed" });
  });

  it("cancels pending on mouseup before threshold", () => {
    let s = down(INITIAL_DRAG_STATE, "file-1", 10, 10);
    s = up(s, 10, 10);
    expect(s).toEqual({ phase: "ended", reason: "cancelled" });
  });

  it("cancels on Escape", () => {
    let s = down(INITIAL_DRAG_STATE, "file-1", 10, 10);
    s = move(s, 50, 60);
    s = dragAndDropReducer(s, key("Escape"));
    expect(s).toEqual({ phase: "ended", reason: "cancelled" });
  });

  it("cancels on window blur", () => {
    let s = down(INITIAL_DRAG_STATE, "file-1", 10, 10);
    s = move(s, 50, 60);
    s = dragAndDropReducer(s, { type: "blur" });
    expect(s).toEqual({ phase: "ended", reason: "cancelled" });
  });
});
