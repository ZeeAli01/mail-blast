import { requireOrganizationPermission } from "@/src/server/auth/authorization";
import { deliveries } from "@/src/server/db/schema";
import { withTenantTransaction } from "@/src/server/db/tenant";
import { AppError, apiFailure, apiSuccess } from "@/src/server/http";
import { and, desc, eq } from "drizzle-orm";

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
    const rows = await withTenantTransaction(organizationId, (tx) =>
      tx
        .select({
          id: deliveries.id,
          contactId: deliveries.contactId,
          status: deliveries.status,
          finalReason: deliveries.finalReason,
          providerMessageId: deliveries.providerMessageId,
          createdAt: deliveries.createdAt,
          updatedAt: deliveries.updatedAt,
        })
        .from(deliveries)
        .where(
          and(
            eq(deliveries.campaignId, campaignId),
            eq(deliveries.organizationId, organizationId),
          ),
        )
        .orderBy(desc(deliveries.createdAt))
        .limit(500),
    );
    return apiSuccess(request, rows);
  } catch (error) {
    return apiFailure(request, error);
  }
}
