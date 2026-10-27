# From prototype to worldwide email product

Status: product and technical strategy  
Prepared: 2026-10-25; expanded 2026-10-26  
Scope: turn the current repository into a safe, competitive, revenue-generating SaaS for permission-based business email

Implementation companion: [`IMPLEMENTATION_BLUEPRINT.md`](./IMPLEMENTATION_BLUEPRINT.md). The companion is the normative, free-first execution specification containing the locked stack, schemas, APIs, invariants, work packages, tests, and release gates.

## 0. Free-first execution constraint

Until the founder explicitly approves a provider budget, implementation uses only local/open-source infrastructure: PostgreSQL, a PostgreSQL-backed worker queue, local file storage, capture-only email delivery, and a local/manual subscription provider. No real recipient email, card payment, hosted database, paid AI, object storage, queue, analytics, or monitoring service is required. The complete product workflow is built and proven locally first; real email/payment providers are a separate gated phase.

## 1. Executive decision

The current application is a visually strong email-composer prototype. It is not yet a product that should send customer email. The right path is not to switch the button back on and add features around the existing SMTP call. It is to build a multi-tenant campaign platform around four promises:

1. **Send with confidence:** domain setup, consent, unsubscribe, reputation, and preflight checks are guided and enforced.
2. **Get useful work done quickly:** a new business can import legitimate contacts, apply its brand, and schedule a professional campaign without learning email infrastructure.
3. **Work safely as a team:** roles, approvals, audit history, reusable brand assets, and protected contact data make the product usable inside a company.
4. **Understand outcomes:** reporting explains delivery, engagement, and conversions in plain language and recommends the next action.

The recommended first market is **small and mid-sized service businesses, creators, nonprofits, and internal marketing/operations teams sending permission-based campaigns**. Agencies can become the second high-value segment. Do not launch as a cold-email or scraped-lead tool. That positioning attracts abuse, damages shared sender reputation, increases support and legal risk, and makes reliable inbox placement harder for every legitimate customer.

The product should support salespeople only for opted-in leads, existing relationships, account updates, event invitations, and compliant one-to-many follow-up. One-to-one prospecting sequences can be evaluated later as a separately controlled product mode.

## 2. Non-negotiable rebrand before commercialization

Do not commercialize under **MailBlast** without professional trademark clearance. An existing product at `mailblast.io` describes itself as an email-marketing platform operating since 2017, and `mailblast.ai` uses the same name in the adjacent campaign-creation category. The word “blast” also encourages the wrong product behavior.

Phase 0 must include:

- Create a naming brief around trust, clarity, reach, and responsible growth—not volume or blasting.
- Generate 20–30 candidates, then check search results, app stores, social handles, domains, company registries, and relevant trademark classes in target markets.
- Have an IP professional perform final clearance before purchasing brand assets or announcing the product.
- Select a name that is pronounceable internationally, easy to spell from hearing it, and not tied only to email if future channels are plausible.
- Rename the repository, package, product copy, metadata, email headers, legal entity references, and support addresses in one controlled migration.

This plan uses **the Product** as a temporary name.

## 3. What exists today

### Assets worth preserving

- A clean, responsive Next.js/Tailwind interface with a coherent visual identity.
- Recipient-tag entry with paste, deduplication, basic validation, CC, and BCC.
- Plain-text and HTML modes, formatting shortcuts, preview, templates, and sender fields.
- A small codebase that is inexpensive to reshape before users and data create migration pressure.
- A server-side kill switch that now prevents public use of the owner's Gmail credentials.

### Product gaps

The repository has no accounts, organizations, roles, persistence, contact lists, consent records, sender-domain onboarding, reusable campaigns, scheduling, queues, unsubscribe endpoint, preference center, suppression list, bounce/complaint processing, analytics, billing, quotas, support console, or API keys. Form state exists only in the browser. A refresh loses the work.

The current experience describes “unlimited recipients,” but the UI has a client-only 500-address limit per field and neither backend has a safe server-side cap. “Unlimited” should be removed everywhere; plans need transparent limits and abuse controls.

### Security and privacy findings

These are release blockers, not backlog polish:

- The TypeScript route and Python serverless handler are duplicate implementations of the same public endpoint. Their validation and behavior can drift.
- Both endpoints expose permissive `Access-Control-Allow-Origin: *` behavior and have no authentication, authorization, tenant isolation, CSRF strategy, rate limiting, quota enforcement, or idempotency.
- User-supplied HTML is rendered through `dangerouslySetInnerHTML` in the same application origin. A production editor needs sanitization plus an isolated sandboxed preview.
- Server validation accepts loosely typed JSON and trusts recipient arrays, strings, sizes, and counts. It needs schema validation, normalized addresses, request-size limits, and structured errors.
- The TypeScript sender sends immediately inside the request. Large sends will time out, retry unpredictably, or partially complete without a reliable record.
- The Python web handler places all `To` recipients in the visible header. The CLI builds one message before batching, so batch recipients can see addresses outside their batch. This is an unacceptable personal-data disclosure risk.
- There is no global or tenant suppression check, no one-click unsubscribe, and the newsletter template's unsubscribe URL is only `#`.
- Delivery success is reported as if it means inbox delivery. An SMTP acceptance is not proof of inbox placement or even final delivery.
- Raw provider errors may be returned to callers. Operational detail should be logged securely and mapped to safe public error codes.
- Sender name and reply-to behavior are not tied to a verified organization identity.
- Secrets are not present in tracked Git history, but the Gmail app password should still be revoked and replaced because the deployed endpoint was previously public. Secrets must never return to application-wide plaintext environment variables for a multi-tenant product.
- There are no tests, CI checks, dependency update policy, security headers, observability, backups, recovery drills, or incident runbooks.
- `npm audit --omit=dev` currently reports 7 production dependency findings: 1 critical, 5 high, and 1 moderate. Direct dependencies include affected Next.js and Nodemailer versions. Upgrade to current patched versions and re-audit before any re-enable decision.
- Tooling is inconsistent: `package-lock.json` exists, builds have been run with pnpm, but there is no `pnpm-lock.yaml`. Pick one package manager and enforce its frozen lockfile in CI.
- Documentation says Next.js 14 although `package.json` uses Next.js 16, references a deleted `vercel.json`, and gives setup directions that no longer mention the sending kill switch.
- The README declares MIT, but there is no standalone `LICENSE` file.

