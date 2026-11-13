import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarDays,
  MapPin,
  Bell,
  Truck,
  Plus,
  Home,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Info,
  Building2,
  CalendarCheck,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
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
      { title: "Bangalore Waste Collection & Schedule Tracker — EcoTrack" },
      {
        name: "description",
        content:
          "Live Bangalore locality garbage collection schedules, daily expected timings, next pickup calculation, and door-to-door tracking.",
      },
      { property: "og:title", content: "Bangalore Waste Collection Tracker — EcoTrack" },
      { property: "og:description", content: "Track daily collection timings and schedules across Bangalore localities." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: WastePage,
});

export interface LocalitySchedule {
  name: string;
  zone: string;
  ward: string;
  timeWindow: string;
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  frequency: string;
  dryDays: number[]; // 0=Sun, 1=Mon, ..., 6=Sat
  dryWasteDayNames: string;
  sanitaryDaily: boolean;
  eWasteInfo: string;
}

// Actual Bangalore Municipal (BBMP) Ward Beats & Model Demonstration Schedules
const BANGALORE_LOCALITIES: Record<string, LocalitySchedule> = {
  Bannerghatta: {
    name: "Bannerghatta",
    zone: "Bommanahalli / Anekal Border",
    ward: "Ward 194 Extended Beat",
    timeWindow: "7:00 AM – 8:45 AM",
    startHour: 7,
    startMinute: 0,
    endHour: 8,
    endMinute: 45,
    frequency: "Daily (Wet & Sanitary Daily; Dry waste on Tue & Fri)",
    dryDays: [2, 5],
    dryWasteDayNames: "Tuesday, Friday",
    sanitaryDaily: true,
    eWasteInfo: "1st Saturday of month (Ward Center)",
  },
  Gottigere: {
    name: "Gottigere",
    zone: "Bommanahalli Zone",
    ward: "Ward 194",
    timeWindow: "6:30 AM – 8:15 AM",
    startHour: 6,
    startMinute: 30,
    endHour: 8,
    endMinute: 15,
    frequency: "Daily (Wet & Sanitary Daily; Dry waste on Tue, Thu, Sat)",
    dryDays: [2, 4, 6],
    dryWasteDayNames: "Tuesday, Thursday, Saturday",
    sanitaryDaily: true,
    eWasteInfo: "2nd Saturday of month",
  },
  "Meenakshi Layout": {
    name: "Meenakshi Layout",
    zone: "Bommanahalli Zone",
    ward: "Ward 193 (Bannerghatta Rd)",
    timeWindow: "7:15 AM – 9:00 AM",
    startHour: 7,
    startMinute: 15,
    endHour: 9,
    endMinute: 0,
    frequency: "Daily (Wet & Sanitary Daily; Dry waste on Mon & Thu)",
    dryDays: [1, 4],
    dryWasteDayNames: "Monday, Thursday",
    sanitaryDaily: true,
    eWasteInfo: "Last Saturday of month",
  },
  "JP Nagar": {
    name: "JP Nagar",
    zone: "South Zone",
    ward: "Wards 177 & 178 (Phases 1–7)",
    timeWindow: "6:45 AM – 8:30 AM",
    startHour: 6,
    startMinute: 45,
    endHour: 8,
    endMinute: 30,
    frequency: "Daily (Wet & Sanitary Daily; Dry waste on Tue, Thu, Sat)",
    dryDays: [2, 4, 6],
    dryWasteDayNames: "Tuesday, Thursday, Saturday",
    sanitaryDaily: true,
    eWasteInfo: "1st & 3rd Saturday",
  },
  Jayanagar: {
    name: "Jayanagar",
    zone: "South Zone",
    ward: "Wards 168 & 169 (Blocks 1–9)",
    timeWindow: "6:30 AM – 8:15 AM",
    startHour: 6,
    startMinute: 30,
    endHour: 8,
    endMinute: 15,
    frequency: "Daily (Wet & Sanitary Daily; Dry waste on Mon, Wed, Fri)",
    dryDays: [1, 3, 5],
    dryWasteDayNames: "Monday, Wednesday, Friday",
    sanitaryDaily: true,
    eWasteInfo: "1st Saturday of month",
  },
  "BTM Layout": {
    name: "BTM Layout",
    zone: "South Zone",
    ward: "Wards 172 & 173 (Stages 1 & 2)",
    timeWindow: "6:45 AM – 8:30 AM",
    startHour: 6,
    startMinute: 45,
    endHour: 8,
    endMinute: 30,
    frequency: "Daily (Wet & Sanitary Daily; Dry waste on Tue & Fri)",
    dryDays: [2, 5],
    dryWasteDayNames: "Tuesday, Friday",
    sanitaryDaily: true,
    eWasteInfo: "2nd Saturday of month",
  },
  "Electronic City": {
    name: "Electronic City",
    zone: "ELCITA Township / South Suburb",
    ward: "Phases 1 & 2 Township Beats",
    timeWindow: "7:00 AM – 9:00 AM",
    startHour: 7,
    startMinute: 0,
    endHour: 9,
    endMinute: 0,
    frequency: "Daily (Wet & Segregated Dry Daily by ELCITA)",
    dryDays: [0, 1, 2, 3, 4, 5, 6],
    dryWasteDayNames: "Daily (All 7 days)",
    sanitaryDaily: true,
    eWasteInfo: "Every Saturday Drop-off Centre",
  },
  Hulimavu: {
    name: "Hulimavu",
    zone: "Bommanahalli Zone",
    ward: "Ward 193",
    timeWindow: "7:00 AM – 8:45 AM",
    startHour: 7,
    startMinute: 0,
    endHour: 8,
    endMinute: 45,
    frequency: "Daily (Wet & Sanitary Daily; Dry waste on Tue, Thu, Sat)",
    dryDays: [2, 4, 6],
    dryWasteDayNames: "Tuesday, Thursday, Saturday",
    sanitaryDaily: true,
    eWasteInfo: "3rd Saturday of month",
  },
  Arekere: {
    name: "Arekere",
    zone: "Bommanahalli Zone",
    ward: "Ward 193 (Arekere Mico Layout)",
    timeWindow: "6:45 AM – 8:30 AM",
    startHour: 6,
    startMinute: 45,
    endHour: 8,
    endMinute: 30,
    frequency: "Daily (Wet & Sanitary Daily; Dry waste on Tue, Thu, Sat)",
    dryDays: [2, 4, 6],
    dryWasteDayNames: "Tuesday, Thursday, Saturday",
    sanitaryDaily: true,
    eWasteInfo: "3rd Saturday of month",
  },
  Koramangala: {
    name: "Koramangala",
    zone: "South Zone",
    ward: "Ward 151 (Blocks 1–8)",
    timeWindow: "7:00 AM – 8:45 AM",
    startHour: 7,
    startMinute: 0,
    endHour: 8,
    endMinute: 45,
    frequency: "Daily (Wet & Sanitary Daily; Dry waste on Mon, Wed, Fri)",
    dryDays: [1, 3, 5],
    dryWasteDayNames: "Monday, Wednesday, Friday",
    sanitaryDaily: true,
    eWasteInfo: "1st Saturday of month",
  },
  "HSR Layout": {
    name: "HSR Layout",
    zone: "Bommanahalli Zone",
    ward: "Ward 174 (Sectors 1–7)",
    timeWindow: "7:15 AM – 9:00 AM",
    startHour: 7,
    startMinute: 15,
    endHour: 9,
    endMinute: 0,
    frequency: "Daily (Wet & Sanitary Daily; Dry waste on Tue, Thu, Sat)",
    dryDays: [2, 4, 6],
    dryWasteDayNames: "Tuesday, Thursday, Saturday",
    sanitaryDaily: true,
    eWasteInfo: "2nd Saturday of month",
  },
  Indiranagar: {
    name: "Indiranagar",
    zone: "East Zone",
    ward: "Wards 80 & 89 (HAL 2nd & 3rd Stage)",
    timeWindow: "6:30 AM – 8:15 AM",
    startHour: 6,
    startMinute: 30,
    endHour: 8,
    endMinute: 15,
    frequency: "Daily (Wet & Sanitary Daily; Dry waste on Mon, Wed, Fri)",
    dryDays: [1, 3, 5],
    dryWasteDayNames: "Monday, Wednesday, Friday",
    sanitaryDaily: true,
    eWasteInfo: "1st Saturday of month",
  },
  Whitefield: {
    name: "Whitefield",
    zone: "Mahadevapura Zone",
    ward: "Ward 84 (Kadugodi / ECC Road)",
    timeWindow: "7:30 AM – 9:30 AM",
    startHour: 7,
    startMinute: 30,
    endHour: 9,
    endMinute: 30,
    frequency: "Daily (Wet & Sanitary Daily; Dry waste on Tue & Fri)",
    dryDays: [2, 5],
    dryWasteDayNames: "Tuesday, Friday",
    sanitaryDaily: true,
    eWasteInfo: "Last Saturday of month",
  },
  Bellandur: {
    name: "Bellandur",
    zone: "Mahadevapura Zone",
    ward: "Ward 150 (Green Glen / ORR)",
    timeWindow: "7:15 AM – 9:15 AM",
    startHour: 7,
    startMinute: 15,
    endHour: 9,
    endMinute: 15,
    frequency: "Daily (Wet & Sanitary Daily; Dry waste on Mon, Thu, Sat)",
    dryDays: [1, 4, 6],
    dryWasteDayNames: "Monday, Thursday, Saturday",
    sanitaryDaily: true,
    eWasteInfo: "3rd Saturday of month",
  },
};

