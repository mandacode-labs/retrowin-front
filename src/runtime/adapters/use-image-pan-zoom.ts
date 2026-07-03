import type { ImagePanZoomRegionState } from "@/runtime/machine";
import { useMachineState } from "@/runtime/runtime";

export function useImagePanZoom(): ImagePanZoomRegionState {
  return useMachineState().context.imagePanZoom;
}
