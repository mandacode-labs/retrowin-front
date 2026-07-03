/**
 * In-memory mock filesystem for the MSW dev/test intercept layer.
 *
 * Tracks drives (created/deleted state) and a per-drive POSIX-like
 * directory tree. Mutates operations invoked by the rest of the
 * app (mkdir, mv, rm, touch, ls, stat, write, cat, readlink, etc.)
 * so the UI sees a coherent workflow without a running backend.
 *
 * Reset between scenarios is handled by `resetMockFilesystem()`,
 * exposed via `mocks/msw-runtime.ts`. Every handler below reads
 * through this module so dev sessions share the same in-process
 * store.
 */

import type { DirContent, DirEntry } from "@/core/http/types";
import { BackendFileType } from "@/entities/file";

export type DirNode = {
  name: string;
  type: BackendFileType;
  contents: Map<string, DirNode>;
};

export type DriveRecord = {
  id: string;
  name: string;
  description: string;
  deleted: boolean;
  root: DirNode;
  createdAt: string;
  updatedAt: string;
};

function makeNode(
  name: string,
  type: BackendFileType,
  children: Array<[string, DirNode]> = []
): DirNode {
  return { name, type, contents: new Map(children) };
}

function nowIso(): string {
  return new Date().toISOString();
}

function emptyDir(): DirNode {
  return { name: "", type: BackendFileType.Directory, contents: new Map() };
}

