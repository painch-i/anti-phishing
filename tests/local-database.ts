import { Client, type QueryResultRow } from "pg";

export type LocalDatabase = {
  exec(sql: string): Promise<void>;
  query<T extends QueryResultRow = QueryResultRow>(sql: string, params?: unknown[]): Promise<{ rows: T[]; affectedRows: number }>;
  close(): Promise<void>;
};

export async function connectToLocalSupabase(): Promise<LocalDatabase> {
  const client = new Client({ connectionString: process.env.SUPABASE_TEST_DATABASE_URL ?? "postgresql://postgres:postgres@127.0.0.1:54322/postgres" });
  await client.connect();
  return {
    async exec(sql: string) { await client.query(sql); },
    async query<T extends QueryResultRow = QueryResultRow>(sql: string, params?: unknown[]) {
      const result = await client.query<T>(sql, params);
      return { rows: result.rows, affectedRows: result.rowCount ?? 0 };
    },
    close: () => client.end()
  };
}
