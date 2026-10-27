import { ArrowLeft, Compass, Mail } from "lucide-react";
import Link from "next/link";

export default function NotFoundPage() {
  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[#070711] px-5 py-12 text-slate-100">
      <div
        className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(124,58,237,.18),transparent_42%)]"
        aria-hidden="true"
      />
      <section className="relative w-full max-w-xl rounded-3xl border border-white/10 bg-white/[.04] p-8 text-center sm:p-10">
        <Link
          href="/product"
          className="mx-auto mb-7 inline-flex items-center gap-2 font-semibold"
        >
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-violet-600">
            <Mail size={17} aria-hidden="true" />
          </span>
          MailBlast
        </Link>
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-violet-400/20 bg-violet-400/10 text-violet-300">
          <Compass size={28} aria-hidden="true" />
        </span>
        <p className="mt-6 text-xs font-semibold uppercase tracking-[.2em] text-violet-300">
          404 · Page not found
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          This route doesn&apos;t exist
        </h1>
        <p className="mx-auto mt-4 max-w-md leading-7 text-slate-400">
          The page may have moved, or the address may be incomplete. Return to
          your workspace and continue from there.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold hover:bg-violet-500"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            Go to workspace
          </Link>
          <Link
            href="/product"
            className="rounded-xl border border-white/10 px-5 py-3 text-sm font-semibold hover:bg-white/5"
          >
            Product home
          </Link>
        </div>
      </section>
    </main>
  );
}
