import { NextRequest, NextResponse } from "next/server";
import { currentUserId } from "@/lib/auth";
import { store } from "@/lib/store";
import type { RoutineEntry } from "@/lib/types";

export const runtime = "nodejs";

export async function GET() {
  const uid = currentUserId();
  if (!uid) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const routine = await store().getRoutine(uid);
  return NextResponse.json({ routine });
}

export async function POST(req: NextRequest) {
  const uid = currentUserId();
  if (!uid) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { entries } = (await req.json()) as { entries: RoutineEntry[] };
  await store().setRoutine(uid, entries ?? []);
  return NextResponse.json({ routine: entries ?? [] });
}
