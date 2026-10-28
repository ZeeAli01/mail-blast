export const campaignCategories = [
  "saas_growth",
  "customer_lifecycle",
  "events",
  "newsletter",
  "sales_assisted",
  "transactional",
] as const;

export const campaignTypes = [
  "inbound_lead_nurture",
  "demo_follow_up",
  "trial_onboarding",
  "activation",
  "product_education",
  "feature_announcement",
  "upgrade_cross_sell",
  "renewal",
  "churn_prevention",
  "win_back",
  "webinar_event",
  "newsletter_digest",
  "customer_advocacy",
  "service_notice",
] as const;

export type CampaignCategory = (typeof campaignCategories)[number];
export type CampaignType = (typeof campaignTypes)[number];

export const saasCampaignPlaybooks: ReadonlyArray<{
  type: CampaignType;
  label: string;
  requiredSignal: string;
  primaryGoal: string;
}> = [
  {
    type: "inbound_lead_nurture",
    label: "Inbound lead nurture",
    requiredSignal: "Form submission or permissioned content request",
    primaryGoal: "Move an interested lead to a qualified conversation",
  },
  {
    type: "demo_follow_up",
    label: "Demo follow-up",
    requiredSignal: "Demo request, meeting, or recorded sales interaction",
    primaryGoal: "Help the buyer evaluate and decide",
  },
  {
    type: "trial_onboarding",
    label: "Trial onboarding",
    requiredSignal: "Active trial or account creation",
    primaryGoal: "Reach first value quickly",
  },
  {
    type: "activation",
    label: "Activation",
    requiredSignal: "Permissioned product usage event",
    primaryGoal: "Complete the next valuable product action",
  },
  {
    type: "renewal",
    label: "Renewal",
    requiredSignal: "Current customer contract and renewal window",
    primaryGoal: "Retain the customer with clear value evidence",
  },
  {
    type: "churn_prevention",
    label: "Churn prevention",
    requiredSignal: "Declining usage, support risk, or cancellation intent",
    primaryGoal: "Resolve friction before the customer leaves",
  },
];
