import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { hitTest } from "@/interactions/hit-test";

function el(
  tag: string,
  attrs: Record<string, string>,
  children: unknown[] = []
) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  for (const c of children as Element[]) e.appendChild(c);
  document.body.appendChild(e);
  return e;
}

function setupDOM() {
  document.body.innerHTML = "";
}

describe("hitTest", () => {
  beforeEach(setupDOM);
  afterEach(setupDOM);

  it("returns file-item zone", () => {
    const target = el("div", {
      "data-iid": "file-1",
      "data-zone": "file-item",
    });
    expect(hitTest(target)).toEqual({ kind: "file-item", iid: "file-1" });
  });

  it("returns folder-target zone", () => {
    const target = el("div", {
      "data-iid": "/folder-1",
      "data-zone": "folder-target",
    });
    expect(hitTest(target)).toEqual({
      kind: "folder-target",
      iid: "/folder-1",
    });
  });

  it("returns window-affordance zone with the correct affordance", () => {
    const move = el("header", {
      "data-iid": "win-1",
      "data-zone": "window-affordance",
      "data-affordance": "move",
    });
    expect(hitTest(move)).toEqual({
      kind: "window-affordance",
      iid: "win-1",
      affordance: "move",
    });

    const resize = el("div", {
      "data-iid": "win-2",
      "data-zone": "window-affordance",
      "data-affordance": "resize",
    });
    expect(hitTest(resize)).toEqual({
      kind: "window-affordance",
      iid: "win-2",
      affordance: "resize",
    });
  });

  it("ignores window-affordance without valid affordance attribute", () => {
    const bad = el("div", {
      "data-iid": "win-3",
      "data-zone": "window-affordance",
    });
    expect(hitTest(bad)).toBeNull();
  });

  it("returns background zone", () => {
    const bg = el("section", {
      "data-iid": "workspace",
      "data-zone": "background",
    });
    expect(hitTest(bg)).toEqual({ kind: "background", iid: "workspace" });
  });

  it("returns null when no zone attribute exists", () => {
    const plain = el("div", {});
    expect(hitTest(plain)).toBeNull();
  });
});
