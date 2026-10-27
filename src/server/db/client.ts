import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { getServerEnvironment } from "../env";
import * as schema from "./schema";

const globalDatabase = globalThis as unknown as {
  sqlClient?: ReturnType<typeof postgres>;
};

const sqlClient =
  globalDatabase.sqlClient ??
  postgres(getServerEnvironment().DATABASE_URL, {
    max: getServerEnvironment().NODE_ENV === "production" ? 10 : 3,
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: false,
  });

if (getServerEnvironment().NODE_ENV !== "production")
  globalDatabase.sqlClient = sqlClient;

export const db = drizzle(sqlClient, { schema });

export const workerSqlClient = postgres(
  getServerEnvironment().DATABASE_WORKER_URL,
  {
    max: 3,
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: false,
  },
);
export { sqlClient };