### Current capability verdict

| Area           | Today                   | Required before public sending                                       |
| -------------- | ----------------------- | -------------------------------------------------------------------- |
| Composer       | Attractive prototype    | Safe block editor, autosave, brand system, tests                     |
| Identity       | None                    | User auth, organizations, roles, MFA options                         |
| Contacts       | Ephemeral arrays        | Lists, fields, consent ledger, segments, suppression                 |
| Sending        | Synchronous shared SMTP | Durable queue, provider API, idempotency, retries                    |
| Deliverability | None                    | Domain verification, SPF/DKIM/DMARC guidance, event handling         |
| Compliance     | None                    | Unsubscribe, address/footer, consent, export/delete, legal documents |
| Analytics      | Toast message           | Event pipeline, campaign metrics, conversion reporting               |
| Operations     | None                    | Monitoring, support console, incident response, backups              |
| Revenue        | None                    | Plans, metering, billing, invoices, entitlements                     |

## 4. Competitive position

Large incumbents already combine editors, contacts, automations, landing pages, analytics, integrations, and teams. Competing on “send many emails” is not defensible. Competing on the largest feature checklist is also unrealistic.

### Recommended wedge

> **The easiest way for a real business team to send professional, permission-based campaigns without becoming an email-deliverability expert.**

The moat should be a guided **Trust-to-Send workflow**:

- Verify the business and sender domain.
- Explain every DNS step in plain language and automatically recheck it.
- Import contacts with field mapping, deduplication, consent-source capture, and risk feedback.
- Build on-brand content from safe reusable blocks.
- Run a preflight that checks missing unsubscribe/address, broken links, risky content, accessibility, mobile rendering, audience health, domain authentication, quota, and approval status.
- Show a human-readable send forecast: eligible, suppressed, duplicates, invalid, and estimated cost.
- Require an explicit final confirmation or approver.
- Monitor bounces and complaints automatically, stop harmful sends, and explain recovery.
- Turn analytics into recommended actions rather than a wall of charts.

This makes safety part of ease-of-use. It benefits beginners while giving managers governance.

### Competitor lesson, not a cloning list

| Category                     | Market expectation                                        | Opportunity for the Product                                                                         |
| ---------------------------- | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Mailchimp/Brevo/MailerLite   | Broad suites, templates, automations, forms, segmentation | Be substantially easier and more transparent for campaign execution                                 |
| SendGrid/SES/Resend/Postmark | Strong delivery infrastructure and APIs                   | Use infrastructure providers; do not rebuild an SMTP network first                                  |
| Cold-outreach tools          | Sequences, inbox rotation, lead scraping                  | Explicitly avoid this reputation and compliance profile at launch                                   |
| Existing Mailblast           | Low-cost campaigns through customer-owned SES             | Differentiate through guided compliance, collaborative workflow, and accessible UX after rebranding |

## 5. Users and jobs to be done

### Primary personas

1. **Owner-operator:** needs a promotion, announcement, or newsletter sent today; wants guidance and predictable cost.
2. **Marketing generalist:** imports lists, builds campaigns, schedules sends, segments audiences, and reports results.
3. **Sales/account employee:** sends approved updates or event invitations to opted-in leads and customers using governed templates.
4. **Operations/HR communicator:** sends internal or customer service announcements, with delivery evidence and no marketing tracking when inappropriate.
5. **Manager/approver:** protects brand and compliance, reviews content, controls spend, and audits activity.
6. **Agency operator (post-MVP):** switches between clients, manages separate brands/domains, invites client approvers, and exports reports.
7. **Developer (later):** sends transactional messages through an API, consumes signed webhooks, and manages templates safely.

### Core jobs

- “Help me reach the correct people without leaking addresses or emailing someone who opted out.”
- “Make my email look professional on phones without requiring HTML knowledge.”
- “Let my manager approve it without screenshots and message chains.”
- “Tell me whether it arrived and what I should improve next.”
- “Keep our brand, lists, and legal footer consistent across employees.”
- “Let me move my data in and out without lock-in.”

## 6. Product scope

### MVP: campaign product

The MVP must contain the complete safe loop, not scattered impressive features.

#### Account and workspace

- Email/passwordless and major identity-provider login.
- Verified email, session management, recovery, suspicious-login alerts, and optional MFA.
- Organization/workspace creation with owner, admin, approver, editor, analyst, and billing roles.
- Invitations, membership removal, least-privilege permissions, and audit log.
- Personal and organization profile, locale, timezone, currency, and default physical address.

#### Sender onboarding

- Custom sending-domain wizard with DNS records, polling, explanations, and troubleshooting.
- SPF/DKIM status, DMARC guidance, return-path/custom MAIL FROM, and From-address verification.
- No arbitrary Gmail/Yahoo From addresses for bulk campaigns.
- Sandbox mode until email, business, domain, and acceptable-use checks pass.
- Send-volume ramp guidance for new domains rather than instant high volume.

#### Contacts and consent

- CSV/XLSX import with preview, field mapping, normalization, deduplication, row-level errors, and resumable processing.
- Contacts, lists, tags, custom fields, saved segments, and import history.
- Consent ledger recording source, purpose/topic, status, timestamp, policy version, IP/source evidence where appropriate, and importer attestation.
- Global-per-workspace suppression for unsubscribe, complaint, hard bounce, manual block, and legal request.
- Never bill suppressed/unsubscribed contacts as active marketing contacts.
- Export, correction, deletion/anonymization, retention settings, and duplicate merge.
- Public signup forms and double opt-in after the core campaign loop is stable.

#### Campaign creation

- Draft, scheduled, sending, paused, completed, cancelled, and failed states.
- Block-based responsive email editor; retain an advanced sanitized-HTML mode behind an explicit permission.
- Subject, preheader, From name/address, reply-to, campaign type, topic, audience, and UTM controls.
- Brand kit: logo, colors, fonts with email-safe fallbacks, social links, address, and reusable footer.
- Personalized variables with defined fallback values and a missing-data preview.
- High-quality use-case templates: newsletter, promotion, event, product update, customer education, nonprofit appeal, internal announcement, and sales follow-up.
- Autosave, version history, duplicate campaign, send test, desktop/mobile preview, dark-mode preview, and plain-text fallback.
- Broken-link checking, alt-text checks, color contrast hints, image sizing, payload size, and spam-risk guidance.
- Mandatory unsubscribe and legal footer for marketing campaigns; immutable protected blocks where policy requires them.
- Schedule in workspace timezone and show the equivalent absolute time before confirmation.

