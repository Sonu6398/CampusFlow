"use client";

import { useState } from "react";
import ItemsList, { refreshItems } from "@/components/ItemsList";

const SAMPLE = `Guys reminder: DSA Assignment 3 due this Friday 5pm, submit on the portal don't forget
Placement cell: TCS registration closes tomorrow 11:59pm, register on superset
Mess menu today dinner: paneer + roti + dal
Hostel notice: water supply off Saturday 10am-2pm for maintenance
DBMS quiz moved to Monday 9am in room 204
Club: Coding club meetup Thursday 6pm at the auditorium, bring laptops
Mom called - pay hostel fee before 20th`;

export default function Inbox() {
  const [text, setText] = useState("");
  const [summary, setSummary] = useState("");
  const [extractMsg, setExtractMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function process() {
    if (!text.trim()) return;
    setBusy(true);
    setSummary("");
    setExtractMsg("");
    try {
      const [sumRes, extRes] = await Promise.all([
        fetch("/api/summarize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        }),
        fetch("/api/extract", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        }),
      ]);
      const sum = await sumRes.json();
      const ext = await extRes.json();
      setSummary(sum.summary || "");
      const n = (ext.items || []).length;
      setExtractMsg(
        n > 0
          ? `✓ Added ${n} item${n > 1 ? "s" : ""} to your schedule.`
          : ext.error
          ? `Error: ${ext.error}`
          : "No actionable items found."
      );
      refreshItems();
      setText("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Inbox</h1>
        <p className="text-sm text-slate-400">
          Paste WhatsApp dumps, emails, or notices — CampusFlow summarizes them
          and adds deadlines & events to your schedule.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-panel/70 p-5">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="font-semibold">Dump the chaos</h2>
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
              placeholder="Paste a WhatsApp group dump, an email, a hostel notice…"
              className="h-48 w-full resize-none rounded-xl border border-white/10 bg-ink/60 p-3 text-sm outline-none focus:border-accent/50"
            />
            <button
              onClick={process}
              disabled={busy || !text.trim()}
              className="mt-3 w-full rounded-xl bg-accent py-2.5 font-semibold text-ink transition hover:brightness-110 disabled:opacity-40"
            >
              {busy ? "Understanding…" : "Summarize & organize →"}
            </button>
          </div>

          {(summary || extractMsg) && (
            <div className="rounded-2xl border border-white/10 bg-panel/70 p-5">
              <h2 className="mb-2 font-semibold">AI summary</h2>
              {summary ? (
                <p className="whitespace-pre-wrap text-sm text-slate-200">
                  {summary}
                </p>
              ) : (
                <p className="text-sm text-slate-500">No summary.</p>
              )}
              {extractMsg && (
                <p className="mt-3 text-sm text-emerald-300">{extractMsg}</p>
              )}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-white/10 bg-panel/70 p-5">
          <h2 className="mb-3 font-semibold">Your schedule</h2>
          <ItemsList emptyText="Process something on the left to populate your schedule." />
        </section>
      </div>
    </div>
  );
}
