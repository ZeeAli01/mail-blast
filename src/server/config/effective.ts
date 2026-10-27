import { and, eq, gt, inArray, isNull, lte, or } from "drizzle-orm";
import {
  entitlementOverrides,
  planEntitlements,
  subscriptions,
} from "../db/schema";
import type { TenantTransaction } from "../db/tenant";
import {
  resolveEffectiveConfiguration,
  type EntitlementValues,
} from "./entitlements";

export async function getEffectiveConfiguration(
  tx: TenantTransaction,
  organizationId: string,
) {
  const [subscription] = await tx
    .select({ planVersionId: subscriptions.planVersionId })
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.organizationId, organizationId),
        inArray(subscriptions.status, ["trialing", "active"]),
      ),
    )
    .limit(1);
  const planRows = subscription
    ? await tx
        .select({
          key: planEntitlements.entitlementKey,
          value: planEntitlements.value,
        })
        .from(planEntitlements)
        .where(eq(planEntitlements.planVersionId, subscription.planVersionId))
    : [];
  const now = new Date();
  const overrideRows = await tx
    .select({
      key: entitlementOverrides.entitlementKey,
      value: entitlementOverrides.value,
    })
    .from(entitlementOverrides)
    .where(
      and(
        eq(entitlementOverrides.organizationId, organizationId),
        lte(entitlementOverrides.startsAt, now),
        isNull(entitlementOverrides.supersededAt),
        or(
          isNull(entitlementOverrides.expiresAt),
          gt(entitlementOverrides.expiresAt, now),
        ),
      ),
    );
  return resolveEffectiveConfiguration([
    {
      source: "plan",
      values: Object.fromEntries(
        planRows.map((row) => [row.key, row.value]),
      ) as EntitlementValues,
    },
    {
      source: "override",
      values: Object.fromEntries(
        overrideRows.map((row) => [row.key, row.value]),
      ) as EntitlementValues,
    },
  ]);
}
