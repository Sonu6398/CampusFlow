import { NextRequest, NextResponse } from "next/server";
import { converse, MODEL_EXTRACT } from "@/lib/bedrock";
import { currentUserId } from "@/lib/auth";
import { store } from "@/lib/store";
import type { Item } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 30;

const SYSTEM = `You are CampusFlow's extraction engine for Indian college students.
You receive messy text dumped from WhatsApp groups, emails, college portals, or notices.
Extract EVERY actionable item (deadlines, events, classes, notices, personal tasks).

Return ONLY a JSON array, no prose, no markdown fences. Each element:
{
  "type": "deadline" | "event" | "class" | "notice" | "personal",
  "title": short imperative title,
  "description": one-line context (optional),
  "dueAt": ISO 8601 datetime string, or null if no time is implied,
  "priority": "high" | "medium" | "low",
  "source": where it likely came from (e.g. "whatsapp", "email", "notice")
}
Rules:
- Resolve relative dates ("tomorrow", "Friday 5pm") against the provided "today".
- High priority = money/registration/submission deadlines or anything within 24h.
- If nothing actionable is found, return [].`;

function safeParse(raw: string): Item[] {
  let txt = raw.trim();
  txt = txt.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  const start = txt.indexOf("[");
  const end = txt.lastIndexOf("]");
  if (start === -1 || end === -1) return [];
  try {
    const arr = JSON.parse(txt.slice(start, end + 1));
    if (!Array.isArray(arr)) return [];
    const now = new Date().toISOString();
    return arr.map((x: any, i: number) => ({
      id: `${Date.now()}-${i}-${Math.floor(performance.now())}`,
      type: x.type ?? "notice",
      title: String(x.title ?? "Untitled"),
      description: x.description ? String(x.description) : undefined,
      dueAt: x.dueAt ?? null,
      priority: ["high", "medium", "low"].includes(x.priority)
        ? x.priority
        : "medium",
      source: x.source ? String(x.source) : undefined,
      status: "open" as const,
      createdAt: now,
    }));
  } catch {
    return [];
  }
}

export async function POST(req: NextRequest) {
  const uid = currentUserId();
  if (!uid) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  try {
    const { text } = await req.json();
    if (!text || typeof text !== "string" || text.trim().length < 3) {
      return NextResponse.json({ items: [] });
    }

    const today = new Date().toISOString();
    const raw = await converse({
      modelId: MODEL_EXTRACT,
      system: SYSTEM,
      user: `today = ${today}\n\nTEXT:\n${text}`,
      maxTokens: 2000,
      temperature: 0,
    });

    const items = safeParse(raw);
    if (items.length) await store().addItems(uid, items);

    return NextResponse.json({ items });
  } catch (err: any) {
    console.error("[extract] error:", err);
    return NextResponse.json(
      { items: [], error: err?.message ?? "extraction failed" },
      { status: 500 }
    );
  }
}
