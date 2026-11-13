import { X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { eco, type Entry } from "@/lib/eco-store";
import { CategoryIcon } from "./category";
import { EmptyNote } from "./PageHeader";

export function EntryList({ entries, empty, limit = 8 }: { entries: Entry[]; empty: string; limit?: number }) {
  const list = [...entries].sort((a, b) => b.date.localeCompare(a.date)).slice(0, limit);
  if (!list.length) return <EmptyNote>{empty}</EmptyNote>;
  return (
    <ul className="divide-y divide-border">
      {list.map((e) => (
        <li key={e.id} className="group flex items-center gap-3 py-3">
          <CategoryIcon category={e.category} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{e.title}</p>
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(e.date), { addSuffix: true })}
              {e.note ? ` · ${e.note}` : ""}
              {e.spreadDays && e.spreadDays > 1 ? ` · ${(e.kg / e.spreadDays).toFixed(2)} kg CO₂e/day over ${e.spreadDays} days` : ""}
            </p>
          </div>
          <span className={`font-display font-bold tabular-nums ${e.category === "reuse" ? "text-success" : "text-forest"}`}>
            {e.category === "reuse" ? "−" : ""}
            {e.kg.toFixed(2)} kg CO₂e
          </span>
          <button
            onClick={() => eco.removeEntry(e.id)}
            className="rounded-full p-1 text-muted-foreground opacity-0 transition hover:bg-muted group-hover:opacity-100"
            aria-label={`Remove ${e.title}`}
          >
            <X className="size-4" />
          </button>
        </li>
      ))}
    </ul>
  );
}
