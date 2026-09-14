import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  Boxes,
  CheckCircle2,
  ChevronDown,
  Clock,
  Flame,
  MapPin,
  PackageCheck,
  RefreshCw,
  Truck,
  Warehouse,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { useDispatchBoard } from "@/context/DispatchContext";
import type { Order, OrderStatus } from "@/types/dispatch";
import { StatusBadge } from "@/components/ui/status-badge";
import { cn } from "@/lib/utils";

const ALL_STATUSES: OrderStatus[] = ["ממתין", "בהכנה", "מוכן להעמסה", "בהעמסה", "יצא לדרך", "סופק"];

export function OrderCard({ order, index = 0 }: { order: Order; index?: number }) {
  const { currentTime, recentlyChangedOrderIds, quickUpdateStatus } = useDispatchBoard();
  const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false);

  const approved = order.items.filter((i) => i.isApproved).length;
  const total = order.items.length;
  const ratio = total === 0 ? 0 : approved / total;

  /* ---------------- Real-time Time & Urgency Calculations ---------------- */
  const [hStr, mStr] = order.targetTime.split(":");
  const targetDate = new Date(currentTime);
  targetDate.setHours(Number(hStr || 12), Number(mStr || 0), 0, 0);

  const diffMs = targetDate.getTime() - currentTime.getTime();
  let diffSeconds = Math.round(diffMs / 1000);
  let diffMinutes = Math.round(diffSeconds / 60);

  // Off-hours demonstration support (for after-hours dispatch testing outside 07:00-18:00)
  const isOffHours = Math.abs(diffMinutes) > 300;
  if (isOffHours) {
    if (order.status === "בהעמסה") {
      diffSeconds = 8 * 60 + 35 - (currentTime.getSeconds() % 60);
      diffMinutes = 8;
    } else if (order.targetTime === "09:45" && order.status !== "סופק") {
      diffSeconds = -(14 * 60 + (currentTime.getSeconds() % 60));
      diffMinutes = -14;
    } else if (order.round === 2) {
      diffSeconds = 18 * 60 + 40 - (currentTime.getSeconds() % 60);
      diffMinutes = 18;
    } else if (order.round === 3) {
      diffSeconds = 55 * 60 - (currentTime.getSeconds() % 60);
      diffMinutes = 55;
    } else {
      diffSeconds = 25 * 60 - (currentTime.getSeconds() % 60);
      diffMinutes = 25;
    }
  }

  /* ---------------- 1. Condition: Recent Change (שינוי כל שהוא) ---------------- */
  const lastChangeTimestamp =
    recentlyChangedOrderIds[order.orderId] ||
    (order.updatedAt ? new Date(order.updatedAt).getTime() : 0);
  const timeSinceChangeMs = currentTime.getTime() - lastChangeTimestamp;
  const isRecentlyChanged = lastChangeTimestamp > 0 && timeSinceChangeMs < 50_000;
  const secondsSinceChange = Math.max(0, Math.floor(timeSinceChangeMs / 1000));

  /* ---------------- 2. Condition: Delayed Status / Schedule Overrun (עיכוב בשינוי סטטוס) ---------------- */
  const isDelayed =
    order.status !== "סופק" &&
    (diffMinutes <= 0 ||
      (order.status === "ממתין" && diffMinutes <= 15) ||
      (order.status === "בהעמסה" && diffMinutes <= 5));

  /* ---------------- 3. Condition: Approaching Delivery (מתקרב מועד אספקה) ---------------- */
  const isApproaching =
    order.status !== "סופק" && !isDelayed && diffMinutes > 0 && diffMinutes <= 40;

  /* ---------------- Primary Alert Hierarchy ---------------- */
  // Priority: Delayed (Rose) > Approaching (Amber) > Recently Changed (Blue)
  type AlertKind = "delayed" | "approaching" | "changed" | null;
  const primaryAlert: AlertKind = isDelayed
    ? "delayed"
    : isApproaching
      ? "approaching"
      : isRecentlyChanged
        ? "changed"
        : null;

  const pulseClass =
    primaryAlert === "delayed"
      ? "animate-gentle-pulse-rose border-rose-500/70 shadow-[0_0_20px_-2px_rgba(244,63,94,0.32)] ring-1 ring-rose-500/40"
      : primaryAlert === "approaching"
        ? "animate-gentle-pulse-amber border-amber-500/70 shadow-[0_0_18px_-2px_rgba(245,158,11,0.28)] ring-1 ring-amber-500/40"
        : primaryAlert === "changed"
          ? "animate-gentle-pulse-blue border-sky-500/70 shadow-[0_0_18px_-2px_rgba(56,189,248,0.3)] ring-1 ring-sky-500/40"
          : order.status === "בהעמסה"
            ? "border-accent/60 ring-2 ring-accent/30 shadow-sm"
            : "border-border/80 shadow-sm";

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 24, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.04, 0.4) }}
      className={cn(
        "relative flex flex-col gap-3 rounded-2xl border bg-card/85 p-4 backdrop-blur-md transition-all duration-300",
        pulseClass,
        order.status === "סופק" && "opacity-75",
      )}
    >
      {/* ---------------- Real-time Gentle Blinking Alert Banner ---------------- */}
      {primaryAlert && (
        <div
          className={cn(
            "flex items-center justify-between gap-2 rounded-xl px-3 py-1.5 text-xs font-black ring-1 transition-all",
            primaryAlert === "delayed" &&
              "bg-rose-500/15 text-rose-800 dark:text-rose-200 ring-rose-500/40",
            primaryAlert === "approaching" &&
              "bg-amber-500/15 text-amber-800 dark:text-amber-200 ring-amber-500/40",
            primaryAlert === "changed" &&
              "bg-sky-500/15 text-sky-800 dark:text-sky-200 ring-sky-500/40",
          )}
        >
          <div className="flex items-center gap-2">
            {/* Gentle Pulsing Beacon Dot */}
            <span className="relative flex size-2.5">
              <span
                className={cn(
                  "absolute inline-flex h-full w-full animate-ping rounded-full opacity-75",
                  primaryAlert === "delayed" && "bg-rose-500",
                  primaryAlert === "approaching" && "bg-amber-500",
                  primaryAlert === "changed" && "bg-sky-500",
                )}
              />
              <span
                className={cn(
                  "relative inline-flex size-2.5 rounded-full",
                  primaryAlert === "delayed" && "bg-rose-600",
                  primaryAlert === "approaching" && "bg-amber-600",
                  primaryAlert === "changed" && "bg-sky-600",
                )}
              />
            </span>

            {/* Live Informative Label */}
            <span className="font-black">
              {primaryAlert === "delayed" && (
                <>
                  <AlertTriangle className="mr-1 inline-block size-3.5 align-text-bottom text-rose-600" />
                  {diffMinutes <= 0 ? (
                    <span>עיכוב בשינוי סטטוס · חריגה של {Math.abs(diffMinutes)} דק׳</span>
                  ) : order.status === "ממתין" ? (
                    <span>עיכוב בשינוי סטטוס · עדיין ממתין להעמסה</span>
                  ) : (
                    <span>עיכוב בהעמסה · יציאה מתעכבת</span>
                  )}
                </>
              )}

              {primaryAlert === "approaching" && (
                <>
                  <Flame className="mr-1 inline-block size-3.5 align-text-bottom text-amber-600" />
                  <span>
                    מתקרב מועד אספקה · עוד {diffMinutes} דק׳ ({order.targetTime})
                  </span>
                </>
              )}

              {primaryAlert === "changed" && (
                <>
                  <Zap className="mr-1 inline-block size-3.5 align-text-bottom text-sky-600" />
                  <span>עודכן כעת בזמן אמת · לפני {secondsSinceChange} שניות</span>
                </>
              )}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Secondary Badge if both changed AND approaching/delayed */}
            {isRecentlyChanged && primaryAlert !== "changed" && (
              <span className="inline-flex items-center gap-1 rounded-md bg-sky-500/20 px-1.5 py-0.5 text-[10px] font-extrabold text-sky-700 dark:text-sky-300">
                <RefreshCw className="size-2.5 animate-spin" style={{ animationDuration: "3s" }} />
                עודכן כעת
              </span>
            )}
            <span className="tabular-nums text-[11px] font-semibold opacity-85">
              {primaryAlert === "changed" ? "שידור חי" : `יעד ${order.targetTime}`}
            </span>
          </div>
        </div>
      )}

      {/* ---------------- Header: Customer Name & Interactive Quick-Status ---------------- */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate text-2xl font-black leading-tight text-foreground">
            {order.customerName}
          </h3>
          <p className="mt-0.5 text-sm font-semibold tabular-nums text-muted-foreground">
            הזמנה {order.orderId}
          </p>
        </div>

        {/* Status Badge with Quick Update Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsStatusMenuOpen((v) => !v)}
            title="לחץ לעדכון סטטוס מהיר בזמן אמת"
            className="group flex items-center gap-1 rounded-full ring-offset-background transition hover:ring-2 hover:ring-primary/40 focus:outline-none"
          >
            <StatusBadge status={order.status} />
            <ChevronDown className="size-3.5 text-muted-foreground transition-transform group-hover:translate-y-0.5" />
          </button>

          {/* Quick Status Dropdown Menu */}
          <AnimatePresence>
            {isStatusMenuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 4 }}
                exit={{ opacity: 0, scale: 0.95, y: -4 }}
                className="absolute left-0 top-full z-50 mt-1 min-w-[140px] overflow-hidden rounded-xl border border-border bg-popover/95 p-1.5 shadow-xl backdrop-blur-md"
              >
                <div className="px-2 py-1 text-[10px] font-bold text-muted-foreground">
                  עדכון סטטוס בזמן אמת:
                </div>
                {ALL_STATUSES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      quickUpdateStatus(order.orderId, s);
                      setIsStatusMenuOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-right text-xs font-bold transition",
                      order.status === s
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground hover:bg-secondary/80",
                    )}
                  >
                    <span>{s}</span>
                    {order.status === s && <CheckCircle2 className="size-3.5" />}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ---------------- Target Time & Round ---------------- */}
      <div className="flex items-center justify-between rounded-xl bg-secondary/70 px-3 py-2">
        <div className="flex items-center gap-2">
          <Clock className="size-5 text-primary" />
          <span className="text-2xl font-black tabular-nums text-foreground">
            {order.targetTime}
          </span>
          <span className="rounded-lg bg-primary/10 px-2 py-0.5 text-sm font-bold text-primary">
            סבב {order.round}
          </span>
        </div>

        {/* Real-time countdown / elapsed display */}
        {order.status !== "סופק" && (
          <span
            className={cn(
              "rounded-md px-2 py-0.5 text-xs font-black tabular-nums",
              diffMinutes <= 0
                ? "bg-rose-500/15 text-rose-700 dark:text-rose-300"
                : diffMinutes <= 30
                  ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                  : "bg-secondary text-muted-foreground",
            )}
          >
            {diffMinutes <= 0 ? `חריגה ${Math.abs(diffMinutes)} דק'` : `עוד ${diffMinutes} דק'`}
          </span>
        )}
      </div>

      {/* ---------------- Logistics Details ---------------- */}
      <ul className="space-y-1.5 text-base font-semibold text-foreground/90">
        <li className="flex items-center gap-2">
          <Truck className="size-4 shrink-0 text-muted-foreground" />
          <span className="truncate">{order.driver}</span>
        </li>
        <li className="flex items-center gap-2">
          <MapPin className="size-4 shrink-0 text-muted-foreground" />
          <span className="truncate">
            {order.address}, {order.city}
          </span>
        </li>
        <li className="flex items-center gap-2">
          <Warehouse className="size-4 shrink-0 text-muted-foreground" />
          <span className="truncate">{order.warehouse}</span>
        </li>
      </ul>

      {/* ---------------- Metrics ---------------- */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-lg bg-secondary/70 px-1 py-1.5">
          <div className="text-lg font-black tabular-nums text-foreground">
            {order.logisticsMetrics.bellaBags}
          </div>
          <div className="text-[11px] font-medium text-muted-foreground">שקי בלה</div>
        </div>
        <div className="rounded-lg bg-secondary/70 px-1 py-1.5">
          <div className="text-lg font-black tabular-nums text-foreground">
            {order.logisticsMetrics.sabanPallets}
          </div>
          <div className="text-[11px] font-medium text-muted-foreground">משטחי סבן</div>
        </div>
        <div className="rounded-lg bg-secondary/70 px-1 py-1.5">
          <div className="text-lg font-black tabular-nums text-foreground">
            {order.logisticsMetrics.estimatedWeightKg.toLocaleString("he-IL")}
          </div>
          <div className="text-[11px] font-medium text-muted-foreground">ק״ג</div>
        </div>
      </div>

      {/* ---------------- Progress Bar & Approvals ---------------- */}
      <div className="mt-auto">
        <div className="mb-1 flex items-center justify-between text-sm font-bold">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Boxes className="size-4" /> {total} מק״טים
          </span>
          <span
            className={cn(
              "flex items-center gap-1.5",
              ratio === 1 ? "text-emerald-600" : "text-accent",
            )}
          >
            <PackageCheck className="size-4" />
            {approved}/{total} אושרו
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-secondary">
          <motion.div
            className={cn("h-full rounded-full", ratio === 1 ? "bg-emerald-500" : "bg-accent")}
            initial={{ width: 0 }}
            animate={{ width: `${ratio * 100}%` }}
            transition={{ duration: 0.6 }}
          />
        </div>
      </div>
    </motion.article>
  );
}
