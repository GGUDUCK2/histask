import Dexie from "dexie";
import { HistaskDatabase, openHistaskDatabase } from '@/db/database'

const databases = new Set<Dexie>();
const names = new Set<string>();

export function testDatabaseName(label: string): string {
  const name = `histask-test-${label}-${crypto.randomUUID()}`;
  names.add(name);
  return name;
}

export function trackTestDatabase<T extends Dexie>(database: T): T {
  databases.add(database);
  names.add(database.name);
  return database;
}

export async function clearTestDatabases(): Promise<void> {
  databases.forEach((database) => database.close());
  databases.clear();
  await Promise.all([...names].map((name) => Dexie.delete(name)));
  names.clear();
}

export async function createTestDatabase(
  label: string,
): Promise<HistaskDatabase> {
  const database = trackTestDatabase(
    new HistaskDatabase(testDatabaseName(label)),
  )
  await openHistaskDatabase(database)
  return database
}
