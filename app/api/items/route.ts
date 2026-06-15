import { NextResponse } from "next/server";
import { currentUserId } from "@/lib/auth";
import { store } from "@/lib/store";

export const runtime = "nodejs";

export async function GET() {
  const uid = currentUserId();
  if (!uid) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const items = await store().getItems(uid);
  return NextResponse.json({ items });
}
