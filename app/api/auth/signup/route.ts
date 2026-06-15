import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";
import {
  hashPassword,
  signSession,
  SESSION_COOKIE,
  sessionCookieOptions,
  toPublic,
} from "@/lib/auth";
import type { User } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, college } = await req.json();
    if (!name || !email || !password || String(password).length < 6) {
      return NextResponse.json(
        { error: "Name, email and a 6+ char password are required." },
        { status: 400 }
      );
    }
    const id = String(email).toLowerCase().trim();
    const existing = await store().getUserByEmail(id);
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    const user: User = {
      id,
      email: id,
      name: String(name).trim(),
      college: college ? String(college).trim() : undefined,
      passwordHash: await hashPassword(String(password)),
      createdAt: new Date().toISOString(),
    };
    await store().createUser(user);

    const res = NextResponse.json({ user: toPublic(user) });
    res.cookies.set(SESSION_COOKIE, signSession(id), sessionCookieOptions());
    return res;
  } catch (err: any) {
    console.error("[signup]", err);
    return NextResponse.json(
      { error: "Signup failed.", detail: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}
