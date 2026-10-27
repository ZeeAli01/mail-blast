# Implementation blueprint: free-first campaign SaaS

Status: normative implementation specification  
Prepared: 2026-10-26  
Companion strategy: [`PRODUCT_STRATEGY_AND_ROADMAP.md`](./PRODUCT_STRATEGY_AND_ROADMAP.md)  
Current production sending policy: disabled

## 0. How to use this document

This document converts the product strategy into implementable contracts. It is deliberately prescriptive so an engineer or coding model does not invent architecture while working.

Rules:

1. Implement one numbered work package at a time, in dependency order.
2. Treat statements containing **must**, **must not**, or **required** as acceptance criteria.
3. When this document conflicts with the strategy, this implementation blueprint controls technical execution; the strategy controls business intent.
4. Do not silently substitute a different database, authentication system, queue, editor model, package manager, billing model, or sending provider.
5. If a named library's installed API differs from this plan, check its official documentation for the pinned version, record the difference in an architecture decision record (ADR), and adapt the integration without changing the behavioral contract.
6. Do not invent database columns, route shapes, permission names, states, or entitlement keys. Amend this document first when a genuine missing requirement is discovered.
7. Every behavior change requires tests at the lowest useful level and at least one integration test for security-, billing-, consent-, suppression-, or delivery-sensitive behavior.
8. Every database change requires a generated migration, rollback notes, and an updated schema reference.
9. No task may re-enable real external sending or real payment collection during the free-first stages.
10. “Done” means code, validation, authorization, errors, tests, accessibility, audit behavior, and documentation are complete—not merely that a happy-path screen renders.

## 1. Fixed product boundaries

### 1.1 Product being built

A multi-tenant, subscription-based SaaS for businesses and teams to create, review, schedule, and measure permission-based email campaigns. The platform founder controls plans, entitlements, organization-specific configuration, access restrictions, trials, and future billing from a protected control plane.

### 1.2 Initial users

- Platform owner: the founder with full commercial and operational control.
- Platform support operator: can diagnose accounts but cannot alter money or platform safety rules.
- Platform finance operator: can manage billing records, credits, and reconciliation but cannot inspect campaign content by default.
- Platform abuse operator: can restrict sending and review risk evidence but cannot grant paid features.
- Organization owner: owns one customer workspace and its subscription relationship.
- Organization admin: manages members, senders, brands, contacts, and policies.
- Approver: reviews and approves campaigns.
- Editor: creates contacts, templates, and campaigns within policy.
- Analyst: reads reports and exports allowed analytics.
- Billing manager: sees plan, usage, invoices, and billing controls.

One person may hold multiple organization roles. Platform roles and organization roles are separate systems.

### 1.3 Explicitly out of scope for free-first implementation

- Real card charges, bank debits, tax collection, or payouts.
- Real public bulk delivery through Gmail, SES, Resend, SendGrid, Mailgun, or another provider.
- Dedicated IP addresses, automated IP warming, or provider failover.
- Cold-email prospecting, purchased/scraped lists, inbox rotation, or sender-evasion features.
- SMS, WhatsApp, push notifications, landing-page hosting, or CRM replacement.
- AI calls to paid model APIs. AI buttons must not be shown until an approved provider and privacy policy exist.
- Enterprise SAML/SCIM, regional data residency, or contractual SLA enforcement.
- Arbitrary plugins or customer-executed code.
- A general-purpose drag-and-drop web-page builder.

These are deferred, not partially mocked as if available.

## 2. Free-first architecture decisions

### 2.1 Cost policy

Development must run locally with open-source software and no paid account. Optional free cloud tiers must not be required for tests, builds, or feature completion. The application must remain useful in demonstration mode without external network calls.

The existing public deployment may remain a static marketing/demo surface with sending disabled. The authenticated product stays local until a database, secret-storage approach, backups, abuse operations, and production provider decisions are explicitly approved. Do not sign up for a “free” hosted service, enter a credit card, or couple the code to a vendor free tier without an owner decision.

### 2.2 Locked stack

| Concern                | Decision                                                     | Reason                                                     |
| ---------------------- | ------------------------------------------------------------ | ---------------------------------------------------------- |
| Web application        | Existing Next.js App Router + TypeScript                     | Reuse the working repository                               |
| Styling                | Existing Tailwind CSS and custom component styles            | No paid design system                                      |
| Package manager        | npm only                                                     | Existing `package-lock.json`; eliminate lockfile ambiguity |
| Database               | PostgreSQL 16+                                               | Correct long-term multi-tenant and queue foundation        |
| ORM/migrations         | Drizzle ORM + Drizzle Kit                                    | Typed schema and inspectable SQL migrations                |
| Authentication         | Better Auth with Drizzle PostgreSQL adapter                  | Open-source auth; do not implement passwords manually      |
| Validation             | Zod                                                          | One schema reusable by routes/services/tests               |
| Background work        | PostgreSQL jobs using `FOR UPDATE SKIP LOCKED`               | No Redis or paid queue required initially                  |
| Development email      | Capture provider writing MIME/JSON artifacts locally         | Zero external delivery and zero recipient risk             |
| Optional inbox preview | Mailpit bound to loopback only                               | Free local SMTP viewer; never required in CI               |
| File storage           | Storage interface + local disk driver                        | No paid object storage during development                  |
| Billing                | Billing interface + local/manual provider                    | Build subscription logic without charging money            |
| Testing                | Vitest + Testing Library + Playwright + axe-core             | Unit, integration, browser, and accessibility coverage     |
| Logging                | Structured JSON through Pino or a minimal compatible wrapper | Searchable local logs without a paid service               |
| Monitoring             | Health endpoints + local metrics/logs first                  | External monitoring is deferred                            |
| Localization           | `next-intl` or an equivalent approved open-source library    | Extract strings from the start                             |

Pin exact dependency versions in `package-lock.json`. Before installation, select current patched releases compatible with the installed Next.js version. Run `npm audit --omit=dev`; no known critical or high production vulnerability may be accepted without a documented mitigation, owner, and expiry.

### 2.3 Local services

Provide `compose.yaml` compatible with Docker Compose and Podman Compose:

- `postgres`: PostgreSQL 16, persistent named volume, host port configurable and defaulting to `5432` only if free.
- `mailpit`: optional development profile, UI on loopback, SMTP on loopback, no public binding.

The app and worker run as normal local Node processes for fast development. CI starts PostgreSQL as a service container. No application behavior may depend on Docker Desktop specifically.

### 2.4 Delivery modes

Exactly three modes may exist before a real provider ADR:

| Mode       | Network delivery | Behavior                                                                        |
| ---------- | ---------------- | ------------------------------------------------------------------------------- |
| `disabled` | Never            | All delivery commands return `EMAIL_DELIVERY_DISABLED`                          |
| `capture`  | Never            | Render messages and store capture artifacts; simulate accepted/delivered events |
| `mailpit`  | Loopback only    | Deliver only to an explicitly configured loopback Mailpit host                  |

There is no `production` implementation yet. The SMTP host must not be customer-controlled. `mailpit` mode must reject hosts other than `localhost`, `127.0.0.1`, or `::1`. Production builds default to `disabled` if the mode is absent or invalid.

### 2.5 Billing modes

Only `local` billing exists initially:

- Plans and prices exist in the application database.
- The platform owner can start trials and grant/cancel local subscriptions.
- Invoices are preview records marked `non_payable`; they are not legal payment receipts.
- No checkout form collects card or bank data.
- No UI says payment succeeded.
- Provider IDs remain nullable and unused.

The future payment adapter must implement the same internal commands and events. Product authorization must depend on internal effective entitlements, never directly on a payment-provider API call during a request.

## 3. Repository target structure

Keep the current root-level `app` directory. Do not migrate to `src` during product work.

```text
app/
  (public)/
    page.tsx
    pricing/page.tsx
    legal/{privacy,terms,acceptable-use}/page.tsx
  (auth)/
    sign-in/page.tsx
    sign-up/page.tsx
    verify-email/page.tsx
  (product)/
    layout.tsx
    select-workspace/page.tsx
    [organizationSlug]/
      dashboard/page.tsx
      onboarding/page.tsx
      campaigns/...
      contacts/...
      templates/...
      brands/...
      senders/...
      reports/...
      settings/{general,members,policies,billing,audit}/...
  (platform)/
    platform/...
  api/
    auth/[...all]/route.ts
    v1/...
  layout.tsx
  globals.css
components/
  ui/
  layout/
  forms/
features/
  auth/
  organizations/
  entitlements/
  billing/
  contacts/
  consent/
  suppressions/
  brands/
  templates/
  campaigns/
  approvals/
  delivery/
  reports/
  platform-admin/
lib/
  result.ts
  errors.ts
  ids.ts
  dates.ts
  pagination.ts
  validation.ts
server/
  auth/
  db/
    schema/
    queries/
    migrations-context.ts
  http/
  authorization/
  audit/
  config/
  jobs/
  storage/
  email/
  billing/
  security/
  observability/
drizzle/
scripts/
  bootstrap-owner.mjs
  seed-development.mjs
  worker.mjs
  check-database.mjs
tests/
  unit/
  integration/
  e2e/
  fixtures/
docs/
  decisions/
  api/
  runbooks/
```

Rules:

- Route handlers parse HTTP and call services; they do not contain business logic or raw SQL.
- Feature services contain use cases and return typed results.
- Database queries are tenant-scoped functions; components never import the database client.
- Client components never import `server/*`.
- Shared UI primitives do not know business rules.
- Platform-admin functions live separately and require platform authorization at both route and service layers.
- The deleted Python server endpoint must not return. The CLI must be removed or quarantined outside the product path until it uses platform APIs and policies.

### 3.1 Migration map from current files

| Current file                    | Disposition                                                                                      |
| ------------------------------- | ------------------------------------------------------------------------------------------------ |
| `app/page.tsx`                  | Keep as public landing page; remove product claims that are not implemented                      |
| `components/EmailComposer.tsx`  | Split into campaign form sections; remove direct `fetch('/api/send-email')` and local send state |
| `components/RecipientInput.tsx` | Reuse only for small manual contact entry/test recipients; campaigns select stored audiences     |
| `components/EditorPanel.tsx`    | Replace raw HTML-first editor with the versioned block editor and sandboxed preview              |
| `app/api/send-email/route.ts`   | Keep disabled only through WP-00, then delete when capture delivery command exists               |
| `api/send-email.py`             | Delete in WP-00; do not maintain a second backend                                                |
| `scripts/email_agent.py`        | Archive/remove from the SaaS execution path; never bypass consent/suppression                    |
| `lib/utils.ts`                  | Retain pure generic helpers; move domain validation into feature schemas                         |
| `.env.local.example`            | Replace with `.env.example` contract in Section 4; no personal SMTP defaults                     |
| `README.md`                     | Rewrite incrementally to match setup, safety modes, and implemented scope                        |

