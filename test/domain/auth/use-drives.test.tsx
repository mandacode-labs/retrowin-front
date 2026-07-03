import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { useDrives } from "@/domain/auth";
import { makeDrive } from "@/factories";

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("useDrives", () => {
  it("returns empty on 401", async () => {
    server.use(
      http.get("*/v1/drives", () => new HttpResponse(null, { status: 401 }))
    );

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    const { result } = renderHook(() => useDrives(true), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      ),
    });

    await waitFor(() =>
      expect(result.current.isError || result.current.isSuccess).toBe(true)
    );
    expect(result.current.data ?? []).toEqual([]);
  });

  it("returns drives on 200", async () => {
    const drives = [makeDrive({ name: "test" })];
    server.use(
      http.get("*/v1/drives", () => HttpResponse.json(drives, { status: 200 }))
    );

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    const { result } = renderHook(() => useDrives(true), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      ),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(1);
  });
});
