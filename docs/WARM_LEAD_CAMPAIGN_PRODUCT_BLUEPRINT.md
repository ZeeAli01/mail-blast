# MailBlast worldwide warm-lead campaign product blueprint

Status: normative product and implementation specification  
Prepared: 2026-10-29  
Safety posture: capture-only; real delivery and payment remain disabled  
Initial vertical: SaaS growth and customer-lifecycle campaigns

## 1. Product thesis

MailBlast must not become another bulk-send form or email-harvesting tool. Its defensible product is an evidence-led campaign operating system that helps a team answer five different questions before sending:

1. **Identity:** is this the intended person and company?
2. **Deliverability:** is the address technically likely to receive mail?
3. **Permission:** may this organization send this message class to this person in the relevant jurisdiction?
4. **Intent:** has the person or account shown a recent, explainable signal of interest?
5. **Fit:** does the person/account match the business's ideal customer profile?

The system must never collapse these questions into one opaque “lead score.” A verified mailbox is not automatically a real person, a public address is not automatically permission, an ICP match is not automatically warm, and a warm lead is not automatically eligible for every campaign.

The differentiator is the **Evidence Card**: every lead and every campaign recipient can show where the data came from, when it was collected, what permission exists, what made it warm, how deliverability was evaluated, which policy allowed or blocked it, and what happened afterward.

## 2. Research conclusions that control implementation

### 2.1 Sender and recipient safety

- The US CAN-SPAM rules require accurate headers and subjects, a valid postal address, a working opt-out, and prompt honoring of opt-outs. Address harvesting and dictionary attacks carry elevated risk. Source: FTC, <https://www.ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business>.
- UK PECR generally requires consent for marketing to individuals; the “soft opt-in” is limited and does not turn bought prospective lists into warm leads. B2B corporate subscribers are treated differently, but identity, opt-out, data-protection, and suppression duties remain. Sources: ICO, <https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/business-to-business-marketing/> and <https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guide-to-pecr/electronic-and-telephone-marketing/electronic-mail-marketing/>.
- Google requires stronger authentication and unsubscribe behavior for bulk senders, including SPF, DKIM, DMARC alignment, TLS, one-click unsubscribe for marketing/subscribed mail, and low spam rates. Source: <https://support.google.com/a/answer/81126>.
- Yahoo similarly requires authentication, alignment, easy unsubscribe, rapid honoring of unsubscribes, and spam complaint rates below its published threshold. Source: <https://senders.yahooinc.com/best-practices/>.
- LinkedIn prohibits unauthorized crawlers, bots, and scraping tools. MailBlast must not scrape LinkedIn or encourage browser-extension extraction. Source: <https://www.linkedin.com/help/linkedin/answer/a1341387/prohibition-of-scraping-software>.
- Email verification vendors explicitly distinguish deliverable, risky, catch-all, disposable, unknown, and invalid states; catch-all domains cannot prove a specific mailbox exists. Verification is evidence, not certainty. Sources: <https://hunter.io/api-documentation/> and <https://zerobounce.net/docs/email-validation-api-quickstart>.

These are product requirements, not optional footer text. Legal counsel must review each production jurisdiction before real delivery is enabled.

### 2.2 “Warm” definition

A contact is warm only when at least one current, attributable intent signal exists. Allowed examples:

- requested a demo or consultation;
- registered for an event or webinar with the required notice;
- started a trial or created an account;
- submitted a permissioned form or content request;
- replied to an earlier permitted conversation;
- booked or attended a meeting;
- was referred under a documented and permitted process;
- reached a configured CRM opportunity stage;
- performed a consented product action associated with buying or expansion intent.

Keyword search, job title, company size, public profile, a technically valid mailbox, or an inferred email pattern are **fit/discovery evidence**, not warmth.

### 2.3 Source policy

Sources are classified and controlled:

