import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Sparkles, Sprout, Flame, Plus } from "lucide-react";
import { toast } from "sonner";
import { analyzeMeal, type MealAnalysis } from "@/lib/ai.functions";
import { fileToDataUrl } from "@/lib/image";
import { eco, useEco } from "@/lib/eco-store";
import { FOOD_PRESETS, round2 } from "@/lib/emissions";
import { PageHeader, Panel } from "@/components/eco/PageHeader";
import { ImagePicker } from "@/components/eco/ImagePicker";
import { EntryList } from "@/components/eco/EntryList";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/food")({
  head: () => ({
    meta: [
      { title: "Food Tracking (Eat Green) — EcoTrack" },
      { name: "description", content: "Snap your meal: AI identifies the food, estimates calories and calculates its carbon footprint." },
      { property: "og:title", content: "Food Tracking (Eat Green) — EcoTrack" },
      { property: "og:description", content: "Photo-based meal carbon and calorie estimates." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: FoodPage,
});

function FoodPage() {
  const { entries } = useEco();
  const analyze = useServerFn(analyzeMeal);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MealAnalysis | null>(null);

  async function onFile(file: File) {
    setResult(null);
    setLoading(true);
    try {
      const url = await fileToDataUrl(file);
      setPreview(url);
      const res = await analyze({ data: { imageDataUrl: url } });
      if (!res.ok) toast.error(res.error);
      else if (!res.data.isFood) toast.warning("That doesn't look like food. Try another photo.");
      else setResult(res.data);
    } catch {
      toast.error("Couldn't read that image. Try a JPG or PNG.");
    } finally {
      setLoading(false);
    }
  }

  function save() {
    if (!result) return;
    eco.addEntry({ category: "food", title: result.mealName, kg: round2(result.totalKgCO2e), note: `${Math.round(result.totalCalories)} kcal` });
    toast.success(`Logged ${result.mealName}`);
    setResult(null);
    setPreview(null);
  }

  const foodEntries = entries.filter((e) => e.category === "food");

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6">
      <PageHeader category="food" title="Food Tracking" tagline="Eat Green" description="Snap your meal. AI identifies each item, estimates calories and calculates its carbon footprint — meat usually costs far more than plant-based." />
      <div className="grid gap-5 lg:grid-cols-5">
        <Panel title="Snap your meal" className="lg:col-span-3">
          <div className="grid gap-5 md:grid-cols-2">
            <ImagePicker preview={preview} onFile={onFile} disabled={loading} label="Take or upload a meal photo" />
            <div className="flex flex-col">
              {loading && (
                <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-2xl bg-food-soft p-6 text-center text-food">
                  <Loader2 className="size-8 animate-spin" />
                  <p className="font-semibold">Identifying food items…</p>
                </div>
              )}
              {!loading && !result && (
                <div className="flex flex-1 flex-col justify-center gap-3 text-sm text-muted-foreground">
                  <p className="flex gap-2"><Sparkles className="size-4 shrink-0 text-food" /> AI identifies food items & estimates calories</p>
                  <p className="flex gap-2"><Sprout className="size-4 shrink-0 text-food" /> Calculates the meal's carbon footprint</p>
                  <p className="flex gap-2"><Flame className="size-4 shrink-0 text-food" /> Tips to make your next plate greener</p>
                </div>
              )}
              {result && !loading && (
                <div className="flex flex-1 flex-col animate-rise">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-lg font-bold text-forest">{result.mealName}</h3>
                    {result.plantBased && <span className="rounded-full bg-food-soft px-2 py-0.5 text-xs font-semibold text-food">Plant-based</span>}
                  </div>
                  <ul className="mt-3 divide-y divide-border text-sm">
                    {result.items.map((it, i) => (
                      <li key={i} className="flex justify-between gap-2 py-2">
                        <span><strong>{it.name}</strong> <span className="text-muted-foreground">· {it.portion}</span></span>
                        <span className="whitespace-nowrap tabular-nums text-muted-foreground">{Math.round(it.calories)} kcal · {it.kgCO2e.toFixed(2)} kg</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <div className="rounded-2xl bg-food-soft p-3"><p className="text-xs text-muted-foreground">Carbon</p><p className="font-display text-2xl font-bold text-food">{result.totalKgCO2e.toFixed(2)} kg</p></div>
                    <div className="rounded-2xl bg-muted p-3"><p className="text-xs text-muted-foreground">Calories</p><p className="font-display text-2xl font-bold">{Math.round(result.totalCalories)}</p></div>
                  </div>
                  <p className="mt-3 rounded-2xl bg-secondary p-3 text-sm text-secondary-foreground">💡 {result.tip}</p>
                  <Button variant="hero" className="mt-4" onClick={save}><Plus /> Add to today</Button>
                </div>
              )}
            </div>
          </div>
        </Panel>
        <Panel title="Quick add" className="lg:col-span-2">
          <p className="mb-3 text-sm text-muted-foreground">No photo? Log a typical serving.</p>
          <div className="grid grid-cols-2 gap-2">
            {FOOD_PRESETS.map((p) => (
              <button
                key={p.id}
                onClick={() => { eco.addEntry({ category: "food", title: p.label, kg: p.kg }); toast.success(`Logged ${p.label}`); }}
                className="rounded-2xl border border-border bg-background p-3 text-left transition hover:border-food hover:bg-food-soft"
              >
                <p className="text-sm font-semibold">{p.label}</p>
                <p className="text-xs text-muted-foreground">{p.kg} kg CO₂e</p>
              </button>
            ))}
          </div>
        </Panel>
        <Panel title="Your meals" className="lg:col-span-5">
          <EntryList entries={foodEntries} empty="No meals logged yet." />
        </Panel>
      </div>
    </div>
  );
}
