import { Pool, PoolConfig } from "pg";

function createConfig(): PoolConfig {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Set it in project settings to connect to your Postgres database.",
    );
  }
  const sslMode =
    process.env.PGSSLMODE || /sslmode=require/.test(url)
      ? "require"
      : "disable";
  const config: PoolConfig = { connectionString: url } as PoolConfig;
  if (sslMode !== "disable") {
    // Accept self-signed certs for common managed Postgres providers
    // If you need strict SSL, set PGSSLMODE=strict and provide proper certs
    (config as any).ssl = { rejectUnauthorized: false };
  }
  return config;
}

export const pool = new Pool(createConfig());

export async function query<T = any>(text: string, params?: any[]) {
  const client = await pool.connect();
  try {
    const res = await client.query<T>(text, params);
    return res.rows as T[];
  } finally {
    client.release();
  }
}

export async function withTx<T>(fn: (client: any) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