| Source                | Default use                      | Can establish warmth?        | Can establish permission?              |
| --------------------- | -------------------------------- | ---------------------------- | -------------------------------------- |
| First-party form      | eligible after notice validation | yes                          | yes, if proof is complete              |
| Product/account event | lifecycle use                    | yes                          | sometimes; message-class dependent     |
| CRM                   | import/sync                      | yes, with attributable event | only if the original proof is imported |
| Event registration    | event follow-up                  | yes                          | only within disclosed purposes         |
| Customer/referral     | human review                     | potentially                  | no automatic assumption                |
| Manual research       | discovery only                   | no                           | no                                     |
| Public business site  | discovery only                   | no                           | no automatic assumption                |
| Licensed provider     | enrichment only                  | no                           | no automatic assumption                |
| CSV                   | quarantine until attested        | only with signal columns     | only with evidence/attestation         |

Purchased, scraped, breached, harvested, guessed, or untraceable lists are prohibited. Role inboxes such as `sales@` may be stored but need separate policy and are never treated as an identified warm person.

## 3. Scope and product boundaries

### 3.1 Version-one outcome

A small or large business can:

1. create an isolated workspace and invite a team;
2. define its ideal customer profile and campaign purpose;
3. ingest first-party, CRM, event, manual, CSV, or approved provider data;
4. search/filter evidence-backed prospects without automatically enrolling them;
5. review, merge, assign, tag, segment, suppress, archive, or delete records;
6. see separate permission, verification, intent, fit, risk, and recency dimensions;
7. create a saved campaign from a governed playbook;
8. preview the exact audience and every exclusion reason;
9. obtain approval for the exact immutable version;
10. schedule a stable audience snapshot;
11. run capture delivery, and later an approved provider;
12. inspect per-recipient attempts, provider events, replies, bounces, complaints, unsubscribes, and conversions;
13. audit every sensitive change;
14. operate within plan limits and founder-controlled overrides.

### 3.2 Explicit non-goals

- no LinkedIn or social-network scraping;
- no mailbox-pattern guessing or dictionary generation;
- no direct SMTP recipient probing from MailBlast infrastructure;
- no inbox rotation or evasion of provider limits;
- no automatic use of discovered prospects in campaigns;
- no claim that an email is “100% valid” or a person is “guaranteed warm”;
- no real Gmail bulk sending;
- no paid API dependency for local development or CI;
- no MongoDB rewrite of the system of record without a reviewed ADR and migration plan.

## 4. Architecture decision: PostgreSQL remains authoritative

The existing application already implements PostgreSQL row-level tenant isolation, transactional jobs, idempotency keys, immutable ledgers, audience snapshots, unique constraints, approvals, subscription state, and audit history. These workloads are relational and transaction-heavy.

MongoDB does not remove migrations: indexes, validators, document versions, backfills, and compatibility windows still require controlled schema evolution. Moving the current sixty-table foundation to MongoDB would increase risk without improving the primary workflows.

Decision:

- PostgreSQL remains the source of truth for users, tenants, billing, entitlements, contacts, companies, permissions, campaigns, queues, delivery, and audits.
- JSONB is used only for versioned filter documents, provider payloads, evidence details, and controlled metadata.
- Atlas may later be evaluated for high-volume raw enrichment documents or temporary provider payloads, but only behind a repository interface and after retention/deletion requirements are proven.
- If Atlas is approved, create a `mailblast` database and a dedicated least-privilege database user limited to it. Never reuse the Samaan administrator or its credentials.
- The credentials posted in chat are compromised and must be rotated. They must not enter files, logs, commands, migrations, or git history.

## 5. Domain model and invariants

### 5.1 Core aggregates

