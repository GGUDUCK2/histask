import "fake-indexeddb/auto";
import { afterEach, describe, expect, it } from "vitest";
import { HistaskDatabase, openHistaskDatabase } from "@/db/database";
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
import { createRepositories } from "./index";
import { HistaskTransactionRunner } from "./transactions";

afterEach(clearTestDatabases);

async function createDatabase(label: string) {
  const database = trackTestDatabase(
    new HistaskDatabase(testDatabaseName(label)),
  );
  await openHistaskDatabase(database);
  return database;
}

describe("repository reads", () => {
  it("reads active Cards in manual order and can explicitly include archived Cards", async () => {
    const database = await createDatabase("cards");
    const repositories = createRepositories(database);
    const first = cardFixture({ id: "first", sortOrder: 1 });
    const second = cardFixture({ id: "second", sortOrder: 2 });
    const archived = cardFixture({
      id: "archived",
      sortOrder: 0,
      archivedAt: "2026-09-09T00:00:00.000Z",
    });
    await database.cards.bulkAdd([second, archived, first]);

    expect(await repositories.cards.findById(first.id)).toEqual(first);
    expect((await repositories.cards.list()).map(({ id }) => id)).toEqual([
      "first",
      "second",
    ]);
    expect(
      (await repositories.cards.list({ includeArchived: true })).map(
        ({ id }) => id,
      ),
    ).toEqual(["archived", "first", "second"]);
  });

  it("reads Categories and Tags by name and resolves a Card relation in two bulk queries", async () => {
    const database = await createDatabase("classification");
    const repositories = createRepositories(database);
    const categoryA = categoryFixture({
      id: "category-a",
      name: "Development",
    });
    const categoryB = categoryFixture({ id: "category-b", name: "ERP" });
    const tagA = tagFixture({ id: "tag-a", name: "bug" });
    const tagB = tagFixture({ id: "tag-b", name: "deploy" });
    const unrelated = tagFixture({ id: "tag-c", name: "waiting" });
    await database.categories.bulkAdd([categoryB, categoryA]);
    await database.tags.bulkAdd([unrelated, tagB, tagA]);
    await database.cardTags.bulkAdd([
      { cardId: "card-1", tagId: tagA.id },
      { cardId: "card-1", tagId: tagB.id },
      { cardId: "card-2", tagId: unrelated.id },
    ]);

    expect(
      (await repositories.categories.list()).map(({ name }) => name),
    ).toEqual(["Development", "ERP"]);
    expect(await repositories.categories.findById(categoryB.id)).toEqual(
      categoryB,
    );
    expect((await repositories.tags.list()).map(({ name }) => name)).toEqual([
      "bug",
      "deploy",
      "waiting",
    ]);
    expect(
      (await repositories.tags.listForCard("card-1")).map(({ id }) => id),
    ).toEqual(["tag-a", "tag-b"]);
  });

  it("reads WorkLogs newest first with a stable id tie-break", async () => {
    const database = await createDatabase("worklogs");
    const repositories = createRepositories(database);
    const oldest = workLogFixture({
      id: "log-a",
      cardId: "card-1",
      createdAt: "2026-09-08T08:00:00.000Z",
    });
    const tiedA = workLogFixture({
      id: "log-b",
      cardId: "card-1",
      createdAt: "2026-09-08T09:00:00.000Z",
    });
    const tiedB = workLogFixture({
      id: "log-c",
      cardId: "card-1",
      createdAt: "2026-09-08T09:00:00.000Z",
    });
    const other = workLogFixture({ id: "log-d", cardId: "card-2" });
    await database.workLogs.bulkAdd([oldest, tiedA, tiedB, other]);

    expect(
      (await repositories.workLogs.listForCard("card-1")).map(({ id }) => id),
    ).toEqual(["log-c", "log-b", "log-a"]);
    expect(await repositories.workLogs.findById(other.id)).toEqual(other);
  });

  it("returns structured read errors instead of swallowing database failures", async () => {
    const database = await createDatabase("read-error");
    const repositories = createRepositories(database);
    database.close({ disableAutoOpen: true });

    await expect(repositories.cards.list()).rejects.toMatchObject({
      name: "HistaskDataError",
      code: "READ_FAILED",
      operation: "list cards",
    } satisfies Partial<HistaskDataError>);
  });
});

describe("reactive queries and transactions", () => {
  it("emits repository updates and stops emitting after unsubscribe", async () => {
    const database = await createDatabase("observe");
    const repositories = createRepositories(database);
    const snapshots: string[][] = [];
    const errors: HistaskDataError[] = [];
    let resolveInitial: (() => void) | undefined;
    let resolveUpdate: (() => void) | undefined;
    const initial = new Promise<void>((resolve) => {
      resolveInitial = resolve;
    });
    const updated = new Promise<void>((resolve) => {
      resolveUpdate = resolve;
    });
    const unsubscribe = repositories.cards.observeList().subscribe(
      (cards) => {
        snapshots.push(cards.map(({ id }) => id));
        if (snapshots.length === 1) resolveInitial?.();
        if (snapshots.length === 2) resolveUpdate?.();
      },
      (error) => errors.push(error),
    );

    await initial;
    await database.cards.add(cardFixture({ id: "card-1" }));
    await updated;
    unsubscribe();
    await database.cards.add(cardFixture({ id: "card-2" }));
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(errors).toEqual([]);
    expect(snapshots).toEqual([[], ["card-1"]]);
  });

  it("rolls back all tables and exposes a structured error when a write fails", async () => {
    const database = await createDatabase("rollback");
    const transactions = new HistaskTransactionRunner(database);

    await expect(
      transactions.write(["categories", "tags"], async () => {
        await database.categories.add(categoryFixture({ id: "category-1" }));
        await database.tags.add(tagFixture({ id: "tag-1" }));
        throw new Error("planned failure");
      }),
    ).rejects.toMatchObject({
      name: "HistaskDataError",
      code: "TRANSACTION_FAILED",
      operation: "run transaction",
    } satisfies Partial<HistaskDataError>);

    expect(await database.categories.count()).toBe(0);
    expect(await database.tags.count()).toBe(0);
  });

  it("runs a consistent read across the declared tables", async () => {
    const database = await createDatabase("read-transaction");
    const transactions = new HistaskTransactionRunner(database);
    await database.cards.add(cardFixture({ id: "card-1" }));
    await database.workLogs.add(
      workLogFixture({ id: "log-1", cardId: "card-1" }),
    );

    const counts = await transactions.read(["cards", "workLogs"], async () => ({
      cards: await database.cards.count(),
      workLogs: await database.workLogs.count(),
    }));
    expect(counts).toEqual({ cards: 1, workLogs: 1 });
  });

  it("rejects an empty transaction boundary before running its operation", async () => {
    const database = await createDatabase("empty-transaction");
    const transactions = new HistaskTransactionRunner(database);
    let ran = false;
    await expect(
      transactions.write([], async () => {
        ran = true;
      }),
    ).rejects.toMatchObject({ code: "TRANSACTION_FAILED" });
    expect(ran).toBe(false);
  });
});
