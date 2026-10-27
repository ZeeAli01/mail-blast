import { requireOrganizationPermission } from "@/src/server/auth/authorization";
import { campaigns, deliveries } from "@/src/server/db/schema";
import { withTenantTransaction } from "@/src/server/db/tenant";
import { AppError, apiFailure, apiSuccess } from "@/src/server/http";
import { and, eq, sql } from "drizzle-orm";

export async function GET(
  request: Request,
  context: { params: Promise<{ campaignId: string }> },
) {
  try {
    const { campaignId } = await context.params;
    const organizationId = request.headers.get("x-organization-id")?.trim();
    if (!organizationId)
      throw new AppError(
        "VALIDATION_ERROR",
        "X-Organization-Id is required.",
        422,
      );
    await requireOrganizationPermission(organizationId, "reports.read");
    const result = await withTenantTransaction(organizationId, async (tx) => {
      const [campaign] = await tx
        .select({
          id: campaigns.id,
          name: campaigns.name,
          status: campaigns.status,
          scheduledAt: campaigns.scheduledAt,
          completedAt: campaigns.completedAt,
        })
        .from(campaigns)
        .where(
          and(
            eq(campaigns.id, campaignId),
            eq(campaigns.organizationId, organizationId),
          ),
        )
        .limit(1);
      if (!campaign)
        throw new AppError("NOT_FOUND", "Campaign not found.", 404);
      const counts = await tx
        .select({
          status: deliveries.status,
          count: sql<number>`count(*)::int`,
        })
        .from(deliveries)
        .where(eq(deliveries.campaignId, campaignId))
        .groupBy(deliveries.status);
      return {
        campaign,
        metrics: Object.fromEntries(
          counts.map((row) => [row.status, Number(row.count)]),
        ),
        definitions: {
          captured:
            "A local capture artifact was written; this does not mean an external email was delivered.",
          suppressed:
            "Excluded at the final consent/suppression or campaign-state check.",
          failed: "Capture processing exhausted its retry policy.",
        },
      };
    });
    return apiSuccess(request, result);
  } catch (error) {
    return apiFailure(request, error);
  }
}
