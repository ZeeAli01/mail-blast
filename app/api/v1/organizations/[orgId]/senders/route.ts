import { requireOrganizationPermission } from "@/src/server/auth/authorization";
import {
  auditEvents,
  senderDomains,
  senderIdentities,
} from "@/src/server/db/schema";
import { withTenantTransaction } from "@/src/server/db/tenant";
import { apiFailure, apiSuccess } from "@/src/server/http";
import { newId } from "@/src/server/ids";
import { eq } from "drizzle-orm";
import { z } from "zod";

const senderSchema = z.object({
  domain: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/),
  localPart: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]{1,64}$/),
  displayName: z.string().trim().min(2).max(200),
  replyTo: z.email().optional(),
});

export async function GET(
  request: Request,
  context: { params: Promise<{ orgId: string }> },
) {
  try {
    const { orgId } = await context.params;
    await requireOrganizationPermission(orgId, "organization.read");
    const rows = await withTenantTransaction(orgId, (tx) =>
      tx
        .select({
          id: senderIdentities.id,
          displayName: senderIdentities.displayName,
          localPart: senderIdentities.localPart,
          replyTo: senderIdentities.replyTo,
          status: senderIdentities.status,
          domain: senderDomains.domain,
          verificationMode: senderDomains.verificationMode,
        })
        .from(senderIdentities)
        .innerJoin(
          senderDomains,
          eq(senderDomains.id, senderIdentities.domainId),
        )
        .where(eq(senderIdentities.organizationId, orgId)),
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
      "organization.manage",
    );
    const input = senderSchema.parse(await request.json());
    const domainId = newId();
    const senderId = newId();
    await withTenantTransaction(orgId, async (tx) => {
      await tx.insert(senderDomains).values({
        id: domainId,
        organizationId: orgId,
        domain: input.domain,
        status: "simulated_verified",
        verificationMode: "simulation",
        verificationDetails: {
          warning: "Development simulation only; no DNS verification occurred.",
        },
        verifiedAt: new Date(),
      });
      await tx.insert(senderIdentities).values({
        id: senderId,
        organizationId: orgId,
        domainId,
        localPart: input.localPart,
        displayName: input.displayName,
        replyTo: input.replyTo,
        status: "simulated_verified",
      });
      await tx.insert(auditEvents).values({
        id: newId(),
        organizationId: orgId,
        actorUserId: user.id,
        actorType: "user",
        action: "sender.simulated",
        targetType: "sender_identity",
        targetId: senderId,
        after: {
          domain: input.domain,
          localPart: input.localPart,
          verificationMode: "simulation",
        },
      });
    });
    return apiSuccess(
      request,
      {
        id: senderId,
        domain: input.domain,
        status: "simulated_verified",
        verificationMode: "simulation",
      },
      201,
    );
  } catch (error) {
    return apiFailure(request, error);
  }
}
