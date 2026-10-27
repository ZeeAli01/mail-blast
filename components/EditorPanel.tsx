"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Code2,
  Eye,
  AlignLeft,
  Bold,
  Italic,
  Link2,
  List,
  Heading1,
  Heading2,
  Image as ImageIcon,
  Minus,
  Quote,
  RotateCcw,
} from "lucide-react";
import { cn, countWords, pluralize } from "@/lib/utils";

export type ContentType = "text" | "html";
export type EditorMode = "write" | "preview";

interface EditorPanelProps {
  value: string;
  onChange: (value: string) => void;
  contentType: ContentType;
  onContentTypeChange: (type: ContentType) => void;
}

interface FormatAction {
  icon: React.ReactNode;
  label: string;
  insertFn: (selected: string) => [string, number, number];
}

const htmlFormatActions: FormatAction[] = [
  {
    icon: <Bold size={13} />,
    label: "Bold",
    insertFn: (sel) => [
      `<strong>${sel || "bold text"}</strong>`,
      8,
      sel ? 8 + sel.length : 17,
    ],
  },
  {
    icon: <Italic size={13} />,
    label: "Italic",
    insertFn: (sel) => [
      `<em>${sel || "italic text"}</em>`,
      4,
      sel ? 4 + sel.length : 15,
    ],
  },
  {
    icon: <Heading1 size={13} />,
    label: "H1",
    insertFn: (sel) => [
      `<h1>${sel || "Heading 1"}</h1>`,
      4,
      sel ? 4 + sel.length : 13,
    ],
  },
  {
    icon: <Heading2 size={13} />,
    label: "H2",
    insertFn: (sel) => [
      `<h2>${sel || "Heading 2"}</h2>`,
      4,
      sel ? 4 + sel.length : 13,
    ],
  },
  {
    icon: <Link2 size={13} />,
    label: "Link",
    insertFn: (sel) => [
      `<a href="https://example.com">${sel || "link text"}</a>`,
      9,
      28,
    ],
  },
  {
    icon: <List size={13} />,
    label: "List",
    insertFn: () => [
      `<ul>\n  <li>Item 1</li>\n  <li>Item 2</li>\n</ul>`,
      6,
      14,
    ],
  },
  {
    icon: <Quote size={13} />,
    label: "Quote",
    insertFn: (sel) => [
      `<blockquote>${sel || "Quote text"}</blockquote>`,
      12,
      sel ? 12 + sel.length : 22,
    ],
  },
  {
    icon: <ImageIcon size={13} />,
    label: "Image",
    insertFn: () => [
      `<img src="https://example.com/image.jpg" alt="Description" />`,
      10,
      42,
    ],
  },
  {
    icon: <Minus size={13} />,
    label: "Divider",
    insertFn: () => [`\n<hr />\n`, 1, 1],
  },
];

