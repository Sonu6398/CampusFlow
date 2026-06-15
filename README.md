# CampusFlow — AI Operating System for Student Life

> Paste the chaos (WhatsApp dumps, emails, hostel notices) → CampusFlow turns it
> into an organized schedule and answers questions about it.
> **HackOn with Amazon S6 · AWS Amplify Hosting + Amazon Bedrock (Claude).**

## What works in this prototype
- **Routine / Summarization / Scheduling** — paste any messy text, Bedrock (Claude
  Haiku) extracts deadlines, events, classes, notices into a sorted timeline.
- **Instant Q&A** — ask "what's due this week?"; Bedrock (Claude Sonnet) answers
  grounded in *your* items.
- **Persistence** — best-effort save to DynamoDB (off the critical demo path).

## Architecture
```
Next.js (Amplify Hosting)
  ├─ /api/extract  → Bedrock Converse (Haiku) → JSON items → DynamoDB
  └─ /api/chat     → Bedrock Converse (Sonnet) over the student's items
```

---

## 1. Local setup (do this first)

```bash
npm install
cp .env.local.example .env.local   # then edit it (see below)
npm run dev                         # http://localhost:3000
```

### Get AWS credentials (no AWS CLI needed)
1. AWS Console → **IAM** → Users → Create user (e.g. `campusflow-dev`).
2. Attach a policy with `bedrock:InvokeModel` and DynamoDB access
   (for a hackathon you can use `AmazonBedrockFullAccess` + `AmazonDynamoDBFullAccess`).
3. Create an **access key** → put the key + secret into `.env.local`.

### Enable Bedrock models (critical — do early)
AWS Console → **Bedrock** → *Model access* → enable **Anthropic Claude**
(Haiku + Sonnet). Approval can take a few minutes.
Confirm the exact model IDs available in your region and, if they differ from the
defaults, set `BEDROCK_MODEL_EXTRACT` / `BEDROCK_MODEL_CHAT` in `.env.local`.

### (Optional) DynamoDB table
AWS Console → **DynamoDB** → Create table:
- Table name: `CampusFlowItems`
- Partition key: `userId` (String) · Sort key: `itemId` (String)
- Capacity: **On-demand**

Skip it for now with `DDB_DISABLED=true` — the app still works from client state.

---

## 2. Deploy to AWS Amplify (live URL)
1. Push this repo to GitHub.
2. AWS Console → **Amplify** → New app → Host web app → connect the repo.
3. Amplify auto-detects Next.js (build config is in `amplify.yml`).
4. Add **environment variables** in the Amplify console (same as `.env.local`).
5. Attach an IAM service role to the Amplify app that allows `bedrock:InvokeModel`
   and DynamoDB access so the deployed functions can call Bedrock.
6. Deploy → you get `https://<branch>.<id>.amplifyapp.com`. Share that link.

---

## Demo script (3 min)
1. Click **Load sample** → **Organize my life** → timeline fills instantly.
2. Ask **"What's most urgent this week?"** → grounded answer.
3. Show the architecture slide: "all AI runs on Amazon Bedrock."
