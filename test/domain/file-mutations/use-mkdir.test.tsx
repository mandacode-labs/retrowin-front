import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { useMkdir } from "@/domain/file-mutations";

const API = "https://api.mdrive.mandacode.com";

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function makeClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
}

describe("useMkdir", () => {
  it("invalidates fs queries on 200", async () => {
    server.use(
      http.post("*/v1/drives/:id/fs/mkdir", () =>
        HttpResponse.json({}, { status: 200 })
      )
    );

    const queryClient = makeClient();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const driveID = "drive-1";
    queryClient.setQueryData(
      [`${API}/v1/drives/${driveID}/fs/ls`, { path: "/" }],
      { data: { entries: [] }, status: 200, headers: new Headers() }
    );

    const { result } = renderHook(() => useMkdir(), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      ),
    });

    result.current.mutate({ driveID, data: { path: "/New Folder" } });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalled();
    const call = invalidateSpy.mock.calls[0]?.[0] as
      | { predicate?: (q: unknown) => boolean }
      | undefined;
    expect(call?.predicate).toBeTypeOf("function");

    const predicate = call?.predicate as (q: unknown) => boolean;
    expect(
      predicate({ queryKey: [`${API}/v1/drives/${driveID}/fs/ls`, { path: "/" }] })
    ).toBe(true);
    expect(predicate({ queryKey: [`${API}/v1/drives`] })).toBe(false);
    expect(
      predicate({
        queryKey: ["https://example.com/v1/drives/d-123/fs/ls"],
      })
    ).toBe(false);
  });

  it("does not invalidate fs queries on 401", async () => {
    server.use(
      http.post("*/v1/drives/:id/fs/mkdir", () =>
        new HttpResponse(null, { status: 401 })
      )
    );

    const queryClient = makeClient();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useMkdir(), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      ),
    });

    result.current.mutate({ driveID: "drive-1", data: { path: "/New Folder" } });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(invalidateSpy).not.toHaveBeenCalled();
  });

  it("does not invalidate fs queries on 409 (conflict)", async () => {
    server.use(
      http.post("*/v1/drives/:id/fs/mkdir", () =>
        HttpResponse.json({ code: "conflict" }, { status: 409 })
      )
    );

    const queryClient = makeClient();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useMkdir(), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      ),
    });

    result.current.mutate({ driveID: "drive-1", data: { path: "/New Folder" } });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(invalidateSpy).not.toHaveBeenCalled();
  });
});
