import Dexie, { type Table } from "dexie";
import type { Card, CardTag, Category, Tag, WorkLog } from "@/types/domain";
import { HistaskDataError } from "@/services/data-errors";
import {
  DATABASE_SCHEMA_VERSION,
  HISTASK_DATABASE_NAME,
  schemaV1,
  type SettingRecord,
} from "./schema";

export class HistaskDatabase extends Dexie {
  cards!: Table<Card, string>;
  categories!: Table<Category, string>;
  tags!: Table<Tag, string>;
  cardTags!: Table<CardTag, [string, string]>;
  workLogs!: Table<WorkLog, string>;
  settings!: Table<SettingRecord, string>;

  constructor(name = HISTASK_DATABASE_NAME) {
    super(name);
    this.version(DATABASE_SCHEMA_VERSION).stores(schemaV1);
  }
}

function isMigrationFailure(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return error.name === "UpgradeError" || error.name === "VersionError";
}

export async function openHistaskDatabase(
  database: HistaskDatabase,
): Promise<HistaskDatabase> {
  try {
    await database.open();
    return database;
  } catch (error) {
    throw new HistaskDataError(
      isMigrationFailure(error) ? "MIGRATION_FAILED" : "OPEN_FAILED",
      "open database",
      error,
    );
  }
}

export function closeHistaskDatabase(database: HistaskDatabase): void {
  database.close();
}

export const histaskDatabase = new HistaskDatabase();
