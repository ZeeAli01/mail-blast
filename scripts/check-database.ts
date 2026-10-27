import { sqlClient } from "../src/server/db/client";

async function main() {
  const result = await sqlClient<{ database: string; version: string }[]>`
    select current_database() as database, version() as version
  `;
  console.log(
    JSON.stringify({
      ok: true,
      database: result[0].database,
      version: result[0].version,
    }),
  );
  await sqlClient.end();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
