# CampusFlow — AI Operating System for Student Life

> Paste the chaos — class schedules, WhatsApp dumps, emails, hostel notices —
> and CampusFlow organizes it, answers your questions (by text or voice), and
> proactively nudges you before deadlines slip. **"Alexa for your college life."**
>
> **HackOn with Amazon S6 · Theme: AI for Campus, Community & Everyday Life (PS-1)**

🔗 **Live app:** https://main.d3ndb1ws1rn43d.amplifyapp.com
📦 **Repo:** https://github.com/Sonu6398/CampusFlow

---

## What it does (the 6 pillars)

| Pillar | In the app |
|---|---|
| **Routine Understanding** | Onboarding: paste any timetable → AI builds your weekly routine |
| **Update Summarization** | Inbox: paste a WhatsApp/email dump → AI summary |
| **Smart Scheduling** | Auto-extracts deadlines/events → week calendar with **AI conflict detection** |
| **Instant Q&A** | Assistant: grounded chat over *your* schedule |
| **Proactive Alerts** | Dashboard: AI morning brief + actionable nudges |
| **Personal Life** | Mess menu, hostel notices & personal tasks in one feed |
| **Voice mode 🎤** | Speak to the assistant, get spoken answers |

## Tech stack

| Layer | Tech |
|---|---|
| Frontend + API | **Next.js 14** (App Router, TypeScript), TailwindCSS |
| Hosting | **AWS Amplify** (CI/CD from GitHub) |
| Database | **Amazon DynamoDB** (single-table, on-demand) |
| Auth | bcrypt + HMAC-signed session cookies |
| AI | Model-agnostic `converse()` layer — **Amazon Bedrock-ready** (Groq / Llama 3.3 in the live demo) |

> **Note on the AI provider:** the app was built for **Amazon Bedrock** (Converse API).
> Bedrock invocation needs an AWS Marketplace subscription = a card payment instrument;
> the demo account only had UPI AutoPay (rejected by Marketplace). The same model-agnostic
> `converse()` layer therefore calls a free LLM endpoint for the live demo — switching back
> to Bedrock/Claude is a one-file change. Hosting (Amplify) and data (DynamoDB) stay on AWS.

## Architecture

```
Next.js (Amplify Hosting)
  ├─ Auth (bcrypt + session cookies)
  ├─ Pages: Landing · Login · Onboarding · Dashboard · Calendar · Inbox · Assistant
  └─ API routes: /extract /summarize /digest /conflicts /chat
                 /routine /routine/parse /items /auth/*
        │                         │
   converse() LLM layer      Storage layer
   (Bedrock-ready)           (JSON file in dev → DynamoDB in prod)
```

---

## Run locally

```bash
npm install
cp .env.local.example .env.local   # fill in the values below
npm run dev                          # http://localhost:3000
```

### Environment variables
| Key | Purpose |
|---|---|
| `GROQ_API_KEY` | Free LLM key (console.groq.com). Bedrock-ready alternative. |
| `GROQ_MODEL_EXTRACT` / `GROQ_MODEL_CHAT` | `llama-3.3-70b-versatile` |
| `SESSION_SECRET` | Long random string for signing session cookies |
| `STORE` | `dynamo` in prod; unset locally (uses `.data/db.json`) |
| `DDB_TABLE` | `CampusFlow` (when `STORE=dynamo`) |
| `CF_AWS_REGION` / `CF_AWS_ACCESS_KEY_ID` / `CF_AWS_SECRET_ACCESS_KEY` | DynamoDB credentials in prod |

> Local dev needs **no AWS** — it uses a JSON file store and your Groq key.

## Deploy (AWS Amplify)
1. Push to GitHub.
2. Amplify → Create app → connect repo + `main` branch (Next.js auto-detected).
3. DynamoDB table `CampusFlow` (partition key `pk`, sort key `sk`, on-demand).
4. Add the env vars above in Amplify → **Redeploy**.

## Demo flow
Sign up → Onboarding (paste timetable) → Inbox (paste WhatsApp dump → AI summarizes
& files items) → Dashboard (AI brief) → Calendar (conflict scan) → Assistant (ask by
text or voice).
