import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { MapPin, Users, Navigation, Square, Play, Lightbulb, Plus, Minus } from "lucide-react";
import { toast } from "sonner";
import { eco, useEco } from "@/lib/eco-store";
import {
  TRAVEL_MODES, guessModeFromSpeed, haversineKm, suggestTravel, travelEmission, type TravelMode,
} from "@/lib/emissions";
import { PageHeader, Panel } from "@/components/eco/PageHeader";
import { EntryList } from "@/components/eco/EntryList";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/travel")({
  head: () => ({
    meta: [
      { title: "Travel Tracking (Move Smart) — EcoTrack" },
      { name: "description", content: "Log trips by vehicle and passengers, optionally track with GPS, and get lower-carbon suggestions." },
      { property: "og:title", content: "Travel Tracking (Move Smart) — EcoTrack" },
      { property: "og:description", content: "Trip emissions with bus, carpool, walk and cycle suggestions." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TravelPage,
});

const MODES = Object.keys(TRAVEL_MODES) as TravelMode[];

function TravelPage() {
  const { entries, settings } = useEco();
  const [mode, setMode] = useState<TravelMode>("car");
  const [km, setKm] = useState("8");
  const [passengers, setPassengers] = useState(1);

  // GPS trip
  const [tracking, setTracking] = useState(false);
  const [gpsKm, setGpsKm] = useState(0);
  const watchId = useRef<number | null>(null);
  const last = useRef<{ lat: number; lng: number } | null>(null);
  const startedAt = useRef<number>(0);

  useEffect(() => () => { if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current); }, []);
  useEffect(() => { if (!settings.gpsEnabled && tracking) stopTrip(false); }, [settings.gpsEnabled]); // eslint-disable-line react-hooks/exhaustive-deps

  function startTrip() {
    if (!("geolocation" in navigator)) { toast.error("GPS isn't available on this device."); return; }
    setGpsKm(0);
    last.current = null;
    startedAt.current = Date.now();
    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        const p = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        if (last.current && pos.coords.accuracy < 60) {
          const d = haversineKm(last.current, p);
          if (d > 0.005) setGpsKm((k) => k + d);
        }
        last.current = p;
      },
      () => { toast.error("Location permission was denied."); stopTrip(false); },
      { enableHighAccuracy: true, maximumAge: 2000 },
    );
    setTracking(true);
    toast.success("Trip started — keep this page open.");
  }

  function stopTrip(apply = true) {
    if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
    watchId.current = null;
    setTracking(false);
    if (apply && gpsKm > 0) {
      const hours = (Date.now() - startedAt.current) / 3_600_000;
      const guessed = guessModeFromSpeed(hours > 0 ? gpsKm / hours : 0);
      setKm(gpsKm.toFixed(2));
      setMode(guessed);
      toast.info(`Detected ${gpsKm.toFixed(2)} km — looks like ${TRAVEL_MODES[guessed].label.toLowerCase()}. Confirm below.`);
    }
  }

  const distance = Math.max(0, parseFloat(km) || 0);
  const kg = travelEmission(mode, distance, passengers);
  const suggestions = suggestTravel(mode, distance, passengers);
  const m = TRAVEL_MODES[mode];

  function log() {
    if (!distance) { toast.error("Enter a distance first."); return; }
    eco.addEntry({ category: "travel", title: `${m.label} · ${distance} km`, kg, note: m.perVehicle && passengers > 1 ? `${passengers} people` : undefined });
    toast.success("Trip logged");
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6">
      <PageHeader category="travel" title="Travel Tracking" tagline="Move Smart" description="Log how you got around. Shared vehicles split emissions between passengers — a car makes sense for 3 or more people." />
      <div className="grid gap-5 lg:grid-cols-5">
        <Panel title="Log a trip" className="lg:col-span-3">
          <Label className="text-sm font-semibold">Vehicle</Label>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {MODES.map((x) => (
              <button
                key={x}
                onClick={() => setMode(x)}
                className={`rounded-2xl border p-3 text-left text-sm transition ${mode === x ? "border-travel bg-travel-soft font-semibold text-travel" : "border-border bg-background hover:bg-muted"}`}
              >
                {TRAVEL_MODES[x].label}
              </button>
            ))}
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="km" className="text-sm font-semibold">Distance (km)</Label>
              <Input id="km" type="number" min="0" step="0.1" value={km} onChange={(e) => setKm(e.target.value)} className="mt-2 h-11 rounded-xl" />
            </div>
            <div>
              <Label className="flex items-center gap-1.5 text-sm font-semibold"><Users className="size-4" /> Passengers</Label>
              <div className="mt-2 flex h-11 items-center justify-between rounded-xl border border-input px-2">
                <Button size="icon" variant="ghost" onClick={() => setPassengers((p) => Math.max(1, p - 1))} aria-label="Fewer passengers"><Minus /></Button>
                <span className="font-display text-lg font-bold">{passengers}</span>
                <Button size="icon" variant="ghost" onClick={() => setPassengers((p) => Math.min(8, p + 1))} aria-label="More passengers"><Plus /></Button>
              </div>
              {!m.perVehicle && passengers > 1 && <p className="mt-1 text-xs text-muted-foreground">Public transport is already per person.</p>}
            </div>
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-travel-soft p-4">
            <div>
              <p className="text-xs text-muted-foreground">Your share of this trip</p>
              <p className="font-display text-3xl font-extrabold text-travel">{kg.toFixed(2)} kg CO₂e</p>
            </div>
            <Button variant="hero" size="lg" onClick={log}><Plus /> Log trip</Button>
          </div>
        </Panel>

        <div className="flex flex-col gap-5 lg:col-span-2">
          <Panel title="Lower-carbon options" icon={<Lightbulb className="size-5 text-waste" />}>
            {suggestions.length ? (
              <ul className="space-y-2">
                {suggestions.slice(0, 4).map((s) => (
                  <li key={s.mode + s.reason} className="flex items-center justify-between gap-3 rounded-2xl bg-muted p-3">
                    <div>
                      <p className="text-sm font-semibold">{s.reason.startsWith("Carpool") ? "Carpool (3 people)" : TRAVEL_MODES[s.mode].label}</p>
                      <p className="text-xs text-muted-foreground">{s.reason}</p>
                    </div>
                    <span className="whitespace-nowrap text-sm font-bold text-success">−{s.saving.toFixed(2)} kg</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">🌿 Great choice — this is already one of the lowest-carbon ways to travel.</p>
            )}
          </Panel>

          <Panel>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <MapPin className="size-5 text-primary" />
                <div>
                  <p className="font-semibold">GPS tracking: Optional</p>
                  <p className="text-xs text-muted-foreground">You can use the app without sharing your location.</p>
                </div>
              </div>
              <Switch checked={settings.gpsEnabled} onCheckedChange={(v) => eco.updateSettings({ gpsEnabled: v })} aria-label="GPS tracking" />
            </div>
            {settings.gpsEnabled && (
              <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl bg-secondary p-3">
                <div className="flex items-center gap-2">
                  {tracking && <span className="relative flex size-3"><span className="absolute inline-flex size-full rounded-full bg-success animate-ping-soft" /><span className="relative inline-flex size-3 rounded-full bg-success" /></span>}
                  <span className="font-display text-xl font-bold tabular-nums">{gpsKm.toFixed(2)} km</span>
                </div>
                {tracking ? (
                  <Button variant="forest" size="sm" onClick={() => stopTrip()}><Square /> End trip</Button>
                ) : (
                  <Button variant="hero" size="sm" onClick={startTrip}><Play /> Start trip</Button>
                )}
              </div>
            )}
            {settings.gpsEnabled && <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground"><Navigation className="size-3" /> Vehicle type is guessed from your average speed.</p>}
          </Panel>
        </div>

        <Panel title="Your trips" className="lg:col-span-5">
          <EntryList entries={entries.filter((e) => e.category === "travel")} empty="No trips logged yet." />
        </Panel>
      </div>
    </div>
  );
}
