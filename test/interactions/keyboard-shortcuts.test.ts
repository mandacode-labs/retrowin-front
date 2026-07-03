import { describe, expect, it } from "vitest";
import { shortcutFor } from "@/interactions/reducers/keyboard-shortcuts";

describe("keyboard shortcuts", () => {
  it("maps Escape to cancel", () => {
    expect(
      shortcutFor({
        key: "Escape",
        code: "Escape",
        shiftKey: false,
        ctrlKey: false,
        metaKey: false,
        altKey: false,
      })
    ).toEqual({
      kind: "cancel-active-interaction",
    });
  });

  it("maps Cmd/Ctrl+A to select-all", () => {
    expect(
      shortcutFor({
        key: "a",
        code: "KeyA",
        shiftKey: false,
        ctrlKey: true,
        metaKey: false,
        altKey: false,
      })
    ).toEqual({ kind: "select-all" });
    expect(
      shortcutFor({
        key: "a",
        code: "KeyA",
        shiftKey: false,
        ctrlKey: false,
        metaKey: true,
        altKey: false,
      })
    ).toEqual({ kind: "select-all" });
  });

  it("returns noop for unrelated keys", () => {
    expect(
      shortcutFor({
        key: "x",
        code: "KeyX",
        shiftKey: false,
        ctrlKey: false,
        metaKey: false,
        altKey: false,
      })
    ).toEqual({ kind: "noop" });
  });
});
