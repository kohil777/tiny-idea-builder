import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect, useMemo } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  Bot,
  Sparkles,
  Send,
  Loader2,
  MapPin,
  Flame,
  Scale,
  RefreshCw,
  Trash2,
  Lightbulb,
  ShieldAlert,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { askEcoAgent, type AgentChatMessage } from "@/lib/ai.functions";
import { useEco } from "@/lib/eco-store";
import { dailyTotals, dayKey, greenStreak, round2 } from "@/lib/emissions";
import { PageHeader, Panel } from "@/components/eco/PageHeader";
import { MarkdownContent } from "@/components/eco/MarkdownContent";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/agent")({
  head: () => ({
    meta: [
      { title: "EcoAgent AI Copilot — EcoTrack" },
      {
        name: "description",
        content:
          "Your AI sustainability & Bangalore urban climate copilot. Calculate emissions in kg CO₂e, master BBMP waste rules, and find daily climate actions.",
      },
      { property: "og:title", content: "EcoAgent AI Copilot — EcoTrack" },
      { property: "og:description", content: "AI sustainability and Bangalore BBMP waste copilot." },
    ],
  }),
  component: AgentPage,
});

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  time: string;
}

const INITIAL_MESSAGES: Message[] = [
  {
    id: "welcome-full-1",
    role: "assistant",
    content: `### 👋 Welcome to EcoAgent!
I am your personal AI sustainability and Bangalore climate copilot powered by GPT-6.

Here are a few things we can do together:
- **Analyze Carbon Footprints:** Calculate life-cycle emissions in **kg CO₂e** for meals, travel, appliances, and purchases.
- **Bangalore BBMP Waste Segregation:** Learn exactly how to sort wet, dry, sanitary, and electronic waste under BBMP guidelines.
- **Commute Decarbonization:** Compare Namma Metro, BMTC electric buses, EVs, and cabs.
- **Personal Action Plan:** Get personalized advice based on your today's logged footprint and streak.

Type a question below or pick one of the recommended topics!`,
    time: "Just now",
  },
];

const SUGGESTIONS = [
  {
    category: "Waste & BBMP",
    icon: "🚛",
    items: [
      "BBMP 2-bin 1-bag segregation rules in Bangalore",
      "Where can I drop off e-waste in Bangalore?",
      "How does wet waste composting reduce methane emissions?",
    ],
  },
  {
    category: "Diet & Food",
    icon: "🥗",
    items: [
      "Compare carbon footprint: Dal tadka vs Chicken curry",
      "Which plant milks have the lowest carbon footprint?",
      "How to save 2 kg CO₂e on lunch today",
    ],
  },
  {
    category: "Travel & Mobility",
    icon: "🚆",
    items: [
      "Compare Namma Metro vs Cab emissions for 15 km",
      "What is the carbon footprint of an electric scooter per km?",
      "Is BMTC bus greener than a petrol bike?",
    ],
  },
  {
    category: "Home & Energy",
    icon: "⚡",
    items: [
      "BESCOM power emission factor in Karnataka",
      "How much carbon does rooftop solar save annually in Bangalore?",
      "AC temperature settings to save 1 kg CO₂e every day",
    ],
  },
];

