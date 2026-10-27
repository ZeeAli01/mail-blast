export type CampaignState =
  | "draft"
  | "in_review"
  | "changes_requested"
  | "approved"
  | "scheduled"
  | "processing"
  | "paused"
  | "completed"
  | "canceled"
  | "failed";

const transitions: Record<CampaignState, ReadonlySet<CampaignState>> = {
  draft: new Set(["in_review", "canceled"]),
  in_review: new Set(["changes_requested", "approved", "canceled"]),
  changes_requested: new Set(["draft", "in_review", "canceled"]),
  approved: new Set(["draft", "scheduled", "canceled"]),
  scheduled: new Set(["processing", "canceled"]),
  processing: new Set(["paused", "completed", "failed", "canceled"]),
  paused: new Set(["processing", "canceled"]),
  completed: new Set(),
  canceled: new Set(),
  failed: new Set(),
};

export function canTransitionCampaign(
  from: CampaignState,
  to: CampaignState,
): boolean {
  return transitions[from].has(to);
}

export function assertCampaignTransition(
  from: CampaignState,
  to: CampaignState,
): void {
  if (!canTransitionCampaign(from, to)) {
    throw new Error(`Campaign cannot transition from ${from} to ${to}.`);
  }
}

export type PreflightInput = {
  subject: string;
  hasBody: boolean;
  senderReady: boolean;
  legalIdentityReady: boolean;
  unsubscribePresent: boolean;
  eligibleRecipients: number;
  suppressedRecipients: number;
  maxCampaignRecipients: number;
  monthlyRemaining: number;
  approvalRequired: boolean;
  approvedCurrentVersion: boolean;
  systemSendingStopped: boolean;
};

export type PreflightIssue = {
  code: string;
  severity: "error" | "warning";
  message: string;
};

export function runCampaignPreflight(input: PreflightInput): PreflightIssue[] {
  const issues: PreflightIssue[] = [];
  if (!input.subject.trim())
    issues.push(error("SUBJECT_REQUIRED", "Add a subject line."));
  if (!input.hasBody)
    issues.push(error("BODY_REQUIRED", "Add campaign content."));
  if (!input.senderReady)
    issues.push(
      error("SENDER_NOT_READY", "Configure an approved sender identity."),
    );
  if (!input.legalIdentityReady)
    issues.push(
      error(
        "LEGAL_IDENTITY_REQUIRED",
        "Add the sender's legal identity and postal address.",
      ),
    );
  if (!input.unsubscribePresent)
    issues.push(
      error(
        "UNSUBSCRIBE_REQUIRED",
        "Marketing campaigns require an unsubscribe link.",
      ),
    );
  if (input.eligibleRecipients === 0)
    issues.push(
      error(
        "EMPTY_AUDIENCE",
        "The selected audience has no eligible recipients.",
      ),
    );
  if (input.eligibleRecipients > input.maxCampaignRecipients)
    issues.push(
      error(
        "CAMPAIGN_LIMIT_EXCEEDED",
        "The eligible audience exceeds the campaign limit.",
      ),
    );
  if (input.eligibleRecipients > input.monthlyRemaining)
    issues.push(
      error(
        "MONTHLY_LIMIT_EXCEEDED",
        "The eligible audience exceeds remaining monthly usage.",
      ),
    );
  if (input.approvalRequired && !input.approvedCurrentVersion)
    issues.push(
      error(
        "APPROVAL_REQUIRED",
        "The current campaign version requires approval.",
      ),
    );
  if (input.systemSendingStopped)
    issues.push(
      error(
        "SYSTEM_STOP_ACTIVE",
        "A platform safety control is preventing campaign processing.",
      ),
    );
  if (input.suppressedRecipients > 0)
    issues.push({
      code: "RECIPIENTS_EXCLUDED",
      severity: "warning",
      message: `${input.suppressedRecipients} recipient(s) will be excluded by consent or suppression rules.`,
    });
  return issues;
}

function error(code: string, message: string): PreflightIssue {
  return { code, message, severity: "error" };
}
