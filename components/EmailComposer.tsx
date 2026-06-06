"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import {
  Send, ChevronDown, ChevronUp, Paperclip,
  MailCheck, Loader2, X, Settings, Eye, EyeOff
} from "lucide-react";
import RecipientInput from "./RecipientInput";
import EditorPanel, { ContentType } from "./EditorPanel";
import { cn, isValidEmail } from "@/lib/utils";

interface EmailForm {
  recipients: string[];
  cc: string[];
  bcc: string[];
  subject: string;
  content: string;
  contentType: ContentType;
  fromName: string;
  replyTo: string;
}

const initialForm: EmailForm = {
  recipients: [],
  cc: [],
  bcc: [],
  subject: "",
  content: "",
  contentType: "text",
  fromName: "",
  replyTo: "",
};

export default function EmailComposer() {
  const [form, setForm] = useState<EmailForm>(initialForm);
  const [showCcBcc, setShowCcBcc] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const updateField = <K extends keyof EmailForm>(key: K, val: EmailForm[K]) =>
    setForm((f) => ({ ...f, [key]: val }));

  const totalRecipients =
    form.recipients.length + form.cc.length + form.bcc.length;

  const isValid =
    form.recipients.length > 0 &&
    form.subject.trim().length > 0 &&
    form.content.trim().length > 0;

  const handleSend = async () => {
    if (!isValid || sending) return;

    setSending(true);
    const toastId = toast.loading(
      `Sending to ${totalRecipients} recipient${totalRecipients !== 1 ? "s" : ""}…`
    );

    try {
      const res = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipients: form.recipients,
          cc: form.cc,
          bcc: form.bcc,
          subject: form.subject,
          content: form.content,
          contentType: form.contentType,
          fromName: form.fromName,
          replyTo: form.replyTo,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        toast.success(
          `✅ Sent to ${totalRecipients} recipient${totalRecipients !== 1 ? "s" : ""}!`,
          { id: toastId, duration: 4000 }
        );
        setSent(true);
        setTimeout(() => setSent(false), 4000);
      } else {
        throw new Error(data.error || "Failed to send email");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      toast.error(`❌ ${message}`, { id: toastId, duration: 5000 });
    } finally {
      setSending(false);
    }
  };

  const handleReset = () => {
    setForm(initialForm);
    setShowCcBcc(false);
    setShowSettings(false);
    setSent(false);
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="glass-card p-6 md:p-8 space-y-6">

        {/* To */}
        <RecipientInput
          recipients={form.recipients}
          onChange={(r) => updateField("recipients", r)}
        />

        {/* CC / BCC toggle */}
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => setShowCcBcc(!showCcBcc)}
            className="flex items-center gap-1.5 text-xs text-white/35 hover:text-violet-400 transition-colors"
          >
            {showCcBcc ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            {showCcBcc ? "Hide" : "Add"} CC / BCC
          </button>

          <AnimatePresence>
            {showCcBcc && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-4 overflow-hidden"
              >
                <RecipientInput
                  label="CC"
                  recipients={form.cc}
                  onChange={(r) => updateField("cc", r)}
                  placeholder="Carbon copy recipients…"
                />
                <RecipientInput
                  label="BCC"
                  recipients={form.bcc}
                  onChange={(r) => updateField("bcc", r)}
                  placeholder="Blind carbon copy recipients…"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="h-px bg-white/[0.05]" />

        {/* Subject */}
        <div className="space-y-1.5">
          <label className="label">SUBJECT</label>
          <input
            type="text"
            value={form.subject}
            onChange={(e) => updateField("subject", e.target.value)}
            placeholder="Email subject line…"
            className="glass-input w-full px-4 py-3 text-sm"
          />
          {form.subject && (
            <p className="text-xs text-white/25 px-0.5">
              {form.subject.length} chars
              {form.subject.length > 60 && (
                <span className="text-amber-400/60 ml-2">
                  · Long subjects may be truncated on mobile
                </span>
              )}
            </p>
          )}
        </div>

        {/* Email Body */}
        <EditorPanel
          value={form.content}
          onChange={(v) => updateField("content", v)}
          contentType={form.contentType}
          onContentTypeChange={(t) => updateField("contentType", t)}
        />

        {/* Sender Settings (optional) */}
        <div>
          <button
            type="button"
            onClick={() => setShowSettings(!showSettings)}
            className={cn(
              "flex items-center gap-1.5 text-xs transition-colors",
              showSettings ? "text-violet-400" : "text-white/35 hover:text-white/60"
            )}
          >
            <Settings size={11} />
            {showSettings ? "Hide" : "Show"} sender settings
            {showSettings ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
          </button>

          <AnimatePresence>
            {showSettings && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="label">FROM NAME</label>
                    <input
                      type="text"
                      value={form.fromName}
                      onChange={(e) => updateField("fromName", e.target.value)}
                      placeholder="Your Name or Company"
                      className="glass-input w-full px-4 py-3 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="label">REPLY-TO</label>
                    <input
                      type="email"
                      value={form.replyTo}
                      onChange={(e) => updateField("replyTo", e.target.value)}
                      placeholder="reply@example.com"
                      className="glass-input w-full px-4 py-3 text-sm"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="h-px bg-white/[0.05]" />

        {/* Summary + Send */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="text-sm text-white/40 space-y-0.5">
            {totalRecipients > 0 ? (
              <p>
                <span className="text-white/70 font-semibold">{totalRecipients}</span>
                {" "}recipient{totalRecipients !== 1 ? "s" : ""}
                {form.cc.length > 0 && (
                  <span className="text-white/30"> · {form.cc.length} CC</span>
                )}
                {form.bcc.length > 0 && (
                  <span className="text-white/30"> · {form.bcc.length} BCC</span>
                )}
              </p>
            ) : (
              <p className="text-white/25">No recipients yet</p>
            )}
            <p className="text-xs">
              {form.contentType === "html" ? "HTML" : "Plain text"} email
            </p>
          </div>

          <div className="flex items-center gap-3">
            {(form.recipients.length > 0 || form.content) && (
              <button
                type="button"
                onClick={handleReset}
                className="text-xs text-white/30 hover:text-rose-400 transition-colors flex items-center gap-1"
              >
                <X size={11} />
                Clear all
              </button>
            )}

            <button
              type="button"
              onClick={handleSend}
              disabled={!isValid || sending}
              className={cn(
                "btn-primary flex items-center gap-2.5 px-6 py-3 text-sm",
                sent && "from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500"
              )}
            >
              {sending ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Sending…
                </>
              ) : sent ? (
                <>
                  <MailCheck size={15} />
                  Sent!
                </>
              ) : (
                <>
                  <Send size={15} />
                  Send Email
                  {totalRecipients > 0 && (
                    <span className="bg-white/20 rounded-full px-2 py-0.5 text-xs font-bold">
                      {totalRecipients}
                    </span>
                  )}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Validation hints */}
        {!isValid && (form.recipients.length > 0 || form.subject || form.content) && (
          <div className="flex flex-wrap gap-2">
            {form.recipients.length === 0 && (
              <span className="text-xs text-amber-400/70 bg-amber-400/10 px-2.5 py-1 rounded-full">
                Add at least one recipient
              </span>
            )}
            {!form.subject.trim() && (
              <span className="text-xs text-amber-400/70 bg-amber-400/10 px-2.5 py-1 rounded-full">
                Subject is required
              </span>
            )}
            {!form.content.trim() && (
              <span className="text-xs text-amber-400/70 bg-amber-400/10 px-2.5 py-1 rounded-full">
                Email body is empty
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