#### Review and approval

- Preflight produces blocking failures, warnings, and informational suggestions.
- Audience count is computed server-side from a frozen campaign snapshot.
- Review screen shows sample personalized recipients, exclusions, sender identity, estimated send count/cost, and applicable tracking.
- Optional or required approval policy by workspace, audience size, or campaign type.
- Two-step confirmation for large sends; prevent accidental double submission with idempotency keys.
- Emergency pause before queued messages are exhausted, with a clear explanation of what can and cannot be recalled.

#### Delivery and reporting

- One logical delivery per recipient. Never expose the audience in `To`, `CC`, or `BCC` headers.
- Durable asynchronous queue with per-tenant rate and concurrency limits.
- Delivery provider events for accepted, delivered, delayed, soft bounce, hard bounce, complaint, unsubscribe, open, and click.
- Automatic suppression before every send and immediately after hard-bounce/complaint events.
- Campaign dashboard with sent, accepted, delivered, bounced, complained, unsubscribed, unique clicks, and conversions.
- Define every metric. Do not describe provider acceptance as delivery.
- Treat opens as directional because privacy protections and image blocking make them unreliable.
- Exportable recipient-level report with strict permissions and audit logging.

### Post-MVP growth capabilities

- Visual automations: welcome, lead nurture, onboarding, renewal, birthday, re-engagement, and abandoned process.
- Conditional branches, delays, goal exits, frequency caps, quiet hours, and timezone delivery.
- Forms, preference center, landing pages, webhooks, and public API.
- A/B subject/from/content tests with minimum-sample guidance and automatic winner rules.
- Approval comments, content locking, shared blocks, campaign calendar, and workload views.
- Agency client workspaces, white-label reports, client approvals, and consolidated billing.
- Integrations in priority order based on discovery: Zapier/Make, HubSpot, Shopify, WooCommerce, Salesforce, then data warehouse/export connectors.
- Transactional email as a distinct stream with separate templates, reputation controls, permissions, metrics, and SLA.
- Regional data residency and enterprise SSO/SCIM only after customer demand justifies the operational burden.

### AI that genuinely helps

AI should shorten work while leaving users accountable:

- Draft from campaign goal, audience, offer, and brand voice.
- Produce subject/preheader variants and explain their differences.
- Rewrite for clarity, reading level, tone, length, and locale.
- Generate plain text and useful image alt text.
- Translate with a review workflow; never silently auto-send translations.
- Detect unsupported claims, missing variables, suspicious links, and likely accessibility problems.
- Summarize results and recommend one or two evidence-based next actions.

Do not train on customer content by default. Clearly identify the model provider, retention behavior, and whether data leaves the selected region. Provide an organization-level off switch.

## 7. Compliance and trust by design

This is a product-design requirement, not a footer disclaimer. Engage qualified counsel in each launch region; the following is an engineering baseline, not legal advice.

### Sending rules enforced by the product

- Require the sender's accurate identity and valid physical address for commercial campaigns.
- Require a visible unsubscribe link and RFC 8058 one-click unsubscribe headers for marketing/subscribed messages.
- Apply unsubscribe synchronously and permanently to the appropriate workspace/topic. Never require login.
- Store consent or other claimed lawful basis and proof source; block imports where the user cannot attest to permission.
- Ban purchased, scraped, harvested, or third-party lists in the Acceptable Use Policy and onboarding.
- Maintain suppression records even when the main contact is deleted, using the minimum pseudonymized identifier required to avoid re-mailing.
- Provide topic preferences without weakening a global unsubscribe.
- Separate marketing and transactional traffic, templates, suppression semantics, and reputation.
- Provide a campaign-type classifier and explain when mixed promotional content can turn an operational message into marketing.

### Regional readiness

- **United States:** CAN-SPAM applies to commercial messages, including B2B, and requires accurate headers, non-deceptive subjects, an address, and opt-out handling.
- **EU/EEA and UK:** implement controller/processor roles, DPA, lawful-basis fields, data-subject workflows, retention, subprocessors, and cross-border transfer safeguards. Electronic marketing rules vary by recipient type and country.
- **Canada:** design for proof of express/implied consent and its expiry context; action unsubscribe requests within the applicable deadline.
- **Australia:** require consent evidence, sender identification, and a functional no-login unsubscribe workflow.
- Expand with counsel-reviewed policy packs for later markets rather than claiming universal compliance from one checkbox.

### Legal and trust center deliverables

- Terms of Service, Privacy Notice, Acceptable Use/Anti-Spam Policy, Cookie Notice, DPA, SCC addendum where relevant, subprocessor list, security page, law-enforcement request policy, and abuse-report channel.
- Product records the policy version accepted by each organization.
- Public status page and incident-history policy.
- Data inventory, records of processing, retention schedule, deletion procedure, breach-response plan, and vendor reviews.

## 8. Deliverability is the product

Google requires SPF or DKIM for all senders and SPF, DKIM, DMARC, aligned identities, low spam rates, and one-click unsubscribe for qualifying bulk senders. Yahoo likewise expects authentication and functioning one-click unsubscribe. Therefore:

- Use an email delivery provider API rather than personal Gmail SMTP.
- Start with Amazon SES as the likely economic base, behind a provider interface. Keep the ability to add a second provider for risk management, not arbitrary per-message failover that damages reputation.
- Use verified domains, per-tenant configuration/metadata, custom tracking domains, and separate marketing versus transactional subdomains.
- Ingest signed provider events through an idempotent webhook pipeline.
- Track rolling bounce, complaint, unsubscribe, and engagement signals by tenant/domain/provider stream.
- Automatically slow, pause, or quarantine risky tenants and campaigns.
- Provide warming guidance and conservative initial quotas. Dedicated IPs are for demonstrated stable volume, not a premium vanity feature.
- Run pre-send address validation selectively; it does not replace consent.
- Maintain seed-account rendering/inbox tests for internal quality, but never promise a guaranteed inbox placement percentage.
- Publish clear deliverability definitions and an appeal process.

## 9. Abuse prevention

Every public sender is an abuse target. Controls must exist before self-service sending:

