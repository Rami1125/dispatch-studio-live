import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/types/dispatch";

const STATUS_CLASS: Record<OrderStatus, string> = {
  ממתין: "bg-slate-200/80 text-slate-700 ring-slate-300 dark:bg-slate-800 dark:text-slate-300",
  בהכנה: "bg-amber-500/15 text-amber-700 dark:text-amber-300 ring-amber-500/40 font-bold",
  "מוכן להעמסה":
    "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 ring-indigo-500/40 font-bold",
  בהעמסה: "bg-accent/15 text-accent-foreground ring-accent/40",
  "יצא לדרך": "bg-primary/10 text-primary ring-primary/30",
  סופק: "bg-emerald-500/15 text-emerald-700 ring-emerald-500/30",
};

export function StatusBadge({
  status,
  className,
  size = "md",
}: {
  status: OrderStatus;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full font-semibold ring-1 ring-inset",
        size === "sm" && "px-2.5 py-0.5 text-xs",
        size === "md" && "px-3 py-1 text-sm",
        size === "lg" && "px-5 py-2 text-2xl",
        STATUS_CLASS[status],
        className,
      )}
    >
      <span className="inline-block size-2 rounded-full bg-current opacity-70" />
      {status}
    </span>
  );
}
