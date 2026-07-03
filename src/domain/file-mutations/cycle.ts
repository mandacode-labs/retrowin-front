import { normalize } from "@/infra/path";

/**
 * `wouldCycle` returns true when moving one or more sources into
 * `destination` would either (a) move a node into itself, or (b)
 * move a directory into one of its own descendants. Both move
 * operations would cause POSIX-level ".. or traversal past root"
 * errors on the backend, but the real issue is that we never want
 * to silently drop a user's request — we want to skip the offending
 * subset and continue with the rest.
 */
export function wouldCycle(
  sources: ReadonlyArray<string>,
  destination: string
): boolean {
  if (destination === "/" || destination === "") return false;
  const normalizedDestination = normalize(destination);
  if (normalizedDestination === "/") return false;

  for (const raw of sources) {
    const source = normalize(raw);
    if (source === normalizedDestination) return true;
    if (
      source !== "/" &&
      (normalizedDestination === source ||
        normalizedDestination.startsWith(`${source}/`))
    ) {
      return true;
    }
  }
  return false;
}

/**
 * Splits a list of sources into the safe subset (no cycle) and the
 * rejected subset (would form a cycle). The caller can mutate the
 * safe subset and report the rejected subset back to the user.
 */
export function partitionCycled(
  sources: ReadonlyArray<string>,
  destination: string
): { safe: string[]; rejected: string[] } {
  if (wouldCycle(sources, destination)) {
    return { safe: [], rejected: [...sources] };
  }
  return { safe: [...sources], rejected: [] };
}
