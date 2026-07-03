import { useSafeMutation } from "@/domain/file-mutations/safe";
import { safeFetch } from "@/infra/http";
import type { RmBody } from "@/infra/http/types";

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
