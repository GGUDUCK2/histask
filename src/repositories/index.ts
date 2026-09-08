import type { HistaskDatabase } from "@/db/database";
import { DexieCardRepository } from "./cards";
import { DexieCategoryRepository } from "./categories";
import { DexieTagRepository } from "./tags";
import { DexieWorkLogRepository } from "./worklogs";
import { DexieSettingsRepository } from './settings'

export function createRepositories(database: HistaskDatabase) {
  return {
    cards: new DexieCardRepository(database),
    categories: new DexieCategoryRepository(database),
    tags: new DexieTagRepository(database),
    workLogs: new DexieWorkLogRepository(database),
    settings: new DexieSettingsRepository(database),
  };
}

export type HistaskRepositories = ReturnType<typeof createRepositories>;
export type {
  CardRepository,
  CategoryRepository,
  TagRepository,
  WorkLogRepository,
} from "./contracts";
export type { SettingsRepository } from './settings'
