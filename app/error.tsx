"use client";

import { AlertTriangle, ArrowLeft, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[#070711] px-5 py-12 text-slate-100">
      <div
        className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(244,63,94,.12),transparent_42%)]"
        aria-hidden="true"
      />
      <section className="relative w-full max-w-xl rounded-3xl border border-white/10 bg-white/[.04] p-8 text-center shadow-2xl shadow-black/30 sm:p-10">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-rose-400/20 bg-rose-400/10 text-rose-300">
          <AlertTriangle size={28} aria-hidden="true" />
        </span>
        <p className="mt-6 text-xs font-semibold uppercase tracking-[.2em] text-rose-300">
          Unexpected error
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          We couldn&apos;t load this page
        </h1>
        <p className="mx-auto mt-4 max-w-md leading-7 text-slate-400">
          Your data was not changed. Try the request again, or return to your
          workspace if the problem continues.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold hover:bg-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-400"
          >
            <RefreshCw size={16} aria-hidden="true" />
            Try again
          </button>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 px-5 py-3 text-sm font-semibold hover:bg-white/5"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            Go to workspace
          </Link>
        </div>
        {error.digest && (
          <p className="mt-7 text-xs text-slate-600">
            Error reference: {error.digest}
          </p>
        )}
      </section>
    </main>
  );
}
