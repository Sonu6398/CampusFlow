import { currentUserId } from "@/lib/auth";
import { store } from "@/lib/store";
import ConflictBanner from "@/components/ConflictBanner";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function weekDates(): Date[] {
  const now = new Date();
  const day = now.getDay(); // 0 Sun..6 Sat
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((day + 6) % 7)); // back to Monday
  monday.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

export default async function CalendarPage() {
  const uid = currentUserId()!;
  const [routine, items] = await Promise.all([
    store().getRoutine(uid),
    store().getItems(uid),
  ]);

  const dates = weekDates();
  const todayKey = new Date().toDateString();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">This week</h1>
        <p className="text-sm text-slate-400">
          Your classes and deadlines, with AI conflict detection.
        </p>
      </div>

      <ConflictBanner />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-7">
        {dates.map((d) => {
          const dow = d.getDay();
          const classes = routine
            .filter((r) => r.day === dow)
            .sort((a, b) => a.start.localeCompare(b.start));
          const dayItems = items
            .filter(
              (i) => i.dueAt && new Date(i.dueAt).toDateString() === d.toDateString()
            )
            .sort(
              (a, b) =>
                new Date(a.dueAt!).getTime() - new Date(b.dueAt!).getTime()
            );
          const isToday = d.toDateString() === todayKey;
          return (
            <div
              key={d.toISOString()}
              className={`rounded-2xl border p-3 ${
                isToday
                  ? "border-accent/40 bg-accent/10"
                  : "border-white/10 bg-panel/60"
              }`}
            >
              <div className="mb-2 text-center">
                <p className="text-xs text-slate-400">{DAYS[dow]}</p>
                <p className={`text-lg font-bold ${isToday ? "text-accent" : ""}`}>
                  {d.getDate()}
                </p>
              </div>
              <div className="space-y-1.5">
                {classes.map((c) => (
                  <div
                    key={c.id}
                    className="rounded-lg bg-purple-500/15 p-1.5 text-[11px] text-purple-200"
                  >
                    <span className="block font-medium">{c.title}</span>
                    <span className="text-purple-300/70">
                      {c.start}–{c.end}
                    </span>
                  </div>
                ))}
                {dayItems.map((i) => (
                  <div
                    key={i.id}
                    className={`rounded-lg p-1.5 text-[11px] ${
                      i.priority === "high"
                        ? "bg-red-500/15 text-red-200"
                        : "bg-blue-500/15 text-blue-200"
                    }`}
                  >
                    <span className="block font-medium">{i.title}</span>
                    <span className="opacity-70">
                      {new Date(i.dueAt!).toLocaleTimeString(undefined, {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                ))}
                {classes.length === 0 && dayItems.length === 0 && (
                  <p className="text-center text-[11px] text-slate-600">—</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
