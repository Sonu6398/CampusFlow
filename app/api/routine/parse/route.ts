import { NextRequest, NextResponse } from "next/server";
import { converse, MODEL_EXTRACT } from "@/lib/bedrock";
import { currentUserId } from "@/lib/auth";
import type { RoutineEntry } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 30;

const SYSTEM = `You parse a college timetable described in free text into structured weekly classes.
Return ONLY a JSON array, no fences. Each element:
{ "day": 0-6 (0=Sunday..6=Saturday), "start": "HH:MM" 24h, "end": "HH:MM" 24h, "title": "subject/class", "location": "room (optional)" }
Expand entries that repeat on multiple days into one element per day. If end time is missing, assume 1 hour.`;

function parse(raw: string): RoutineEntry[] {
  let t = raw.trim().replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  const s = t.indexOf("[");
  const e = t.lastIndexOf("]");
  if (s === -1 || e === -1) return [];
  try {
    const arr = JSON.parse(t.slice(s, e + 1));
    if (!Array.isArray(arr)) return [];
    return arr
      .map((x: any, i: number) => ({
        id: `r-${Date.now()}-${i}`,
        day: Number(x.day),
        start: String(x.start ?? "09:00"),
        end: String(x.end ?? "10:00"),
        title: String(x.title ?? "Class"),
        location: x.location ? String(x.location) : undefined,
      }))
      .filter((r) => r.day >= 0 && r.day <= 6);
  } catch {
    return [];
  }
}

export async function POST(req: NextRequest) {
  const uid = currentUserId();
  if (!uid) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    const { text } = await req.json();
    if (!text || text.trim().length < 3) return NextResponse.json({ entries: [] });
    const raw = await converse({
      modelId: MODEL_EXTRACT,
      system: SYSTEM,
      user: text,
      maxTokens: 1500,
      temperature: 0,
    });
    return NextResponse.json({ entries: parse(raw) });
  } catch (err: any) {
    console.error("[routine/parse]", err);
    return NextResponse.json({ entries: [], error: err?.message }, { status: 500 });
  }
}
