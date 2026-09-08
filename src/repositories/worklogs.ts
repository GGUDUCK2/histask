import Dexie from "dexie";
import type { HistaskDatabase } from "@/db/database";
import { toDataError } from "@/services/data-errors";
import type { WorkLog } from "@/types/domain";
import type { WorkLogRepository } from "./contracts";
import { createRepositoryQuery, type RepositoryQuery } from "./query";

export class DexieWorkLogRepository implements WorkLogRepository {
  private readonly database: HistaskDatabase;

  constructor(database: HistaskDatabase) {
    this.database = database;
  }

  async findById(id: string): Promise<WorkLog | undefined> {
    return this.read("find work log", () => this.database.workLogs.get(id));
  }

  async listForCard(cardId: string): Promise<WorkLog[]> {
    return this.read("list work logs", async () => {
      const logs = await this.database.workLogs
        .where("[cardId+createdAt]")
        .between([cardId, Dexie.minKey], [cardId, Dexie.maxKey])
        .reverse()
        .toArray();
      return logs.sort(
        (left, right) =>
          right.createdAt.localeCompare(left.createdAt) ||
          right.id.localeCompare(left.id),
      );
    });
  }

  observeForCard(cardId: string): RepositoryQuery<WorkLog[]> {
    return createRepositoryQuery("observe work logs", () =>
      this.listForCard(cardId),
    );
  }

  private async read<T>(
    operation: string,
    query: () => Promise<T>,
  ): Promise<T> {
    try {
      return await query();
    } catch (error) {
      throw toDataError(error, "READ_FAILED", operation);
    }
  }
}
