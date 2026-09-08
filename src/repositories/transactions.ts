import type { HistaskDatabase } from "@/db/database";
import type { HistaskTableName } from "@/db/schema";
import { toDataError } from "@/services/data-errors";
import { DomainError } from '@/services/domain-errors'
import { ValidationError } from '@/services/validation'

export class HistaskTransactionRunner {
  private readonly database: HistaskDatabase;

  constructor(database: HistaskDatabase) {
    this.database = database;
  }

  read<T>(tables: readonly HistaskTableName[], operation: () => Promise<T>) {
    return this.run("r", tables, operation);
  }

  write<T>(tables: readonly HistaskTableName[], operation: () => Promise<T>) {
    return this.run("rw", tables, operation);
  }

  private async run<T>(
    mode: "r" | "rw",
    tableNames: readonly HistaskTableName[],
    operation: () => Promise<T>,
  ): Promise<T> {
    if (tableNames.length === 0) {
      throw toDataError(
        new Error("A transaction requires at least one table."),
        "TRANSACTION_FAILED",
        "start transaction",
      );
    }

    const tables = tableNames.map((tableName) =>
      this.database.table(tableName),
    );
    try {
      return await this.database.transaction(mode, tables, operation);
    } catch (error) {
      if (error instanceof DomainError || error instanceof ValidationError)
        throw error
      throw toDataError(
        error,
        mode === "r" ? "READ_FAILED" : "TRANSACTION_FAILED",
        mode === "r" ? "run read transaction" : "run transaction",
      );
    }
  }
}
