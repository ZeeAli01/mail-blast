import {
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { contacts } from "./audience";
import { organizations, user } from "./auth";
import { senderIdentities, templates } from "./content";

export const campaignStatus = pgEnum("campaign_status", [
  "draft",
  "in_review",
  "changes_requested",
  "approved",
  "scheduled",
  "processing",
  "paused",
  "completed",
  "canceled",
  "failed",
]);
export const deliveryStatus = pgEnum("delivery_status", [
  "pending",
  "captured",
  "delivered",
  "bounced",
  "complained",
  "suppressed",
  "failed",
]);

export const campaigns = pgTable(
  "campaigns",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    status: campaignStatus("status").notNull().default("draft"),
    currentVersion: integer("current_version").notNull().default(1),
    templateId: text("template_id").references(() => templates.id),
    senderIdentityId: text("sender_identity_id").references(
      () => senderIdentities.id,
    ),
    topicId: text("topic_id"),
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdByUserId: text("created_by_user_id")
      .notNull()
      .references(() => user.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("campaigns_org_status_created_idx").on(
      table.organizationId,
      table.status,
      table.createdAt,
    ),
  ],
);

export const campaignVersions = pgTable(
  "campaign_versions",
  {
    id: text("id").primaryKey(),
    campaignId: text("campaign_id")
      .notNull()
      .references(() => campaigns.id, { onDelete: "cascade" }),
    version: integer("version").notNull(),
    subject: text("subject").notNull(),
    preheader: text("preheader"),
    document: jsonb("document").notNull(),
    audienceDefinition: jsonb("audience_definition").notNull(),
    payloadHash: text("payload_hash").notNull(),
    rendererVersion: text("renderer_version").notNull(),
    createdByUserId: text("created_by_user_id")
      .notNull()
      .references(() => user.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("campaign_versions_campaign_version_uidx").on(
      table.campaignId,
      table.version,
    ),
  ],
);

export const campaignApprovals = pgTable("campaign_approvals", {
  id: text("id").primaryKey(),
  campaignId: text("campaign_id")
    .notNull()
    .references(() => campaigns.id, { onDelete: "cascade" }),
  campaignVersionId: text("campaign_version_id")
    .notNull()
    .references(() => campaignVersions.id),
  decision: text("decision").notNull(),
  comment: text("comment"),
  decidedByUserId: text("decided_by_user_id")
    .notNull()
    .references(() => user.id),
  decidedAt: timestamp("decided_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const audienceSnapshots = pgTable("audience_snapshots", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id),
  campaignId: text("campaign_id")
    .notNull()
    .references(() => campaigns.id, { onDelete: "cascade" }),
  campaignVersionId: text("campaign_version_id")
    .notNull()
    .references(() => campaignVersions.id),
  eligibleCount: integer("eligible_count").notNull(),
  excludedCount: integer("excluded_count").notNull(),
  exclusionSummary: jsonb("exclusion_summary").notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const audienceSnapshotMembers = pgTable(
  "audience_snapshot_members",
  {
    id: text("id").primaryKey(),
    snapshotId: text("snapshot_id")
      .notNull()
      .references(() => audienceSnapshots.id, { onDelete: "cascade" }),
    contactId: text("contact_id")
      .notNull()
      .references(() => contacts.id),
    eligibility: text("eligibility").notNull(),
    exclusionReason: text("exclusion_reason"),
    mergeData: jsonb("merge_data").notNull().default({}),
  },
  (table) => [
    uniqueIndex("audience_snapshot_members_snapshot_contact_uidx").on(
      table.snapshotId,
      table.contactId,
    ),
  ],
);

export const deliveries = pgTable(
  "deliveries",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id),
    campaignId: text("campaign_id")
      .notNull()
      .references(() => campaigns.id),
    audienceSnapshotId: text("audience_snapshot_id")
      .notNull()
      .references(() => audienceSnapshots.id),
    contactId: text("contact_id")
      .notNull()
      .references(() => contacts.id),
    status: deliveryStatus("status").notNull().default("pending"),
    idempotencyKey: text("idempotency_key").notNull().unique(),
    providerMessageId: text("provider_message_id"),
    capturedStorageKey: text("captured_storage_key"),
    finalReason: text("final_reason"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("deliveries_campaign_contact_uidx").on(
      table.campaignId,
      table.contactId,
    ),
    index("deliveries_campaign_status_idx").on(table.campaignId, table.status),
  ],
);

export const deliveryAttempts = pgTable("delivery_attempts", {
  id: text("id").primaryKey(),
  deliveryId: text("delivery_id")
    .notNull()
    .references(() => deliveries.id, { onDelete: "cascade" }),
  attempt: integer("attempt").notNull(),
  provider: text("provider").notNull(),
  outcome: text("outcome").notNull(),
  errorCode: text("error_code"),
  metadata: jsonb("metadata").notNull().default({}),
  startedAt: timestamp("started_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
});

export const providerEvents = pgTable(
  "provider_events",
  {
    id: text("id").primaryKey(),
    provider: text("provider").notNull(),
    providerEventId: text("provider_event_id").notNull(),
    eventType: text("event_type").notNull(),
    deliveryId: text("delivery_id").references(() => deliveries.id),
    payload: jsonb("payload").notNull(),
    receivedAt: timestamp("received_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    processedAt: timestamp("processed_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("provider_events_provider_event_uidx").on(
      table.provider,
      table.providerEventId,
    ),
  ],
);

export const unsubscribeTokens = pgTable("unsubscribe_tokens", {
  id: text("id").primaryKey(),
  tokenDigest: text("token_digest").notNull().unique(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id),
  deliveryId: text("delivery_id").references(() => deliveries.id),
  contactId: text("contact_id")
    .notNull()
    .references(() => contacts.id),
  campaignId: text("campaign_id").references(() => campaigns.id),
  topicId: text("topic_id"),
  keyVersion: integer("key_version").notNull().default(1),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  consumedAt: timestamp("consumed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
