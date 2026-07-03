import { describe, expect, it } from "vitest";
import {
  INITIAL_IMAGE_PAN_ZOOM_STATE,
  imagePanZoomReducer,
} from "@/interactions/reducers/image-pan-zoom";

const pi = (x: number, y: number) => ({
  pointerId: 1,
  x,
  y,
  button: 0,
  buttons: 1,
  shiftKey: false,
  ctrlKey: false,
  metaKey: false,
  altKey: false,
});

describe("image pan/zoom reducer", () => {
  it("starts panning on left click", () => {
    const s = imagePanZoomReducer(INITIAL_IMAGE_PAN_ZOOM_STATE, {
      type: "down",
      iid: "img",
      input: pi(10, 10),
    });
    expect(s.phase).toBe("panning");
  });

  it("tracks delta on move", () => {
    let s = imagePanZoomReducer(INITIAL_IMAGE_PAN_ZOOM_STATE, {
      type: "down",
      iid: "img",
      input: pi(10, 10),
    });
    s = imagePanZoomReducer(s, { type: "move", input: pi(40, 25) });
    expect(s.phase).toBe("panning");
    if (s.phase === "panning") {
      expect(s.dx).toBe(30);
      expect(s.dy).toBe(15);
    }
  });

  it("ends on mouseup", () => {
    let s = imagePanZoomReducer(INITIAL_IMAGE_PAN_ZOOM_STATE, {
      type: "down",
      iid: "img",
      input: pi(10, 10),
    });
    s = imagePanZoomReducer(s, {
      type: "up",
      iid: "img",
      input: pi(50, 50),
    });
    expect(s.phase).toBe("ended");
  });
});
