"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { Suspense, useEffect } from "react";
import { installFetchCredentials, queryClient } from "@/infra/http";

// Template keeps MSW off so the dev server hits the real backend at
// https://api.mdrive.mandacode.com. The Orval-emitted handlers are
// still available for unit tests under src/infra/http/generated/index.msw.
export default function Template({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    installFetchCredentials();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
    </QueryClientProvider>
  );
}
