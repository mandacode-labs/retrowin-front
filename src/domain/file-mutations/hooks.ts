import { useMutation, useQueryClient } from "@tanstack/react-query";
import { API_BASE_URL } from "@/infra/http";
import { isFsQuery } from "@/infra/http/keys";
import type { MkdirBody, MvBody, RmBody } from "@/infra/http/types";

type Fetcher = (
  url: string,
  init: { method: string; body?: string; headers?: Record<string, string> }
) => Promise<{ status: number; data: unknown }>;

const fetcher: Fetcher = async (url, init) => {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...init.headers },
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

function url(path: string): string {
  return `${API_BASE_URL}${path}`;
}

export function useMkdir() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      driveID,
      data,
    }: {
      driveID: string;
      data?: MkdirBody;
    }) =>
      throwOnFailure(
        fetcher(url(`/v1/drives/${driveID}/fs/mkdir`), {
          method: "POST",
          body: JSON.stringify(data),
        })
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ predicate: isFsQuery });
    },
  });
}

export function useMv() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      driveID,
      data,
    }: {
      driveID: string;
      data?: MvBody;
    }) =>
      throwOnFailure(
        fetcher(url(`/v1/drives/${driveID}/fs/mv`), {
          method: "POST",
          body: JSON.stringify(data),
        })
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ predicate: isFsQuery });
    },
  });
}

export function useRm() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      driveID,
      data,
    }: {
      driveID: string;
      data?: RmBody;
    }) =>
      throwOnFailure(
        fetcher(url(`/v1/drives/${driveID}/fs/rm`), {
          method: "DELETE",
          body: JSON.stringify(data),
        })
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ predicate: isFsQuery });
    },
  });
}

export function useRename() {
  const mvMutation = useMv();
  return useMutation({
    mutationFn: async ({
      driveID,
      path,
      newName,
    }: {
      driveID: string;
      path: string;
      newName: string;
    }) => {
      const lastSlash = path.lastIndexOf("/");
      const dir = lastSlash >= 0 ? path.slice(0, lastSlash) : "";
      const destination = `${dir}/${newName}`;
      return mvMutation.mutateAsync({
        driveID,
        data: { sources: [path], destination },
      });
    },
  });
}