function AgentPage() {
  const { entries, settings } = useEco();
  const askServerFn = useServerFn(askEcoAgent);

  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Compute live context
  const context = useMemo(() => {
    const now = new Date();
    const totals = dailyTotals(entries);
    const todayKg = round2(totals.get(dayKey(now)) ?? 0);
    const streak = greenStreak(entries, now);
    const locality = settings?.area || "Bangalore";
    const recent = entries.slice(0, 4).map((e) => `${e.title} (${e.kg} kg CO₂e)`);
    return { todayKg, streak, locality, recentActions: recent };
  }, [entries, settings]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage(textToSend?: string) {
    const text = (textToSend ?? input).trim();
    if (!text || loading) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: "user",
      content: text,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    setInput("");
    setLoading(true);

    try {
      const historyPayload: AgentChatMessage[] = nextHistory
        .filter((m) => m.id !== "welcome-full-1")
        .slice(-6)
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await askServerFn({
        data: {
          prompt: text,
          history: historyPayload,
          context: {
            todayKg: context.todayKg,
            streak: context.streak,
            locality: context.locality,
            recentActions: context.recentActions,
          },
        },
      });

      if (res.ok) {
        setMessages((prev) => [
          ...prev,
          {
            id: `a-${Date.now()}`,
            role: "assistant",
            content: res.data,
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ]);
      } else {
        toast.error(res.error || "Could not reach EcoAgent. Please try again.");
      }
    } catch (err) {
      console.error("EcoAgent full page error", err);
      toast.error("Failed to connect with EcoAgent.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6">
      <PageHeader
        category="agent"
        title="EcoAgent AI Copilot"
        tagline="Intelligent Climate Action"
        description="Interact with your dedicated sustainability AI agent for real-time carbon calculations, Bangalore municipal waste guidance, and low-emission lifestyle coaching."
      />

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Column: Context Card & Suggestions */}
        <div className="space-y-6 lg:col-span-4">
          {/* Live Context Card */}
          <Panel title="Active Profile Context">
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-2xl bg-muted/70 p-3">
                <span className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="size-4 text-leaf" /> Selected Locality
                </span>
                <span className="font-semibold text-foreground">{context.locality}</span>
              </div>

              <div className="flex items-center justify-between rounded-2xl bg-food-soft p-3">
                <span className="flex items-center gap-2 text-sm text-food">
                  <Scale className="size-4" /> Today's Footprint
                </span>
                <span className="font-display font-bold text-food">
                  {context.todayKg} kg CO₂e
                </span>
              </div>

              <div className="flex items-center justify-between rounded-2xl bg-amber-50 p-3 dark:bg-amber-950/30">
                <span className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-400">
                  <Flame className="size-4" /> Green Streak
                </span>
                <span className="font-bold text-amber-700 dark:text-amber-400">
                  {context.streak} Day{context.streak === 1 ? "" : "s"}
                </span>
              </div>

              <div className="rounded-2xl border border-border p-3 text-xs text-muted-foreground">
                <p className="font-semibold text-foreground mb-1">Standardized Emission Units</p>
                All calculations and answers strictly follow the scientific standard of{" "}
                <strong>kg CO₂e</strong> (kilograms of carbon dioxide equivalent).
              </div>
            </div>
          </Panel>

          {/* Quick Topics */}
          <Panel title="Explore Topics">
            <div className="space-y-4">
              {SUGGESTIONS.map((cat, i) => (
                <div key={i} className="space-y-1.5">
                  <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    <span>{cat.icon}</span> {cat.category}
                  </p>
                  <div className="space-y-1">
                    {cat.items.map((item, j) => (
                      <button
                        key={j}
                        type="button"
                        onClick={() => sendMessage(item)}
                        disabled={loading}
                        className="group flex w-full items-center justify-between rounded-xl border border-border bg-background p-2.5 text-left text-xs font-medium text-foreground transition hover:border-primary hover:bg-food-soft hover:text-primary disabled:opacity-50"
                      >
                        <span className="truncate pr-2">{item}</span>
                        <ArrowRight className="size-3.5 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        {/* Right Column: Chat Workspace */}
        <div className="lg:col-span-8">
          <div className="flex h-[750px] max-h-[85vh] flex-col rounded-3xl border border-border bg-card shadow-sm">
            {/* Header bar */}
            <div className="flex items-center justify-between border-b border-border bg-muted/40 px-5 py-3.5">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-2xl bg-forest text-leaf shadow-sm">
                  <Bot className="size-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-display text-base font-bold text-forest">EcoAgent Workspace</h2>
                    <span className="rounded-full bg-leaf/20 px-2 py-0.5 text-[11px] font-bold text-leaf">
                      Live Copilot
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Connected to OpenAI GPT-6 Astra & Bangalore SWM Knowledge Base
                  </p>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setMessages(INITIAL_MESSAGES);
                  toast.info("Conversation cleared");
                }}
                className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
              >
                <RefreshCw className="size-3.5" /> Reset
              </Button>
            </div>

            {/* Chat message stream */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-3xl px-4 py-3 ${
                      m.role === "user"
                        ? "bg-primary text-primary-foreground rounded-tr-md shadow-sm"
                        : "bg-muted text-card-foreground rounded-tl-md border border-border"
                    }`}
                  >
                    {m.role === "assistant" ? (
                      <MarkdownContent content={m.content} />
                    ) : (
                      <p className="whitespace-pre-wrap text-sm leading-relaxed">{m.content}</p>
                    )}
                  </div>
                  <span className="mt-1 px-1 text-[11px] text-muted-foreground">{m.time}</span>
                </div>
              ))}

              {loading && (
                <div className="flex items-center gap-3 rounded-2xl bg-muted/60 p-3.5 text-xs text-muted-foreground border border-border w-fit animate-pulse">
                  <Loader2 className="size-4 animate-spin text-primary" />
                  <span>EcoAgent is calculating emissions and retrieving guidelines…</span>
                </div>
              )}
            </div>

            {/* Chat Input form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage();
              }}
              className="flex items-center gap-3 border-t border-border bg-card p-4 rounded-b-3xl"
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={loading}
                placeholder="Ask EcoAgent anything (e.g., 'Compare metro vs cab for 15 km in Bangalore')..."
                className="flex-1 rounded-2xl border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
              />
              <Button
                type="submit"
                disabled={!input.trim() || loading}
                className="rounded-2xl px-5 bg-forest hover:bg-forest/90 text-white font-medium"
              >
                {loading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                <span className="hidden sm:inline ml-1.5">Ask</span>
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
