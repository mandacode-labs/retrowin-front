import { create } from "zustand";
import type { AnyInput } from "@/interactions/events";
import type {
  ContextMenuState,
  DragAndDropState,
  ImagePanZoomState,
  SelectBoxState,
  WindowAffordanceState,
} from "@/interactions/reducers";
import {
  contextMenuReducer,
  dragAndDropReducer,
  INITIAL_CONTEXT_MENU_STATE,
  INITIAL_DRAG_STATE,
  INITIAL_IMAGE_PAN_ZOOM_STATE,
  INITIAL_SELECT_BOX_STATE,
  INITIAL_WINDOW_AFFORDANCE_STATE,
  imagePanZoomReducer,
  selectBoxReducer,
  windowAffordanceReducer,
} from "@/interactions/reducers";

export type HoverInfo = { iid: string; x: number; y: number };

export type InteractionState = {
  drag: DragAndDropState;
  selectBox: SelectBoxState;
  windowAffordance: WindowAffordanceState;
  imagePanZoom: ImagePanZoomState;
  contextMenu: ContextMenuState;
  hover: HoverInfo | null;
};

export type InteractionAction = {
  dispatch: (ev: AnyInput) => void;
  setHover: (hover: HoverInfo | null) => void;
  reset: () => void;
};

const initialState: InteractionState = {
  drag: INITIAL_DRAG_STATE,
  selectBox: INITIAL_SELECT_BOX_STATE,
  windowAffordance: INITIAL_WINDOW_AFFORDANCE_STATE,
  imagePanZoom: INITIAL_IMAGE_PAN_ZOOM_STATE,
  contextMenu: INITIAL_CONTEXT_MENU_STATE,
  hover: null,
};

function isCancelEvent(ev: AnyInput): boolean {
  if (ev.type === "blur") return true;
  if (ev.type === "key" && ev.input.key === "Escape") return true;
  return false;
}

export const useInteractionStore = create<InteractionState & InteractionAction>(
  (set) => ({
    ...initialState,
    dispatch: (ev) =>
      set((s) => {
        const cancel = isCancelEvent(ev);
        return {
          drag:
            cancel && s.drag.phase !== "idle"
              ? dragAndDropReducer(s.drag, {
                  type: "key",
                  input: {
                    key: "Escape",
                    code: "Escape",
                    shiftKey: false,
                    ctrlKey: false,
                    metaKey: false,
                    altKey: false,
                  },
                })
              : dragAndDropReducer(s.drag, ev),
          selectBox: selectBoxReducer(s.selectBox, ev),
          windowAffordance: windowAffordanceReducer(s.windowAffordance, ev),
          imagePanZoom: imagePanZoomReducer(s.imagePanZoom, ev),
          contextMenu: contextMenuReducer(s.contextMenu, ev),
        };
      }),
    setHover: (hover) => set({ hover }),
    reset: () => set(initialState),
  })
);
