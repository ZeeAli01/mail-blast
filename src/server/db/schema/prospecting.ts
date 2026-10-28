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
import { contacts } from "./audience";
import { organizations, user } from "./auth";

export const leadSourceType = pgEnum("lead_source_type", [
  "first_party_form",
  "product_event",
  "crm",
  "event_registration",
  "referral",
  "partner",
  "manual_research",
  "public_business_site",
  "licensed_provider",
  "csv_import",
]);

export const sourceTrustStatus = pgEnum("source_trust_status", [
  "verified",
  "declared",
  "unverified",
  "rejected",
]);

export const emailVerificationStatus = pgEnum("email_verification_status", [
  "unverified",
  "syntax_valid",
  "deliverable",
  "risky",
  "undeliverable",
  "unknown",
]);

export const permissionStatus = pgEnum("permission_status", [
  "unknown",
  "consented",
  "soft_opt_in",
  "legitimate_interest_reviewed",
  "contractual",
  "transactional_only",
  "opted_out",
  "prohibited",
]);

export const leadLifecycleStage = pgEnum("lead_lifecycle_stage", [
  "prospect",
  "marketing_qualified",
  "sales_qualified",
  "active_opportunity",
  "customer",
  "disqualified",
]);

export const discoveryProjectStatus = pgEnum("discovery_project_status", [
  "draft",
  "ready",
  "running",
  "paused",
  "completed",
  "canceled",
  "failed",
]);

export const companies = pgTable(
  "companies",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    normalizedDomain: text("normalized_domain"),
    websiteUrl: text("website_url"),
    industry: text("industry"),
    employeeRange: text("employee_range"),
    countryCode: text("country_code"),
    region: text("region"),
    city: text("city"),
    description: text("description"),
    attributes: jsonb("attributes").notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("companies_org_domain_uidx").on(
      table.organizationId,
      table.normalizedDomain,
    ),
    index("companies_org_industry_idx").on(
      table.organizationId,
      table.industry,
    ),
  ],
);

export const leadSources = pgTable(
  "lead_sources",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    type: leadSourceType("type").notNull(),
    name: text("name").notNull(),
    provider: text("provider"),
    sourceUrl: text("source_url"),
    trustStatus: sourceTrustStatus("trust_status")
      .notNull()
      .default("unverified"),
    collectionMethod: text("collection_method").notNull(),
    termsReference: text("terms_reference"),
    lawfulUseNotes: text("lawful_use_notes"),
    metadata: jsonb("metadata").notNull().default({}),
    collectedAt: timestamp("collected_at", { withTimezone: true }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    createdByUserId: text("created_by_user_id")
      .notNull()
      .references(() => user.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("lead_sources_org_type_time_idx").on(
      table.organizationId,
      table.type,
      table.collectedAt,
    ),
  ],
);

export const leadProfiles = pgTable(
  "lead_profiles",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    contactId: text("contact_id")
      .notNull()
      .references(() => contacts.id, { onDelete: "cascade" }),
    companyId: text("company_id").references(() => companies.id, {
      onDelete: "set null",
    }),
    title: text("title"),
    department: text("department"),
    seniority: text("seniority"),
    lifecycleStage: leadLifecycleStage("lifecycle_stage")
      .notNull()
      .default("prospect"),
    ownerUserId: text("owner_user_id").references(() => user.id),
    jurisdictionCountryCode: text("jurisdiction_country_code"),
    permission: permissionStatus("permission").notNull().default("unknown"),
    permissionBasis: text("permission_basis"),
    permissionReviewedAt: timestamp("permission_reviewed_at", {
      withTimezone: true,
    }),
    permissionReviewExpiresAt: timestamp("permission_review_expires_at", {
      withTimezone: true,
    }),
    fitScore: integer("fit_score"),
    intentScore: integer("intent_score"),
    verificationScore: integer("verification_score"),
    riskScore: integer("risk_score"),
    scoreVersion: text("score_version"),
    scoredAt: timestamp("scored_at", { withTimezone: true }),
    lastEngagedAt: timestamp("last_engaged_at", { withTimezone: true }),
    disqualificationReason: text("disqualification_reason"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("lead_profiles_org_contact_uidx").on(
      table.organizationId,
      table.contactId,
    ),
    index("lead_profiles_org_stage_score_idx").on(
      table.organizationId,
      table.lifecycleStage,
      table.intentScore,
    ),
  ],
);

export const contactEmailEvidence = pgTable(
  "contact_email_evidence",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    contactId: text("contact_id")
      .notNull()
      .references(() => contacts.id, { onDelete: "cascade" }),
    sourceId: text("source_id")
      .notNull()
      .references(() => leadSources.id),
    normalizedEmail: text("normalized_email").notNull(),
    verificationStatus: emailVerificationStatus("verification_status")
      .notNull()
      .default("unverified"),
    verifier: text("verifier"),
    isCatchAll: boolean("is_catch_all").notNull().default(false),
    isDisposable: boolean("is_disposable").notNull().default(false),
    isRoleAddress: boolean("is_role_address").notNull().default(false),
    hasMxRecords: boolean("has_mx_records"),
    confidence: integer("confidence"),
    evidence: jsonb("evidence").notNull().default({}),
    checkedAt: timestamp("checked_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("contact_email_evidence_source_contact_uidx").on(
      table.sourceId,
      table.contactId,
      table.normalizedEmail,
    ),
    index("contact_email_evidence_org_status_idx").on(
      table.organizationId,
      table.verificationStatus,
    ),
  ],
);

