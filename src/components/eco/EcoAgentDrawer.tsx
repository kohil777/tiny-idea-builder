import { useState, useRef, useEffect, useMemo } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  Sparkles,
  Bot,
  Send,
  X,
  Minimize2,
  Trash2,
  Loader2,
  MapPin,
  Flame,
  Scale,
  RefreshCw,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import { askEcoAgent, type AgentChatMessage } from "@/lib/ai.functions";
import { useEco } from "@/lib/eco-store";
import { dailyTotals, dayKey, greenStreak, round2 } from "@/lib/emissions";
import { MarkdownContent } from "./MarkdownContent";
import { Button } from "@/components/ui/button";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  time: string;
}

const INITIAL_MESSAGE: Message = {
  id: "welcome-1",
  role: "assistant",
  content: `### 👋 Hi! I'm EcoAgent
Your personal climate copilot for Bangalore. I can help you:
- Track & reduce your personal carbon footprint in **kg CO₂e**
- Master **BBMP waste segregation** (2-bin 1-bag rules)
- Compare commute emissions (Namma Metro, BMTC, EV, cabs)
- Find greener meal alternatives and energy-saving tips

Tap one of the quick prompts below or ask me anything!`,
  time: "Just now",
};

const PROMPT_CHIPS = [
  { label: "🌱 Cut 2 kg CO₂e today", prompt: "How can I cut 2 kg CO2e from my daily carbon footprint today?" },
  { label: "🚛 BBMP waste rules", prompt: "What are the BBMP 2-bin 1-bag garbage segregation rules in Bangalore?" },
  { label: "🥗 Low-carbon meal swap", prompt: "What are good low-carbon Indian meal swaps to reduce my food emissions?" },
  { label: "🚆 Metro vs car emissions", prompt: "Compare the carbon footprint in kg CO2e of taking Namma Metro vs a petrol car for a 15 km Bangalore trip." },
  { label: "⚡ BESCOM electricity factor", prompt: "What is the carbon emission factor of BESCOM electricity in Bangalore and how to save?" },
];

