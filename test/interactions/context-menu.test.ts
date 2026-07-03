import { describe, expect, it } from "vitest";
import {
  contextMenuReducer,
  INITIAL_CONTEXT_MENU_STATE,
} from "@/interactions/reducers/context-menu";

describe("context menu reducer", () => {
  it("opens on contextmenu", () => {
    const s = contextMenuReducer(INITIAL_CONTEXT_MENU_STATE, {
      type: "contextmenu",
      iid: "file-1",
      input: {
        pointerId: 1,
        x: 100,
        y: 200,
        button: 2,
        buttons: 2,
        shiftKey: false,
        ctrlKey: false,
        metaKey: false,
        altKey: false,
      },
    });
    expect(s.phase).toBe("open");
    if (s.phase === "open") {
      expect(s.x).toBe(100);
      expect(s.y).toBe(200);
      expect(s.iid).toBe("file-1");
    }
  });

  it("ignores other events", () => {
    const s = contextMenuReducer(INITIAL_CONTEXT_MENU_STATE, {
      type: "down",
      iid: "x",
      input: {
        pointerId: 1,
        x: 0,
        y: 0,
        button: 0,
        buttons: 1,
        shiftKey: false,
        ctrlKey: false,
        metaKey: false,
        altKey: false,
      },
    });
    expect(s.phase).toBe("idle");
  });
});
