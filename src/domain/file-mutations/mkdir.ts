import { useSafeMutation } from "@/domain/file-mutations/safe";
import { safeFetch } from "@/infra/http";
import type { MkdirBody } from "@/infra/http/types";

export interface MkdirVars {
  driveID: string;
  data?: MkdirBody;
}

export function useMkdir() {
  return useSafeMutation<MkdirVars, unknown>({
    fn: ({ driveID, data }) =>
      safeFetch("POST", `/v1/drives/${driveID}/fs/mkdir`, data),
    invalidate: "fs",
    errorMessage: "Create Folder failed",
  });
}