Do not perform a visual rewrite while extracting the current UI. Preserve the working visual language until the authenticated shell and design tokens are stable.

## 4. Environment contract

Create `.env.example` with placeholders only:

```dotenv
NODE_ENV=development
APP_URL=http://localhost:3000
DATABASE_URL=postgresql://email_product:email_product@127.0.0.1:5432/email_product
AUTH_SECRET=replace-with-at-least-32-random-bytes
DATA_ENCRYPTION_KEY=replace-with-32-byte-base64-key
LOG_LEVEL=info

EMAIL_DELIVERY_MODE=disabled
EMAIL_CAPTURE_DIR=.local/email-captures
MAILPIT_HOST=127.0.0.1
MAILPIT_PORT=1025

STORAGE_DRIVER=local
LOCAL_STORAGE_ROOT=.local/storage

BILLING_PROVIDER=local
WORKER_POLL_INTERVAL_MS=1000
WORKER_BATCH_SIZE=25

# Used only by the one-time bootstrap command; remove after bootstrap.
BOOTSTRAP_OWNER_EMAIL=owner@example.com
```

Requirements:

- Validate environment variables once at server startup with Zod.
- Client-exposed variables require a deliberate `NEXT_PUBLIC_` entry in a separate schema.
- Never import server environment configuration into client bundles.
- Add `.local/` and every real environment file to `.gitignore`.
- Tests use a separate database whose name ends in `_test`; abort test startup otherwise.
- Secrets must never appear in logs, errors, audit metadata, captured email metadata, or browser responses.

## 5. Universal data conventions

- IDs: UUID generated server-side; never sequential public identifiers.
- Timestamps: PostgreSQL `timestamptz`, stored in UTC, named `created_at`, `updated_at`, etc.
- Money: integer minor units plus uppercase ISO 4217 currency; never floating point.
- Email addresses: preserve display value where needed; compare a normalized lowercase identity. Do not apply Gmail-specific dot/plus normalization.
- Soft deletion: only where recovery/business rules require it. Use `deleted_at`; normal queries exclude deleted rows.
- Immutable event/ledger tables are append-only. Corrections are new reversing/superseding events.
- JSONB: permitted only for versioned document payloads, provider payloads, or controlled metadata. Core queryable fields remain columns.
- Every tenant-owned row contains `organization_id` unless ownership is unambiguously inherited through a non-null foreign key and enforced in queries/RLS.
- Every mutable table has optimistic concurrency through `version integer` or `updated_at` preconditions for collision-prone edits.
- Database constraints are required in addition to application validation.
- User-visible slugs are unique case-insensitively and are not authorization boundaries.

## 6. Identity, tenancy, and permissions

### 6.1 Authentication

Use Better Auth mounted only at `/api/auth/[...all]`. Initial methods:

- Email/password with verified email required before workspace access.
- Password reset with tokens captured locally in development, never printed with secrets in production logs.
- Session revocation and “sign out all devices.”
- Social login, magic links, passkeys, and MFA are deferred until the base integration is tested. Platform operators require MFA before any real production launch.

Do not hand-roll password hashing, session cookies, reset tokens, or CSRF behavior. Record the pinned Better Auth version and generated auth schema in an ADR.

### 6.2 Organization selection

- A user may belong to multiple organizations.
- The active organization comes from the URL slug, resolved server-side to an ID, followed by a current membership check.
- Never accept `organization_id` from request JSON as proof of access.
- Service functions accept an authorization context produced by trusted server middleware: `{ userId, organizationId, organizationRoleSet, platformRoleSet, requestId }`.
- Background jobs carry immutable organization ID from the authorized producer; workers re-check that the organization and relevant campaign are still allowed.

### 6.3 Organization permissions

Permission constants:

```text
organization.read
organization.update
members.read
members.invite
members.manage
billing.read
billing.manage
contacts.read
contacts.write
contacts.import
contacts.export
contacts.delete
suppressions.read
suppressions.manage
brands.read
brands.write
senders.read
senders.manage
templates.read
templates.write
campaigns.read
campaigns.create
campaigns.edit
campaigns.submit
campaigns.approve
campaigns.schedule
campaigns.cancel
reports.read
reports.export
audit.read
api_keys.manage
webhooks.manage
```

Role mapping:

| Permission group      |          Owner |                                        Admin |          Approver |                           Editor |                  Analyst |    Billing manager |
| --------------------- | -------------: | -------------------------------------------: | ----------------: | -------------------------------: | -----------------------: | -----------------: |
| Organization/members  |            All | Read/invite/manage except ownership transfer |              Read |                             Read |                     Read |               Read |
| Billing               |    Read/manage |                                         Read |                No |                               No |                       No |        Read/manage |
| Contacts              |            All |                                          All |              Read |                Read/write/import |                     Read |                 No |
| Contact export/delete |            Yes |                            Policy-controlled |                No |                               No | Policy-controlled export |                 No |
| Brands/senders        |            All |                                          All |              Read |                             Read |                     Read |                 No |
| Templates             |            All |                                          All |              Read |                       Read/write |                     Read |                 No |
| Campaign edit         |            All |                                          All |       Review only |               Create/edit/submit |                     Read |                 No |
| Campaign approve      | Policy permits |                               Policy permits |               Yes |                               No |                       No |                 No |
| Schedule/cancel       |            Yes |                                          Yes | If policy permits | If policy permits after approval |                       No |                 No |
| Reports               |            All |                                          All |              Read |               Own/all per policy |              Read/export |         Usage only |
| Audit                 |           Read |                                         Read |                No |                               No |                       No | Billing audit only |

Owner is not a magic bypass of platform safety rules.

### 6.4 Platform permissions

```text
platform.organizations.read
platform.organizations.configure
platform.subscriptions.manage
platform.finance.read
platform.refunds.manage
platform.abuse.read
platform.abuse.restrict
platform.support.elevate
platform.features.manage
platform.kill_switch.manage
platform.audit.read
platform.operators.manage
```

Platform permissions must be checked separately from organization membership. Platform operators do not automatically become organization members.

## 7. Database schema specification

All unique constraints involving soft-deleted records should use appropriate partial indexes. All foreign keys must state delete behavior explicitly.

### 7.1 Authentication and organizations

Better Auth owns its required user/session/account/verification tables. Product additions:

#### `user_profiles`

- `user_id uuid primary key` -> auth user, cascade delete
- `display_name text not null`
- `locale text not null default 'en'`
- `timezone text not null default 'UTC'`
- `created_at`, `updated_at`

#### `organizations`

- `id uuid primary key`
- `slug text not null`
- `name text not null`
- `status enum(active, restricted, suspended, closing, deleted)`
- `default_locale text not null default 'en'`
- `timezone text not null default 'UTC'`
- `billing_email text null`
- `legal_name text null`
- `physical_address_json jsonb null`
- `version integer not null default 1`
- `created_at`, `updated_at`, `deleted_at`
- unique lowercased slug among non-deleted organizations

#### `organization_memberships`

- `id`, `organization_id`, `user_id`
- `status enum(invited, active, suspended, removed)`
- `joined_at`, `removed_at`, `created_at`, `updated_at`
- unique `(organization_id, user_id)`

#### `organization_membership_roles`

- `membership_id`, `role enum(owner, admin, approver, editor, analyst, billing_manager)`
- composite primary key
- database/service invariant: every active organization has at least one active owner

#### `organization_invitations`

- `id`, `organization_id`, normalized `email`, requested roles array or child rows
- hashed `token_digest`, `expires_at`, `accepted_at`, `revoked_at`
- `invited_by_user_id`, timestamps
- never store plaintext invitation tokens

#### `platform_operator_roles`

- `user_id`, `role enum(platform_owner, support, finance, abuse)`
- `granted_by_user_id`, `created_at`, `revoked_at`
- bootstrap can create only the first platform owner

### 7.2 Plans, subscriptions, and configuration

#### `plans`

- `id`, stable unique `key`, display `name`
- `status enum(draft, published, archived)`
- `created_at`, `updated_at`

#### `plan_versions`

- `id`, `plan_id`, `version_number integer`
- `effective_from`, `retired_at`
- `description`, `public_features_json`
- immutable after first subscription references it
- unique `(plan_id, version_number)`

#### `prices`

- `id`, `plan_version_id`
- `billing_interval enum(month, year, custom)`
- `currency char(3)`, `amount_minor bigint`
- `status enum(active, archived)`, `created_at`
- local billing prices are illustrative and non-payable

#### `entitlement_definitions`

- `key text primary key`
- `value_type enum(boolean, integer, string, string_array)`
- `default_value_json`, `hard_min_json`, `hard_max_json`
- `customer_visible boolean`, `manually_overridable boolean`
- `description`, `created_at`, `updated_at`

Required initial keys:

```text
contacts.max_active                  integer
sends.max_monthly                   integer
sends.max_daily                     integer
sends.max_campaign_recipients       integer
members.max_active                  integer
brands.max                          integer
sender_domains.max                  integer
templates.max                       integer
imports.max_rows                    integer
storage.max_bytes                   integer
api.max_requests_per_minute         integer
campaigns.approval_required_above   integer
features.approvals                  boolean
features.advanced_segments          boolean
features.custom_html                boolean
features.api                        boolean
features.webhooks                   boolean
features.automations                boolean
features.agency_workspaces          boolean
features.white_label_reports        boolean
support.tier                        string
retention.days_after_cancel         integer
```

Free-first seed values are fixed until changed through a reviewed plan version:

| Entitlement          | Sandbox | Starter preview | Growth preview | Local hard maximum |
| -------------------- | ------: | --------------: | -------------: | -----------------: |
| Active contacts      |     100 |           2,000 |         10,000 |            100,000 |
| Captured sends/month |     100 |          20,000 |        100,000 |            250,000 |
| Captured sends/day   |      50 |           2,000 |         10,000 |             25,000 |
| Recipients/campaign  |      25 |           2,000 |         10,000 |             25,000 |
| Active members       |       1 |               3 |             10 |                 50 |
| Brands               |       1 |               2 |              5 |                 20 |
| Sender domains       |       1 |               3 |             10 |                 25 |
| Templates            |      10 |              50 |            250 |              1,000 |
| Import rows/file     |   1,000 |          25,000 |        100,000 |            100,000 |
| Storage              |  50 MiB |         250 MiB |          1 GiB |              2 GiB |

