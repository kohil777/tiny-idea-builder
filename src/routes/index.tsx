import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight, Camera, Cpu, BarChart3, Users, MapPin, Bell, CalendarDays, ScanLine, ShieldCheck, Lock, Leaf, Building2, Recycle,
} from "lucide-react";
import heroImg from "@/assets/eco-planet-hero.jpg";
import { Button } from "@/components/ui/button";
import { CategoryIcon } from "@/components/eco/category";
import type { Category } from "@/lib/emissions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "EcoTrack — Integrated Carbon Intelligence for Everyday Life" },
      { name: "description", content: "One AI-powered app to track and cut your daily carbon footprint from food, travel, waste, bills and reuse — and build a greener community." },
      { property: "og:title", content: "EcoTrack — Integrated Carbon Intelligence for Everyday Life" },
      { property: "og:description", content: "Snap meals, track trips, upload bills and give items a second life. See your daily CO₂e and build a green streak." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const FEATURES: { category: Category; to: "/food" | "/travel" | "/waste" | "/reuse" | "/bills"; title: string; tagline: string; points: string[] }[] = [
  { category: "food", to: "/food", title: "Food Tracking", tagline: "Eat Green", points: ["Snap your meal", "AI identifies items & calories", "See each meal's carbon footprint"] },
  { category: "travel", to: "/travel", title: "Travel Tracking", tagline: "Move Smart", points: ["Optional GPS trip tracking", "Detects vehicle & passengers", "Suggests bus, carpool, walk or cycle"] },
  { category: "waste", to: "/waste", title: "Waste Management", tagline: "Clean City", points: ["Garbage collection timetable", "Live collector location", "“Collector arriving in 15 min” alerts"] },
  { category: "reuse", to: "/reuse", title: "Reuse & Recycle", tagline: "Give It a New Life", points: ["List clothes, cardboard, metal…", "Neighbours request & collect", "Reuse • Recycle • Rehome"] },
  { category: "bills", to: "/bills", title: "Bills & Invoices", tagline: "Know Your Impact", points: ["Upload utility or purchase bills", "AI reads & estimates CO₂e", "EPA, DEFRA & India GHG factors"] },
];

const STEPS = [
  { icon: Camera, title: "Snap / Track", text: "Food, travel, waste, items, bills" },
  { icon: Cpu, title: "AI Analyzes", text: "Identify and calculate carbon impact" },
  { icon: BarChart3, title: "Track & Improve", text: "Dashboard, streaks, suggestions" },
  { icon: Users, title: "Act Together", text: "Community sharing & exchange" },
];

function Landing() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-hero">
        <img
          src={heroImg}
          alt="A green planet with trees, wind turbines and clean city towers"
          width={1600}
          height={912}
          className="absolute inset-0 h-full w-full object-cover object-right opacity-90"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-20 sm:px-6 md:py-28 lg:grid-cols-2">
          <div className="animate-rise">
            <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
              <Leaf className="size-3.5" /> Carbon Intelligence Hackathon
            </span>
            <h1 className="mt-5 text-5xl font-extrabold leading-[1.02] text-forest sm:text-6xl">
              Integrated carbon intelligence for <span className="text-primary">everyday life.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted-foreground">
              One AI-powered app that tracks and reduces your daily footprint from{" "}
              <span className="rounded bg-accent px-1 font-semibold text-accent-foreground">food, travel, waste, bills and reuse</span>{" "}
              — and builds a greener community together.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild variant="hero" size="xl">
                <Link to="/dashboard">
                  Open my dashboard <ArrowRight />
                </Link>
              </Button>
              <Button asChild variant="soft" size="xl">
                <Link to="/food">
                  <Camera /> Snap a meal
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <h2 className="text-3xl font-extrabold text-forest sm:text-4xl">Five everyday sources. One footprint.</h2>
        <p className="mt-2 max-w-2xl text-muted-foreground">Every module feeds the same dashboard, so you always know where your carbon comes from.</p>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <Link
              key={f.to}
              to={f.to}
              className="group animate-rise rounded-3xl border border-border bg-card p-6 shadow-soft transition hover:-translate-y-1 hover:shadow-lift"
              style={{ animationDelay: `${i * 70}ms` }}
            >
              <CategoryIcon category={f.category} size="lg" />
              <h3 className="mt-5 text-xl font-bold text-forest">
                {f.title} <span className="font-semibold text-primary">({f.tagline})</span>
              </h3>
              <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                {f.points.map((p) => (
                  <li key={p} className="flex gap-2">
                    <Leaf className="mt-0.5 size-3.5 shrink-0 text-leaf" /> {p}
                  </li>
                ))}
              </ul>
              <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                Open <ArrowRight className="size-4 transition group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
          <div className="flex flex-col justify-between rounded-3xl bg-forest p-6 text-forest-foreground shadow-lift">
            <div>
              <p className="text-sm font-semibold opacity-80">My Green Streak</p>
              <p className="mt-2 font-display text-5xl font-extrabold">12 days</p>
              <p className="mt-2 text-sm opacity-80">Stay under 10 kg CO₂e a day to keep it going.</p>
            </div>
            <Button asChild variant="hero" className="mt-6 self-start">
              <Link to="/dashboard">See your streak</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-secondary/60 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h2 className="text-3xl font-extrabold text-forest sm:text-4xl">How it works</h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <div key={s.title} className="relative rounded-3xl bg-card p-6 shadow-soft">
                <span className="font-display text-sm font-bold text-primary">0{i + 1}</span>
                <s.icon className="mt-3 size-8 text-primary" />
                <h3 className="mt-3 text-lg font-bold text-forest">{s.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Waste spotlight + privacy + impact */}
      <section className="mx-auto grid max-w-7xl gap-5 px-4 py-20 sm:px-6 lg:grid-cols-3">
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
          <h3 className="text-xl font-bold text-forest">Clean-city tools</h3>
          <ul className="mt-4 space-y-3 text-sm">
            <li className="flex items-center gap-3"><CalendarDays className="size-5 text-waste" /> Garbage collection timetable</li>
            <li className="flex items-center gap-3"><MapPin className="size-5 text-waste" /> Collector's live location</li>
            <li className="flex items-center gap-3"><Bell className="size-5 text-waste" /> Area-wise pickup alerts</li>
            <li className="flex items-center gap-3"><ScanLine className="size-5 text-bills" /> AI bill reading</li>
          </ul>
        </div>
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
          <h3 className="flex items-center gap-2 text-xl font-bold text-forest"><ShieldCheck className="size-5 text-primary" /> Your data, your choice</h3>
          <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
            <li><strong className="text-foreground">GPS tracking is optional</strong> — disable it anytime.</li>
            <li><strong className="text-foreground">You control what you share</strong> — meals, trips, bills.</li>
            <li className="flex gap-2"><Lock className="mt-0.5 size-4 shrink-0" /> Kept on your device and used only for carbon insights.</li>
          </ul>
          <Button asChild variant="link" className="mt-2 px-0"><Link to="/privacy">Privacy settings →</Link></Button>
        </div>
        <div className="rounded-3xl bg-leaf p-6 text-primary-foreground shadow-lift">
          <h3 className="text-xl font-bold">Impact</h3>
          <ul className="mt-4 space-y-4">
            <li className="flex items-center gap-3"><Leaf className="size-6" /> Lower personal emissions</li>
            <li className="flex items-center gap-3"><Building2 className="size-6" /> Cleaner, well-managed cities</li>
            <li className="flex items-center gap-3"><Recycle className="size-6" /> Less waste through reuse & recycling</li>
          </ul>
        </div>
      </section>
    </div>
  );
}
