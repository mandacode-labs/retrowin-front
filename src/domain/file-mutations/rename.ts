import { useMv } from "@/domain/file-mutations/mv";
import { dirname } from "@/infra/path";

export interface RenameVars {
  driveID: string;
  path: string;
  newName: string;
}

/**
 * Rename = same-directory move. The backend has no dedicated rename
 * endpoint, so we reuse mv with a destination built from the source's
 * directory + new name.
 */
export function useRename() {
  const mv = useMv();
  return {
    ...mv,
    run: async (vars: RenameVars) =>
      mv.run({
        driveID: vars.driveID,
        data: {
          sources: [vars.path],
          destination: `${dirname(vars.path) || ""}/${vars.newName}`,
        },
      }),
  };
}
