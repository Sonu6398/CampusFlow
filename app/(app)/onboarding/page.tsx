"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { RoutineEntry } from "@/lib/types";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const SAMPLE = `Mon Wed Fri 9-10am DSA in Room 204
Mon Thu 11am-12:30pm DBMS lab
Tue 2-3pm Operating Systems, room 110
Wed 4-5pm Coding club
Fri 3-4pm Maths tutorial`;

export default function Onboarding() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [entries, setEntries] = useState<RoutineEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  async function parse() {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/routine/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      setEntries(data.entries ?? []);
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    setSaving(true);
    try {
      await fetch("/api/routine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entries }),
      });
      router.push("/dashboard");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  function update(i: number, k: keyof RoutineEntry, v: string) {
    setEntries((e) =>
      e.map((row, idx) =>
        idx === i ? { ...row, [k]: k === "day" ? Number(v) : v } : row
      )
    );
  }
  function remove(i: number) {
    setEntries((e) => e.filter((_, idx) => idx !== i));
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Set up your weekly routine</h1>
        <p className="text-sm text-slate-400">
          Paste your timetable in any format — CampusFlow understands it.
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-panel/70 p-5">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-semibold">Your timetable</h2>
          <button
            onClick={() => setText(SAMPLE)}
            className="text-xs text-accent hover:underline"
          >
            Load sample
          </button>
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="e.g. Mon Wed Fri 9-10am DSA in Room 204…"
          className="h-32 w-full resize-none rounded-xl border border-white/10 bg-ink/60 p-3 text-sm outline-none focus:border-accent/50"
        />
        <button
          onClick={parse}
          disabled={loading || !text.trim()}
          className="mt-3 rounded-xl bg-accent px-5 py-2 font-semibold text-ink transition hover:brightness-110 disabled:opacity-40"
        >
          {loading ? "Reading your timetable…" : "Parse with AI →"}
        </button>
      </div>

      {entries.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-panel/70 p-5">
          <h2 className="mb-3 font-semibold">
            Review your classes ({entries.length})
          </h2>
          <div className="space-y-2">
            {entries.map((e, i) => (
              <div
                key={e.id}
                className="grid grid-cols-12 items-center gap-2 rounded-lg bg-ink/40 p-2 text-sm"
              >
                <select
                  value={e.day}
                  onChange={(ev) => update(i, "day", ev.target.value)}
                  className="col-span-2 rounded bg-ink/60 px-2 py-1"
                >
                  {DAYS.map((d, idx) => (
                    <option key={idx} value={idx}>
                      {d}
                    </option>
                  ))}
                </select>
                <input
                  value={e.start}
                  onChange={(ev) => update(i, "start", ev.target.value)}
                  className="col-span-2 rounded bg-ink/60 px-2 py-1"
                />
                <input
                  value={e.end}
                  onChange={(ev) => update(i, "end", ev.target.value)}
                  className="col-span-2 rounded bg-ink/60 px-2 py-1"
                />
                <input
                  value={e.title}
                  onChange={(ev) => update(i, "title", ev.target.value)}
                  className="col-span-5 rounded bg-ink/60 px-2 py-1"
                />
                <button
                  onClick={() => remove(i)}
                  className="col-span-1 text-slate-500 hover:text-red-400"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={save}
            disabled={saving}
            className="mt-4 rounded-xl bg-accent px-5 py-2 font-semibold text-ink transition hover:brightness-110 disabled:opacity-40"
          >
            {saving ? "Saving…" : "Save routine & continue →"}
          </button>
        </div>
      )}
    </div>
  );
}
