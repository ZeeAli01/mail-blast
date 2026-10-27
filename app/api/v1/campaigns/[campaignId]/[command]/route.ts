import { requireOrganizationPermission } from "@/src/server/auth/authorization";
import {
  assertCampaignTransition,
  type CampaignState,
} from "@/src/server/campaigns/state-machine";
import {
  auditEvents,
  campaignApprovals,
  campaigns,
  campaignVersions,
} from "@/src/server/db/schema";
import { withTenantTransaction } from "@/src/server/db/tenant";
import { AppError, apiFailure, apiSuccess } from "@/src/server/http";
import { newId } from "@/src/server/ids";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

const commandSchema = z.object({
  comment: z.string().trim().max(2000).optional(),
});
const commands = {
  "submit-review": {
    permission: "campaigns.submit",
    from: ["draft", "changes_requested"],
    to: "in_review",
  },
  approve: {
    permission: "campaigns.approve",
    from: ["in_review"],
    to: "approved",
  },
  "request-changes": {
    permission: "campaigns.approve",
    from: ["in_review"],
    to: "changes_requested",
  },
  cancel: {
    permission: "campaigns.cancel",
    from: [
      "draft",
      "in_review",
      "changes_requested",
      "approved",
      "scheduled",
      "processing",
      "paused",
    ],
    to: "canceled",
  },
  pause: { permission: "campaigns.cancel", from: ["processing"], to: "paused" },
  resume: {
    permission: "campaigns.schedule",
    from: ["paused"],
    to: "processing",
  },
} as const;

export async function POST(
  request: Request,
  context: { params: Promise<{ campaignId: string; command: string }> },
) {
  try {
    const { campaignId, command } = await context.params;
    const definition = commands[command as keyof typeof commands];
    if (!definition)
      throw new AppError("NOT_FOUND", "Campaign command not found.", 404);
    const organizationId = request.headers.get("x-organization-id")?.trim();
    if (!organizationId)
      throw new AppError(
        "VALIDATION_ERROR",
        "X-Organization-Id is required.",
        422,
      );
    const { user } = await requireOrganizationPermission(
      organizationId,
      definition.permission,
    );
    const input = commandSchema.parse(await request.json().catch(() => ({})));
    const result = await withTenantTransaction(organizationId, async (tx) => {
      const [campaign] = await tx
        .select()
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
      if (!(definition.from as readonly string[]).includes(campaign.status))
        throw new AppError(
          "CONFLICT",
          `Command ${command} is not valid while campaign is ${campaign.status}.`,
          409,
        );
      assertCampaignTransition(campaign.status as CampaignState, definition.to);
      const [version] = await tx
        .select({ id: campaignVersions.id })
        .from(campaignVersions)
        .where(
          and(
            eq(campaignVersions.campaignId, campaignId),
            eq(campaignVersions.version, campaign.currentVersion),
          ),
        )
        .limit(1);
      if (!version)
        throw new AppError(
          "CONFLICT",
          "Current campaign version is missing.",
          409,
        );
      if (command === "approve" || command === "request-changes") {
        await tx.insert(campaignApprovals).values({
          id: newId(),
          campaignId,
          campaignVersionId: version.id,
          decision: command === "approve" ? "approved" : "changes_requested",
          comment: input.comment,
          decidedByUserId: user.id,
        });
      }
      await tx
        .update(campaigns)
        .set({ status: definition.to, updatedAt: new Date() })
        .where(eq(campaigns.id, campaignId));
      await tx.insert(auditEvents).values({
        id: newId(),
        organizationId,
        actorUserId: user.id,
        actorType: "user",
        action: `campaign.${command}`,
        targetType: "campaign",
        targetId: campaignId,
        before: { status: campaign.status },
        after: { status: definition.to, version: campaign.currentVersion },
        metadata: { comment: input.comment },
      });
      return {
        id: campaignId,
        status: definition.to,
        version: campaign.currentVersion,
      };
    });
    return apiSuccess(request, result);
  } catch (error) {
    return apiFailure(request, error);
  }
}
