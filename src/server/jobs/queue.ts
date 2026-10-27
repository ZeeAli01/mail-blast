import { workerSqlClient as sqlClient } from "../db/client";
import { newId } from "../ids";

export type ClaimedJob = {
  id: string;
  organizationId: string | null;
  type: string;
  payload: Record<string, unknown>;
  attempts: number;
  maxAttempts: number;
};

export async function enqueueJob(input: {
  organizationId?: string;
  type: string;
  payload: Record<string, unknown>;
  idempotencyKey: string;
  runAt?: Date;
  priority?: number;
}): Promise<string> {
  const id = newId();
  const rows = await sqlClient<{ id: string }[]>`
    insert into jobs (id, organization_id, type, payload, idempotency_key, run_at, priority)
    values (
      ${id},
      ${input.organizationId ?? null},
      ${input.type},
      ${sqlClient.json(input.payload as never)},
      ${input.idempotencyKey},
      ${input.runAt ?? new Date()},
      ${input.priority ?? 100}
    )
    on conflict (idempotency_key) do update set idempotency_key = excluded.idempotency_key
    returning id
  `;
  return rows[0].id;
}

export async function claimJobs(
  workerId: string,
  limit: number,
): Promise<ClaimedJob[]> {
  const rows = await sqlClient<
    Array<{
      id: string;
      organization_id: string | null;
      type: string;
      payload: Record<string, unknown>;
      attempts: number;
      max_attempts: number;
    }>
  >`
    with claimable as (
      select id
      from jobs
      where status in ('queued', 'retry') and run_at <= now()
      order by priority asc, run_at asc
      for update skip locked
      limit ${limit}
    )
    update jobs
    set status = 'running', locked_at = now(), locked_by = ${workerId}, attempts = attempts + 1
    where id in (select id from claimable)
    returning id, organization_id, type, payload, attempts, max_attempts
  `;
  return rows.map((row) => ({
    id: row.id,
    organizationId: row.organization_id,
    type: row.type,
    payload: row.payload,
    attempts: row.attempts,
    maxAttempts: row.max_attempts,
  }));
}

export async function completeJob(jobId: string): Promise<void> {
  await sqlClient`update jobs set status = 'completed', completed_at = now(), locked_at = null, locked_by = null where id = ${jobId}`;
}

export async function failJob(job: ClaimedJob, error: unknown): Promise<void> {
  const terminal = job.attempts >= job.maxAttempts;
  const delaySeconds = Math.min(3600, 2 ** job.attempts * 5);
  const message =
    error instanceof Error
      ? error.message.slice(0, 2000)
      : "Unknown worker error";
  await sqlClient`
    update jobs
    set status = ${terminal ? "failed" : "retry"}::job_status,
        last_error = ${message},
        run_at = now() + (${delaySeconds} * interval '1 second'),
        locked_at = null,
        locked_by = null
    where id = ${job.id}
  `;
}

export async function recoverStaleJobs(): Promise<number> {
  const rows = await sqlClient<{ id: string }[]>`
    update jobs
    set status = 'retry', locked_at = null, locked_by = null,
        last_error = coalesce(last_error || '; ', '') || 'Recovered stale worker lock'
    where status = 'running' and locked_at < now() - interval '15 minutes'
    returning id
  `;
  return rows.length;
}