- Email and domain verification, CAPTCHA/bot defense, disposable-address screening, and risk-based business verification.
- Card verification or controlled trial limits; a generous anonymous/free sending allowance will be exploited.
- New-account sandbox restricted to verified internal recipients until approval.
- Per-user, tenant, IP, domain, endpoint, queue, daily-send, and recipient-growth limits.
- Import risk scoring: list age/source, bounce predictions, role accounts, suspicious domains, duplicate rate, and sudden volume changes.
- Content and URL checks for phishing, malware, impersonation, prohibited goods, and link shorteners.
- Block shared credentials, From spoofing, and unrelated redirect domains.
- Automated complaint/bounce thresholds, circuit breakers, and manual review queues.
- Abuse desk with evidence preservation, tenant suspension, appeal, and provider/authority response runbooks.
- Do not expose precise anti-abuse thresholds that make evasion easier.

## 10. Target architecture

### Recommended shape

```text
Browser / API client
        |
  CDN + WAF + rate limits
        |
 Next.js web/API (stateless)
        |
  Auth + policy layer -------- Billing/entitlements
        |
 PostgreSQL + tenant RLS ----- Object storage (imports/assets/exports)
        |
 Outbox -> durable queue -> worker fleet -> provider adapter -> Amazon SES
                              |                         |
                              |                 recipient mailbox
                              |
 Webhook/event ingest <- SES events/SNS
        |
 suppression + metrics + audit + alerts
```

### Technology choices

- Keep Next.js and TypeScript for the web product, but upgrade to patched supported releases.
- Remove the Python web send handler. Maintain one backend implementation and one set of schemas.
- Move the CLI to a separate developer package later or retire it; it must never bypass platform consent and suppression controls.
- PostgreSQL for transactional product data; enforce organization scope in every query and add row-level security as defense in depth.
- A managed Redis/queue or cloud-native queue for scheduling and delivery jobs. Use dead-letter queues and replay tooling.
- Object storage with short-lived signed URLs, malware scanning, tenant prefixes, and lifecycle policies.
- SES API v2 for delivery; KMS-backed secrets. Never store customer SMTP passwords unless a validated enterprise need emerges.
- Stripe or a region-appropriate merchant-of-record decision after tax/legal analysis; drive all access through server-side entitlements.
- OpenTelemetry-compatible traces, structured logs, metrics, error tracking, synthetic checks, and a status page.

### Core data model

At minimum:

- `users`, `sessions`, `organizations`, `memberships`, `roles`, `invitations`
- `brands`, `sender_domains`, `sender_identities`, `dns_checks`
- `contacts`, `contact_identities`, `custom_fields`, `lists`, `segments`, `segment_memberships`
- `consent_events`, `suppression_entries`, `imports`, `import_rows`
- `templates`, `template_versions`, `assets`, `content_blocks`
- `campaigns`, `campaign_versions`, `audience_snapshots`, `approvals`, `schedules`
- `deliveries`, `delivery_attempts`, `provider_events`, `links`, `tracking_events`
- `automations`, `automation_versions`, `automation_enrollments` later
- `billing_customers`, `plans`, `plan_versions`, `prices`, `subscriptions`, `subscription_events`
- `entitlements`, `entitlement_overrides`, `contract_entitlements`, `organization_config_versions`
- `usage_ledger`, `usage_rollups`, `invoices`, `credits`, `coupons`, `admin_actions`
- `api_keys`, `webhook_endpoints`, `webhook_deliveries`, `audit_events`

Every tenant-owned record needs an enforceable organization relationship. Queue messages carry server-established tenant context, scoped idempotency keys, and immutable campaign/version identifiers.

### Send state machine

```text
draft -> review -> approved -> scheduled -> audience_frozen -> queued
      -> sending -> completed
                 -> paused -> resumed
                 -> failed/cancelled

per recipient:
eligible -> queued -> submitted -> delivered
                              -> deferred -> retry -> delivered/failed
                              -> hard_bounce/complaint -> suppressed
                              -> unsubscribed -> suppressed
```

Use a transactional outbox so campaign state and queued work cannot diverge. Delivery jobs must be idempotent. Retries use bounded exponential backoff and classify permanent versus transient provider failures. A campaign cancellation stops unsent work but never claims to recall submitted mail.

## 11. Security architecture

- Threat-model authentication, imports, HTML/media handling, tenant boundaries, queue messages, webhooks, tracking links, exports, billing, and support impersonation.
- Server-derived tenant context; never trust a client-supplied organization ID by itself.
- Strong authorization tests for every object type, including support/admin paths.
- Encrypt in transit and at rest; use managed key services, rotation, least-privilege service identities, and separated environments/accounts.
- Hash high-entropy API keys, show them once, scope them, expire/revoke them, and log use.
- CSP, HSTS, secure cookies, CSRF protection where applicable, origin checks, safe headers, dependency scanning, secret scanning, SAST, and container/IaC scanning.
- Sanitize saved HTML with an allowlist, rewrite unsafe URLs, reject scripts/forms/iframes, and preview inside a sandboxed separate origin.
- Validate upload type by content, cap size/rows, scan files, and prevent spreadsheet formula injection in exports.
- Sign and timestamp public unsubscribe/tracking tokens without exposing raw contact IDs.
- Verify webhook signatures, tolerate duplicates/out-of-order events, and prevent replay.
- Redact message content, addresses, credentials, and tokens from normal logs.
- Test backup restoration and tenant-specific recovery. Define RPO/RTO before making contractual claims.
- Commission an independent penetration test before general availability and after major architecture changes.

## 12. Accessibility and worldwide usability

- Treat WCAG 2.2 AA as an acceptance criterion, with automated checks plus keyboard and screen-reader manual testing.
- Visible focus, semantic labels/errors, sufficient contrast, 44px touch targets where practical, reduced-motion support, no color-only status, and no hover-only actions.
- Never disable a button without adjacent explanation and a route to resolution.
- Autosave drafts and preserve work after session expiry or network loss.
- Internationalize UI strings from the start; do not hard-code English inside components.
- Support locale-aware dates, numbers, timezones, names, and addresses. Always show scheduled-send timezone.
- Architect for RTL before Arabic/Urdu launch; test layout mirroring rather than relying on automated translation.
- Provide plain-language onboarding, inline examples, short videos with captions/transcripts, searchable help, and contextual support.
- Optimize for low-bandwidth/mobile use: compressed assets, resumable imports, saved drafts, and clear background-job progress.
- Start support in English, then add languages based on paying-customer demand and the ability to support them responsibly.

