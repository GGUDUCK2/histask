import type { Card, Category, Tag, WorkLog } from "@/types/domain";

export function cardFixture(overrides: Partial<Card> = {}): Card {
  return {
    id: crypto.randomUUID(),
    title: "ERP issue",
    status: "TODO",
    priority: "NONE",
    sortOrder: 0,
    createdAt: "2026-09-08T00:00:00.000Z",
    updatedAt: "2026-09-08T00:00:00.000Z",
    ...overrides,
  };
}

export function categoryFixture(overrides: Partial<Category> = {}): Category {
  return {
    id: crypto.randomUUID(),
    name: "ERP",
    createdAt: "2026-09-08T00:00:00.000Z",
    updatedAt: "2026-09-08T00:00:00.000Z",
    ...overrides,
  };
}

export function tagFixture(overrides: Partial<Tag> = {}): Tag {
  return {
    id: crypto.randomUUID(),
    name: "bug",
    createdAt: "2026-09-08T00:00:00.000Z",
    ...overrides,
  };
}

export function workLogFixture(overrides: Partial<WorkLog> = {}): WorkLog {
  return {
    id: crypto.randomUUID(),
    cardId: "card-1",
    content: "Reproduced the issue",
    createdAt: "2026-09-08T00:00:00.000Z",
    updatedAt: "2026-09-08T00:00:00.000Z",
    ...overrides,
  };
}
