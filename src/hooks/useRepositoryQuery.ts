import { useEffect, useState } from "react";
import type { RepositoryQuery } from "@/repositories/query";
import type { HistaskDataError } from "@/services/data-errors";

export type RepositoryQueryState<T> =
  | { status: "loading"; data?: undefined; error?: undefined }
  | { status: "success"; data: T; error?: undefined }
  | { status: "error"; data?: undefined; error: HistaskDataError };

export function useRepositoryQuery<T>(
  query: RepositoryQuery<T>,
): RepositoryQueryState<T> {
  const [result, setResult] = useState<{
    query: RepositoryQuery<T>;
    state: RepositoryQueryState<T>;
  }>({
    query,
    state: { status: "loading" },
  });
  const state: RepositoryQueryState<T> =
    result.query === query ? result.state : { status: "loading" };

  useEffect(() => {
    let active = true;
    const unsubscribe = query.subscribe(
      (data) => {
        if (active) {
          setResult({ query, state: { status: "success", data } });
        }
      },
      (error) => {
        if (active) {
          setResult({ query, state: { status: "error", error } });
        }
      },
    );
    return () => {
      active = false;
      unsubscribe();
    };
  }, [query]);

  return state;
}
