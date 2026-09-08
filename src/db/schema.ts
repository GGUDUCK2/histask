export const HISTASK_DATABASE_NAME = "Histask";
export const DATABASE_SCHEMA_VERSION = 1;

export interface SettingRecord {
  key: string;
  value: unknown;
}

export const schemaV1 = {
  cards:
    "id, status, categoryId, updatedAt, dueDate, sortOrder, [status+sortOrder]",
  categories: "id, name, updatedAt",
  tags: "id, name, createdAt",
  cardTags: "[cardId+tagId], cardId, tagId",
  workLogs: "id, cardId, createdAt, [cardId+createdAt]",
  settings: "key",
} as const;

export type HistaskTableName = keyof typeof schemaV1;
