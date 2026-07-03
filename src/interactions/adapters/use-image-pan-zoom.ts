import type { ImagePanZoomState } from "@/interactions/store";
import { useInteractionStore } from "@/interactions/store";

export function useImagePanZoom(): ImagePanZoomState {
  return useInteractionStore((s) => s.imagePanZoom);
}