Sandbox has approvals, advanced segments, custom HTML, API, webhooks, automations, agency workspaces, and white-label reports disabled. Starter preview enables approvals only. Growth preview enables approvals and advanced segments. All still use local non-payable billing and capture-only delivery.

The following are platform safety invariants, not entitlements and not manually overridable: tenant authorization, verified/simulated sender requirement, suppression checks, consent attestation, per-recipient messages, protected unsubscribe/legal footer, input limits, delivery-mode network restrictions, audit logging for sensitive actions, and abuse/kill-switch enforcement.

#### `plan_entitlements`

- `plan_version_id`, `entitlement_key`, `value_json`
- composite primary key
- validate type/range through service and migration checks

#### `billing_customers`

- `id`, `organization_id unique`
- `provider enum(local)` initially
- `provider_customer_id null`
- `currency`, `tax_id null`, `billing_address_json null`
- timestamps

#### `subscriptions`

- `id`, `organization_id`, `billing_customer_id`, `plan_version_id`, `price_id`
- `provider enum(local)`, `provider_subscription_id null`
- `status enum(incomplete, trialing, active, past_due, restricted, paused, canceled, unpaid, expired)`
- `trial_ends_at`, `current_period_start`, `current_period_end`
- `cancel_at_period_end boolean`, `canceled_at`, `ended_at`
- `version`, timestamps
- partial unique index: one current nonterminal subscription per organization

#### `subscription_events`

- `id`, `organization_id`, `subscription_id`
- `event_type`, `source enum(local, provider, operator, system)`
- `external_event_id null`, `payload_json`, `occurred_at`, `recorded_at`
- unique provider/external event when not null
- append-only

#### `contract_entitlements`

- `id`, `organization_id`, `commercial_agreement_id`, `entitlement_key`, `value_json`
- `contract_reference`, `effective_from`, `effective_until`
- `created_by_user_id`, `approved_by_user_id null`, `created_at`
- immutable; supersede with a new row

#### `entitlement_overrides`

- `id`, `organization_id`, `entitlement_key`, `value_json`
- `kind enum(complimentary, support, promotion, incident, risk_restriction)`
- `reason`, `reference`, `effective_from`, `effective_until`
- `billing_effect enum(none, future_invoice, included_in_contract)`
- `created_by_user_id`, `approved_by_user_id null`, `revoked_at`, `created_at`
- immutable change record; revocation is explicit

#### `organization_config_versions`

- `id`, `organization_id`, monotonically increasing `version_number`
- `effective_config_json`, `source_map_json`, `config_hash`
- `reason`, `generated_at`
- unique `(organization_id, version_number)` and `config_hash`

#### `organization_policies`

- `id`, `organization_id`, `version_number`
- `approval_required boolean`
- `approval_threshold_recipients integer null`
- allowed From domains stored through normalized policy-domain rows
- `test_capture_required boolean`
- `quiet_hours_json`, `optional_spend_cap_minor null`, `currency null`
- `contact_export_policy enum(owner_admin, owner_only, disabled)`
- `created_by_user_id`, `effective_from`, `superseded_at`, `created_at`
- immutable versions; exactly one current policy per organization
- organization owners/admins may edit only fields allowed by effective entitlements and platform safety rules

#### `commercial_agreements`

- `id`, `organization_id`, `reference`, `status enum(draft, active, expired, terminated)`
- `starts_at`, `ends_at`, `auto_renews boolean`
- `billing_interval`, `currency`, `base_amount_minor`
- `included_usage_json`, `overage_terms_json`, `payment_terms_json`
- `notes_redacted`, `created_by_user_id`, `approved_by_user_id null`, timestamps
- signed documents are not stored directly in this table; only controlled storage references may be added later
- immutable after activation; amendments create a new agreement/version

#### `usage_ledger`

- `id`, `organization_id`, `subscription_id null`
- `metric_key`, `quantity bigint`, `unit`, `idempotency_key`
- `resource_type`, `resource_id`, `occurred_at`, `recorded_at`
- unique `(organization_id, metric_key, idempotency_key)`
- append-only; negative quantity is a reversal with a reference

#### `usage_rollups`

- `organization_id`, `metric_key`, `period_start`, `period_end`, `quantity`
- `calculated_at`, `source_through_at`
- composite primary key; rebuildable from ledger

#### `invoices`

- `id`, `organization_id`, `subscription_id`
- `status enum(draft, non_payable, open, paid, void, uncollectible)`
- `currency`, subtotal/tax/total minor units
- `period_start`, `period_end`, `provider_invoice_id null`
- `invoice_number null`, `finalized_at`, `created_at`
- free-first records must use `non_payable`

#### `invoice_items`

- `id`, `invoice_id`, `type enum(subscription, usage, credit, discount, tax, adjustment)`
- `description`, `quantity bigint`, `unit_amount_minor bigint`, `amount_minor bigint`
- `metric_key null`, `period_start null`, `period_end null`, `source_reference null`
- immutable after invoice finalization

#### `billing_adjustments`

- `id`, `organization_id`, `subscription_id null`
- `type enum(credit, discount, comp, correction)`
- `amount_minor`, `currency`, `reason`, `reference`
- `effective_at`, `expires_at null`, `remaining_amount_minor`
- requester/approver IDs, timestamps
- append-only consumption/reversal events; never overwrite financial history

Coupons and public promotion codes are deferred. Free-first promotional access uses reviewed entitlement overrides or billing adjustments; this avoids building fraud-prone public coupon redemption before real billing exists.

### 7.3 Contacts, consent, and suppressions

#### `contacts`

- `id`, `organization_id`
- `email_original`, `email_normalized`
- `status enum(active, unsubscribed, suppressed, archived, deleted)`
- `first_name`, `last_name`, `locale`, `timezone` nullable
- `custom_fields_json jsonb not null default '{}'`
- `source`, `created_at`, `updated_at`, `archived_at`, `deleted_at`
- unique active identity `(organization_id, email_normalized)`

#### `custom_field_definitions`

- `id`, `organization_id`, stable `key`, display `label`
- `value_type enum(text, number, boolean, date, single_select)`
- `options_json null`, `required boolean default false`, `status enum(active, archived)`
- timestamps, unique active `(organization_id, key)`
- contact custom-field values must validate against the current definition; archived definitions remain readable in history

#### `lists`

- `id`, `organization_id`, `name`, `description`
- `type enum(static, dynamic)`; dynamic implementation deferred until segment engine
- timestamps, unique active lowercased name per organization

#### `list_contacts`

- `list_id`, `contact_id`, `added_at`, `added_by_user_id null`, `source`
- composite primary key

#### `tags` and `contact_tags`

- Tag: `id`, `organization_id`, `name`, timestamps
- Join: `tag_id`, `contact_id`, `added_at`
- unique lowercased tag name per organization

#### `segments` and `segment_versions`

- Segment: `id`, `organization_id`, `name`, `status enum(active, archived)`, `current_version_id`, timestamps
- Version: `id`, `segment_id`, `version_number`, `definition_json`, `created_by_user_id`, `created_at`
- definitions use a versioned allowlisted expression tree over contact status, list/tag membership, locale, created date, and declared custom fields
- no raw SQL, regular-expression execution, or arbitrary JavaScript
- preview returns count and sample under `contacts.read`; campaign snapshot stores the exact segment version used

Segment definition version 1 is an allowlisted AST:

```ts
type SegmentNodeV1 =
  | { type: "group"; operator: "and" | "or"; children: SegmentNodeV1[] }
  | {
      type: "condition";
      field: "status" | "locale" | "createdAt" | `custom.${string}`;
      operator: "eq" | "neq" | "exists" | "not_exists" | "before" | "after";
      value?: string | number | boolean;
    }
  | {
      type: "membership";
      target: "list" | "tag";
      operator: "in" | "not_in";
      ids: string[];
    };
```

Maximum depth is 3, maximum 20 conditions, and maximum 50 list/tag IDs per membership node. Compile only to parameterized query-builder expressions. Reject unknown custom fields and type/operator mismatches.

#### `consent_events`

- `id`, `organization_id`, `contact_id`
- `event_type enum(granted, imported_attestation, withdrawn, preference_changed, corrected)`
- `purpose_key`, `lawful_basis_claim`, `source`, `source_reference null`
- `policy_version null`, `evidence_json`, `occurred_at`, `recorded_at`
- `recorded_by_user_id null`
- append-only

#### `subscription_topics` and `contact_preferences`

- Topic: `id`, `organization_id`, stable `key`, name, description, status, timestamps
- Preference: `organization_id`, `contact_id`, `topic_id`, `status enum(subscribed, unsubscribed)`, `derived_from_consent_event_id`, `updated_at`
- unique `(contact_id, topic_id)`; preferences are a current projection rebuilt from consent events
- global marketing suppression always overrides a subscribed topic

#### `suppression_entries`

- `id`, `organization_id`, `email_hash`, encrypted `email_normalized` where operationally required
- `scope enum(global, marketing, topic)`, `topic_key null`
- `reason enum(unsubscribe, complaint, hard_bounce, manual, legal_request, invalid)`
- `source_resource_type`, `source_resource_id`, `created_at`
- `revoked_at null`, `revoked_by_user_id null`, `revocation_reason null`
- active unique constraint by organization/email hash/scope/topic
- complaint, hard-bounce, and legal-request suppressions cannot be casually removed

`email_hash` is a versioned keyed HMAC, not a plain SHA hash, because email addresses are guessable. Key version is stored so rotation and lookup across active versions are possible. Plain normalized email, when operationally retained, is encrypted through `EncryptionProvider`.

#### `imports`

- `id`, `organization_id`, `created_by_user_id`
- `status enum(uploaded, mapping_required, validating, ready, importing, completed, failed, canceled)`
- storage key, original filename, byte size, detected columns
- counts: total, valid, invalid, duplicate, imported, suppressed
- `mapping_json`, `consent_attestation_json`, error summary
- timestamps

#### `import_rows`

- `id`, `import_id`, `row_number`, `normalized_json`
- `status enum(valid, invalid, duplicate_file, duplicate_workspace, suppressed, imported)`
- `errors_json`, `contact_id null`
- unique `(import_id, row_number)`

Raw import files expire after a configurable short retention. Import-row error data expires after the support window.

### 7.4 Brands, senders, templates, and assets

#### `brands`

- `id`, `organization_id`, `name`, `is_default`
- colors, logo asset ID, email-safe font stack, social links JSON
- physical address JSON, company legal name, default footer text
- timestamps
- exactly one default brand when any brand exists

#### `sender_domains`

