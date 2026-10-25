"use client";

import React from "react";
import { Toaster } from "react-hot-toast";
import { motion } from "framer-motion";
import { Mail, Zap, Globe, Shield } from "lucide-react";
import EmailComposer from "@/components/EmailComposer";

const features = [
  { icon: <Zap size={14} />, label: "Instant delivery" },
  { icon: <Globe size={14} />, label: "Unlimited recipients" },
  { icon: <Shield size={14} />, label: "Secure & private" },
];

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

      <div className="relative z-10 flex flex-col items-center px-4 py-12 sm:py-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          {/* Logo */}
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl
                          bg-gradient-to-br from-violet-600 to-purple-700
                          shadow-[0_0_40px_rgba(124,58,237,0.5)] mb-5">
            <Mail size={26} className="text-white" />
          </div>

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full
                          bg-violet-500/10 border border-violet-500/20
                          text-violet-300 text-xs font-medium mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            Public demo
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-3 tracking-tight">
            Mail
            <span className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
              Blast
            </span>
          </h1>

          <p className="text-white/50 text-base sm:text-lg max-w-md mx-auto leading-relaxed">
            Compose and send beautiful emails — plain text or full HTML — to any
            number of recipients in seconds.
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

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-10 text-xs text-white/20 text-center"
        >
          Powered by Python · Next.js · Deployed on Vercel
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
