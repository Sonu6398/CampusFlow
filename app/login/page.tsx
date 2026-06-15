"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    college: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function set(k: string, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-5">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold tracking-tight">
            Campus<span className="text-accent">Flow</span>
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Your AI operating system for student life
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-panel/70 p-6">
          <div className="mb-5 flex rounded-xl bg-ink/60 p-1 text-sm">
            {(["login", "signup"] as const).map((m) => (
              <button
                key={m}
                onClick={() => {
                  setMode(m);
                  setError("");
                }}
                className={`flex-1 rounded-lg py-2 font-medium capitalize transition ${
                  mode === m ? "bg-accent text-ink" : "text-slate-400"
                }`}
              >
                {m === "login" ? "Log in" : "Sign up"}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="space-y-3">
            {mode === "signup" && (
              <>
                <Field
                  label="Name"
                  value={form.name}
                  onChange={(v) => set("name", v)}
                  placeholder="Aarav Sharma"
                />
                <Field
                  label="College (optional)"
                  value={form.college}
                  onChange={(v) => set("college", v)}
                  placeholder="IIT Delhi"
                />
              </>
            )}
            <Field
              label="Email"
              type="email"
              value={form.email}
              onChange={(v) => set("email", v)}
              placeholder="you@college.edu"
            />
            <Field
              label="Password"
              type="password"
              value={form.password}
              onChange={(v) => set("password", v)}
              placeholder="6+ characters"
            />

            {error && (
              <p className="rounded-lg bg-red-500/15 px-3 py-2 text-sm text-red-300">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-accent py-2.5 font-semibold text-ink transition hover:brightness-110 disabled:opacity-50"
            >
              {loading
                ? "Please wait…"
                : mode === "login"
                ? "Log in"
                : "Create account"}
            </button>
          </form>
        </div>
        <p className="mt-4 text-center text-xs text-slate-600">
          Powered by Amazon Bedrock · HackOn with Amazon S6
        </p>
      </div>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-slate-400">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-white/10 bg-ink/60 px-3 py-2 text-sm outline-none focus:border-accent/50"
      />
    </label>
  );
}
