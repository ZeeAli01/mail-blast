"use client";

import React, { useState, KeyboardEvent, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Users, AlertCircle } from "lucide-react";
import { cn, isValidEmail } from "@/lib/utils";

interface RecipientInputProps {
  recipients: string[];
  onChange: (recipients: string[]) => void;
  label?: string;
  placeholder?: string;
  maxRecipients?: number;
}

export default function RecipientInput({
  recipients,
  onChange,
  label = "TO",
  placeholder = "Add email address...",
  maxRecipients = 500,
}: RecipientInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [error, setError] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addRecipient = (raw: string) => {
    // Support pasting multiple comma/semicolon/space separated emails
    const emails = raw
      .split(/[,;\s\n]+/)
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);

    let added = 0;
    const invalid: string[] = [];
    const newRecipients = [...recipients];

    for (const email of emails) {
      if (!isValidEmail(email)) {
        invalid.push(email);
        continue;
      }
      if (newRecipients.includes(email)) continue;
      if (newRecipients.length >= maxRecipients) break;
      newRecipients.push(email);
      added++;
    }

    if (invalid.length > 0) {
      setError(
        `Invalid: ${invalid.slice(0, 2).join(", ")}${invalid.length > 2 ? "…" : ""}`,
      );
      setTimeout(() => setError(""), 3000);
    }

    if (added > 0) {
      onChange(newRecipients);
      setInputValue("");
    } else if (invalid.length === 0) {
      setInputValue("");
    }
  };

  const removeRecipient = (email: string) => {
    onChange(recipients.filter((r) => r !== email));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (["Enter", ",", ";", "Tab"].includes(e.key)) {
      e.preventDefault();
      if (inputValue.trim()) addRecipient(inputValue);
    } else if (e.key === "Backspace" && !inputValue && recipients.length > 0) {
      removeRecipient(recipients[recipients.length - 1]);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text");
    addRecipient(pasted);
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="label flex items-center gap-2">
          <Users size={11} className="text-violet-400" />
          {label}
        </label>
        <span className="text-xs text-white/25 font-mono">
          {recipients.length}/{maxRecipients}
        </span>
      </div>

      <div
        className={cn(
          "min-h-[52px] px-3 py-2 rounded-xl border transition-all duration-200 cursor-text",
          "bg-white/[0.04] flex flex-wrap gap-1.5 items-center",
          isFocused
            ? "border-violet-500/60 bg-white/[0.06] shadow-[0_0_0_3px_rgba(124,58,237,0.15)]"
            : "border-white/[0.08]",
        )}
        onClick={() => inputRef.current?.focus()}
      >
        <AnimatePresence initial={false}>
          {recipients.map((email) => (
            <motion.span
              key={email}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8, x: -5 }}
              transition={{ duration: 0.15 }}
              className="tag-chip group"
            >
              {email}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeRecipient(email);
                }}
                className="w-3.5 h-3.5 rounded-full flex items-center justify-center
                           text-violet-400 hover:text-white hover:bg-violet-500/50 transition-all"
                aria-label={`Remove ${email}`}
              >
                <X size={9} />
              </button>
            </motion.span>
          ))}
        </AnimatePresence>

        <input
          ref={inputRef}
          type="email"
          multiple
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            setIsFocused(false);
            if (inputValue.trim()) addRecipient(inputValue);
          }}
          placeholder={recipients.length === 0 ? placeholder : ""}
          className="flex-1 min-w-[180px] bg-transparent text-sm text-white placeholder-white/30
                     focus:outline-none py-0.5"
        />

        {inputValue.trim() && (
          <button
            type="button"
            onClick={() => addRecipient(inputValue)}
            className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300
                       bg-violet-500/10 hover:bg-violet-500/20 px-2 py-1 rounded-lg transition-all"
          >
            <Plus size={11} />
            Add
          </button>
        )}
      </div>

      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="flex items-center gap-1.5 text-xs text-rose-400"
          >
            <AlertCircle size={11} />
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      {recipients.length > 0 && (
        <p className="text-xs text-white/25">
          Press{" "}
          <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-[10px]">
            Enter
          </kbd>{" "}
          or{" "}
          <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-[10px]">
            ,
          </kbd>{" "}
          to add · paste multiple at once · backspace to remove last
        </p>
      )}
    </div>
  );
}
