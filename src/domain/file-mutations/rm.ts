import { safeFetch } from "@/core/http";
import type { RmBody } from "@/core/http/types";
import { useSafeMutation } from "@/domain/file-mutations/safe";

export interface RmVars {
  driveID: string;
  data?: RmBody;
}

export function useRm() {
  return useSafeMutation<RmVars, unknown>({
    fn: ({ driveID, data }) =>
      safeFetch("DELETE", `/v1/drives/${driveID}/fs/rm`, data),
    invalidate: "fs",
    errorMessage: "Delete failed",
  });
}
