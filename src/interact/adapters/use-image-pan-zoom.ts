import type { ImagePanZoomRegionState } from "@/interact/reducer";
import { useInteractionView } from "@/interact/store";

export function useImagePanZoom(): ImagePanZoomRegionState {
  return useInteractionView((s) => s.imagePanZoom);
}
