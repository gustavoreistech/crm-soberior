import { createClient, ClickHouseClient } from "@clickhouse/client";

const globalForClickHouse = globalThis as unknown as {
  clickhouse: ClickHouseClient | undefined;
};

function createClickHouseClient(): ClickHouseClient {
  const host = process.env.CLICKHOUSE_HOST;
  const username = process.env.CLICKHOUSE_USER;
  const password = process.env.CLICKHOUSE_PASSWORD;
  const database = process.env.CLICKHOUSE_DB;

  if (!host || !username || !password || !database) {
    throw new Error(
      "ClickHouse environment variables (CLICKHOUSE_HOST, CLICKHOUSE_USER, CLICKHOUSE_PASSWORD, CLICKHOUSE_DB) are not set."
    );
  }

  return createClient({
    host,
    username,
    password,
    database,
    /** @clickhouse/client usa HTTP (porta 8123) por padrão */
    clickhouse_settings: {
      date_time_output_format: "iso",
    },
  });
}

export const clickhouse =
  globalForClickHouse.clickhouse ?? createClickHouseClient();

if (process.env.NODE_ENV !== "production") {
  globalForClickHouse.clickhouse = clickhouse;
}

/**
 * Executa uma query SELECT e retorna todas as linhas como array tipado.
 * Exemplo:
 *   const rows = await queryRows<{ date: string; roas: number }>(
 *     "SELECT toDate(event_time) as date, avg(roas) as roas FROM events WHERE org_id = {orgId:String} GROUP BY date",
 *     { orgId: "abc" }
 *   );
 */
export async function queryRows<T>(
  query: string,
  params?: Record<string, unknown>
): Promise<T[]> {
  const result = await clickhouse.query({
    query,
    format: "JSONEachRow",
    query_params: params,
  });
  return (await result.json()) as T[];
}

/**
 * Executa uma query SELECT e retorna apenas a primeira linha (ou null).
 */
export async function queryOne<T>(
  query: string,
  params?: Record<string, unknown>
): Promise<T | null> {
  const rows = await queryRows<T>(query, params);
  return rows.length > 0 ? rows[0] : null;
}

/**
 * Executa comandos de escrita (INSERT, ALTER, etc).
 */
export async function execute(
  query: string,
  params?: Record<string, unknown>
): Promise<void> {
  await clickhouse.exec({
    query,
    query_params: params,
  });
}
