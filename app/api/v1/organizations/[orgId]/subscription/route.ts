import { requireOrganizationPermission } from "@/src/server/auth/authorization";
import { getEffectiveConfiguration } from "@/src/server/config/effective";
import { planVersions, plans, subscriptions } from "@/src/server/db/schema";
import { withTenantTransaction } from "@/src/server/db/tenant";
import { apiFailure, apiSuccess } from "@/src/server/http";
import { and, desc, eq } from "drizzle-orm";

export async function GET(
  request: Request,
  context: { params: Promise<{ orgId: string }> },
) {
  try {
    const { orgId } = await context.params;
    await requireOrganizationPermission(orgId, "billing.read");
    const result = await withTenantTransaction(orgId, async (tx) => {
      const [subscription] = await tx
        .select({
          id: subscriptions.id,
          status: subscriptions.status,
          trialEndsAt: subscriptions.trialEndsAt,
          currentPeriodStartsAt: subscriptions.currentPeriodStartsAt,
          currentPeriodEndsAt: subscriptions.currentPeriodEndsAt,
          cancelAtPeriodEnd: subscriptions.cancelAtPeriodEnd,
          provider: subscriptions.provider,
          planCode: plans.code,
          planName: planVersions.name,
        })
        .from(subscriptions)
        .innerJoin(
          planVersions,
          eq(planVersions.id, subscriptions.planVersionId),
        )
        .innerJoin(plans, eq(plans.id, planVersions.planId))
        .where(and(eq(subscriptions.organizationId, orgId)))
        .orderBy(desc(subscriptions.createdAt))
        .limit(1);
      const configuration = await getEffectiveConfiguration(tx, orgId);
      return {
        subscription: subscription ?? null,
        configuration,
        paymentCollectionEnabled: false,
        billingMode: "local",
      };
    });
    return apiSuccess(request, result);
  } catch (error) {
    return apiFailure(request, error);
  }
}
