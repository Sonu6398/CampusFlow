"use client";

import { useEffect, useState } from "react";

type Digest = { summary: string; nudges: string[] };

export default function DigestCard() {
  const [digest, setDigest] = useState<Digest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  async function load() {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch("/api/digest");
      const data = await res.json();
      if (data.error || (!data.summary && (!data.nudges || data.nudges.length === 0))) {
        setError(Boolean(data.error));
        setDigest({ summary: data.summary || "", nudges: data.nudges || [] });
      } else {
        setDigest({ summary: data.summary, nudges: data.nudges });
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <section className="rounded-2xl border border-accent/30 bg-gradient-to-br from-accent/15 to-transparent p-5">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-semibold">
          <span>🔔 Your AI brief</span>
        </h2>
        <button
          onClick={load}
          disabled={loading}
          className="text-xs text-accent hover:underline disabled:opacity-50"
        >
          {loading ? "Thinking…" : "Refresh"}
        </button>
      </div>

      {loading && !digest && (
        <p className="text-sm text-slate-400">
          CampusFlow is reviewing your day…
        </p>
      )}

      {!loading && error && (
        <p className="text-sm text-slate-400">
          Couldn't generate a brief — check that Bedrock credentials are set.
        </p>
      )}

      {digest && (
        <>
          {digest.summary && (
            <p className="text-sm text-slate-200">{digest.summary}</p>
          )}
          {digest.nudges.length > 0 && (
            <ul className="mt-3 space-y-1.5">
              {digest.nudges.map((n, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                  <span className="mt-0.5 text-accent">›</span>
                  <span>{n}</span>
                </li>
              ))}
            </ul>
          )}
          {!digest.summary && digest.nudges.length === 0 && !error && (
            <p className="text-sm text-slate-400">
              Add your routine and some items to get a personalized brief.
            </p>
          )}
        </>
      )}
    </section>
  );
}
