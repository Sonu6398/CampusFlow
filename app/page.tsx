import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";

const FEATURES = [
  { t: "Routine Understanding", d: "Learns your weekly timetable & rhythm." },
  { t: "Update Summarization", d: "Turns WhatsApp/email chaos into clean updates." },
  { t: "Smart Scheduling", d: "Auto-builds your calendar & flags clashes." },
  { t: "Instant Q&A", d: "Ask anything about your schedule — by text or voice." },
  { t: "Proactive Alerts", d: "Nudges you before deadlines slip." },
  { t: "Personal Life", d: "Mess menu, hostel notices, wellness — in one place." },
];

export default async function Landing() {
  const user = await currentUser();
  if (user) redirect("/dashboard");

  return (
    <main className="mx-auto max-w-5xl px-5 py-16">
      <div className="text-center">
        <p className="mb-3 inline-block rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs text-accent">
          AI for Campus, Community & Everyday Life · Powered by Amazon Bedrock
        </p>
        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
          Campus<span className="text-accent">Flow</span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-300">
          The AI operating system for student life. Paste the chaos — class
          schedules, deadlines, hostel notices, club events — and CampusFlow
          organizes it, answers your questions, and nudges you before things
          slip.
        </p>
        <p className="mt-2 text-sm text-slate-500">
          “Alexa for your college life.”
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link
            href="/login"
            className="rounded-xl bg-accent px-6 py-3 font-semibold text-ink transition hover:brightness-110"
          >
            Get started →
          </Link>
        </div>
      </div>

      <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f) => (
          <div
            key={f.t}
            className="rounded-2xl border border-white/10 bg-panel/60 p-5"
          >
            <h3 className="font-semibold text-accent">{f.t}</h3>
            <p className="mt-1 text-sm text-slate-400">{f.d}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
