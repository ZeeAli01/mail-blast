CREATE TYPE "public"."campaign_message_class" AS ENUM('marketing', 'sales_follow_up', 'transactional');--> statement-breakpoint
CREATE TYPE "public"."discovery_project_status" AS ENUM('draft', 'ready', 'running', 'paused', 'completed', 'canceled', 'failed');--> statement-breakpoint
CREATE TYPE "public"."email_verification_status" AS ENUM('unverified', 'syntax_valid', 'deliverable', 'risky', 'undeliverable', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."lead_lifecycle_stage" AS ENUM('prospect', 'marketing_qualified', 'sales_qualified', 'active_opportunity', 'customer', 'disqualified');--> statement-breakpoint
CREATE TYPE "public"."lead_source_type" AS ENUM('first_party_form', 'product_event', 'crm', 'event_registration', 'referral', 'partner', 'manual_research', 'public_business_site', 'licensed_provider', 'csv_import');--> statement-breakpoint
CREATE TYPE "public"."permission_status" AS ENUM('unknown', 'consented', 'soft_opt_in', 'legitimate_interest_reviewed', 'contractual', 'transactional_only', 'opted_out', 'prohibited');--> statement-breakpoint
CREATE TYPE "public"."source_trust_status" AS ENUM('verified', 'declared', 'unverified', 'rejected');--> statement-breakpoint
CREATE TABLE "companies" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"name" text NOT NULL,
	"normalized_domain" text,
	"website_url" text,
	"industry" text,
	"employee_range" text,
	"country_code" text,
	"region" text,
	"city" text,
	"description" text,
	"attributes" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contact_email_evidence" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"contact_id" text NOT NULL,
	"source_id" text NOT NULL,
	"normalized_email" text NOT NULL,
	"verification_status" "email_verification_status" DEFAULT 'unverified' NOT NULL,
	"verifier" text,
	"is_catch_all" boolean DEFAULT false NOT NULL,
	"is_disposable" boolean DEFAULT false NOT NULL,
	"is_role_address" boolean DEFAULT false NOT NULL,
	"has_mx_records" boolean,
	"confidence" integer,
	"evidence" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"checked_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "discovery_projects" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"name" text NOT NULL,
	"status" "discovery_project_status" DEFAULT 'draft' NOT NULL,
	"keywords" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"filters" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"allowed_source_types" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"result_limit" integer DEFAULT 100 NOT NULL,
	"results_found" integer DEFAULT 0 NOT NULL,
	"results_accepted" integer DEFAULT 0 NOT NULL,
	"created_by_user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "discovery_results" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"project_id" text NOT NULL,
	"source_id" text NOT NULL,
	"external_reference" text,
	"company_name" text,
	"company_domain" text,
	"person_name" text,
	"title" text,
	"email_candidate" text,
	"fit_score" integer,
	"evidence_summary" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"review_status" text DEFAULT 'pending' NOT NULL,
	"reviewed_by_user_id" text,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lead_profiles" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"contact_id" text NOT NULL,
	"company_id" text,
	"title" text,
	"department" text,
	"seniority" text,
	"lifecycle_stage" "lead_lifecycle_stage" DEFAULT 'prospect' NOT NULL,
	"owner_user_id" text,
	"jurisdiction_country_code" text,
	"permission" "permission_status" DEFAULT 'unknown' NOT NULL,
	"permission_basis" text,
	"permission_reviewed_at" timestamp with time zone,
	"permission_review_expires_at" timestamp with time zone,
	"fit_score" integer,
	"intent_score" integer,
	"verification_score" integer,
	"risk_score" integer,
	"score_version" text,
	"scored_at" timestamp with time zone,
	"last_engaged_at" timestamp with time zone,
	"disqualification_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lead_signals" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"contact_id" text NOT NULL,
	"source_id" text NOT NULL,
	"type" text NOT NULL,
	"strength" integer NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	"expires_at" timestamp with time zone,
	"deduplication_key" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lead_sources" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"type" "lead_source_type" NOT NULL,
	"name" text NOT NULL,
	"provider" text,
	"source_url" text,
	"trust_status" "source_trust_status" DEFAULT 'unverified' NOT NULL,
	"collection_method" text NOT NULL,
	"terms_reference" text,
	"lawful_use_notes" text,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"collected_at" timestamp with time zone NOT NULL,
	"expires_at" timestamp with time zone,
	"created_by_user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "category" text DEFAULT 'saas_growth' NOT NULL;--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "type" text DEFAULT 'inbound_lead_nurture' NOT NULL;--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "objective" text;--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "message_class" "campaign_message_class" DEFAULT 'marketing' NOT NULL;--> statement-breakpoint
ALTER TABLE "companies" ADD CONSTRAINT "companies_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_email_evidence" ADD CONSTRAINT "contact_email_evidence_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_email_evidence" ADD CONSTRAINT "contact_email_evidence_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_email_evidence" ADD CONSTRAINT "contact_email_evidence_source_id_lead_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."lead_sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discovery_projects" ADD CONSTRAINT "discovery_projects_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discovery_projects" ADD CONSTRAINT "discovery_projects_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discovery_results" ADD CONSTRAINT "discovery_results_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discovery_results" ADD CONSTRAINT "discovery_results_project_id_discovery_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."discovery_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discovery_results" ADD CONSTRAINT "discovery_results_source_id_lead_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."lead_sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discovery_results" ADD CONSTRAINT "discovery_results_reviewed_by_user_id_users_id_fk" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_profiles" ADD CONSTRAINT "lead_profiles_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_profiles" ADD CONSTRAINT "lead_profiles_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_profiles" ADD CONSTRAINT "lead_profiles_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_profiles" ADD CONSTRAINT "lead_profiles_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_signals" ADD CONSTRAINT "lead_signals_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_signals" ADD CONSTRAINT "lead_signals_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_signals" ADD CONSTRAINT "lead_signals_source_id_lead_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."lead_sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_sources" ADD CONSTRAINT "lead_sources_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_sources" ADD CONSTRAINT "lead_sources_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "companies_org_domain_uidx" ON "companies" USING btree ("organization_id","normalized_domain");--> statement-breakpoint
CREATE INDEX "companies_org_industry_idx" ON "companies" USING btree ("organization_id","industry");--> statement-breakpoint
CREATE UNIQUE INDEX "contact_email_evidence_source_contact_uidx" ON "contact_email_evidence" USING btree ("source_id","contact_id","normalized_email");--> statement-breakpoint
CREATE INDEX "contact_email_evidence_org_status_idx" ON "contact_email_evidence" USING btree ("organization_id","verification_status");--> statement-breakpoint
CREATE INDEX "discovery_projects_org_status_idx" ON "discovery_projects" USING btree ("organization_id","status","created_at");--> statement-breakpoint
CREATE INDEX "discovery_results_project_review_idx" ON "discovery_results" USING btree ("project_id","review_status");--> statement-breakpoint
CREATE UNIQUE INDEX "lead_profiles_org_contact_uidx" ON "lead_profiles" USING btree ("organization_id","contact_id");--> statement-breakpoint
CREATE INDEX "lead_profiles_org_stage_score_idx" ON "lead_profiles" USING btree ("organization_id","lifecycle_stage","intent_score");--> statement-breakpoint
CREATE UNIQUE INDEX "lead_signals_org_dedupe_uidx" ON "lead_signals" USING btree ("organization_id","deduplication_key");--> statement-breakpoint
CREATE INDEX "lead_signals_contact_time_idx" ON "lead_signals" USING btree ("contact_id","occurred_at");--> statement-breakpoint
CREATE INDEX "lead_sources_org_type_time_idx" ON "lead_sources" USING btree ("organization_id","type","collected_at");
--> statement-breakpoint
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE companies FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY companies_tenant_policy ON companies USING (organization_id = app_current_organization_id() OR current_user = 'app_worker') WITH CHECK (organization_id = app_current_organization_id() OR current_user = 'app_worker');
--> statement-breakpoint
ALTER TABLE lead_sources ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE lead_sources FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY lead_sources_tenant_policy ON lead_sources USING (organization_id = app_current_organization_id() OR current_user = 'app_worker') WITH CHECK (organization_id = app_current_organization_id() OR current_user = 'app_worker');
--> statement-breakpoint
ALTER TABLE lead_profiles ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE lead_profiles FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY lead_profiles_tenant_policy ON lead_profiles USING (organization_id = app_current_organization_id() OR current_user = 'app_worker') WITH CHECK (organization_id = app_current_organization_id() OR current_user = 'app_worker');
--> statement-breakpoint
ALTER TABLE contact_email_evidence ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE contact_email_evidence FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY contact_email_evidence_tenant_policy ON contact_email_evidence USING (organization_id = app_current_organization_id() OR current_user = 'app_worker') WITH CHECK (organization_id = app_current_organization_id() OR current_user = 'app_worker');
--> statement-breakpoint
ALTER TABLE lead_signals ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE lead_signals FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY lead_signals_tenant_policy ON lead_signals USING (organization_id = app_current_organization_id() OR current_user = 'app_worker') WITH CHECK (organization_id = app_current_organization_id() OR current_user = 'app_worker');
--> statement-breakpoint
ALTER TABLE discovery_projects ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE discovery_projects FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY discovery_projects_tenant_policy ON discovery_projects USING (organization_id = app_current_organization_id() OR current_user = 'app_worker') WITH CHECK (organization_id = app_current_organization_id() OR current_user = 'app_worker');
--> statement-breakpoint
ALTER TABLE discovery_results ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE discovery_results FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY discovery_results_tenant_policy ON discovery_results USING (organization_id = app_current_organization_id() OR current_user = 'app_worker') WITH CHECK (organization_id = app_current_organization_id() OR current_user = 'app_worker');
