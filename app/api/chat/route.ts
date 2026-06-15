import { NextRequest, NextResponse } from "next/server";
import { converse, MODEL_CHAT } from "@/lib/bedrock";
import { currentUserId } from "@/lib/auth";
import { store } from "@/lib/store";

export const runtime = "nodejs";
export const maxDuration = 30;

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const SYSTEM = `You are CampusFlow, a warm, sharp AI assistant for a college student.
You answer using ONLY the student's schedule, routine and items provided as context.
Be concise and concrete: mention specific titles, dates and times.
If asked "what's urgent" or "what's due", sort by date and priority.
If the answer isn't in the data, say so briefly and suggest what to add.
Speak naturally, like a helpful friend. Keep answers short for voice playback.`;

export async function POST(req: NextRequest) {
  const uid = currentUserId();
  if (!uid) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  try {
    const { question } = (await req.json()) as { question: string };
    if (!question || typeof question !== "string") {
      return NextResponse.json({ answer: "Ask me anything about your schedule!" });
    }

    const [items, routine] = await Promise.all([
      store().getItems(uid),
      store().getRoutine(uid),
    ]);

    const today = new Date().toISOString();
    const itemCtx =
      items.length > 0
        ? items
            .map(
              (i) =>
                `- [${i.type}/${i.priority}${
                  i.status === "done" ? "/done" : ""
                }] ${i.title}${i.dueAt ? ` (due ${i.dueAt})` : ""}${
                  i.description ? ` — ${i.description}` : ""
                }`
            )
            .join("\n")
        : "(no items yet)";

    const routineCtx =
      routine.length > 0
        ? routine
            .map(
              (r) => `- ${DAYS[r.day]} ${r.start}-${r.end}: ${r.title}${
                r.location ? ` @ ${r.location}` : ""
              }`
            )
            .join("\n")
        : "(no routine set)";

    const answer = await converse({
      modelId: MODEL_CHAT,
      system: SYSTEM,
      user: `today = ${today}\n\nWEEKLY ROUTINE:\n${routineCtx}\n\nITEMS:\n${itemCtx}\n\nQUESTION: ${question}`,
      maxTokens: 500,
      temperature: 0.3,
    });

    return NextResponse.json({ answer });
  } catch (err: any) {
    console.error("[chat] error:", err);
    return NextResponse.json(
      { answer: "Sorry — I hit an error reaching Bedrock. Check the logs." },
      { status: 500 }
    );
  }
}
