import { createHash } from "node:crypto";
import { requireOrganizationPermission } from "@/src/server/auth/authorization";
import {
  auditEvents,
  campaigns,
  campaignVersions,
} from "@/src/server/db/schema";
import { withTenantTransaction } from "@/src/server/db/tenant";
import { apiFailure, apiSuccess } from "@/src/server/http";
import { newId } from "@/src/server/ids";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";

const createCampaignSchema = z.object({
  name: z.string().trim().min(2).max(200),
  subject: z.string().trim().min(1).max(300),
  preheader: z.string().trim().max(500).optional(),
  document: z.record(z.string(), z.unknown()),
  audienceDefinition: z.record(z.string(), z.unknown()),
  senderIdentityId: z.string().optional(),
  templateId: z.string().optional(),
  topicId: z.string().optional(),
});

export async function GET(
  request: Request,
  context: { params: Promise<{ orgId: string }> },
) {
  try {
    const { orgId } = await context.params;
    await requireOrganizationPermission(orgId, "campaigns.read");
    const rows = await withTenantTransaction(orgId, (tx) =>
      tx
        .select()
        .from(campaigns)
        .where(eq(campaigns.organizationId, orgId))
        .orderBy(desc(campaigns.createdAt))
        .limit(100),
    );
    return apiSuccess(request, rows);
  } catch (error) {
    return apiFailure(request, error);
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ orgId: string }> },
) {
  try {
    const { orgId } = await context.params;
    const { user } = await requireOrganizationPermission(
      orgId,
      "campaigns.create",
    );
    const input = createCampaignSchema.parse(await request.json());
    const campaignId = newId();
    const campaignVersionId = newId();
    const payloadHash = createHash("sha256")
      .update(
        JSON.stringify({
          subject: input.subject,
          document: input.document,
          audience: input.audienceDefinition,
        }),
      )
      .digest("hex");
    await withTenantTransaction(orgId, async (tx) => {
      await tx.insert(campaigns).values({
        id: campaignId,
        organizationId: orgId,
        name: input.name,
        senderIdentityId: input.senderIdentityId,
        templateId: input.templateId,
        topicId: input.topicId,
        createdByUserId: user.id,
      });
      await tx.insert(campaignVersions).values({
        id: campaignVersionId,
        campaignId,
        version: 1,
        subject: input.subject,
        preheader: input.preheader,
        document: input.document,
        audienceDefinition: input.audienceDefinition,
        payloadHash,
        rendererVersion: "1",
        createdByUserId: user.id,
      });
      await tx.insert(auditEvents).values({
        id: newId(),
        organizationId: orgId,
        actorUserId: user.id,
        actorType: "user",
        action: "campaign.created",
        targetType: "campaign",
        targetId: campaignId,
        after: { name: input.name, version: 1, payloadHash },
      });
    });
    return apiSuccess(
      request,
      {
        id: campaignId,
        versionId: campaignVersionId,
        status: "draft",
        payloadHash,
      },
      201,
    );
  } catch (error) {
    return apiFailure(request, error);
  }
}
