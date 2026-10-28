# Project log

## 2026-10-29 — warm-lead campaign foundation

- Researched official sender, privacy/direct-marketing, verification, and source-platform requirements.
- Added the normative worldwide warm-lead campaign product blueprint.
- Kept PostgreSQL as the authoritative system instead of replacing transactional tenant, billing, campaign, and audit controls with MongoDB.
- Added seven provenance/discovery tables, campaign classification, forced RLS policies, and a generated migration.
- Added tested eligibility rules that separate warmth from legal and operational send eligibility.
- Expanded dashboard navigation and the public landing page while keeping external delivery disabled.
- Applied and verified the migration against local PostgreSQL 16; format, lint, typecheck, tests, database check, and production build passed.

## 2026-10-28

- Began implementation from the free-first blueprint.
- Recorded the repository baseline and local tool availability.
- Started WP-00 safety and tooling work.
- Removed personal-Gmail/Python delivery paths and made the legacy route fail closed.
- Added current quality tooling, CI, dependency audit fixes, license, and architecture decisions.
- Implemented the 60-table schema, initial migration, database role separation, and core RLS.
- Integrated Better Auth, permissions, local storage, PostgreSQL jobs, and capture-only delivery.
- Implemented subscription/override/control APIs, consent contacts, versioned campaigns, preflight, rendering, and unsubscribe.
- Added customer and platform product surfaces plus unit regression coverage.
- Kept real delivery and payment providers explicitly disabled.
- Installed PostgreSQL 16.15 locally and passed migration, seed, role-denial, RLS tenant-isolation, and worker checks.
- Passed a live account-to-campaign lifecycle ending in one local capture, report metrics, and signed unsubscribe suppression.
- Passed formatting, ESLint, strict TypeScript, 10 unit tests, optimized Next build, and a zero-vulnerability npm audit.
