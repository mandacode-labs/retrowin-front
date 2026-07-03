import type { Query } from "@tanstack/react-query";
import { API_BASE_URL } from "@/infra/http/constants";
import { getLsQueryKey, getStatQueryKey } from "@/infra/http/generated";

export function isFsQuery(query: Query): boolean {
  const key = String(query.queryKey[0] ?? "");
  return (
    key.startsWith(`${API_BASE_URL}/v1/drives/`) &&
    (key.includes("/fs/ls") || key.includes("/fs/stat"))
  );
}

export function buildLsKey(
  driveID: string,
  params: { path: string }
): ReturnType<typeof getLsQueryKey> {
  return getLsQueryKey(driveID, params);
}

export function buildStatKey(
  driveID: string,
  params: { path: string }
): ReturnType<typeof getStatQueryKey> {
  return getStatQueryKey(driveID, params);
}
