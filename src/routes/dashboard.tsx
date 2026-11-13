import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { TrendingDown, TrendingUp, Flame, Check, Heart, Leaf, Target } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { eco, useEco } from "@/lib/eco-store";
import {
  CATEGORY_META, DAILY_TARGET_KG, categoryTotalsForDay, changeVsLastWeek, dailyTotals, dayKey, greenStreak, round2, type Category,
} from "@/lib/emissions";
import { CATEGORY_STYLE, CategoryIcon } from "@/components/eco/category";
import { Panel } from "@/components/eco/PageHeader";
import { EntryList } from "@/components/eco/EntryList";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "My Carbon Dashboard — EcoTrack" },
      { name: "description", content: "Today's carbon footprint, category breakdown, green streak and community feed." },
      { property: "og:title", content: "My Carbon Dashboard — EcoTrack" },
      { property: "og:description", content: "See today's CO₂e, your 7-day trend and your green streak." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

const CATS: Category[] = ["food", "travel", "waste", "reuse", "bills"];

function Dashboard() {
  const { ready, entries, feed } = useEco();

  const stats = useMemo(() => {
    const now = new Date();
    const byCat = categoryTotalsForDay(entries, now);
    const totals = dailyTotals(entries);
    const total = totals.get(dayKey(now)) ?? 0;
    const week = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() - (6 - i));
      return { day: d, kg: totals.get(dayKey(d)) ?? 0 };
    });
    const logged = new Set(entries.map((e) => dayKey(e.date)));
    const streakDays = week.map((w) => logged.has(dayKey(w.day)) && w.kg <= DAILY_TARGET_KG);
    return {
      total, byCat, week, streakDays,
      change: changeVsLastWeek(entries, now),
      streak: greenStreak(entries, now),
      avoided: round2(entries.filter((e) => e.category === "reuse").reduce((s, e) => s + e.kg, 0)),
    };
  }, [entries]);

  if (!ready) {
    return (
      <div className="mx-auto max-w-7xl space-y-4 px-4 py-10 sm:px-6">
        <Skeleton className="h-10 w-72" />
        <div className="grid gap-4 lg:grid-cols-3"><Skeleton className="h-56" /><Skeleton className="h-56" /><Skeleton className="h-56" /></div>
      </div>
    );
  }

  const maxWeek = Math.max(DAILY_TARGET_KG, ...stats.week.map((w) => w.kg));
  const down = stats.change !== null && stats.change <= 0;

  return (
    <div className="mx-auto max-w-7xl px-4 pb-10 sm:px-6">
      <div className="flex flex-col gap-2 pb-8 pt-10 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-primary">{format(new Date(), "EEEE, d MMMM")}</p>
          <h1 className="text-3xl font-extrabold text-forest sm:text-4xl">My Carbon Dashboard</h1>
        </div>
        <button onClick={() => eco.resetDemo()} className="self-start text-xs text-muted-foreground underline-offset-2 hover:underline sm:self-auto">
          Reset demo data
        </button>
      </div>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {/* Today */}
        <section className="relative overflow-hidden rounded-3xl bg-forest p-6 text-forest-foreground shadow-lift md:col-span-2">
          <div className="absolute inset-0 bg-glow opacity-40" />
          <div className="relative flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold opacity-80">Today's footprint</p>
              <p className="mt-1 font-display text-6xl font-extrabold tabular-nums">
                {stats.total.toFixed(1)}
                <span className="ml-2 text-2xl font-bold opacity-80">kg CO₂e</span>
              </p>
              <p className="mt-2 flex items-center gap-1.5 text-sm opacity-80">
                <Target className="size-4" /> Daily target {DAILY_TARGET_KG} kg CO₂e
              </p>
            </div>
            {stats.change !== null && stats.total > 0 && (
              <div className="rounded-2xl bg-background/10 px-4 py-3 text-right backdrop-blur">
                <p className="flex items-center justify-end gap-1 font-display text-2xl font-bold">
                  {down ? <TrendingDown className="size-5" /> : <TrendingUp className="size-5" />}
                  {Math.abs(stats.change)}%
                </p>
                <p className="text-xs opacity-80">{down ? "below" : "above"} last week's average</p>
              </div>
            )}
          </div>
          <div className="relative mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
            {CATS.map((c) => (
              <Link key={c} to={`/${c}` as const} className="rounded-2xl bg-card p-3 text-card-foreground transition hover:-translate-y-0.5">
                <div className="flex items-center gap-2">
                  <CategoryIcon category={c} size="sm" />
                  <span className="text-sm font-semibold">{CATEGORY_META[c].label}</span>
                </div>
                <p className={`mt-2 font-display text-xl font-bold tabular-nums ${CATEGORY_STYLE[c].text}`}>
                  {c === "reuse" && stats.byCat[c] > 0 ? "−" : ""}
                  {stats.byCat[c].toFixed(1)} kg CO₂e
                </p>
                {c === "reuse" && <p className="text-[11px] text-muted-foreground">avoided</p>}
              </Link>
            ))}
          </div>
        </section>

        {/* Streak */}
        <Panel title="My Green Streak" icon={<Flame className="size-5 text-waste" />}>
          <p className="font-display text-5xl font-extrabold text-primary">
            {stats.streak} <span className="text-2xl">days</span>
          </p>
          <p className="mt-1 text-sm text-muted-foreground">Days logged and kept under {DAILY_TARGET_KG} kg CO₂e.</p>
          <div className="mt-5 flex justify-between">
            {stats.week.map((w, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <span className={`inline-flex size-9 items-center justify-center rounded-full ${stats.streakDays[i] ? "bg-success text-primary-foreground" : "border-2 border-dashed border-border text-muted-foreground"}`}>
                  {stats.streakDays[i] && <Check className="size-4" />}
                </span>
                <span className="text-[11px] text-muted-foreground">{format(w.day, "EEEEE")}</span>
              </div>
            ))}
          </div>
          <div className="mt-5 flex items-center gap-2 rounded-2xl bg-reuse-soft p-3 text-sm">
            <Leaf className="size-4 text-reuse" /> <span><strong>{stats.avoided} kg CO₂e</strong> avoided through reuse</span>
          </div>
        </Panel>

        {/* Week chart */}
        <Panel title="Last 7 days (kg CO₂e)" className="md:col-span-2">
          <div className="relative flex h-48 items-end gap-3">
            <div className="pointer-events-none absolute inset-x-0 border-t-2 border-dashed border-waste/60" style={{ bottom: `${(DAILY_TARGET_KG / maxWeek) * 100}%` }}>
              <span className="absolute -top-5 right-0 text-[11px] font-semibold text-waste">target ({DAILY_TARGET_KG} kg CO₂e)</span>
            </div>
            {stats.week.map((w, i) => (
              <div key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                <span className="text-xs font-semibold tabular-nums text-muted-foreground">{w.kg ? w.kg.toFixed(1) : ""}</span>
                <div
                  className={`w-full max-w-12 rounded-t-xl transition-all ${w.kg > DAILY_TARGET_KG ? "bg-waste" : "bg-leaf"}`}
                  style={{ height: `${(w.kg / maxWeek) * 100}%`, minHeight: w.kg ? 6 : 2 }}
                />
                <span className="text-xs text-muted-foreground">{i === 6 ? "Today" : format(w.day, "EEE")}</span>
              </div>
            ))}
          </div>
        </Panel>

        {/* Community */}
        <Panel title="Community Feed" icon={<Heart className="size-5 text-destructive" />} className="md:col-span-2 lg:col-span-1">
          <ul className="space-y-4">
            {feed.slice(0, 3).map((p) => (
              <li key={p.id} className="flex gap-3">
                <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary font-display font-bold text-secondary-foreground">{p.author[0]}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm"><strong>{p.author}</strong> {p.text}</p>
                  <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{formatDistanceToNow(new Date(p.at), { addSuffix: true })}</span>
                    <button onClick={() => eco.toggleLike(p.id)} className={`flex items-center gap-1 ${p.liked ? "text-destructive" : ""}`} aria-label="Like">
                      <Heart className={`size-3.5 ${p.liked ? "fill-current" : ""}`} /> {p.likes}
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <Link to="/community" className="mt-4 inline-block text-sm font-semibold text-primary">Open community →</Link>
        </Panel>

        <Panel title="Recent activity" className="md:col-span-2 lg:col-span-3">
          <EntryList entries={entries} empty="Nothing logged yet — snap a meal or log a trip to start." limit={6} />
        </Panel>
      </div>
    </div>
  );
}
