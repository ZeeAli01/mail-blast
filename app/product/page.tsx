import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Check,
  FileCheck2,
  Gauge,
  LockKeyhole,
  Mail,
  ShieldCheck,
  UsersRound,
} from "lucide-react";

const outcomes = [
  [
    UsersRound,
    "One workspace, every team",
    "Owners, editors, approvers, analysts, and billing managers get only the access their work needs.",
  ],
  [
    FileCheck2,
    "Consent before campaigns",
    "Contacts carry proof of consent, suppression is checked at delivery time, and every change is auditable.",
  ],
  [
    Gauge,
    "Limits you control",
    "Plans, trials, quotas, policies, and temporary business-specific overrides live in the founder control plane.",
  ],
  [
    BarChart3,
    "Reports people can act on",
    "Preflight, exclusions, attempts, and outcomes support useful operational decisions.",
  ],
] as const;

export default function ProductPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#070711] text-slate-100">
      <div className="absolute inset-x-0 top-0 h-[680px] bg-[radial-gradient(circle_at_50%_-20%,rgba(124,58,237,.35),transparent_58%)]" />
      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-5 py-6 lg:px-8">
        <Link href="/product" className="flex items-center gap-3 font-semibold">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-violet-600">
            <Mail size={19} />
          </span>
          MailBlast
        </Link>
        <nav className="flex items-center gap-3">
          <Link href="/" className="hidden text-sm text-slate-300 sm:block">
            Safe demo
          </Link>
          <Link
            href="/sign-in"
            className="rounded-xl border border-white/10 px-4 py-2 text-sm"
          >
            Sign in
          </Link>
          <Link
            href="/sign-up"
            className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold"
          >
            Create workspace
          </Link>
        </nav>
      </header>
      <section className="relative z-10 mx-auto grid max-w-7xl gap-14 px-5 pb-24 pt-20 lg:grid-cols-[1.05fr_.95fr] lg:px-8 lg:pt-28">
        <div>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-medium text-emerald-200">
            <ShieldCheck size={14} />
            Free-first private beta · real sending remains off
          </div>
          <h1 className="text-5xl font-semibold leading-[1.03] tracking-[-.045em] text-white sm:text-6xl lg:text-7xl">
            Serious campaign operations, without the chaos.
          </h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-300">
            Build permission-based email campaigns with clear ownership,
            approval, audience safety, and business-level controls—from a solo
            operator to a large team.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link
              href="/sign-up"
              className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 font-semibold"
            >
              Start the local beta <ArrowRight size={17} />
            </Link>
            <Link
              href="/"
              className="rounded-xl border border-white/10 bg-white/[.03] px-5 py-3 font-semibold"
            >
              Explore composer
            </Link>
          </div>
          <p className="mt-4 text-xs text-slate-500">
            No card collection. No external delivery. Enable providers only
            after compliance and readiness approval.
          </p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/[.045] p-6 shadow-2xl shadow-violet-950/40 backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-5">
            <div>
              <p className="text-xs uppercase tracking-[.18em] text-violet-300">
                Campaign preflight
              </p>
              <h2 className="mt-2 text-xl font-semibold">
                October product update
              </h2>
            </div>
            <span className="rounded-full bg-amber-400/10 px-3 py-1 text-xs text-amber-200">
              Needs review
            </span>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3">
            {[
              ["Eligible", "8,420"],
              ["Excluded safely", "183"],
              ["Monthly remaining", "41,580"],
              ["Version", "v7"],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-2xl border border-white/10 bg-black/20 p-4"
              >
                <p className="text-xs text-slate-500">{label}</p>
                <p className="mt-1 text-xl font-semibold">{value}</p>
              </div>
            ))}
          </div>
          <div className="mt-5 space-y-3">
            {[
              "Sender identity simulated and ready",
              "Legal footer and unsubscribe present",
              "Audience is within controlled limits",
            ].map((item) => (
              <div
                key={item}
                className="flex items-center gap-3 rounded-xl bg-emerald-400/[.06] px-4 py-3 text-sm text-emerald-100"
              >
                <Check size={16} className="text-emerald-400" />
                {item}
              </div>
            ))}
          </div>
          <button
            disabled
            className="mt-5 w-full cursor-not-allowed rounded-xl bg-white/10 px-4 py-3 text-sm font-semibold text-slate-400"
          >
            Capture delivery available after local setup
          </button>
        </div>
      </section>
      <section className="relative mx-auto max-w-7xl px-5 py-24 lg:px-8">
        <p className="text-sm font-semibold text-violet-300">
          Built for accountable growth
        </p>
        <h2 className="mt-3 max-w-3xl text-3xl font-semibold sm:text-4xl">
          Useful for the person doing the work—and controllable by the business.
        </h2>
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {outcomes.map(([Icon, title, text]) => (
            <article
              key={title}
              className="rounded-2xl border border-white/10 bg-white/[.025] p-6"
            >
              <Icon className="text-violet-400" />
              <h3 className="mt-5 text-lg font-semibold">{title}</h3>
              <p className="mt-2 leading-7 text-slate-400">{text}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="relative mx-auto max-w-7xl px-5 pb-28 lg:px-8">
        <div className="rounded-3xl border border-white/10 bg-violet-950/40 p-8">
          <LockKeyhole className="text-violet-300" />
          <h2 className="mt-5 text-3xl font-semibold">
            A complete workflow, not a risky send form.
          </h2>
          <p className="mt-4 max-w-3xl leading-7 text-slate-300">
            Every campaign is versioned. Approval applies to one exact version.
            Scheduling creates a stable audience snapshot, and suppression is
            checked again before capture.
          </p>
        </div>
      </section>
    </main>
  );
}
