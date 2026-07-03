export type Iid = string;

export type PointerInput = {
  pointerId: number;
  x: number;
  y: number;
  button: number;
  buttons: number;
  shiftKey: boolean;
  ctrlKey: boolean;
  metaKey: boolean;
  altKey: boolean;
};

export type WheelInput = {
  x: number;
  y: number;
  deltaX: number;
  deltaY: number;
  deltaZ: number;
  ctrlKey: boolean;
  metaKey: boolean;
};

export type KeyInput = {
  key: string;
  code: string;
  shiftKey: boolean;
  ctrlKey: boolean;
  metaKey: boolean;
  altKey: boolean;
};

export type AnyInput =
  | { type: "down"; iid: Iid | null; input: PointerInput }
  | { type: "move"; input: PointerInput }
  | { type: "up"; iid: Iid | null; input: PointerInput }
  | { type: "contextmenu"; iid: Iid | null; input: PointerInput }
  | { type: "wheel"; iid: Iid | null; input: WheelInput }
  | { type: "key"; input: KeyInput }
  | { type: "blur" };
