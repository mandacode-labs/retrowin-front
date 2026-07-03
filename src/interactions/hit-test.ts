import {
  type Iid,
  resolveAttribute,
  resolveIid,
} from "@/interactions/element-id";
import type { HitZone } from "@/interactions/types";

/**
 * Walk up the DOM from the event target and resolve the first
 * `data-zone` attribute into a typed HitZone. Components are expected
 * to declare their region via:
 *
 *   <div data-iid="..." data-zone="file-item">        …
 *   <div data-iid="..." data-zone="folder-target">    …
 *   <div data-iid="..." data-zone="window-affordance"
 *        data-affordance="move|resize">                …
 *   <div data-iid="..." data-zone="window-content">    …
 *   <section data-iid="..." data-zone="background">    …
 *   <div data-iid="..." data-zone="menu">             …
 *   <div data-iid="..." data-zone="image-pan-zoom">   …
 *
 * Defaults to NO_HIT. The bindings pass the resolved zone into the
 * store reducer alongside the pointer snapshot.
 */
export function hitTest(target: EventTarget | null): HitZone {
  const zone = resolveAttribute(target, "data-zone");
  const iid = resolveIid(target) as Iid | null;
  if (!zone || !iid) return null;
  switch (zone) {
    case "file-item":
      return { kind: "file-item", iid };
    case "folder-target":
      return { kind: "folder-target", iid };
    case "window-affordance": {
      const affordance = resolveAttribute(target, "data-affordance");
      if (affordance !== "move" && affordance !== "resize") return null;
      return { kind: "window-affordance", iid, affordance };
    }
    case "window-content":
      return { kind: "window-content", iid };
    case "background":
      return { kind: "background", iid };
    case "menu":
      return { kind: "menu", iid };
    case "image-pan-zoom":
      return { kind: "image-pan-zoom", iid };
    default:
      return null;
  }
}

export { NO_HIT } from "@/interactions/types";
