export type SubscriptionState =
  "trialing" | "active" | "past_due" | "restricted" | "canceled" | "expired";

const allowed: Record<SubscriptionState, ReadonlySet<SubscriptionState>> = {
  trialing: new Set(["active", "restricted", "canceled", "expired"]),
  active: new Set(["past_due", "restricted", "canceled"]),
  past_due: new Set(["active", "restricted", "canceled"]),
  restricted: new Set(["active", "past_due", "canceled", "expired"]),
  canceled: new Set(),
  expired: new Set(),
};

export function canTransitionSubscription(
  from: SubscriptionState,
  to: SubscriptionState,
): boolean {
  return allowed[from].has(to);
}

export function assertSubscriptionTransition(
  from: SubscriptionState,
  to: SubscriptionState,
): void {
  if (!canTransitionSubscription(from, to)) {
    throw new Error(`Subscription cannot transition from ${from} to ${to}.`);
  }
}

export function subscriptionAllowsNewUsage(
  status: SubscriptionState | null,
): boolean {
  return status === "trialing" || status === "active";
}
