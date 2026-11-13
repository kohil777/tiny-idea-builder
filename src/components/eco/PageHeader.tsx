import type { ReactNode } from "react";
import type { Category } from "@/lib/emissions";
import { CategoryIcon } from "./category";

export function PageHeader({ category, title, tagline, description, action }: { category?: Category; title: string; tagline?: string; description: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col gap-4 pb-8 pt-10 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex items-start gap-4">
        {category && <CategoryIcon category={category} size="lg" />}
        <div>
          <h1 className="text-3xl font-extrabold text-forest sm:text-4xl">
            {title} {tagline && <span className="font-semibold text-primary">({tagline})</span>}
          </h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">{description}</p>
        </div>
      </div>
      {action}
    </div>
  );
}

export function Panel({ title, icon, children, className = "" }: { title?: string; icon?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-3xl border border-border bg-card p-5 shadow-soft sm:p-6 ${className}`}>
      {title && (
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-forest">
          {icon}
          {title}
        </h2>
      )}
      {children}
    </section>
  );
}

export function EmptyNote({ children }: { children: ReactNode }) {
  return <p className="rounded-2xl border border-dashed border-border bg-muted/50 p-6 text-center text-sm text-muted-foreground">{children}</p>;
}
