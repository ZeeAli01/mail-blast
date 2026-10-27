import { requireOrganizationPermission } from "@/src/server/auth/authorization";
import { auditEvents, organizations } from "@/src/server/db/schema";
import { withTenantTransaction } from "@/src/server/db/tenant";
import { apiFailure, apiSuccess } from "@/src/server/http";
import { newId } from "@/src/server/ids";
import { eq } from "drizzle-orm";
import { z } from "zod";

const settingsSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  timezone: z.string().trim().min(1).max(100).optional(),
  legalName: z.string().trim().min(2).max(300).optional(),
  address: z.string().trim().min(5).max(1000).optional(),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ orgId: string }> },
) {
  try {
    const { orgId } = await context.params;
    const { user } = await requireOrganizationPermission(
      orgId,
      "organization.manage",
    );
    const input = settingsSchema.parse(await request.json());
    const result = await withTenantTransaction(orgId, async (tx) => {
      const [before] = await tx
        .select()
        .from(organizations)
        .where(eq(organizations.id, orgId))
        .limit(1);
      await tx
        .update(organizations)
        .set({ ...input, updatedAt: new Date() })
        .where(eq(organizations.id, orgId));
      await tx.insert(auditEvents).values({
        id: newId(),
        organizationId: orgId,
        actorUserId: user.id,
        actorType: "user",
        action: "organization.settings.updated",
        targetType: "organization",
        targetId: orgId,
        before,
        after: input,
      });
      return { id: orgId, ...input };
    });
    return apiSuccess(request, result);
  } catch (error) {
    return apiFailure(request, error);
  }
}
