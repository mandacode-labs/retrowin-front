import { safeFetch } from "@/core/http";
import type { MvBody } from "@/core/http/types";
import { partitionCycled } from "@/domain/file-mutations/cycle";
import { useSafeMutation } from "@/domain/file-mutations/safe";

export interface MvVars {
  driveID: string;
  data?: MvBody;
}

const CYCLE_ERROR = "cycle-detected";
const NOOP_ERROR = "no-op";

export function useMv() {
  return useSafeMutation<MvVars, unknown>({
    fn: async ({ driveID, data }) => {
      if (!data) throw new Error(NOOP_ERROR);
      const { safe, rejected } = partitionCycled(
        data.sources,
        data.destination
      );
      if (safe.length === 0) {
        if (rejected.length > 0) throw new Error(CYCLE_ERROR);
        throw new Error(NOOP_ERROR);
      }
      return safeFetch("POST", `/v1/drives/${driveID}/fs/mv`, {
        ...data,
        sources: safe,
      });
    },
    invalidate: "fs",
    silent: true,
    onError: (error) => {
      if (error.message === CYCLE_ERROR) {
        console.warn(
          "[mv] skipped cyclic move (source into self or descendant)"
        );
      }
    },
    errorMessage: () => "Move failed",
  });
}
