import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";
import {
  verifyPassword,
  signSession,
  SESSION_COOKIE,
  sessionCookieOptions,
  toPublic,
} from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    const id = String(email || "").toLowerCase().trim();
    const user = await store().getUserByEmail(id);
    if (!user || !(await verifyPassword(String(password || ""), user.passwordHash))) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }
    const res = NextResponse.json({ user: toPublic(user) });
    res.cookies.set(SESSION_COOKIE, signSession(id), sessionCookieOptions());
    return res;
  } catch (err: any) {
    console.error("[login]", err);
    return NextResponse.json({ error: "Login failed." }, { status: 500 });
  }
}
