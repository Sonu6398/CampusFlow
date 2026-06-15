import { NextResponse } from "next/server";
import { converse, MODEL_CHAT } from "@/lib/bedrock";
import { currentUserId } from "@/lib/auth";
import { store } from "@/lib/store";

export const runtime = "nodejs";
export const maxDuration = 30;

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const SYSTEM = `You are CampusFlow's proactive engine. Given a student's routine and items,
produce a short morning brief. Return ONLY JSON, no fences:
{
  "summary": "1-2 sentence friendly overview of the day/week ahead",
  "nudges": ["short proactive nudge", ...]   // 2-4 nudges
}
Nudges should be specific and actionable: flag imminent deadlines (within ~48h),
clashes, things not marked done, or wellness reminders if the day looks overloaded.`;

function parse(raw: string): { summary: string; nudges: string[] } {
  let t = raw.trim().replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  const s = t.indexOf("{");
  const e = t.lastIndexOf("}");
  try {
    const o = JSON.parse(t.slice(s, e + 1));
    return {
      summary: String(o.summary ?? ""),
      nudges: Array.isArray(o.nudges) ? o.nudges.map(String).slice(0, 5) : [],
    };
  } catch {
    return { summary: raw.slice(0, 200), nudges: [] };
  }
}

export async function GET() {
  const uid = currentUserId();
  if (!uid) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    const [items, routine] = await Promise.all([
      store().getItems(uid),
      store().getRoutine(uid),
    ]);
    const now = new Date();
    const today = now.toISOString();
    const dow = now.getDay();

    const todayRoutine = routine
      .filter((r) => r.day === dow)
      .map((r) => `${r.start}-${r.end} ${r.title}`)
      .join(", ") || "(no classes today)";

    const itemCtx =
      items
        .map(
          (i) =>
            `- [${i.type}/${i.priority}${i.status === "done" ? "/done" : ""}] ${
              i.title
            }${i.dueAt ? ` due ${i.dueAt}` : ""}`
        )
        .join("\n") || "(no items)";

    const raw = await converse({
      modelId: MODEL_CHAT,
      system: SYSTEM,
      user: `today = ${today} (${DAYS[dow]})\nTODAY'S CLASSES: ${todayRoutine}\n\nITEMS:\n${itemCtx}`,
      maxTokens: 500,
      temperature: 0.4,
    });

    return NextResponse.json({
      ...parse(raw),
      generatedAt: today,
    });
  } catch (err: any) {
    console.error("[digest]", err);
    return NextResponse.json(
      { summary: "", nudges: [], error: err?.message },
      { status: 500 }
    );
  }
}
