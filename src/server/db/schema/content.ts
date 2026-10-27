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

export const senderStatus = pgEnum("sender_status", [
  "pending",
  "simulated_verified",
  "verified",
  "failed",
  "disabled",
]);

export const brands = pgTable("brands", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  logoAssetId: text("logo_asset_id"),
  primaryColor: text("primary_color").notNull().default("#7c3aed"),
  legalName: text("legal_name").notNull(),
  postalAddress: text("postal_address").notNull(),
  websiteUrl: text("website_url"),
  isDefault: boolean("is_default").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const senderDomains = pgTable(
  "sender_domains",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    domain: text("domain").notNull(),
    status: senderStatus("status").notNull().default("pending"),
    verificationMode: text("verification_mode").notNull().default("simulation"),
    verificationDetails: jsonb("verification_details").notNull().default({}),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("sender_domains_org_domain_uidx").on(
      table.organizationId,
      table.domain,
    ),
  ],
);

export const senderIdentities = pgTable(
  "sender_identities",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    domainId: text("domain_id")
      .notNull()
      .references(() => senderDomains.id),
    displayName: text("display_name").notNull(),
    localPart: text("local_part").notNull(),
    replyTo: text("reply_to"),
    status: senderStatus("status").notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("sender_identities_org_domain_local_uidx").on(
      table.organizationId,
      table.domainId,
      table.localPart,
    ),
  ],
);

export const assets = pgTable(
  "assets",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    storageKey: text("storage_key").notNull(),
    originalFilename: text("original_filename").notNull(),
    contentType: text("content_type").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    width: integer("width"),
    height: integer("height"),
    sha256: text("sha256").notNull(),
    createdByUserId: text("created_by_user_id")
      .notNull()
      .references(() => user.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    index("assets_org_created_idx").on(table.organizationId, table.createdAt),
  ],
);

export const templates = pgTable("templates", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  brandId: text("brand_id").references(() => brands.id),
  name: text("name").notNull(),
  description: text("description"),
  currentVersion: integer("current_version").notNull().default(1),
  archivedAt: timestamp("archived_at", { withTimezone: true }),
  createdByUserId: text("created_by_user_id")
    .notNull()
    .references(() => user.id),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const templateVersions = pgTable(
  "template_versions",
  {
    id: text("id").primaryKey(),
    templateId: text("template_id")
      .notNull()
      .references(() => templates.id, { onDelete: "cascade" }),
    version: integer("version").notNull(),
    schemaVersion: integer("schema_version").notNull().default(1),
    document: jsonb("document").notNull(),
    subject: text("subject").notNull(),
    preheader: text("preheader"),
    rendererVersion: text("renderer_version").notNull(),
    contentHash: text("content_hash").notNull(),
    createdByUserId: text("created_by_user_id")
      .notNull()
      .references(() => user.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("template_versions_template_version_uidx").on(
      table.templateId,
      table.version,
    ),
  ],
);
