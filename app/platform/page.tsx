import { requirePlatformPermission } from "@/src/server/auth/authorization";
import {
  AlertTriangle,
  Building2,
  CreditCard,
  Flag,
  Gauge,
  Shield,
  SlidersHorizontal,
} from "lucide-react";
import Link from "next/link";

const tools = [
  [
    Building2,
    "Organizations",
    "Search workspaces, inspect status, and understand support context.",
  ],
  [
    CreditCard,
    "Subscriptions",
    "Start local trials, assign immutable plan versions, restrict, restore, or cancel.",
  ],
  [
    SlidersHorizontal,
    "Entitlement overrides",
    "Preview typed per-business changes with reasons, expiry, and approval.",
  ],
  [
    Gauge,
    "Usage and reconciliation",
    "Compare ledgers, reservations, rollups, subscriptions, and effective configuration.",
  ],
  [
    Flag,
    "Feature flags",
    "Roll out capabilities globally or to selected organizations without hidden code changes.",
  ],
  [
    Shield,
    "Safety controls",
    "Stop scheduling or processing globally or by organization, sender, or campaign.",
  ],
] as const;

export default async function PlatformPage() {
  await requirePlatformPermission("platform.organizations.read");
  return (
    <main className="min-h-screen bg-[#070711] px-5 py-10 text-slate-100">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-violet-300">
              Founder control plane
            </p>
            <h1 className="mt-2 text-3xl font-semibold">Platform operations</h1>
          </div>
          <Link
            href="/dashboard"
            className="rounded-xl border border-white/10 px-4 py-2 text-sm"
          >
            Customer workspace
          </Link>
        </div>
        <div className="mt-7 flex gap-3 rounded-2xl border border-amber-400/20 bg-amber-400/[.06] p-5">
          <AlertTriangle className="shrink-0 text-amber-300" />
          <p className="text-sm leading-6 text-amber-100/75">
            Local/manual commercial mode is active. These controls change access
            and product configuration but never charge a card or send external
            email.
          </p>
        </div>
        <section className="mt-8 grid gap-4 md:grid-cols-2">
          {tools.map(([Icon, title, text]) => (
            <article
              key={title}
              className="rounded-2xl border border-white/10 bg-white/[.03] p-6"
            >
              <Icon className="text-violet-400" />
              <h2 className="mt-5 text-lg font-semibold">{title}</h2>
              <p className="mt-2 leading-7 text-slate-400">{text}</p>
              <button
                disabled
                className="mt-5 cursor-not-allowed text-sm text-slate-600"
              >
                Select an organization in the operator API
              </button>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
