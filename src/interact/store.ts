/**
 * Interaction store. One zustand-backed state object holds the
 * `RuntimeContext`. The runtime is constructed with a single
 * `commit` callback; that callback is invoked exactly once per
 * drop, from inside `dispatch`, where the reducer has already
 * produced the new context.
 *
 * Crucially, the commit callback is **only** called from
 * `dispatch`. React Query's mutation observer state changes cannot
 * loop back through the store to fire another commit because the
 * store's `subscribe` only notifies React (it has no commit
 * responsibility). The previous design's commit-lock + commit-fired
 * cycle is gone.
 */
import { useCallback, useRef, useSyncExternalStore } from "react";
import { create, type StoreApi } from "zustand";
import { useInteractionContext } from "@/interact/context";
import {
  initialContext,
  type MachineEvent,
  type RuntimeContext,
  reduce,
} from "@/interact/reducer";
import type { Iid } from "@/interact/element-id";

export type InteractionSnapshot = RuntimeContext;

type InteractionStore = StoreApi<InteractionSnapshot>;

function createStore(): InteractionStore {
  return create<InteractionSnapshot>(() => initialContext());
}

export type CommitVars = {
  /** iid of the drop target (folder or background). */
  destination: Iid;
};

export type InteractionRuntime = {
  getSnapshot: () => InteractionSnapshot;
  subscribe: (cb: () => void) => () => void;
  dispatch: (ev: MachineEvent) => void;
};

export type CreateInteractionRuntimeOptions = {
  /**
   * Side-effect callback fired exactly once per drop. The runtime
   * calls this from inside `dispatch` when the reducer has just
   * transitioned the drag into the `dropping` phase with a target
   * that wasn't set in the previous snapshot. The callback owns
   * resolving the actual `sources` from the file store and firing
   * the network mutation.
   */
  commit: (vars: CommitVars) => void;
};

export function createInteractionRuntime(
  opts: CreateInteractionRuntimeOptions
): InteractionRuntime {
  const store = createStore();
  const dispatch = (ev: MachineEvent) => {
    const prev = store.getState();
    const next = reduce(prev, ev);
    store.setState(next);
    // A new drop is "drag reached dropping with a target AND the
    // previous snapshot was not already in the dropping phase with
    // that exact target". The phase-equality check skips the
    // dropping → idle reset transition (where target goes from X
    // to null) so we don't re-fire.
    if (
      next.drag.phase === "dropping" &&
      next.drag.target !== null &&
      next.drag.target !== prev.drag.target &&
      prev.drag.phase !== "dropping"
    ) {
      opts.commit({ destination: next.drag.target });
    }
  };
  return {
    getSnapshot: store.getState,
    subscribe: (cb) => store.subscribe(cb),
    dispatch,
  };
}

export const useInteractionRuntime = useInteractionContext;

/**
 * Subscribe to the interaction store via React 18's
 * `useSyncExternalStore`. Selectors are run against the current
 * snapshot and their result is memoised by shallow equality, so
 * selectors that build new objects each call (the common pattern
 * for a `DragView`) don't trigger an infinite render loop.
 */
function shallowEqual<T>(a: T, b: T): boolean {
  if (Object.is(a, b)) return true;
  if (typeof a !== "object" || a === null) return false;
  if (typeof b !== "object" || b === null) return false;
  const aKeys = Object.keys(a as object);
  const bKeys = Object.keys(b as object);
  if (aKeys.length !== bKeys.length) return false;
  for (const k of aKeys) {
    if (
      !Object.prototype.hasOwnProperty.call(b, k) ||
      !Object.is(
        (a as Record<string, unknown>)[k],
        (b as Record<string, unknown>)[k]
      )
    ) {
      return false;
    }
  }
  return true;
}

export function useInteractionView(): InteractionSnapshot;
export function useInteractionView<T>(
  selector: (snapshot: InteractionSnapshot) => T
): T;
export function useInteractionView<T>(
  selector?: (snapshot: InteractionSnapshot) => T
): T | InteractionSnapshot {
  const runtime = useInteractionRuntime();
  const sel = selector ?? ((s: InteractionSnapshot) => s as unknown as T);
  const lastRef = useRef<{ snap: InteractionSnapshot; value: T } | null>(null);
  const selRef = useRef(sel);
  selRef.current = sel;

  const memoised = useCallback((): T => {
    const snap = runtime.getSnapshot();
    const last = lastRef.current;
    if (last && last.snap === snap) return last.value;
    const value = selRef.current(snap);
    if (last && shallowEqual(last.value as unknown, value as unknown)) {
      lastRef.current = { snap, value: last.value };
      return last.value;
    }
    lastRef.current = { snap, value };
    return value;
  }, [runtime]);

  return useSyncExternalStore(runtime.subscribe, memoised, memoised);
}