import { describe, expect, it } from "vitest";
import { evaluateLeadEligibility } from "@/src/server/leads/eligibility";

const safeLead = {
  messageClass: "marketing" as const,
  permission: "consented" as const,
  verification: "deliverable" as const,
  suppressed: false,
  sourceTrusted: true,
  hasCurrentSourceEvidence: true,
  hasQualifyingIntentSignal: true,
};

describe("lead eligibility", () => {
  it("keeps warmness separate from campaign eligibility", () => {
    const result = evaluateLeadEligibility({
      ...safeLead,
      permission: "unknown",
    });
    expect(result.warm).toBe(true);
    expect(result.eligible).toBe(false);
    expect(result.reasons).toContain("MARKETING_PERMISSION_MISSING");
  });

  it("never permits a suppressed contact", () => {
    const result = evaluateLeadEligibility({ ...safeLead, suppressed: true });
    expect(result.eligible).toBe(false);
    expect(result.reasons).toContain("SUPPRESSED");
  });

  it("requires an intent signal for sales follow-up", () => {
    const result = evaluateLeadEligibility({
      ...safeLead,
      messageClass: "sales_follow_up",
      hasQualifyingIntentSignal: false,
    });
    expect(result.eligible).toBe(false);
    expect(result.warm).toBe(false);
    expect(result.reasons).toContain("QUALIFYING_INTENT_SIGNAL_MISSING");
  });

  it("allows an evidenced, consented, deliverable lead", () => {
    expect(evaluateLeadEligibility(safeLead)).toEqual({
      eligible: true,
      warm: true,
      reasons: [],
    });
  });
});
