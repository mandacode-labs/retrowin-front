import { create } from "zustand";
import type { InteractionEvent, PointerSnapshot } from "@/interactions/types";

// ============================================================================
// Drag-and-drop sub-machine
// ============================================================================

export type DragPhase =
  | "idle"
  | "pending"
  | "dragging"
  | "dropping"
  | "ended-cancelled"
  | "ended-completed";

export type DragState = {
  phase: DragPhase;
  fromIid: string | null;
  start: PointerSnapshot | null;
  last: PointerSnapshot | null;
  hoverIid: string | null;
  sources: string[];
  target: string | null;
};

export const initialDrag: DragState = {
  phase: "idle",
  fromIid: null,
  start: null,
  last: null,
  hoverIid: null,
  sources: [],
  target: null,
};

// ============================================================================
// Select-box sub-machine
// ============================================================================

export type SelectBoxPhase = "idle" | "active" | "ended";
export type SelectBoxState = {
  phase: SelectBoxPhase;
  scopeIid: string | null;
  start: PointerSnapshot | null;
  last: PointerSnapshot | null;
};
export const initialSelectBox: SelectBoxState = {
  phase: "idle",
  scopeIid: null,
  start: null,
  last: null,
};

// ============================================================================
// Window affordance (move / resize) sub-machine
// ============================================================================

export type AffordanceKind = "move" | "resize";

export type WindowAffordancePhase =
  | "idle"
  | "active"
  | "ended-cancelled"
  | "ended-completed";

export type WindowAffordanceState = {
  phase: WindowAffordancePhase;
  kind: AffordanceKind | null;
  iid: string | null;
  start: PointerSnapshot | null;
  last: PointerSnapshot | null;
};
export const initialWindowAffordance: WindowAffordanceState = {
  phase: "idle",
  kind: null,
  iid: null,
  start: null,
  last: null,
};

// ============================================================================
// Image pan/zoom sub-machine
// ============================================================================

export type ImagePanZoomPhase = "idle" | "panning" | "ending";
export type ImagePanZoomState = {
  phase: ImagePanZoomPhase;
  iid: string | null;
  start: PointerSnapshot | null;
  last: PointerSnapshot | null;
};
export const initialImagePanZoom: ImagePanZoomState = {
  phase: "idle",
  iid: null,
  start: null,
  last: null,
};

// ============================================================================
// Context menu sub-machine
// ============================================================================

export type ContextMenuPhase = "idle" | "open";
export type ContextMenuState = {
  phase: ContextMenuPhase;
  zoneIid: string | null;
  pointer: PointerSnapshot | null;
};
export const initialContextMenu: ContextMenuState = {
  phase: "idle",
  zoneIid: null,
  pointer: null,
};

// ============================================================================
// Root state — one of the above is "active"
// ============================================================================

export type ActiveInteraction =
  | { kind: "idle" }
  | { kind: "drag"; state: DragState }
  | { kind: "select-box"; state: SelectBoxState }
  | { kind: "window-affordance"; state: WindowAffordanceState }
  | { kind: "image-pan-zoom"; state: ImagePanZoomState }
  | { kind: "context-menu"; state: ContextMenuState };

export type HoverInfo = { iid: string; x: number; y: number } | null;

export type InteractionRootState = {
  active: ActiveInteraction;
  hover: HoverInfo;
  pressedKeys: ReadonlyArray<string>;
  drag: DragState;
  selectBox: SelectBoxState;
  windowAffordance: WindowAffordanceState;
  imagePanZoom: ImagePanZoomState;
  contextMenu: ContextMenuState;
};

export const initialState: InteractionRootState = {
  active: { kind: "idle" },
  hover: null,
  pressedKeys: [],
  drag: initialDrag,
  selectBox: initialSelectBox,
  windowAffordance: initialWindowAffordance,
  imagePanZoom: initialImagePanZoom,
  contextMenu: initialContextMenu,
};

// ============================================================================
// Transitions — pure, exported for tests
// ============================================================================

const DRAG_THRESHOLD = 4;

function isCancelEvent(ev: InteractionEvent): boolean {
  if (ev.type === "focus-out") return true;
  if (ev.type === "key-down" && ev.key.key === "Escape") return true;
  return false;
}

const TERMINAL_RESET_TYPES: ReadonlyArray<InteractionEvent["type"]> = [
  "pointer-down",
  "pointer-move",
  "pointer-up",
  "wheel",
  "key-down",
  "key-up",
];

function shouldResetOnTerminal(ev: InteractionEvent): boolean {
  return (TERMINAL_RESET_TYPES as ReadonlyArray<string>).includes(ev.type);
}

