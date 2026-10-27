import { workerSqlClient } from "../src/server/db/client";
import { enqueueJob } from "../src/server/jobs/queue";

async function main() {
  const deliveryId = "smoke_delivery_20261028";
  const jobId = await enqueueJob({
    type: "capture_delivery",
    idempotencyKey: "smoke_job_20261028",
    payload: {
      organizationId: "smoke_org",
      campaignId: "smoke_campaign",
      deliveryId,
      idempotencyKey: "smoke_capture_20261028",
      to: "recipient@example.test",
      from: "sender@example.test",
      subject: "Capture smoke test",
      html: "<p>Captured locally</p>",
      text: "Captured locally",
    },
  });
  console.log(JSON.stringify({ enqueued: true, jobId, deliveryId }));
  await workerSqlClient.end();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
