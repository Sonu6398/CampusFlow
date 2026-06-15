import { NextRequest, NextResponse } from "next/server";
import { converse, MODEL_EXTRACT } from "@/lib/bedrock";
import { currentUserId } from "@/lib/auth";

export const runtime = "nodejs";
export const maxDuration = 30;

const SYSTEM = `You summarize messy student updates (WhatsApp/email/notices) into a crisp brief.
Return 3-6 short bullet points capturing the important info and any action items.
Start each bullet with "• ". No preamble, no markdown headings. Be specific about dates/times.`;

export async function POST(req: NextRequest) {
  const uid = currentUserId();
  if (!uid) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    const { text } = await req.json();
    if (!text || text.trim().length < 3) return NextResponse.json({ summary: "" });
    const summary = await converse({
      modelId: MODEL_EXTRACT,
      system: SYSTEM,
      user: text,
      maxTokens: 500,
      temperature: 0.2,
    });
    return NextResponse.json({ summary });
  } catch (err: any) {
    console.error("[summarize]", err);
    return NextResponse.json({ summary: "", error: err?.message }, { status: 500 });
  }
}