- **Organization:** tenant boundary, plan, policies, members, brands, senders.
- **Company:** normalized domain, firmographics, provenance, account owner.
- **Contact:** normalized email identity, names, status, custom attributes.
- **Lead profile:** contact-to-company relationship, role, lifecycle, owner, jurisdiction, independent scores.
- **Lead source:** collection method, provider, URL/reference, trust state, terms reference, timestamps, retention.
- **Email evidence:** source, verification status, risk flags, confidence, provider, expiry.
- **Lead signal:** typed intent event, strength, time, expiry, evidence source, deduplication key.
- **Consent event:** append-only grant/revoke/unsubscribe evidence.
- **Permission decision:** message-class and jurisdiction-specific review result, basis, reviewer, expiry.
- **Discovery project:** saved keywords, ICP filters, source allowlist, result limit, owner, state.
- **Discovery result:** quarantined candidate requiring review before contact creation.
- **Segment:** versioned rule tree; never a mutable array of recipients.
- **Campaign:** purpose, category, type, message class, sender, topic, state.
- **Campaign version:** immutable content and audience definition.
- **Audience snapshot:** exact recipient eligibility/exclusion result at scheduling time.
- **Delivery/attempt/event:** one recipient outcome, retries, and provider evidence.
- **Audit event:** immutable actor/action/before/after/security metadata.

### 5.2 Independent dimensions

Every lead exposes these values separately:

- `verification`: unverified, syntax-valid, deliverable, risky, undeliverable, unknown;
- `permission`: unknown, consented, soft-opt-in, legitimate-interest-reviewed, contractual, transactional-only, opted-out, prohibited;
- `intent_score`: 0–100 with visible contributing signals and decay;
- `fit_score`: 0–100 with visible ICP rule matches;
- `risk_score`: 0–100 with visible risk reasons;
- `source_trust`: verified, declared, unverified, rejected;
- `recency`: newest meaningful source/signal age;
- `lifecycle`: prospect, MQL, SQL, opportunity, customer, disqualified.

No UI may replace these with a single unexplained badge. A composite prioritization score may sort a queue, but it must be reproducible, versioned, and never override a hard policy gate.

### 5.3 Hard campaign eligibility gate

At audience preview and immediately before every delivery:

1. organization and subscription allow the action;
2. user has permission;
3. system/global/org/campaign kill switches are clear;
4. sender and legal identity meet policy;
5. campaign version is approved if required;
6. source evidence exists and is current;
7. message-class permission is valid;
8. address is not suppressed, opted out, complained, or hard-bounced;
9. verification status meets organization policy;
10. sales-follow-up has a qualifying warm signal;
11. jurisdiction policy passes;
12. frequency cap and quiet hours pass;
13. quota reservation succeeds atomically;
14. recipient is deduplicated by normalized identity;
15. content includes required identity and unsubscribe elements.

Failure produces a stable reason code, never a silent omission.

## 6. SaaS campaign taxonomy

### 6.1 Categories

- SaaS growth
- Customer lifecycle
- Sales-assisted follow-up
- Newsletter/editorial
- Events/webinars
- Transactional/service

### 6.2 Initial playbooks

| Type                 | Entry signal                      | Objective                     | Exit condition                      | Guardrail                 |
| -------------------- | --------------------------------- | ----------------------------- | ----------------------------------- | ------------------------- |
| Inbound nurture      | permissioned form/content request | qualify interest              | reply, meeting, conversion, opt-out | marketing permission      |
| Demo follow-up       | demo request/meeting              | support evaluation            | opportunity update/reply            | assigned owner and signal |
| Trial onboarding     | trial/account created             | first value                   | activation achieved/trial ended     | product relationship      |
| Activation           | missing key product event         | complete next action          | event completed                     | event-based segmentation  |
| Product education    | active customer/user              | adoption                      | lesson/feature adopted              | topic preference          |
| Feature announcement | subscribed audience               | awareness/adoption            | click/use/expiry                    | marketing permission      |
| Upgrade/cross-sell   | usage/plan signal                 | expansion                     | opportunity/upgrade                 | account eligibility       |
| Renewal              | renewal window                    | retention                     | renewed/churned                     | contractual relationship  |
| Churn prevention     | risk signal                       | resolve friction              | recovered/canceled                  | frequency cap             |
| Win-back             | former customer, allowed basis    | reactivation                  | reply/reactivation                  | recency and permission    |
| Webinar/event        | registration                      | attendance/follow-up          | event complete                      | disclosed event purpose   |
| Newsletter           | explicit subscription             | ongoing value                 | unsubscribe                         | one-click opt-out         |
| Advocacy             | satisfied customer signal         | review/referral/case study    | accepted/declined                   | separate request cadence  |
| Service notice       | active relationship               | necessary service information | delivered/resolved                  | no promotional content    |

