# Project status

Updated: 2026-10-28

## Objective

Implement the free-first campaign SaaS defined in `IMPLEMENTATION_BLUEPRINT.md` while keeping real email delivery and real payment collection disabled.

## Current state

The free-first foundation from WP-00 through WP-08 is represented as an integrated vertical slice. Real provider readiness (WP-09) remains intentionally deferred.

## Implemented

- Fail-closed legacy delivery and removal of Python/Gmail delivery paths.
- Patched dependencies, npm quality tooling, CI, tests, and licensing.
- Sixty-table PostgreSQL/Drizzle model, migration, separated database roles, core RLS, jobs, outbox, and audit.
- Better Auth email/password sessions with locally captured verification/reset links.
- Organization roles and separately authorized platform operators.
- Immutable plans, local subscriptions, usage structures, typed per-business overrides, and safety controls.
- Consent-aware contacts/suppressions, templates/renderer, versioned campaigns/preflight, capture provider, and signed unsubscribe.
- Account, onboarding, workspace, product, and founder control-plane interfaces.

## Local verification environment

The initial database-runtime constraint was resolved by installing PostgreSQL 16.15. The migration, seed, health check, runtime/worker privilege separation, RLS isolation, account verification, authenticated UI, subscription override, complete capture campaign, reporting, and unsubscribe flows passed locally. Docker Compose remains the reproducible alternative.

## Intentionally deferred

- Real ESP delivery, DNS verification, provider webhooks, and warm-up.
- Real payment checkout, tax, refunds, and payment webhooks.
- Production infrastructure, independent penetration testing, and legal/compliance counsel review.

## Safety invariants

- No real external email delivery.
- No real payment collection.
- No paid service introduced without owner approval.
- No customer may bypass consent, suppression, tenant isolation, or audit controls.
