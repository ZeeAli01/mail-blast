import { createHash } from "node:crypto";
import { z } from "zod";

export const entitlementRegistry = {
  "contacts.max": z.number().int().min(0).max(10_000_000),
  "team.max_members": z.number().int().min(1).max(100_000),
  "imports.max_rows": z.number().int().min(1).max(10_000_000),
  "sends.max_campaign_recipients": z.number().int().min(0).max(10_000_000),
  "sends.max_monthly_recipients": z.number().int().min(0).max(1_000_000_000),
  "campaigns.approval_required_above": z.number().int().min(0).max(10_000_000),
  "campaigns.scheduling_enabled": z.boolean(),
  "campaigns.capture_enabled": z.boolean(),
  "templates.max": z.number().int().min(1).max(1_000_000),
  "assets.max_bytes": z.number().int().min(0).max(100_000_000_000),
  "retention.days": z.number().int().min(1).max(3650),
} as const;

export type EntitlementKey = keyof typeof entitlementRegistry;
export type EntitlementValue =
  boolean | number | string | Record<string, unknown>;
export type EntitlementValues = Partial<
  Record<EntitlementKey, EntitlementValue>
>;

export const sandboxEntitlements: Record<EntitlementKey, boolean | number> = {
  "contacts.max": 100,
  "team.max_members": 2,
  "imports.max_rows": 100,
  "sends.max_campaign_recipients": 25,
  "sends.max_monthly_recipients": 250,
  "campaigns.approval_required_above": 0,
  "campaigns.scheduling_enabled": true,
  "campaigns.capture_enabled": true,
  "templates.max": 10,
  "assets.max_bytes": 10_000_000,
  "retention.days": 30,
};

export type ConfigurationLayer = {
  source: "default" | "plan" | "contract" | "override" | "policy" | "control";
  values: EntitlementValues;
};

export type EffectiveConfiguration = {
  values: Record<
    EntitlementKey,
    boolean | number | string | Record<string, unknown>
  >;
  sourceMap: Record<EntitlementKey, ConfigurationLayer["source"]>;
  hash: string;
};

export function resolveEffectiveConfiguration(
  layers: readonly ConfigurationLayer[],
): EffectiveConfiguration {
  const values = { ...sandboxEntitlements } as EffectiveConfiguration["values"];
  const sourceMap = Object.fromEntries(
    Object.keys(sandboxEntitlements).map((key) => [key, "default"]),
  ) as EffectiveConfiguration["sourceMap"];

  for (const layer of layers) {
    for (const [rawKey, rawValue] of Object.entries(layer.values)) {
      const key = rawKey as EntitlementKey;
      const validator = entitlementRegistry[key];
      if (!validator) throw new Error(`Unknown entitlement: ${rawKey}`);
      const value = validator.parse(
        rawValue,
      ) as EffectiveConfiguration["values"][EntitlementKey];
      values[key] = value;
      sourceMap[key] = layer.source;
    }
  }

  const canonical = JSON.stringify(
    Object.fromEntries(
      Object.entries(values).sort(([a], [b]) => a.localeCompare(b)),
    ),
  );
  return {
    values,
    sourceMap,
    hash: createHash("sha256").update(canonical).digest("hex"),
  };
}
