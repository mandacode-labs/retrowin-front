import { describe, expect, it } from "vitest";
import { initialContext, type MachineEvent, reduce } from "@/interact/reducer";

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

function step(state = initialContext(), ev: MachineEvent) {
  return reduce(state, ev);
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

const EV_KEY = (key: string) => ({
  type: "key-down" as const,
  key,
  code: key,
});

describe("pointer runtime reducer", () => {
  it("starts pending on left click on a file-item", () => {
    const s = step(initialContext(), EV_DOWN("file-1", 10, 10));
    expect(s.drag.phase).toBe("pending");
    expect(s.drag.fromIid).toBe("file-1");
  });

  it("promotes to dragging once movement exceeds threshold", () => {
    let s = step(initialContext(), EV_DOWN("file-1", 10, 10));
    s = step(s, EV_MOVE(50, 60));
    expect(s.drag.phase).toBe("dragging");
  });

  it("stays pending when movement is below threshold", () => {
    let s = step(initialContext(), EV_DOWN("file-1", 10, 10));
    s = step(s, EV_MOVE(12, 11));
    expect(s.drag.phase).toBe("pending");
  });

  it("sets hover only when pointer over a folder-target or background", () => {
    let s = step(initialContext(), EV_DOWN("file-1", 10, 10));
    s = step(s, EV_MOVE(50, 60));
    s = step(s, EV_MOVE(80, 80, { kind: "folder-target", iid: "/folder-1" }));
    expect(s.drag.phase).toBe("dragging");
    if (s.drag.phase === "dragging") {
      expect(s.drag.hoverIid).toBe("/folder-1");
    }
  });

  it("drops on pointer-up after dragging", () => {
    let s = step(initialContext(), EV_DOWN("file-1", 10, 10));
    s = step(s, EV_MOVE(50, 60));
    s = step(s, EV_UP());
    expect(s.drag.phase).toBe("dropping");
  });

  it("cancels on Escape", () => {
    let s = step(initialContext(), EV_DOWN("file-1", 10, 10));
    s = step(s, EV_MOVE(50, 60));
    s = step(s, EV_KEY("Escape"));
    expect(s.drag.phase).toBe("ended");
    expect(s.drag.cancelled).toBe(true);
  });

  it("cancels on window blur", () => {
    let s = step(initialContext(), EV_DOWN("file-1", 10, 10));
    s = step(s, EV_MOVE(50, 60));
    s = step(s, { type: "focus-out" });
    expect(s.drag.phase).toBe("ended");
    expect(s.drag.cancelled).toBe(true);
  });

  it("returns to idle on the next pointer-move after dropping", () => {
    let s = step(initialContext(), EV_DOWN("file-1", 10, 10));
    s = step(s, EV_MOVE(50, 60));
    s = step(s, EV_UP());
    expect(s.drag.phase).toBe("dropping");
    s = step(s, EV_MOVE(60, 70));
    expect(s.drag.phase).toBe("idle");
  });

  it("select-box activates on background click and ends on mouseup", () => {
    let s = step(initialContext(), {
      type: "pointer-down",
      pointer: POINTER,
      zone: { kind: "background", iid: "ws" },
    });
    expect(s.selectBox.phase).toBe("active");
    s = step(s, EV_UP());
    expect(s.selectBox.phase).toBe("ended");
  });

  it("window affordance active on move-zone and cancelled on Escape", () => {
    let s = step(initialContext(), {
      type: "pointer-down",
      pointer: POINTER,
      zone: { kind: "window-affordance", iid: "w-1", affordance: "move" },
    });
    expect(s.windowAffordance.phase).toBe("active");
    s = step(s, EV_KEY("Escape"));
    expect(s.windowAffordance.phase).toBe("ended");
    expect(s.windowAffordance.cancelled).toBe(true);
  });

  it("context menu opens on right click and closes on next left click", () => {
    let s = step(initialContext(), {
      type: "context-menu",
      pointer: POINTER,
      zone: { kind: "background", iid: "ws" },
    });
    expect(s.contextMenu.phase).toBe("open");
    s = step(s, {
      type: "pointer-down",
      pointer: POINTER,
      zone: { kind: "background", iid: "ws" },
    });
    expect(s.contextMenu.phase).toBe("idle");
  });

  it("tracks pressed keys", () => {
    let s = step(initialContext(), EV_KEY("Shift"));
    s = step(s, EV_KEY("A"));
    expect(s.pressedKeys).toEqual(["Shift", "A"]);
    s = step(s, { type: "key-up", key: "Shift" });
    expect(s.pressedKeys).toEqual(["A"]);
  });
});
