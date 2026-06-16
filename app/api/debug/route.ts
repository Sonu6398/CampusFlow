import { NextResponse } from "next/server";

export const runtime = "nodejs";

// Temporary diagnostic: reports which env vars the runtime can see (booleans
// only, never values). Safe to remove after deployment is verified.
export async function GET() {
  return NextResponse.json({
    hasGroqKey: Boolean(process.env.GROQ_API_KEY),
    hasGroqVal: Boolean(process.env.GROQVAL),
    groqModel: process.env.GROQ_MODEL_CHAT ?? null,
    store: process.env.STORE ?? null,
    ddbTable: process.env.DDB_TABLE ?? null,
    hasCfKey: Boolean(process.env.CF_AWS_ACCESS_KEY_ID),
    hasCfSecret: Boolean(process.env.CF_AWS_SECRET_ACCESS_KEY),
    cfRegion: process.env.CF_AWS_REGION ?? null,
    hasSessionSecret: Boolean(process.env.SESSION_SECRET),
  });
}
