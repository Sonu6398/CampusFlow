"use client";

import { useEffect, useState } from "react";

type Conflict = { title: string; when: string; severity: "high" | "medium" };

export default function ConflictBanner() {
  const [conflicts, setConflicts] = useState<Conflict[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/conflicts");
        const data = await res.json();
        setConflicts(data.conflicts ?? []);
      } catch {
        setConflicts([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading)
    return (
      <p className="text-sm text-slate-500">🔍 Scanning your week for clashes…</p>
    );

  if (!conflicts || conflicts.length === 0)
    return (
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-300">
        ✓ No scheduling conflicts detected this week.
      </div>
    );

  return (
    <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4">
      <p className="mb-2 font-medium text-red-300">
        ⚠️ {conflicts.length} potential conflict{conflicts.length > 1 ? "s" : ""}
      </p>
      <ul className="space-y-1.5">
        {conflicts.map((c, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-slate-200">
            <span
              className={
                c.severity === "high" ? "text-red-400" : "text-amber-400"
              }
            >
              ●
            </span>
            <span>
              <span className="font-medium">{c.title}</span>
              {c.when && <span className="text-slate-400"> — {c.when}</span>}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
