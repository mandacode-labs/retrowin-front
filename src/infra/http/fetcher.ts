import { API_BASE_URL } from "@/infra/http/constants";

export type FetcherResponse<T> = {
  status: number;
  data: T;
};

const ALLOWED_STATUSES_FOR_BODY = [200, 201, 202, 203, 204, 205, 206];

export class HttpError extends Error {
  readonly status: number;
  readonly body: unknown;
  constructor(status: number, body: unknown) {
    super(`http ${status}`);
    this.status = status;
    this.body = body;
  }
}

export async function safeFetch<T>(
  method: string,
  path: string,
  body?: unknown,
  init?: RequestInit
): Promise<FetcherResponse<T>> {
  const url = path.startsWith("http") ? path : `${API_BASE_URL}${path}`;
  const response = await fetch(url, {
    ...init,
    method,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(init?.headers ?? {}),
    },
    body:
      body === undefined || method === "GET" || method === "DELETE"
        ? (init?.body as BodyInit | undefined)
        : (JSON.stringify(body) as BodyInit),
  });

  // biome-ignore lint/complexity/noUselessUndefinedInitialization: keep the
  // narrow initial type until either branch fills `parsed`.
  let parsed: unknown;
  if (
    ALLOWED_STATUSES_FOR_BODY.includes(response.status) &&
    response.status !== 204
  ) {
    const text = await response.text();
    parsed = text ? safeJson(text) : undefined;
  }

  if (response.status < 200 || response.status >= 300) {
    throw new HttpError(response.status, parsed);
  }

  return { status: response.status, data: parsed as T };
}

function safeJson(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export type FetcherInit = Parameters<typeof fetch>[1];
