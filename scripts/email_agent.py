#!/usr/bin/env python3
"""
MailBlast CLI Email Agent
=========================
Standalone Python script to send emails to multiple recipients.
Supports plain text and HTML content from files or inline strings.

Usage:
  python email_agent.py --to user@a.com user@b.com --subject "Hello" --body "Hi there!"
  python email_agent.py --to-file recipients.txt --subject "Newsletter" --html-file email.html
  python email_agent.py --config config.json

Setup:
  1. Copy .env.example to .env and fill in SMTP credentials
     OR set environment variables directly.
  2. pip install python-dotenv  (optional, for .env file support)
"""

import argparse
import json
import os
import re
import smtplib
import ssl
import sys
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.utils import formataddr
from pathlib import Path

# Optional: load .env file
try:
    from dotenv import load_dotenv
    load_dotenv()
    print("✓ Loaded environment from .env file")
except ImportError:
    pass  # python-dotenv not installed, use system env vars


# ─── Config ────────────────────────────────────────────────────────────────────

def get_config(config_file: str | None = None) -> dict:
    """Load SMTP config from JSON file, then env vars as override."""
    cfg = {
        "smtp_host": "smtp.gmail.com",
        "smtp_port": 587,
        "smtp_user": "",
        "smtp_pass": "",
        "from_name": "MailBlast",
        "reply_to": "",
    }

    if config_file and Path(config_file).exists():
        with open(config_file, "r") as f:
            file_cfg = json.load(f)
        cfg.update(file_cfg)
        print(f"✓ Loaded config from {config_file}")

    # Environment variables always win
    env_map = {
        "SMTP_HOST": "smtp_host",
        "SMTP_PORT": "smtp_port",
        "SMTP_USER": "smtp_user",
        "SMTP_PASS": "smtp_pass",
        "FROM_NAME": "from_name",
        "REPLY_TO":  "reply_to",
    }
    for env_key, cfg_key in env_map.items():
        val = os.environ.get(env_key)
        if val:
            cfg[cfg_key] = int(val) if cfg_key == "smtp_port" else val

    return cfg


# ─── Helpers ───────────────────────────────────────────────────────────────────

def load_recipients_from_file(filepath: str) -> list[str]:
    """Load email addresses from a text file (one per line, or CSV)."""
    emails = []
    with open(filepath, "r") as f:
        for raw_line in f:
            line = raw_line.strip()
            if not line or line.startswith("#"):
                continue
            # Support comma/semicolon separated on same line
            parts = re.split(r"[,;\s]+", line)
            for part in parts:
                part = part.strip().lower()
                if part and is_valid_email(part):
                    emails.append(part)
                elif part:
                    print(f"  ⚠ Skipping invalid email: {part}", file=sys.stderr)
    return list(dict.fromkeys(emails))  # deduplicate preserving order


def is_valid_email(email: str) -> bool:
    return bool(re.match(r"^[^\s@]+@[^\s@]+\.[^\s@]+$", email))


def strip_html(html: str) -> str:
    """Very basic HTML tag stripper for plain-text fallback."""
    text = re.sub(r"<[^>]+>", "", html)
    return re.sub(r"\s+", " ", text).strip()


def build_message(
    smtp_user: str,
    from_name: str,
    recipients: list[str],
    cc: list[str],
    subject: str,
    body: str,
    html: bool,
    reply_to: str,
) -> MIMEMultipart:
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = formataddr((from_name, smtp_user))
    msg["To"] = ", ".join(recipients)
    if cc:
        msg["Cc"] = ", ".join(cc)
    if reply_to:
        msg["Reply-To"] = reply_to

    if html:
        plain = strip_html(body)
        msg.attach(MIMEText(plain, "plain", "utf-8"))
        msg.attach(MIMEText(body, "html", "utf-8"))
    else:
        msg.attach(MIMEText(body, "plain", "utf-8"))

    return msg


# ─── Sender ────────────────────────────────────────────────────────────────────

