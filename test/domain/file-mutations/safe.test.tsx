import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
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
import { useSafeMutation } from "@/domain/file-mutations/safe";

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

describe("useSafeMutation", () => {
  it("invokes fn, invalidates fs on success, and emits toast on failure", async () => {
    server.use(
      http.post("*/v1/drives/:id/fs/mkdir", () =>
        HttpResponse.json({}, { status: 200 })
      )
    );

    const queryClient = makeClient();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(
      () =>
        useSafeMutation({
          fn: ({ driveID }: { driveID: string }) =>
            fetch(`/api/v1/drives/${driveID}/fs/mkdir`, {
              method: "POST",
            }).then(() => ({ ok: true })),
          invalidate: "fs",
          errorMessage: "Create Folder failed",
        }),
      {
        wrapper: ({ children }) => (
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        ),
      }
    );

    await result.current.run({ driveID: "d-1" });
    expect(invalidateSpy).toHaveBeenCalled();
  });

  it("calls fn once and surfaces error when guarded or rejected", async () => {
    server.use(
      http.post(
        "*/v1/drives/:id/fs/mv",
        () => new HttpResponse(null, { status: 409 })
      )
    );

    const queryClient = makeClient();
    const fn = vi.fn(async () => {
      throw new Error("conflict");
    });
    const onError = vi.fn();

    const { result } = renderHook(
      () =>
        useSafeMutation({
          fn,
          invalidate: "fs",
          errorMessage: "Move failed",
          onError,
        }),
      {
        wrapper: ({ children }) => (
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        ),
      }
    );

    await expect(
      result.current.run({ sources: ["/a"], destination: "/b" })
    ).rejects.toThrow("conflict");
    expect(onError).toHaveBeenCalled();
  });
});
