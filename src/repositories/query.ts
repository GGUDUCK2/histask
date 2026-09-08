import { liveQuery } from "dexie";
import {
  toDataError,
  type DataErrorCode,
  type HistaskDataError,
} from "@/services/data-errors";

export interface RepositoryQuery<T> {
  subscribe(
    onValue: (value: T) => void,
    onError: (error: HistaskDataError) => void,
  ): () => void;
}

export function createRepositoryQuery<T>(
  operation: string,
  query: () => Promise<T> | T,
  errorCode: DataErrorCode = "READ_FAILED",
): RepositoryQuery<T> {
  return {
    subscribe(onValue, onError) {
      const subscription = liveQuery(query).subscribe({
        next: onValue,
        error: (error) => onError(toDataError(error, errorCode, operation)),
      });
      return () => subscription.unsubscribe();
    },
  };
}