export const leadSignals = pgTable(
  "lead_signals",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    contactId: text("contact_id")
      .notNull()
      .references(() => contacts.id, { onDelete: "cascade" }),
    sourceId: text("source_id")
      .notNull()
      .references(() => leadSources.id),
    type: text("type").notNull(),
    strength: integer("strength").notNull(),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    deduplicationKey: text("deduplication_key").notNull(),
    metadata: jsonb("metadata").notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("lead_signals_org_dedupe_uidx").on(
      table.organizationId,
      table.deduplicationKey,
    ),
    index("lead_signals_contact_time_idx").on(
      table.contactId,
      table.occurredAt,
    ),
  ],
);

export const discoveryProjects = pgTable(
  "discovery_projects",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    status: discoveryProjectStatus("status").notNull().default("draft"),
    keywords: jsonb("keywords").notNull().default([]),
    filters: jsonb("filters").notNull().default({}),
    allowedSourceTypes: jsonb("allowed_source_types").notNull().default([]),
    resultLimit: integer("result_limit").notNull().default(100),
    resultsFound: integer("results_found").notNull().default(0),
    resultsAccepted: integer("results_accepted").notNull().default(0),
    createdByUserId: text("created_by_user_id")
      .notNull()
      .references(() => user.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (table) => [
    index("discovery_projects_org_status_idx").on(
      table.organizationId,
      table.status,
      table.createdAt,
    ),
  ],
);

export const discoveryResults = pgTable(
  "discovery_results",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    projectId: text("project_id")
      .notNull()
      .references(() => discoveryProjects.id, { onDelete: "cascade" }),
    sourceId: text("source_id")
      .notNull()
      .references(() => leadSources.id),
    externalReference: text("external_reference"),
    companyName: text("company_name"),
    companyDomain: text("company_domain"),
    personName: text("person_name"),
    title: text("title"),
    emailCandidate: text("email_candidate"),
    fitScore: integer("fit_score"),
    evidenceSummary: jsonb("evidence_summary").notNull().default({}),
    reviewStatus: text("review_status").notNull().default("pending"),
    reviewedByUserId: text("reviewed_by_user_id").references(() => user.id),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("discovery_results_project_review_idx").on(
      table.projectId,
      table.reviewStatus,
    ),
  ],
);