## 13. Packaging and monetization

Pricing below is a discovery hypothesis, not a promise. Test willingness to pay with interviews and a pricing page before building every tier.

### Pricing principle

Use **active marketable contacts plus included monthly sends**, with clear overages and a usage forecast. Do not count unsubscribed/suppressed contacts as billable active contacts. Offer prepaid credits for infrequent senders later. This is easier to understand than hidden auto-upgrades and creates healthy margins over provider costs.

### Candidate plans

| Plan     | Hypothesis | Best for                 | Key limits/features                                                       |
| -------- | ---------: | ------------------------ | ------------------------------------------------------------------------- |
| Sandbox  |         $0 | Evaluation               | Verified self/test recipients only, branded, no bulk public sending       |
| Starter  |  $19/month | Solo/very small business | 2,000 active contacts, 20,000 sends, 1 seat, core templates/reports       |
| Growth   |  $59/month | Small teams              | 10,000 contacts, 100,000 sends, 5 seats, segments, approvals, automations |
| Pro      | $149/month | Larger teams/agencies    | 50,000 contacts, 500,000 sends, 15 seats, client workspaces, API/webhooks |
| Business |     Custom | High volume/regulation   | Contract/SLA, SSO, regional options, dedicated reputation/support         |

Validate gross margin at p50 and p95 usage, including provider email and bandwidth, database/events, worker time, support, payment fees, fraud, taxes, refunds, and observability—not only SES price. Amazon SES currently publishes low per-thousand delivery pricing, but application/support/compliance costs will dominate early-stage economics.

### Revenue expansion

- Extra active-contact/send blocks with advance alerts and hard budget controls.
- Additional agency workspaces/seats.
- Deliverability review and managed migration services.
- Premium template/brand setup service.
- Dedicated IP/reputation features only for qualified volume.
- Annual plans after retention is proven; nonprofit discounts can support impact and acquisition.

Do not sell “unlimited sends.” It invites abuse and creates unpredictable economics.

### Subscription business model

This must be designed as a subscription SaaS from the first database migration. In product language, distinguish **paying customers and billing subscriptions** from **email contacts/subscribers** so support messages, metrics, and code never confuse the two.

The billing design should support:

- Monthly and annual recurring plans, optional trials, plan-specific contact/send/seat allowances, add-ons, coupons, credits, and controlled overages.
- Plan versioning. Existing customers stay on the commercial terms they purchased until explicitly migrated; changing a public price must not silently rewrite historical subscriptions.
- A central entitlement service that converts plan plus add-ons plus owner-approved overrides into capabilities and limits. Feature access must be enforced on the server, workers, queues, imports, and API—not only by hiding UI controls.
- An append-only usage ledger for billable events such as active contacts, accepted delivery attempts, seats, validation usage, storage, and premium operations. Aggregate from the ledger; never make a mutable dashboard counter the financial source of truth.
- Real-time usage meters and warnings at 50%, 80%, 90%, and 100%, plus a projected bill before overages. Customers should be able to set a hard spend cap where operationally possible.
- Upgrade, downgrade, add-on, renewal, cancellation, reactivation, trial conversion, payment failure, refund, credit, and disputed-payment workflows.
- Explicit proration rules shown before confirmation. Downgrades normally apply at renewal; upgrades can apply immediately after successful payment.
- A customer billing portal for payment method, invoice/tax receipt, subscription, plan change, and cancellation management. Cancellation should be easy and should explain data retention and export options.
- Grace-period and dunning rules that do not destroy customer work. A past-due account can lose new sending after a defined grace period while retaining read/export access; canceled data follows the published retention policy.
- Idempotent, signature-verified payment webhooks with replay, reconciliation, and dead-letter handling. Browser success redirects never grant access by themselves.
- Tax ID capture, invoice numbering, currency handling, refunds, revenue recognition inputs, and sales-tax/VAT/GST support appropriate to the seller's legal entity and customer locations.

Choose between a payment service provider and a merchant of record only after confirming availability for the founder's country, settlement currencies, tax responsibility, supported customer countries, fees, reserves, dispute handling, and payout reliability. Stripe Billing is a reasonable implementation candidate where available, but the Product's internal plan, entitlement, and usage model must remain provider-independent.

### Founder control plane

The founder needs a separate internal operations console. It is not the normal customer dashboard with an “admin” button. It should allow authorized operators to:

- Create, version, publish, archive, and compare plans and prices.
- Configure entitlements, included usage, overage behavior, trials, coupons, promotional credits, grandfathering, and region/currency availability.
- Search customer organizations and view subscription, invoice, usage, quota, sender-domain, reputation, risk, and support status.
- Apply a time-bounded entitlement or quota override with a required reason, approver, expiry, and audit record.
- Comp, extend, upgrade, downgrade, pause, suspend, reactivate, or schedule cancellation for an account subject to explicit permission and payment-provider reconciliation.
- Issue credits/refunds through a two-step confirmation and role threshold; never edit financial history directly.
- Pause sending globally, by region, provider, tenant, domain, campaign type, or risk class through tested kill switches.
- Configure feature flags and staged rollouts by plan, cohort, tenant, region, or percentage with an immediate rollback.
- Review abuse cases, payment failures, webhook failures, queue backlog, provider health, unusual usage, churn reasons, and support history.
- Export finance/reconciliation reports and see MRR, ARR, trial conversion, paid conversion, ARPA, gross margin, voluntary/involuntary churn, GRR, NRR, expansion, refunds, disputes, and failed-payment recovery.

Control must not become unchecked access. Require founder/operator MFA, preferably hardware-backed authentication for privileged roles, separate staff identities, least privilege, IP/device alerts, append-only audit events, approval for high-risk actions, and periodic access review. Customer message content and contact exports should be hidden by default; exceptional access requires a support reason, short-lived elevation, customer-visible or internal audit evidence as appropriate, and automatic expiry.

### Manual provisioning and per-business configuration

The founder control plane must support manually tailoring the Product for a specific business owner or organization without changing code, redeploying, or editing database rows by hand. This is essential for negotiated accounts, pilots, support resolutions, partnerships, and enterprise contracts.

Examples of account-specific configuration include:

- Active-contact, monthly-send, daily-send, import-size, storage, domain, template, automation, API, and seat limits.
- Enabled features such as approvals, advanced segments, custom HTML, API access, webhooks, agency workspaces, SSO, dedicated sending resources, and white-label reports.
- Workspace policies such as mandatory approval above an audience threshold, allowed From domains, required legal-footer fields, test-send requirements, quiet hours, retention period, and export permissions.
- Custom branding, onboarding state, support tier, service-level target, data region, default locale/timezone, and assigned account manager.
- Trial extensions, complimentary months, promotional allowances, grandfathered features, contract start/end dates, and temporary capacity increases.
- Custom pricing, minimum commitments, included usage, negotiated overages, invoicing terms, purchase-order references, and tax treatment.
- Risk controls such as reduced sending speed, sandbox restrictions, manual campaign review, or an account-specific send pause.

Use a deterministic configuration hierarchy:

```text
platform safety rules (never bypassed)
    -> product defaults
    -> versioned plan entitlements
    -> purchased add-ons
    -> signed contract configuration
    -> approved organization override
    -> temporary incident/risk restriction
```

When two values conflict, the system should calculate one **effective configuration** and show its source for every value. Safety restrictions always win. A manual commercial override can increase a quota but can never disable suppression, consent requirements, verified-domain requirements, abuse controls, or tenant security.

Every override needs:

- A typed key selected from a controlled schema, not arbitrary JSON or free-form environment variables.
- Previous value, new value, source, business reason, internal ticket/contract reference, operator, and timestamp.
- Effective start, optional expiry, renewal behavior, and a named owner responsible for review.
- A preview showing the complete before/after effective configuration and billing effect.
- Validation against platform maximums and incompatible combinations.
- Two-person approval for high-risk changes such as very large send limits, dedicated resources, refunds, data-region moves, or disabling an account restriction.
- Automatic expiry alerts and rollback to the next valid configuration layer.
- An append-only audit event and customer-facing record where commercially appropriate.

The owner console should provide actions such as **Grant feature**, **Change quota**, **Extend trial**, **Apply contract**, **Restrict sending**, and **Schedule expiry**. Each action must call the same tested backend service used by automation; it must not execute direct SQL. Emergency database access is a separate break-glass procedure, never the normal way to configure a customer.

Provide an effective-configuration page for support staff and the customer organization owner. It should answer:

- What plan and contract is this business on?
- Which features and limits are active right now?
- Which values came from the plan, add-on, contract, manual override, or risk restriction?
- When will a temporary configuration expire?
- Will the change affect the current invoice, the next invoice, or neither?
- Why is a capability unavailable and what action can resolve it?

Customer business owners should separately receive self-service workspace controls inside the boundaries you grant: invite employees, assign roles, require approvals, manage verified senders, set brand defaults, choose notification preferences, set optional spend caps, and configure campaign policies. They cannot raise their own purchased quotas, activate unpaid features, weaken platform safety rules, or remove audit history.

Manual configuration and billing must stay synchronized but not conflated. A feature or quota override does not automatically charge the customer; the operator must explicitly choose whether it is complimentary, already covered by contract, or billable. Billable changes create a provider-side subscription/invoice update and become effective only under the documented payment rule. Daily reconciliation detects organizations receiving paid entitlements without the matching commercial authorization.

### Subscription lifecycle and access policy

Model lifecycle explicitly rather than using one `is_paid` boolean:

```text
prospect -> trialing -> active -> past_due -> restricted -> canceled
                 |         |          |             |
                 +---------+----------+-----------> reactivated

incomplete/expired and fraud/abuse-suspended are distinct terminal or review states.
```

Stripe, for example, exposes multiple subscription states including incomplete, trialing, active, past due, unpaid, paused, and canceled. Map provider states into a documented internal lifecycle rather than spreading provider-specific checks throughout the application.

Recommended access behavior:

| State           | Compose/view/export                       | New sending                       | Billing action                    |
| --------------- | ----------------------------------------- | --------------------------------- | --------------------------------- |
| Trialing        | Yes, within sandbox/trial entitlements    | Restricted until sender approval  | Add payment method or choose plan |
| Active          | Yes                                       | Yes, within plan/risk/quota       | Upgrade/downgrade/cancel          |
| Past due        | Yes during short grace period             | Warn, then restrict new campaigns | Retry/update payment              |
| Restricted      | View and export                           | No                                | Resolve payment/compliance issue  |
| Canceled        | Read/export during retention window       | No                                | Reactivate or export/delete       |
| Abuse suspended | Limited according to investigation policy | No; queued sends stopped          | Appeal/review only                |

Never delete campaigns or contacts immediately because payment failed. Never allow payment success to bypass an abuse or compliance suspension. Billing eligibility and sending eligibility are separate decisions and both must pass.

### Financial controls and reconciliation

- Treat the payment provider as source of truth for charges, payment methods, invoices, refunds, and disputes; treat the internal ledger as source of truth for product usage and entitlements.
- Reconcile provider subscriptions/invoices against internal records daily and provide an exception queue.
- Store processed webhook event IDs for idempotency and retain raw signed events according to policy.
- Keep immutable effective dates for plan, price, tax, discount, currency, and entitlement changes.
- Require reason codes and notes for manual credits, refunds, comps, and overrides.
- Separate test and live billing environments completely; prevent test products/prices from being referenced in production.
- Alert on send-cost spikes, negative-margin tenants, abnormal coupon use, repeated payment failures, refunds, disputes, and usage-meter gaps.
- Close each month with revenue, tax, processor fees, refunds, credits, bad debt, provider email cost, and deferred annual revenue reconciled for accounting.

## 14. Go-to-market

### Discovery before scale

Conduct at least 30 structured interviews across owners, marketing employees, sales/account staff, nonprofits, and agencies. Ask them to show the last campaign workflow, tools, approval delays, compliance anxiety, reporting needs, and spend. Do not ask whether they “like the idea.” Measure real pain and switching triggers.

Recruit 8–12 design partners with legitimate opted-in audiences. Offer hands-on migration in exchange for weekly feedback and permission to measure outcomes. At least three should be team accounts so collaboration is tested early.

### Launch message

Lead with outcomes and trust:

- “From verified domain to approved campaign in minutes.”
- “Every send checked for audience, brand, and unsubscribe safety.”
- “Clear billing for active contacts—not people who already unsubscribed.”
- “Built for the employee doing the work and the manager accountable for it.”

Avoid “email everyone,” “unlimited,” “blast,” guaranteed inbox claims, and claims of universal legal compliance.

### Acquisition loops