Each playbook defines allowed sources, required basis, required signal, cadence, maximum steps, stop conditions, success events, template blocks, and reporting metrics. Users may clone a playbook but cannot weaken platform safety rules.

## 7. Lead discovery and qualification workflow

### 7.1 Search builder

Inputs:

- keywords and excluded keywords;
- company domain/name;
- industry/sub-industry;
- employee and revenue bands;
- country/region/city/time zone;
- technology indicators;
- funding/growth/intent indicators where licensed;
- job function, department, seniority, and title include/exclude;
- lifecycle, owner, tags, lists;
- source types and maximum source age;
- verification, permission, intent, fit, and risk ranges;
- “must have warm signal” and selected signal types;
- “contactable for message class” selector.

Search results enter a quarantine/review table. No search action creates campaign recipients.

### 7.2 Evidence pipeline

1. validate provider/source permission and organization entitlement;
2. normalize company domain and URLs;
3. deduplicate company candidates;
4. normalize person identity without guessing an email;
5. attach source and collection timestamp;
6. validate syntax and internationalized domain handling;
7. perform free DNS/MX evidence check asynchronously;
8. optionally call an approved verification adapter;
9. classify disposable, role-based, catch-all, unknown, and risky results;
10. match/merge existing contacts with a reviewable explanation;
11. import permission evidence separately;
12. ingest and decay intent signals;
13. calculate fit from versioned ICP rules;
14. apply jurisdiction and retention policy;
15. require human acceptance for ambiguous identity/merges;
16. write an audit event and retain raw evidence only as policy permits.

### 7.3 Free-first inputs

- manual lead/company entry;
- CSV import with preview, mapping, validation, duplicate resolution, and consent attestation;
- embeddable form/webhook contract running locally;
- first-party product event API contract;
- generic CRM import adapter using local JSON/CSV fixtures;
- DNS/MX checking through the operating system resolver;
- demo provider returning deterministic fixture data;
- manual source URL and proof capture.

Paid enrichment, CRM, and verification providers remain optional adapters. Absence of an API key must produce a clear “not configured” state, never a broken button or false data.

## 8. Information architecture and UI contract

### 8.1 Public website

Pages:

- `/`: product-led landing page with clear warm-lead thesis, workflow, playbooks, governance, security, FAQ, and capture-only status;
- `/product`: detailed product tour;
- `/solutions/{saas,sales,marketing,customer-success,agencies}`;
- `/pricing`: transparent future plans and current beta status;
- `/security`, `/privacy`, `/terms`, `/acceptable-use`, `/anti-spam`;
- `/docs` and `/status` when production begins.

The landing page must not claim real provider delivery, AI, enrichment, or billing before those features pass their readiness gates.

### 8.2 Authenticated navigation

- Overview
- Discover
- Leads
- Companies
- Contacts
- Segments
- Campaigns
- Templates/playbooks
- Conversations/replies (future provider phase)
- Reports
- Deliverability
- Compliance center
- Team/access
- Integrations
- Billing/usage
- Audit
- Settings

### 8.3 Reusable UI primitives

Build accessible primitives before feature pages:

- button, icon button, link button, split button;
- input, textarea, select, combobox, multi-select, token input;
- checkbox, radio, switch, slider, date/time/range picker;
- table with server pagination, sorting, column visibility, density, selection, sticky header, and empty/error/loading states;
- filter builder with nested AND/OR groups, active filter chips, saved views, and reset;
- badge/tag, status dot, score meter, evidence badge;
- modal/dialog, drawer, popover, tooltip, dropdown menu;
- toast for transient success; inline alert for actionable errors; confirmation dialog for destructive operations;
- tabs, breadcrumb, sidebar, command palette, pagination;
- skeleton, progress, stepper, timeline, activity feed;
- chart wrappers with accessible summaries and export;
- error boundary, not-found state, permission-denied state, and retry action.

