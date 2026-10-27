import { describe, expect, it } from "vitest";
import { resolveEffectiveConfiguration } from "@/src/server/config/entitlements";

describe("effective configuration", () => {
  it("applies explicit precedence and records the winning source", () => {
    const result = resolveEffectiveConfiguration([
      { source: "plan", values: { "contacts.max": 1_000 } },
      { source: "override", values: { "contacts.max": 2_000 } },
      { source: "control", values: { "campaigns.scheduling_enabled": false } },
    ]);
    expect(result.values["contacts.max"]).toBe(2_000);
    expect(result.sourceMap["contacts.max"]).toBe("override");
    expect(result.values["campaigns.scheduling_enabled"]).toBe(false);
    expect(result.hash).toMatch(/^[a-f0-9]{64}$/);
  });
  it("rejects out-of-range owner overrides", () => {
    expect(() =>
      resolveEffectiveConfiguration([
        { source: "override", values: { "team.max_members": 0 } },
      ]),
    ).toThrow();
  });
});