def send_email(cfg: dict, recipients: list[str], cc: list[str], msg: MIMEMultipart) -> bool:
    all_recipients = recipients + cc
    smtp_host = cfg["smtp_host"]
    smtp_port = int(cfg["smtp_port"])
    smtp_user = cfg["smtp_user"]
    smtp_pass = cfg["smtp_pass"]

    print(f"\n📬 Connecting to {smtp_host}:{smtp_port}…")

    try:
        if smtp_port == 465:
            context = ssl.create_default_context()
            with smtplib.SMTP_SSL(smtp_host, smtp_port, context=context) as server:
                server.login(smtp_user, smtp_pass)
                server.sendmail(smtp_user, all_recipients, msg.as_string())
        else:
            with smtplib.SMTP(smtp_host, smtp_port, timeout=20) as server:
                server.ehlo()
                server.starttls()
                server.ehlo()
                server.login(smtp_user, smtp_pass)
                server.sendmail(smtp_user, all_recipients, msg.as_string())

        print(f"✅ Email sent successfully to {len(all_recipients)} recipient(s)!")
        return True

    except smtplib.SMTPAuthenticationError:
        print("❌ SMTP authentication failed.", file=sys.stderr)
        print("   → Check your SMTP_USER and SMTP_PASS.", file=sys.stderr)
        print("   → For Gmail: use an App Password, not your account password.", file=sys.stderr)
        print("   → Gmail App Passwords: myaccount.google.com/apppasswords", file=sys.stderr)
        return False
    except smtplib.SMTPRecipientsRefused as e:
        print(f"❌ Recipients refused: {e.recipients}", file=sys.stderr)
        return False
    except Exception as e:
        print(f"❌ Error: {e}", file=sys.stderr)
        return False


# ─── Batch mode (send to chunks to avoid timeouts) ─────────────────────────────

def send_in_batches(cfg: dict, recipients: list[str], cc: list[str], msg_template, batch_size: int = 50):
    """Send large lists in batches, reusing one SMTP connection per batch."""
    smtp_host = cfg["smtp_host"]
    smtp_port = int(cfg["smtp_port"])
    smtp_user = cfg["smtp_user"]
    smtp_pass = cfg["smtp_pass"]

    total = len(recipients)
    succeeded = 0
    failed = []

    batches = [recipients[i:i + batch_size] for i in range(0, total, batch_size)]
    print(f"\n📬 Sending in {len(batches)} batch(es) of up to {batch_size}…")

    for i, batch in enumerate(batches, 1):
        print(f"  Batch {i}/{len(batches)}: {len(batch)} recipients…", end=" ", flush=True)
        try:
            all_r = batch + cc
            if smtp_port == 465:
                ctx = ssl.create_default_context()
                with smtplib.SMTP_SSL(smtp_host, smtp_port, context=ctx) as srv:
                    srv.login(smtp_user, smtp_pass)
                    srv.sendmail(smtp_user, all_r, msg_template.as_string())
            else:
                with smtplib.SMTP(smtp_host, smtp_port, timeout=20) as srv:
                    srv.ehlo(); srv.starttls(); srv.ehlo()
                    srv.login(smtp_user, smtp_pass)
                    srv.sendmail(smtp_user, all_r, msg_template.as_string())
            succeeded += len(batch)
            print(f"✓")
        except Exception as e:
            failed.extend(batch)
            print(f"✗  {e}")

    print(f"\n{'✅' if not failed else '⚠'} Done — {succeeded}/{total} delivered, {len(failed)} failed.")
    if failed:
        print("Failed recipients:", ", ".join(failed[:10]), "…" if len(failed) > 10 else "")
    return succeeded, failed


# ─── CLI ───────────────────────────────────────────────────────────────────────

