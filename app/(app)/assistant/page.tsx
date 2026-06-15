"use client";

import { useEffect, useRef, useState } from "react";

type Msg = { role: "user" | "ai"; text: string };

const SUGGESTIONS = [
  "What's due this week?",
  "What's most urgent right now?",
  "What classes do I have today?",
  "Any clashes in my schedule?",
];

export default function Assistant() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const [speak, setSpeak] = useState(true);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const recognitionRef = useRef<any>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const SR =
      (typeof window !== "undefined" &&
        ((window as any).SpeechRecognition ||
          (window as any).webkitSpeechRecognition)) ||
      null;
    if (SR) {
      setVoiceSupported(true);
      const rec = new SR();
      rec.lang = "en-IN";
      rec.interimResults = false;
      rec.maxAlternatives = 1;
      rec.onresult = (e: any) => {
        const transcript = e.results[0][0].transcript;
        setInput(transcript);
        setListening(false);
        send(transcript);
      };
      rec.onerror = () => setListening(false);
      rec.onend = () => setListening(false);
      recognitionRef.current = rec;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function speakText(text: string) {
    if (!speak || typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "en-IN";
    u.rate = 1.05;
    window.speechSynthesis.speak(u);
  }

  function toggleMic() {
    const rec = recognitionRef.current;
    if (!rec) return;
    if (listening) {
      rec.stop();
      setListening(false);
    } else {
      window.speechSynthesis?.cancel();
      setListening(true);
      try {
        rec.start();
      } catch {
        setListening(false);
      }
    }
  }

  async function send(q?: string) {
    const question = (q ?? input).trim();
    if (!question || busy) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text: question }]);
    setBusy(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const data = await res.json();
      const answer = data.answer || "…";
      setMessages((m) => [...m, { role: "ai", text: answer }]);
      speakText(answer);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "ai", text: "Network error reaching the assistant." },
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold">Assistant</h1>
          <p className="text-sm text-slate-400">
            Ask about your schedule — type or talk. “Alexa for college life.”
          </p>
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-400">
          <input
            type="checkbox"
            checked={speak}
            onChange={(e) => setSpeak(e.target.checked)}
            className="accent-[color:var(--tw-accent,#ff9900)]"
          />
          🔊 Speak answers
        </label>
      </div>

      <div className="min-h-[55vh] rounded-2xl border border-white/10 bg-panel/70 p-5">
        {messages.length === 0 ? (
          <div className="space-y-4">
            <p className="text-sm text-slate-400">
              Try asking:
            </p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-full border border-white/10 bg-ink/50 px-3 py-1.5 text-sm text-slate-300 hover:border-accent/40"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${
                  m.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2 text-sm ${
                    m.role === "user"
                      ? "bg-accent text-ink"
                      : "bg-ink/60 text-slate-200"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {busy && (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-ink/60 px-4 py-2 text-sm text-slate-400">
                  thinking…
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        {voiceSupported && (
          <button
            onClick={toggleMic}
            title="Talk to CampusFlow"
            className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl border transition ${
              listening
                ? "animate-pulse border-red-400 bg-red-500/20 text-red-300"
                : "border-white/15 text-slate-300 hover:border-accent/40"
            }`}
          >
            🎤
          </button>
        )}
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder={listening ? "Listening…" : "Ask anything about your schedule…"}
          className="flex-1 rounded-xl border border-white/10 bg-ink/60 px-4 py-2.5 text-sm outline-none focus:border-accent/50"
        />
        <button
          onClick={() => send()}
          disabled={busy || !input.trim()}
          className="rounded-xl bg-accent px-5 py-2.5 font-semibold text-ink transition hover:brightness-110 disabled:opacity-40"
        >
          Send
        </button>
      </div>
      {!voiceSupported && (
        <p className="text-center text-xs text-slate-600">
          Voice input needs Chrome/Edge. Text chat works everywhere.
        </p>
      )}
    </div>
  );
}
