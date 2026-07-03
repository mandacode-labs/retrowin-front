// Hit zones: structured description of what the pointer is currently over.
// Components register regions by adding `data-zone` and `data-iid`
// attributes; the single document-level listener asks `hitTest` to
// resolve an EventTarget into a HitZone every time it fires.

import type { Iid } from "@/interact/element-id";

export type HitZone =
  | { kind: "file-item"; iid: Iid }
  | { kind: "folder-target"; iid: Iid }
  | { kind: "window-affordance"; iid: Iid; affordance: "move" | "resize" }
  | { kind: "window-content"; iid: Iid }
  | { kind: "background"; iid: Iid }
  | { kind: "menu"; iid: Iid }
  | { kind: "image-pan-zoom"; iid: Iid }
  | null;

export const NO_HIT: HitZone = null;

export type PointerSnapshot = {
  pointerId: number;
  x: number;
  y: number;
  button: number;
  buttons: number;
  shiftKey: boolean;
  ctrlKey: boolean;
  metaKey: boolean;
  altKey: boolean;
};

export type WheelSnapshot = {
  x: number;
  y: number;
  deltaX: number;
  deltaY: number;
  deltaZ: number;
  ctrlKey: boolean;
  metaKey: boolean;
};

export type KeySnapshot = {
  key: string;
  code: string;
  shiftKey: boolean;
  ctrlKey: boolean;
  metaKey: boolean;
  altKey: boolean;
};

export type InteractionEvent =
  | { type: "pointer-down"; pointer: PointerSnapshot; zone: HitZone }
  | { type: "pointer-move"; pointer: PointerSnapshot; zone: HitZone }
  | { type: "pointer-up"; pointer: PointerSnapshot; zone: HitZone }
  | { type: "context-menu"; pointer: PointerSnapshot; zone: HitZone }
  | { type: "wheel"; wheel: WheelSnapshot; zone: HitZone }
  | { type: "key-down"; key: KeySnapshot }
  | { type: "key-up"; key: KeySnapshot }
  | { type: "focus-out" };

export function toPointerSnapshot(
  ev: MouseEvent | PointerEvent
): PointerSnapshot {
  return {
    pointerId:
      "pointerId" in ev && typeof ev.pointerId === "number" ? ev.pointerId : -1,
    x: ev.clientX,
    y: ev.clientY,
    button: ev.button,
    buttons: ev.buttons,
    shiftKey: ev.shiftKey,
    ctrlKey: ev.ctrlKey,
    metaKey: ev.metaKey,
    altKey: ev.altKey,
  };
}

export function toWheelSnapshot(ev: WheelEvent): WheelSnapshot {
  return {
    x: ev.clientX,
    y: ev.clientY,
    deltaX: ev.deltaX,
    deltaY: ev.deltaY,
    deltaZ: ev.deltaZ,
    ctrlKey: ev.ctrlKey,
    metaKey: ev.metaKey,
  };
}

export function toKeySnapshot(ev: KeyboardEvent): KeySnapshot {
  return {
    key: ev.key,
    code: ev.code,
    shiftKey: ev.shiftKey,
    ctrlKey: ev.ctrlKey,
    metaKey: ev.metaKey,
    altKey: ev.altKey,
  };
}