All interactive controls require visible hover, focus, active, disabled, loading, success, and error states. Disabled actions explain the missing prerequisite. Desktop tables become card/list views or horizontally scroll with sticky identity columns on small screens.

### 8.4 Key screens

**Discover:** saved search sidebar, source selector, nested filters, result table, evidence drawer, bulk accept/reject, cost preview for paid adapters, run history.

**Lead workspace:** prioritized queue, independent score columns, permission badge, signal timeline, company context, ownership, tasks/notes, merge review, suppression action.

**Contact detail:** identity, sources, permission timeline, preferences, verification history, signals, campaign history, delivery events, audit, export/delete request.

**Campaign library:** category/type/status/owner filters, grid/table toggle, saved views, performance summary, clone/archive actions.

**Campaign builder:** purpose → playbook → audience → content → sender → tracking → schedule → preflight → approval. Autosave a mutable draft, then freeze an immutable version for review.

**Campaign operations:** live aggregate counters, per-recipient log, attempts/events, exclusion reasons, pause/stop, export, incident banner.

**Compliance center:** permission coverage, unknown-source records, expiring evidence, suppression trends, retention queue, DSAR/export/delete tools, jurisdiction policies.

**Founder control plane:** organization status, plan/subscription, entitlement overrides with reason/expiry, limits, feature flags, safety restrictions, abuse evidence, impersonation-free support diagnostics, immutable admin actions.

## 9. API and service boundaries

All routes parse/authorize and delegate. Business rules live in services; database access lives in tenant-scoped repositories.

Representative endpoints:

```text
GET/POST   /api/v1/organizations/:orgId/companies
GET/PATCH  /api/v1/organizations/:orgId/companies/:companyId
GET/POST   /api/v1/organizations/:orgId/leads
GET/PATCH  /api/v1/organizations/:orgId/leads/:leadId
POST       /api/v1/organizations/:orgId/leads/:leadId/review-permission
POST       /api/v1/organizations/:orgId/leads/:leadId/verify-email
GET/POST   /api/v1/organizations/:orgId/discovery-projects
POST       /api/v1/organizations/:orgId/discovery-projects/:id/run
GET        /api/v1/organizations/:orgId/discovery-projects/:id/results
POST       /api/v1/organizations/:orgId/discovery-results/:id/accept
POST       /api/v1/organizations/:orgId/discovery-results/:id/reject
GET/POST   /api/v1/organizations/:orgId/segments
POST       /api/v1/organizations/:orgId/segments/:id/preview
GET/POST   /api/v1/organizations/:orgId/campaigns
POST       /api/v1/campaigns/:id/preflight
POST       /api/v1/campaigns/:id/request-approval
POST       /api/v1/campaigns/:id/schedule
GET        /api/v1/campaigns/:id/deliveries
GET        /api/v1/campaigns/:id/audit
```

Contract requirements:

- Zod request/response schemas;
- cursor pagination for mutable/high-volume collections;
- stable error codes and field errors;
- idempotency key for imports, runs, mutations, scheduling, delivery, and webhooks;
- request ID propagated to logs/audit;
- optimistic concurrency/version check on edited resources;
- rate limiting by IP, user, organization, and sensitive operation;
- audit event for all source, permission, suppression, campaign, access, entitlement, and export changes;
- no provider payload or secret returned to clients.

## 10. Background jobs

Job types:

- import parse/validate/commit;
- discovery provider page;
- company/contact normalization;
- DNS/MX evidence refresh;
- provider verification;
- signal ingestion/deduplication;
- intent decay and fit recalculation;
- permission/evidence expiry;
- segment preview/materialization;
- campaign audience snapshot;
- delivery capture/send;
- provider event processing;
- suppression propagation;
- report aggregation;
- retention deletion/anonymization;
- export generation;
- outbox dispatch.

Every job has an idempotency key, bounded retries, exponential backoff with jitter, dead-letter/failure visibility, progress counters, safe cancellation points, structured error codes, and tenant context. Workers never trust organization IDs embedded only in unvalidated payloads.

## 11. Provider adapter contracts

Interfaces:

