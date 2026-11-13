// Emission factors (kg CO2e). Sources: DEFRA 2024 conversion factors, US EPA,
// India GHG Platform / CEA grid factor. Values are rounded averages for estimates.

export type Category = "food" | "travel" | "waste" | "reuse" | "bills";

export const CATEGORY_META: Record<Category, { label: string; tagline: string }> = {
  food: { label: "Food", tagline: "Eat Green" },
  travel: { label: "Travel", tagline: "Move Smart" },
  waste: { label: "Waste", tagline: "Clean City" },
  reuse: { label: "Reuse", tagline: "Give It a New Life" },
  bills: { label: "Bills", tagline: "Know Your Impact" },
};

/** A day counts towards the green streak when its footprint stays at or below this. */
export const DAILY_TARGET_KG = 10;

// ---------- Travel ----------
export type TravelMode = "walk" | "cycle" | "metro" | "bus" | "auto" | "motorbike" | "car" | "flight";

export const TRAVEL_MODES: Record<
  TravelMode,
  { label: string; factor: number; perVehicle: boolean; maxSeats: number }
> = {
  walk: { label: "Walk", factor: 0, perVehicle: false, maxSeats: 1 },
  cycle: { label: "Cycle", factor: 0, perVehicle: false, maxSeats: 1 },
  metro: { label: "Metro / Train", factor: 0.035, perVehicle: false, maxSeats: 1 },
  bus: { label: "Bus", factor: 0.089, perVehicle: false, maxSeats: 1 },
  auto: { label: "Auto-rickshaw", factor: 0.09, perVehicle: true, maxSeats: 3 },
  motorbike: { label: "Bike / Scooter", factor: 0.103, perVehicle: true, maxSeats: 2 },
  car: { label: "Car", factor: 0.192, perVehicle: true, maxSeats: 5 },
  flight: { label: "Flight", factor: 0.25, perVehicle: false, maxSeats: 1 },
};

/** Per-person kg CO2e for a trip. Vehicle emissions are split between the passengers sharing it. */
export function travelEmission(mode: TravelMode, km: number, passengers = 1): number {
  const m = TRAVEL_MODES[mode];
  if (km <= 0) return 0;
  const people = m.perVehicle ? Math.min(Math.max(1, Math.floor(passengers)), m.maxSeats) : 1;
  return round2((m.factor * km) / people);
}

export interface TravelSuggestion {
  mode: TravelMode;
  kg: number;
  saving: number;
  reason: string;
}

/** Lower-carbon alternatives for a trip, best first. A car is fine for 3+ people. */
export function suggestTravel(mode: TravelMode, km: number, passengers = 1): TravelSuggestion[] {
  const current = travelEmission(mode, km, passengers);
  const options: TravelSuggestion[] = [];
  const add = (m: TravelMode, reason: string, p = 1) => {
    const kg = travelEmission(m, km, p);
    if (kg < current) options.push({ mode: m, kg, saving: round2(current - kg), reason });
  };
  if (km <= 2) add("walk", "Short hop — walking is zero-carbon");
  if (km <= 8) add("cycle", "Easy cycling distance");
  add("metro", "Lowest-carbon motorised option");
  add("bus", "Shared public transport");
  if (mode === "car" && passengers < 3) add("car", "Carpool with 3 people to split emissions", 3);
  return options.sort((a, b) => a.kg - b.kg);
}

/** Guess the vehicle type from average speed (km/h) of a GPS-tracked trip. */
export function guessModeFromSpeed(kmh: number): TravelMode {
  if (kmh < 6) return "walk";
  if (kmh < 18) return "cycle";
  if (kmh < 200) return "car";
  return "flight";
}

/** Great-circle distance in km between two coordinates. */
export function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// ---------- Food (per typical serving) ----------
export const FOOD_PRESETS = [
  { id: "beef", label: "Beef / Mutton", kg: 6.5 },
  { id: "chicken", label: "Chicken", kg: 1.6 },
  { id: "fish", label: "Fish / Seafood", kg: 1.3 },
  { id: "paneer", label: "Paneer / Cheese", kg: 1.2 },
  { id: "eggs", label: "Eggs", kg: 0.5 },
  { id: "rice", label: "Rice meal", kg: 0.6 },
  { id: "veg", label: "Dal / Veg thali", kg: 0.4 },
  { id: "vegan", label: "Plant-based bowl", kg: 0.3 },
] as const;

// ---------- Waste (per kg disposed) ----------
export const WASTE_FACTORS = {
  landfill: { label: "Mixed (landfill)", factor: 0.58 },
  recycled: { label: "Recycled dry waste", factor: 0.02 },
  composted: { label: "Composted wet waste", factor: 0.1 },
} as const;
export type WasteKind = keyof typeof WASTE_FACTORS;

