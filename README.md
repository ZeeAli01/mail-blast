# MailBlast — free-first campaign operations

MailBlast is a multi-tenant, subscription-ready campaign product for permission-based email operations. It includes authentication, team roles, isolated workspaces, consent-aware contacts, immutable campaign versions, approval/preflight rules, PostgreSQL jobs, local capture delivery, usage controls, and a founder control plane.

## Safety boundary

- Real outbound email and payment collection are deliberately disabled.
- The public composer and legacy endpoint cannot send email.
- `capture` mode writes local JSON artifacts and never opens a provider connection.
- Billing is local/manual: plans, trials, restrictions, overrides, and previews never charge a card.
- Never add a personal mailbox password or real recipient data to this repository.

Read the normative [implementation blueprint](docs/IMPLEMENTATION_BLUEPRINT.md) and the [product strategy](docs/PRODUCT_STRATEGY_AND_ROADMAP.md) before making product changes.

## Product surfaces

- `/` — non-sending public composer
- `/product` — product landing page
- `/sign-up`, `/sign-in` — locally captured verification/reset flow
- `/dashboard` — authenticated workspace onboarding and operations
- `/platform` — platform-owner control plane
- `/api/v1/*` — versioned application APIs

## Local development

Requirements: Node.js 24+, npm 11+, and Docker Compose or PostgreSQL 16+.

```bash
npm ci
npm run db:migrate
npm run db:seed
npm run dev
```

Copy `.env.example` to `.env.local` before starting. With Docker, run `docker compose up -d postgres`. Without Docker, create the database roles with `scripts/sql/0000_bootstrap_database_roles.sql` and configure the three database URLs.

Run the worker in a second terminal only after choosing `EMAIL_DELIVERY_MODE=capture`:

```bash
npm run worker
```

After sign-up, open the captured verification JSON under `.local/storage/auth/`. Grant the first platform owner exactly once with `npm run bootstrap:owner`, then remove `BOOTSTRAP_OWNER_EMAIL`.

## Quality and operations

```bash
npm run check
npm audit
npm run db:check
npm run worker:once
```

See the [implementation blueprint](docs/IMPLEMENTATION_BLUEPRINT.md), [product strategy](docs/PRODUCT_STRATEGY_AND_ROADMAP.md), [operator runbook](docs/OPERATOR_RUNBOOK.md), and [security model](docs/SECURITY.md). Real providers remain a separately approved WP-09.

## License

MIT. See [LICENSE](LICENSE).
