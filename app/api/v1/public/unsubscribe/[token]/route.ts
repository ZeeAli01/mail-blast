import { db } from "@/src/server/db/client";
import {
  consentEvents,
  contacts,
  suppressionEntries,
  unsubscribeTokens,
} from "@/src/server/db/schema";
import { withTenantTransaction } from "@/src/server/db/tenant";
import { AppError, apiFailure, apiSuccess } from "@/src/server/http";
import { newId } from "@/src/server/ids";
import {
  digestUnsubscribeToken,
  verifyUnsubscribeReference,
} from "@/src/server/unsubscribe/tokens";
import { and, eq, gt, isNull } from "drizzle-orm";

async function resolveToken(rawToken: string) {
  if (!verifyUnsubscribeReference(rawToken))
    throw new AppError("NOT_FOUND", "This unsubscribe link is invalid.", 404);
  const [token] = await db
    .select()
    .from(unsubscribeTokens)
    .where(
      and(
        eq(unsubscribeTokens.tokenDigest, digestUnsubscribeToken(rawToken)),
        gt(unsubscribeTokens.expiresAt, new Date()),
        isNull(unsubscribeTokens.consumedAt),
      ),
    )
    .limit(1);
  if (!token)
    throw new AppError(
      "NOT_FOUND",
      "This unsubscribe link is invalid or expired.",
      404,
    );
  return token;
}

export async function GET(
  request: Request,
  context: { params: Promise<{ token: string }> },
) {
  try {
    const token = await resolveToken((await context.params).token);
    return apiSuccess(request, {
      organizationId: token.organizationId,
      topicId: token.topicId,
      confirmationRequired: true,
    });
  } catch (error) {
    return apiFailure(request, error);
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ token: string }> },
) {
  try {
    const rawToken = (await context.params).token;
    const token = await resolveToken(rawToken);
    await withTenantTransaction(token.organizationId, async (tx) => {
      const [contact] = await tx
        .select({ email: contacts.normalizedEmail })
        .from(contacts)
        .where(eq(contacts.id, token.contactId))
        .limit(1);
      if (!contact) throw new AppError("NOT_FOUND", "Contact not found.", 404);
      await tx.insert(suppressionEntries).values({
        id: newId(),
        organizationId: token.organizationId,
        contactId: token.contactId,
        normalizedEmail: contact.email,
        reason: "unsubscribe",
        source: "public_unsubscribe",
      });
      await tx.insert(consentEvents).values({
        id: newId(),
        organizationId: token.organizationId,
        contactId: token.contactId,
        topicId: token.topicId,
        action: "unsubscribed",
        basis: "recipient_request",
        source: "public_unsubscribe",
      });
      await tx
        .update(contacts)
        .set({ status: "unsubscribed", updatedAt: new Date() })
        .where(eq(contacts.id, token.contactId));
      await tx
        .update(unsubscribeTokens)
        .set({ consumedAt: new Date() })
        .where(eq(unsubscribeTokens.id, token.id));
    });
    return apiSuccess(request, { unsubscribed: true });
  } catch (error) {
    return apiFailure(request, error);
  }
}