- `id`, `organization_id`, `domain_ascii`, `status enum(pending, simulated, verified, failed, revoked)`
- `verification_method`, `required_records_json`, `last_check_json`
- `verified_at`, `last_checked_at`, timestamps
- free-first verification can be simulated only in development and must be visibly labelled

#### `sender_identities`

- `id`, `organization_id`, `sender_domain_id`
- `local_part`, `from_name`, `reply_to_email`
- `status enum(pending, simulated, verified, disabled)`
- timestamps
- address domain must match the parent verified domain

#### `assets`

- `id`, `organization_id`, storage key, filename, MIME type, byte size
- image width/height where applicable, SHA-256 hash
- `status enum(uploading, ready, rejected, deleted)`
- timestamps

#### `templates`

- `id`, `organization_id`, `brand_id null`, `name`
- `status enum(draft, active, archived)`
- `current_version_id null`, timestamps

#### `template_versions`

- `id`, `template_id`, `version_number`
- `document_schema_version`, `document_json`
- rendered `html`, rendered `plain_text`
- `created_by_user_id`, `created_at`
- immutable

### 7.5 Campaigns, approvals, delivery, and events

#### `campaigns`

- `id`, `organization_id`, `brand_id`, `sender_identity_id`
- `name`, `type enum(marketing, operational)`
- `status enum(draft, in_review, changes_requested, approved, scheduled, snapshotting, queued, sending, paused, completed, canceled, failed)`
- subject, preheader, reply-to, template/version references
- `audience_definition_json`, `audience_snapshot_id null`
- schedule instant/timezone, tracking settings
- current content version, optimistic `version`
- creator, updater, timestamps

#### `campaign_versions`

- immutable snapshot of content, subject, sender, brand, audience definition, settings
- `id`, `campaign_id`, `version_number`, `payload_json`, rendered sample hashes
- creator and timestamp

#### `campaign_approvals`

- `id`, `campaign_id`, `campaign_version_id`
- `decision enum(approved, changes_requested, revoked)`
- `comment`, `decided_by_user_id`, `created_at`
- approval applies only to the exact campaign version

#### `audience_snapshots`

- `id`, `organization_id`, `campaign_id`, `campaign_version_id`
- eligible/excluded counts and reason counts JSON
- `status enum(building, ready, invalidated, failed)`
- `frozen_at`, `created_at`

#### `audience_snapshot_members`

- `snapshot_id`, `contact_id`
- `email_normalized`, personalization JSON
- `eligibility enum(eligible, excluded)` and reason
- composite primary key
- snapshot stores necessary send-time values so later contact edits do not silently change approved content/audience

#### `deliveries`

- `id`, `organization_id`, `campaign_id`, `audience_snapshot_id`, `contact_id`
- `status enum(queued, rendering, captured, submitted, delivered, deferred, bounced, complained, unsubscribed, failed, canceled)`
- `provider`, `provider_message_id null`, `idempotency_key`
- timestamps and final error code
- unique `(campaign_id, contact_id)` and unique idempotency key

#### `delivery_attempts`

- `id`, `delivery_id`, `attempt_number`, provider
- status, safe error code, response metadata, start/end timestamps
- no secrets or full message bodies

#### `provider_events`

- `id`, organization/delivery references when resolved
- provider, unique external event ID, event type
- occurred/received timestamps, payload JSON with retention/redaction policy
- processing status and error; append-only

#### `unsubscribe_tokens`

- store token digest, delivery/contact/campaign/topic references, expiry/key version
- plaintext token never stored
- one-click operation remains valid long enough to satisfy policy and does not require login

### 7.6 Jobs, audit, feature flags, and operations

#### `jobs`

- `id`, `organization_id null`
- `type`, `payload_json`, `status enum(pending, running, retryable, succeeded, failed, canceled)`
- `priority`, `available_at`, `attempts`, `max_attempts`
- `locked_by`, `locked_at`, `heartbeat_at`
- `idempotency_key`, `last_error_code`, timestamps
- unique `(type, idempotency_key)` where key is not null
- indexes on `(status, available_at, priority)` and stale locks

#### `outbox_events`

- `id`, `organization_id null`, aggregate type/ID, event type
- `payload_json`, `status enum(pending, published, failed)`
- `available_at`, `attempts`, `published_at`, timestamps
- `idempotency_key unique`
- written in the same transaction as the business state change; dispatcher creates/delivers the corresponding job/event idempotently

#### `audit_events`

- `id`, `organization_id null`, actor user/platform role
- action, target type/ID, outcome
- request ID, safe IP hash/prefix per policy, user-agent summary
- before/after JSON with secret/PII redaction
- reason/reference, occurred_at
- append-only, access-controlled, retained per policy

#### `feature_flags`

- `id`, stable key, description, status
- default value, targeting rules JSON, version, timestamps
- rules can target environment, plan, organization, or percentage using deterministic hashing
- safety-critical behavior is not a feature flag

#### `system_controls`

- `id`, `scope_type enum(global, environment, organization, sender_domain, campaign)`
- `scope_id null`, `control enum(delivery_paused, imports_paused, signups_paused, captures_paused)`
- `active boolean`, reason/reference, activated/cleared operator IDs and timestamps
- active control changes require platform permission, recent authentication, confirmation, and audit/outbox events
- controls are evaluated fail-closed before job fanout/claim and before each delivery; they are not percentage feature flags

#### `admin_actions`

- `id`, requested action and typed payload
- requester, approver null, status enum(pending_approval, approved, executed, rejected, expired, failed)
- reason, reference, risk level, expires_at, executed_at, result JSON
- high-risk actions cannot be approved by requester

During local free-first development, a single platform owner may exercise a clearly labelled `development_self_approval` only when `NODE_ENV !== 'production'`, billing provider is `local`, and email delivery is `disabled` or `capture`. The action records that exception. Production configuration must reject self-approval for high-risk actions and requires two distinct operator identities.

## 8. Tenant isolation and database roles

Use three database roles:

- `app_migration`: owns schema/migrations; never used by web requests.
- `app_runtime`: web/API role; cannot bypass RLS.
- `app_worker`: worker role; tenant context required for tenant jobs; narrowly scoped cross-tenant job claiming through reviewed functions/queries.

For tenant-scoped transactions:

1. Authenticate the principal.
2. Resolve membership and permission.
3. Begin a database transaction.
4. Set transaction-local `app.current_organization_id` and `app.current_user_id` from trusted server context.
5. Execute queries.
6. Commit/rollback; context disappears with transaction.

RLS policies compare `organization_id` to `current_setting('app.current_organization_id', true)::uuid`. Never use a session-scoped setting on pooled connections. Global auth, plan catalog, and public legal data require separate policies/query paths.

Required automated tenant tests for every tenant-owned table:

- Organization A can access its row.
- Organization B cannot read, update, or delete A's row by guessed ID.
- Missing tenant context denies access.
- Platform support route without explicit elevation cannot read the row.
- Worker with a job for A cannot act on B.

Application authorization remains required even with RLS.

## 9. Effective configuration engine

### 9.1 Inputs and precedence

Calculate configuration in this order, later layers overriding earlier values only when allowed:

1. Code-defined platform hard safety rules.
2. Entitlement-definition default.
3. Versioned plan entitlement.
4. Purchased add-on (schema reserved; implementation later).
5. Active contract entitlement.
6. Active approved organization override.
7. Active incident/risk restriction.

Restrictions may lower capabilities regardless of commercial grants. No layer can override a hard safety rule.

### 9.2 Calculation contract

`resolveEffectiveConfig(organizationId, atInstant)` returns:

```ts
type EffectiveValue = {
  key: string;
  value: boolean | number | string | string[];
  source:
    | "platform"
    | "default"
    | "plan"
    | "addon"
    | "contract"
    | "override"
    | "restriction";
  sourceId: string | null;
  effectiveFrom: string | null;
  effectiveUntil: string | null;
};

type EffectiveConfig = {
  organizationId: string;
  subscriptionId: string | null;
  calculatedAt: string;
  values: Record<string, EffectiveValue>;
  hash: string;
};
```

- Same inputs at the same instant produce the same canonical JSON and SHA-256 hash.
- Persist a new `organization_config_versions` row only when the hash changes.
- Cache only by organization plus config hash; invalidation happens in the same transaction/outbox as source changes.
- Every enforcement error includes the entitlement key, current value, measured usage, and a safe resolution action.

### 9.3 Manual change workflow

1. Operator chooses a typed action; UI loads current effective config.
2. Server validates platform permission and value range.
3. Server calculates before/after preview including billing effect.
4. Operator supplies reason and reference.
5. Low-risk nonfinancial action executes; high-risk action creates pending approval.
6. A different authorized operator approves or rejects.
7. Execution writes immutable source row, config version, admin action, and audit event atomically.
8. Expiry job warns before expiry and recalculates on expiry.
9. Reconciliation detects configuration with missing/invalid subscription or contract source.

### 9.4 Local subscription lifecycle

Allowed transitions:

```text
incomplete -> trialing | active | expired
trialing   -> active | paused | canceled | expired
active     -> past_due | restricted | paused | canceled
past_due   -> active | restricted | unpaid | canceled
paused     -> active | canceled
restricted -> active | canceled
unpaid     -> active | canceled
```

`canceled` and `expired` are terminal for that subscription row. Reactivation creates a new subscription linked through its events; it does not rewrite terminal history.

Local-billing commands:

- `startTrial(organizationId, planVersionId, endsAt)`
- `activateSubscription(organizationId, planVersionId, priceId, period)`
- `schedulePlanChange(subscriptionId, targetPlanVersionId, effectiveAt)`
- `restrictSubscription(subscriptionId, reason)`
- `restoreSubscription(subscriptionId, reason)`
- `scheduleCancellation(subscriptionId, periodEnd)`
- `cancelImmediately(subscriptionId, reason)`
- `expireTrial(subscriptionId)`

Every command validates current state, requires an idempotency key, writes `subscription_events`, recalculates effective configuration, writes audit/outbox events, and returns the resulting state in one transaction. Local commands require platform subscription permission; customer plan-change UI creates a nonbinding request only.

Access policy:

- No subscription: sandbox entitlements only.
- Trialing/active: plan entitlements, still subject to organization/risk restrictions.
- Past due: configurable grace period; warn immediately, block new scheduling after grace.
- Restricted/unpaid/paused: allow read and permitted export; block imports that increase billable usage and all new scheduling.
- Canceled/expired: read/export during retention window; no new usage; owner may request a new subscription.
- Payment state never overrides abuse suspension, sender verification, suppression, consent, or platform kill switches.

Direct SQL changes are not a supported workflow.