export function wasteEmission(kind: WasteKind, kg: number): number {
  return round2(Math.max(0, kg) * WASTE_FACTORS[kind].factor);
}

// ---------- Reuse (kg CO2e avoided per item given a second life) ----------
export const REUSE_CATEGORIES = {
  clothes: { label: "Clothes", avoided: 4 },
  cardboard: { label: "Cardboard", avoided: 0.8 },
  metal: { label: "Metal", avoided: 3 },
  electronics: { label: "Electronics", avoided: 25 },
  furniture: { label: "Furniture", avoided: 30 },
  books: { label: "Books", avoided: 1.2 },
  other: { label: "Other", avoided: 2 },
} as const;
export type ReuseCategory = keyof typeof REUSE_CATEGORIES;

// ---------- Bills (manual calculator) ----------
export const BILL_FACTORS = {
  electricity: { label: "Electricity", unit: "kWh", factor: 0.71, source: "CEA India grid" },
  lpg: { label: "Cooking gas (LPG)", unit: "kg", factor: 2.98, source: "India GHG Platform" },
  petrol: { label: "Petrol", unit: "litres", factor: 2.31, source: "DEFRA" },
  diesel: { label: "Diesel", unit: "litres", factor: 2.68, source: "DEFRA" },
  water: { label: "Water", unit: "m³", factor: 0.34, source: "DEFRA" },
} as const;
export type BillKind = keyof typeof BILL_FACTORS;

export function billEmission(kind: BillKind, quantity: number): number {
  return round2(Math.max(0, quantity) * BILL_FACTORS[kind].factor);
}

// ---------- Aggregates ----------
export interface DatedAmount {
  date: string; // ISO timestamp
  kg: number;
  category: Category;
  /** Bills cover a period: their kg is shared evenly over this many days ending on `date`. */
  spreadDays?: number | undefined;
}

/** Per-day shares of an entry (a monthly bill becomes 1/30th on each of 30 days). */
export function dailyShares(e: DatedAmount): [string, number][] {
  const n = Math.max(1, Math.round(e.spreadDays ?? 1));
  const d = new Date(e.date);
  const out: [string, number][] = [];
  for (let i = 0; i < n; i++) {
    out.push([dayKey(d), e.kg / n]);
    d.setDate(d.getDate() - 1);
  }
  return out;
}

/** Per-category kg for one day, with bills spread over their period. */
export function categoryTotalsForDay(entries: DatedAmount[], day: Date): Record<Category, number> {
  const key = dayKey(day);
  const out: Record<Category, number> = { food: 0, travel: 0, waste: 0, reuse: 0, bills: 0 };
  for (const e of entries) for (const [k, v] of dailyShares(e)) if (k === key) out[e.category] += v;
  for (const c of Object.keys(out) as Category[]) out[c] = round2(out[c]);
  return out;
}

export function dayKey(d: Date | string): string {
  const x = typeof d === "string" ? new Date(d) : d;
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
}

/** Daily footprint totals. Reuse entries are avoided emissions and never add to the footprint. */
export function dailyTotals(entries: DatedAmount[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const e of entries) {
    if (e.category === "reuse") continue;
    for (const [k, v] of dailyShares(e)) m.set(k, round2((m.get(k) ?? 0) + v));
  }
  return m;
}

/**
 * Consecutive green days (logged something and stayed within target), counting back
 * from today. If today has nothing logged yet, counting starts from yesterday.
 */
export function greenStreak(entries: DatedAmount[], now = new Date(), target = DAILY_TARGET_KG): number {
  const logged = new Set(entries.map((e) => dayKey(e.date)));
  const totals = dailyTotals(entries);
  const cursor = new Date(now);
  if (!logged.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  for (;;) {
    const k = dayKey(cursor);
    if (!logged.has(k) || (totals.get(k) ?? 0) > target) break;
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

/** Percent change of today's footprint versus the average of the previous 7 days. */
export function changeVsLastWeek(entries: DatedAmount[], now = new Date()): number | null {
  const totals = dailyTotals(entries);
  const today = totals.get(dayKey(now)) ?? 0;
  let sum = 0;
  const d = new Date(now);
  for (let i = 0; i < 7; i++) {
    d.setDate(d.getDate() - 1);
    sum += totals.get(dayKey(d)) ?? 0;
  }
  const avg = sum / 7;
  if (avg === 0) return null;
  return Math.round(((today - avg) / avg) * 100);
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
