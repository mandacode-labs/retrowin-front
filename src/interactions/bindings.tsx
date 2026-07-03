"use client";

import { useEffect } from "react";
import { hitTest } from "@/interactions/hit-test";
import { useInteractionStore } from "@/interactions/store";
import {
  type InteractionEvent,
  toKeySnapshot,
  toPointerSnapshot,
  toWheelSnapshot,
} from "@/interactions/types";

/**
 * Single source of pointer / keyboard truth for the whole drive page.
 * Capture phase so we beat any React onMouseDown/onClick handler — this
 * guarantees a consistent ordering when multiple regions share the
 * same DOM ancestor (a window overlap, for example).
 *
 * Per-interaction side effects (mv mutation, mkdir, etc.) are owned by
 * the consuming components, which read `useInteractionStore` selectors
 * and dispatch state mutations through their own buttons. No raw
 * DOM listener lives anywhere else in the app.
 */
export function useGlobalInteractions(): void {
  useEffect(() => {
    if (typeof document === "undefined") return;

    const dispatch = (ev: InteractionEvent) => {
      useInteractionStore.getState().dispatch(ev);
    };

    const onPointerDown = (ev: MouseEvent) =>
      dispatch({
        type: "pointer-down",
        pointer: toPointerSnapshot(ev),
        zone: hitTest(ev.target),
      });
    const onPointerMove = (ev: MouseEvent) => {
      const zone = hitTest(ev.target);
      dispatch({
        type: "pointer-move",
        pointer: toPointerSnapshot(ev),
        zone,
      });
    };
    const onPointerUp = (ev: MouseEvent) =>
      dispatch({
        type: "pointer-up",
        pointer: toPointerSnapshot(ev),
        zone: hitTest(ev.target),
      });
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
