import { NextResponse } from "next/server";
import { converse, MODEL_CHAT } from "@/lib/bedrock";
import { currentUserId } from "@/lib/auth";
import { store } from "@/lib/store";

export const runtime = "nodejs";
export const maxDuration = 30;

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const SYSTEM = `You detect scheduling conflicts and tight squeezes for a student.
Given a weekly routine and dated items, find overlaps or back-to-back clashes.
Return ONLY JSON, no fences:
{ "conflicts": [ { "title": "short clash description", "when": "human time", "severity": "high"|"medium" } ] }
Return an empty array if there are no real conflicts. Be precise, don't invent.`;

function parse(raw: string) {
  let t = raw.trim().replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  const s = t.indexOf("{");
  const e = t.lastIndexOf("}");
  try {
    const o = JSON.parse(t.slice(s, e + 1));
    return Array.isArray(o.conflicts) ? o.conflicts : [];
  } catch {
    return [];
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
    const dated = items.filter((i) => i.dueAt);
    if (routine.length === 0 && dated.length < 2) {
      return NextResponse.json({ conflicts: [] });
    }

    const routineCtx = routine
      .map((r) => `${DAYS[r.day]} ${r.start}-${r.end} ${r.title}`)
      .join("\n");
    const itemCtx = dated
      .map((i) => `${i.title} @ ${i.dueAt}`)
      .join("\n");

    const raw = await converse({
      modelId: MODEL_CHAT,
      system: SYSTEM,
      user: `today = ${new Date().toISOString()}\n\nROUTINE:\n${routineCtx}\n\nDATED ITEMS:\n${itemCtx}`,
      maxTokens: 500,
      temperature: 0.1,
    });

    return NextResponse.json({ conflicts: parse(raw) });
  } catch (err: any) {
    console.error("[conflicts]", err);
    return NextResponse.json({ conflicts: [], error: err?.message }, { status: 500 });
  }
}
