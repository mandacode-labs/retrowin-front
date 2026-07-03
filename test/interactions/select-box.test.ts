import { describe, expect, it } from "vitest";
import {
  INITIAL_SELECT_BOX_STATE,
  selectBoxRect,
  selectBoxReducer,
} from "@/interactions/reducers/select-box";

function pointer(x: number, y: number) {
  return {
    type: "down" as const,
    iid: "scope-1",
    input: {
      pointerId: 1,
      x,
      y,
      button: 0,
      buttons: 1,
      shiftKey: false,
      ctrlKey: false,
      metaKey: false,
      altKey: false,
    },
  };
}

function move(x: number, y: number) {
  return { type: "move" as const, input: { ...pointer(x, y).input, x, y } };
}

function up() {
  return {
    type: "up" as const,
    iid: "scope-1",
    input: pointer(0, 0).input,
  };
}

describe("select-box reducer", () => {
  it("ignores right-click", () => {
    const ev = pointer(10, 10);
    const s = selectBoxReducer(INITIAL_SELECT_BOX_STATE, {
      ...ev,
      input: { ...ev.input, button: 2 },
    });
    expect(s.phase).toBe("idle");
  });

  it("activates on left click", () => {
    const s = selectBoxReducer(INITIAL_SELECT_BOX_STATE, pointer(10, 10));
    expect(s.phase).toBe("active");
  });

  it("tracks movement and computes rect", () => {
    let s = selectBoxReducer(INITIAL_SELECT_BOX_STATE, pointer(10, 10));
    s = selectBoxReducer(s, move(80, 60));
    expect(selectBoxRect(s)).toEqual({
      left: 10,
      top: 10,
      width: 70,
      height: 50,
    });
  });

  it("ends on mouseup", () => {
    let s = selectBoxReducer(INITIAL_SELECT_BOX_STATE, pointer(10, 10));
    s = selectBoxReducer(s, up());
    expect(s.phase).toBe("ended");
  });
});
