import { sqlClient } from "../src/server/db/client";

async function main() {
  const result = await sqlClient<{ database: string; version: string }[]>`
    select current_database() as database, version() as version
  `;
  const requiredTenantTables = [
    "companies",
    "contact_email_evidence",
    "discovery_projects",
    "discovery_results",
    "lead_profiles",
    "lead_signals",
    "lead_sources",
  ];
  const security = await sqlClient<
    {
      table: string;
      enabled: boolean;
      forced: boolean;
      hasPolicy: boolean;
    }[]
  >`
    select
      c.relname as table,
      c.relrowsecurity as enabled,
      c.relforcerowsecurity as forced,
      exists(select 1 from pg_policy p where p.polrelid = c.oid) as "hasPolicy"
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r'
  `;
  const securityByTable = new Map(security.map((row) => [row.table, row]));
  const unsafeTables = requiredTenantTables.filter((table) => {
    const row = securityByTable.get(table);
    return !row || !row.enabled || !row.forced || !row.hasPolicy;
  });
  if (unsafeTables.length) {
    throw new Error(
      `Tenant security is missing or incomplete for: ${unsafeTables.join(", ")}`,
    );
  }
  console.log(
    JSON.stringify({
      ok: true,
      database: result[0].database,
      version: result[0].version,
      tenantSecurityTablesChecked: requiredTenantTables.length,
    }),
  );
  await sqlClient.end();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
