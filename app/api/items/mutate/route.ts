import { NextRequest, NextResponse } from "next/server";
import { currentUserId } from "@/lib/auth";
import { store } from "@/lib/store";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const uid = currentUserId();
  if (!uid) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { action, itemId, status } = await req.json();
  if (!itemId) return NextResponse.json({ error: "itemId required" }, { status: 400 });

  if (action === "delete") {
    await store().deleteItem(uid, itemId);
  } else if (action === "toggle") {
    await store().updateItem(uid, itemId, {
      status: status === "done" ? "done" : "open",
    });
  } else {
    return NextResponse.json({ error: "unknown action" }, { status: 400 });
  }

  const items = await store().getItems(uid);
  return NextResponse.json({ items });
}
