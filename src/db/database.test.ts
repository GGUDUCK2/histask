import "fake-indexeddb/auto";
import Dexie, { type Table } from "dexie";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  HistaskDatabase,
  closeHistaskDatabase,
  openHistaskDatabase,
} from "./database";
import { DATABASE_SCHEMA_VERSION, schemaV1 } from "./schema";
import { HistaskDataError } from "@/services/data-errors";
import {
  cardFixture,
  categoryFixture,
  tagFixture,
  workLogFixture,
} from "@/test/domain-fixtures";
import {
  clearTestDatabases,
  testDatabaseName,
  trackTestDatabase,
} from "@/test/database";

afterEach(clearTestDatabases);

describe("Histask schema v1", () => {
  it("creates every table and the indexes used by planned access patterns", async () => {
    const database = trackTestDatabase(
      new HistaskDatabase(testDatabaseName("schema")),
    );
    await openHistaskDatabase(database);

    expect(database.verno).toBe(DATABASE_SCHEMA_VERSION);
    expect(database.tables.map(({ name }) => name).sort()).toEqual(
      Object.keys(schemaV1).sort(),
    );
    expect(database.cards.schema.indexes.map(({ name }) => name)).toEqual(
      expect.arrayContaining([
        "status",
        "categoryId",
        "updatedAt",
        "dueDate",
        "sortOrder",
        "[status+sortOrder]",
      ]),
    );
    expect(database.workLogs.schema.indexes.map(({ name }) => name)).toEqual(
      expect.arrayContaining(["cardId", "createdAt", "[cardId+createdAt]"]),
    );
  });

  it("preserves every entity and setting when schema v1 is reopened", async () => {
    const name = testDatabaseName("reopen");
    const first = trackTestDatabase(new HistaskDatabase(name));
    const card = cardFixture({ id: "card-1", categoryId: "category-1" });
    const category = categoryFixture({ id: "category-1" });
    const tag = tagFixture({ id: "tag-1" });
    const workLog = workLogFixture({ id: "log-1", cardId: card.id });
    await openHistaskDatabase(first);
    await first.transaction(
      "rw",
      [
        first.cards,
        first.categories,
        first.tags,
        first.cardTags,
        first.workLogs,
        first.settings,
      ],
      async () => {
        await first.cards.add(card);
        await first.categories.add(category);
        await first.tags.add(tag);
        await first.cardTags.add({ cardId: card.id, tagId: tag.id });
        await first.workLogs.add(workLog);
        await first.settings.add({ key: "theme", value: "dark" });
      },
    );
    closeHistaskDatabase(first);

    const reopened = trackTestDatabase(new HistaskDatabase(name));
    await openHistaskDatabase(reopened);
    expect(await reopened.cards.get(card.id)).toEqual(card);
    expect(await reopened.categories.get(category.id)).toEqual(category);
    expect(await reopened.tags.get(tag.id)).toEqual(tag);
    expect(await reopened.cardTags.toArray()).toEqual([
      { cardId: card.id, tagId: tag.id },
    ]);
    expect(await reopened.workLogs.get(workLog.id)).toEqual(workLog);
    expect(await reopened.settings.get("theme")).toEqual({
      key: "theme",
      value: "dark",
    });
  });

  it("uses a compound primary key to reject duplicate CardTag relations", async () => {
    const database = trackTestDatabase(
      new HistaskDatabase(testDatabaseName("relations")),
    );
    await openHistaskDatabase(database);
    const relation = { cardId: "card-1", tagId: "tag-1" };
    await database.cardTags.add(relation);
    await expect(database.cardTags.add(relation)).rejects.toMatchObject({
      name: "ConstraintError",
    });
    expect(await database.cardTags.toArray()).toEqual([relation]);
  });

  it("classifies open and migration failures without deleting the database", async () => {
    const database = trackTestDatabase(
      new HistaskDatabase(testDatabaseName("open-error")),
    );
    const failure = Object.assign(new Error("upgrade failed"), {
      name: "UpgradeError",
    });
    const deleteSpy = vi.spyOn(Dexie, "delete");
    vi.spyOn(database, "open").mockRejectedValueOnce(failure);

    await expect(openHistaskDatabase(database)).rejects.toMatchObject({
      name: "HistaskDataError",
      code: "MIGRATION_FAILED",
      operation: "open database",
      cause: failure,
    } satisfies Partial<HistaskDataError>);
    expect(deleteSpy).not.toHaveBeenCalled();
  });

  it("distinguishes an ordinary open failure from an upgrade failure", async () => {
    const database = trackTestDatabase(
      new HistaskDatabase(testDatabaseName("ordinary-open-error")),
    );
    vi.spyOn(database, "open").mockRejectedValueOnce(
      Object.assign(new Error("blocked"), { name: "UnknownError" }),
    );

    await expect(openHistaskDatabase(database)).rejects.toMatchObject({
      code: "OPEN_FAILED",
      operation: "open database",
    } satisfies Partial<HistaskDataError>);
  });
});

interface MigrationRecord {
  id: string;
  name: string;
  migrated?: boolean;
}

function legacyDatabase(name: string): Dexie {
  const database = trackTestDatabase(new Dexie(name));
  database.version(1).stores({ records: "id, name" });
  return database;
}

class MigrationFixtureDatabase extends Dexie {
  records!: Table<MigrationRecord, string>;

  constructor(name: string, fail = false) {
    super(name);
    this.version(1).stores({ records: "id, name" });
    this.version(2)
      .stores({ records: "id, name, migrated" })
      .upgrade(async (transaction) => {
        await transaction
          .table<MigrationRecord>("records")
          .toCollection()
          .modify({
            migrated: true,
          });
        if (fail) throw new Error("planned migration failure");
      });
  }
}

describe("future migration pattern", () => {
  it("preserves existing records during an explicit version upgrade", async () => {
    const name = testDatabaseName("migration-success");
    const legacy = legacyDatabase(name);
    await legacy.open();
    await legacy
      .table<MigrationRecord>("records")
      .add({ id: "1", name: "kept" });
    legacy.close();

    const migrated = trackTestDatabase(new MigrationFixtureDatabase(name));
    await migrated.open();
    expect(await migrated.records.get("1")).toEqual({
      id: "1",
      name: "kept",
      migrated: true,
    });
  });

  it("rolls back a failed upgrade and leaves the version 1 data readable", async () => {
    const name = testDatabaseName("migration-failure");
    const legacy = legacyDatabase(name);
    await legacy.open();
    await legacy
      .table<MigrationRecord>("records")
      .add({ id: "1", name: "safe" });
    legacy.close();

    const failed = trackTestDatabase(new MigrationFixtureDatabase(name, true));
    await expect(failed.open()).rejects.toThrow("planned migration failure");
    failed.close();

    const reopenedLegacy = legacyDatabase(name);
    await reopenedLegacy.open();
    expect(reopenedLegacy.verno).toBe(1);
    expect(
      await reopenedLegacy.table<MigrationRecord>("records").get("1"),
    ).toEqual({
      id: "1",
      name: "safe",
    });
  });
});
