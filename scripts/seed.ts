import { db, sqlClient } from "../src/server/db/client";
import {
  entitlementDefinitions,
  planEntitlements,
  planVersions,
  plans,
  prices,
} from "../src/server/db/schema";

const definitions = [
  ["contacts.max", "integer", "Maximum stored contacts", 100],
  ["team.max_members", "integer", "Maximum active team members", 2],
  ["imports.max_rows", "integer", "Maximum rows in one import", 100],
  [
    "sends.max_campaign_recipients",
    "integer",
    "Maximum eligible recipients per campaign",
    25,
  ],
  [
    "sends.max_monthly_recipients",
    "integer",
    "Maximum monthly captured recipients",
    250,
  ],
  [
    "campaigns.approval_required_above",
    "integer",
    "Audience size requiring approval",
    0,
  ],
  [
    "campaigns.scheduling_enabled",
    "boolean",
    "Allow campaign scheduling",
    true,
  ],
  [
    "campaigns.capture_enabled",
    "boolean",
    "Allow local capture delivery",
    true,
  ],
  ["templates.max", "integer", "Maximum templates", 10],
  ["assets.max_bytes", "integer", "Maximum stored asset bytes", 10_000_000],
  ["retention.days", "integer", "Default retention period", 30],
] as const;

async function main() {
  for (const [key, valueType, description, defaultValue] of definitions) {
    await db
      .insert(entitlementDefinitions)
      .values({ key, valueType, description, defaultValue })
      .onConflictDoNothing();
  }

  const planSeeds = [
    {
      id: "plan_sandbox",
      versionId: "plan_version_sandbox_1",
      code: "sandbox",
      name: "Sandbox",
      description: "Free local evaluation with capture-only delivery.",
      amountMinor: 0,
      values: [100, 2, 100, 25, 250, 0, true, true, 10, 10_000_000, 30],
    },
    {
      id: "plan_starter",
      versionId: "plan_version_starter_1",
      code: "starter",
      name: "Starter",
      description: "For small teams preparing permission-based campaigns.",
      amountMinor: 2900,
      values: [
        10_000,
        5,
        10_000,
        2_000,
        25_000,
        1_000,
        true,
        true,
        100,
        1_000_000_000,
        90,
      ],
    },
    {
      id: "plan_growth",
      versionId: "plan_version_growth_1",
      code: "growth",
      name: "Growth",
      description: "For growing sales and marketing operations.",
      amountMinor: 9900,
      values: [
        100_000,
        25,
        100_000,
        10_000,
        250_000,
        2_000,
        true,
        true,
        1_000,
        10_000_000_000,
        180,
      ],
    },
  ] as const;

  for (const plan of planSeeds) {
    await db
      .insert(plans)
      .values({
        id: plan.id,
        code: plan.code,
        name: plan.name,
        description: plan.description,
      })
      .onConflictDoNothing();
    await db
      .insert(planVersions)
      .values({
        id: plan.versionId,
        planId: plan.id,
        version: 1,
        name: `${plan.name} v1`,
        publishedAt: new Date(),
      })
      .onConflictDoNothing();
    await db
      .insert(prices)
      .values({
        id: `price_${plan.code}_monthly_usd`,
        planVersionId: plan.versionId,
        amountMinor: plan.amountMinor,
      })
      .onConflictDoNothing();
    for (const [index, definition] of definitions.entries()) {
      await db
        .insert(planEntitlements)
        .values({
          id: `pe_${plan.code}_${index}`,
          planVersionId: plan.versionId,
          entitlementKey: definition[0],
          value: plan.values[index],
        })
        .onConflictDoNothing();
    }
  }

  console.log("Seeded entitlement registry and immutable local plan versions.");
  await sqlClient.end();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
