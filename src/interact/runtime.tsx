"use client";

import {
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { useFileStore } from "@/infra/stores";
import { parseSerialKey } from "@/infra/stores/serial-key";
import { partitionCycled } from "@/domain/file-mutations/cycle";
import { useMv } from "@/domain/file-mutations/mv";
import {
  InteractionContextProvider,
  useInteractionContext,
} from "@/interact/context";
import { hitTest } from "@/interact/hit-test";
import { pointerRef } from "@/interact/pointer";
import {
  createInteractionRuntime,
  type CommitVars,
  type InteractionRuntime,
  type InteractionSnapshot,
} from "@/interact/store";
import {
  toKeySnapshot,
  toPointerSnapshot,
  toWheelSnapshot,
} from "@/interact/snapshots";
import { initialContext } from "@/interact/reducer";

export { useInteractionContext as useInteraction };

if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
  (
    window as unknown as { __getInteractionSnapshot?: () => InteractionSnapshot }
  ).__getInteractionSnapshot = () => {
    const r = activeRuntime();
    return r ? r.getSnapshot() : initialContext();
  };
}

let active: InteractionRuntime | null = null;

function activeRuntime(): InteractionRuntime | null {
  return active;
}

/**
 * Single React binding for the interaction runtime. The runtime is
 * constructed with a `commit` callback that owns resolving the
 * current selection and firing the network mutation. This provider
 * just wires up the document-level listeners and hands the runtime
 * to React via context.
 */
export function InteractionProvider({ children }: { children: ReactNode }) {
  const mv = useMv();

  // `commit` reads `mv`, which is a React Query mutation observer
  // and re-renders the provider on every mutation state change.
  // We can't put `mv` in `useCallback` deps (it would rebuild the
  // runtime + document listener on every state tick) and we can't
  // put `mv` in `useMemo` deps for `runtime` (same problem). So we
  // keep a mutable ref that the dispatch path reads at call time
  // — the runtime itself is built once.
  const commitRef = useRef<(vars: CommitVars) => void>(() => {});
  commitRef.current = (vars: CommitVars) => {
    try {
      const destFileKey = parseSerialKey(vars.destination).fileKey || "/";
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
        void mv
          .run({
            driveID,
            data: { sources: safe, destination: destFileKey },
          })
          .catch((err: Error) => {
            if (err?.message?.includes("Failed to fetch")) return;
            console.warn("[interact] mv commit failed", err);
          });
      } else if (rejected.length > 0) {
        console.warn(
          "[interact] drop cycle skipped: source into self or descendant"
        );
      }
    } catch (err) {
      console.warn("[interact] commit error", err);
    }
  };

  const runtime = useMemo(
    () => createInteractionRuntime({ commit: (vars) => commitRef.current(vars) }),
    []
  );

  useEffect(() => {
    active = runtime;
    return () => {
      if (active === runtime) active = null;
    };
  }, [runtime]);

  useEffect(() => {
    if (typeof document === "undefined") return;

    function onPointerDown(ev: MouseEvent) {
      const zone = hitTest(ev.target);
      pointerRef.zone = zone;
      const pointer = toPointerSnapshot(ev);
      pointerRef.pointer = pointer;
      runtime.dispatch({ type: "pointer-down", pointer, zone });
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
      const pointer = toPointerSnapshot(ev);
      pointerRef.pointer = pointer;
      runtime.dispatch({ type: "pointer-move", pointer, zone });
    }

    function onPointerUp(ev: MouseEvent) {
      const zone = hitTest(ev.target);
      pointerRef.zone = zone;
      runtime.dispatch({
        type: "pointer-up",
        pointer: toPointerSnapshot(ev),
        zone,
      });
    }

    function onContextMenu(ev: MouseEvent) {
      ev.preventDefault();
      const zone = hitTest(ev.target);
      pointerRef.zone = zone;
      const pointer = toPointerSnapshot(ev);
      pointerRef.pointer = pointer;
      runtime.dispatch({ type: "context-menu", pointer, zone });
    }

    function onWheel(ev: WheelEvent) {
      const zone = hitTest(ev.target);
      pointerRef.zone = zone;
      runtime.dispatch({
        type: "wheel",
        wheel: toWheelSnapshot(ev),
        zone,
      });
    }

    function onKeyDown(ev: KeyboardEvent) {
      const k = toKeySnapshot(ev);
      runtime.dispatch({ type: "key-down", key: k.key, code: k.code });
    }

    function onKeyUp(ev: KeyboardEvent) {
      const k = toKeySnapshot(ev);
      runtime.dispatch({ type: "key-up", key: k.key });
    }

    function onBlur() {
      runtime.dispatch({ type: "focus-out" });
    }

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
  }, [runtime]);

  return (
    <InteractionContextProvider runtime={runtime}>
      {children}
    </InteractionContextProvider>
  );
}