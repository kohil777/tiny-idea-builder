import { useSyncExternalStore } from "react";
import type { Category, ReuseCategory } from "./emissions";
import { REUSE_CATEGORIES } from "./emissions";

export interface Entry {
  id: string;
  category: Category;
  title: string;
  /** kg CO2e. For reuse entries this is emissions avoided. */
  kg: number;
  date: string;
  note?: string | undefined;
  /** Bills: kg is shared over this many days ending on `date`. */
  spreadDays?: number | undefined;
}

export interface Listing {
  id: string;
  title: string;
  category: ReuseCategory;
  description: string;
  area: string;
  owner: string;
  mine: boolean;
  status: "available" | "requested" | "collected";
  requestedByMe: boolean;
  postedAt: string;
}

export interface FeedPost {
  id: string;
  author: string;
  text: string;
  at: string;
  likes: number;
  liked: boolean;
}

export interface Settings {
  displayName: string;
  area: string;
  gpsEnabled: boolean;
  shareMeals: boolean;
  shareTrips: boolean;
  shareBills: boolean;
  pickupAlerts: boolean;
}

export interface EcoState {
  ready: boolean;
  entries: Entry[];
  listings: Listing[];
  feed: FeedPost[];
  settings: Settings;
}

const KEY = "ecotrack:v1";

const DEFAULT_SETTINGS: Settings = {
  displayName: "You",
  area: "Koramangala",
  gpsEnabled: false,
  shareMeals: true,
  shareTrips: true,
  shareBills: false,
  pickupAlerts: true,
};

const SERVER_STATE: EcoState = {
  ready: false,
  entries: [],
  listings: [],
  feed: [],
  settings: DEFAULT_SETTINGS,
};

let state: EcoState = SERVER_STATE;
const listeners = new Set<() => void>();

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

function daysAgo(n: number, hour = 12) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, (n * 17) % 60, 0, 0);
  return d.toISOString();
}

function hoursAgo(h: number) {
  return new Date(Date.now() - h * 3_600_000).toISOString();
}

function demoState(): EcoState {
  const entries: Entry[] = [];
  for (let i = 13; i >= 1; i--) {
    const v = ((i * 37) % 10) / 10;
    entries.push(
      { id: uid(), category: "food", title: i % 3 ? "Veg thali" : "Chicken biryani", kg: i % 3 ? 0.9 + v : 2.4 + v, date: daysAgo(i, 13) },
      { id: uid(), category: "travel", title: i % 2 ? "Metro to office" : "Car to office", kg: i % 2 ? 0.6 + v : 3.2 + v, date: daysAgo(i, 9) },
      { id: uid(), category: "waste", title: "Household waste", kg: 0.7 + v / 2, date: daysAgo(i, 20) },
    );
    if (i === 13) entries.push({ id: uid(), category: "bills", title: "Electricity · 90 kWh", kg: 63.9, date: daysAgo(i, 18), spreadDays: 30, note: "monthly bill" });
  }
  entries.push(
    { id: uid(), category: "travel", title: "Metro · 9 km", kg: 0.32, date: hoursAgo(2) },
    { id: uid(), category: "food", title: "Idli sambar breakfast", kg: 0.45, date: hoursAgo(1.5) },
    { id: uid(), category: "reuse", title: "Gave away winter jacket", kg: 4, date: daysAgo(3, 17) },
    { id: uid(), category: "reuse", title: "Cardboard boxes rehomed", kg: 0.8, date: daysAgo(6, 17) },
  );
  return {
    ready: true,
    entries,
    listings: [
      { id: uid(), title: "Bag of kids' clothes (age 4–6)", category: "clothes", description: "Gently used, washed and folded.", area: "Koramangala", owner: "Ananya", mine: false, status: "available", requestedByMe: false, postedAt: daysAgo(1) },
      { id: uid(), title: "Moving boxes ×12", category: "cardboard", description: "Sturdy, flat-packed. Pick up from gate.", area: "HSR Layout", owner: "Rahul", mine: false, status: "available", requestedByMe: false, postedAt: daysAgo(2) },
      { id: uid(), title: "Old laptop (works, slow)", category: "electronics", description: "8GB RAM, charger included. Good for a student.", area: "Indiranagar", owner: "Meera", mine: false, status: "requested", requestedByMe: false, postedAt: daysAgo(3) },
      { id: uid(), title: "Steel utensils set", category: "metal", description: "Spare kadai, plates and tumblers.", area: "Koramangala", owner: "Farhan", mine: false, status: "available", requestedByMe: false, postedAt: daysAgo(4) },
      { id: uid(), title: "Bookshelf, teak", category: "furniture", description: "5 shelves, minor scratches.", area: "BTM Layout", owner: "Divya", mine: false, status: "available", requestedByMe: false, postedAt: daysAgo(5) },
    ],
    feed: [
      { id: uid(), author: "Riya", text: "Reduced my emissions by 30% this week by switching to the metro 🌱", at: hoursAgo(0.5), likes: 24, liked: false },
      { id: uid(), author: "Arjun", text: "Started composting wet waste — 2 kg less to landfill every week.", at: hoursAgo(12), likes: 17, liked: false },
      { id: uid(), author: "Sana", text: "Gave away 3 bags of clothes through Reuse. Someone's kids are warmer now!", at: hoursAgo(40), likes: 41, liked: false },
      { id: uid(), author: "Kabir", text: "Carpooled with 3 colleagues all week. Car rides only make sense when shared.", at: hoursAgo(70), likes: 12, liked: false },
    ],
    settings: DEFAULT_SETTINGS,
  };
}

