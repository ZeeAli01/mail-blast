import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { organizations, user } from "./auth";

export const jobStatus = pgEnum("job_status", [
  "queued",
  "running",
  "completed",
  "retry",
  "failed",
  "canceled",
]);
export const controlScope = pgEnum("control_scope", [
  "global",
  "environment",
  "organization",
  "sender_domain",
  "campaign",
]);

export const jobs = pgTable(
  "jobs",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id").references(() => organizations.id),
    type: text("type").notNull(),
    payload: jsonb("payload").notNull(),
    status: jobStatus("status").notNull().default("queued"),
    priority: integer("priority").notNull().default(100),
    attempts: integer("attempts").notNull().default(0),
    maxAttempts: integer("max_attempts").notNull().default(5),
    runAt: timestamp("run_at", { withTimezone: true }).notNull().defaultNow(),
    lockedAt: timestamp("locked_at", { withTimezone: true }),
    lockedBy: text("locked_by"),
    lastError: text("last_error"),
    idempotencyKey: text("idempotency_key").notNull().unique(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (table) => [
    index("jobs_claim_idx").on(table.status, table.runAt, table.priority),
  ],
);

export const outboxEvents = pgTable(
  "outbox_events",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id").references(() => organizations.id),
    topic: text("topic").notNull(),
    aggregateType: text("aggregate_type").notNull(),
    aggregateId: text("aggregate_id").notNull(),
    payload: jsonb("payload").notNull(),
    idempotencyKey: text("idempotency_key").notNull().unique(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    dispatchedAt: timestamp("dispatched_at", { withTimezone: true }),
  },
  (table) => [
    index("outbox_events_dispatch_idx").on(table.dispatchedAt, table.createdAt),
  ],
);

export const auditEvents = pgTable(
  "audit_events",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id").references(() => organizations.id),
    actorUserId: text("actor_user_id").references(() => user.id),
    actorType: text("actor_type").notNull(),
    action: text("action").notNull(),
    targetType: text("target_type").notNull(),
    targetId: text("target_id"),
    requestId: text("request_id"),
    ipHash: text("ip_hash"),
    userAgent: text("user_agent"),
    before: jsonb("before"),
    after: jsonb("after"),
    metadata: jsonb("metadata").notNull().default({}),
    occurredAt: timestamp("occurred_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("audit_events_org_time_idx").on(
      table.organizationId,
      table.occurredAt,
    ),
  ],
);

export const featureFlags = pgTable(
  "feature_flags",
  {
    id: text("id").primaryKey(),
    key: text("key").notNull(),
    organizationId: text("organization_id").references(() => organizations.id),
    enabled: boolean("enabled").notNull().default(false),
    configuration: jsonb("configuration").notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("feature_flags_key_org_uidx").on(
      table.key,
      table.organizationId,
    ),
  ],
);

export const systemControls = pgTable(
  "system_controls",
  {
    id: text("id").primaryKey(),
    scopeType: controlScope("scope_type").notNull(),
    scopeId: text("scope_id"),
    key: text("key").notNull(),
    enabled: boolean("enabled").notNull().default(false),
    reason: text("reason").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    activatedByUserId: text("activated_by_user_id")
      .notNull()
      .references(() => user.id),
    approvedByUserId: text("approved_by_user_id").references(() => user.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    deactivatedAt: timestamp("deactivated_at", { withTimezone: true }),
  },
  (table) => [
    index("system_controls_scope_key_idx").on(
      table.scopeType,
      table.scopeId,
      table.key,
    ),
  ],
);

export const adminActions = pgTable("admin_actions", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id").references(() => organizations.id),
  requestedByUserId: text("requested_by_user_id")
    .notNull()
    .references(() => user.id),
  approvedByUserId: text("approved_by_user_id").references(() => user.id),
  type: text("type").notNull(),
  riskLevel: text("risk_level").notNull(),
  status: text("status").notNull().default("pending"),
  requestPayload: jsonb("request_payload").notNull(),
  resultPayload: jsonb("result_payload"),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  executedAt: timestamp("executed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