export function transition(
  state: InteractionRootState,
  ev: InteractionEvent
): InteractionRootState {
  const cancel = isCancelEvent(ev);

  // ------------------------------------------------------------------ drag
  let drag = state.drag;
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
      drag = {
        ...drag,
        phase: "dropping",
        target: drag.hoverIid,
      };
    } else if (drag.phase === "pending") {
      drag = { ...drag, phase: "ended-cancelled" };
    }
  } else if (cancel && drag.phase !== "idle") {
    drag = { ...drag, phase: "ended-cancelled" };
  }
  // Track whether the drag machine already *entered* a terminal phase
  // via this same event. If so, we leave the terminal phase visible
  // to observers for one extra transition and only reset on a
  // *subsequent* event.
  if (
    (drag.phase === "dropping" ||
      drag.phase === "ended-completed" ||
      drag.phase === "ended-cancelled") &&
    drag.phase !== state.drag.phase
  ) {
    // already terminal — leave it visible so observers can commit.
  } else if (
    (state.drag.phase === "dropping" ||
      state.drag.phase === "ended-completed" ||
      state.drag.phase === "ended-cancelled") &&
    shouldResetOnTerminal(ev)
  ) {
    drag = initialDrag;
  }

  // ------------------------------------------------------------------ select-box
  let selectBox = state.selectBox;
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
    state.selectBox.phase === "ended" &&
    shouldResetOnTerminal(ev)
  ) {
    selectBox = initialSelectBox;
  }

  // ------------------------------------------------------------------ window-affordance
  let windowAffordance = state.windowAffordance;
  if (ev.type === "pointer-down") {
    if (ev.zone?.kind === "window-affordance" && ev.pointer.button === 0) {
      windowAffordance = {
        phase: "active",
        kind: ev.zone.affordance,
        iid: ev.zone.iid,
        start: ev.pointer,
        last: ev.pointer,
      };
    }
  } else if (ev.type === "pointer-move") {
    if (windowAffordance.phase === "active") {
      windowAffordance = { ...windowAffordance, last: ev.pointer };
    }
  } else if (ev.type === "pointer-up") {
    if (windowAffordance.phase === "active") {
      windowAffordance = { ...windowAffordance, phase: "ended-completed" };
    }
  } else if (cancel && windowAffordance.phase === "active") {
    windowAffordance = { ...windowAffordance, phase: "ended-cancelled" };
  } else if (
    (windowAffordance.phase === "ended-completed" ||
      windowAffordance.phase === "ended-cancelled") &&
    (state.windowAffordance.phase === "ended-completed" ||
      state.windowAffordance.phase === "ended-cancelled") &&
    shouldResetOnTerminal(ev)
  ) {
    windowAffordance = initialWindowAffordance;
  }

  // ------------------------------------------------------------------ image-pan-zoom
  let imagePanZoom = state.imagePanZoom;
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
  } else if (ev.type === "wheel") {
    if (imagePanZoom.phase === "panning") {
      // wheel during a pan keeps state; not applicable here — image-zoom
      // handlers react to wheel themselves via separate subscription.
    }
  } else if (ev.type === "pointer-up") {
    if (imagePanZoom.phase === "panning") {
      imagePanZoom = { ...imagePanZoom, phase: "ending" };
    }
  } else if (cancel && imagePanZoom.phase === "panning") {
    imagePanZoom = { ...imagePanZoom, phase: "ending" };
  } else if (
    imagePanZoom.phase === "ending" &&
    state.imagePanZoom.phase === "ending" &&
    shouldResetOnTerminal(ev)
  ) {
    imagePanZoom = initialImagePanZoom;
  }

  // ------------------------------------------------------------------ context-menu
  let contextMenu = state.contextMenu;
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

  // ------------------------------------------------------------------ hover
  let hover = state.hover;
  if (ev.type === "pointer-move" && ev.zone?.iid) {
    hover = { iid: ev.zone.iid, x: ev.pointer.x, y: ev.pointer.y };
  } else if (ev.type === "pointer-down") {
    hover = ev.zone?.iid
      ? { iid: ev.zone.iid, x: ev.pointer.x, y: ev.pointer.y }
      : hover;
  } else if (ev.type === "focus-out") {
    hover = null;
  }

  // ------------------------------------------------------------------ pressedKeys
  let pressedKeys = state.pressedKeys;
  if (ev.type === "key-down") {
    const k = ev.key.key;
    if (k && !pressedKeys.includes(k)) {
      pressedKeys = [...pressedKeys, k];
    }
  } else if (ev.type === "key-up") {
    const k = ev.key.key;
    pressedKeys = pressedKeys.filter((p) => p !== k);
  } else if (ev.type === "focus-out") {
    pressedKeys = [];
  }

  // ------------------------------------------------------------------ active
  const active: ActiveInteraction =
    drag.phase === "pending" ||
    drag.phase === "dragging" ||
    drag.phase === "dropping"
      ? { kind: "drag", state: drag }
      : selectBox.phase === "active"
        ? { kind: "select-box", state: selectBox }
        : windowAffordance.phase === "active"
          ? { kind: "window-affordance", state: windowAffordance }
          : imagePanZoom.phase === "panning"
            ? { kind: "image-pan-zoom", state: imagePanZoom }
            : contextMenu.phase === "open"
              ? { kind: "context-menu", state: contextMenu }
              : { kind: "idle" };

  return {
    ...state,
    active,
    hover,
    pressedKeys,
    drag,
    selectBox,
    windowAffordance,
    imagePanZoom,
    contextMenu,
  };
}

// ============================================================================
// Zustand store wrapping the transition reducer
// ============================================================================

export type InteractionAction = {
  dispatch: (ev: InteractionEvent) => void;
  submitDrag: (sources: string[]) => void;
  cancelDrag: () => void;
};

export const useInteractionStore = create<
  InteractionRootState & InteractionAction
>((set, get) => ({
  ...initialState,
  dispatch: (ev) => set((s) => transition(s, ev)),
  submitDrag: (sources) => {
    const current = get().drag;
    if (current.phase !== "dropping" || current.target === null) {
      set({ drag: { ...current, phase: "ended-cancelled" } });
      return;
    }
    set({ drag: { ...current, sources, phase: "dropping" } });
  },
  cancelDrag: () => set({ drag: initialDrag }),
}));

if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
  // Dev-only debug handle. In production tree-shake removes the
  // window assignment entirely.
  (
    window as unknown as { __interactionStore?: typeof useInteractionStore }
  ).__interactionStore = useInteractionStore;
}

export function resetInteractionStoreForTests() {
  useInteractionStore.setState(
    (s) => ({ ...s, ...(initialState as object) }) as typeof s,
    true
  );
}
