import { requireOrganizationPermission } from "@/src/server/auth/authorization";
import { getEffectiveConfiguration } from "@/src/server/config/effective";
import {
  audienceSnapshotMembers,
  audienceSnapshots,
  auditEvents,
  campaignApprovals,
  campaigns,
  campaignVersions,
  contacts,
  deliveries,
  jobs,
  organizations,
  outboxEvents,
  senderDomains,
  senderIdentities,
  suppressionEntries,
  systemControls,
  unsubscribeTokens,
  usageLedger,
} from "@/src/server/db/schema";
import { withTenantTransaction } from "@/src/server/db/tenant";
import { getServerEnvironment } from "@/src/server/env";
import { AppError, apiFailure, apiSuccess } from "@/src/server/http";
import { newId } from "@/src/server/ids";
import {
  renderTemplate,
  templateDocumentSchema,
} from "@/src/server/templates/renderer";
import {
  digestUnsubscribeToken,
  signUnsubscribeReference,
} from "@/src/server/unsubscribe/tokens";
import { and, eq, gt, inArray, isNull, notExists, or, sql } from "drizzle-orm";
import { z } from "zod";

const scheduleSchema = z.object({ scheduledAt: z.iso.datetime().optional() });

export async function POST(
  request: Request,
  context: { params: Promise<{ campaignId: string }> },
) {
  try {
    const { campaignId } = await context.params;
    const organizationId = request.headers.get("x-organization-id")?.trim();
    const idempotencyKey = request.headers.get("idempotency-key")?.trim();
    if (!organizationId || !idempotencyKey)
      throw new AppError(
        "VALIDATION_ERROR",
        "X-Organization-Id and Idempotency-Key are required.",
        422,
      );
    const { user } = await requireOrganizationPermission(
      organizationId,
      "campaigns.schedule",
    );
    const input = scheduleSchema.parse(await request.json().catch(() => ({})));
    const scheduledAt = input.scheduledAt
      ? new Date(input.scheduledAt)
      : new Date();
    if (
      scheduledAt.getTime() < Date.now() - 60_000 ||
      scheduledAt.getTime() > Date.now() + 366 * 86_400_000
    )
      throw new AppError(
        "VALIDATION_ERROR",
        "Schedule time must be between now and one year from now.",
        422,
      );

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
      if (campaign.status !== "approved")
        throw new AppError(
          "CONFLICT",
          "Only the approved current version can be scheduled.",
          409,
        );
      const [version] = await tx
        .select()
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
      const [approval] = await tx
        .select({ id: campaignApprovals.id })
        .from(campaignApprovals)
        .where(
          and(
            eq(campaignApprovals.campaignVersionId, version.id),
            eq(campaignApprovals.decision, "approved"),
          ),
        )
        .limit(1);
      if (!approval)
        throw new AppError("CONFLICT", "Approval is missing or stale.", 409);
      if (!campaign.senderIdentityId)
        throw new AppError(
          "CONFIGURATION_REQUIRED",
          "A ready sender identity is required.",
          409,
        );
      const [sender] = await tx
        .select({
          localPart: senderIdentities.localPart,
          displayName: senderIdentities.displayName,
          replyTo: senderIdentities.replyTo,
          status: senderIdentities.status,
          domain: senderDomains.domain,
        })
        .from(senderIdentities)
        .innerJoin(
          senderDomains,
          eq(senderDomains.id, senderIdentities.domainId),
        )
        .where(
          and(
            eq(senderIdentities.id, campaign.senderIdentityId),
            eq(senderIdentities.organizationId, organizationId),
          ),
        )
        .limit(1);
      if (
        !sender ||
        !inArrayValue(sender.status, ["simulated_verified", "verified"])
      )
        throw new AppError(
          "CONFIGURATION_REQUIRED",
          "Sender identity is not ready.",
          409,
        );
      const [organization] = await tx
        .select({
          name: organizations.name,
          legalName: organizations.legalName,
          address: organizations.address,
        })
        .from(organizations)
        .where(eq(organizations.id, organizationId))
        .limit(1);
      if (!organization?.legalName || !organization.address)
        throw new AppError(
          "CONFIGURATION_REQUIRED",
          "Legal business name and postal address are required.",
          409,
        );
      const activeControls = await tx
        .select({ key: systemControls.key })
        .from(systemControls)
        .where(
          and(
            eq(systemControls.enabled, true),
            isNull(systemControls.deactivatedAt),
            inArray(systemControls.key, ["stop_scheduling", "stop_processing"]),
            or(
              isNull(systemControls.expiresAt),
              gt(systemControls.expiresAt, new Date()),
            ),
            or(
              eq(systemControls.scopeType, "global"),
              and(
                eq(systemControls.scopeType, "organization"),
                eq(systemControls.scopeId, organizationId),
              ),
            ),
          ),
        )
        .limit(1);
      if (activeControls.length)
        throw new AppError(
          "FORBIDDEN",
          "A platform safety control prevents scheduling.",
          403,
        );
      const configuration = await getEffectiveConfiguration(tx, organizationId);
      if (
        configuration.values["campaigns.scheduling_enabled"] !== true ||
        configuration.values["campaigns.capture_enabled"] !== true
      )
        throw new AppError(
          "FORBIDDEN",
          "Campaign capture is disabled for this workspace.",
          403,
        );
      const audience = await tx
        .select({
          id: contacts.id,
          email: contacts.email,
          normalizedEmail: contacts.normalizedEmail,
          firstName: contacts.firstName,
          lastName: contacts.lastName,
        })
        .from(contacts)
        .where(
          and(
            eq(contacts.organizationId, organizationId),
            eq(contacts.status, "subscribed"),
            notExists(
              tx
                .select({ id: suppressionEntries.id })
                .from(suppressionEntries)
                .where(
                  and(
                    eq(suppressionEntries.organizationId, organizationId),
                    eq(
                      suppressionEntries.normalizedEmail,
                      contacts.normalizedEmail,
                    ),
                    eq(suppressionEntries.active, true),
                  ),
                ),
            ),
          ),
        );
      if (audience.length === 0)
        throw new AppError(
          "CONFIGURATION_REQUIRED",
          "The audience has no eligible consented contacts.",
          409,
        );
      const maxCampaign = Number(
        configuration.values["sends.max_campaign_recipients"],
      );
      if (audience.length > maxCampaign)
        throw new AppError(
          "FORBIDDEN",
          `Audience exceeds the ${maxCampaign} recipient campaign limit.`,
          403,
        );
      const monthStart = new Date(
        Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1),
      );
      const [usage] = await tx
        .select({
          total: sql<number>`coalesce(sum(${usageLedger.quantity}), 0)`,
        })
        .from(usageLedger)
        .where(
          and(
            eq(usageLedger.organizationId, organizationId),
            eq(usageLedger.metric, "captured_recipients"),
            gt(usageLedger.occurredAt, monthStart),
          ),
        );
      const monthlyMax = Number(
        configuration.values["sends.max_monthly_recipients"],
      );
      if (Number(usage?.total ?? 0) + audience.length > monthlyMax)
        throw new AppError(
          "FORBIDDEN",
          "Monthly recipient allowance would be exceeded.",
          403,
        );

      const snapshotId = newId();
      await tx.insert(audienceSnapshots).values({
        id: snapshotId,
        organizationId,
        campaignId,
        campaignVersionId: version.id,
        eligibleCount: audience.length,
        excludedCount: 0,
      });
      await tx.insert(audienceSnapshotMembers).values(
        audience.map((contact) => ({
          id: newId(),
          snapshotId,
          contactId: contact.id,
          eligibility: "eligible",
          mergeData: {
            firstName: contact.firstName,
            lastName: contact.lastName,
          },
        })),
      );
      for (const contact of audience) {
        const deliveryId = newId();
        const rawToken = signUnsubscribeReference(newId());
        const unsubscribeUrl = `${getServerEnvironment().APP_URL}/api/v1/public/unsubscribe/${encodeURIComponent(rawToken)}`;
        const document = templateDocumentSchema.parse({
          ...(version.document as Record<string, unknown>),
          legalFooter: {
            organizationName: organization.legalName,
            postalAddress: organization.address,
            unsubscribeUrl,
          },
        });
        const rendered = renderTemplate(document);
        await tx.insert(deliveries).values({
          id: deliveryId,
          organizationId,
          campaignId,
          audienceSnapshotId: snapshotId,
          contactId: contact.id,
          idempotencyKey: `${campaignId}:${contact.id}`,
        });
        await tx.insert(unsubscribeTokens).values({
          id: newId(),
          tokenDigest: digestUnsubscribeToken(rawToken),
          organizationId,
          deliveryId,
          contactId: contact.id,
          campaignId,
          topicId: campaign.topicId,
          expiresAt: new Date(Date.now() + 365 * 86_400_000),
        });
        await tx.insert(jobs).values({
          id: newId(),
          organizationId,
          type: "capture_delivery",
          payload: {
            organizationId,
            campaignId,
            deliveryId,
            contactId: contact.id,
            normalizedEmail: contact.normalizedEmail,
            idempotencyKey: `${campaignId}:${contact.id}`,
            to: contact.email,
            from: `${sender.displayName} <${sender.localPart}@${sender.domain}>`,
            replyTo: sender.replyTo,
            subject: version.subject,
            html: rendered.html,
            text: rendered.text,
          },
          idempotencyKey: `capture:${campaignId}:${contact.id}`,
          runAt: scheduledAt,
        });
      }
      await tx.insert(usageLedger).values({
        id: newId(),
        organizationId,
        metric: "captured_recipients",
        quantity: audience.length,
        kind: "reservation",
        referenceId: campaignId,
        idempotencyKey: `schedule:${idempotencyKey}`,
      });
      await tx
        .update(campaigns)
        .set({ status: "scheduled", scheduledAt, updatedAt: new Date() })
        .where(eq(campaigns.id, campaignId));
      await tx.insert(auditEvents).values({
        id: newId(),
        organizationId,
        actorUserId: user.id,
        actorType: "user",
        action: "campaign.scheduled",
        targetType: "campaign",
        targetId: campaignId,
        after: {
          scheduledAt,
          eligibleCount: audience.length,
          snapshotId,
          configurationHash: configuration.hash,
        },
      });
      await tx.insert(outboxEvents).values({
        id: newId(),
        organizationId,
        topic: "campaign.scheduled",
        aggregateType: "campaign",
        aggregateId: campaignId,
        payload: { snapshotId, scheduledAt, eligibleCount: audience.length },
        idempotencyKey: `outbox:schedule:${idempotencyKey}`,
      });
      return {
        id: campaignId,
        status: "scheduled",
        scheduledAt,
        eligibleCount: audience.length,
        snapshotId,
      };
    });
    return apiSuccess(request, result);
  } catch (error) {
    return apiFailure(request, error);
  }
}

function inArrayValue<T extends string>(
  value: string,
  choices: readonly T[],
): value is T {
  return choices.includes(value as T);
}
