import {
  type UseMutationResult,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { isFsQuery } from "@/core/http/keys";
import { useToast } from "@/domain/toast";

type Invalidate = "fs" | "drives" | "none";

export type SafeMutationConfig<TVars, TData> = {
  /** Side-effect function (must throw on non-2xx, see infra/http/fetcher). */
  fn: (vars: TVars) => Promise<TData>;
  /** Optional guard that rejects before the request is sent. */
  guard?: (vars: TVars) => boolean | string | undefined;
  invalidate: Invalidate;
  /** Override the default cache invalidation strategy. */
  invalidateKey?: unknown[];
  /** Optional synchronous side-effect on success. */
  onSuccess?: (data: TData, vars: TVars) => void;
  /** Toast messages. Error toast auto-fires on throw unless `silent`. */
  errorMessage?: string | ((vars: TVars) => string);
  successMessage?: string | ((data: TData, vars: TVars) => string);
  silent?: boolean;
  /** Optional synchronous side-effect on error. */
  onError?: (error: Error, vars: TVars) => void;
};

export type SafeMutationHook<TVars, TData> = UseMutationResult<
  TData,
  Error,
  TVars
> & {
  run: (vars: TVars) => Promise<TData>;
};

/**
 * Single-shape mutation hook. Encapsulates:
 *   - throw-on-failure (via `safeFetch`)
 *   - cache invalidation (`isFsQuery` for fs, listDrives queryKey for drives)
 *   - optional pre-flight guard (e.g. cycle detection in mv)
 *   - optional toast notifications
 */
export function useSafeMutation<TVars, TData>(
  config: SafeMutationConfig<TVars, TData>
): SafeMutationHook<TVars, TData> {
  const queryClient = useQueryClient();
  const toast = useToast();
  const mutation = useMutation<TData, Error, TVars>({
    mutationFn: async (vars) => {
      if (config.guard) {
        const rejected = config.guard(vars);
        if (rejected !== undefined && rejected !== false) {
          throw new Error(typeof rejected === "string" ? rejected : "guarded");
        }
      }
      return config.fn(vars);
    },
    onSuccess: (data, vars) => {
      if (config.invalidate === "fs") {
        queryClient.invalidateQueries({ predicate: isFsQuery });
      } else if (config.invalidate === "drives") {
        queryClient.invalidateQueries({ queryKey: ["/v1/drives"] });
      }
      if (config.invalidateKey) {
        queryClient.invalidateQueries({ queryKey: config.invalidateKey });
      }
      config.onSuccess?.(data, vars);
      if (config.successMessage) {
        const m =
          typeof config.successMessage === "function"
            ? config.successMessage(data, vars)
            : config.successMessage;
        toast.success(m);
      }
    },
    onError: (error, vars) => {
      if (config.silent) return;
      if (config.errorMessage) {
        const m =
          typeof config.errorMessage === "function"
            ? config.errorMessage(vars)
            : config.errorMessage;
        toast.error(m);
      }
      config.onError?.(error, vars);
    },
  });
  return { ...mutation, run: mutation.mutateAsync };
}
