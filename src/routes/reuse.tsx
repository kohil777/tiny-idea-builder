import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { MapPin, Plus, HandHeart, CheckCircle2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { eco, useEco, type Listing } from "@/lib/eco-store";
import { REUSE_CATEGORIES, type ReuseCategory } from "@/lib/emissions";
import { PageHeader, Panel, EmptyNote } from "@/components/eco/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/reuse")({
  head: () => ({
    meta: [
      { title: "Reuse & Recycle (Give It a New Life) — EcoTrack" },
      { name: "description", content: "List clothes, cardboard, metal and more to give away. Neighbours request and collect — reuse, recycle, rehome." },
      { property: "og:title", content: "Reuse & Recycle — EcoTrack" },
      { property: "og:description", content: "Give items a second life and count the emissions you avoid." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ReusePage,
});

const STATUS: Record<Listing["status"], string> = {
  available: "bg-food-soft text-food",
  requested: "bg-waste-soft text-waste",
  collected: "bg-muted text-muted-foreground",
};

function ReusePage() {
  const { listings } = useEco();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<ReuseCategory>("clothes");
  const [description, setDescription] = useState("");
  const [tab, setTab] = useState<"all" | "mine">("all");

  const shown = listings.filter((l) => (tab === "mine" ? l.mine || l.requestedByMe : true));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { toast.error("Give your item a name."); return; }
    eco.addListing({ title: title.trim().slice(0, 80), category, description: description.trim().slice(0, 300) });
    setTitle("");
    setDescription("");
    toast.success("Listed! Neighbours can now request it.");
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6">
      <PageHeader category="reuse" title="Reuse & Recycle" tagline="Give It a New Life" description="List items to give away or recycle. Others can request and collect them — less waste, longer product life. Reuse • Recycle • Rehome." />
      <div className="grid gap-5 lg:grid-cols-3">
        <Panel title="List an item" icon={<Plus className="size-5 text-reuse" />} className="self-start">
          <form onSubmit={submit} className="space-y-4">
            <div>
              <Label htmlFor="t" className="text-sm font-semibold">What are you giving away?</Label>
              <Input id="t" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. 2 cotton shirts, size M" maxLength={80} className="mt-2 h-11 rounded-xl" />
            </div>
            <div>
              <Label className="text-sm font-semibold">Category</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as ReuseCategory)}>
                <SelectTrigger className="mt-2 h-11 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(REUSE_CATEGORIES) as ReuseCategory[]).map((c) => (
                    <SelectItem key={c} value={c}>{REUSE_CATEGORIES[c].label} · saves ~{REUSE_CATEGORIES[c].avoided} kg CO₂e</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="d" className="text-sm font-semibold">Details</Label>
              <Textarea id="d" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Condition, pickup instructions…" maxLength={300} className="mt-2 rounded-xl" />
            </div>
            <Button type="submit" variant="hero" className="w-full"><Plus /> Post listing</Button>
          </form>
        </Panel>

        <div className="lg:col-span-2">
          <Tabs value={tab} onValueChange={(v) => setTab(v as "all" | "mine")} className="mb-4">
            <TabsList className="rounded-full">
              <TabsTrigger value="all" className="rounded-full">Near you</TabsTrigger>
              <TabsTrigger value="mine" className="rounded-full">My items & requests</TabsTrigger>
            </TabsList>
          </Tabs>
          {shown.length === 0 ? (
            <EmptyNote>Nothing here yet. List something you no longer need!</EmptyNote>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {shown.map((l) => (
                <article key={l.id} className="flex flex-col rounded-3xl border border-border bg-card p-5 shadow-soft">
                  <div className="flex items-start justify-between gap-2">
                    <span className="rounded-full bg-reuse-soft px-2.5 py-0.5 text-xs font-semibold text-reuse">{REUSE_CATEGORIES[l.category].label}</span>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${STATUS[l.status]}`}>{l.status}</span>
                  </div>
                  <h3 className="mt-3 font-bold text-forest">{l.title}</h3>
                  {l.description && <p className="mt-1 text-sm text-muted-foreground">{l.description}</p>}
                  <p className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="size-3" /> {l.area} · {l.mine ? "You" : l.owner} · {formatDistanceToNow(new Date(l.postedAt), { addSuffix: true })}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-success">Saves ~{REUSE_CATEGORIES[l.category].avoided} kg CO₂e</p>
                  <div className="mt-4 flex gap-2">
                    {!l.mine && l.status === "available" && (
                      <Button variant="soft" size="sm" onClick={() => { eco.requestListing(l.id); toast.success(`Requested — ${l.owner} will be in touch.`); }}>
                        <HandHeart /> Request
                      </Button>
                    )}
                    {(l.mine || l.requestedByMe) && l.status !== "collected" && (
                      <Button variant="hero" size="sm" onClick={() => { eco.markCollected(l.id); toast.success(`+${REUSE_CATEGORIES[l.category].avoided} kg CO₂e avoided`); }}>
                        <CheckCircle2 /> Mark collected
                      </Button>
                    )}
                    {l.mine && (
                      <Button variant="ghost" size="sm" onClick={() => eco.removeListing(l.id)} aria-label="Remove listing"><Trash2 /></Button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
