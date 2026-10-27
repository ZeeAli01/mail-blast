import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { getServerEnvironment } from "../src/server/env";

async function main() {
  const migrationClient = postgres(
    getServerEnvironment().DATABASE_MIGRATION_URL,
    { max: 1 },
  );
  await migrate(drizzle(migrationClient), { migrationsFolder: "drizzle" });
  await migrationClient.end();
  console.log("Database migrations applied.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
