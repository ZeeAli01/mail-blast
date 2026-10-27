import { requirePlatformPermission } from "@/src/server/auth/authorization";
import { db } from "@/src/server/db/client";
import { auditEvents, systemControls } from "@/src/server/db/schema";
import { AppError, apiFailure, apiSuccess } from "@/src/server/http";
import { newId } from "@/src/server/ids";
import { z } from "zod";

const controlSchema = z.object({
  scopeType: z.enum([
    "global",
    "environment",
    "organization",
    "sender_domain",
    "campaign",
  ]),
  scopeId: z.string().min(1).optional(),
  key: z.enum([
    "stop_scheduling",
    "stop_processing",
    "stop_imports",
    "read_only",
  ]),
  reason: z.string().trim().min(10).max(1000),
  expiresAt: z.iso.datetime().optional(),
  approvedByUserId: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const { user } = await requirePlatformPermission(
      "platform.security.manage",
    );
    const input = controlSchema.parse(await request.json());
    const highRisk = input.scopeType === "global";
    if (
      highRisk &&
      (!input.approvedByUserId || input.approvedByUserId === user.id)
    ) {
      throw new AppError(
        "FORBIDDEN",
        "A separate platform owner approval is required.",
        403,
      );
    }
    const id = newId();
    await db.transaction(async (tx) => {
      await tx.insert(systemControls).values({
        id,
        scopeType: input.scopeType,
        scopeId: input.scopeId,
        key: input.key,
        enabled: true,
        reason: input.reason,
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
        activatedByUserId: user.id,
        approvedByUserId: input.approvedByUserId,
      });
      await tx.insert(auditEvents).values({
        id: newId(),
        actorUserId: user.id,
        actorType: "platform_operator",
        action: "system_control.activated",
        targetType: "system_control",
        targetId: id,
        after: input,
      });
    });
    return apiSuccess(request, { id, active: true, highRisk }, 201);
  } catch (error) {
    return apiFailure(request, error);
  }
}
