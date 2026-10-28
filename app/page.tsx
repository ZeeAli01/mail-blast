"use client";

import React from "react";
import { Toaster } from "react-hot-toast";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Building2,
  Eye,
  Mail,
  PanelsTopLeft,
  Radar,
  Send,
  ShieldCheck,
} from "lucide-react";
import EmailComposer from "@/components/EmailComposer";
import Link from "next/link";

const features = [
  { icon: <PanelsTopLeft size={14} />, label: "Campaign composer" },
  { icon: <Eye size={14} />, label: "Responsive preview" },
  { icon: <ShieldCheck size={14} />, label: "Sending disabled safely" },
];

const workflow = [
  [
    Radar,
    "Discover with evidence",
    "Search approved sources and first-party intent with keywords and ICP filters.",
  ],
  [
    BadgeCheck,
    "Qualify without guessing",
    "Keep permission, deliverability, intent, fit, risk, and recency separate.",
  ],
  [
    Send,
    "Run governed campaigns",
    "Freeze versions, approve audiences, schedule safely, and retain exclusion reasons.",
  ],
  [
    BarChart3,
    "Learn from outcomes",
    "Trace recipient attempts, replies, bounces, complaints, opt-outs, and conversions.",
  ],
] as const;

const playbooks = [
  ["Inbound nurture", "Permissioned form or content request"],
  ["Demo follow-up", "Demo request or meeting signal"],
  ["Trial onboarding", "Account or trial creation"],
  ["Activation", "Permissioned product event"],
  ["Renewal", "Customer renewal window"],
  ["Churn prevention", "Usage or support risk"],
] as const;

