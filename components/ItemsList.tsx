"use client";

import { useEffect, useState } from "react";
import type { Item, ItemType } from "@/lib/types";

const TYPE_STYLES: Record<string, string> = {
  deadline: "bg-red-500/15 text-red-300 border-red-500/30",
  event: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  class: "bg-purple-500/15 text-purple-300 border-purple-500/30",
  notice: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  personal: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
};
const PRIORITY_DOT: Record<string, string> = {
  high: "bg-red-400",
  medium: "bg-amber-400",
  low: "bg-slate-400",
};

export function fmt(dt: string | null) {
  if (!dt) return "No date";
  const d = new Date(dt);
  if (isNaN(d.getTime())) return dt;
  return d.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

let listeners: (() => void)[] = [];
export function refreshItems() {
  listeners.forEach((l) => l());
}

export default function ItemsList({
  types,
  emptyText = "Nothing here yet.",
  showDone = true,
}: {
  /** Restrict to these item types (serializable — safe across server→client). */
  types?: ItemType[];
  emptyText?: string;
  showDone?: boolean;
}) {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const res = await fetch("/api/items");
    if (res.ok) {
      const data = await res.json();
      setItems(data.items ?? []);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
    listeners.push(load);
    return () => {
      listeners = listeners.filter((l) => l !== load);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function mutate(action: string, itemId: string, status?: string) {
    const res = await fetch("/api/items/mutate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, itemId, status }),
    });
    if (res.ok) {
      const data = await res.json();
      setItems(data.items ?? []);
    }
  }

  let shown = types ? items.filter((i) => types.includes(i.type)) : items;
  if (!showDone) shown = shown.filter((i) => i.status !== "done");
  shown = [...shown].sort((a, b) => {
    const da = a.dueAt ? new Date(a.dueAt).getTime() : Infinity;
    const db = b.dueAt ? new Date(b.dueAt).getTime() : Infinity;
    return da - db;
  });

  if (loading) return <p className="text-sm text-slate-500">Loading…</p>;
  if (shown.length === 0)
    return <p className="text-sm text-slate-500">{emptyText}</p>;

  return (
    <ul className="space-y-2">
      {shown.map((it) => (
        <li
          key={it.id}
          className={`rounded-xl border border-white/10 bg-ink/40 p-3 ${
            it.status === "done" ? "opacity-50" : ""
          }`}
        >
          <div className="flex items-start gap-3">
            <button
              onClick={() =>
                mutate("toggle", it.id, it.status === "done" ? "open" : "done")
              }
              title="Toggle done"
              className={`mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded border ${
                it.status === "done"
                  ? "border-emerald-400 bg-emerald-400/20 text-emerald-300"
                  : "border-white/20"
              }`}
            >
              {it.status === "done" ? "✓" : ""}
            </button>
            <span
              className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                PRIORITY_DOT[it.priority]
              }`}
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-md border px-1.5 py-0.5 text-[10px] uppercase tracking-wide ${
                    TYPE_STYLES[it.type] ?? TYPE_STYLES.notice
                  }`}
                >
                  {it.type}
                </span>
                <p
                  className={`truncate font-medium ${
                    it.status === "done" ? "line-through" : ""
                  }`}
                >
                  {it.title}
                </p>
              </div>
              {it.description && (
                <p className="mt-0.5 text-xs text-slate-400">{it.description}</p>
              )}
              <p className="mt-1 text-xs text-slate-500">{fmt(it.dueAt)}</p>
            </div>
            <button
              onClick={() => mutate("delete", it.id)}
              className="text-slate-600 hover:text-red-400"
              title="Delete"
            >
              ✕
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
