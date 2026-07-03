/**
 * High-frequency pointer data. We never push this through React
 * state — `runtime.tsx` writes the latest values and reads them in
 * the rAF tick.
 */

import type { HitZone, PointerSnapshot } from "@/runtime/types";

export type PointerRef = {
  pointer: PointerSnapshot;
  zone: HitZone;
};

export const pointerRef: PointerRef = {
  pointer: {
    pointerId: -1,
    x: 0,
    y: 0,
    button: -1,
    buttons: 0,
    shiftKey: false,
    ctrlKey: false,
    metaKey: false,
    altKey: false,
  },
  zone: null,
};
