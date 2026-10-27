# ADR 0000: Free-first architecture

- Status: accepted
- Date: 2026-10-28

## Context

The prototype must become a subscription-based, multi-tenant campaign product without using paid infrastructure during implementation and without exposing real recipients or payment data.

## Decision

Use the locked stack and boundaries in `docs/IMPLEMENTATION_BLUEPRINT.md`: Next.js, PostgreSQL, Drizzle, Better Auth, a PostgreSQL job queue, local storage, capture-only email, and local/manual billing. Real delivery and payment providers remain a separately approved phase.

## Consequences

- The complete workflow can be built and tested locally.
- Provider integrations remain replaceable through explicit adapters.
- Public email delivery and payment collection remain unavailable until their safety and business gates pass.
