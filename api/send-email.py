"""
Vercel Python Serverless Function — /api/send-email
Handles POST requests to send email via SMTP.

Required environment variables (set in Vercel dashboard):
  SMTP_HOST    — e.g. smtp.gmail.com
  SMTP_PORT    — e.g. 587 (TLS) or 465 (SSL)
  SMTP_USER    — sender email address
  SMTP_PASS    — app password (Gmail: create at myaccount.google.com/apppasswords)
  FROM_NAME    — display name for the sender (optional)
"""

from http.server import BaseHTTPRequestHandler
import json
import os
import smtplib
import ssl
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.utils import formataddr


def _cors_headers(handler: BaseHTTPRequestHandler):
    handler.send_header("Access-Control-Allow-Origin", "*")
    handler.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
    handler.send_header("Access-Control-Allow-Headers", "Content-Type")


def send_bulk_email(
    recipients: list,
    cc: list,
    bcc: list,
    subject: str,
    content: str,
    content_type: str,   # "text" or "html"
    from_name: str,
    reply_to: str,
) -> dict:
    smtp_host = os.environ.get("SMTP_HOST", "smtp.gmail.com")
    smtp_port = int(os.environ.get("SMTP_PORT", "587"))
    smtp_user = os.environ.get("SMTP_USER", "")
    smtp_pass = os.environ.get("SMTP_PASS", "")
    default_from_name = os.environ.get("FROM_NAME", "MailBlast")

    if not smtp_user or not smtp_pass:
        return {"success": False, "error": "SMTP credentials not configured on the server."}

    display_name = from_name.strip() if from_name.strip() else default_from_name

    # Build MIME message
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = formataddr((display_name, smtp_user))
    msg["To"] = ", ".join(recipients)

    if cc:
        msg["Cc"] = ", ".join(cc)
    if reply_to:
        msg["Reply-To"] = reply_to

    # Attach plain-text version always (for email clients that don't support HTML)
    if content_type == "html":
        # Provide a plain text fallback by stripping tags (basic)
        import re
        plain_fallback = re.sub(r"<[^>]+>", "", content)
        plain_fallback = re.sub(r"\s+", " ", plain_fallback).strip()
        msg.attach(MIMEText(plain_fallback, "plain", "utf-8"))
        msg.attach(MIMEText(content, "html", "utf-8"))
    else:
        msg.attach(MIMEText(content, "plain", "utf-8"))

    # All actual delivery addresses (To + CC + BCC)
    all_recipients = recipients + cc + bcc

    try:
        if smtp_port == 465:
            # SSL connection
            context = ssl.create_default_context()
            with smtplib.SMTP_SSL(smtp_host, smtp_port, context=context) as server:
                server.login(smtp_user, smtp_pass)
                server.sendmail(smtp_user, all_recipients, msg.as_string())
        else:
            # STARTTLS connection (port 587)
            with smtplib.SMTP(smtp_host, smtp_port, timeout=15) as server:
                server.ehlo()
                server.starttls()
                server.ehlo()
                server.login(smtp_user, smtp_pass)
                server.sendmail(smtp_user, all_recipients, msg.as_string())

        return {
            "success": True,
            "message": f"Email delivered to {len(all_recipients)} recipient(s).",
            "count": len(all_recipients),
        }
    except smtplib.SMTPAuthenticationError:
        return {
            "success": False,
            "error": "SMTP authentication failed. Check your SMTP_USER and SMTP_PASS.",
        }
    except smtplib.SMTPRecipientsRefused as e:
        return {
            "success": False,
            "error": f"Recipients refused: {e.recipients}",
        }
    except Exception as e:
        return {"success": False, "error": str(e)}


class handler(BaseHTTPRequestHandler):

    def log_message(self, format, *args):
        """Suppress default HTTP logging in serverless."""
        pass

    def do_OPTIONS(self):
        """Handle CORS preflight."""
        self.send_response(204)
        _cors_headers(self)
        self.end_headers()

    def do_POST(self):
        try:
            content_length = int(self.headers.get("Content-Length", 0))
            raw_body = self.rfile.read(content_length)
            data = json.loads(raw_body.decode("utf-8"))
        except (json.JSONDecodeError, ValueError) as e:
            self._respond(400, {"success": False, "error": f"Invalid JSON: {e}"})
            return

        recipients = data.get("recipients", [])
        cc = data.get("cc", [])
        bcc = data.get("bcc", [])
        subject = data.get("subject", "").strip()
        content = data.get("content", "").strip()
        content_type = data.get("contentType", "text")
        from_name = data.get("fromName", "")
        reply_to = data.get("replyTo", "")

        # Basic validation
        if not recipients:
            self._respond(400, {"success": False, "error": "No recipients provided."})
            return
        if not subject:
            self._respond(400, {"success": False, "error": "Subject is required."})
            return
        if not content:
            self._respond(400, {"success": False, "error": "Email body is empty."})
            return
        if content_type not in ("text", "html"):
            content_type = "text"

        result = send_bulk_email(
            recipients=recipients,
            cc=cc,
            bcc=bcc,
            subject=subject,
            content=content,
            content_type=content_type,
            from_name=from_name,
            reply_to=reply_to,
        )

        status = 200 if result["success"] else 500
        self._respond(status, result)

    def _respond(self, status: int, body: dict):
        payload = json.dumps(body).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(payload)))
        _cors_headers(self)
        self.end_headers()
        self.wfile.write(payload)