## 10. HTTP and service contracts

### 10.1 API conventions

- Base path: `/api/v1`.
- JSON request/response except uploads and public unsubscribe.
- All request bodies, params, and query strings validated with Zod.
- Default maximum JSON body: 1 MiB; endpoint-specific lower limits preferred.
- Request ID returned in `X-Request-Id` and error body.
- Mutating routes require same-origin/CSRF controls appropriate to auth method.
- No wildcard CORS. Browser API is same-origin. Future API CORS requires explicit origins.
- Cursor pagination only for mutable large lists; default 25, maximum 100.
- Dates are ISO 8601 UTC strings; money uses minor units.
- `Idempotency-Key` required for campaign schedule/send, imports, subscription changes, credits, and other retry-sensitive commands.
- Rate limits apply by IP before authentication and by user/organization after authentication.

Success:

```json
{ "data": {}, "meta": { "requestId": "uuid" } }
```

Failure:

```json
{
  "error": {
    "code": "STABLE_MACHINE_CODE",
    "message": "Safe human-readable message",
    "fieldErrors": { "field": ["Reason"] },
    "requestId": "uuid"
  }
}
```

Never return stack traces, SQL, provider secrets, or raw internal errors.

Stable initial error catalog:

| HTTP | Code                          | Meaning                                                 |
| ---: | ----------------------------- | ------------------------------------------------------- |
|  400 | `VALIDATION_FAILED`           | Parsed input violates the request schema                |
|  400 | `PREFLIGHT_FAILED`            | Campaign has one or more blocking preflight findings    |
|  401 | `AUTH_REQUIRED`               | No valid session/API identity                           |
|  401 | `RECENT_AUTH_REQUIRED`        | Sensitive action requires reauthentication              |
|  403 | `EMAIL_VERIFICATION_REQUIRED` | Account email is not verified                           |
|  403 | `FORBIDDEN`                   | Authenticated principal lacks permission                |
|  403 | `ORGANIZATION_RESTRICTED`     | Workspace status/risk policy blocks the action          |
|  403 | `SUBSCRIPTION_RESTRICTED`     | Subscription lifecycle blocks the action                |
|  403 | `ENTITLEMENT_REQUIRED`        | Feature is not in effective configuration               |
|  404 | `RESOURCE_NOT_FOUND`          | Resource absent or hidden to prevent tenant enumeration |
|  409 | `CONFLICT`                    | Unique/current-state conflict                           |
|  409 | `IDEMPOTENCY_CONFLICT`        | Key was reused with a different command payload         |
|  409 | `CAMPAIGN_STATE_INVALID`      | Requested transition is not allowed                     |
|  409 | `APPROVAL_STALE`              | Approval references an older campaign version           |
|  409 | `SUPPRESSION_CONFLICT`        | Action conflicts with active suppression                |
|  412 | `VERSION_CONFLICT`            | Optimistic version/updated-at precondition failed       |
|  413 | `PAYLOAD_TOO_LARGE`           | Body/file/row count exceeds endpoint maximum            |
|  422 | `QUOTA_EXCEEDED`              | Requested usage exceeds effective quota/reservation     |
|  429 | `RATE_LIMITED`                | Rate limit exceeded; include safe retry information     |
|  503 | `EMAIL_DELIVERY_DISABLED`     | Current delivery mode cannot perform the command        |
|  503 | `DEPENDENCY_UNAVAILABLE`      | Required local dependency is temporarily unavailable    |

Unexpected errors map to `INTERNAL_ERROR` with HTTP 500 and request ID only. Domain/service errors must be explicit discriminated unions; route handlers own HTTP mapping.

### 10.2 Required API surface

Auth is provided through Better Auth. Product routes:

#### Organizations and membership

- `GET /organizations`
- `POST /organizations`
- `GET/PATCH /organizations/:orgId`
- `GET/POST /organizations/:orgId/invitations`
- `DELETE /organizations/:orgId/invitations/:invitationId`
- `GET /organizations/:orgId/members`
- `PATCH/DELETE /organizations/:orgId/members/:membershipId`
- `GET /organizations/:orgId/effective-config`

#### Contacts and consent

- `GET/POST /organizations/:orgId/contacts`
- `GET/PATCH/DELETE /organizations/:orgId/contacts/:contactId`
- `POST /organizations/:orgId/imports` (multipart metadata/upload initiation)
- `GET /organizations/:orgId/imports/:importId`
- `POST /organizations/:orgId/imports/:importId/map`
- `POST /organizations/:orgId/imports/:importId/commit`
- `POST /organizations/:orgId/imports/:importId/cancel`
- `GET/POST /organizations/:orgId/lists`
- `PATCH/DELETE /organizations/:orgId/lists/:listId`
- `GET /organizations/:orgId/suppressions`
- `POST /organizations/:orgId/suppressions` for manual suppression
- No general unsuppress endpoint; use reason-specific reviewed commands.

#### Brands, senders, and templates

- CRUD `/organizations/:orgId/brands`
- CRUD `/organizations/:orgId/sender-domains`
- `POST /sender-domains/:id/check`
- CRUD `/organizations/:orgId/sender-identities`
- CRUD `/organizations/:orgId/templates`
- `POST /templates/:id/versions`
- `POST /templates/:id/preview`

#### Campaigns

- `GET/POST /organizations/:orgId/campaigns`
- `GET/PATCH /organizations/:orgId/campaigns/:campaignId`
- `POST /campaigns/:id/preflight`
- `POST /campaigns/:id/test-capture`
- `POST /campaigns/:id/submit-review`
- `POST /campaigns/:id/approve`
- `POST /campaigns/:id/request-changes`
- `POST /campaigns/:id/schedule`
- `POST /campaigns/:id/cancel`
- `POST /campaigns/:id/pause`
- `POST /campaigns/:id/resume`
- `GET /campaigns/:id/report`
- `GET /campaigns/:id/deliveries`

#### Billing and usage

- `GET /organizations/:orgId/plans`
- `GET /organizations/:orgId/subscription`
- `GET /organizations/:orgId/usage`
- `POST /organizations/:orgId/subscription/change-preview`
- In local mode, customer plan changes are requests requiring platform owner action; no fake checkout.

#### Public endpoints

- `POST /unsubscribe/:token` for one-click POST body
- `GET /unsubscribe/:token` renders confirmation/preferences without requiring login
- `GET /health/live`
- `GET /health/ready`

#### Platform control plane

- CRUD/version `/platform/plans` and `/platform/entitlement-definitions`
- `GET /platform/organizations` with safe search/filter
- `GET /platform/organizations/:id/overview`
- `POST /platform/organizations/:id/config-preview`
- `POST /platform/organizations/:id/overrides`
- `POST /platform/organizations/:id/contracts`
- `POST /platform/organizations/:id/subscriptions`
- `POST /platform/organizations/:id/restrict`
- `POST /platform/organizations/:id/reactivate`
- `POST /platform/admin-actions/:id/approve|reject`
- `GET /platform/reconciliation`
- `GET /platform/jobs`, `POST /platform/jobs/:id/retry|cancel`
- `GET /platform/audit`
- `GET/PATCH /platform/feature-flags/:key`
- `POST /platform/kill-switches/:scope`

Route ownership must be documented in `docs/api/` as endpoints are implemented.

## 11. Contact import algorithm

1. Validate permission and `imports.max_rows` before accepting a file.
2. Allow CSV UTF-8 first. XLSX is deferred until CSV is reliable.
3. Cap compressed/uncompressed byte size; reject binary/polyglot content.
4. Save through `StorageAdapter` using a generated key; never trust filename as a path.
5. Parse as a background job with fixed memory bounds and row limit.
6. Detect headers and propose mapping; user must confirm the email column.
7. Normalize each address; validate length/syntax conservatively.
8. Identify duplicates inside file and against workspace contacts.
9. Check active suppression before preview.
10. Require consent-source selection and attestation before commit.
11. Preview exact valid/invalid/duplicate/suppressed counts and downloadable error CSV.
12. Commit idempotently in chunks. Existing contacts are updated only for explicitly mapped non-empty fields under a declared merge policy.
13. Write consent event and list membership for each imported/updated contact.
14. Update usage ledger after transaction success.
15. Delete raw upload on retention schedule.

Prevent CSV formula injection in exported error files by prefixing cells beginning with `=`, `+`, `-`, or `@` according to export policy.

## 12. Template document and rendering contract

### 12.1 Versioned document

Initial schema version `1`:

```ts
type EmailDocumentV1 = {
  schemaVersion: 1;
  settings: {
    backgroundColor: string;
    contentWidth: number; // constrained 480..680
    fontFamily: "sans" | "serif" | "mono";
  };
  blocks: EmailBlockV1[];
};

type RichTextRunV1 = {
  text: string;
  marks?: {
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    link?: { href: string; label?: string };
  };
};
```

Supported blocks only:

- `heading`: level 1–3, text, alignment.
- `paragraph`: sanitized rich-text subset, alignment.
- `image`: asset ID, alt text, optional safe link, width/alignment.
- `button`: label, HTTPS/mailto URL, alignment, colors.
- `divider`: color and thickness within bounds.
- `spacer`: height within bounds.
- `columns`: maximum two columns, each containing supported non-column blocks; no recursive columns.
- `socialLinks`: approved platforms and HTTPS URLs.
- `legalFooter`: organization identity, address, unsubscribe placeholder; protected for marketing campaigns.

Paragraphs contain arrays of `RichTextRunV1`; they do not contain stored HTML. Headings/buttons use plain text. Links allow only `https:` and carefully validated `mailto:`. Maximum 100 runs per paragraph, 10,000 characters per text block, 2,000 characters per URL, 200 blocks total, and 200 KiB document JSON. Reject unknown block types, marks, keys, invalid colors, and values outside documented bounds.

The `features.custom_html` entitlement is reserved but remains false and unimplemented during free-first work. Do not expose a raw HTML editor merely because the old prototype had one.

### 12.2 Rendering

- Rendering is deterministic and server-side.
- Produce table-based responsive HTML and a meaningful plain-text alternative.
- Inline allowed CSS. Strip scripts, forms, event attributes, embedded objects, iframes, remote CSS imports, and unsafe URL schemes.
- All images reference platform-managed asset URLs or explicitly allowed HTTPS sources under policy.
- Escape personalization values by output context.
- Supported merge tags initially: `contact.first_name`, `contact.last_name`, `contact.email`, `organization.name`.
- Every optional contact merge tag requires a fallback at campaign configuration.
- Render preview inside a sandboxed iframe on a distinct opaque origin where possible; never inject untrusted HTML directly into the app DOM.
- Store renderer version and content hash with campaign version.

