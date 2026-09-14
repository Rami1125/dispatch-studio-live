import { AlertTriangle, Flame, ShieldAlert, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface LowStockBadgeProps {
  currentStock: number;
  safetyStockLevel: number;
  unit?: string;
  size?: "xs" | "sm" | "md" | "lg";
  showDetails?: boolean;
  label?: string;
  urgency?: "critical" | "warning" | "normal";
  className?: string;
  id?: string;
}

export function LowStockBadge({
  currentStock,
  safetyStockLevel,
  unit = "יח'",
  size = "sm",
  showDetails = true,
  label = "מלאי נמוך",
  urgency,
  className,
  id,
}: LowStockBadgeProps) {
  // Determine urgency automatically if not specified
  const effectiveUrgency =
    urgency || (currentStock <= Math.floor(safetyStockLevel * 0.5) ? "critical" : "warning");

  const isCritical = effectiveUrgency === "critical";

  return (
    <div
      id={id}
      role="status"
      aria-label={`התראת מלאי נמוך: נותרו ${currentStock} ${unit}, מתחת לסף ביטחון ${safetyStockLevel} ${unit}`}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-black select-none border transition-all",
        // Pulsating glowing animation
        "animate-pulse",
        // Urgency color styling
        isCritical
          ? "bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-sm shadow-rose-900/40 ring-1 ring-rose-500/30"
          : "bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm shadow-amber-900/40 ring-1 ring-amber-500/30",
        // Sizes
        size === "xs" && "px-2 py-0.5 text-[10px]",
        size === "sm" && "px-2.5 py-1 text-xs",
        size === "md" && "px-3.5 py-1.5 text-xs sm:text-sm",
        size === "lg" && "px-4 py-2 text-sm sm:text-base",
        className,
      )}
      title={`מלאי רצפה ירד מתחת לסף הביטחון המוגדר (${safetyStockLevel} ${unit})`}
    >
      {/* Radiating beacon ping indicator */}
      <span className="relative flex h-2 w-2 shrink-0">
        <span
          className={cn(
            "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
            isCritical ? "bg-rose-400" : "bg-amber-400",
          )}
        />
        <span
          className={cn(
            "relative inline-flex rounded-full h-2 w-2",
            isCritical ? "bg-rose-500" : "bg-amber-500",
          )}
        />
      </span>

      {/* Icon */}
      {isCritical ? (
        <Flame className={cn("shrink-0", size === "xs" ? "size-3" : "size-3.5")} />
      ) : (
        <AlertTriangle className={cn("shrink-0", size === "xs" ? "size-3" : "size-3.5")} />
      )}

      {/* Badge label */}
      <span className="font-black tracking-tight">{label}</span>

      {/* Numerical stock detail vs predefined safety stock level */}
      {showDetails && (
        <span
          className={cn(
            "rounded-md font-mono font-bold tabular-nums px-1.5 py-0.5",
            isCritical ? "bg-rose-950/80 text-rose-200" : "bg-amber-950/80 text-amber-200",
            size === "xs" ? "text-[9px]" : "text-[11px]",
          )}
        >
          {currentStock}/{safetyStockLevel} {unit}
        </span>
      )}
    </div>
  );
}
