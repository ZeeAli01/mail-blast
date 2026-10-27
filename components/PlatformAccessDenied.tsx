import { ArrowLeft, LockKeyhole, Mail, ShieldAlert } from "lucide-react";
import Link from "next/link";

export function PlatformAccessDenied({ userEmail }: { userEmail: string }) {
  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[#070711] px-5 py-12 text-slate-100">
      <div
        className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(124,58,237,.18),transparent_42%)]"
        aria-hidden="true"
      />
      <section className="relative w-full max-w-xl rounded-3xl border border-white/10 bg-white/[.04] p-7 text-center shadow-2xl shadow-violet-950/30 sm:p-10">
        <Link
          href="/product"
          className="mx-auto mb-7 inline-flex items-center gap-2 font-semibold"
        >
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-violet-600">
            <Mail size={17} aria-hidden="true" />
          </span>
          MailBlast
        </Link>
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-amber-400/20 bg-amber-400/10 text-amber-300">
          <ShieldAlert size={28} aria-hidden="true" />
        </span>
        <p className="mt-6 text-xs font-semibold uppercase tracking-[.2em] text-amber-300">
          Platform access required
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          This area is restricted
        </h1>
        <p className="mx-auto mt-4 max-w-md leading-7 text-slate-400">
          You are signed in as {userEmail}, but this account is not a platform
          operator. Customer workspace access is still available.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold hover:bg-violet-500"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            Return to workspace
          </Link>
          <Link
            href="/sign-in?callbackURL=%2Fplatform"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 px-5 py-3 text-sm font-semibold hover:bg-white/5"
          >
            <LockKeyhole size={16} aria-hidden="true" />
            Use another account
          </Link>
        </div>
        <p className="mt-7 text-xs leading-5 text-slate-600">
          Platform roles must be granted through the audited owner bootstrap or
          operator-management workflow.
        </p>
      </section>
    </main>
  );
}
