import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { setupServer } from "msw/node";
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { useCreateDrive } from "@/domain/auth";

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

describe("useCreateDrive", () => {
  it("invalidates drives list with the generated query key on 201", async () => {
    server.use(
      http.post("*/v1/drives", () =>
        HttpResponse.json({ id: "new" }, { status: 201 })
      )
    );

    const queryClient = makeClient();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useCreateDrive(), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      ),
    });

    result.current.mutate({ data: { name: "fresh" } });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalled();
    const call = invalidateSpy.mock.calls[0]?.[0] as
      | { queryKey?: readonly unknown[] }
      | undefined;
    // Must match the full listDrives query key shape (full URL prefix) so
    // the next render re-fetches the drives list. The earlier hardcoded
    // "/v1/drives" prefix used to silently mismatch the registered key.
    expect(call?.queryKey?.[0]).toBe(
      "https://api.mdrive.mandacode.com/v1/drives"
    );
  });

  it("does not invalidate on 400", async () => {
    server.use(
      http.post("*/v1/drives", () => new HttpResponse(null, { status: 400 }))
    );

    const queryClient = makeClient();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useCreateDrive(), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      ),
    });

    result.current.mutate({ data: { name: "" } });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(invalidateSpy).not.toHaveBeenCalled();
  });
});
