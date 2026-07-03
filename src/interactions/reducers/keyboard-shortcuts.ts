import type { AnyInput, KeyInput } from "@/interactions/events";

export type ShortcutAction =
  | { kind: "noop" }
  | { kind: "close-menu" }
  | { kind: "cancel-active-interaction" }
  | { kind: "select-all" };

export function shortcutFor(input: KeyInput): ShortcutAction {
  const key = input.key;
  if (key === "Escape") return { kind: "cancel-active-interaction" };
  if (key === "a" && (input.metaKey || input.ctrlKey))
    return { kind: "select-all" };
  return { kind: "noop" };
}

export function keyboardReducer(_state: unknown, ev: AnyInput) {
  if (ev.type !== "key") return null;
  return shortcutFor(ev.input);
}
