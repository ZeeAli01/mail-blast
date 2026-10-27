export const organizationPermissions = [
  "organization.read",
  "organization.manage",
  "members.read",
  "members.manage",
  "contacts.read",
  "contacts.create",
  "contacts.edit",
  "contacts.delete",
  "contacts.import",
  "contacts.export",
  "suppressions.read",
  "suppressions.manage",
  "templates.read",
  "templates.create",
  "templates.edit",
  "templates.delete",
  "campaigns.read",
  "campaigns.create",
  "campaigns.edit",
  "campaigns.submit",
  "campaigns.approve",
  "campaigns.schedule",
  "campaigns.cancel",
  "reports.read",
  "billing.read",
  "billing.manage",
  "audit.read",
] as const;

export type OrganizationPermission = (typeof organizationPermissions)[number];
export type OrganizationRole =
  "owner" | "admin" | "approver" | "editor" | "analyst" | "billing_manager";

const all = new Set<OrganizationPermission>(organizationPermissions);
const rolePermissions: Record<
  OrganizationRole,
  ReadonlySet<OrganizationPermission>
> = {
  owner: all,
  admin: new Set(organizationPermissions.filter((p) => p !== "billing.manage")),
  approver: new Set([
    "organization.read",
    "contacts.read",
    "templates.read",
    "campaigns.read",
    "campaigns.approve",
    "campaigns.schedule",
    "campaigns.cancel",
    "reports.read",
  ]),
  editor: new Set([
    "organization.read",
    "contacts.read",
    "contacts.create",
    "contacts.edit",
    "contacts.import",
    "suppressions.read",
    "templates.read",
    "templates.create",
    "templates.edit",
    "campaigns.read",
    "campaigns.create",
    "campaigns.edit",
    "campaigns.submit",
    "reports.read",
  ]),
  analyst: new Set([
    "organization.read",
    "contacts.read",
    "templates.read",
    "campaigns.read",
    "reports.read",
  ]),
  billing_manager: new Set([
    "organization.read",
    "billing.read",
    "billing.manage",
  ]),
};

export function hasOrganizationPermission(
  roles: readonly OrganizationRole[],
  permission: OrganizationPermission,
): boolean {
  return roles.some((role) => rolePermissions[role].has(permission));
}

export const platformPermissions = [
  "platform.organizations.read",
  "platform.organizations.manage",
  "platform.subscriptions.manage",
  "platform.entitlements.manage",
  "platform.billing.manage",
  "platform.security.manage",
  "platform.audit.read",
  "platform.support.impersonate",
] as const;
export type PlatformPermission = (typeof platformPermissions)[number];
export type PlatformRole =
  | "platform_owner"
  | "support_operator"
  | "finance_operator"
  | "security_operator";

const platformRolePermissions: Record<
  PlatformRole,
  ReadonlySet<PlatformPermission>
> = {
  platform_owner: new Set(platformPermissions),
  support_operator: new Set([
    "platform.organizations.read",
    "platform.audit.read",
    "platform.support.impersonate",
  ]),
  finance_operator: new Set([
    "platform.organizations.read",
    "platform.subscriptions.manage",
    "platform.billing.manage",
    "platform.audit.read",
  ]),
  security_operator: new Set([
    "platform.organizations.read",
    "platform.security.manage",
    "platform.audit.read",
  ]),
};

export function hasPlatformPermission(
  roles: readonly PlatformRole[],
  permission: PlatformPermission,
): boolean {
  return roles.some((role) => platformRolePermissions[role].has(permission));
}