- Excellent domain-authentication and migration guides that solve real search problems.
- Free safe email preflight/render check as a lead generator, with strict anti-abuse boundaries.
- Industry template collections paired with practical playbooks.
- Agency/referral program after onboarding and support quality are stable.
- Integration marketplaces and educational partnerships.
- Customer benchmark reports using aggregated, privacy-safe data only after sufficient scale and consent.

### Sales motion

- Self-serve for Starter/Growth.
- Assisted onboarding for Pro.
- Qualification, security review, and contract for Business.
- Publish transparent public pricing until enterprise requirements genuinely vary.
- Give customers a self-service subscription portal while reserving negotiated contracts, invoicing, and purchase orders for qualified Business accounts.

## 15. Delivery roadmap

Estimates assume a focused team of 4–6 experienced people: product/founder, two full-stack engineers, one backend/platform engineer, and part-time design, deliverability, security, and legal support. A solo founder should expect roughly 9–15 months for a responsible GA, not a few weeks.

### Phase 0 — contain risk and validate direction (weeks 0–2)

- Keep sending disabled and revoke/replace the Gmail app password.
- Patch audited dependencies; standardize package manager and CI lockfile.
- Remove or lock down duplicate Python web sending path and wildcard CORS.
- Update all misleading product/README copy.
- Rebrand and begin trademark/domain clearance.
- Interview target users and recruit design partners.
- Write product principles, anti-spam stance, initial threat model, and data inventory.

**Exit gate:** no public credential exposure; clean production dependency audit or explicitly accepted documented exceptions; tested build; validated target problem; viable name candidates.

### Phase 1 — SaaS foundation (weeks 3–7)

- Establish environments, CI/CD, preview apps, migrations, backups, monitoring, and infrastructure as code.
- Implement auth, organizations, roles, invitations, audit log, PostgreSQL tenant model/RLS, and base settings.
- Implement the versioned plan catalog, entitlement middleware, configuration-precedence engine, usage-ledger foundation, and protected founder control-plane shell.
- Add typed, effective-dated organization overrides with previews, expiry, rollback, reason codes, and immutable audit records; prohibit routine direct-database configuration.
- Add secure error handling, security headers, structured validation, rate limiting, and test harness.
- Implement brand profile and persistent autosaved drafts.
- Create legal-document drafts and vendor/subprocessor inventory.

**Exit gate:** automated tenant-isolation suite passes; restore drill passes; users can collaborate on persisted drafts without sending.

### Phase 2 — safe campaign loop (weeks 8–15)

- Sender-domain verification and SES integration.
- Contacts/imports, fields, lists, consent ledger, suppression, and export/delete.
- Safe block editor, templates, variables, tests/previews, versioning, and preflight.
- Campaign state machine, approval, audience snapshots, queue/workers, idempotency, throttling, and scheduling.
- Signed event ingest, bounce/complaint automation, RFC 8058 unsubscribe, and preference endpoint.
- Core campaign reporting and internal support console.

**Exit gate:** a design partner can onboard its own domain/list, send safely, unsubscribe, and see delivery outcomes end to end; failure/retry/cancel scenarios are proven.

### Phase 3 — controlled private beta and revenue (weeks 16–21)

- Payment-provider checkout/portal, signed billing webhooks, metering aggregation, invoices, taxes, budget alerts, dunning, refunds, and daily reconciliation.
- Complete founder controls for plans, pricing, custom business contracts, per-organization configuration, limits, overrides, account state, feature rollout, finance metrics, and global/tenant sending kill switches.
- Add approval workflows and reconciliation for high-risk, billable, complimentary, and expiring manual account changes.
- Abuse risk scoring, sandbox/approval queues, automated circuit breakers, and case workflow.
- Accessibility remediation, responsive testing, product analytics, onboarding checklist, and help center.
- DPA/AUP/privacy/terms, status page, support process, incident exercises, and independent penetration test.
- Migrate 8–12 design partners and observe real campaigns.

**Exit gate:** 30 days without critical security/privacy incident; support and abuse queues are manageable; billing reconciles with usage; beta customers repeatedly send and at least five pay.

### Phase 4 — public GA (weeks 22–28)

- Self-service onboarding with conservative quotas and risk-based review.
- Migration tooling, polished reports, templates, referrals, and lifecycle messaging.
- Load/capacity testing, provider quota headroom, on-call ownership, public runbooks/status.
- Launch content and narrow paid acquisition tests.

**Exit gate:** meet the launch scorecard below for four consecutive weeks. Roll out by cohort, not one worldwide switch.

### Phase 5 — expansion (months 7–12)

- Automations, forms/preference center, A/B testing, integrations, API/webhooks.
- Agency workspaces and client approvals.
- Second language/region based on paid demand.
- Transactional stream only after marketing-stream operations are stable.
- SOC 2 readiness when enterprise pipeline justifies it; do not use certification work as a substitute for basic security.

## 16. Quality and launch scorecard

### User value

- Median time from signup to verified-domain/test-send under 15 minutes for customers with DNS access.
- At least 60% of approved beta workspaces complete a first campaign within 7 days.
- At least 40% of activated workspaces send another campaign within 30 days.
- Campaign creation task completion above 90% in moderated usability testing.

### Reliability

- 99.9% monthly availability target for campaign management at GA, with a separately defined delivery-processing objective.
- 99.99% of eligible delivery jobs neither lost nor duplicated.
- p95 API latency targets per endpoint class; queue-delay targets shown transparently.
- Restore tests meet defined RPO/RTO; event reconciliation catches provider webhook loss.

### Deliverability and abuse

- Hard-bounce target below 2% per campaign; warn or block based on risk and history.
- Complaint target below 0.1%, with stricter internal early-warning thresholds.
- 100% of marketing deliveries have valid unsubscribe handling and required identity/footer.
- 100% suppression enforcement in integration and replay tests.
- Domain-authentication status verified before production sends.

### Security/privacy/accessibility

- Zero open critical/high dependency findings without a documented owner, mitigation, and deadline.
- Zero known cross-tenant authorization failures; comprehensive object-level tests pass.
- No unresolved critical/high penetration-test findings.
- Data export/delete and incident tabletop exercises pass.
- WCAG 2.2 AA audit has no critical blockers; keyboard and screen-reader core journeys pass.

### Business

