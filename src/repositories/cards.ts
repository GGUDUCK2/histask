import type { HistaskDatabase } from "@/db/database";
import { toDataError } from "@/services/data-errors";
import type { Card } from "@/types/domain";
import type { CardListOptions, CardRepository } from "./contracts";
import { createRepositoryQuery, type RepositoryQuery } from "./query";

export class DexieCardRepository implements CardRepository {
  private readonly database: HistaskDatabase;

  constructor(database: HistaskDatabase) {
    this.database = database;
  }

  async findById(id: string): Promise<Card | undefined> {
    return this.read("find card", () => this.database.cards.get(id));
  }

  async list(options: CardListOptions = {}): Promise<Card[]> {
    return this.read("list cards", async () => {
      const cards = await this.database.cards.orderBy("sortOrder").toArray();
      return options.includeArchived
        ? cards
        : cards.filter((card) => card.archivedAt === undefined);
    });
  }

  observeList(options: CardListOptions = {}): RepositoryQuery<Card[]> {
    return createRepositoryQuery("observe cards", () => this.list(options));
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
