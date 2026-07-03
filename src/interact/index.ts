export type { ActiveInteraction } from "@/interact/active";
export { useActiveInteraction } from "@/interact/adapters/use-active";
export { useContextMenuState } from "@/interact/adapters/use-context-menu";
export {
  type DragView,
  useDrag,
  useIsDragging,
} from "@/interact/adapters/use-drag";
export { useImagePanZoom } from "@/interact/adapters/use-image-pan-zoom";
export { usePressedKeys } from "@/interact/adapters/use-pressed-keys";
export { selectBoxRect, useSelectBox } from "@/interact/adapters/use-select-box";
export { useWindowAffordance } from "@/interact/adapters/use-window-affordance";
export { type Iid, resolveIid } from "@/interact/element-id";
export { hitTest } from "@/interact/hit-test";
export type { PointerRef } from "@/interact/pointer";
export { pointerRef } from "@/interact/pointer";
export {
  type AffordanceKind,
  type ContextMenuRegionState,
  type DragRegionState,
  type ImagePanZoomRegionState,
  type MachineEvent,
  type RuntimeContext,
  type SelectBoxRegionState,
  type WindowAffordanceRegionState,
} from "@/interact/reducer";
export { initialContext, reduce } from "@/interact/reducer";
export type {
  CommitVars,
  CreateInteractionRuntimeOptions,
  InteractionRuntime,
  InteractionSnapshot,
} from "@/interact/store";
export { createInteractionRuntime, useInteractionView } from "@/interact/store";
export type {
  HitZone,
  InteractionEvent,
  KeySnapshot,
  PointerSnapshot,
  WheelSnapshot,
} from "@/interact/snapshots";
export { NO_HIT } from "@/interact/snapshots";
export { InteractionProvider, useInteraction } from "@/interact/runtime";