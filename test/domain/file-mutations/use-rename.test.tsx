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
import { useRename } from "@/domain/file-mutations";

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

describe("useRename", () => {
  it("moves within a directory and invalidates fs queries", async () => {
    server.use(
      http.post("*/v1/drives/:id/fs/mv", () =>
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

    const { result } = renderHook(() => useRename(), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      ),
    });

    await result.current.run({
      driveID,
      path: "/folder/file.txt",
      newName: "renamed.txt",
    });

    await waitFor(() =>
      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ predicate: expect.any(Function) })
      )
    );
  });
});
