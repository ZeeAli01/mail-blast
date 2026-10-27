import { requirePlatformPermission } from "@/src/server/auth/authorization";
import {
  entitlementRegistry,
  type EntitlementKey,
} from "@/src/server/config/entitlements";
import {
  auditEvents,
  entitlementOverrides,
  outboxEvents,
} from "@/src/server/db/schema";
import { AppError, apiFailure, apiSuccess } from "@/src/server/http";
import { newId } from "@/src/server/ids";
import { withTenantTransaction } from "@/src/server/db/tenant";
import { z } from "zod";

const overrideSchema = z.object({
  key: z.string(),
  value: z.unknown(),
  reason: z.string().trim().min(10).max(1000),
  expiresAt: z.iso.datetime().optional(),
  approvedByUserId: z.string().optional(),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ orgId: string }> },
) {
  try {
    const { orgId } = await context.params;
    const { user } = await requirePlatformPermission(
      "platform.entitlements.manage",
    );
    const input = overrideSchema.parse(await request.json());
    const validator = entitlementRegistry[input.key as EntitlementKey];
    if (!validator)
      throw new AppError("VALIDATION_ERROR", "Unknown entitlement key.", 422);
    const value = validator.parse(input.value);
    const highRisk =
      input.key.startsWith("sends.") &&
      typeof value === "number" &&
      value > 100_000;
    if (
      highRisk &&
      (!input.approvedByUserId || input.approvedByUserId === user.id)
    ) {
      throw new AppError(
        "FORBIDDEN",
        "A different platform owner must approve this high-risk override.",
        403,
      );
    }
    const overrideId = newId();
    await withTenantTransaction(orgId, async (tx) => {
      await tx.insert(entitlementOverrides).values({
        id: overrideId,
        organizationId: orgId,
        entitlementKey: input.key,
        value,
        reason: input.reason,
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
        createdByUserId: user.id,
        approvedByUserId: input.approvedByUserId,
      });
      await tx.insert(auditEvents).values({
        id: newId(),
        organizationId: orgId,
        actorUserId: user.id,
        actorType: "platform_operator",
        action: "entitlement.override.created",
        targetType: "entitlement_override",
        targetId: overrideId,
        after: {
          key: input.key,
          value,
          reason: input.reason,
          expiresAt: input.expiresAt,
        },
      });
      await tx.insert(outboxEvents).values({
        id: newId(),
        organizationId: orgId,
        topic: "configuration.recalculate",
        aggregateType: "organization",
        aggregateId: orgId,
        payload: { overrideId },
        idempotencyKey: `configuration.recalculate:${overrideId}`,
      });
    });
    return apiSuccess(
      request,
      { id: overrideId, key: input.key, value, highRisk },
      201,
    );
  } catch (error) {
    return apiFailure(request, error);
  }
}
