import { requireOrganizationPermission } from "@/src/server/auth/authorization";
import { runCampaignPreflight } from "@/src/server/campaigns/state-machine";
import { campaigns } from "@/src/server/db/schema";
import { withTenantTransaction } from "@/src/server/db/tenant";
import { AppError, apiFailure, apiSuccess } from "@/src/server/http";
import { eq } from "drizzle-orm";
import { z } from "zod";

const preflightSchema = z.object({
  subject: z.string(),
  hasBody: z.boolean(),
  senderReady: z.boolean(),
  legalIdentityReady: z.boolean(),
  unsubscribePresent: z.boolean(),
  eligibleRecipients: z.number().int().min(0),
  suppressedRecipients: z.number().int().min(0),
  maxCampaignRecipients: z.number().int().min(0),
  monthlyRemaining: z.number().int().min(0),
  approvalRequired: z.boolean(),
  approvedCurrentVersion: z.boolean(),
  systemSendingStopped: z.boolean(),
});

export async function POST(
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
    await requireOrganizationPermission(organizationId, "campaigns.read");
    const [campaign] = await withTenantTransaction(organizationId, (tx) =>
      tx
        .select({ organizationId: campaigns.organizationId })
        .from(campaigns)
        .where(eq(campaigns.id, campaignId))
        .limit(1),
    );
    if (!campaign) throw new AppError("NOT_FOUND", "Campaign not found.", 404);
    const issues = runCampaignPreflight(
      preflightSchema.parse(await request.json()),
    );
    return apiSuccess(request, {
      ready: !issues.some((issue) => issue.severity === "error"),
      issues,
    });
  } catch (error) {
    return apiFailure(request, error);
  }
}