### 12.3 Preflight checks

Blocking:

- No verified sender identity (simulated verification allowed only in visibly marked development mode).
- Missing subject, content, eligible audience, organization legal name/address, or unsubscribe block for marketing.
- Campaign version differs from approved version.
- Delivery mode disabled when attempting schedule/send.
- Subscription/entitlement/risk restriction disallows sending.
- Broken template schema, missing required variable fallback, unsafe URL, or missing asset.
- Eligible count exceeds campaign/daily/monthly quota.

Warnings:

- Subject/preheader length, missing image alt text, low contrast, oversized message/image, too many links, link-domain mismatch, likely broken URL, audience bounce risk, no plain-text quality, schedule timezone ambiguity.

Each result has stable code, severity, human message, affected field/block, and resolution action.

## 13. Campaign workflow and invariants

Allowed transitions:

```text
draft -> in_review -> changes_requested -> draft
draft -> in_review -> approved
approved -> scheduled -> snapshotting -> queued -> sending -> completed
scheduled/queued/sending -> paused
paused -> queued
draft/in_review/approved/scheduled/paused -> canceled
snapshotting/queued/sending -> failed (system only)
```

Rules:

- Edit content/audience/sender after approval creates a new campaign version and returns status to `draft`.
- Approval references exactly one immutable version.
- Scheduling requires fresh preflight and idempotency key.
- Audience snapshot is built after approval and before delivery creation.
- Snapshot excludes suppressed, unsubscribed, deleted, invalid, duplicate, and quota-excess contacts with explicit counts.
- One delivery row per campaign/contact; database uniqueness prevents duplication.
- Cancel stops work not yet captured/submitted. UI never promises recall.
- Pause stops new claims after in-flight jobs finish.
- Capture mode generates exactly what would be sent, stores no secret, and can simulate success/failure using test fixtures.
- Completion occurs only when every delivery reaches a terminal state.

## 14. PostgreSQL job queue

Required job types initially:

```text
contact_import_parse
contact_import_commit
effective_config_recalculate
audience_snapshot_build
campaign_fanout
delivery_render_and_capture
campaign_finalize
usage_rollup
temporary_override_expire
retention_cleanup
provider_event_process
reconciliation_run
```

Claim algorithm:

1. Begin transaction.
2. Select available `pending` or due `retryable` rows ordered by priority descending, available time ascending, using `FOR UPDATE SKIP LOCKED`, limited to batch size.
3. Mark claimed rows `running`, set worker/lock/heartbeat, increment attempt.
4. Commit quickly.
5. Process outside claim transaction.
6. Record success or classified retry/failure in a new transaction.

Worker behavior:

- Graceful shutdown stops claiming and finishes/returns current jobs.
- Heartbeat long jobs; a sweeper reclaims stale jobs after type-specific timeout.
- Retry only transient errors with bounded exponential backoff plus jitter.
- Permanent validation/authorization errors fail immediately.
- Max attempts defined per job type.
- Payload contains IDs, not full contact lists or message bodies.
- Every handler is idempotent and checks current resource state.
- Per-organization concurrency and quota apply before fanout/delivery.
- Worker logs include job ID, type, organization ID, attempt, duration, and safe outcome.

## 15. Local capture delivery

`EmailProvider` contract:

```ts
interface EmailProvider {
  readonly name: "capture" | "mailpit";
  send(
    message: RenderedMessage,
    context: DeliveryContext,
  ): Promise<ProviderSendResult>;
}
```

`RenderedMessage` includes one recipient, verified sender identity, reply-to, subject, HTML, plain text, headers, and metadata IDs. It never accepts arbitrary SMTP credentials or file paths.

Capture artifact layout:

```text
.local/email-captures/{organizationId}/{campaignId}/{deliveryId}/
  message.eml
  metadata.json
```

Atomic write: temporary file then rename. Path segments are server UUIDs only. Metadata excludes consent evidence and secrets. Retention cleanup deletes captures after the configured development retention.

Capture simulation fixtures can produce delivered, deferred-then-delivered, hard-bounce, complaint, and permanent-failure events. Simulation is available only in development/test and is written to audit logs.

## 16. Unsubscribe and suppression

- Marketing capture output includes `List-Unsubscribe` and `List-Unsubscribe-Post` headers plus a visible footer URL.
- Token is opaque, signed, scoped, versioned, and resistant to guessing; store only digest.
- GET shows organization identity and the exact subscription/topic being changed.
- POST one-click requires no login, no cookies, no redirect, and succeeds idempotently.
- The endpoint returns a generic success for already-unsubscribed tokens to avoid data disclosure.
- Record consent withdrawal, suppression entry, delivery event, and audit/system event atomically.
- Suppression is checked during snapshot and immediately before delivery to close race windows.
- A global unsubscribe overrides topic consent.
- Complaint and hard-bounce events suppress automatically.
- Re-subscription requires a new affirmative consent event through a defined flow; an operator cannot merely delete suppression history.

## 17. Usage and quota enforcement

Definitions:

- Active contacts: distinct non-deleted, non-archived, non-suppressed contacts eligible for at least one marketing purpose at measurement time.
- Monthly sends: delivery rows entering `captured` or future `submitted`, counted once via usage idempotency key.
- Daily sends: same metric in organization timezone for UX, with UTC authoritative boundaries recorded to avoid ambiguity.
- Seats: active memberships excluding pending/removed.
- Storage: bytes of ready non-deleted assets and retained imports/captures according to policy.

Enforce limits:

- Before mutation for seats/domains/brands/templates.
- Before import acceptance and again before commit for contacts.
- During preflight and immediately before fanout for sends.
- Atomically reserve quota for a scheduled campaign to prevent concurrent oversubscription.
- Release unused reservations on cancel/failure through reversal ledger entries.
- Never silently exceed limits. Return current, requested, allowed, and resolution.
- A platform risk restriction can reduce sending below commercial quota.

## 18. Founder control plane UI

Routes:

```text
/platform
/platform/organizations
/platform/organizations/[id]
/platform/organizations/[id]/configuration
/platform/organizations/[id]/subscription
/platform/organizations/[id]/usage
/platform/organizations/[id]/risk
/platform/plans
/platform/plans/[id]/versions/[version]
/platform/entitlements
/platform/actions
/platform/jobs
/platform/reconciliation
/platform/feature-flags
/platform/audit
```

Organization overview panels:

- Identity/status: legal/display name, age, owner, region/locale, current restriction.
- Subscription: lifecycle state, plan/version, period, trial, cancellation.
- Effective configuration: every key/value/source/expiry with diff history.
- Usage: current/reserved/limit/projected for contacts, sends, seats, storage.
- Delivery health: captures now; real provider metrics later.
- Risk/support: restrictions, cases, recent operator actions.
- Audit timeline with redacted metadata.

Manual change experience:

1. Select action, never a raw JSON editor.
2. Choose controlled key/value and effective window.
3. Select billing effect.
4. Provide reason and reference.
5. Review before/after entitlement and invoice preview.
6. Confirm; require second approval if policy says high risk.
7. Show immutable result and rollback/supersede action.

The platform owner may not directly view plaintext passwords, auth tokens, encryption keys, or full customer contact exports. Support elevation must be time-bound and audited.

## 19. Customer product screens

Every screen needs loading, empty, error, forbidden, restricted, and success states.

| Route           | Purpose                  | Primary actions                                                           |
| --------------- | ------------------------ | ------------------------------------------------------------------------- |
| Dashboard       | Current tasks and health | Continue onboarding, finish draft, resolve warnings                       |
| Onboarding      | Guided setup             | Business profile, brand, sender simulation/domain, contacts, test capture |
| Campaigns       | Campaign list            | Create, filter, duplicate, open report                                    |
| Campaign editor | Compose                  | Edit blocks, subject, sender, audience, autosave, preview                 |
| Campaign review | Safe confirmation        | Preflight, exclusions, approval, schedule/capture                         |
| Contacts        | Searchable contacts      | Add, edit, tag, list, suppress                                            |
| Imports         | Import history/workflow  | Upload CSV, map, attest, preview, commit                                  |
| Templates       | Reusable content         | Create, version, archive                                                  |
| Brands          | Brand defaults           | Logo/colors/address/footer                                                |
| Senders         | Sender readiness         | Add domain/identity, view required checks                                 |
| Reports         | Campaign results         | Metrics, exclusions, recipient status by permission                       |
| Members         | Team access              | Invite, roles, suspend/remove                                             |
| Policies        | Workspace governance     | Approvals, spend cap, From-domain rules                                   |
| Billing         | Subscription/usage       | View plan, limits, local beta status, request change                      |
| Audit           | Organization history     | Filter/export within permission                                           |

Do not expose controls that cannot work in the current mode. For example, local billing shows “Managed beta access,” not a fake Pay button; disabled delivery shows configuration guidance and permits only test rendering.

## 20. Accessibility, localization, and UX acceptance

- WCAG 2.2 AA target for all core workflows.
- Full keyboard operation, logical focus order, visible focus, skip navigation, semantic landmarks.
- Form labels and programmatic descriptions; field errors linked with `aria-describedby` and summarized on submit.
- Status must not rely on color. Live job progress uses polite live regions without noisy updates.
- Dialog focus trap/restore, escape handling, and destructive confirmations.
- Minimum practical 44px pointer targets; responsive at 320 CSS pixels without horizontal page scroll.
- Respect reduced motion; animation never blocks work.
- Contrast tested for normal, hover, focus, disabled, warning, and error states.
- Drafts autosave after debounced valid changes, show saving/saved/failure, and recover unsaved local changes after network failure.
- All user strings live in locale files. IDs/codes remain untranslated.
- Dates show timezone; scheduled instants display organization zone and UTC detail.
- Use locale-aware formatting and allow long translated strings. Test an RTL pseudo-locale before real translation.
- Tables provide mobile alternatives and accessible captions/headers.

## 21. Security requirements

- Same-origin product API; no wildcard CORS.
- Secure, HTTP-only, SameSite cookies per auth library guidance; production HTTPS/HSTS.
- Content Security Policy designed before enabling user images/preview.
- Zod validation and database constraints for all untrusted data.
- Server authorization in route and service; RLS as defense in depth.
- Output encoding by context and sanitized HTML.
- Upload path isolation, type/size checks, malware-scanning interface (local no-op visibly documented; production provider required before public uploads).
- Per-IP/user/organization rate limiting; local in-memory IP limiter is development-only, PostgreSQL-based counters may be used before distributed infrastructure.
- Sensitive actions require recent authentication once supported.
- Secrets encrypted with versioned envelope interface; local key only for development. Production KMS/secret manager decision deferred.
- Audit security-sensitive success and denial without storing secrets.
- Generic account recovery and unsubscribe responses to avoid enumeration.
- Dependency, secret, and static checks in CI using free tooling.
- Security headers: CSP, HSTS in production, frame restrictions, MIME sniffing protection, referrer policy, and permissions policy.
- No `any` in new production TypeScript without a documented boundary and immediate parsing.
- No raw HTML from users reaches email renderer or preview without allowlist sanitation.

