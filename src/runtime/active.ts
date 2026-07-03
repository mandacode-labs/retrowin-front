export type ActiveInteraction =
  | { kind: "idle" }
  | { kind: "drag" }
  | { kind: "select-box" }
  | { kind: "window-affordance" }
  | { kind: "image-pan-zoom" }
  | { kind: "context-menu" };
