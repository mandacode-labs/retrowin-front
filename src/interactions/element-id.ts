export type Iid = string;

export function resolveIid(target: EventTarget | null): Iid | null {
  if (typeof target === "undefined" || target === null) return null;
  if (!(target instanceof Element)) return null;
  const node = target.closest<HTMLElement>("[data-iid]");
  return node?.dataset.iid ?? null;
}