export default function HomePage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden">
      {/* Background orbs */}
      <div
        className="bg-orb w-[600px] h-[600px] bg-violet-600/20 top-[-200px] left-[-150px]"
        aria-hidden="true"
      />
      <div
        className="bg-orb w-[500px] h-[500px] bg-purple-600/15 top-[30%] right-[-200px]"
        aria-hidden="true"
      />
      <div
        className="bg-orb w-[400px] h-[400px] bg-indigo-600/10 bottom-[-100px] left-[20%]"
        aria-hidden="true"
      />

      {/* Grid overlay */}
      <div
        className="fixed inset-0 bg-grid-pattern bg-grid-size opacity-100 pointer-events-none"
        aria-hidden="true"
      />

      <header className="relative z-20 mx-auto flex max-w-7xl items-center justify-between px-5 py-5 lg:px-8">
        <Link
          href="/"
          className="flex items-center gap-3 font-semibold text-white"
        >
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-violet-600">
            <Mail size={18} />
          </span>
          <span className="hidden sm:inline">MailBlast</span>
        </Link>
        <nav
          className="hidden items-center gap-6 text-sm text-slate-400 md:flex"
          aria-label="Main navigation"
        >
          <a href="#workflow" className="hover:text-white">
            Workflow
          </a>
          <a href="#playbooks" className="hover:text-white">
            Playbooks
          </a>
          <a href="#safety" className="hover:text-white">
            Safety
          </a>
          <Link href="/product" className="hover:text-white">
            Product
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          <Link
            href="/sign-in"
            className="hidden rounded-xl px-3 py-2 text-sm text-slate-300 hover:bg-white/5 sm:inline-flex"
          >
            Sign in
          </Link>
          <Link
            href="/sign-up"
            className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500"
          >
            <span className="sm:hidden">Create</span>
            <span className="hidden sm:inline">Create workspace</span>
          </Link>
        </div>
      </header>

      <div className="relative z-10 flex flex-col items-center px-4 pb-16 pt-12 sm:pt-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          {/* Logo */}
          <div
            className="inline-flex items-center justify-center w-14 h-14 rounded-2xl
                          bg-gradient-to-br from-violet-600 to-purple-700
                          shadow-[0_0_40px_rgba(124,58,237,0.5)] mb-5"
          >
            <Mail size={26} className="text-white" />
          </div>

          {/* Badge */}
          <div
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full
                          bg-violet-500/10 border border-violet-500/20
                          text-violet-300 text-xs font-medium mb-4"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            Public demo
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-3 tracking-tight">
            Mail
            <span className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
              Blast
            </span>
          </h1>

          <p className="text-white/55 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            Turn permissioned intent into organized SaaS campaigns with
            traceable sources, evidence-led qualification, controlled delivery,
            and per-recipient history.
          </p>

          {/* Feature pills */}
          <div className="flex items-center justify-center gap-3 flex-wrap mt-5">
            {features.map((f) => (
              <span
                key={f.label}
                className="inline-flex items-center gap-1.5 text-xs text-white/40
                           bg-white/[0.04] border border-white/[0.06] px-3 py-1.5 rounded-full"
              >
                <span className="text-violet-400">{f.icon}</span>
                {f.label}
              </span>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/sign-up"
              className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white hover:bg-violet-500"
            >
              Start a workspace <ArrowRight size={16} />
            </Link>
            <Link
              href="/product"
              className="rounded-xl border border-white/10 bg-white/[.03] px-5 py-3 text-sm font-semibold text-slate-200 hover:bg-white/[.06]"
            >
              Explore the product
            </Link>
          </div>
        </motion.div>

        {/* Main Composer */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="w-full max-w-3xl"
        >
          <EmailComposer />
        </motion.div>

        <section id="workflow" className="mt-28 w-full max-w-7xl scroll-mt-8">
          <p className="text-center text-sm font-semibold text-violet-300">
            One accountable workflow
          </p>
          <h2 className="mx-auto mt-3 max-w-3xl text-center text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            From a real signal to a measurable business outcome.
          </h2>
          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {workflow.map(([Icon, title, text], index) => (
              <article
                key={title}
                className="rounded-2xl border border-white/10 bg-white/[.025] p-6 text-left"
              >
                <div className="flex items-center justify-between">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-violet-500/10 text-violet-300">
                    <Icon size={19} />
                  </span>
                  <span className="text-xs font-semibold text-slate-600">
                    0{index + 1}
                  </span>
                </div>
                <h3 className="mt-6 text-lg font-semibold text-white">
                  {title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-slate-400">{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section
          id="playbooks"
          className="mt-28 grid w-full max-w-7xl scroll-mt-8 gap-10 lg:grid-cols-[.8fr_1.2fr]"
        >
          <div className="text-left">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-purple-500/10 text-purple-300">
              <Building2 size={22} />
            </span>
            <p className="mt-6 text-sm font-semibold text-violet-300">
              SaaS campaign playbooks
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">
              Begin with the customer moment—not a blank blast.
            </h2>
            <p className="mt-5 leading-7 text-slate-400">
              Each playbook defines its entry signal, permission requirement,
              goal, stop condition, cadence, and reporting contract.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {playbooks.map(([name, signal]) => (
              <article
                key={name}
                className="rounded-2xl border border-white/10 bg-white/[.025] p-5 text-left transition hover:border-violet-400/25 hover:bg-violet-400/[.04]"
              >
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/5 text-violet-300">
                    <ShieldCheck size={17} />
                  </span>
                  <h3 className="font-semibold text-white">{name}</h3>
                </div>
                <p className="mt-4 text-xs uppercase tracking-wider text-slate-600">
                  Required entry signal
                </p>
                <p className="mt-1 text-sm text-slate-300">{signal}</p>
              </article>
            ))}
          </div>
        </section>

        <section
          id="safety"
          className="mt-28 grid w-full max-w-7xl scroll-mt-8 gap-4 md:grid-cols-3"
        >
          {[
            [
              "Evidence, not hype",
              "Source, permission, verification, intent, fit, risk, and recency stay visible as separate facts.",
            ],
            [
              "Safety is executable",
              "Suppression, sender readiness, limits, approvals, and kill switches run as hard policy gates.",
            ],
            [
              "Business-controlled",
              "Plans, trials, quotas, team access, overrides, and restrictions belong to a protected founder control plane.",
            ],
          ].map(([title, text]) => (
            <article
              key={title}
              className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/[.04] to-white/[.015] p-7 text-left"
            >
              <ShieldCheck className="text-violet-300" />
              <h3 className="mt-6 text-xl font-semibold text-white">{title}</h3>
              <p className="mt-3 leading-7 text-slate-400">{text}</p>
            </article>
          ))}
        </section>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-10 text-xs text-white/20 text-center"
        >
          Free-first product development · Built with Next.js
        </motion.p>
      </div>

      {/* Toast notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "rgba(15, 10, 30, 0.95)",
            color: "#e2e8f0",
            border: "1px solid rgba(139,92,246,0.25)",
            backdropFilter: "blur(20px)",
            borderRadius: "12px",
            fontSize: "13px",
            padding: "12px 16px",
          },
          success: {
            iconTheme: { primary: "#34d399", secondary: "#064e3b" },
          },
          error: {
            iconTheme: { primary: "#f87171", secondary: "#450a0a" },
          },
        }}
      />
    </div>
  );
}
