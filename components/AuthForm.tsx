"use client";

import { authClient } from "@/src/lib/auth-client";
import { LoaderCircle, Mail } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export function AuthForm({ mode }: { mode: "sign-in" | "sign-up" }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const signingUp = mode === "sign-up";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email"));
    const password = String(data.get("password"));
    const result = signingUp
      ? await authClient.signUp.email({
          email,
          password,
          name: String(data.get("name")),
          callbackURL: "/dashboard",
        })
      : await authClient.signIn.email({
          email,
          password,
          callbackURL: "/dashboard",
        });
    if (result.error) {
      setError(result.error.message ?? "Authentication failed.");
      setPending(false);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#070711] px-4 py-12">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[.04] p-7 shadow-2xl shadow-violet-950/40">
        <Link
          href="/product"
          className="mb-8 inline-flex items-center gap-2 font-semibold"
        >
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-violet-600">
            <Mail size={17} />
          </span>
          MailBlast
        </Link>
        <h1 className="text-2xl font-semibold">
          {signingUp ? "Create your account" : "Welcome back"}
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          {signingUp
            ? "Verification is captured locally during this beta."
            : "Sign in to your campaign workspace."}
        </p>
        <form onSubmit={submit} className="mt-7 space-y-4">
          {signingUp && (
            <label className="block text-sm">
              <span className="mb-2 block text-slate-300">Full name</span>
              <input
                name="name"
                required
                autoComplete="name"
                className="glass-input w-full px-4 py-3"
              />
            </label>
          )}
          <label className="block text-sm">
            <span className="mb-2 block text-slate-300">Email address</span>
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              className="glass-input w-full px-4 py-3"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-2 block text-slate-300">Password</span>
            <input
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete={signingUp ? "new-password" : "current-password"}
              className="glass-input w-full px-4 py-3"
            />
          </label>
          {error && (
            <p
              role="alert"
              className="rounded-xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200"
            >
              {error}
            </p>
          )}
          <button
            disabled={pending}
            className="btn-primary flex w-full items-center justify-center gap-2 px-4 py-3"
          >
            {pending && <LoaderCircle size={16} className="animate-spin" />}
            {signingUp ? "Create account" : "Sign in"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-400">
          {signingUp ? "Already have an account?" : "New to MailBlast?"}{" "}
          <Link
            className="text-violet-300"
            href={signingUp ? "/sign-in" : "/sign-up"}
          >
            {signingUp ? "Sign in" : "Create one"}
          </Link>
        </p>
      </div>
    </main>
  );
}
