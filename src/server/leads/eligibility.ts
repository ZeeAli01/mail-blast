export const permissionStates = [
  "unknown",
  "consented",
  "soft_opt_in",
  "legitimate_interest_reviewed",
  "contractual",
  "transactional_only",
  "opted_out",
  "prohibited",
] as const;

export const verificationStates = [
  "unverified",
  "syntax_valid",
  "deliverable",
  "risky",
  "undeliverable",
  "unknown",
] as const;

export type PermissionState = (typeof permissionStates)[number];
export type VerificationState = (typeof verificationStates)[number];
export type MessageClass = "marketing" | "sales_follow_up" | "transactional";

export interface LeadEligibilityInput {
  messageClass: MessageClass;
  permission: PermissionState;
  verification: VerificationState;
  suppressed: boolean;
  sourceTrusted: boolean;
  hasCurrentSourceEvidence: boolean;
  hasQualifyingIntentSignal: boolean;
}

export interface LeadEligibilityResult {
  eligible: boolean;
  warm: boolean;
  reasons: string[];
}

const marketingPermissions = new Set<PermissionState>([
  "consented",
  "soft_opt_in",
  "legitimate_interest_reviewed",
]);

export function evaluateLeadEligibility(
  input: LeadEligibilityInput,
): LeadEligibilityResult {
  const reasons: string[] = [];

  if (input.suppressed) reasons.push("SUPPRESSED");
  if (!input.sourceTrusted) reasons.push("SOURCE_NOT_TRUSTED");
  if (!input.hasCurrentSourceEvidence) reasons.push("SOURCE_EVIDENCE_MISSING");
  if (["undeliverable", "risky", "unknown"].includes(input.verification))
    reasons.push("EMAIL_NOT_CONFIRMED_DELIVERABLE");

  if (
    input.messageClass === "marketing" &&
    !marketingPermissions.has(input.permission)
  )
    reasons.push("MARKETING_PERMISSION_MISSING");

  if (
    input.messageClass === "sales_follow_up" &&
    !input.hasQualifyingIntentSignal
  )
    reasons.push("QUALIFYING_INTENT_SIGNAL_MISSING");

  if (
    input.messageClass === "transactional" &&
    !["contractual", "transactional_only", "consented"].includes(
      input.permission,
    )
  )
    reasons.push("TRANSACTIONAL_BASIS_MISSING");

  return {
    eligible: reasons.length === 0,
    warm:
      input.hasQualifyingIntentSignal &&
      input.sourceTrusted &&
      input.hasCurrentSourceEvidence,
    reasons,
  };
}
