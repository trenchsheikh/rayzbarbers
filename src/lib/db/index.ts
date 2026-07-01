import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres, { type Sql } from "postgres";
import * as schema from "./schema";

type Database = PostgresJsDatabase<typeof schema>;

const globalForDb = globalThis as unknown as {
  pgClient: Sql | undefined;
  drizzleDb: Database | undefined;
};

function warnIfSessionPoolerOnVercel(connectionString: string) {
  if (!process.env.VERCEL) return;
  const isSupabase = connectionString.includes("supabase.co");
  const usesDirectSessionPort =
    connectionString.includes(":5432") && !connectionString.includes("pooler");
  if (isSupabase && usesDirectSessionPort) {
    console.error(
      "[db] DATABASE_URL is using Supabase direct/session mode (port 5432). " +
        "On Vercel, set DATABASE_URL to the Transaction pooler string from " +
        "Supabase → Project Settings → Database → Connect → Transaction pooler " +
        "(port 6543, include ?pgbouncer=true).",
    );
  }
}

function createPgClient(connectionString: string): Sql {
  warnIfSessionPoolerOnVercel(connectionString);
  return postgres(connectionString, {
    prepare: false,
    max: 1,
    idle_timeout: 20,
    connect_timeout: 10,
  });
}

function getDatabase(): Database | null {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) return null;

  if (!globalForDb.pgClient) {
    globalForDb.pgClient = createPgClient(connectionString);
    globalForDb.drizzleDb = drizzle(globalForDb.pgClient, { schema });
  }

  return globalForDb.drizzleDb ?? null;
}

export const db = getDatabase();

export function requireDb() {
  if (!db) {
    throw new Error(
      "DATABASE_URL is not configured. See .env.local.example for setup.",
    );
  }
  return db;
}