export function EcoAgentDrawer() {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const askServerFn = useServerFn(askEcoAgent);

  const { entries, settings } = useEco();

  // User context
  const context = useMemo(() => {
    const now = new Date();
    const totals = dailyTotals(entries);
    const todayKg = round2(totals.get(dayKey(now)) ?? 0);
    const streak = greenStreak(entries, now);
    const locality = settings?.area || "Bangalore";
    const recent = entries.slice(0, 3).map((e) => `${e.title} (${e.kg} kg CO₂e)`);
    return { todayKg, streak, locality, recentActions: recent };
  }, [entries, settings]);

  // Auto scroll to bottom
  useEffect(() => {
    if (open && !minimized) {
      setTimeout(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
      }, 100);
    }
  }, [messages, open, minimized]);

  // Focus input when opened
  useEffect(() => {
    if (open && !minimized) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [open, minimized]);

  async function handleSend(textToSend?: string) {
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
        .filter((m) => m.id !== "welcome-1")
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
      console.error("EcoAgent error", err);
      toast.error("Failed to get response from EcoAgent.");
    } finally {
      setLoading(false);
    }
  }

  function handleClearChat() {
    setMessages([INITIAL_MESSAGE]);
    toast.info("Conversation reset");
  }

  return (
    <>
      {/* Floating launcher trigger */}
      {!open && (
        <button
          onClick={() => {
            setOpen(true);
            setMinimized(false);
          }}
          type="button"
          aria-label="Open EcoAgent AI copilot"
          className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-40 flex items-center gap-2.5 rounded-full bg-forest px-4 py-3 text-white shadow-xl transition-all hover:bg-forest/90 hover:scale-105 active:scale-95 sm:px-5"
        >
          <span className="relative flex size-3 items-center justify-center">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-leaf opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-leaf" />
          </span>
          <Bot className="size-5 text-leaf" />
          <span className="text-sm font-bold tracking-tight">EcoAgent</span>
          <span className="rounded-full bg-leaf/20 px-1.5 py-0.5 text-[10px] font-semibold text-leaf">AI</span>
        </button>
      )}

      {/* Minimized bottom-right pill */}
      {open && minimized && (
        <button
          onClick={() => setMinimized(false)}
          type="button"
          aria-label="Restore EcoAgent chat"
          className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-40 flex items-center gap-2 rounded-full border border-forest/20 bg-card px-4 py-2.5 text-forest shadow-xl hover:bg-muted"
        >
          <Bot className="size-4 text-leaf" />
          <span className="text-xs font-semibold">EcoAgent (Chat Paused)</span>
          <ChevronDown className="size-4 rotate-180" />
        </button>
      )}

      {/* Slide-in floating dialog */}
      {open && !minimized && (
        <div
          role="dialog"
          aria-label="EcoAgent AI Copilot"
          className="fixed bottom-20 right-3 md:bottom-6 md:right-6 z-40 flex h-[580px] max-h-[85vh] w-[94vw] sm:w-[440px] flex-col rounded-3xl border border-border bg-card shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-4 duration-200"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border bg-forest px-4 py-3 text-white rounded-t-3xl">
            <div className="flex items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-xl bg-leaf text-forest font-bold">
                <Bot className="size-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-display text-sm font-bold leading-none">EcoAgent</h3>
                  <span className="rounded bg-leaf/20 px-1.5 py-0.5 text-[10px] font-bold text-leaf leading-none">
                    GPT-6 Astra
                  </span>
                </div>
                <p className="text-[11px] text-white/75 mt-0.5">Bangalore Climate & BBMP Copilot</p>
              </div>
            </div>

            <div className="flex items-center gap-1 text-white/80">
              <button
                type="button"
                onClick={handleClearChat}
                title="Clear conversation"
                className="rounded-lg p-1.5 hover:bg-white/10 hover:text-white"
              >
                <RefreshCw className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => setMinimized(true)}
                title="Minimize"
                className="rounded-lg p-1.5 hover:bg-white/10 hover:text-white"
              >
                <Minimize2 className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                title="Close"
                className="rounded-lg p-1.5 hover:bg-white/10 hover:text-white"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>

          {/* User Live Context Banner */}
          <div className="flex items-center justify-between bg-muted/60 px-3 py-1.5 text-[11px] text-muted-foreground border-b border-border">
            <span className="flex items-center gap-1 truncate">
              <MapPin className="size-3 text-leaf shrink-0" />
              {context.locality}
            </span>
            <span className="flex items-center gap-1 font-medium text-foreground">
              <Scale className="size-3 text-primary shrink-0" />
              {context.todayKg} kg CO₂e
            </span>
            <span className="flex items-center gap-1 text-amber-600 font-semibold">
              <Flame className="size-3 shrink-0" />
              {context.streak}d streak
            </span>
          </div>

          {/* Messages list */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3.5 text-sm">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 ${
                    m.role === "user"
                      ? "bg-primary text-primary-foreground rounded-tr-sm"
                      : "bg-muted text-card-foreground rounded-tl-sm border border-border"
                  }`}
                >
                  {m.role === "assistant" ? (
                    <MarkdownContent content={m.content} />
                  ) : (
                    <p className="whitespace-pre-wrap text-xs sm:text-sm">{m.content}</p>
                  )}
                </div>
                <span className="mt-1 px-1 text-[10px] text-muted-foreground">{m.time}</span>
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 rounded-2xl bg-muted/70 px-3.5 py-2.5 text-xs text-muted-foreground border border-border w-fit animate-pulse">
                <Loader2 className="size-3.5 animate-spin text-primary" />
                <span>EcoAgent is analyzing sustainability data…</span>
              </div>
            )}
          </div>

          {/* Suggestion Chips */}
          <div className="border-t border-border bg-card/60 px-3 py-2">
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Quick prompts
            </p>
            <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {PROMPT_CHIPS.map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  disabled={loading}
                  onClick={() => handleSend(chip.prompt)}
                  className="shrink-0 rounded-full border border-border bg-background px-2.5 py-1 text-[11px] font-medium text-foreground transition hover:border-primary hover:bg-food-soft hover:text-primary disabled:opacity-50"
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          {/* Footer Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2 border-t border-border bg-card p-3 rounded-b-3xl"
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              placeholder="Ask about emissions, food, BBMP rules…"
              className="flex-1 rounded-xl border border-input bg-background px-3 py-2 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
            />
            <Button
              type="submit"
              size="sm"
              disabled={!input.trim() || loading}
              className="rounded-xl px-3 bg-forest hover:bg-forest/90 text-white shrink-0"
            >
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            </Button>
          </form>
        </div>
      )}
    </>
  );
}
