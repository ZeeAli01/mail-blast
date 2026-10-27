import { CreateOrganizationForm } from "@/components/CreateOrganizationForm";
import { requireUser } from "@/src/server/auth/authorization";
import { db } from "@/src/server/db/client";
import { organizationMemberships, organizations } from "@/src/server/db/schema";
import { eq } from "drizzle-orm";
import { ArrowRight, CheckCircle2, ShieldAlert } from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const user = await requireUser();
  const workspaces = await db
    .select({
      id: organizations.id,
      name: organizations.name,
      status: organizations.status,
    })
    .from(organizationMemberships)
    .innerJoin(
      organizations,
      eq(organizations.id, organizationMemberships.organizationId),
    )
    .where(eq(organizationMemberships.userId, user.id))
    .limit(20);
  if (!workspaces.length)
    return (
      <div className="mx-auto max-w-xl py-10">
        <p className="text-sm font-semibold text-violet-300">
          First-time setup
        </p>
        <h1 className="mt-3 text-3xl font-semibold">
          Create your campaign workspace
        </h1>
        <p className="mt-3 leading-7 text-slate-400">
          This becomes the isolated home for your team, contacts, consent
          history, templates, campaigns, policies, and subscription controls.
        </p>
        <CreateOrganizationForm />
      </div>
    );
  const workspace = workspaces[0];
  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-violet-300">{workspace.name}</p>
          <h1 className="mt-2 text-3xl font-semibold">
            Good to see you, {user.name.split(" ")[0]}.
          </h1>
          <p className="mt-2 text-slate-400">
            Your safe campaign workspace is ready for configuration.
          </p>
        </div>
        <Link
          href="/dashboard/campaigns"
          className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold"
        >
          Create campaign <ArrowRight size={16} />
        </Link>
      </div>
      <div className="mt-8 rounded-2xl border border-amber-400/20 bg-amber-400/[.06] p-5">
        <div className="flex gap-3">
          <ShieldAlert className="shrink-0 text-amber-300" />
          <div>
            <h2 className="font-semibold text-amber-100">
              Capture-only safety mode
            </h2>
            <p className="mt-1 text-sm leading-6 text-amber-100/70">
              Real delivery and payment collection are disabled. Complete brand,
              legal identity, consent, sender simulation, and plan configuration
              before running local captures.
            </p>
          </div>
        </div>
      </div>
      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Contacts", "0", "Import with consent proof"],
          ["Campaigns", "0", "Draft your first campaign"],
          ["Monthly usage", "0", "Captured recipients"],
          ["Workspace status", workspace.status, "Policy enforced"],
        ].map(([label, value, hint]) => (
          <article
            key={label}
            className="rounded-2xl border border-white/10 bg-white/[.03] p-5"
          >
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-3 text-2xl font-semibold capitalize">{value}</p>
            <p className="mt-2 text-xs text-slate-500">{hint}</p>
          </article>
        ))}
      </section>
      <section className="mt-8 rounded-2xl border border-white/10 bg-white/[.025] p-6">
        <h2 className="text-lg font-semibold">Launch checklist</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {[
            "Add legal business identity and address",
            "Create a consent-backed contact list",
            "Simulate a sender-domain verification",
            "Build and review a campaign version",
          ].map((item) => (
            <div
              key={item}
              className="flex items-center gap-3 rounded-xl border border-white/8 p-4 text-sm text-slate-300"
            >
              <CheckCircle2 size={17} className="text-slate-600" />
              {item}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
