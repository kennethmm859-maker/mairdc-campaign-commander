import { Pool } from "pg";

let pool: Pool | null = null;

export function db() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not configured");
  if (!pool) pool = new Pool({ connectionString: url, ssl: url.includes("localhost") ? false : { rejectUnauthorized: false } });
  return pool;
}

export async function query<T = Record<string, unknown>>(text: string, params: unknown[] = []) {
  const result = await db().query(text, params);
  return result.rows as T[];
}
