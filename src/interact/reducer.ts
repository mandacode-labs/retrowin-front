/**
 * Pointer/keyboard interaction reducer. Pure function over a single
 * `RuntimeContext` — six regions (drag, select-box, window-affordance,
 * image-pan-zoom, context-menu, pressedKeys) share one state object
 * and one transition function. Side effects (mv / mkdir / rm) are
 * observed by `runtime.tsx` from a single rAF tick.
 *
 * Note: this module is a pure FSM. The runtime owns the document
 * listener and the commit cycle. There is no xstate / no zustand —
 * the whole FSM lives in this single function and a React
 * `useReducer` in `runtime.tsx`.
 */

import type { Iid } from "@/interact/element-id";
import type {
  HitZone,
  PointerSnapshot,
  WheelSnapshot,
} from "@/interact/snapshots";

export type AffordanceKind = "move" | "resize";

export type DragRegionState = {
  phase: "idle" | "pending" | "dragging" | "dropping" | "ended";
  fromIid: Iid | null;
  start: PointerSnapshot | null;
  last: PointerSnapshot | null;
  hoverIid: Iid | null;
  sources: string[];
  target: string | null;
  cancelled: boolean;
};

const initialDrag: DragRegionState = {
  phase: "idle",
  fromIid: null,
  start: null,
  last: null,
  hoverIid: null,
  sources: [],
  target: null,
  cancelled: false,
};

export type SelectBoxRegionState = {
  phase: "idle" | "active" | "ended";
  scopeIid: Iid | null;
  start: PointerSnapshot | null;
  last: PointerSnapshot | null;
};

const initialSelectBox: SelectBoxRegionState = {
  phase: "idle",
  scopeIid: null,
  start: null,
  last: null,
};

export type WindowAffordanceRegionState = {
  phase: "idle" | "active" | "ended";
  kind: AffordanceKind | null;
  iid: Iid | null;
  start: PointerSnapshot | null;
  last: PointerSnapshot | null;
  cancelled: boolean;
};

const initialWindowAffordance: WindowAffordanceRegionState = {
  phase: "idle",
  kind: null,
  iid: null,
  start: null,
  last: null,
  cancelled: false,
};

export type ImagePanZoomRegionState = {
  phase: "idle" | "panning" | "ended";
  iid: Iid | null;
  start: PointerSnapshot | null;
  last: PointerSnapshot | null;
  cancelled: boolean;
};

const initialImagePanZoom: ImagePanZoomRegionState = {
  phase: "idle",
  iid: null,
  start: null,
  last: null,
  cancelled: false,
};

export type ContextMenuRegionState = {
  phase: "idle" | "open";
  zoneIid: Iid | null;
  pointer: PointerSnapshot | null;
};

const initialContextMenu: ContextMenuRegionState = {
  phase: "idle",
  zoneIid: null,
  pointer: null,
};

export type MachineEvent =
  | { type: "pointer-down"; pointer: PointerSnapshot; zone: HitZone }
  | { type: "pointer-move"; pointer: PointerSnapshot; zone: HitZone }
  | { type: "pointer-up"; pointer: PointerSnapshot; zone: HitZone }
  | { type: "context-menu"; pointer: PointerSnapshot; zone: HitZone }
  | { type: "wheel"; wheel: WheelSnapshot; zone: HitZone }
  | { type: "key-down"; key: string; code: string }
  | { type: "key-up"; key: string }
  | { type: "focus-out" };

export type RuntimeContext = {
  hover: { iid: Iid; x: number; y: number } | null;
  pressedKeys: string[];
  drag: DragRegionState;
  selectBox: SelectBoxRegionState;
  windowAffordance: WindowAffordanceRegionState;
  imagePanZoom: ImagePanZoomRegionState;
  contextMenu: ContextMenuRegionState;
};

const DRAG_THRESHOLD = 4;

function isCancelEvent(ev: MachineEvent): boolean {
  if (ev.type === "focus-out") return true;
  if (ev.type === "key-down" && ev.key === "Escape") return true;
  return false;
}

const TERMINAL_RESET_TYPES: ReadonlyArray<MachineEvent["type"]> = [
  "pointer-down",
  "pointer-move",
  "pointer-up",
  "wheel",
  "key-down",
  "key-up",
];

