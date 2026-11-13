import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, MapPin, Bell, Truck, Plus, Home } from "lucide-react";
import { toast } from "sonner";
import { eco, useEco } from "@/lib/eco-store";
import { WASTE_FACTORS, wasteEmission, type WasteKind } from "@/lib/emissions";
import { PageHeader, Panel } from "@/components/eco/PageHeader";
import { EntryList } from "@/components/eco/EntryList";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/waste")({
  head: () => ({
    meta: [
      { title: "Waste Management (Clean City) — EcoTrack" },
      { name: "description", content: "Garbage collection timetable, collector location, area-wise pickup alerts and waste logging." },
      { property: "og:title", content: "Waste Management (Clean City) — EcoTrack" },
      { property: "og:description", content: "Know when the collector arrives and log waste by type." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: WastePage,
});

type Slot = { days: number[]; type: "Wet" | "Dry" | "Recyclables" | "E-waste"; time: string };
const AREAS: Record<string, Slot[]> = {
  Koramangala: [
    { days: [1, 3, 5], type: "Wet", time: "7:00 AM" },
    { days: [2, 4], type: "Dry", time: "7:30 AM" },
    { days: [6], type: "Recyclables", time: "9:00 AM" },
  ],
  Indiranagar: [
    { days: [1, 2, 4, 5], type: "Wet", time: "6:30 AM" },
    { days: [3], type: "Dry", time: "7:00 AM" },
    { days: [6], type: "E-waste", time: "10:00 AM" },
  ],
  "HSR Layout": [
    { days: [1, 3, 5], type: "Wet", time: "7:15 AM" },
    { days: [2, 6], type: "Dry", time: "8:00 AM" },
    { days: [4], type: "Recyclables", time: "9:30 AM" },
  ],
  "BTM Layout": [
    { days: [2, 4, 6], type: "Wet", time: "6:45 AM" },
    { days: [1, 5], type: "Dry", time: "7:45 AM" },
  ],
};
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const TYPE_STYLE: Record<Slot["type"], string> = {
  Wet: "bg-food-soft text-food",
  Dry: "bg-waste-soft text-waste",
  Recyclables: "bg-reuse-soft text-reuse",
  "E-waste": "bg-bills-soft text-bills",
};

// Collector route on the mini-map (viewBox 0 0 400 260); last point is your home.
const HOME: [number, number] = [380, 40];
const ROUTE: [number, number][] = [
  [20, 230], [20, 150], [130, 150], [130, 60], [260, 60], [260, 150], [380, 150], HOME,
];
const SEGS = ROUTE.slice(1).map((b, i) => {
  const a = ROUTE[i] ?? b;
  return { a, b, len: Math.hypot(b[0] - a[0], b[1] - a[1]) };
});
const ROUTE_LEN = SEGS.reduce((s, x) => s + x.len, 0);
const TRIP_MIN = 40; // simulated minutes for the full route

function pointAt(t: number) {
  let d = t * ROUTE_LEN;
  for (const s of SEGS) {
    if (d <= s.len) return { x: s.a[0] + ((s.b[0] - s.a[0]) * d) / s.len, y: s.a[1] + ((s.b[1] - s.a[1]) * d) / s.len };
    d -= s.len;
  }
  return { x: HOME[0], y: HOME[1] };
}

function WastePage() {
  const { entries, settings } = useEco();
  const area = settings.area in AREAS ? settings.area : "Koramangala";
  const schedule: Slot[] = AREAS[area] ?? [];
  const today = new Date().getDay();
  const todays = schedule.filter((s) => s.days.includes(today));

  const [kind, setKind] = useState<WasteKind>("landfill");
  const [kg, setKg] = useState("1");

  // Simulated collector progress
  const [t, setT] = useState(0);
  const alerted = useRef({ near: false, arrived: false });
  useEffect(() => {
    const id = setInterval(() => setT((x) => (x >= 1.15 ? 0 : x + 0.004)), 500);
    return () => clearInterval(id);
  }, []);
  const progress = Math.min(1, t);
  const eta = Math.ceil((1 - progress) * TRIP_MIN);
  useEffect(() => {
    if (t === 0) alerted.current = { near: false, arrived: false };
    if (!settings.pickupAlerts) return;
    if (eta <= 15 && eta > 0 && !alerted.current.near) {
      alerted.current.near = true;
      toast(`🚛 Collector arriving in 15 min`, { description: `${area} pickup — keep your segregated bins ready.` });
    }
    if (progress >= 1 && !alerted.current.arrived) {
      alerted.current.arrived = true;
      toast.success("Collector has arrived at your street");
    }
  }, [eta, progress, t, settings.pickupAlerts, area]);

  const truck = pointAt(progress);
  const routePath = useMemo(() => ROUTE.map((p, i) => `${i ? "L" : "M"}${p[0]},${p[1]}`).join(" "), []);
  const home = HOME;
  const amount = Math.max(0, parseFloat(kg) || 0);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6">
      <PageHeader
        category="waste"
        title="Waste Management"
        tagline="Clean City"
        description="See when garbage is collected in your area, follow the collector, get a heads-up before they arrive, and log what you throw away."
        action={
          <Select value={area} onValueChange={(v) => eco.updateSettings({ area: v })}>
            <SelectTrigger className="w-52 rounded-full"><MapPin className="size-4" /><SelectValue /></SelectTrigger>
            <SelectContent>{Object.keys(AREAS).map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
          </Select>
        }
      />
      <div className="grid gap-5 lg:grid-cols-5">
        <Panel title="Collector's location" icon={<Truck className="size-5 text-waste" />} className="lg:col-span-3">
          <div className="relative overflow-hidden rounded-2xl bg-secondary">
            <svg viewBox="0 0 400 260" className="h-auto w-full" role="img" aria-label="Map showing the garbage truck moving towards your home">
              {[40, 100, 200, 240].map((y) => <line key={y} x1="0" x2="400" y1={y} y2={y} className="stroke-border" strokeWidth="10" />)}
              {[70, 200, 320].map((x) => <line key={x} y1="0" y2="260" x1={x} x2={x} className="stroke-border" strokeWidth="10" />)}
              <path d={routePath} fill="none" className="stroke-background" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" />
              <path d={routePath} fill="none" className="stroke-waste" strokeWidth="4" strokeDasharray="8 8" strokeLinecap="round" />
              <circle cx={home[0]} cy={home[1]} r="16" className="fill-primary" opacity="0.2" />
              <circle cx={home[0]} cy={home[1]} r="8" className="fill-primary" />
              <g transform={`translate(${truck.x - 14}, ${truck.y - 14})`} style={{ transition: "transform 0.5s linear" }}>
                <rect width="28" height="28" rx="8" className="fill-waste" />
                <path d="M7 18h14M8 18v-6h8v6M16 14h3l2 2v2" className="stroke-primary-foreground" strokeWidth="1.8" fill="none" strokeLinecap="round" />
              </g>
            </svg>
            <div className="absolute left-3 top-3 flex items-center gap-2 rounded-full bg-card px-3 py-1.5 text-sm font-semibold shadow-soft">
              <span className="relative flex size-2.5"><span className="absolute inline-flex size-full rounded-full bg-waste animate-ping-soft" /><span className="relative inline-flex size-2.5 rounded-full bg-waste" /></span>
              {progress >= 1 ? "Arrived" : `Arriving in ${eta} min`}
            </div>
            <div className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-card px-3 py-1.5 text-xs shadow-soft"><Home className="size-3.5 text-primary" /> Your home</div>
          </div>
          <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl bg-muted p-3">
            <div className="flex items-center gap-2">
              <Bell className="size-5 text-waste" />
              <div>
                <p className="text-sm font-semibold">Area-wise notifications</p>
                <p className="text-xs text-muted-foreground">“Collector arriving in 15 min” alerts for {area}</p>
              </div>
            </div>
            <Switch checked={settings.pickupAlerts} onCheckedChange={(v) => eco.updateSettings({ pickupAlerts: v })} aria-label="Pickup alerts" />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Demo feed: the truck runs a simulated route until your municipality's live tracking is connected.</p>
        </Panel>

        <Panel title="Collection timetable" icon={<CalendarDays className="size-5 text-waste" />} className="lg:col-span-2">
          {todays.length > 0 && (
            <div className="mb-4 rounded-2xl bg-waste-soft p-3 text-sm">
              <strong>Today:</strong> {todays.map((s) => `${s.type} at ${s.time}`).join(", ")}
            </div>
          )}
          <ul className="space-y-1.5">
            {DAYS.map((d, i) => {
              const slots = schedule.filter((s) => s.days.includes(i));
              return (
                <li key={d} className={`flex items-center gap-3 rounded-xl px-3 py-2 ${i === today ? "bg-secondary" : ""}`}>
                  <span className={`w-10 text-sm font-semibold ${i === today ? "text-primary" : "text-muted-foreground"}`}>{d}</span>
                  <div className="flex flex-1 flex-wrap gap-1.5">
                    {slots.length ? slots.map((s) => (
                      <span key={s.type} className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${TYPE_STYLE[s.type]}`}>{s.type} · {s.time}</span>
                    )) : <span className="text-xs text-muted-foreground">No pickup</span>}
                  </div>
                </li>
              );
            })}
          </ul>
        </Panel>

        <Panel title="Log waste" className="lg:col-span-2">
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-semibold">Type</Label>
              <div className="mt-2 grid gap-2">
                {(Object.keys(WASTE_FACTORS) as WasteKind[]).map((k) => (
                  <button key={k} onClick={() => setKind(k)} className={`flex justify-between rounded-xl border p-3 text-sm transition ${kind === k ? "border-waste bg-waste-soft font-semibold" : "border-border hover:bg-muted"}`}>
                    <span>{WASTE_FACTORS[k].label}</span>
                    <span className="text-muted-foreground">{WASTE_FACTORS[k].factor} kg CO₂e/kg</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="wkg" className="text-sm font-semibold">Weight (kg)</Label>
              <Input id="wkg" type="number" min="0" step="0.1" value={kg} onChange={(e) => setKg(e.target.value)} className="mt-2 h-11 rounded-xl" />
            </div>
            <Button
              variant="hero"
              className="w-full"
              onClick={() => {
                if (!amount) { toast.error("Enter a weight first."); return; }
                eco.addEntry({ category: "waste", title: `${WASTE_FACTORS[kind].label} · ${amount} kg`, kg: wasteEmission(kind, amount) });
                toast.success("Waste logged");
              }}
            >
              <Plus /> Log {wasteEmission(kind, amount).toFixed(2)} kg CO₂e
            </Button>
          </div>
        </Panel>
        <Panel title="Your waste log" className="lg:col-span-3">
          <EntryList entries={entries.filter((e) => e.category === "waste")} empty="No waste logged yet." limit={6} />
        </Panel>
      </div>
    </div>
  );
}