- `LeadDiscoveryProvider.search(request, cursor)`;
- `CompanyEnrichmentProvider.enrich(domain)`;
- `PersonEnrichmentProvider.enrich(identity)`;
- `EmailVerificationProvider.verify(email)`;
- `CrmProvider.pull(cursor)` and `push(change)`;
- `DeliveryProvider.send(message, idempotencyKey)`;
- `BillingProvider` using the existing internal subscription commands.

Each adapter declares capabilities, pricing unit, network requirement, supported countries, data provenance fields, retention constraints, rate limits, and health. The UI asks for confirmation before a credit-consuming call and records estimated/actual usage. Provider keys are encrypted server-side, write-only after entry, never logged, and independently revocable.

## 12. Reporting and business impact

### 12.1 Funnel

Track counts and conversion time through:

`discovered → reviewed → accepted → permission-ready → verified → warm → MQL → SQL → opportunity → won/customer`

Do not attribute causality from opens. Privacy protections and image proxies make opens unreliable. Prioritize replies, booked meetings, qualified opportunities, product events, and revenue events.

### 12.2 Campaign metrics

- audience eligible/excluded with reason distribution;
- attempted, accepted, delivered, bounced, complained, unsubscribed;
- clicked/replied/meeting/conversion where configured;
- time to first response and conversion;
- results by campaign version, playbook, segment, source, signal, owner, and company cohort;
- deliverability by sender domain and recipient domain;
- negative-signal rate and frequency-cap impact;
- cost/credit usage per qualified result when paid adapters exist.

## 13. Subscription and founder control

Entitlements must include, at minimum:

- members;
- contacts and companies;
- monthly discovery results;
- monthly verification checks;
- active discovery projects;
- saved segments;
- active campaigns;
- monthly recipients;
- provider integrations;
- audit retention days;
- export capability;
- approval workflows;
- custom roles/branding;
- API/webhook access.

Founder overrides are typed, reasoned, time-bounded where appropriate, auditable, and optionally dual-approved for high-risk changes. Commercial overrides cannot disable suppression, consent, tenant isolation, or platform kill switches. Manual local subscriptions remain non-payable until a payment-provider ADR, tax model, refund flow, webhook verification, reconciliation, and production legal review are complete.

## 14. Security, privacy, and abuse controls

- separate migration, runtime, and worker database roles;
- PostgreSQL RLS plus service authorization and tenant-scoped repository checks;
- MFA-ready privileged roles; no platform role inferred from organization ownership;
- encryption in transit; approved field encryption for provider secrets and sensitive tokens;
- CSP, secure cookies, CSRF/origin checks, input limits, safe HTML rendering, SSRF protection;
- signed and replay-resistant webhooks;
- export and bulk-action rate limits;
- immutable audit trail and admin-action approvals;
- global/org/domain/campaign kill switches;
- abuse thresholds for complaints, bounces, list growth, and unusual volume;
- data minimization, retention schedules, source expiry, access/export/delete workflows;
- log redaction for email content, tokens, credentials, provider payloads, and personal data;
- backup/restore drills and documented recovery objectives before production.

## 15. Testing and release gates

### 15.1 Automated layers

- unit: scoring, decay, permission, taxonomy, state machines, rendering, limits;
- schema/contract: Zod inputs and API outputs;
- integration: RLS isolation, imports, merge, suppression, audience snapshot, quota transaction, idempotency, audit;
- worker: retry, cancellation, duplicate delivery, event ordering, dead letter;
- component: keyboard, focus, loading/error/empty/disabled states;
- E2E: onboarding through capture campaign, opt-out, permission failure, plan limit, admin override;
- accessibility: axe plus keyboard/screen-reader smoke paths;
- security: authorization matrix, IDOR, CSRF, SSRF, XSS, webhook replay, rate limits;
- migration: empty database and upgrade from the previous release;
- responsive: 320 px, 375 px, 768 px, 1024 px, and large desktop viewports.

### 15.2 Definition of done

