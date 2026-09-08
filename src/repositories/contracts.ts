import type { Card, Category, Tag, WorkLog } from "@/types/domain";
import type { RepositoryQuery } from "./query";

export interface CardListOptions {
  includeArchived?: boolean;
}

export interface CardRepository {
  findById(id: string): Promise<Card | undefined>;
  list(options?: CardListOptions): Promise<Card[]>;
  observeList(options?: CardListOptions): RepositoryQuery<Card[]>;
}

export interface CategoryRepository {
  findById(id: string): Promise<Category | undefined>;
  list(): Promise<Category[]>;
  observeList(): RepositoryQuery<Category[]>;
}

export interface TagRepository {
  findById(id: string): Promise<Tag | undefined>;
  list(): Promise<Tag[]>;
  listForCard(cardId: string): Promise<Tag[]>;
  observeList(): RepositoryQuery<Tag[]>;
}

export interface WorkLogRepository {
  findById(id: string): Promise<WorkLog | undefined>;
  listForCard(cardId: string): Promise<WorkLog[]>;
  observeForCard(cardId: string): RepositoryQuery<WorkLog[]>;
}
