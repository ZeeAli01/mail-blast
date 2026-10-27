import { notFound } from "next/navigation";

const sections = {
  campaigns: [
    "Campaigns",
    "Create, version, review, approve, schedule, pause, and inspect campaign delivery.",
    "New campaign",
  ],
  contacts: [
    "Contacts & consent",
    "Manage people, lists, tags, topics, import attestations, and suppression history.",
    "Import contacts",
  ],
  templates: [
    "Templates",
    "Build accessible reusable content with protected legal and unsubscribe blocks.",
    "New template",
  ],
  reports: [
    "Reports",
    "Understand eligibility, exclusions, attempts, captures, bounces, complaints, and unsubscribes.",
    "Export report",
  ],
  team: [
    "Team & access",
    "Invite coworkers and give each person the smallest role needed for their work.",
    "Invite teammate",
  ],
  billing: [
    "Billing & usage",
    "Review your local beta plan, limits, usage, manual adjustments, and non-payable invoice previews.",
    "Request plan change",
  ],
  audit: [
    "Audit history",
    "Trace security-sensitive, commercial, membership, consent, and campaign decisions.",
    "Export audit",
  ],
  settings: [
    "Workspace settings",
    "Configure brand identity, policies, timezone, senders, topics, retention, and data exports.",
    "Save settings",
  ],
} as const;

export default async function DashboardSectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  const content = sections[section as keyof typeof sections];
  if (!content) notFound();
  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">{content[0]}</h1>
          <p className="mt-3 max-w-3xl leading-7 text-slate-400">
            {content[1]}
          </p>
        </div>
        <button
          disabled
          className="cursor-not-allowed rounded-xl bg-white/10 px-4 py-2.5 text-sm font-semibold text-slate-500"
          title="Complete workspace configuration first"
        >
          {content[2]}
        </button>
      </div>
      <div className="mt-8 rounded-2xl border border-dashed border-white/15 bg-white/[.02] px-6 py-16 text-center">
        <p className="font-medium">Nothing here yet</p>
        <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
          Complete the workspace onboarding and local database setup. Actions
          stay disabled until permissions, subscription entitlements, and
          required safety configuration all pass.
        </p>
      </div>
    </div>
  );
}
