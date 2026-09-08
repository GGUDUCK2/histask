export type DataErrorCode =
  "OPEN_FAILED" | "MIGRATION_FAILED" | "READ_FAILED" | "TRANSACTION_FAILED";

const messages: Record<DataErrorCode, string> = {
  OPEN_FAILED: "Could not open local Histask data.",
  MIGRATION_FAILED: "Could not upgrade local Histask data.",
  READ_FAILED: "Could not read local Histask data.",
  TRANSACTION_FAILED: "Could not complete the local data change.",
};

export class HistaskDataError extends Error {
  readonly code: DataErrorCode;
  readonly operation: string;

  constructor(code: DataErrorCode, operation: string, cause?: unknown) {
    super(messages[code], { cause });
    this.name = "HistaskDataError";
    this.code = code;
    this.operation = operation;
  }
}

export function toDataError(
  error: unknown,
  code: DataErrorCode,
  operation: string,
): HistaskDataError {
  return error instanceof HistaskDataError
    ? error
    : new HistaskDataError(code, operation, error);
}
