import type { HistaskDatabase } from "@/db/database";
import { toDataError } from "@/services/data-errors";
import type { Tag } from "@/types/domain";
import type { TagRepository } from "./contracts";
import { createRepositoryQuery, type RepositoryQuery } from "./query";

export class DexieTagRepository implements TagRepository {
  private readonly database: HistaskDatabase;

  constructor(database: HistaskDatabase) {
    this.database = database;
  }

  async findById(id: string): Promise<Tag | undefined> {
    return this.read("find tag", () => this.database.tags.get(id));
  }

  async list(): Promise<Tag[]> {
    return this.read("list tags", () =>
      this.database.tags.orderBy("name").toArray(),
    );
  }

  async listForCard(cardId: string): Promise<Tag[]> {
    return this.read("list card tags", async () => {
      const relations = await this.database.cardTags
        .where("cardId")
        .equals(cardId)
        .toArray();
      const tags = await this.database.tags.bulkGet(
        relations.map(({ tagId }) => tagId),
      );
      return tags.filter((tag): tag is Tag => tag !== undefined);
    });
  }

  observeList(): RepositoryQuery<Tag[]> {
    return createRepositoryQuery("observe tags", () => this.list());
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
