import { AnimatePresence, motion } from "framer-motion";
import { Check, Clock, Forklift, MapPin, Package, Warehouse } from "lucide-react";
import type { Order } from "@/types/dispatch";
import { cn } from "@/lib/utils";

export function LoadingFocusModal({ order }: { order: Order | null }) {
  return (
    <AnimatePresence mode="wait">
      {order && (
        <motion.section
          key={order.orderId}
          layout
          initial={{ opacity: 0, scale: 0.97, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: -20 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="flex h-full flex-col overflow-hidden rounded-3xl border-2 border-accent/50 bg-card/90 shadow-md ring-4 ring-accent/10 backdrop-blur-md"
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
                <div className="text-3xl font-black leading-none">בהעמסה כעת</div>
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

          <div className="grid flex-1 grid-cols-2 gap-3 overflow-hidden p-4 xl:grid-cols-3">
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
      )}
    </AnimatePresence>
  );
}
