export async function startMockService() {
  if (typeof window === "undefined") {
    return;
  }

  const { startWorker } = await import("./browser");
  return startWorker();
}

export {
  type DirNode,
  type DriveRecord,
  type MkdirResult,
  resetMockFilesystem,
} from "@/mocks/filesystem";
