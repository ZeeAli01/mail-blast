import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { organizations, user } from "./auth";

export const contactStatus = pgEnum("contact_status", [
  "subscribed",
  "unsubscribed",
  "bounced",
  "complained",
]);
export const consentAction = pgEnum("consent_action", [
  "granted",
  "revoked",
  "unsubscribed",
]);
export const importStatus = pgEnum("import_status", [
  "uploaded",
  "mapped",
  "processing",
  "completed",
  "failed",
]);

export const contacts = pgTable(
  "contacts",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    normalizedEmail: text("normalized_email").notNull(),
    firstName: text("first_name"),
    lastName: text("last_name"),
    status: contactStatus("status").notNull().default("subscribed"),
    customFields: jsonb("custom_fields").notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("contacts_org_email_uidx").on(
      table.organizationId,
      table.normalizedEmail,
    ),
    index("contacts_org_status_idx").on(table.organizationId, table.status),
  ],
);

export const customFieldDefinitions = pgTable(
  "custom_field_definitions",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    key: text("key").notNull(),
    label: text("label").notNull(),
    type: text("type").notNull(),
    required: boolean("required").notNull().default(false),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("custom_fields_org_key_uidx").on(
      table.organizationId,
      table.key,
    ),
  ],
);

export const lists = pgTable(
  "lists",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
  },
  (table) => [index("lists_org_idx").on(table.organizationId)],
);

export const listContacts = pgTable(
  "list_contacts",
  {
    listId: text("list_id")
      .notNull()
      .references(() => lists.id, { onDelete: "cascade" }),
    contactId: text("contact_id")
      .notNull()
      .references(() => contacts.id, { onDelete: "cascade" }),
    addedAt: timestamp("added_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.listId, table.contactId] })],
);

export const tags = pgTable(
  "tags",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    color: text("color").notNull().default("violet"),
  },
  (table) => [
    uniqueIndex("tags_org_name_uidx").on(table.organizationId, table.name),
  ],
);

export const contactTags = pgTable(
  "contact_tags",
  {
    contactId: text("contact_id")
      .notNull()
      .references(() => contacts.id, { onDelete: "cascade" }),
    tagId: text("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.contactId, table.tagId] })],
);

export const segments = pgTable("segments", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  currentVersion: integer("current_version").notNull().default(1),
  archivedAt: timestamp("archived_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const segmentVersions = pgTable(
  "segment_versions",
  {
    id: text("id").primaryKey(),
    segmentId: text("segment_id")
      .notNull()
      .references(() => segments.id, { onDelete: "cascade" }),
    version: integer("version").notNull(),
    definition: jsonb("definition").notNull(),
    createdByUserId: text("created_by_user_id")
      .notNull()
      .references(() => user.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("segment_versions_segment_version_uidx").on(
      table.segmentId,
      table.version,
    ),
  ],
);

export const consentEvents = pgTable(
  "consent_events",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id),
    contactId: text("contact_id")
      .notNull()
      .references(() => contacts.id),
    topicId: text("topic_id"),
    action: consentAction("action").notNull(),
    basis: text("basis").notNull(),
    source: text("source").notNull(),
    proof: jsonb("proof").notNull().default({}),
    actorUserId: text("actor_user_id").references(() => user.id),
    occurredAt: timestamp("occurred_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("consent_events_contact_time_idx").on(
      table.contactId,
      table.occurredAt,
    ),
  ],
);

export const subscriptionTopics = pgTable(
  "subscription_topics",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id),
    key: text("key").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    required: boolean("required").notNull().default(false),
  },
  (table) => [
    uniqueIndex("subscription_topics_org_key_uidx").on(
      table.organizationId,
      table.key,
    ),
  ],
);

export const contactPreferences = pgTable(
  "contact_preferences",
  {
    contactId: text("contact_id")
      .notNull()
      .references(() => contacts.id, { onDelete: "cascade" }),
    topicId: text("topic_id")
      .notNull()
      .references(() => subscriptionTopics.id, { onDelete: "cascade" }),
    subscribed: boolean("subscribed").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.contactId, table.topicId] })],
);

export const suppressionEntries = pgTable(
  "suppression_entries",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id),
    contactId: text("contact_id").references(() => contacts.id),
    normalizedEmail: text("normalized_email").notNull(),
    reason: text("reason").notNull(),
    source: text("source").notNull(),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    releasedAt: timestamp("released_at", { withTimezone: true }),
    releasedByUserId: text("released_by_user_id").references(() => user.id),
  },
  (table) => [
    index("suppressions_org_email_active_idx").on(
      table.organizationId,
      table.normalizedEmail,
      table.active,
    ),
  ],
);

export const imports = pgTable("imports", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id),
  status: importStatus("status").notNull().default("uploaded"),
  originalFilename: text("original_filename").notNull(),
  storageKey: text("storage_key").notNull(),
  mapping: jsonb("mapping").notNull().default({}),
  consentAttestation: jsonb("consent_attestation"),
  rowCount: integer("row_count").notNull().default(0),
  acceptedCount: integer("accepted_count").notNull().default(0),
  rejectedCount: integer("rejected_count").notNull().default(0),
  createdByUserId: text("created_by_user_id")
    .notNull()
    .references(() => user.id),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

export const importRows = pgTable(
  "import_rows",
  {
    id: text("id").primaryKey(),
    importId: text("import_id")
      .notNull()
      .references(() => imports.id, { onDelete: "cascade" }),
    rowNumber: integer("row_number").notNull(),
    rawData: jsonb("raw_data").notNull(),
    normalizedData: jsonb("normalized_data"),
    status: text("status").notNull(),
    errorCode: text("error_code"),
  },
  (table) => [
    uniqueIndex("import_rows_import_row_uidx").on(
      table.importId,
      table.rowNumber,
    ),
  ],
);
