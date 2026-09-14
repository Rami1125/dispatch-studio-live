import { motion } from "framer-motion";
import { Boxes, Clock, MapPin, PackageCheck, Truck, Warehouse } from "lucide-react";
import type { Order } from "@/types/dispatch";
import { StatusBadge } from "@/components/ui/status-badge";
import { cn } from "@/lib/utils";

export function OrderCard({ order, index = 0 }: { order: Order; index?: number }) {
  const approved = order.items.filter((i) => i.isApproved).length;
  const total = order.items.length;
  const ratio = total === 0 ? 0 : approved / total;

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 24, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.04, 0.4) }}
      className={cn(
        "flex flex-col gap-3 rounded-2xl border bg-card/80 p-4 shadow-sm backdrop-blur-md transition",
        order.status === "בהעמסה" ? "border-accent/60 ring-2 ring-accent/30" : "border-border/80",
        order.status === "סופק" && "opacity-70",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate text-2xl font-black leading-tight text-foreground">
            {order.customerName}
          </h3>
          <p className="mt-0.5 text-sm font-semibold text-muted-foreground tabular-nums">
            הזמנה {order.orderId}
          </p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <div className="flex items-center gap-2 rounded-xl bg-secondary/70 px-3 py-2">
        <Clock className="size-5 text-primary" />
        <span className="text-2xl font-black tabular-nums text-foreground">{order.targetTime}</span>
        <span className="rounded-lg bg-primary/10 px-2 py-0.5 text-sm font-bold text-primary">
          סבב {order.round}
        </span>
      </div>

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
