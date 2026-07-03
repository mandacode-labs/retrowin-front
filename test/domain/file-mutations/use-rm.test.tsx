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
import { useRm } from "@/domain/file-mutations";

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

describe("useRm", () => {
  it("invalidates fs queries on 200", async () => {
    server.use(
      http.delete("*/v1/drives/:id/fs/rm", () =>
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

    const { result } = renderHook(() => useRm(), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      ),
    });

    result.current.mutate({ driveID, data: { paths: ["/a"] } });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalled();
  });
});