function formatTime(h: number, m: number) {
  const period = h >= 12 ? "PM" : "AM";
  const displayHour = h % 12 || 12;
  const displayMinute = m < 10 ? `0${m}` : m;
  return `${displayHour}:${displayMinute} ${period}`;
}

// Collector route on the mini-map (viewBox 0 0 400 260); last point is your home.
const HOME: [number, number] = [380, 40];
const ROUTE: [number, number][] = [
  [20, 230],
  [20, 150],
  [130, 150],
  [130, 60],
  [260, 60],
  [260, 150],
  [380, 150],
  HOME,
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
    if (d <= s.len)
      return {
        x: s.a[0] + ((s.b[0] - s.a[0]) * d) / s.len,
        y: s.a[1] + ((s.b[1] - s.a[1]) * d) / s.len,
      };
    d -= s.len;
  }
  return { x: HOME[0], y: HOME[1] };
}

function WastePage() {
  const { entries, settings } = useEco();

  // Active City: Fixed to Bangalore as required
  const selectedCity = "Bangalore";

  // Locality selection: fall back to Koramangala if not found
  const selectedAreaKey = settings.area in BANGALORE_LOCALITIES ? settings.area : "Koramangala";
  const locality = BANGALORE_LOCALITIES[selectedAreaKey] ?? BANGALORE_LOCALITIES.Koramangala;

  // Status Simulation Switch: "auto" (calculated by real clock) or manual override
  const [statusOverride, setStatusOverride] = useState<"auto" | "Upcoming" | "Collected" | "Delayed">("auto");

  // Waste log state
  const [kind, setKind] = useState<WasteKind>("landfill");
  const [kg, setKg] = useState("1");

  // Real-time calculation of Next Collection and Collection Status
  const collectionInfo = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), locality.startHour, locality.startMinute);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), locality.endHour, locality.endMinute);

    let naturalStatus: "Upcoming" | "Collected" | "Delayed";
    if (now < todayStart) {
      naturalStatus = "Upcoming";
    } else if (now <= todayEnd) {
      naturalStatus = "Upcoming";
    } else {
      naturalStatus = "Collected";
    }

    const effectiveStatus = statusOverride !== "auto" ? statusOverride : naturalStatus;

    // Next collection time calculation
    let nextText = "";
    if (effectiveStatus === "Upcoming") {
      if (now < todayStart) {
        nextText = `Today at ${formatTime(locality.startHour, locality.startMinute)}`;
      } else {
        nextText = `Window Open Now (Ends ${formatTime(locality.endHour, locality.endMinute)})`;
      }
    } else if (effectiveStatus === "Delayed") {
      nextText = `Delayed · Estimated by ${formatTime(locality.startHour + 1, locality.startMinute)}`;
    } else {
      // Collected today -> next pickup is tomorrow morning
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      nextText = `Tomorrow, ${format(tomorrow, "EEE d MMM")} at ${formatTime(locality.startHour, locality.startMinute)}`;
    }

    return {
      status: effectiveStatus,
      nextText,
      collectionDate: format(now, "EEEE, d MMMM yyyy"),
    };
  }, [locality, statusOverride]);

  // Upcoming 7-day daily schedule
  const upcomingDailySchedules = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now);
      d.setDate(now.getDate() + i);
      const dayOfWeek = d.getDay();
      const isToday = i === 0;
      const isTomorrow = i === 1;
      const hasDry = locality.dryDays.includes(dayOfWeek);

      let dayStatus: "Upcoming" | "Collected" | "Delayed" | "Scheduled" = "Scheduled";
      if (isToday) {
        dayStatus = collectionInfo.status;
      }

      return {
        date: d,
        dateFormatted: format(d, "EEE, d MMM"),
        relativeLabel: isToday ? "Today" : isTomorrow ? "Tomorrow" : format(d, "EEEE"),
        expectedTime: locality.timeWindow,
        hasDry,
        status: dayStatus,
      };
    });
  }, [locality, collectionInfo.status]);

  // Simulated collector route progress
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
      toast(`🚛 Collector arriving in 15 min`, {
        description: `${selectedAreaKey} pickup window (${locality.timeWindow}) — keep segregated bins ready.`,
      });
    }
    if (progress >= 1 && !alerted.current.arrived) {
      alerted.current.arrived = true;
      toast.success(`Collector arrived at your street in ${selectedAreaKey}`);
    }
  }, [eta, progress, t, settings.pickupAlerts, selectedAreaKey, locality.timeWindow]);

  const truck = pointAt(progress);
  const routePath = useMemo(() => ROUTE.map((p, i) => `${i ? "L" : "M"}${p[0]},${p[1]}`).join(" "), []);
  const home = HOME;
  const amount = Math.max(0, parseFloat(kg) || 0);

  function handleLocalityChange(newLocality: string) {
    eco.updateSettings({ area: newLocality });
    toast.info(`Updated locality to ${newLocality}`);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6">
      <PageHeader
        category="waste"
        title="Waste Management"
        tagline="Clean City"
        description="Daily door-to-door collection schedules, real-time morning window tracker, and segregation timetable across Bangalore localities."
      />

      {/* 1. CITY & LOCALITY SELECTION BAR */}
      <section className="mb-6 rounded-3xl border border-border bg-card p-5 shadow-soft">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-4">
            {/* City Selector: Bangalore only */}
            <div className="flex flex-col gap-1">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">City</span>
              <Select value={selectedCity} disabled>
                <SelectTrigger className="h-11 w-56 rounded-2xl bg-secondary/80 font-semibold text-foreground" aria-label="City">
                  <Building2 className="mr-2 size-4 text-primary" />
                  <SelectValue placeholder="Bangalore" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Bangalore">Bengaluru (Bangalore)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Bangalore Locality Selector */}
            <div className="flex flex-col gap-1">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Bangalore Locality / Ward
              </span>
              <Select value={selectedAreaKey} onValueChange={handleLocalityChange}>
                <SelectTrigger className="h-11 w-64 rounded-2xl border-primary/30 font-semibold text-foreground shadow-xs" aria-label="Locality">
                  <MapPin className="mr-2 size-4 text-waste" />
                  <SelectValue placeholder="Choose locality" />
                </SelectTrigger>
                <SelectContent className="max-h-80">
                  {Object.keys(BANGALORE_LOCALITIES).map((areaName) => (
                    <SelectItem key={areaName} value={areaName} className="py-2">
                      <span className="font-semibold">{areaName}</span>
                      <span className="ml-2 text-xs text-muted-foreground">({BANGALORE_LOCALITIES[areaName].zone})</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Transparent DEMO Schedule Badge & Ward Metadata */}
          <div className="flex flex-col items-start gap-1 sm:items-end">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-waste/40 bg-waste-soft px-3 py-1 text-xs font-bold text-waste">
              <Info className="size-3.5" /> DEMO Schedule · BBMP Model Beat
            </span>
            <span className="text-xs text-muted-foreground">
              {locality.zone} · {locality.ward}
            </span>
          </div>
        </div>
      </section>

      {/* 2. COLLECTION SCHEDULE & REAL-TIME STATUS CARD (5 CORE METRICS) */}
      <section className="mb-6 rounded-3xl border border-border bg-gradient-to-br from-card via-card to-secondary/30 p-6 shadow-soft">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-primary">Live Schedule Overview</span>
            <h2 className="text-2xl font-extrabold text-forest">{locality.name} Collection Roster</h2>
          </div>

          {/* Interactive Status Switcher (Requirement 2 & 4: Realistic test states) */}
          <div className="flex items-center gap-1.5 rounded-full border border-border bg-background p-1 text-xs">
            <span className="px-2 text-muted-foreground font-medium">Status Simulation:</span>
            <button
              type="button"
              onClick={() => setStatusOverride("auto")}
              className={`rounded-full px-2.5 py-1 font-semibold transition ${
                statusOverride === "auto" ? "bg-primary text-primary-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Auto (Live Clock)
            </button>
            <button
              type="button"
              onClick={() => setStatusOverride("Upcoming")}
              className={`rounded-full px-2.5 py-1 font-semibold transition ${
                statusOverride === "Upcoming" ? "bg-blue-600 text-white shadow-xs" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Upcoming
            </button>
            <button
              type="button"
              onClick={() => setStatusOverride("Collected")}
              className={`rounded-full px-2.5 py-1 font-semibold transition ${
                statusOverride === "Collected" ? "bg-emerald-600 text-white shadow-xs" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Collected
            </button>
            <button
              type="button"
              onClick={() => setStatusOverride("Delayed")}
              className={`rounded-full px-2.5 py-1 font-semibold transition ${
                statusOverride === "Delayed" ? "bg-amber-600 text-white shadow-xs" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Delayed
            </button>
          </div>
        </div>

        {/* 5 Specific Requirements Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {/* 1. Collection Date */}
          <div className="rounded-2xl border border-border/80 bg-background/80 p-4">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <CalendarCheck className="size-4 text-primary" /> Collection Date
            </p>
            <p className="mt-2 font-display text-base font-bold text-foreground">{collectionInfo.collectionDate}</p>
            <p className="mt-1 text-xs text-muted-foreground">Today's scheduled run</p>
          </div>

          {/* 2. Expected Collection Time */}
          <div className="rounded-2xl border border-border/80 bg-background/80 p-4">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <Clock className="size-4 text-waste" /> Expected Collection Time
            </p>
            <p className="mt-2 font-display text-lg font-extrabold text-forest">{locality.timeWindow}</p>
            <p className="mt-1 text-xs text-muted-foreground">Morning door-to-door beat</p>
          </div>

          {/* 3. Collection Frequency */}
          <div className="rounded-2xl border border-border/80 bg-background/80 p-4">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <CalendarDays className="size-4 text-reuse" /> Collection Frequency
            </p>
            <p className="mt-2 font-display text-base font-bold text-foreground">Daily</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Wet/Sanitary daily • Dry on {locality.dryWasteDayNames}
            </p>
          </div>

          {/* 4. Next Collection Time */}
          <div className="rounded-2xl border border-border/80 bg-background/80 p-4">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <Truck className="size-4 text-bills" /> Next Collection Time
            </p>
            <p className="mt-2 font-display text-base font-bold text-foreground">{collectionInfo.nextText}</p>
            <p className="mt-1 text-xs text-muted-foreground">Automatically updated</p>
          </div>

          {/* 5. Collection Status */}
          <div className="rounded-2xl border border-border/80 bg-background/80 p-4">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <Info className="size-4 text-primary" /> Collection Status
            </p>
            <div className="mt-2">
              {collectionInfo.status === "Upcoming" && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300">
                  <Clock className="size-3.5" /> Upcoming
                </span>
              )}
              {collectionInfo.status === "Collected" && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                  <CheckCircle2 className="size-3.5" /> Collected
                </span>
              )}
              {collectionInfo.status === "Delayed" && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                  <AlertTriangle className="size-3.5" /> Delayed (~25m)
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {collectionInfo.status === "Upcoming" && "Auto-tipper scheduled on beat"}
              {collectionInfo.status === "Collected" && "Completed for today"}
              {collectionInfo.status === "Delayed" && "Traffic / tipper delay noted"}
            </p>
          </div>
        </div>
      </section>

      {/* 3. MAIN INTERFACE GRID: LIVE MAP, UPCOMING DAILY SCHEDULE & LOGGING */}
      <div className="grid gap-5 lg:grid-cols-5">
        {/* Live Truck Simulation Map */}
        <Panel
          title="Collector Live Route (Bangalore Ward Simulation)"
          icon={<Truck className="size-5 text-waste" />}
          className="lg:col-span-3"
        >
          <div className="relative overflow-hidden rounded-2xl bg-secondary">
            <svg
              viewBox="0 0 400 260"
              className="h-auto w-full"
              role="img"
              aria-label="Map showing the garbage truck moving towards your home in Bangalore"
            >
              {[40, 100, 200, 240].map((y) => (
                <line key={y} x1="0" x2="400" y1={y} y2={y} className="stroke-border" strokeWidth="10" />
              ))}
              {[70, 200, 320].map((x) => (
                <line key={x} y1="0" y2="260" x1={x} x2={x} className="stroke-border" strokeWidth="10" />
              ))}
              <path
                d={routePath}
                fill="none"
                className="stroke-background"
                strokeWidth="14"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d={routePath}
                fill="none"
                className="stroke-waste"
                strokeWidth="4"
                strokeDasharray="8 8"
                strokeLinecap="round"
              />
              <circle cx={home[0]} cy={home[1]} r="16" className="fill-primary" opacity="0.2" />
              <circle cx={home[0]} cy={home[1]} r="8" className="fill-primary" />
              <g
                transform={`translate(${truck.x - 14}, ${truck.y - 14})`}
                style={{ transition: "transform 0.5s linear" }}
              >
                <rect width="28" height="28" rx="8" className="fill-waste" />
                <path
                  d="M7 18h14M8 18v-6h8v6M16 14h3l2 2v2"
                  className="stroke-primary-foreground"
                  strokeWidth="1.8"
                  fill="none"
                  strokeLinecap="round"
                />
              </g>
            </svg>
            <div className="absolute left-3 top-3 flex items-center gap-2 rounded-full bg-card px-3 py-1.5 text-sm font-semibold shadow-soft">
              <span className="relative flex size-2.5">
                <span className="absolute inline-flex size-full rounded-full bg-waste animate-ping-soft" />
                <span className="relative inline-flex size-2.5 rounded-full bg-waste" />
              </span>
              {progress >= 1 ? "Arrived" : `Arriving in ${eta} min`}
            </div>
            <div className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-card px-3 py-1.5 text-xs shadow-soft">
              <Home className="size-3.5 text-primary" /> {locality.name} Residence
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl bg-muted p-3">
            <div className="flex items-center gap-2">
              <Bell className="size-5 text-waste" />
              <div>
                <p className="text-sm font-semibold">Area-wise arrival alerts</p>
                <p className="text-xs text-muted-foreground">
                  “Collector arriving in 15 min” notification for {locality.name} ({locality.timeWindow})
                </p>
              </div>
            </div>
            <Switch
              checked={settings.pickupAlerts}
              onCheckedChange={(v) => eco.updateSettings({ pickupAlerts: v })}
              aria-label="Pickup alerts"
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            <strong>DEMO Schedule Notice:</strong> Timings are realistic models based on BBMP door-to-door morning collection windows.
            Arrival timings can vary slightly with local traffic and tipper capacity.
          </p>
        </Panel>

        {/* 3. DAILY UPDATES & UPCOMING 7-DAY SCHEDULE (Requirement 3) */}
        <Panel
          title="Upcoming Daily Schedules (7 Days)"
          icon={<CalendarDays className="size-5 text-waste" />}
          className="lg:col-span-2"
        >
          <p className="mb-3 text-xs text-muted-foreground">
            Daily door-to-door collection timetable for <strong>{locality.name}</strong>:
          </p>
          <div className="space-y-2.5 overflow-y-auto max-h-[360px] pr-1 [scrollbar-width:thin]">
            {upcomingDailySchedules.map((day) => (
              <div
                key={day.dateFormatted}
                className={`rounded-2xl border p-3 transition ${
                  day.relativeLabel === "Today" ? "border-primary/40 bg-secondary/60" : "border-border bg-card"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-foreground">{day.relativeLabel}</span>
                    <span className="text-xs text-muted-foreground">({day.dateFormatted})</span>
                  </div>

                  {/* Status Badge */}
                  {day.status === "Upcoming" && (
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                      Upcoming
                    </span>
                  )}
                  {day.status === "Collected" && (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                      Collected
                    </span>
                  )}
                  {day.status === "Delayed" && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                      Delayed
                    </span>
                  )}
                  {day.status === "Scheduled" && (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                      Scheduled
                    </span>
                  )}
                </div>

                <div className="mt-1.5 flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1 font-medium text-foreground">
                    <Clock className="size-3 text-waste" /> {day.expectedTime}
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="rounded-md bg-food-soft px-1.5 py-0.5 text-[10px] font-bold text-food">
                      Wet
                    </span>
                    {day.hasDry && (
                      <span className="rounded-md bg-waste-soft px-1.5 py-0.5 text-[10px] font-bold text-waste">
                        Dry Recyclables
                      </span>
                    )}
                    <span className="rounded-md bg-bills-soft px-1.5 py-0.5 text-[10px] font-bold text-bills">
                      Sanitary
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-xl bg-muted/60 p-2.5 text-[11px] text-muted-foreground">
            <strong>Segregation Mandate:</strong> In accordance with BBMP rules, hand over organic wet waste in green bins, clean dry recyclables in blue bins/bags, and sanitary waste in marked red pouches.
          </div>
        </Panel>

        {/* Existing: Log Waste Form with kg CO2e */}
        <Panel title="Log waste" className="lg:col-span-2">
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-semibold">Type</Label>
              <div className="mt-2 grid gap-2">
                {(Object.keys(WASTE_FACTORS) as WasteKind[]).map((k) => (
                  <button
                    key={k}
                    onClick={() => setKind(k)}
                    className={`flex justify-between rounded-xl border p-3 text-sm transition ${
                      kind === k ? "border-waste bg-waste-soft font-semibold" : "border-border hover:bg-muted"
                    }`}
                  >
                    <span>{WASTE_FACTORS[k].label}</span>
                    <span className="text-muted-foreground">{WASTE_FACTORS[k].factor} kg CO₂e/kg</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="wkg" className="text-sm font-semibold">
                Weight (kg)
              </Label>
              <Input
                id="wkg"
                type="number"
                min="0"
                step="0.1"
                value={kg}
                onChange={(e) => setKg(e.target.value)}
                className="mt-2 h-11 rounded-xl"
              />
            </div>
            <Button
              variant="hero"
              className="w-full"
              onClick={() => {
                if (!amount) {
                  toast.error("Enter a weight first.");
                  return;
                }
                eco.addEntry({
                  category: "waste",
                  title: `${WASTE_FACTORS[kind].label} · ${amount} kg`,
                  kg: wasteEmission(kind, amount),
                });
                toast.success("Waste logged");
              }}
            >
              <Plus /> Log {wasteEmission(kind, amount).toFixed(2)} kg CO₂e
            </Button>
          </div>
        </Panel>

        {/* Existing: Your Waste Log */}
        <Panel title="Your waste log" className="lg:col-span-3">
          <EntryList
            entries={entries.filter((e) => e.category === "waste")}
            empty="No waste logged yet."
            limit={6}
          />
        </Panel>
      </div>
    </div>
  );
}