function seedDrive(id: string, name: string, description: string): DriveRecord {
  return {
    id,
    name,
    description,
    deleted: false,
    root: emptyDir(),
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
}

const drives = new Map<string, DriveRecord>();
const deletedDrives = new Map<string, DriveRecord>();

function seedFixtures() {
  drives.clear();
  deletedDrives.clear();
  const system = seedDrive("system", "System", "Software and config");
  drives.set(system.id, system);

  const docs = seedDrive("docs-drive", "Documents", "Default Documents drive");
  docs.root.contents.set(
    "Notes.md",
    makeNode("Notes.md", BackendFileType.Regular)
  );
  docs.root.contents.set(
    "Photos",
    makeNode("Photos", BackendFileType.Directory, [
      ["beach.jpg", makeNode("beach.jpg", BackendFileType.Regular)],
    ])
  );
  drives.set(docs.id, docs);

  const media = seedDrive("media-drive", "Media", "Movies and audio");
  media.root.contents.set(
    "Album",
    makeNode("Album", BackendFileType.Directory, [
      ["track1.mp3", makeNode("track1.mp3", BackendFileType.Regular)],
      ["track2.mp3", makeNode("track2.mp3", BackendFileType.Regular)],
    ])
  );
  drives.set(media.id, media);
}

seedFixtures();

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

function normalizePath(path: string): string {
  if (!path) return "/";
  if (path === "/") return "/";
  const parts: string[] = [];
  for (const seg of path.split("/")) {
    if (!seg || seg === ".") continue;
    if (seg === "..") parts.pop();
    else parts.push(seg);
  }
  return "/" + parts.join("/");
}

function getDir(
  drive: DriveRecord,
  path: string
): { node: DirNode; parent: DirNode | null; last: string } | { error: string } {
  const normalized = normalizePath(path);
  if (normalized === "/") {
    return { node: drive.root, parent: null, last: "" };
  }
  const segments = normalized.split("/").filter(Boolean);
  let parent: DirNode = drive.root;
  for (const seg of segments.slice(0, -1)) {
    const next = parent.contents.get(seg);
    if (!next || next.type !== BackendFileType.Directory) {
      return { error: `no such directory: ${seg}` };
    }
    parent = next;
  }
  const last = segments[segments.length - 1];
  const node = parent.contents.get(last);
  if (!node) {
    return { error: `no such entry: ${last}` };
  }
  return { node, parent, last };
}

function findDir(drive: DriveRecord, path: string): DirNode | null {
  const got = getDir(drive, path);
  if ("error" in got) return null;
  if (got.node.type !== BackendFileType.Directory) return null;
  return got.node;
}

function parentDir(
  drive: DriveRecord,
  path: string
): { parent: DirNode; last: string } | { error: string } {
  const normalized = normalizePath(path);
  if (normalized === "/") {
    return { error: "cannot create at root" };
  }
  const segments = normalized.split("/").filter(Boolean);
  const last = segments[segments.length - 1];
  let parent: DirNode = drive.root;
  for (const seg of segments.slice(0, -1)) {
    const next = parent.contents.get(seg);
    if (!next || next.type !== BackendFileType.Directory) {
      return { error: `no such directory: ${seg}` };
    }
    parent = next;
  }
  return { parent, last };
}

function entriesOf(node: DirNode): DirContent {
  const entries: DirEntry[] = [];
  for (const [name, child] of node.contents.entries()) {
    entries.push({
      inodeID: `inode-${name}-${Math.floor(Math.random() * 1e6)}`,
      name,
      type: child.type === BackendFileType.Directory ? "directory" : child.type,
    });
  }
  return { entries };
}

// ----------------------------------------------------------------------------
// Drive surface
// ----------------------------------------------------------------------------

export function mockListDrives(includeDeleted = false) {
  const arr = Array.from(drives.values()).filter((d) => !d.deleted);
  void includeDeleted;
  return arr.map((d) => ({
    id: d.id,
    name: d.name,
    description: d.description,
    ownerID: "user-1",
    rootNodeID: `root-${d.id}`,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  }));
}

export function mockListDeletedDrives() {
  return Array.from(deletedDrives.values()).map((d) => ({
    id: d.id,
    name: d.name,
    description: d.description,
    ownerID: "user-1",
    rootNodeID: `root-${d.id}`,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  }));
}

export function mockGetDrive(id: string) {
  const d = drives.get(id);
  if (!d) return null;
  return {
    id: d.id,
    name: d.name,
    description: d.description,
    ownerID: "user-1",
    rootNodeID: `root-${d.id}`,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  };
}

export function mockCreateDrive(name: string, description: string) {
  const id = `drive-${Math.floor(Math.random() * 1e6)}`;
  const now = nowIso();
  const drive: DriveRecord = {
    id,
    name,
    description,
    deleted: false,
    root: emptyDir(),
    createdAt: now,
    updatedAt: now,
  };
  drives.set(id, drive);
  return mockGetDrive(id);
}

export function mockDeleteDrive(id: string) {
  const d = drives.get(id);
  if (!d) return false;
  d.deleted = true;
  d.updatedAt = nowIso();
  drives.delete(id);
  deletedDrives.set(id, d);
  return true;
}

export function mockRestoreDrive(id: string) {
  const d = deletedDrives.get(id);
  if (!d) return false;
  d.deleted = false;
  d.updatedAt = nowIso();
  drives.set(id, d);
  deletedDrives.delete(id);
  return true;
}

export function mockLs(driveID: string, path: string): DirContent | null {
  const drive = drives.get(driveID);
  if (!drive) return null;
  if (path === "/" || path === "") return entriesOf(drive.root);
  const dir = findDir(drive, path);
  if (!dir) return null;
  return entriesOf(dir);
}

export type MkdirResult =
  | { ok: true }
  | { ok: false; status: number; body: unknown };

export function mockMkdir(driveID: string, path: string): MkdirResult {
  const drive = drives.get(driveID);
  if (!drive) return { ok: false, status: 404, body: { code: "not_found" } };
  const resolved = parentDir(drive, path);
  if ("error" in resolved) {
    return { ok: false, status: 400, body: { code: "bad_request" } };
  }
  if (resolved.parent.contents.has(resolved.last)) {
    return { ok: false, status: 409, body: { code: "conflict" } };
  }
  resolved.parent.contents.set(
    resolved.last,
    makeNode(resolved.last, BackendFileType.Directory)
  );
  drive.updatedAt = nowIso();
  return { ok: true };
}

export function mockMv(
  driveID: string,
  sources: string[],
  destination: string
): { ok: boolean; status: number; body?: unknown } {
  const drive = drives.get(driveID);
  if (!drive) return { ok: false, status: 404 };

  // Reject moves that would cause a directory to be moved into
  // itself or one of its descendants — the cycle check that is
  // also enforced client-side in `domain/file-mutations/cycle.ts`.
  for (const src of sources) {
    if (src === destination) {
      return { ok: false, status: 400, body: { code: "cycle" } };
    }
    if (destination.startsWith(`${src}/`)) {
      return { ok: false, status: 400, body: { code: "cycle" } };
    }
  }

  const dest = parentDir(drive, destination);
  if ("error" in dest) {
    return { ok: false, status: 400 };
  }
  if (dest.parent.contents.has(dest.last)) {
    return { ok: false, status: 409 };
  }
  for (const src of sources) {
    const got = getDir(drive, src);
    if ("error" in got) continue;
    if (!got.parent || !got.last) continue;
    got.parent.contents.delete(got.last);
    dest.parent.contents.set(dest.last, { ...got.node, name: dest.last });
  }
  drive.updatedAt = nowIso();
  return { ok: true, status: 200 };
}

export function mockRm(
  driveID: string,
  paths: string[],
  recursive: boolean
): { ok: boolean; status: number } {
  const drive = drives.get(driveID);
  if (!drive) return { ok: false, status: 404 };
  for (const path of paths) {
    if (path === "/" || path === "") continue;
    const resolved = parentDir(drive, path);
    if ("error" in resolved) continue;
    if (resolved.parent.contents.has(resolved.last)) {
      const node = resolved.parent.contents.get(resolved.last);
      if (
        node &&
        node.type === BackendFileType.Directory &&
        node.contents.size > 0 &&
        !recursive
      ) {
        return { ok: false, status: 409 };
      }
      resolved.parent.contents.delete(resolved.last);
    }
  }
  drive.updatedAt = nowIso();
  return { ok: true, status: 200 };
}

export function resetMockFilesystem() {
  seedFixtures();
}
