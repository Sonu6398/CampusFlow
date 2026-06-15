# CampusFlow — Free-Tier AWS Setup & Deploy

Goal: run the whole prototype for **~$0**. Everything is AWS Free Tier except
Amazon Bedrock (the AI), which costs pennies and is covered by new-account credits.

## Cost summary
| Service | Free tier | Our usage |
|---|---|---|
| Amplify Hosting | 1,000 build min + 15 GB/mo | tiny |
| DynamoDB (on-demand) | 25 GB always-free | KBs |
| IAM | always free | — |
| **Bedrock (Claude Haiku)** | **no free tier** | a few cents; use credits |

---

## 1. Enable Bedrock models (do first — approval can take minutes)
AWS Console → **Bedrock** → **Model access** → **Manage model access** →
enable **Anthropic → Claude 3.5 Haiku** (and Sonnet if you want it for the demo) → Save.
Use region **us-east-1** (most models available, matches `.env.local`).

## 2. Create an IAM access key (least privilege)
AWS Console → **IAM** → **Users** → **Create user** (e.g. `campusflow`).
Attach this inline policy (covers Bedrock + DynamoDB only):
```json
{
  "Version": "2012-10-17",
  "Statement": [
    { "Effect": "Allow", "Action": ["bedrock:InvokeModel"], "Resource": "*" },
    { "Effect": "Allow",
      "Action": ["dynamodb:GetItem","dynamodb:PutItem","dynamodb:Query","dynamodb:DeleteItem"],
      "Resource": "*" }
  ]
}
```
Then **Security credentials → Create access key → Application running outside AWS**.
Copy the key + secret into `.env.local` (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`).

## 3. Set a $1 budget alert (safety net)
AWS Console → **Billing → Budgets → Create budget** → Cost budget → amount **$1** →
alert at 80%/100% to your email. You'll be warned long before any real spend.

## 4. Test locally
```bash
npm run dev   # http://localhost:3000
```
Sign up → Onboarding "Parse with AI" → Inbox "Summarize & organize" → Assistant chat.
If the AI errors, re-check Bedrock model access + the keys in `.env.local`.

---

## 5. (Production) DynamoDB table — free tier
AWS Console → **DynamoDB → Create table**
- Table name: **CampusFlow**
- Partition key: **pk** (String) · Sort key: **sk** (String)
- Capacity: **On-demand**  ← stays in free tier
No other config needed (single-table design).

## 6. Deploy to Amplify Hosting (free)
1. Push repo to GitHub.
2. AWS Console → **Amplify → Create app → Host web app →** connect the repo.
3. Amplify auto-detects Next.js (build config in `amplify.yml`).
4. **Environment variables** (Amplify → App settings → Environment variables):
   - `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`
   - `BEDROCK_MODEL_EXTRACT`, `BEDROCK_MODEL_CHAT`
   - `SESSION_SECRET` (a long random string)
   - `STORE=dynamo`, `DDB_TABLE=CampusFlow`
5. Deploy → you get `https://<branch>.<id>.amplifyapp.com`.

Done — a live, shareable, effectively-free CampusFlow.