A feature is incomplete until it includes authorization, validation, errors, loading/empty states, mobile behavior, accessibility, audit, telemetry, tests, migration/rollback notes, documentation, and a truthful feature flag. “No bugs” cannot be guaranteed; release confidence comes from these measurable gates, staged rollout, monitoring, and rapid rollback.

## 16. Delivery plan

### Phase 0 — security reset and architecture lock

- rotate the exposed Atlas and Gmail credentials;
- verify no secrets are committed;
- approve PostgreSQL system-of-record ADR;
- define acceptable-use and source policy;
- keep external delivery disabled.

Exit: clean secret scan, owner-approved ADR/policies, green baseline checks.

### Phase 1 — evidence-led lead foundation

- add company, lead profile, source, email evidence, signal, discovery project/result schema;
- add independent score and eligibility services;
- add taxonomy/playbooks;
- create migration, RLS policies, repositories, fixtures, tests;
- add Discover/Leads/Segments/Compliance/Deliverability navigation and honest empty states.

Exit: tenant isolation and eligibility tests prove that warmth cannot bypass permission or suppression.

### Phase 2 — contact and import operations

- production-grade CSV preview/mapping/validation;
- duplicate and merge review;
- consent/source evidence capture;
- tables, filters, pagination, saved views, bulk actions;
- company/contact/lead detail screens.

Exit: 100k-row synthetic import completes resumably without cross-tenant leakage or UI lockup.

### Phase 3 — free-first discovery and signals

- manual and demo discovery adapters;
- form/webhook and product-event ingestion;
- DNS/MX evidence checks;
- source quarantine/review flow;
- deterministic score calculation and decay.

Exit: every accepted lead has traceable source evidence; no discovered result can auto-enroll.

### Phase 4 — SaaS playbooks and segments

- versioned ICP and segment builder;
- initial SaaS playbook library;
- campaign wizard and preview;
- permission/jurisdiction/frequency gates;
- immutable version review/approval.

Exit: all playbooks pass policy matrix and audience reason-code tests.

### Phase 5 — capture campaign operations

- schedule/snapshot/worker operations UI;
- per-recipient delivery log and event timeline;
- pause/cancel/retry controls;
- reports and exports;
- unsubscribe/suppression regression suite.

Exit: load-tested capture runs are exactly-once from the product perspective and fully auditable.

### Phase 6 — founder control and subscription readiness

- entitlement enforcement on every billable resource;
- plans, trials, manual subscriptions, usage ledger, alerts;
- organization overrides, expiry, approvals, and audit;
- abuse operations and kill-switch dashboards.

Exit: founder can change access without code deploy, but cannot override safety invariants.

### Phase 7 — optional external providers

- choose providers through ADRs only after free workflows are mature;
- implement OAuth/API-key vault, capability/cost display, webhook verification, reconciliation;
- run sandbox and allowlisted recipient pilots;
- complete SPF/DKIM/DMARC, unsubscribe, complaint, bounce, warm-up, and legal readiness.

Exit: production-readiness checklist, independent security review, legal review, incident drill, and owner approval.

### Phase 8 — worldwide commercialization

- regional policy packs and localization;
- production billing, taxes, invoices, refunds, dunning;
- onboarding education and deliverability diagnostics;
- support, status page, SLAs, backups, observability, incident response;
- staged beta by country and use case, then measured expansion.

## 17. Immediate implementation sequence

The next commits must proceed in this order:

1. generate and review the Phase 1 database migration;
2. add tenant RLS for every new organization-owned table;
3. add repositories and service schemas;
4. implement list/detail APIs with cursor pagination;
5. implement server-rendered lead/discovery pages and reusable table/filter primitives;
6. implement manual source and lead creation with evidence;
7. implement permission review and suppression hard stops;
8. implement discovery quarantine acceptance/rejection;
9. implement DNS/MX worker evidence;
10. implement versioned ICP scoring and signal decay;
11. connect segments and campaign preflight to the new eligibility service;
12. run format, lint, typecheck, unit, integration, E2E, build, dependency audit, and secret scan;
13. update project status and operator runbook;
14. only then consider an external provider.

This sequence is binding: UI polish must not make unverified provider or policy behavior appear complete.