## 22. Observability and operations

Structured log fields:

```text
timestamp level service environment requestId userId organizationId
route method status durationMs jobId campaignId deliveryId errorCode
```

Never log email content, full contact lists, passwords, tokens, cookies, provider payload secrets, or raw payment data.

Health:

- `/health/live`: process can answer; no dependency calls.
- `/health/ready`: database reachable, migrations current, critical config valid; does not expose details publicly.
- Worker heartbeat stored/observed separately.

Required operational dashboards can initially be database/admin pages:

- Queue depth/age/failures by job type.
- Imports stuck or failed.
- Campaigns stuck per state.
- Capture successes/failures.
- Usage ledger versus rollups.
- Expiring overrides/trials.
- Reconciliation exceptions.
- Audit denial spikes.

Runbooks in `docs/runbooks/`:

- delivery kill switch
- stuck queue and safe replay
- compromised platform account
- suspected tenant data exposure
- accidental campaign schedule/capture
- database restore
- lost encryption key (prevention and consequences)
- subscription/config reconciliation failure
- suppression/unsubscribe incident

### 22.1 Default development retention and deletion

These defaults make behavior testable; review with counsel before production:

| Data                                 |                            Free-first default | Deletion behavior                                              |
| ------------------------------------ | --------------------------------------------: | -------------------------------------------------------------- |
| Raw contact import file              |               7 days after completion/failure | Storage object deleted; import summary remains                 |
| Import row errors                    |                                       30 days | Row details deleted; aggregate counts remain                   |
| Captured email artifacts             |                                       14 days | Files deleted; delivery metadata remains                       |
| Successful jobs                      |                                       30 days | Delete payload/row after audit/metric references are safe      |
| Failed jobs                          |                                       90 days | Redact sensitive payload fields, then delete on expiry         |
| Raw simulated provider event payload |                                       90 days | Retain normalized event fields only                            |
| Application logs                     |                               30 days locally | Rotate/delete; never treated as audit source of truth          |
| Audit events                         |        365 days minimum in development policy | Append-only until organization deletion policy executes        |
| Campaign/template versions           | Life of workspace plus cancellation retention | Export then delete/anonymize per organization request/policy   |
| Suppression proof                    | While needed to prevent prohibited re-mailing | Retain minimum keyed/hash proof; remove unrelated profile data |

Organization deletion workflow:

1. Owner requests deletion and completes recent-auth confirmation.
2. Organization enters `closing`; new sends/imports/invites stop immediately.
3. UI offers export and displays scheduled deletion instant.
4. Revoke sessions scoped only to that organization, API keys, invitations, queued jobs, and captures.
5. After cooling-off period, delete/anonymize tenant data in dependency order and record a non-PII deletion certificate/audit event.
6. Backups expire naturally under the backup-retention schedule; deleted data is not restored into active service during recovery.
7. Suppression proof retained for legal/anti-spam need must be isolated, minimized, and inaccessible for marketing/profile use.

Local backups use scripted `pg_dump` to a `.local/backups` path excluded from Git. A restore test must create a separate database; never overwrite the working database during a drill.

## 23. Testing matrix

### 23.1 Unit tests

- Email normalization and validation boundaries.
- Permission resolution for every role/permission.
- Entitlement precedence, type/range validation, expiry, and restrictions.
- Subscription state transitions.
- Money/proration preview using integer arithmetic.
- Usage idempotency, reservation, reversal, and period boundaries.
- Template schema, sanitizer, renderer, merge escaping, and plain-text output.
- Preflight rules and stable codes.
- Campaign state transitions.
- Retry classification/backoff.
- Unsubscribe token signing/verification and suppression precedence.
- Pagination cursors and error mapping.

### 23.2 Integration tests with PostgreSQL

- Every migration applies to empty DB and from prior schema.
- Auth adapter and session retrieval.
- Organization creation/ownership invariant.
- Cross-tenant denial for every tenant table.
- Invitation expiration/reuse/revocation.
- Effective config atomically updates with source/audit.
- High-risk override cannot self-approve.
- Concurrent quota reservation cannot exceed allowance.
- Duplicate import commit is idempotent.
- Suppressed contact never enters eligible snapshot.
- Campaign approval invalidates after content edit.
- Concurrent workers do not double-claim/deliver.
- Duplicate/out-of-order provider simulation events converge correctly.
- Unsubscribe racing with delivery is respected by final pre-send check.
- Subscription cancellation does not delete customer data immediately.
- Reconciliation detects intentionally corrupted fixture state.

### 23.3 End-to-end tests

1. Sign up -> verify -> create organization -> onboarding -> brand -> sender simulation -> import -> template -> campaign -> test capture -> review -> approve -> schedule -> report.
2. Invite editor and approver -> editor submits -> approver requests changes -> editor resubmits -> approver approves.
3. Owner reaches quota -> blocked with accurate usage -> platform owner grants expiring override -> action works -> expiry restores limit.
4. Platform owner creates plan version -> existing organization remains grandfathered -> new organization receives new version.
5. Contact unsubscribes -> immediately suppressed -> subsequent campaign excludes it.
6. Past-due/restricted local subscription retains view/export but cannot schedule.
7. Abuse suspension stops queued work even when subscription is active.
8. Cross-tenant URL/ID attempts return safe 404/403 and no data.

### 23.4 Accessibility tests

- axe on every key page/state.
- Keyboard-only E2E for auth, import, editor, review, members, billing, and platform override.
- Manual NVDA/Firefox or VoiceOver/Safari pass for core journey before beta.
- 200% zoom, reduced motion, high contrast, mobile viewport, and RTL pseudo-locale checks.

### 23.5 Quality commands

