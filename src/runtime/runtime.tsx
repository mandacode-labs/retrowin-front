"use client";

import { useEffect, useSyncExternalStore } from "react";
import { createActor } from "xstate";
import { useFileStore } from "@/core/stores/file.store";
import { parseSerialKey } from "@/core/stores/serial-key";
import { partitionCycled } from "@/domain/file-mutations/cycle";
import { useMv } from "@/domain/file-mutations/mv";
import { hitTest } from "@/runtime/hit-test";
import { type MachineEvent, makeMachine } from "@/runtime/machine";
import { pointerRef } from "@/runtime/refs";
import {
  toKeySnapshot,
  toPointerSnapshot,
  toWheelSnapshot,
} from "@/runtime/types";

type RuntimeActor = ReturnType<
  typeof createActor<ReturnType<typeof makeMachine>>
>;
export type InteractionSnapshot = ReturnType<RuntimeActor["getSnapshot"]>;

let singletonActor: RuntimeActor | null = null;
function getActor(): RuntimeActor {
  if (!singletonActor) {
    singletonActor = createActor(makeMachine());
    singletonActor.start();
    if (
      typeof window !== "undefined" &&
      process.env.NODE_ENV !== "production"
    ) {
      (
        window as unknown as { __interactionActor?: RuntimeActor }
      ).__interactionActor = singletonActor;
    }
  }
  return singletonActor;
}

let mountCount = 0;
let detach: (() => void) | null = null;

export function usePointerRuntime(): void {
  const mv = useMv();

  useEffect(() => {
    const actor = getActor();
    mountCount += 1;
    if (mountCount > 1) return;

    const dispatch = (ev: MachineEvent) => actor.send(ev);

    function onPointerDown(ev: MouseEvent) {
      const zone = hitTest(ev.target);
      pointerRef.zone = zone;
      dispatch({ type: "pointer-down", pointer: toPointerSnapshot(ev), zone });
      if (zone?.kind === "file-item" && ev.button === 0 && !ev.shiftKey) {
        const fileStore = useFileStore.getState();
        const serial = parseSerialKey(zone.iid);
        const alreadySingle =
          fileStore.selectedFileSerials.length === 1 &&
          fileStore.selectedFileSerials[0] === zone.iid;
        if (!alreadySingle) {
          fileStore.unselectAllFiles();
          fileStore.selectFile(serial.fileKey, serial.windowKey);
        }
      }
    }

    function onPointerMove(ev: MouseEvent) {
      const zone = hitTest(ev.target);
      pointerRef.zone = zone;
      const snapshot = toPointerSnapshot(ev);
      pointerRef.pointer = snapshot;
      dispatch({ type: "pointer-move", pointer: snapshot, zone });
    }

    function onPointerUp(ev: MouseEvent) {
      const zone = hitTest(ev.target);
      pointerRef.zone = zone;
      dispatch({ type: "pointer-up", pointer: toPointerSnapshot(ev), zone });
    }

    function onContextMenu(ev: MouseEvent) {
      ev.preventDefault();
      const zone = hitTest(ev.target);
      pointerRef.zone = zone;
      const snapshot = toPointerSnapshot(ev);
      pointerRef.pointer = snapshot;
      dispatch({ type: "context-menu", pointer: snapshot, zone });
    }

    function onWheel(ev: WheelEvent) {
      const zone = hitTest(ev.target);
      pointerRef.zone = zone;
      dispatch({ type: "wheel", wheel: toWheelSnapshot(ev), zone });
    }

    function onKeyDown(ev: KeyboardEvent) {
      const k = toKeySnapshot(ev);
      dispatch({ type: "key-down", key: k.key, code: k.code });
    }

    function onKeyUp(ev: KeyboardEvent) {
      const k = toKeySnapshot(ev);
      dispatch({ type: "key-up", key: k.key });
    }

    function onBlur() {
      dispatch({ type: "focus-out" });
    }

    document.addEventListener("mousedown", onPointerDown, true);
    document.addEventListener("mousemove", onPointerMove, true);
    document.addEventListener("mouseup", onPointerUp, true);
    document.addEventListener("contextmenu", onContextMenu, true);
    document.addEventListener("wheel", onWheel, true);
    document.addEventListener("keydown", onKeyDown, true);
    document.addEventListener("keyup", onKeyUp, true);
    window.addEventListener("blur", onBlur);

    // rAF tick: pointer data lives in `pointerRef` (not React state)
    // and we commit the drop here once the drag machine enters
    // `dropping`. Single-fire per drop — `committedTarget` resets
    // when the machine returns to `idle`.
    let cancelled = false;
    let committedTarget: string | null = null;
    let raf = 0;
    const tick = () => {
      if (cancelled) return;
      const snap = actor.getSnapshot();
      const drop = snap.context.drag;
      if (
        drop.phase === "dropping" &&
        drop.target &&
        drop.target !== committedTarget
      ) {
        committedTarget = drop.target;
        // The drag target is encoded as `data-iid="<fileKey>:<windowKey>"`
        // by `file-item` and `folder-target` zones. Strip the
        // window-key suffix so the backend gets a clean POSIX path.
        const destFileKey = parseSerialKey(drop.target).fileKey || "/";
        const ws = (
          window as {
            __windowStore?: {
              getState: () => { windows: Array<{ driveID?: string }> };
            };
          }
        ).__windowStore?.getState();
        const driveID =
          ws?.windows.find((w) => Boolean(w.driveID))?.driveID ?? "";
        const serialKeys = useFileStore.getState().selectedFileSerials;
        const sources = serialKeys
          .map((s) => parseSerialKey(s).fileKey)
          .filter((p) => p !== destFileKey);
        const { safe, rejected } = partitionCycled(sources, destFileKey);
        if (safe.length > 0) {
          mv.run({
            driveID,
            data: { sources: safe, destination: destFileKey },
          });
        } else if (rejected.length > 0) {
          console.warn(
            "[runtime] drop cycle skipped: source into self or descendant"
          );
        }
      }
      if (snap.context.drag.phase === "idle") {
        committedTarget = null;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    detach = () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      document.removeEventListener("mousedown", onPointerDown, true);
      document.removeEventListener("mousemove", onPointerMove, true);
      document.removeEventListener("mouseup", onPointerUp, true);
      document.removeEventListener("contextmenu", onContextMenu, true);
      document.removeEventListener("wheel", onWheel, true);
      document.removeEventListener("keydown", onKeyDown, true);
      document.removeEventListener("keyup", onKeyUp, true);
      window.removeEventListener("blur", onBlur);
      detach = null;
    };

    return () => {
      mountCount -= 1;
      if (mountCount === 0) detach?.();
    };
  }, [mv]);
}

export function useMachineState() {
  return useMachineStateImpl();
}

function useMachineStateImpl(): InteractionSnapshot {
  const actor = getActor();
  return useSyncExternalStore(
    (cb) => {
      const sub = actor.subscribe(cb);
      return () => sub.unsubscribe();
    },
    () => actor.getSnapshot(),
    () => actor.getSnapshot()
  );
}
