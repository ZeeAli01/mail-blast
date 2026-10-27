import { requireOrganizationPermission } from "@/src/server/auth/authorization";
import { auditEvents, consentEvents, contacts } from "@/src/server/db/schema";
import { withTenantTransaction } from "@/src/server/db/tenant";
import { apiFailure, apiSuccess } from "@/src/server/http";
import { newId } from "@/src/server/ids";
import { and, desc, eq, ilike, or } from "drizzle-orm";
import { z } from "zod";

const contactSchema = z.object({
  email: z.email().max(320),
  firstName: z.string().trim().max(100).optional(),
  lastName: z.string().trim().max(100).optional(),
  consentBasis: z.enum(["explicit", "contract", "legitimate_interest"]),
  consentSource: z.string().trim().min(2).max(200),
});

export async function GET(
  request: Request,
  context: { params: Promise<{ orgId: string }> },
) {
  try {
    const { orgId } = await context.params;
    await requireOrganizationPermission(orgId, "contacts.read");
    const query = new URL(request.url).searchParams.get("q")?.trim();
    const filter = query
      ? and(
          eq(contacts.organizationId, orgId),
          or(
            ilike(contacts.email, `%${query}%`),
            ilike(contacts.firstName, `%${query}%`),
            ilike(contacts.lastName, `%${query}%`),
          ),
        )
      : eq(contacts.organizationId, orgId);
    const rows = await withTenantTransaction(orgId, (tx) =>
      tx
        .select()
        .from(contacts)
        .where(filter)
        .orderBy(desc(contacts.createdAt))
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
      "contacts.create",
    );
    const input = contactSchema.parse(await request.json());
    const normalizedEmail = input.email.trim().toLowerCase();
    const contactId = newId();
    await withTenantTransaction(orgId, async (tx) => {
      await tx.insert(contacts).values({
        id: contactId,
        organizationId: orgId,
        email: input.email,
        normalizedEmail,
        firstName: input.firstName,
        lastName: input.lastName,
      });
      await tx.insert(consentEvents).values({
        id: newId(),
        organizationId: orgId,
        contactId,
        action: "granted",
        basis: input.consentBasis,
        source: input.consentSource,
        actorUserId: user.id,
      });
      await tx.insert(auditEvents).values({
        id: newId(),
        organizationId: orgId,
        actorUserId: user.id,
        actorType: "user",
        action: "contact.created",
        targetType: "contact",
        targetId: contactId,
        after: { email: normalizedEmail, consentBasis: input.consentBasis },
      });
    });
    return apiSuccess(request, { id: contactId, email: normalizedEmail }, 201);
  } catch (error) {
    return apiFailure(request, error);
  }
}