def parse_args():
    p = argparse.ArgumentParser(
        description="MailBlast CLI — Send emails to multiple recipients",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Send plain text to two addresses
  python email_agent.py \\
    --to alice@example.com bob@example.com \\
    --subject "Quick update" \\
    --body "Hi, just checking in!"

  # Send HTML from a file to a list
  python email_agent.py \\
    --to-file recipients.txt \\
    --subject "Monthly Newsletter" \\
    --html-file newsletter.html

  # Use a config JSON file
  python email_agent.py \\
    --config config.json \\
    --to-file big_list.txt \\
    --subject "Big Announcement" \\
    --body-file message.txt \\
    --batch-size 100
"""
    )

    p.add_argument("--to", nargs="+", metavar="EMAIL", help="Recipient email(s)")
    p.add_argument("--to-file", metavar="FILE", help="File with recipient emails (one per line)")
    p.add_argument("--cc", nargs="+", metavar="EMAIL", help="CC recipient(s)")
    p.add_argument("--bcc", nargs="+", metavar="EMAIL", help="BCC recipient(s)")
    p.add_argument("--subject", required=True, help="Email subject")
    p.add_argument("--body", metavar="TEXT", help="Plain text body (inline)")
    p.add_argument("--body-file", metavar="FILE", help="Plain text body from file")
    p.add_argument("--html-file", metavar="FILE", help="HTML body from file (sends as HTML)")
    p.add_argument("--html", metavar="HTML_STRING", help="HTML body (inline string)")
    p.add_argument("--from-name", metavar="NAME", help="Sender display name")
    p.add_argument("--reply-to", metavar="EMAIL", help="Reply-To address")
    p.add_argument("--config", metavar="FILE", help="JSON config file for SMTP settings")
    p.add_argument("--batch-size", type=int, default=50, help="Batch size for large lists (default: 50)")
    p.add_argument("--dry-run", action="store_true", help="Parse and validate without actually sending")

    return p.parse_args()


def main():
    args = parse_args()

    # Load config
    cfg = get_config(args.config)

    if args.from_name:
        cfg["from_name"] = args.from_name
    if args.reply_to:
        cfg["reply_to"] = args.reply_to

    # Validate SMTP config
    if not cfg["smtp_user"] or not cfg["smtp_pass"]:
        print("❌ SMTP credentials not set.", file=sys.stderr)
        print("   Set SMTP_USER and SMTP_PASS as environment variables,", file=sys.stderr)
        print("   or add them to a .env file, or pass --config <file>.", file=sys.stderr)
        sys.exit(1)

    # Build recipient list
    recipients: list[str] = []

    if args.to:
        for email in args.to:
            if is_valid_email(email):
                recipients.append(email.lower())
            else:
                print(f"⚠ Skipping invalid email: {email}", file=sys.stderr)

    if args.to_file:
        file_recipients = load_recipients_from_file(args.to_file)
        print(f"✓ Loaded {len(file_recipients)} recipients from {args.to_file}")
        recipients.extend(file_recipients)

    # Deduplicate
    recipients = list(dict.fromkeys(recipients))
    cc = [e.lower() for e in (args.cc or []) if is_valid_email(e)]
    bcc = [e.lower() for e in (args.bcc or []) if is_valid_email(e)]

    if not recipients:
        print("❌ No valid recipients.", file=sys.stderr)
        sys.exit(1)

    # Build email body
    html_mode = False
    body = ""

    if args.html_file:
        body = Path(args.html_file).read_text(encoding="utf-8")
        html_mode = True
    elif args.html:
        body = args.html
        html_mode = True
    elif args.body_file:
        body = Path(args.body_file).read_text(encoding="utf-8")
    elif args.body:
        body = args.body
    else:
        print("❌ No email body provided. Use --body, --body-file, --html, or --html-file.", file=sys.stderr)
        sys.exit(1)

    # Summary
    print("\n──────────────────────────────────────────")
    print("  MailBlast CLI — Email Summary")
    print("──────────────────────────────────────────")
    print(f"  From    : {cfg['from_name']} <{cfg['smtp_user']}>")
    print(f"  To      : {len(recipients)} recipient(s)")
    if cc:  print(f"  CC      : {', '.join(cc)}")
    if bcc: print(f"  BCC     : {', '.join(bcc)} (hidden from To/CC)")
    print(f"  Subject : {args.subject}")
    print(f"  Format  : {'HTML' if html_mode else 'Plain Text'}")
    print(f"  SMTP    : {cfg['smtp_host']}:{cfg['smtp_port']}")
    print("──────────────────────────────────────────")

    if args.dry_run:
        print("\n🔍 Dry run — no emails sent. Everything looks valid!")
        return

    # Confirm for large lists
    if len(recipients) > 10:
        try:
            confirm = input(f"\nSend to {len(recipients)} recipients? [y/N] ").strip().lower()
        except (EOFError, KeyboardInterrupt):
            confirm = "n"
        if confirm != "y":
            print("Aborted.")
            sys.exit(0)

    msg = build_message(
        smtp_user=cfg["smtp_user"],
        from_name=cfg["from_name"],
        recipients=recipients,
        cc=cc,
        subject=args.subject,
        body=body,
        html=html_mode,
        reply_to=cfg.get("reply_to", ""),
    )

    # Send
    if len(recipients) <= args.batch_size:
        ok = send_email(cfg, recipients, cc + bcc, msg)
        sys.exit(0 if ok else 1)
    else:
        succeeded, failed = send_in_batches(cfg, recipients, cc + bcc, msg, args.batch_size)
        sys.exit(0 if not failed else 1)


if __name__ == "__main__":
    main()
