"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { PublicUser } from "@/lib/types";

const LINKS = [
  { href: "/dashboard", label: "Today" },
  { href: "/calendar", label: "Calendar" },
  { href: "/inbox", label: "Inbox" },
  { href: "/assistant", label: "Assistant" },
];

export default function Nav({ user }: { user: PublicUser }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <nav className="sticky top-0 z-20 border-b border-white/10 bg-ink/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-5 py-3">
        <Link href="/dashboard" className="text-lg font-bold tracking-tight">
          Campus<span className="text-accent">Flow</span>
        </Link>
        <div className="flex flex-1 items-center gap-1">
          {LINKS.map((l) => {
            const active = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded-lg px-3 py-1.5 text-sm transition ${
                  active
                    ? "bg-accent/15 text-accent"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </div>
        <span className="hidden text-sm text-slate-400 sm:block">
          {user.name.split(" ")[0]}
        </span>
        <button
          onClick={logout}
          className="rounded-lg border border-white/10 px-3 py-1.5 text-sm text-slate-300 hover:bg-white/5"
        >
          Log out
        </button>
      </div>
    </nav>
  );
}
