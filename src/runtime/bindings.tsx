"use client";

import { useEffect } from "react";
import { useFileStore } from "@/core/stores";
import { parseSerialKey } from "@/core/stores/serial-key";
import { hitTest } from "@/runtime/hit-test";
import { useInteractionStore } from "@/runtime/store";
import {
  type InteractionEvent,
  toKeySnapshot,
  toPointerSnapshot,
  toWheelSnapshot,
} from "@/runtime/types";

/**
 * Single source of pointer / keyboard truth for the whole drive page.
 * Capture phase so we beat any React onMouseDown/onClick handler —
 * guarantees a consistent ordering when multiple regions share the
 * same DOM ancestor (a window overlap, for example).
 *
 * The pointer-down path also reconciles the legacy "click selects the
 * file" coupling: when a user mousedowns on a file-item while no
 * modifier key is pressed, we treat the gesture as a drag origin and
 * mark that item as selected (and clear stale multi-selection when
 * Shift is not held). The drop handler in DragLayer then has a clean
 * `selectedFileSerials` slice to push to mv.
 */
export function useGlobalInteractions(): void {
  useEffect(() => {
    if (typeof document === "undefined") return;

    const dispatch = (ev: InteractionEvent) => {
      useInteractionStore.getState().dispatch(ev);
    };

    function onPointerDown(ev: MouseEvent) {
      const target = ev.target;
      let iid: string | null = null;
      if (target instanceof Element) {
        const node = target.closest<HTMLElement>("[data-iid]");
        iid = node?.dataset.iid ?? null;
      }
      const zone = hitTest(target);

      if (zone?.kind === "file-item" && ev.button === 0 && iid) {
        const fileStore = useFileStore.getState();
        const serial = parseSerialKey(iid);
        if (!ev.shiftKey) {
          const alreadySingle =
            fileStore.selectedFileSerials.length === 1 &&
            fileStore.selectedFileSerials[0] === iid;
          if (!alreadySingle) {
            fileStore.unselectAllFiles();
            fileStore.selectFile(serial.fileKey, serial.windowKey);
          }
        }
      }

      dispatch({
        type: "pointer-down",
        pointer: toPointerSnapshot(ev),
        zone,
      });
    }

    const onPointerMove = (ev: MouseEvent) => {
      const zone = hitTest(ev.target);
      dispatch({
        type: "pointer-move",
        pointer: toPointerSnapshot(ev),
        zone,
      });
    };

    const onPointerUp = (ev: MouseEvent) => {
      dispatch({
        type: "pointer-up",
        pointer: toPointerSnapshot(ev),
        zone: hitTest(ev.target),
      });
    };
    const onContextMenu = (ev: MouseEvent) => {
      ev.preventDefault();
      dispatch({
        type: "context-menu",
        pointer: toPointerSnapshot(ev),
        zone: hitTest(ev.target),
      });
    };
    const onWheel = (ev: WheelEvent) =>
      dispatch({
        type: "wheel",
        wheel: toWheelSnapshot(ev),
        zone: hitTest(ev.target),
      });
    const onKeyDown = (ev: KeyboardEvent) =>
      dispatch({ type: "key-down", key: toKeySnapshot(ev) });
    const onKeyUp = (ev: KeyboardEvent) =>
      dispatch({ type: "key-up", key: toKeySnapshot(ev) });
    const onBlur = () => dispatch({ type: "focus-out" });

    document.addEventListener("mousedown", onPointerDown, true);
    document.addEventListener("mousemove", onPointerMove, true);
    document.addEventListener("mouseup", onPointerUp, true);
    document.addEventListener("contextmenu", onContextMenu, true);
    document.addEventListener("wheel", onWheel, true);
    document.addEventListener("keydown", onKeyDown, true);
    document.addEventListener("keyup", onKeyUp, true);
    window.addEventListener("blur", onBlur);

    return () => {
      document.removeEventListener("mousedown", onPointerDown, true);
      document.removeEventListener("mousemove", onPointerMove, true);
      document.removeEventListener("mouseup", onPointerUp, true);
      document.removeEventListener("contextmenu", onContextMenu, true);
      document.removeEventListener("wheel", onWheel, true);
      document.removeEventListener("keydown", onKeyDown, true);
      document.removeEventListener("keyup", onKeyUp, true);
      window.removeEventListener("blur", onBlur);
    };
  }, []);
}
