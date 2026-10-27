"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export function CreateOrganizationForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const data = new FormData(event.currentTarget);
    const response = await fetch("/api/v1/organizations", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: data.get("name"),
        slug: data.get("slug"),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
      }),
    });
    const payload = await response.json();
    if (!response.ok) {
      setError(payload.error?.message ?? "Workspace creation failed.");
      setPending(false);
      return;
    }
    router.refresh();
  }
  return (
    <form onSubmit={submit} className="mt-7 space-y-4">
      <label className="block text-sm">
        <span className="mb-2 block text-slate-300">Business or team name</span>
        <input
          name="name"
          required
          minLength={2}
          className="glass-input w-full px-4 py-3"
        />
      </label>
      <label className="block text-sm">
        <span className="mb-2 block text-slate-300">Workspace URL key</span>
        <input
          name="slug"
          required
          pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
          placeholder="acme-team"
          className="glass-input w-full px-4 py-3"
        />
        <span className="mt-2 block text-xs text-slate-500">
          Lowercase letters, numbers, and hyphens.
        </span>
      </label>
      {error && (
        <p
          role="alert"
          className="rounded-xl bg-rose-400/10 px-4 py-3 text-sm text-rose-200"
        >
          {error}
        </p>
      )}
      <button disabled={pending} className="btn-primary w-full px-4 py-3">
        {pending ? "Creating…" : "Create workspace"}
      </button>
    </form>
  );
}
