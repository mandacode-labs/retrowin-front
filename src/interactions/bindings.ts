"use client";

import { useEffect } from "react";
import { resolveIid } from "@/interactions/element-id";
import type {
  AnyInput,
  KeyInput,
  PointerInput,
  WheelInput,
} from "@/interactions/events";
import { useInteractionStore } from "@/interactions/store";

function toPointerInput(ev: MouseEvent): PointerInput {
  return {
    pointerId: -1,
    x: ev.clientX,
    y: ev.clientY,
    button: ev.button,
    buttons: ev.buttons,
    shiftKey: ev.shiftKey,
    ctrlKey: ev.ctrlKey,
    metaKey: ev.metaKey,
    altKey: ev.altKey,
  };
}

function toWheelInput(ev: WheelEvent): WheelInput {
  return {
    x: ev.clientX,
    y: ev.clientY,
    deltaX: ev.deltaX,
    deltaY: ev.deltaY,
    deltaZ: ev.deltaZ,
    ctrlKey: ev.ctrlKey,
    metaKey: ev.metaKey,
  };
}

function toKeyInput(ev: KeyboardEvent): KeyInput {
  return {
    key: ev.key,
    code: ev.code,
    shiftKey: ev.shiftKey,
    ctrlKey: ev.ctrlKey,
    metaKey: ev.metaKey,
    altKey: ev.altKey,
  };
}

export function useGlobalInteractions(): void {
  useEffect(() => {
    if (typeof document === "undefined") return;

    const dispatch = (ev: AnyInput) => {
      useInteractionStore.getState().dispatch(ev);
    };

    function onMouseDown(ev: MouseEvent) {
      dispatch({
        type: "down",
        iid: resolveIid(ev.target),
        input: toPointerInput(ev),
      });
    }
    function onMouseMove(ev: MouseEvent) {
      dispatch({ type: "move", input: toPointerInput(ev) });
    }
    function onMouseUp(ev: MouseEvent) {
      dispatch({
        type: "up",
        iid: resolveIid(ev.target),
        input: toPointerInput(ev),
      });
    }
    function onContextMenu(ev: MouseEvent) {
      ev.preventDefault();
      dispatch({
        type: "contextmenu",
        iid: resolveIid(ev.target),
        input: toPointerInput(ev),
      });
    }
    function onWheel(ev: WheelEvent) {
      dispatch({
        type: "wheel",
        iid: resolveIid(ev.target),
        input: toWheelInput(ev),
      });
    }
    function onKeyDown(ev: KeyboardEvent) {
      dispatch({ type: "key", input: toKeyInput(ev) });
    }
    function onBlur() {
      dispatch({ type: "blur" });
    }

    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    document.addEventListener("contextmenu", onContextMenu);
    document.addEventListener("wheel", onWheel, { passive: false });
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("blur", onBlur);

    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      document.removeEventListener("contextmenu", onContextMenu);
      document.removeEventListener("wheel", onWheel);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("blur", onBlur);
    };
  }, []);
}
