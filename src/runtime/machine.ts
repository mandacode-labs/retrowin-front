/**
 * Pointer/keyboard runtime FSM. XState v5 parallel-machine actor that
 * owns the lifetime of every interaction region (drag, select-box,
 * window-affordance, image-pan-zoom, context-menu). Side effects
 * (mv / mkdir / rm) are observed by `runtime.tsx` from a single rAF
 * tick and fired once per drop.
 */

import { assign, setup } from "xstate";
import { partitionCycled } from "@/domain/file-mutations/cycle";
import type { Iid } from "@/runtime/element-id";
import type { HitZone, PointerSnapshot, WheelSnapshot } from "@/runtime/types";

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
};

const initialImagePanZoom: ImagePanZoomRegionState = {
  phase: "idle",
  iid: null,
  start: null,
  last: null,
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

export type MvVars = {
  driveID: string;
  sources: string[];
  destination: string;
};

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

/**
 * Pure transition. Tests exercise this directly; the runtime calls
 * it via the XState actor.
 */
export function reduce(ctx: RuntimeContext, ev: MachineEvent): RuntimeContext {
  const cancel = isCancelEvent(ev);

  // drag
  let drag = ctx.drag;
  if (ev.type === "pointer-down") {
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
  if (
    drag.phase === "dropping" &&
    ctx.drag.phase === "dropping" &&
    shouldResetOnTerminal(ev)
  ) {
    // The rAF commit has had a chance to fire; return to idle.
    drag = initialDrag;
  } else if (
    drag.phase === "ended" &&
    ctx.drag.phase === "ended" &&
    shouldResetOnTerminal(ev)
  ) {
    drag = initialDrag;
  } else if (ctx.drag.phase !== "dropping" && drag.phase === "dropping") {
    // dropping entered this event — keep visible for the rAF commit
    // tick. The next event reverts to idle (see branch above).
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
    windowAffordance = {
      ...windowAffordance,
      phase: "ended",
      cancelled: true,
    };
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
      };
    }
  } else if (ev.type === "pointer-move") {
    if (imagePanZoom.phase === "panning") {
      imagePanZoom = { ...imagePanZoom, last: ev.pointer };
    }
  } else if (ev.type === "pointer-up") {
    if (imagePanZoom.phase === "panning") {
      imagePanZoom = { ...imagePanZoom, phase: "ended" };
    }
  } else if (cancel && imagePanZoom.phase === "panning") {
    imagePanZoom = { ...imagePanZoom, phase: "ended" };
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

/**
 * XState machine factory. The machine is intentionally thin: the
 * `reduce` function (defined elsewhere in this file) does all of the
 * real transition work; the machine only assigns the new context on
 * each event. We do this because the reducer is a single pure
 * function over a single context object, and threading it through
 * xstate's assign actions is more direct than maintaining parallel
 * sub-state charts that all have to share the same context.
 */
export function makeMachine() {
  return setup({
    types: {} as {
      context: RuntimeContext;
      events: MachineEvent;
    },
  }).createMachine({
    id: "runtime",
    context: initialContext(),
    on: {
      "pointer-down": {
        actions: assign(({ context, event }) => reduce(context, event)),
      },
      "pointer-move": {
        actions: assign(({ context, event }) => reduce(context, event)),
      },
      "pointer-up": {
        actions: assign(({ context, event }) => reduce(context, event)),
      },
      "context-menu": {
        actions: assign(({ context, event }) => reduce(context, event)),
      },
      wheel: {
        actions: assign(({ context, event }) => reduce(context, event)),
      },
      "key-down": {
        actions: assign(({ context, event }) => reduce(context, event)),
      },
      "key-up": {
        actions: assign(({ context, event }) => reduce(context, event)),
      },
      "focus-out": {
        actions: assign(({ context, event }) => reduce(context, event)),
      },
    },
  });
}

export type InteractionMachine = ReturnType<typeof makeMachine>;

/**
 * Helper to compute the commit input for a drag drop. The runtime
 * uses this once per `dropping` transition to decide whether to call
 * `mv()`; subsequent events reset the machine and skip commit.
 */
export function buildCommitInput(
  ctx: RuntimeContext,
  driveID: string | null
): { vars: MvVars; cycle: boolean } | null {
  if (ctx.drag.phase !== "dropping" || !ctx.drag.target || !driveID) {
    return null;
  }
  const { safe, rejected } = partitionCycled(ctx.drag.sources, ctx.drag.target);
  return {
    vars: {
      driveID,
      sources: safe,
      destination: ctx.drag.target,
    },
    cycle: rejected.length > 0,
  };
}
