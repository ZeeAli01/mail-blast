# Security model

## Trust boundaries

- Browser data is untrusted and validated with Zod.
- Protected handlers authenticate and authorize every operation.
- Organization and platform permissions are separate.
- Tenant operations set a transaction-local organization ID; core tables use default-deny PostgreSQL RLS.
- Migration, runtime, and worker database identities are separate.
- Logs redact credentials, cookies, authorization values, and message bodies.

## Product safety

- Real delivery is unavailable; capture mode writes local artifacts only.
- `/api/send-email` always returns 503.
- Consent is append-only, suppression is checked at delivery time, and unsubscribe references are signed and one-time.
- Approval binds to an immutable campaign version.
- Idempotency keys and unique constraints prevent duplicate commands.
- High-risk commercial overrides and global controls require a second owner.

## Production requirements

Production rejects placeholder secrets and local-only database credentials. Deploy behind HTTPS, rotate bootstrap values, restrict database networking, centralize rate limiting, scan uploads, and replace local filesystem storage before processing real customer data.

Report vulnerabilities privately to the repository owner. Never place customer data, credentials, or unsubscribe tokens in a public issue.