- Gross margin modeled and measured by plan.
- Support volume per active workspace and median resolution time are sustainable.
- MRR/ARR, trial and paid conversion, ARPA, CAC payback, gross margin, GRR, NRR, voluntary/involuntary churn, expansion, refund, fraud, dispute, and failed-payment-recovery targets are defined after beta baselines.
- Billing provider totals, internal subscriptions, invoices, entitlements, and usage reconcile daily with no unexplained material variance.
- North-star metric: **weekly workspaces completing a compliant campaign that meets their delivery-health threshold**—not raw emails sent.

## 17. Testing strategy

- Unit tests for address normalization, personalization, consent/suppression decisions, quotas, state machines, billing math, and signature/token verification.
- Property/fuzz tests for parsers, CSV imports, HTML sanitization, and provider-event ordering.
- Database tests proving every tenant-owned object rejects cross-tenant reads/writes.
- Provider contract tests and a local fake provider for deterministic failure modes.
- End-to-end tests for signup, domain setup, import, compose, approval, schedule, send, unsubscribe, bounce, report, export, and deletion.
- Accessibility automation plus manual assistive-technology testing.
- Load tests for imports, audience snapshots, send fan-out, tracking redirects, webhooks, and analytics aggregation.
- Chaos/recovery tests: duplicate/out-of-order webhooks, queue outage, provider throttling, partial region failure, expired credentials, and replay.
- Rendering tests across major clients and mobile sizes; visual regression for core templates.
- Security tests in CI and periodic independent assessment.

## 18. Team and operating model

Before GA, assign named owners for:

- Product and customer discovery.
- Application and tenant security.
- Delivery infrastructure and deliverability.
- Privacy/compliance and data requests.
- Abuse review and provider relationships.
- Billing/reconciliation.
- Customer support and incident communication.

The founder should personally observe onboarding and support during beta. The earliest moat will come from learning why legitimate users fail to send safely—not from adding more editor buttons.

Indicative early operating budget must include infrastructure, email provider, database/queue/storage, monitoring, billing/fraud, domain/security services, legal/privacy advice, penetration testing, support, design, and contingency. Build a 12-month cash model with low/base/high customer and send-volume cases before committing to free-tier allowances.

## 19. What not to build first

- A proprietary SMTP network or custom mail-transfer agent.
- “Unlimited” plans.
- Cold-lead scraping, inbox rotation, or evasion features.
- A huge template marketplace before the core templates convert.
- Multi-channel SMS/WhatsApp merely to look comprehensive.
- Enterprise SSO, dedicated IPs, or many regions without signed demand.
- AI auto-send or unsupervised campaign generation.
- Vanity dashboards without decision support.
- A second backend language for the same product path.

## 20. First 30 days: exact sequence

1. Revoke the current Gmail app password and confirm all deployments have sending disabled.
2. Rename after preliminary legal/domain clearance; remove “unlimited” and “blast” messaging.
3. Upgrade Next.js/Nodemailer and all transitive dependencies; choose npm or pnpm and enforce one lockfile.
4. Remove the Python public endpoint and retain a single typed API surface.
5. Write the anti-spam/AUP principles and decide the initial countries where customers may be accepted.
6. Interview 30 users and score each segment on pain, frequency, willingness to pay, reachable market, compliance risk, and support burden.
7. Select 8–12 design partners with provable permission-based audiences.
8. Create clickable onboarding, contacts, editor, review, and report prototypes; usability-test them before full implementation.
9. Decide payment-provider versus merchant-of-record strategy, then document subscription lifecycle, plan versioning, entitlements, metering, tax ownership, dunning, and founder-control permissions.
10. Produce the architecture decision records for authentication, tenant isolation, delivery provider, queue, data regions, billing, and HTML editor.
11. Build Phase 1 only after the target segment and value proposition survive discovery.

## 21. Go/no-go principles

Go forward if design partners repeatedly need the workflow, trust the consent-first approach, can complete onboarding, and will pay enough to support safe operations.

Narrow or pivot if the only enthusiastic users want purchased-list cold outreach, if domain setup remains unacceptable despite guided onboarding, or if acquisition cost exceeds realistic lifetime value.

Do not re-enable public sending until the safe campaign loop—including identity, permission evidence, suppression, unsubscribe, durable delivery, and complaint handling—works end to end. A disabled prototype is safer and more credible than a public sender that can harm customers, recipients, the owner, and the product's domain reputation.

## 22. Evidence and standards reviewed

- [Gmail sender guidelines](https://support.google.com/mail/answer/81126?hl=en)
- [Yahoo sender best practices](https://senders.yahooinc.com/best-practices/)
- [RFC 8058: one-click unsubscribe](https://www.rfc-editor.org/rfc/rfc8058.html)
- [FTC CAN-SPAM compliance guide](https://www.ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business)
- [UK ICO electronic marketing guidance](https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guidance-on-direct-marketing-using-electronic-mail/how-do-we-comply-with-the-pecr-electronic-mail-marketing-rules/)
- [Canada CASL consent guidance](https://ised-isde.canada.ca/site/canada-anti-spam-legislation/en/getting-consent-send-email)
- [Australia unsubscribe rules](https://www.acma.gov.au/sites/default/files/2024-05/Fact%20sheet%20-%20email%20and%20SMS%20unsubscribe%20rules.pdf)
- [European Commission international transfer rules](https://commission.europa.eu/law/law-topic/data-protection/international-dimension-data-protection/rules-international-data-transfers_en)
- [W3C WCAG 2.2](https://www.w3.org/TR/WCAG22/)
- [OWASP multi-tenant security guidance](https://cheatsheetseries.owasp.org/cheatsheets/Multi_Tenant_Security_Cheat_Sheet.html)
- [Amazon SES event publishing](https://docs.aws.amazon.com/ses/latest/dg/monitor-sending-using-event-publishing-setup.html)
- [Amazon SES pricing](https://aws.amazon.com/ses/pricing/)
- [Stripe subscription lifecycle](https://docs.stripe.com/api/subscriptions/object)
- [Stripe events and customer billing portal](https://docs.stripe.com/api/events)
- [Mailchimp marketing pricing](https://mailchimp.com/pricing/marketing/)
- [Brevo plan overview](https://help.brevo.com/hc/en-us/articles/208589409-About-Brevo-s-pricing-plans)
- [MailerLite feature and pricing comparison](https://www.mailerlite.com/pricing)
- [Existing Mailblast product](https://www.mailblast.io/about)
