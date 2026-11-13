import { Link } from "@tanstack/react-router";
import { Leaf } from "lucide-react";

const NAV = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/food", label: "Food" },
  { to: "/travel", label: "Travel" },
  { to: "/waste", label: "Waste" },
  { to: "/reuse", label: "Reuse" },
  { to: "/bills", label: "Bills" },
  { to: "/community", label: "Community" },
  { to: "/privacy", label: "Privacy" },
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
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center gap-6 px-4 py-3 sm:px-6">
        <Logo />
        <nav className="-mx-1 flex flex-1 items-center gap-1 overflow-x-auto px-1 [scrollbar-width:none]">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-secondary-foreground"
              activeProps={{ className: "bg-secondary text-secondary-foreground" }}
            >
              {n.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
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