The repository must expose:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:integration": "vitest run --project integration",
    "test:e2e": "playwright test",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "node scripts/migrate-database.mjs",
    "db:check": "node scripts/check-database.mjs",
    "worker": "node scripts/worker.mjs"
  }
}
```

Exact runner wrappers may use `tsx` if required by the pinned toolchain; retain script names and behavior.

## 24. Work packages and dependency order

No later package begins until the earlier package's exit criteria pass, except isolated design work.

### WP-00 — repository safety and truth

Tasks:

- WP-00.1 Revoke/rotate the previously used Gmail app password outside code.
- WP-00.2 Confirm deployed environments keep sending disabled.
- WP-00.3 Choose npm, remove contradictory pnpm instructions, run clean install.
- WP-00.4 Upgrade Next.js, React, Nodemailer/remove it, and vulnerable transitive dependencies to patched compatible versions.
- WP-00.5 Replace broken `next lint` script with ESLint configuration.
- WP-00.6 Add format, typecheck, unit-test, audit, and build CI.
- WP-00.7 Remove Python public handler and obsolete Vercel/Python documentation; decide separately whether CLI is archived.
- WP-00.8 Fix mojibake/encoding and misleading unlimited/instant/secure claims.
- WP-00.9 Add LICENSE matching the declared repository license.
- WP-00.10 Add `PROJECT_STATUS.md`, ADR template, and change log.

Exit:

- Clean install, lint, typecheck, tests, build, and production audit pass.
- Only disabled send route remains, with tests.
- README describes reality.

### WP-01 — local platform foundation

Depends on WP-00.

Tasks:

- WP-01.1 Add compose services and documented non-container alternative.
- WP-01.2 Add validated env contract and `.local` isolation.
- WP-01.3 Add Drizzle/PostgreSQL, migration roles, health checks, and migration scripts.
- WP-01.4 Add base IDs, timestamps, result/error, HTTP envelope, request ID, logging.
- WP-01.5 Add Vitest PostgreSQL integration harness with isolated test DB.
- WP-01.6 Add storage interface/local driver.
- WP-01.7 Add transactional outbox, job table, claim/dispatch loops, graceful worker, retry tests.

Exit:

- Fresh clone can start PostgreSQL, migrate, run app/worker, and pass tests with no paid service.
- Two concurrent test workers never claim the same job.

### WP-02 — authentication and tenant isolation

Depends on WP-01.

Tasks:

- WP-02.1 Pin/integrate Better Auth and generated Drizzle schema.
- WP-02.2 Implement sign-up, sign-in, verification capture, reset capture, sign-out-all.
- WP-02.3 Implement organizations, membership roles, invitations, and workspace selector.
- WP-02.4 Implement authorization context and permission library.
- WP-02.5 Add RLS roles/policies and transaction-local tenant context.
- WP-02.6 Build organization settings/members/audit shell.
- WP-02.7 Complete tenant isolation matrix.

Exit:

- Multi-workspace auth works.
- Cross-tenant test suite passes for every current tenant table.
- No product page relies only on client-side guards.

### WP-03 — subscription, entitlements, and founder control

Depends on WP-02.

Tasks:

- WP-03.1 Implement plans, immutable versions, prices, entitlement registry, and seed data.
- WP-03.2 Implement local subscription lifecycle and non-payable invoice previews.
- WP-03.3 Implement effective-config resolver/source map/hash/version.
- WP-03.4 Implement usage ledger, rollups, reservations, and quota errors.
- WP-03.5 Bootstrap platform owner and platform permission checks.
- WP-03.6 Build organization search/overview.
- WP-03.7 Build typed override/contract preview and execution.
- WP-03.8 Implement high-risk second approval, expiry, rollback/supersede, and audit.
- WP-03.9 Build customer Billing/Usage page that clearly states local beta status.
- WP-03.10 Implement reconciliation checks and exception UI.
- WP-03.11 Implement versioned customer workspace policies within plan/platform boundaries.
- WP-03.12 Implement commercial agreements, invoice line items, and controlled local billing adjustments.

Exit:

- Founder can create/publish/version a plan and manually subscribe a business.
- Founder can grant an expiring feature/quota safely without SQL.
- Customer sees accurate effective limits and sources allowed for display.
- Existing subscription remains on old plan version after a new version publishes.
- Entitlements are enforced server-side in integration tests.

### WP-04 — contacts, consent, lists, and suppression

Depends on WP-03.

Tasks:

- WP-04.1 Implement contact CRUD, tags, lists, search, pagination.
- WP-04.2 Implement append-only consent ledger and status derivation.
- WP-04.3 Implement suppression service and restricted unsuppression workflow.
- WP-04.4 Implement CSV upload/parse/map/preview/attest/commit jobs.
- WP-04.5 Implement quota-aware idempotent chunk imports.
- WP-04.6 Add safe CSV exports and retention cleanup.
- WP-04.7 Build Contacts, Lists, Imports, and Suppressions screens.
- WP-04.8 Implement custom-field definitions, subscription topics/preferences, and versioned saved segments.

Exit:

- 100,000-row test fixture processes within defined local memory/time target without blocking web process.
- Duplicate, invalid, and suppressed counts are exact.
- No suppressed contact can become active through import alone.

### WP-05 — brand, assets, templates, and renderer

Depends on WP-03; can overlap late WP-04 only after tenant primitives stabilize.

Tasks:

- WP-05.1 Implement brands and required legal identity/address.
- WP-05.2 Implement local image assets with type/size/dimension validation.
- WP-05.3 Define versioned block schema and migrations between schema versions.
- WP-05.4 Build deterministic HTML/plain-text renderer and sanitizer.
- WP-05.5 Build accessible block editor, autosave, undo/redo, desktop/mobile previews.
- WP-05.6 Implement template versions, starter templates, duplicate/archive.
- WP-05.7 Implement sandboxed preview and rendering security tests.

Exit:

- Starter templates render deterministically and pass sanitizer snapshots.
- Script/event/unsafe URL payloads cannot execute in app preview.
- Plain text is meaningful, not raw stripped tags.

### WP-06 — senders and campaign workflow

Depends on WP-04 and WP-05.

Tasks:

- WP-06.1 Implement development-simulated sender domain/identity workflow with permanent visible simulation label.
- WP-06.2 Implement campaign CRUD/version/state machine.
- WP-06.3 Implement audience definition for lists/tags/basic field filters.
- WP-06.4 Implement complete preflight engine and UI.
- WP-06.5 Implement review, requested changes, immutable approval.
- WP-06.6 Implement scheduling in organization timezone and idempotency.
- WP-06.7 Implement audience snapshot and quota reservation.
- WP-06.8 Implement cancel/pause/resume invariants.

Exit:

- Invalid transitions fail with stable codes.
- Any meaningful edit invalidates approval.
- Audience counts/exclusions are reproducible from snapshot.

### WP-07 — capture delivery, unsubscribe, and reports

Depends on WP-06.

Tasks:

- WP-07.1 Implement provider interface and capture provider.
- WP-07.2 Implement campaign fanout, one-recipient rendering, deliveries, attempts.
- WP-07.3 Implement simulated provider events and event processor.
- WP-07.4 Implement signed one-click unsubscribe and visible preference confirmation.
- WP-07.5 Implement final suppression race check.
- WP-07.6 Implement campaign finalizer and metric definitions.
- WP-07.7 Build report/delivery drill-down with permission controls.
- WP-07.8 Add capture retention and safe local preview/download.

Exit:

- Full E2E campaign completes without network delivery.
- Exactly one artifact exists per eligible contact.
- No artifact exposes other recipients.
- Unsubscribe between snapshot and delivery prevents capture.

### WP-08 — product completeness and hardening

Depends on WP-07.

Tasks:

- WP-08.1 Complete empty/error/loading/restricted states and onboarding.
- WP-08.2 Internationalize all strings; add RTL pseudo-locale.
- WP-08.3 Complete keyboard/axe/manual accessibility pass.
- WP-08.4 Add rate limits, headers, CSP, upload defenses, security test cases.
- WP-08.5 Add platform queues, reconciliation, feature flags, audit views, kill switches.
- WP-08.6 Add retention jobs, export/delete workflows, backup/restore documentation.
- WP-08.7 Write runbooks, support docs, and operator training fixtures.
- WP-08.8 Load-test imports, queues, fanout, reports, and concurrent tenants.
- WP-08.9 Independent code/security review using available free tooling and peer review.

Exit:

- Free-first private demo is complete, safe, accessible, and locally reproducible.
- No real sending or payment path exists accidentally.
- All release gates in Section 26 pass.

### WP-09 — provider readiness, explicitly deferred

Do not begin without a separate owner decision, budget, legal readiness, and updated ADRs.

- Select deployment/database/storage/email/payment vendors.
- Replace local secrets with managed secrets/KMS.
- Implement real domain verification and delivery adapter.
- Implement signed real event webhooks and provider reconciliation.
- Implement payment provider or merchant of record and tax approach.
- Complete abuse operations, legal documents, penetration test, backups, monitoring, and support readiness.
- Controlled beta only; no open self-service blast switch.

## 25. Seed data for deterministic development

Create a seed command that is refused in production and produces:

- One platform owner from `BOOTSTRAP_OWNER_EMAIL`.
- Plans: `sandbox`, `starter-preview`, `growth-preview`; all clearly non-payable.
- Two organizations, each with owner/admin/editor/approver fixtures.
- Different plan versions and one expiring override.
- Contacts covering active, unsubscribed, suppressed, invalid import, duplicate, and missing merge data.
- Two brands, two sender simulations, starter templates.
- Campaigns in draft, review, scheduled, completed, failed states.
- Capture deliveries with all simulated event outcomes.
- Reconciliation exception fixture.

Use example domains (`example.com`, `.test`, `.invalid`) and non-routable addresses only.

## 26. Free-first release gates

All must pass before calling the implementation complete:

### Build and reproducibility

- Fresh clone setup documented and completed on a clean machine/account without paid services.
- `npm ci`, lint, format check, typecheck, unit, integration, E2E, build, and production audit pass.
- Database migrates from empty and upgrade path is tested.
- Seed is deterministic and production-protected.

### Security and isolation

- Zero known unmitigated critical/high production dependency findings.
- Cross-tenant matrix passes for every tenant-owned table and route.
- No wildcard CORS, secret leakage, same-origin preview XSS, or unbounded upload/request.
- Platform actions require correct role; high-risk self-approval fails.
- Real external email and payment network calls are impossible by configuration and implementation.

### Subscription/control

- Plans are immutable through versioning once used.
- Entitlement precedence and restrictions are deterministic.
- Founder can provision a custom business safely without SQL.
- Every override has reason/source/effective dates/audit; expiry works.
- Usage ledger, rollup, reservation, and effective config reconcile.
- Customer cannot self-grant a feature or quota.

### Campaign safety

- Consent attestation and suppression are enforced.
- Marketing content always has legal identity/address and functional local unsubscribe.
- One recipient per message artifact; no address leakage.
- Approval binds exact content/audience/sender version.
- Idempotent retries never duplicate capture.
- Kill switch/pause/cancel behavior is tested.

### Usability/accessibility

- New user can complete the full local demo without developer intervention after setup.
- Core flows pass keyboard and automated accessibility tests.
- No dead buttons or fake payment/sending success.
- Mobile, 200% zoom, reduced motion, and RTL pseudo-locale pass.

### Operations

- Queue failures are visible and safely retryable.
- Audit history explains sensitive changes.
- Retention cleanup, export/delete, backup, and restore procedures are documented and tested.
- Product limitations and simulated behaviors are visible to users.

## 27. Coding-model execution checklist

Before each task:

1. Read this blueprint, relevant ADRs, `PROJECT_STATUS.md`, schema, and tests.
2. Confirm the exact WP task and dependencies are complete.
3. Inspect current git status; preserve unrelated user changes.
4. State files and contracts expected to change.
5. Add or update tests first when practical.

During each task:

1. Use existing names/constants; do not create synonyms.
2. Keep HTTP, service, query, and UI responsibilities separated.
3. Validate input and authorize before mutation.
4. Make multi-record state changes transactional with audit/outbox where required.
5. Avoid placeholders, silent catches, unsafe casts, `any`, and unbounded queries.
6. Never weaken safety to make a test pass.

After each task:

1. Run focused tests, then lint/typecheck, then applicable integration/E2E/build checks.
2. Run migration and tenant-isolation checks for schema/query work.
3. Run `git diff --check` and inspect the complete diff.
4. Update `PROJECT_STATUS.md` with completed task, verification, open risks, and next task.
5. Update this blueprint/ADR first if implementation discovered a required contract change.
6. Do not mark the work package complete while an acceptance criterion is missing.

Stop and request an owner decision if implementation would:

- Introduce a paid dependency or service.
- Enable real email delivery or payment collection.
- Change the locked stack or business model.
- Relax a compliance, suppression, tenant, billing, or abuse invariant.
- Require choosing a legal entity, tax treatment, provider, region, or public brand.
- Migrate or delete real user data.

## 28. Free tools and later replacement boundaries

| Free-first component | Interface boundary            | Later production option, not selected now |
| -------------------- | ----------------------------- | ----------------------------------------- |
| Local PostgreSQL     | Standard PostgreSQL + Drizzle | Managed PostgreSQL                        |
| PostgreSQL jobs      | `JobQueue`                    | Managed queue/Redis if measured need      |
| Local disk           | `StorageAdapter`              | S3-compatible object storage              |
| Capture/Mailpit      | `EmailProvider`               | SES or another approved provider          |
| Local billing        | `BillingProvider`             | PSP or merchant of record                 |
| JSON logs            | `Logger`/telemetry wrapper    | Hosted logs/APM                           |
| Simulated DNS        | `DomainVerificationProvider`  | Real DNS/provider verification            |
| Local encryption key | `EncryptionProvider`          | KMS/HSM-backed envelope encryption        |

Do not build to the least common denominator. Interfaces expose product concepts; provider-specific details remain inside adapters.

## 29. Normative references

- [Product strategy and roadmap](./PRODUCT_STRATEGY_AND_ROADMAP.md)
- [Next.js App Router and Route Handlers](https://nextjs.org/docs/app/getting-started/route-handlers)
- [Better Auth Next.js integration](https://better-auth.com/docs/integrations/next)
- [Better Auth Drizzle adapter](https://better-auth.com/docs/adapters/drizzle)
- [Drizzle migrations](https://orm.drizzle.team/docs/migrations)
- [Drizzle PostgreSQL row-level security](https://orm.drizzle.team/docs/rls)
- [PostgreSQL `SKIP LOCKED`](https://www.postgresql.org/about/featurematrix/detail/skip-locked-clause/)
- [OWASP multi-tenant security](https://cheatsheetseries.owasp.org/cheatsheets/Multi_Tenant_Security_Cheat_Sheet.html)
- [RFC 8058 one-click unsubscribe](https://www.rfc-editor.org/rfc/rfc8058.html)
- [WCAG 2.2](https://www.w3.org/TR/WCAG22/)
