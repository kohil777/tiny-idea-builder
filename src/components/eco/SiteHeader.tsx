import { Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Leaf,
  LayoutDashboard,
  UtensilsCrossed,
  Car,
  Trash2,
  MoreHorizontal,
  Recycle,
  ReceiptText,
  Users,
  Bot,
  Sparkles,
  ShieldCheck,
  X,
} from "lucide-react";

const NAV = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/food", label: "Food" },
  { to: "/travel", label: "Travel" },
  { to: "/waste", label: "Waste" },
  { to: "/reuse", label: "Reuse" },
  { to: "/bills", label: "Bills" },
  { to: "/agent", label: "AI Agent" },
  { to: "/community", label: "Community" },
  { to: "/privacy", label: "Privacy" },
] as const;

const BOTTOM_NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/food", label: "Food", icon: UtensilsCrossed },
  { to: "/travel", label: "Travel", icon: Car },
  { to: "/waste", label: "Waste", icon: Trash2 },
] as const;

const MORE_NAV = [
  { to: "/agent", label: "EcoAgent Copilot", desc: "AI guidance on carbon & BBMP waste", icon: Bot },
  { to: "/reuse", label: "Circular Reuse", desc: "Borrow, donate, and thrift items", icon: Recycle },
  { to: "/bills", label: "Utility Bills", desc: "Track electricity, gas, and water", icon: ReceiptText },
  { to: "/community", label: "Community Feed", desc: "Local updates and green ideas", icon: Users },
  { to: "/privacy", label: "Privacy & Factors", desc: "Emission factors & local storage", icon: ShieldCheck },
] as const;

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2">
      <span className="inline-flex size-9 items-center justify-center rounded-xl bg-leaf text-primary-foreground shadow-soft">
        <Leaf className="size-5" />
      </span>
      <span className="font-display text-xl font-extrabold tracking-tight text-forest">
        Eco<span className="text-primary">Track</span>
      </span>
    </Link>
  );
}

export function SiteHeader() {
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-3 sm:px-6">
          <Logo />

          {/* Desktop & Tablet Navigation */}
          <nav className="hidden items-center gap-1 md:flex overflow-x-auto [scrollbar-width:none]">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className="whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-secondary-foreground"
                activeProps={{ className: "bg-secondary text-secondary-foreground font-semibold" }}
              >
                {n.label}
              </Link>
            ))}
          </nav>

          {/* Mobile Quick More Trigger in Header */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              type="button"
              onClick={() => setMoreOpen(true)}
              className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/60 px-2.5 py-1 text-xs font-semibold text-muted-foreground transition hover:bg-secondary hover:text-foreground"
              aria-label="Open full menu"
            >
              <MoreHorizontal className="size-3.5" /> Menu
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar (Phones & Small Screens) */}
      <nav
        aria-label="Mobile Navigation"
        className="fixed bottom-0 inset-x-0 z-50 flex items-center justify-around border-t border-border/80 bg-background/95 px-1 py-1.5 backdrop-blur-lg shadow-lift md:hidden"
      >
        {BOTTOM_NAV.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className="flex flex-1 flex-col items-center justify-center py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
              activeProps={{ className: "text-primary font-bold" }}
            >
              <Icon className="size-5" />
              <span className="mt-0.5">{item.label}</span>
            </Link>
          );
        })}

        <button
          type="button"
          onClick={() => setMoreOpen(true)}
          className={`flex flex-1 flex-col items-center justify-center py-1 text-[11px] font-medium transition-colors ${moreOpen ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground"
            }`}
          aria-label="More sections"
        >
          <MoreHorizontal className="size-5" />
          <span className="mt-0.5">More</span>
        </button>
      </nav>

      {/* Slide-Up Sheet for "More" Navigation on Mobile */}
      {moreOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end md:hidden" role="dialog" aria-modal="true">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => setMoreOpen(false)}
            aria-hidden="true"
          />
          <div className="relative z-10 rounded-t-3xl border-t border-border bg-card p-5 pb-8 shadow-2xl animate-in slide-in-from-bottom duration-200">
            <div className="mb-4 flex items-center justify-between">
              <span className="font-display text-base font-bold text-foreground">More EcoTrack Modules</span>
              <button
                type="button"
                onClick={() => setMoreOpen(false)}
                className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Close menu"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {MORE_NAV.map((m) => {
                const Icon = m.icon;
                return (
                  <Link
                    key={m.to}
                    to={m.to}
                    onClick={() => setMoreOpen(false)}
                    className="flex items-center gap-3.5 rounded-2xl border border-border/60 bg-muted/30 p-3 transition hover:bg-secondary active:scale-[0.99]"
                    activeProps={{ className: "border-primary/40 bg-secondary" }}
                  >
                    <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="size-5" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">{m.label}</p>
                      <p className="text-xs text-muted-foreground truncate">{m.desc}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-border/70">
      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-3 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:px-6">
        <Logo />
        <p>Integrated carbon intelligence for everyday life. Estimates use EPA, DEFRA and India GHG Platform factors.</p>
      </div>
    </footer>
  );
}