function load(): EcoState {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Omit<EcoState, "ready">;
      return { ...parsed, settings: { ...DEFAULT_SETTINGS, ...parsed.settings }, ready: true };
    }
  } catch {
    /* corrupted storage: fall through to demo data */
  }
  const s = demoState();
  persist(s);
  return s;
}

function persist(s: EcoState) {
  try {
    const { ready: _ready, ...rest } = s;
    window.localStorage.setItem(KEY, JSON.stringify(rest));
  } catch {
    /* storage full or blocked */
  }
}

function ensureLoaded() {
  if (!state.ready && typeof window !== "undefined") state = load();
}

function set(updater: (s: EcoState) => EcoState) {
  ensureLoaded();
  state = updater(state);
  persist(state);
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

function getSnapshot() {
  ensureLoaded();
  return state;
}

export function useEco(): EcoState {
  return useSyncExternalStore(subscribe, getSnapshot, () => SERVER_STATE);
}

export const eco = {
  addEntry(e: Omit<Entry, "id" | "date"> & { date?: string }) {
    set((s) => ({ ...s, entries: [...s.entries, { ...e, id: uid(), date: e.date ?? new Date().toISOString() }] }));
  },
  removeEntry(id: string) {
    set((s) => ({ ...s, entries: s.entries.filter((e) => e.id !== id) }));
  },
  addListing(l: Pick<Listing, "title" | "category" | "description">) {
    set((s) => ({
      ...s,
      listings: [
        { ...l, id: uid(), area: s.settings.area, owner: s.settings.displayName, mine: true, status: "available", requestedByMe: false, postedAt: new Date().toISOString() },
        ...s.listings,
      ],
    }));
  },
  requestListing(id: string) {
    set((s) => ({
      ...s,
      listings: s.listings.map((l) => (l.id === id ? { ...l, status: "requested", requestedByMe: true } : l)),
    }));
  },
  /** Marks a listing collected; giving your own item away credits avoided emissions. */
  markCollected(id: string) {
    set((s) => {
      const l = s.listings.find((x) => x.id === id);
      if (!l) return s;
      const entries =
        l.mine || l.requestedByMe
          ? [...s.entries, { id: uid(), category: "reuse" as const, title: `${l.mine ? "Gave away" : "Reused"}: ${l.title}`, kg: REUSE_CATEGORIES[l.category].avoided, date: new Date().toISOString() }]
          : s.entries;
      return { ...s, entries, listings: s.listings.map((x) => (x.id === id ? { ...x, status: "collected" } : x)) };
    });
  },
  removeListing(id: string) {
    set((s) => ({ ...s, listings: s.listings.filter((l) => l.id !== id) }));
  },
  post(text: string) {
    set((s) => ({
      ...s,
      feed: [{ id: uid(), author: s.settings.displayName, text, at: new Date().toISOString(), likes: 0, liked: false }, ...s.feed],
    }));
  },
  toggleLike(id: string) {
    set((s) => ({
      ...s,
      feed: s.feed.map((p) => (p.id === id ? { ...p, liked: !p.liked, likes: p.likes + (p.liked ? -1 : 1) } : p)),
    }));
  },
  updateSettings(patch: Partial<Settings>) {
    set((s) => ({ ...s, settings: { ...s.settings, ...patch } }));
  },
  clearMyData() {
    set((s) => ({ ...s, entries: [], listings: s.listings.filter((l) => !l.mine), feed: s.feed.filter((p) => p.author !== s.settings.displayName) }));
  },
  resetDemo() {
    set(() => demoState());
  },
};
