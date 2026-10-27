import { describe, expect, it } from "vitest";
import {
  canTransitionCampaign,
  runCampaignPreflight,
} from "@/src/server/campaigns/state-machine";
import {
  canTransitionSubscription,
  subscriptionAllowsNewUsage,
} from "@/src/server/subscriptions/state-machine";

describe("state machines", () => {
  it("never edits a completed campaign back to draft", () => {
    expect(canTransitionCampaign("completed", "draft")).toBe(false);
    expect(canTransitionCampaign("approved", "scheduled")).toBe(true);
  });
  it("keeps terminal subscriptions terminal", () => {
    expect(canTransitionSubscription("canceled", "active")).toBe(false);
    expect(subscriptionAllowsNewUsage("restricted")).toBe(false);
  });
  it("blocks unsafe campaigns and explains exclusions", () => {
    const issues = runCampaignPreflight({
      subject: "",
      hasBody: false,
      senderReady: false,
      legalIdentityReady: false,
      unsubscribePresent: false,
      eligibleRecipients: 20,
      suppressedRecipients: 3,
      maxCampaignRecipients: 10,
      monthlyRemaining: 5,
      approvalRequired: true,
      approvedCurrentVersion: false,
      systemSendingStopped: true,
    });
    expect(issues.some((issue) => issue.code === "SUBJECT_REQUIRED")).toBe(
      true,
    );
    expect(
      issues.some(
        (issue) =>
          issue.code === "RECIPIENTS_EXCLUDED" && issue.severity === "warning",
      ),
    ).toBe(true);
    expect(
      issues.filter((issue) => issue.severity === "error").length,
    ).toBeGreaterThan(5);
  });
});
