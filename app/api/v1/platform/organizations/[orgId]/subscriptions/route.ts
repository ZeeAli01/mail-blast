import { requirePlatformPermission } from "@/src/server/auth/authorization";
import {
  auditEvents,
  outboxEvents,
  subscriptions,
  subscriptionEvents,
} from "@/src/server/db/schema";
import { AppError, apiFailure, apiSuccess } from "@/src/server/http";
import { newId } from "@/src/server/ids";
import { withTenantTransaction } from "@/src/server/db/tenant";
import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";

const subscriptionSchema = z.object({
  planVersionId: z.string().min(1),
  status: z.enum(["trialing", "active"]).default("trialing"),
  trialDays: z.number().int().min(1).max(365).default(14),
  periodDays: z.number().int().min(1).max(366).default(30),
  reason: z.string().trim().min(5).max(1000),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ orgId: string }> },
) {
  try {
    const { orgId } = await context.params;
    const { user } = await requirePlatformPermission(
      "platform.subscriptions.manage",
    );
    const idempotencyKey = request.headers.get("idempotency-key")?.trim();
    if (!idempotencyKey)
      throw new AppError(
        "VALIDATION_ERROR",
        "Idempotency-Key is required.",
        422,
      );
    const input = subscriptionSchema.parse(await request.json());
    const existing = await withTenantTransaction(orgId, (tx) =>
      tx
        .select({ id: subscriptions.id })
        .from(subscriptions)
        .where(
          and(
            eq(subscriptions.organizationId, orgId),
            inArray(subscriptions.status, [
              "trialing",
              "active",
              "past_due",
              "restricted",
            ]),
          ),
        )
        .limit(1),
    );
    if (existing.length)
      throw new AppError(
        "CONFLICT",
        "This organization already has a current subscription.",
        409,
      );
    const now = new Date();
    const periodEnd = new Date(now.getTime() + input.periodDays * 86_400_000);
    const trialEnd =
      input.status === "trialing"
        ? new Date(now.getTime() + input.trialDays * 86_400_000)
        : null;
    const subscriptionId = newId();
    await withTenantTransaction(orgId, async (tx) => {
      await tx.insert(subscriptions).values({
        id: subscriptionId,
        organizationId: orgId,
        planVersionId: input.planVersionId,
        status: input.status,
        trialEndsAt: trialEnd,
        currentPeriodStartsAt: now,
        currentPeriodEndsAt: periodEnd,
      });
      await tx.insert(subscriptionEvents).values({
        id: newId(),
        organizationId: orgId,
        subscriptionId,
        eventType: "subscription.created",
        nextStatus: input.status,
        payload: { reason: input.reason },
        idempotencyKey,
        actorUserId: user.id,
      });
      await tx.insert(auditEvents).values({
        id: newId(),
        organizationId: orgId,
        actorUserId: user.id,
        actorType: "platform_operator",
        action: "subscription.created",
        targetType: "subscription",
        targetId: subscriptionId,
        after: { ...input, provider: "local" },
      });
      await tx.insert(outboxEvents).values({
        id: newId(),
        organizationId: orgId,
        topic: "subscription.changed",
        aggregateType: "subscription",
        aggregateId: subscriptionId,
        payload: { status: input.status, planVersionId: input.planVersionId },
        idempotencyKey: `outbox:${idempotencyKey}`,
      });
    });
    return apiSuccess(
      request,
      {
        id: subscriptionId,
        provider: "local",
        payable: false,
        status: input.status,
      },
      201,
    );
  } catch (error) {
    return apiFailure(request, error);
  }
}
