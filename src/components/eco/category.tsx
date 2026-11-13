import { Utensils, Car, Trash2, Recycle, FileText, type LucideIcon } from "lucide-react";
import type { Category } from "@/lib/emissions";
import { cn } from "@/lib/utils";

export const CATEGORY_STYLE: Record<Category, { icon: LucideIcon; soft: string; text: string; solid: string; bar: string }> = {
  food: { icon: Utensils, soft: "bg-food-soft", text: "text-food", solid: "bg-food text-primary-foreground", bar: "bg-food" },
  travel: { icon: Car, soft: "bg-travel-soft", text: "text-travel", solid: "bg-travel text-primary-foreground", bar: "bg-travel" },
  waste: { icon: Trash2, soft: "bg-waste-soft", text: "text-waste", solid: "bg-waste text-primary-foreground", bar: "bg-waste" },
  reuse: { icon: Recycle, soft: "bg-reuse-soft", text: "text-reuse", solid: "bg-reuse text-primary-foreground", bar: "bg-reuse" },
  bills: { icon: FileText, soft: "bg-bills-soft", text: "text-bills", solid: "bg-bills text-primary-foreground", bar: "bg-bills" },
};

export function CategoryIcon({ category, className, size = "md" }: { category: Category; className?: string; size?: "sm" | "md" | "lg" }) {
  const s = CATEGORY_STYLE[category];
  const Icon = s.icon;
  const box = size === "sm" ? "size-8 rounded-lg" : size === "lg" ? "size-14 rounded-2xl" : "size-10 rounded-xl";
  const ic = size === "sm" ? "size-4" : size === "lg" ? "size-7" : "size-5";
  return (
    <span className={cn("inline-flex shrink-0 items-center justify-center", box, s.soft, s.text, className)}>
      <Icon className={ic} />
    </span>
  );
}
