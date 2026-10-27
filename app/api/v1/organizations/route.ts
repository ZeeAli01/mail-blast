import { requireUser } from "@/src/server/auth/authorization";
import { db } from "@/src/server/db/client";
import {
  auditEvents,
  organizationMembershipRoles,
  organizationMemberships,
  organizations,
  outboxEvents,
} from "@/src/server/db/schema";
import { apiFailure, apiSuccess } from "@/src/server/http";
import { newId } from "@/src/server/ids";
import { withTenantTransaction } from "@/src/server/db/tenant";
import { eq } from "drizzle-orm";
import { z } from "zod";

const createOrganizationSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .min(2)
    .max(63),
  timezone: z.string().trim().min(1).max(100).default("UTC"),
});

export async function GET(request: Request) {
  try {
    const currentUser = await requireUser();
    const rows = await db
      .select({
        id: organizations.id,
        slug: organizations.slug,
        name: organizations.name,
        status: organizations.status,
        timezone: organizations.timezone,
      })
      .from(organizationMemberships)
      .innerJoin(
        organizations,
        eq(organizations.id, organizationMemberships.organizationId),
      )
      .where(eq(organizationMemberships.userId, currentUser.id));
    return apiSuccess(request, rows);
  } catch (error) {
    return apiFailure(request, error);
  }
}

export async function POST(request: Request) {
  try {
    const currentUser = await requireUser();
    const input = createOrganizationSchema.parse(await request.json());
    const organizationId = newId();
    const membershipId = newId();
    await withTenantTransaction(organizationId, async (tx) => {
      await tx.insert(organizations).values({ id: organizationId, ...input });
      await tx
        .insert(organizationMemberships)
        .values({ id: membershipId, organizationId, userId: currentUser.id });
      await tx
        .insert(organizationMembershipRoles)
        .values({ membershipId, role: "owner" });
      await tx.insert(auditEvents).values({
        id: newId(),
        organizationId,
        actorUserId: currentUser.id,
        actorType: "user",
        action: "organization.created",
        targetType: "organization",
        targetId: organizationId,
        after: input,
      });
      await tx.insert(outboxEvents).values({
        id: newId(),
        organizationId,
        topic: "organization.created",
        aggregateType: "organization",
        aggregateId: organizationId,
        payload: input,
        idempotencyKey: `organization.created:${organizationId}`,
      });
    });
    return apiSuccess(request, { id: organizationId, ...input }, 201);
  } catch (error) {
    return apiFailure(request, error);
  }
}
