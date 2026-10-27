import "server-only";

import { sql } from "drizzle-orm";
import { db } from "./client";

export type TenantTransaction = Parameters<
  Parameters<typeof db.transaction>[0]
>[0];

export async function withTenantTransaction<T>(
  organizationId: string,
  operation: (transaction: TenantTransaction) => Promise<T>,
): Promise<T> {
  return db.transaction(async (transaction) => {
    await transaction.execute(
      sql`select set_config('app.organization_id', ${organizationId}, true)`,
    );
    return operation(transaction);
  });
}
