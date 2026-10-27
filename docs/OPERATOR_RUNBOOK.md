# Operator runbook

## Daily checks

1. Verify `/api/v1/health/live` and `/api/v1/health/ready`.
2. Inspect failed/retrying jobs and the oldest queued job.
3. Reconcile subscriptions, effective configuration, usage reservations, and expired overrides.
4. Confirm safety controls have the intended scope and expiry.
5. Review security-sensitive audit events and unusual authentication throttling.

## Stop campaign processing

Activate `stop_processing` through the platform control API. A global control requires a different platform owner to approve it. Record a precise reason and expiry. Stop worker processes too when immediate containment is required.

## Compromised account

Suspend membership, revoke sessions, rotate affected secrets, review audit events, identify changes, and notify the organization owner. Platform roles do not silently grant customer-workspace membership.

## Queue recovery

Workers recover locks older than 15 minutes. Retries use bounded exponential delay and become terminal after `max_attempts`. Retry existing jobs; never create a duplicate with a new idempotency key.

## Backup and restore

- Use `pg_dump --format=custom` with an authorized backup/migration identity, never the web role.
- Back up object storage consistently with the database.
- Restore into isolation, apply migrations, compare checksums/counts, then test sign-in, tenant isolation, preflight, unsubscribe, and workers.
- Test restores regularly; an untested backup is not a recovery plan.

## Release gate

Run `npm ci`, `npm run check`, `npm audit`, migration review, secret scanning, tenant-isolation tests, and a backup. Confirm delivery is `disabled` or `capture` and billing is `local` unless WP-09 has separate approval.
