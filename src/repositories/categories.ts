import type { HistaskDatabase } from "@/db/database";
import { toDataError } from "@/services/data-errors";
import type { Category } from "@/types/domain";
import type { CategoryRepository } from "./contracts";
import { createRepositoryQuery, type RepositoryQuery } from "./query";

export class DexieCategoryRepository implements CategoryRepository {
  private readonly database: HistaskDatabase;

  constructor(database: HistaskDatabase) {
    this.database = database;
  }

  async findById(id: string): Promise<Category | undefined> {
    return this.read("find category", () => this.database.categories.get(id));
  }

  async list(): Promise<Category[]> {
    return this.read("list categories", () =>
      this.database.categories.orderBy("name").toArray(),
    );
  }

  observeList(): RepositoryQuery<Category[]> {
    return createRepositoryQuery("observe categories", () => this.list());
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
