import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { organizations, user } from "./auth";

export const subscriptionStatus = pgEnum("subscription_status", [
  "trialing",
  "active",
  "past_due",
  "restricted",
  "canceled",
  "expired",
]);
export const valueType = pgEnum("value_type", [
  "boolean",
  "integer",
  "string",
  "json",
]);
export const adjustmentType = pgEnum("adjustment_type", [
  "credit",
  "debit",
  "discount",
]);

export const plans = pgTable("plans", {
  id: text("id").primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  isPublic: boolean("is_public").notNull().default(true),
  archivedAt: timestamp("archived_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const planVersions = pgTable(
  "plan_versions",
  {
    id: text("id").primaryKey(),
    planId: text("plan_id")
      .notNull()
      .references(() => plans.id),
    version: integer("version").notNull(),
    name: text("name").notNull(),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("plan_versions_plan_version_uidx").on(
      table.planId,
      table.version,
    ),
  ],
);

export const prices = pgTable("prices", {
  id: text("id").primaryKey(),
  planVersionId: text("plan_version_id")
    .notNull()
    .references(() => planVersions.id),
  currency: text("currency").notNull().default("USD"),
  amountMinor: integer("amount_minor").notNull().default(0),
  interval: text("interval").notNull().default("month"),
  active: boolean("active").notNull().default(true),
});

export const entitlementDefinitions = pgTable("entitlement_definitions", {
  key: text("key").primaryKey(),
  valueType: valueType("value_type").notNull(),
  description: text("description").notNull(),
  minimumInteger: integer("minimum_integer"),
  maximumInteger: integer("maximum_integer"),
  defaultValue: jsonb("default_value").notNull(),
  customerVisible: boolean("customer_visible").notNull().default(true),
});

export const planEntitlements = pgTable(
  "plan_entitlements",
  {
    id: text("id").primaryKey(),
    planVersionId: text("plan_version_id")
      .notNull()
      .references(() => planVersions.id, { onDelete: "cascade" }),
    entitlementKey: text("entitlement_key")
      .notNull()
      .references(() => entitlementDefinitions.key),
    value: jsonb("value").notNull(),
  },
  (table) => [
    uniqueIndex("plan_entitlements_version_key_uidx").on(
      table.planVersionId,
      table.entitlementKey,
    ),
  ],
);

export const billingCustomers = pgTable("billing_customers", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .unique()
    .references(() => organizations.id, { onDelete: "cascade" }),
  provider: text("provider").notNull().default("local"),
  providerCustomerId: text("provider_customer_id"),
  billingEmail: text("billing_email"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const subscriptions = pgTable(
  "subscriptions",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    planVersionId: text("plan_version_id")
      .notNull()
      .references(() => planVersions.id),
    status: subscriptionStatus("status").notNull(),
    provider: text("provider").notNull().default("local"),
    providerSubscriptionId: text("provider_subscription_id"),
    trialEndsAt: timestamp("trial_ends_at", { withTimezone: true }),
    currentPeriodStartsAt: timestamp("current_period_starts_at", {
      withTimezone: true,
    }).notNull(),
    currentPeriodEndsAt: timestamp("current_period_ends_at", {
      withTimezone: true,
    }).notNull(),
    cancelAtPeriodEnd: boolean("cancel_at_period_end").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("subscriptions_org_status_idx").on(
      table.organizationId,
      table.status,
    ),
  ],
);

export const subscriptionEvents = pgTable(
  "subscription_events",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id),
    subscriptionId: text("subscription_id")
      .notNull()
      .references(() => subscriptions.id),
    eventType: text("event_type").notNull(),
    previousStatus: subscriptionStatus("previous_status"),
    nextStatus: subscriptionStatus("next_status"),
    payload: jsonb("payload").notNull().default({}),
    idempotencyKey: text("idempotency_key").notNull().unique(),
    actorUserId: text("actor_user_id").references(() => user.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("subscription_events_subscription_idx").on(
      table.subscriptionId,
      table.createdAt,
    ),
  ],
);

export const entitlementOverrides = pgTable(
  "entitlement_overrides",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id),
    entitlementKey: text("entitlement_key")
      .notNull()
      .references(() => entitlementDefinitions.key),
    value: jsonb("value").notNull(),
    reason: text("reason").notNull(),
    startsAt: timestamp("starts_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    supersededAt: timestamp("superseded_at", { withTimezone: true }),
    createdByUserId: text("created_by_user_id")
      .notNull()
      .references(() => user.id),
    approvedByUserId: text("approved_by_user_id").references(() => user.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("entitlement_overrides_org_key_idx").on(
      table.organizationId,
      table.entitlementKey,
    ),
  ],
);

export const organizationConfigVersions = pgTable(
  "organization_config_versions",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id),
    version: integer("version").notNull(),
    effectiveConfig: jsonb("effective_config").notNull(),
    sourceMap: jsonb("source_map").notNull(),
    configHash: text("config_hash").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("organization_config_versions_org_version_uidx").on(
      table.organizationId,
      table.version,
    ),
  ],
);

export const organizationPolicies = pgTable("organization_policies", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id),
  version: integer("version").notNull(),
  approvalRequired: boolean("approval_required").notNull().default(true),
  approvalRequiredAbove: integer("approval_required_above")
    .notNull()
    .default(0),
  allowedFromDomains: jsonb("allowed_from_domains").notNull().default([]),
  quietHours: jsonb("quiet_hours").notNull().default({}),
  createdByUserId: text("created_by_user_id")
    .notNull()
    .references(() => user.id),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const usageLedger = pgTable(
  "usage_ledger",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id),
    subscriptionId: text("subscription_id").references(() => subscriptions.id),
    metric: text("metric").notNull(),
    quantity: integer("quantity").notNull(),
    kind: text("kind").notNull(),
    referenceId: text("reference_id"),
    idempotencyKey: text("idempotency_key").notNull().unique(),
    occurredAt: timestamp("occurred_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("usage_ledger_org_metric_time_idx").on(
      table.organizationId,
      table.metric,
      table.occurredAt,
    ),
  ],
);

export const invoices = pgTable("invoices", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id),
  subscriptionId: text("subscription_id")
    .notNull()
    .references(() => subscriptions.id),
  status: text("status").notNull().default("draft"),
  currency: text("currency").notNull().default("USD"),
  subtotalMinor: integer("subtotal_minor").notNull().default(0),
  totalMinor: integer("total_minor").notNull().default(0),
  periodStartsAt: timestamp("period_starts_at", {
    withTimezone: true,
  }).notNull(),
  periodEndsAt: timestamp("period_ends_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const invoiceItems = pgTable("invoice_items", {
  id: text("id").primaryKey(),
  invoiceId: text("invoice_id")
    .notNull()
    .references(() => invoices.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  description: text("description").notNull(),
  quantity: numeric("quantity").notNull().default("1"),
  amountMinor: integer("amount_minor").notNull(),
});

export const billingAdjustments = pgTable("billing_adjustments", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id),
  subscriptionId: text("subscription_id").references(() => subscriptions.id),
  type: adjustmentType("type").notNull(),
  amountMinor: integer("amount_minor").notNull(),
  currency: text("currency").notNull().default("USD"),
  reason: text("reason").notNull(),
  createdByUserId: text("created_by_user_id")
    .notNull()
    .references(() => user.id),
  approvedByUserId: text("approved_by_user_id").references(() => user.id),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
