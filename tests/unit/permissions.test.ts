import { describe, expect, it } from "vitest";
import {
  hasOrganizationPermission,
  hasPlatformPermission,
} from "@/src/server/auth/permissions";

describe("permission resolution", () => {
  it("gives an owner all organization permissions", () => {
    expect(hasOrganizationPermission(["owner"], "billing.manage")).toBe(true);
    expect(hasOrganizationPermission(["owner"], "campaigns.approve")).toBe(
      true,
    );
  });
  it("keeps editors away from approvals and billing", () => {
    expect(hasOrganizationPermission(["editor"], "campaigns.edit")).toBe(true);
    expect(hasOrganizationPermission(["editor"], "campaigns.approve")).toBe(
      false,
    );
    expect(hasOrganizationPermission(["editor"], "billing.manage")).toBe(false);
  });
  it("separates platform and organization authority", () => {
    expect(
      hasPlatformPermission(["finance_operator"], "platform.billing.manage"),
    ).toBe(true);
    expect(
      hasPlatformPermission(["support_operator"], "platform.billing.manage"),
    ).toBe(false);
  });
});
