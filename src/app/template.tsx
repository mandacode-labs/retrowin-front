"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { Suspense, useEffect, useState } from "react";
import { installFetchCredentials, queryClient } from "@/infra/http";
import { startMockService } from "@/mocks";

/**
 * Dev/MSW toggle.
 *
 * - `process.env.NEXT_PUBLIC_DISABLE_MSW === "1"` skips MSW and lets
 *   fetch calls go straight to the real backend. This is the escape
 *   hatch when CORS or staging endpoints need testing.
 * - In production MSW is never started.
 * - Otherwise MSW starts before the page tree so first requests are
 *   intercepted, and the page renders a `Loading...` shell until the
 *   service worker is ready.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  const [mswReady, setMswReady] = useState(
    process.env.NODE_ENV === "production" ||
      process.env.NEXT_PUBLIC_DISABLE_MSW === "1"
  );

  useEffect(() => {
    installFetchCredentials();

    if (
      process.env.NODE_ENV !== "production" &&
      process.env.NEXT_PUBLIC_DISABLE_MSW !== "1"
    ) {
      console.log("[template] starting MSW...");
      startMockService()
        .then(() => {
          console.log("[template] MSW started successfully");
          setMswReady(true);
        })
        .catch((err) => {
          console.error("Failed to start MSW:", err);
          setMswReady(true);
        });
    }
  }, []);

  if (!mswReady) {
    return <div className="flex-center full-size">Loading...</div>;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
    </QueryClientProvider>
  );
}
