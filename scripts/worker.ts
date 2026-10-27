import { hostname } from "node:os";
import { setTimeout as delay } from "node:timers/promises";
import {
  CaptureDeliveryProvider,
  type DeliveryMessage,
} from "../src/server/delivery/provider";
import { getServerEnvironment } from "../src/server/env";
import {
  claimJobs,
  completeJob,
  failJob,
  recoverStaleJobs,
  type ClaimedJob,
} from "../src/server/jobs/queue";
import { logger } from "../src/server/logger";
import { workerSqlClient } from "../src/server/db/client";

const env = getServerEnvironment();
const once = process.argv.includes("--once");
const workerId = `${hostname()}:${process.pid}`;
let stopping = false;

process.on("SIGINT", () => (stopping = true));
process.on("SIGTERM", () => (stopping = true));

async function handle(job: ClaimedJob): Promise<void> {
  if (job.type === "capture_delivery") {
    const message = job.payload as DeliveryMessage & {
      contactId: string;
      normalizedEmail: string;
    };
    const [campaign] = await workerSqlClient<
      Array<{ status: string; stopped: boolean; suppressed: boolean }>
    >`
      select c.status,
        exists (
          select 1 from system_controls sc
          where sc.enabled = true and sc.deactivated_at is null
            and (sc.expires_at is null or sc.expires_at > now())
            and sc.key = 'stop_processing'
            and (sc.scope_type = 'global' or (sc.scope_type = 'organization' and sc.scope_id = ${message.organizationId}))
        ) as stopped,
        exists (
          select 1 from suppression_entries se
          where se.organization_id = ${message.organizationId}
            and se.normalized_email = ${message.normalizedEmail}
            and se.active = true
        ) as suppressed
      from campaigns c where c.id = ${message.campaignId}
    `;
    if (!campaign) throw new Error("Campaign no longer exists.");
    if (campaign.stopped)
      throw new Error("Campaign processing is stopped by a safety control.");
    if (["canceled", "paused", "failed"].includes(campaign.status)) {
      await workerSqlClient`
        update deliveries set status = 'suppressed', final_reason = ${`campaign_${campaign.status}`}, updated_at = now()
        where id = ${message.deliveryId} and status = 'pending'
      `;
      return;
    }
    await workerSqlClient`
      update campaigns set status = 'processing', started_at = coalesce(started_at, now()), updated_at = now()
      where id = ${message.campaignId} and status = 'scheduled'
    `;
    if (campaign.suppressed) {
      await workerSqlClient`
        update deliveries set status = 'suppressed', final_reason = 'final_suppression_check', updated_at = now()
        where id = ${message.deliveryId} and status = 'pending'
      `;
      await finalizeCampaign(message.campaignId);
      return;
    }
    const result = await new CaptureDeliveryProvider().deliver(message);
    await workerSqlClient.begin(async (sql) => {
      await sql`
        update deliveries
        set status = 'captured', provider_message_id = ${result.providerMessageId},
            captured_storage_key = ${result.storageKey}, updated_at = now()
        where id = ${message.deliveryId} and status = 'pending'
      `;
      await sql`
        insert into delivery_attempts (id, delivery_id, attempt, provider, outcome, metadata, started_at, finished_at)
        values (${`${job.id}:${job.attempts}`}, ${message.deliveryId}, ${job.attempts}, 'capture', 'captured', ${sql.json({ storageKey: result.storageKey })}, now(), now())
      `;
    });
    await finalizeCampaign(message.campaignId);
    return;
  }
  if (
    job.type === "outbox_dispatch" ||
    job.type === "retention_cleanup" ||
    job.type === "reconcile_configuration"
  ) {
    logger.info(
      { jobId: job.id, jobType: job.type },
      "Handled local operational job",
    );
    return;
  }
  throw new Error(`No handler is registered for job type ${job.type}.`);
}

async function finalizeCampaign(campaignId: string): Promise<void> {
  await workerSqlClient`
    update campaigns c
    set status = 'completed', completed_at = now(), updated_at = now()
    where c.id = ${campaignId} and c.status = 'processing'
      and not exists (
        select 1 from deliveries d where d.campaign_id = c.id and d.status = 'pending'
      )
  `;
}

async function main() {
  await recoverStaleJobs();
  do {
    const jobs = await claimJobs(workerId, env.WORKER_BATCH_SIZE);
    for (const job of jobs) {
      try {
        await handle(job);
        await completeJob(job.id);
      } catch (error) {
        logger.error(
          { error, jobId: job.id, jobType: job.type },
          "Worker job failed",
        );
        await failJob(job, error);
      }
    }
    if (once) break;
    if (jobs.length === 0) await delay(env.WORKER_POLL_INTERVAL_MS);
  } while (!stopping);

  await workerSqlClient.end();
  logger.info({ workerId }, "Worker stopped cleanly");
}

main().catch((error) => {
  logger.fatal({ error }, "Worker terminated unexpectedly");
  process.exitCode = 1;
});
