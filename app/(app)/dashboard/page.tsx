import Link from "next/link";
import { currentUser } from "@/lib/auth";
import { store } from "@/lib/store";
import DigestCard from "@/components/DigestCard";
import ItemsList from "@/components/ItemsList";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default async function Dashboard() {
  const user = await currentUser();
  const uid = user!.id;
  const [routine, items] = await Promise.all([
    store().getRoutine(uid),
    store().getItems(uid),
  ]);

  const dow = new Date().getDay();
  const todayClasses = routine
    .filter((r) => r.day === dow)
    .sort((a, b) => a.start.localeCompare(b.start));

  const needsSetup = routine.length === 0 && items.length === 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          Hi {user!.name.split(" ")[0]} 👋
        </h1>
        <p className="text-sm text-slate-400">
          Here's your {DAYS[dow]} at a glance.
        </p>
      </div>

      {needsSetup && (
        <div className="rounded-2xl border border-accent/30 bg-accent/10 p-5">
          <p className="font-medium text-accent">Let's get you set up</p>
          <p className="mt-1 text-sm text-slate-300">
            Add your weekly timetable, then paste any WhatsApp/email chaos to
            fill your schedule.
          </p>
          <div className="mt-3 flex gap-2">
            <Link
              href="/onboarding"
              className="rounded-lg bg-accent px-4 py-1.5 text-sm font-semibold text-ink"
            >
              Set up routine
            </Link>
            <Link
              href="/inbox"
              className="rounded-lg border border-white/15 px-4 py-1.5 text-sm"
            >
              Go to Inbox
            </Link>
          </div>
        </div>
      )}

      <DigestCard />

      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-2xl border border-white/10 bg-panel/70 p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Today's classes</h2>
            <Link href="/onboarding" className="text-xs text-accent hover:underline">
              Edit
            </Link>
          </div>
          {todayClasses.length === 0 ? (
            <p className="text-sm text-slate-500">No classes today 🎉</p>
          ) : (
            <ul className="space-y-2">
              {todayClasses.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center gap-3 rounded-xl bg-ink/40 p-3"
                >
                  <span className="rounded-md bg-purple-500/15 px-2 py-1 text-xs text-purple-300">
                    {c.start}–{c.end}
                  </span>
                  <span className="font-medium">{c.title}</span>
                  {c.location && (
                    <span className="text-xs text-slate-500">@ {c.location}</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-white/10 bg-panel/70 p-5">
          <h2 className="mb-3 font-semibold">Upcoming deadlines</h2>
          <ItemsList
            types={["deadline", "event"]}
            emptyText="No deadlines. Paste updates in the Inbox to add some."
            showDone={false}
          />
        </section>
      </div>

      <section className="rounded-2xl border border-white/10 bg-panel/70 p-5">
        <h2 className="mb-3 font-semibold">Personal & notices</h2>
        <ItemsList
          types={["personal", "notice"]}
          emptyText="Nothing personal yet."
        />
      </section>
    </div>
  );
}
