import "server-only";

import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { db } from "../db/client";
import {
  organizationMembershipRoles,
  organizationMemberships,
  platformOperatorRoles,
} from "../db/schema";
import { AppError } from "../http";
import { auth } from "./auth";
import {
  hasOrganizationPermission,
  hasPlatformPermission,
  type OrganizationPermission,
  type OrganizationRole,
  type PlatformPermission,
  type PlatformRole,
} from "./permissions";

export async function requireUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session)
    throw new AppError("AUTHENTICATION_REQUIRED", "Sign in is required.", 401);
  return session.user;
}

export async function requireOrganizationPermission(
  organizationId: string,
  permission: OrganizationPermission,
) {
  const currentUser = await requireUser();
  const rows = await db
    .select({ role: organizationMembershipRoles.role })
    .from(organizationMemberships)
    .innerJoin(
      organizationMembershipRoles,
      eq(organizationMembershipRoles.membershipId, organizationMemberships.id),
    )
    .where(
      and(
        eq(organizationMemberships.organizationId, organizationId),
        eq(organizationMemberships.userId, currentUser.id),
        eq(organizationMemberships.status, "active"),
      ),
    );
  const roles = rows.map((row) => row.role as OrganizationRole);
  if (!hasOrganizationPermission(roles, permission)) {
    throw new AppError(
      "FORBIDDEN",
      "You do not have permission for this action.",
      403,
    );
  }
  return { user: currentUser, roles };
}

export async function requirePlatformPermission(
  permission: PlatformPermission,
) {
  const currentUser = await requireUser();
  const rows = await db
    .select({ role: platformOperatorRoles.role })
    .from(platformOperatorRoles)
    .where(eq(platformOperatorRoles.userId, currentUser.id));
  const roles = rows.map((row) => row.role as PlatformRole);
  if (!hasPlatformPermission(roles, permission)) {
    throw new AppError(
      "FORBIDDEN",
      "Platform operator permission is required.",
      403,
    );
  }
  return { user: currentUser, roles };
}
