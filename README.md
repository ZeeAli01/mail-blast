# MailBlast — Email Sender

A modern, full-stack email sender app. Compose and send **plain text or HTML emails** to any number of recipients — from a beautiful web UI or the CLI Python script.

**Stack:** Next.js 14 · Tailwind CSS · Framer Motion · Python Serverless (Vercel) · SMTP

---

## ✨ Features

- **Multiple recipients** — add as tags, paste a comma-separated list, or load from file (CLI)
- **CC / BCC** support
- **HTML or Plain Text** mode with live preview
- **Formatting toolbar** — quick insert bold, italic, headings, links, lists, images
- **HTML templates** — Welcome Email, Newsletter, Announcement starters
- **Responsive design** — works perfectly on mobile
- **Python backend** — serverless function running on Vercel
- **CLI agent** — `scripts/email_agent.py` for automation / bulk sends

---

## 🚀 Quick Start (Local Dev)

### 1. Clone & Install

```bash
git clone https://github.com/YOUR_USERNAME/email-sender.git
cd email-sender
npm install
```

### 2. Set Up Environment Variables

```bash
cp .env.local.example .env.local
# Edit .env.local with your SMTP credentials
```

**Gmail setup (recommended):**
1. Enable 2-Step Verification on your Google Account
2. Visit: [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
3. Create an **App Password** (select Mail → your device)
4. Paste the 16-character password as `SMTP_PASS`

### 3. Run Dev Server

```bash
npm run dev
# Open http://localhost:3000
```

> **Note:** The Python serverless function (`/api/send-email.py`) runs natively on Vercel. Locally, you can test it with `vercel dev` (requires Vercel CLI) or use the CLI script.

---

## 🌐 Deploy to Vercel (Free)

### Method 1: GitHub + Vercel Dashboard (Easiest)

1. Push this repo to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/email-sender.git
   git push -u origin main
   ```

2. Go to [vercel.com](https://vercel.com) → **Add New Project**

3. Import your GitHub repository

4. In **Environment Variables**, add:
   | Key | Value |
   |-----|-------|
   | `SMTP_HOST` | `smtp.gmail.com` |
   | `SMTP_PORT` | `587` |
   | `SMTP_USER` | `your@gmail.com` |
   | `SMTP_PASS` | `your-app-password` |
   | `FROM_NAME` | `Your Name` |

5. Click **Deploy** — done! 🎉

### Method 2: Vercel CLI

```bash
npm i -g vercel
vercel login
vercel --prod
# Add env vars when prompted, or via the dashboard
```

---

## 🐍 CLI Python Script

Send emails from the command line for automation or bulk campaigns.

### Setup

```bash
# Optional: install dotenv support
pip install python-dotenv

# Create .env file with your credentials
cp .env.local.example .env
# Edit .env
```

### Usage Examples

```bash
# Send plain text to specific addresses
python scripts/email_agent.py \
  --to alice@example.com bob@example.com \
  --subject "Quick update" \
  --body "Hi, just checking in!"

# Send HTML email from a file
python scripts/email_agent.py \
  --to-file recipients.txt \
  --subject "Monthly Newsletter" \
  --html-file newsletter.html

# Dry run (validate without sending)
python scripts/email_agent.py \
  --to-file big_list.txt \
  --subject "Test" \
  --body "Hello" \
  --dry-run

# Batch mode for large lists (default batch: 50)
python scripts/email_agent.py \
  --to-file 1000_subscribers.txt \
  --subject "Big Announcement" \
  --html-file campaign.html \
  --batch-size 100
```

### Recipients File Format (`recipients.txt`)

```
# Lines starting with # are ignored
alice@example.com
bob@example.com
# You can also use comma-separated:
carol@example.com, dave@example.com
```

### Config File (`config.json`)

```json
{
  "smtp_host": "smtp.gmail.com",
  "smtp_port": 587,
  "smtp_user": "you@gmail.com",
  "smtp_pass": "your-app-password",
  "from_name": "Your Name"
}
```

```bash
python scripts/email_agent.py --config config.json --to-file list.txt --subject "Hi" --body "Hello!"
```

---

## 📁 Project Structure

```
email-sender/
├── app/
│   ├── layout.tsx          # Root layout + metadata
│   ├── page.tsx            # Main page
│   └── globals.css         # Global styles + Tailwind
├── components/
│   ├── EmailComposer.tsx   # Main form (subject, settings, send button)
│   ├── RecipientInput.tsx  # Tag-based recipient input
│   └── EditorPanel.tsx     # Text/HTML editor with toolbar + preview
├── lib/
│   └── utils.ts            # cn(), isValidEmail(), countWords()
├── api/
│   └── send-email.py       # Python serverless function (Vercel)
├── scripts/
│   └── email_agent.py      # Standalone CLI automation script
├── .env.local.example      # Environment variable template
├── requirements.txt        # Python deps (optional dotenv)
├── vercel.json             # Vercel Python runtime config
└── README.md
```

---

## 🔧 Supported Email Providers

| Provider | SMTP Host | Port |
|----------|-----------|------|
| Gmail | smtp.gmail.com | 587 |
| Outlook/Hotmail | smtp-mail.outlook.com | 587 |
| Yahoo | smtp.mail.yahoo.com | 587 |
| SendGrid | smtp.sendgrid.net | 587 |
| Mailgun | smtp.mailgun.org | 587 |
| Custom | your SMTP server | 587/465 |

---

## 🛡️ Security Notes

- **Never commit** `.env.local` or credentials to git (it's in `.gitignore`)
- Use **App Passwords** instead of your real account password for Gmail
- For production bulk email, consider [SendGrid](https://sendgrid.com) (free: 100/day) or [Resend](https://resend.com) (free: 3000/month)

---

## 📄 License

MIT
