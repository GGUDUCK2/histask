import { StrictMode } from "react";
import { act, render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import type { RepositoryQuery } from "@/repositories/query";
import { HistaskDataError } from "@/services/data-errors";
import { useRepositoryQuery } from "./useRepositoryQuery";

function QueryView({ query }: { query: RepositoryQuery<string> }) {
  const state = useRepositoryQuery(query);
  if (state.status === "success") return <output>{state.data}</output>;
  if (state.status === "error")
    return <p role="alert">{state.error.message}</p>;
  return <p>Loading</p>;
}

it("subscribes safely in StrictMode, renders values, and cleans every subscription", () => {
  let subscriptions = 0;
  let cleanups = 0;
  let emit: ((value: string) => void) | undefined;
  const query: RepositoryQuery<string> = {
    subscribe(onValue) {
      subscriptions += 1;
      emit = onValue;
      return () => {
        cleanups += 1;
      };
    },
  };

  const { unmount } = render(
    <StrictMode>
      <QueryView query={query} />
    </StrictMode>,
  );
  expect(screen.getByText("Loading")).toBeVisible();
  act(() => emit?.("ready"));
  expect(screen.getByRole("status")).toHaveTextContent("ready");
  unmount();
  expect(subscriptions).toBeGreaterThanOrEqual(2);
  expect(cleanups).toBe(subscriptions);
});

it("provides a calm error state and ignores updates after cleanup", () => {
  let emit: ((value: string) => void) | undefined;
  let fail: ((error: HistaskDataError) => void) | undefined;
  const query: RepositoryQuery<string> = {
    subscribe(onValue, onError) {
      emit = onValue;
      fail = onError;
      return () => undefined;
    },
  };
  const { unmount } = render(<QueryView query={query} />);
  act(() => fail?.(new HistaskDataError("READ_FAILED", "test query")));
  expect(screen.getByRole("alert")).toHaveTextContent(
    "Could not read local Histask data.",
  );
  unmount();
  act(() => emit?.("late value"));
  expect(screen.queryByText("late value")).not.toBeInTheDocument();
});

it("returns to loading when the query identity changes", () => {
  let emitFirst: ((value: string) => void) | undefined;
  const first: RepositoryQuery<string> = {
    subscribe(onValue) {
      emitFirst = onValue;
      return () => undefined;
    },
  };
  const second: RepositoryQuery<string> = {
    subscribe() {
      return () => undefined;
    },
  };
  const { rerender } = render(<QueryView query={first} />);
  act(() => emitFirst?.("first value"));
  expect(screen.getByRole("status")).toHaveTextContent("first value");
  rerender(<QueryView query={second} />);
  expect(screen.getByText("Loading")).toBeVisible();
});
