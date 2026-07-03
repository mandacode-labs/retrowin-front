import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import {
  API_BASE_URL,
  getAuthMeQueryOptions,
  getListDrivesQueryKey,
  getListDrivesQueryOptions,
} from "@/infra/http";
import type { DriveCreate, User } from "@/infra/http/types";

type Fetcher = (
  url: string,
  init: { method: string; body?: string }
) => Promise<{ status: number; data: unknown }>;

const fetcher: Fetcher = async (url, init) => {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json" },
  });
  const text = [204, 205, 304].includes(res.status) ? null : await res.text();
  const data = text ? JSON.parse(text) : undefined;
  return { status: res.status, data };
};

const throwOnFailure = async <T extends { status: number }>(
  promise: Promise<T>
): Promise<T> => {
  const result = await promise;
  if (result.status < 200 || result.status >= 300) throw result;
  return result;
};

export function useMe() {
  return useQuery({
    ...getAuthMeQueryOptions(),
    retry: false,
    select: (response): User | null =>
      response.status === 200 ? (response.data as User) : null,
  });
}

export function useDrives(enabled: boolean) {
  return useQuery({
    ...getListDrivesQueryOptions(),
    retry: false,
    select: (response) => (response.status === 200 ? response.data : []),
    enabled,
  });
}

export function useCreateDrive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ data }: { data?: DriveCreate }) =>
      throwOnFailure(
        fetcher(url("/v1/drives"), {
          method: "POST",
          body: JSON.stringify(data),
        })
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getListDrivesQueryKey() });
    },
  });
}

export function useDeleteDrive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ driveID }: { driveID: string }) =>
      throwOnFailure(
        fetcher(url(`/v1/drives/${driveID}`), {
          method: "DELETE",
        })
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getListDrivesQueryKey() });
    },
  });
}

export function useRestoreDrive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ driveID }: { driveID: string }) =>
      throwOnFailure(
        fetcher(url(`/v1/drives/${driveID}/restore`), {
          method: "POST",
        })
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getListDrivesQueryKey() });
    },
  });
}

const authUrl = (path: string) => `${API_BASE_URL}${path}`;

function url(path: string): string {
  return `${API_BASE_URL}${path}`;
}

export function login(redirectTo: string = "/") {
  const url = new URL(authUrl("/auth/login"));
  if (redirectTo !== "/") {
    url.searchParams.set(
      "redirect_uri",
      new URL(redirectTo, window.location.origin).toString()
    );
  }
  window.location.href = url.toString();
}

export function useLogout() {
  return useCallback(() => {
    if (typeof document === "undefined") return;
    const form = document.createElement("form");
    form.method = "POST";
    form.action = authUrl("/auth/logout");
    form.style.display = "none";
    document.body.appendChild(form);
    form.submit();
  }, []);
}