export default function EditorPanel({
  value,
  onChange,
  contentType,
  onContentTypeChange,
}: EditorPanelProps) {
  const [mode, setMode] = useState<EditorMode>("write");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const wordCount = countWords(value);
  const charCount = value.length;

  const insertFormat = (action: FormatAction) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = value.slice(start, end);
    const [snippet, cursorStart, cursorEnd] = action.insertFn(selected);
    const newValue = value.slice(0, start) + snippet + value.slice(end);
    onChange(newValue);
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(start + cursorStart, start + cursorEnd);
    });
  };

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.max(220, ta.scrollHeight)}px`;
  }, [value]);

  const htmlTemplates = [
    {
      label: "Welcome Email",
      template: `<h1>Welcome! 🎉</h1>\n<p>Hi there,</p>\n<p>We're thrilled to have you on board. Here's what you can do next:</p>\n<ul>\n  <li>Explore our features</li>\n  <li>Complete your profile</li>\n  <li>Connect with your team</li>\n</ul>\n<p>Best regards,<br/><strong>The Team</strong></p>`,
    },
    {
      label: "Newsletter",
      template: `<h1>Monthly Newsletter 📬</h1>\n<hr />\n<h2>What's New</h2>\n<p>Here are the highlights from this month...</p>\n<h2>Featured Article</h2>\n<p>Read our latest post on <a href="#">getting started</a>.</p>\n<hr />\n<p style="font-size:12px;color:#888">You're receiving this because you subscribed. <a href="#">Unsubscribe</a></p>`,
    },
    {
      label: "Announcement",
      template: `<h1>📢 Important Announcement</h1>\n<p>Dear valued customer,</p>\n<p>We are excited to announce something big is coming your way.</p>\n<blockquote>This is a game-changer for our community.</blockquote>\n<p>Stay tuned for more details.</p>\n<p>Warm regards,<br/><strong>The Team</strong></p>`,
    },
  ];

  return (
    <div className="space-y-1.5">
      {/* Header row */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <label className="label flex items-center gap-2">
          <AlignLeft size={11} className="text-violet-400" />
          CONTENT
        </label>

        <div className="flex items-center gap-2">
          {/* Content type toggle */}
          <div className="flex items-center bg-white/[0.04] border border-white/[0.08] rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => onContentTypeChange("text")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200",
                contentType === "text"
                  ? "bg-violet-600 text-white shadow"
                  : "text-white/50 hover:text-white/80",
              )}
            >
              <AlignLeft size={11} />
              Plain Text
            </button>
            <button
              type="button"
              onClick={() => onContentTypeChange("html")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200",
                contentType === "html"
                  ? "bg-violet-600 text-white shadow"
                  : "text-white/50 hover:text-white/80",
              )}
            >
              <Code2 size={11} />
              HTML
            </button>
          </div>

          {/* Write / Preview toggle (HTML only) */}
          {contentType === "html" && (
            <div className="flex items-center bg-white/[0.04] border border-white/[0.08] rounded-lg p-0.5">
              <button
                type="button"
                onClick={() => setMode("write")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200",
                  mode === "write"
                    ? "bg-white/10 text-white"
                    : "text-white/50 hover:text-white/80",
                )}
              >
                <Code2 size={11} />
                Write
              </button>
              <button
                type="button"
                onClick={() => setMode("preview")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200",
                  mode === "preview"
                    ? "bg-white/10 text-white"
                    : "text-white/50 hover:text-white/80",
                )}
              >
                <Eye size={11} />
                Preview
              </button>
            </div>
          )}

          {/* Clear button */}
          {value && (
            <button
              type="button"
              onClick={() => onChange("")}
              className="p-1.5 rounded-lg text-white/30 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
              title="Clear content"
            >
              <RotateCcw size={12} />
            </button>
          )}
        </div>
      </div>

      {/* HTML Quick Templates */}
      {contentType === "html" && !value && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-white/25">Quick start:</span>
          {htmlTemplates.map((t) => (
            <button
              key={t.label}
              type="button"
              onClick={() => onChange(t.template)}
              className="text-xs px-2.5 py-1 rounded-lg bg-violet-500/10 border border-violet-500/20
                         text-violet-300 hover:bg-violet-500/20 transition-all"
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {/* HTML Toolbar */}
      {contentType === "html" && mode === "write" && (
        <div className="flex items-center gap-1 flex-wrap p-1.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
          {htmlFormatActions.map((action) => (
            <button
              key={action.label}
              type="button"
              onClick={() => insertFormat(action)}
              title={action.label}
              className="p-1.5 rounded-lg text-white/50 hover:text-violet-300 hover:bg-violet-500/15
                         transition-all duration-150 flex items-center justify-center"
            >
              {action.icon}
            </button>
          ))}
        </div>
      )}

      {/* Editor / Preview */}
      <AnimatePresence mode="wait">
        {contentType === "text" || mode === "write" ? (
          <motion.div
            key="editor"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={
                contentType === "html"
                  ? "<h1>Hello World</h1>\n<p>Your email content here...</p>"
                  : "Write your email message here...\n\nYou can write plain text or paste content from anywhere."
              }
              className={cn(
                "glass-input w-full min-h-[220px] px-4 py-3 text-sm leading-relaxed resize-none",
                contentType === "html" && "font-mono text-violet-200 text-xs",
              )}
              spellCheck={contentType === "text"}
            />
          </motion.div>
        ) : (
          <motion.div
            key="preview"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="glass-input min-h-[220px] px-4 py-4 overflow-auto"
          >
            {value ? (
              <div
                className="email-preview"
                dangerouslySetInnerHTML={{ __html: value }}
              />
            ) : (
              <p className="text-white/20 text-sm italic">
                No content to preview yet…
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats bar */}
      <div className="flex items-center justify-between text-xs text-white/25 px-0.5">
        <span>
          {pluralize(wordCount, "word")} · {charCount.toLocaleString()} chars
        </span>
        {contentType === "html" && mode === "write" && (
          <span className="text-violet-400/60">
            HTML mode — click Preview to see rendered output
          </span>
        )}
      </div>
    </div>
  );
}
