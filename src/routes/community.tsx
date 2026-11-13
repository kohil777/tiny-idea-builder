import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Heart, Send, Users, Trophy } from "lucide-react";
import { toast } from "sonner";
import { eco, useEco } from "@/lib/eco-store";
import { greenStreak, round2 } from "@/lib/emissions";
import { PageHeader, Panel } from "@/components/eco/PageHeader";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/community")({
  head: () => ({
    meta: [
      { title: "Community Feed — EcoTrack" },
      { name: "description", content: "Share your green wins, cheer on neighbours and act together for a cleaner city." },
      { property: "og:title", content: "Community Feed — EcoTrack" },
      { property: "og:description", content: "Share green wins and act together." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CommunityPage,
});

function CommunityPage() {
  const { feed, entries } = useEco();
  const [text, setText] = useState("");
  const streak = useMemo(() => greenStreak(entries), [entries]);
  const avoided = useMemo(() => round2(entries.filter((e) => e.category === "reuse").reduce((s, e) => s + e.kg, 0)), [entries]);

  function share(t: string) {
    const v = t.trim();
    if (!v) return;
    eco.post(v.slice(0, 280));
    setText("");
    toast.success("Shared with the community");
  }

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6">
      <PageHeader title="Community Feed" description="Act together — share wins, swap tips and inspire your neighbours." />
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Panel>
            <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Share a green win…" maxLength={280} className="min-h-24 rounded-2xl" />
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{text.length}/280</span>
              <Button variant="hero" onClick={() => share(text)} disabled={!text.trim()}><Send /> Share</Button>
            </div>
          </Panel>
          <ul className="space-y-3">
            {feed.map((p) => (
              <li key={p.id} className="flex gap-3 rounded-3xl border border-border bg-card p-5 shadow-soft">
                <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary font-display font-bold text-secondary-foreground">{p.author[0]}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{p.author}</p>
                  <p className="mt-1">{p.text}</p>
                  <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{formatDistanceToNow(new Date(p.at), { addSuffix: true })}</span>
                    <button onClick={() => eco.toggleLike(p.id)} className={`flex items-center gap-1 ${p.liked ? "text-destructive" : "hover:text-foreground"}`} aria-label="Like">
                      <Heart className={`size-4 ${p.liked ? "fill-current" : ""}`} /> {p.likes}
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="space-y-5">
          <Panel title="Share a milestone" icon={<Trophy className="size-5 text-waste" />}>
            <div className="space-y-2">
              <Button variant="soft" className="w-full justify-start" onClick={() => share(`I'm on a ${streak}-day green streak on EcoTrack 🌱`)}>
                🔥 {streak}-day green streak
              </Button>
              <Button variant="soft" className="w-full justify-start" onClick={() => share(`I've avoided ${avoided} kg CO₂e by giving items a second life ♻️`)}>
                ♻️ {avoided} kg CO₂e avoided via reuse
              </Button>
            </div>
          </Panel>
          <div className="rounded-3xl bg-forest p-6 text-forest-foreground shadow-lift">
            <Users className="size-7" />
            <p className="mt-3 font-display text-xl font-bold">Small actions, multiplied.</p>
            <p className="mt-1 text-sm opacity-80">When neighbours share and swap, cities get cleaner and emissions drop.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
