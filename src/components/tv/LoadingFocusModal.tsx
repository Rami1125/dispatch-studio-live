import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  Check,
  Clock,
  Flame,
  Forklift,
  MapPin,
  Package,
  Warehouse,
  Zap,
} from "lucide-react";
import { useDispatchBoard } from "@/context/DispatchContext";
import type { Order } from "@/types/dispatch";
import { cn } from "@/lib/utils";

export function LoadingFocusModal({ order }: { order: Order | null }) {
  const { currentTime, recentlyChangedOrderIds } = useDispatchBoard();

  if (!order) return null;

  /* Real-time Urgency & Change status */
  const [hStr, mStr] = order.targetTime.split(":");
  const targetDate = new Date(currentTime);
  targetDate.setHours(Number(hStr || 12), Number(mStr || 0), 0, 0);

  const diffMs = targetDate.getTime() - currentTime.getTime();
  let diffMinutes = Math.round(diffMs / 60000);
  const isOffHours = Math.abs(diffMinutes) > 300;
  if (isOffHours) {
    diffMinutes = 8;
  }

  const lastChangeTimestamp =
    recentlyChangedOrderIds[order.orderId] ||
    (order.updatedAt ? new Date(order.updatedAt).getTime() : 0);
  const isRecentlyChanged =
    lastChangeTimestamp > 0 && currentTime.getTime() - lastChangeTimestamp < 45_000;
  const isDelayed = diffMinutes <= 0;
  const isApproaching = !isDelayed && diffMinutes <= 40;

  const pulseClass = isDelayed
    ? "animate-gentle-pulse-rose border-rose-500 ring-4 ring-rose-500/30"
    : isApproaching
      ? "animate-gentle-pulse-amber border-amber-500 ring-4 ring-amber-500/30"
      : isRecentlyChanged
        ? "animate-gentle-pulse-blue border-sky-500 ring-4 ring-sky-500/30"
        : "border-accent/50 ring-4 ring-accent/10";

  return (
    <AnimatePresence mode="wait">
      <motion.section
        key={order.orderId}
        layout
        initial={{ opacity: 0, scale: 0.97, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: -20 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className={cn(
          "flex h-full flex-col overflow-hidden rounded-3xl border-2 bg-card/90 shadow-md backdrop-blur-md transition-all duration-300",
          pulseClass,
        )}
      >
        <div className="flex items-center justify-between gap-4 bg-accent px-6 py-3 text-accent-foreground">
          <div className="flex items-center gap-3">
            <motion.span
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ repeat: Infinity, duration: 1.8 }}
              className="grid size-12 place-items-center rounded-2xl bg-accent-foreground/15"
            >
              <Forklift className="size-7" />
            </motion.span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-3xl font-black leading-none">בהעמסה כעת</span>
                {(isDelayed || isApproaching || isRecentlyChanged) && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-foreground/20 px-2.5 py-0.5 text-xs font-black">
                    <span className="relative flex size-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-foreground opacity-75" />
                      <span className="relative inline-flex size-2 rounded-full bg-accent-foreground" />
                    </span>
                    {isDelayed && (
                      <span>
                        <AlertTriangle className="mr-0.5 inline size-3" /> עיכוב בלו״ז
                      </span>
                    )}
                    {isApproaching && !isDelayed && (
                      <span>
                        <Flame className="mr-0.5 inline size-3" /> מועד קרוב: עוד {diffMinutes} דק׳
                      </span>
                    )}
                    {isRecentlyChanged && !isDelayed && !isApproaching && (
                      <span>
                        <Zap className="mr-0.5 inline size-3" /> עודכן בזמן אמת
                      </span>
                    )}
                  </span>
                )}
              </div>
              <div className="mt-1 text-sm font-bold opacity-80">
                הזמנה {order.orderId} · {order.driver}
              </div>
            </div>
          </div>
          <div className="text-left">
            <div className="text-4xl font-black leading-none">{order.customerName}</div>
            <div className="mt-1 flex items-center justify-end gap-4 text-sm font-bold opacity-90">
              <span className="flex items-center gap-1">
                <Clock className="size-4" /> {order.targetTime} · סבב {order.round}
              </span>
              <span className="flex items-center gap-1">
                <Warehouse className="size-4" /> {order.warehouse}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="size-4" /> {order.address}, {order.city}
              </span>
            </div>
          </div>
        </div>

        <div className="grid flex-1 grid-cols-1 gap-3 overflow-y-auto p-4 2xl:grid-cols-2">
          {order.items.map((it, i) => (
            <motion.div
              key={it.sku}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className={cn(
                "flex items-center gap-4 rounded-2xl border p-4",
                it.isApproved
                  ? "border-emerald-500/40 bg-emerald-500/10"
                  : "border-border/80 bg-secondary/60",
              )}
            >
              <div
                className={cn(
                  "grid size-16 shrink-0 place-items-center rounded-xl",
                  it.isApproved ? "bg-emerald-500/20 text-emerald-700" : "bg-card text-primary",
                )}
              >
                <Package className="size-8" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-2xl font-black text-foreground">{it.name}</div>
                <div className="mt-0.5 text-base font-bold tabular-nums text-muted-foreground">
                  מק״ט {it.sku}
                </div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-black tabular-nums text-foreground">
                  {it.quantity}
                </div>
                <div className="text-xs font-medium text-muted-foreground">כמות</div>
              </div>
              {it.isApproved && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="grid size-12 shrink-0 place-items-center rounded-full bg-emerald-500 text-white"
                >
                  <Check className="size-7" strokeWidth={3} />
                </motion.span>
              )}
            </motion.div>
          ))}
        </div>

        <div className="flex items-center justify-between border-t border-border/80 bg-secondary/50 px-6 py-3 text-lg font-bold">
          <span className="text-muted-foreground">
            שקי בלה (60002): {order.logisticsMetrics.bellaBags} · משטחי סבן (60060):{" "}
            {order.logisticsMetrics.sabanPallets}
          </span>
          <span className="text-foreground tabular-nums">
            משקל משוער: {order.logisticsMetrics.estimatedWeightKg.toLocaleString("he-IL")} ק״ג
          </span>
          <span className="text-emerald-700">
            אושרו {order.items.filter((i) => i.isApproved).length}/{order.items.length} מק״טים
          </span>
        </div>
      </motion.section>
    </AnimatePresence>
  );
}