function shouldResetOnTerminal(ev: MachineEvent): boolean {
  return (TERMINAL_RESET_TYPES as ReadonlyArray<string>).includes(ev.type);
}

export function initialContext(): RuntimeContext {
  return {
    hover: null,
    pressedKeys: [],
    drag: initialDrag,
    selectBox: initialSelectBox,
    windowAffordance: initialWindowAffordance,
    imagePanZoom: initialImagePanZoom,
    contextMenu: initialContextMenu,
  };
}

export function reduce(ctx: RuntimeContext, ev: MachineEvent): RuntimeContext {
  const cancel = isCancelEvent(ev);

  // drag
  let drag = ctx.drag;
  if (ev.type === "pointer-down") {
    // A new pointer-down always resets the drag machine to idle. The
    // previous drag's `dropping` / `ended` terminal phase lingers
    // for one frame so the rAF commit can read it, but a new
    // pointer-down means the user is starting a fresh gesture and
    // we must not let the terminal phase starve the next drag.
    if (drag.phase !== "idle") {
      drag = initialDrag;
    }
    if (
      ev.zone?.kind === "file-item" &&
      ev.pointer.button === 0 &&
      drag.phase === "idle"
    ) {
      drag = {
        phase: "pending",
        fromIid: ev.zone.iid,
        start: ev.pointer,
        last: ev.pointer,
        hoverIid: null,
        sources: [],
        target: null,
        cancelled: false,
      };
    }
  } else if (ev.type === "pointer-move") {
    if (drag.phase === "pending" && drag.start) {
      const dx = Math.abs(ev.pointer.x - drag.start.x);
      const dy = Math.abs(ev.pointer.y - drag.start.y);
      if (dx > DRAG_THRESHOLD || dy > DRAG_THRESHOLD) {
        drag = {
          phase: "dragging",
          fromIid: drag.fromIid,
          start: drag.start,
          last: ev.pointer,
          hoverIid: null,
          sources: [],
          target: null,
          cancelled: false,
        };
      } else {
        drag = { ...drag, last: ev.pointer };
      }
    } else if (drag.phase === "dragging") {
      const hover =
        ev.zone?.kind === "folder-target" || ev.zone?.kind === "background"
          ? ev.zone.iid
          : null;
      drag = { ...drag, last: ev.pointer, hoverIid: hover };
    }
  } else if (ev.type === "pointer-up") {
    if (drag.phase === "dragging") {
      drag = { ...drag, phase: "dropping", target: drag.hoverIid };
    } else if (drag.phase === "pending") {
      drag = { ...drag, phase: "ended", cancelled: true };
    }
  } else if (cancel && drag.phase !== "idle" && drag.phase !== "ended") {
    drag = { ...drag, phase: "ended", cancelled: true };
  }
  // After dropping/ended, on the *next* event we drop back to idle
  // so a new pointer-down can start a fresh drag. The intermediate
  // phase gives observers one frame to commit the drop.
  if (
    drag.phase === "ended" &&
    ctx.drag.phase === "ended" &&
    shouldResetOnTerminal(ev)
  ) {
    drag = initialDrag;
  } else if (
    drag.phase === "dropping" &&
    ctx.drag.phase === "dropping" &&
    shouldResetOnTerminal(ev)
  ) {
    drag = initialDrag;
  }

  // select-box
  let selectBox = ctx.selectBox;
  if (ev.type === "pointer-down") {
    if (
      (ev.zone?.kind === "background" || ev.zone?.kind === "window-content") &&
      ev.pointer.button === 0 &&
      selectBox.phase === "idle"
    ) {
      selectBox = {
        phase: "active",
        scopeIid: ev.zone.iid,
        start: ev.pointer,
        last: ev.pointer,
      };
    }
  } else if (ev.type === "pointer-move") {
    if (selectBox.phase === "active") {
      selectBox = { ...selectBox, last: ev.pointer };
    }
  } else if (ev.type === "pointer-up") {
    if (selectBox.phase === "active") {
      selectBox = { ...selectBox, phase: "ended" };
    }
  } else if (cancel && selectBox.phase === "active") {
    selectBox = { ...selectBox, phase: "ended" };
  } else if (
    selectBox.phase === "ended" &&
    ctx.selectBox.phase === "ended" &&
    shouldResetOnTerminal(ev)
  ) {
    selectBox = initialSelectBox;
  }

  // window-affordance
  let windowAffordance = ctx.windowAffordance;
  if (ev.type === "pointer-down") {
    if (ev.zone?.kind === "window-affordance" && ev.pointer.button === 0) {
      windowAffordance = {
        phase: "active",
        kind: ev.zone.affordance,
        iid: ev.zone.iid,
        start: ev.pointer,
        last: ev.pointer,
        cancelled: false,
      };
    }
  } else if (ev.type === "pointer-move") {
    if (windowAffordance.phase === "active") {
      windowAffordance = { ...windowAffordance, last: ev.pointer };
    }
  } else if (ev.type === "pointer-up") {
    if (windowAffordance.phase === "active") {
      windowAffordance = {
        ...windowAffordance,
        phase: "ended",
        cancelled: false,
      };
    }
  } else if (cancel && windowAffordance.phase === "active") {
    windowAffordance = { ...windowAffordance, phase: "ended", cancelled: true };
  } else if (
    windowAffordance.phase === "ended" &&
    ctx.windowAffordance.phase === "ended" &&
    shouldResetOnTerminal(ev)
  ) {
    windowAffordance = initialWindowAffordance;
  }

  // image-pan-zoom
  let imagePanZoom = ctx.imagePanZoom;
  if (ev.type === "pointer-down") {
    if (ev.zone?.kind === "image-pan-zoom" && ev.pointer.button === 0) {
      imagePanZoom = {
        phase: "panning",
        iid: ev.zone.iid,
        start: ev.pointer,
        last: ev.pointer,
        cancelled: false,
      };
    }
  } else if (ev.type === "pointer-move") {
    if (imagePanZoom.phase === "panning") {
      imagePanZoom = { ...imagePanZoom, last: ev.pointer };
    }
  } else if (ev.type === "pointer-up") {
    if (imagePanZoom.phase === "panning") {
      imagePanZoom = { ...imagePanZoom, phase: "ended", cancelled: false };
    }
  } else if (cancel && imagePanZoom.phase === "panning") {
    imagePanZoom = { ...imagePanZoom, phase: "ended", cancelled: true };
  } else if (
    imagePanZoom.phase === "ended" &&
    ctx.imagePanZoom.phase === "ended" &&
    shouldResetOnTerminal(ev)
  ) {
    imagePanZoom = initialImagePanZoom;
  }

  // context-menu
  let contextMenu = ctx.contextMenu;
  if (ev.type === "context-menu") {
    contextMenu = {
      phase: "open",
      zoneIid: ev.zone?.iid ?? null,
      pointer: ev.pointer,
    };
  } else if (ev.type === "pointer-down" && contextMenu.phase === "open") {
    contextMenu = initialContextMenu;
  } else if (cancel && contextMenu.phase === "open") {
    contextMenu = initialContextMenu;
  }

  // hover
  let hover = ctx.hover;
  if (ev.type === "pointer-move" && ev.zone?.iid) {
    hover = { iid: ev.zone.iid, x: ev.pointer.x, y: ev.pointer.y };
  } else if (ev.type === "pointer-down") {
    hover = ev.zone?.iid
      ? { iid: ev.zone.iid, x: ev.pointer.x, y: ev.pointer.y }
      : hover;
  } else if (ev.type === "focus-out") {
    hover = null;
  }

  // pressedKeys
  let pressedKeys = ctx.pressedKeys;
  if (ev.type === "key-down") {
    const k = ev.key;
    if (k && !pressedKeys.includes(k)) {
      pressedKeys = [...pressedKeys, k];
    }
  } else if (ev.type === "key-up") {
    const k = ev.key;
    pressedKeys = pressedKeys.filter((p) => p !== k);
  } else if (ev.type === "focus-out") {
    pressedKeys = [];
  }

  return {
    ...ctx,
    drag,
    selectBox,
    windowAffordance,
    imagePanZoom,
    contextMenu,
    hover,
    pressedKeys,
  };
}
