import { HttpResponse, http } from "msw";
import type { User } from "@/core/http/types";
import {
  mockCreateDrive,
  mockDeleteDrive,
  mockGetDrive,
  mockListDeletedDrives,
  mockListDrives,
  mockLs,
  mockMkdir,
  mockMv,
  mockRestoreDrive,
  mockRm,
} from "@/mocks/filesystem";

/**
 * The custom handlers layered on top of the Orval-generated mocks.
 *
 * MSW applies handlers in **reverse-registration** order, so as long
 * as this list is registered first (see `mocks/browser.ts`), these
 * routes take precedence over the static generated mocks — and they
 * read and mutate the in-memory filesystem store instead of returning
 * the empty static fixtures.
 *
 * The generated handlers still cover routes we do not list here
 * (e.g. auth/callback, drive/storage, cat, write, symlink, hardlink,
 * mount, readlink, realpath, presigned download/upload) so the dev
 * console never sees "unhandled request" noise.
 */

const API = "https://api.mdrive.mandacode.com";

const MOCK_USER: User = {
  id: "user-1",
  publicID: "mock-public-id",
  name: "Mock User",
  email: "mock@example.com",
  provider: "google",
  providerID: "mock-provider-id",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

function json<T>(body: T, status = 200) {
  return HttpResponse.json(body as never, { status });
}

const driveIdPattern = /^\/?v1\/drives\/([^/]+)/;

export const customHandlers = [
  // auth/me — always returns the mock user so the dev session is
  // authenticated without a real backend round-trip.
  http.get(/\/?auth\/me$/, () => json(MOCK_USER)),

  http.get(`${API}/v1/drives`, () => json(mockListDrives())),
  http.get(`${API}/v1/admin/drives/deleted`, () =>
    json(mockListDeletedDrives())
  ),

  http.post(`${API}/v1/drives`, async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as {
      name?: string;
      description?: string;
    };
    const name = body.name?.trim() || "Untitled";
    const description = body.description ?? "";
    const created = mockCreateDrive(name, description);
    return created ? json(created, 201) : json({ code: "bad_request" }, 400);
  }),

  http.get(driveIdPattern, ({ params }) => {
    const id = params[0];
    const drive = mockGetDrive(String(id));
    return drive ? json(drive) : json({ code: "not_found" }, 404);
  }),

  http.delete(driveIdPattern, ({ params }) => {
    const id = String(params[0]);
    return mockDeleteDrive(id)
      ? new HttpResponse(null, { status: 204 })
      : json({ code: "not_found" }, 404);
  }),

  http.post(`${API}/v1/drives/:driveID/restore`, ({ params }) => {
    const id = String(params["driveID"]);
    return mockRestoreDrive(id)
      ? new HttpResponse(null, { status: 204 })
      : json({ code: "not_found" }, 404);
  }),

  http.get(`${API}/v1/drives/:driveID/fs/ls`, ({ params, request }) => {
    const id = String(params["driveID"]);
    const url = new URL(request.url);
    const path = url.searchParams.get("path") ?? "/";
    const content = mockLs(id, path);
    return content ? json(content) : json({ code: "not_found" }, 404);
  }),

  http.post(
    `${API}/v1/drives/:driveID/fs/mkdir`,
    async ({ request, params }) => {
      const id = String(params["driveID"]);
      const body = (await request.json().catch(() => ({}))) as {
        path?: string;
      };
      if (!body.path) return json({ code: "bad_request" }, 400);
      const result = mockMkdir(id, body.path);
      return result.ok
        ? new HttpResponse(null, { status: 200 })
        : json({ code: "conflict" }, result.status);
    }
  ),

  http.post(`${API}/v1/drives/:driveID/fs/mv`, async ({ request, params }) => {
    const id = String(params["driveID"]);
    const body = (await request.json().catch(() => ({}))) as {
      sources?: string[];
      destination?: string;
    };
    if (!body.sources || !body.destination) {
      return json({ code: "bad_request" }, 400);
    }
    const result = mockMv(id, body.sources, body.destination);
    return result.ok
      ? new HttpResponse(null, { status: 200 })
      : json({ code: "conflict" }, result.status);
  }),

  http.delete(
    `${API}/v1/drives/:driveID/fs/rm`,
    async ({ request, params }) => {
      const id = String(params["driveID"]);
      const body = (await request.json().catch(() => ({}))) as {
        paths?: string[];
        recursive?: boolean;
      };
      if (!body.paths) return json({ code: "bad_request" }, 400);
      const result = mockRm(id, body.paths, body.recursive ?? true);
      return result.ok
        ? new HttpResponse(null, { status: 200 })
        : json({ code: "conflict" }, result.status);
    }
  ),
];
