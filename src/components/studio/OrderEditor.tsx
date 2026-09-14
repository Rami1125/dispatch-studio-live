import { Check, ChevronDown, Minus, Plus } from "lucide-react";
import { useState } from "react";
import { useDispatchBoard } from "@/context/DispatchContext";
import type { Order, OrderStatus } from "@/types/dispatch";
import { StatusBadge } from "@/components/ui/status-badge";
import { cn } from "@/lib/utils";

const STATUSES: OrderStatus[] = ["ממתין", "בהעמסה", "יצא לדרך", "סופק"];

function OrderRow({ order }: { order: Order }) {
  const { setOrderStatus, toggleItemApproval, approveAllItems, updateItemQuantity, updateOrder } =
    useDispatchBoard();
  const [open, setOpen] = useState(false);
  const approved = order.items.filter((i) => i.isApproved).length;

  return (
    <div className="overflow-hidden rounded-xl border border-border/80 bg-card">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-right transition hover:bg-secondary/60"
      >
        <div className="min-w-0">
          <div className="truncate text-sm font-black text-foreground">
            {order.customerName}{" "}
            <span className="font-semibold tabular-nums text-muted-foreground">
              #{order.orderId}
            </span>
          </div>
          <div className="text-xs font-semibold text-muted-foreground">
            {order.targetTime} · סבב {order.round} · {order.warehouse} · {approved}/
            {order.items.length} אושרו
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <StatusBadge status={order.status} size="sm" />
          <ChevronDown className={cn("size-4 transition", open && "rotate-180")} />
        </div>
      </button>

      {open && (
        <div className="space-y-3 border-t border-border/80 p-3">
          <div className="flex gap-1">
            {STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => setOrderStatus(order.orderId, s)}
                className={cn(
                  "flex-1 rounded-lg px-2 py-1.5 text-xs font-bold transition",
                  order.status === s
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:bg-secondary/70",
                )}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <label className="text-xs font-bold text-muted-foreground">
              שעת יעד
              <input
                value={order.targetTime}
                onChange={(e) => updateOrder(order.orderId, { targetTime: e.target.value })}
                className="mt-1 w-full rounded-lg border border-input bg-background px-2 py-1.5 text-sm font-bold text-foreground outline-none focus:border-primary"
              />
            </label>
            <label className="text-xs font-bold text-muted-foreground">
              נהג
              <input
                value={order.driver}
                onChange={(e) => updateOrder(order.orderId, { driver: e.target.value })}
                className="mt-1 w-full rounded-lg border border-input bg-background px-2 py-1.5 text-sm font-bold text-foreground outline-none focus:border-primary"
              />
            </label>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-foreground">מק״טים</span>
            <div className="flex gap-1">
              <button
                onClick={() => approveAllItems(order.orderId, true)}
                className="rounded-lg bg-emerald-500/15 px-2 py-1 text-xs font-bold text-emerald-700"
              >
                אשר הכל
              </button>
              <button
                onClick={() => approveAllItems(order.orderId, false)}
                className="rounded-lg bg-secondary px-2 py-1 text-xs font-bold text-muted-foreground"
              >
                נקה
              </button>
            </div>
          </div>

          <ul className="space-y-1.5">
            {order.items.map((it) => (
              <li
                key={it.sku}
                className="flex items-center gap-2 rounded-lg border border-border/70 bg-secondary/50 px-2 py-1.5"
              >
                <button
                  onClick={() => toggleItemApproval(order.orderId, it.sku)}
                  aria-label="אישור מק״ט"
                  className={cn(
                    "grid size-7 shrink-0 place-items-center rounded-md border transition",
                    it.isApproved
                      ? "border-emerald-500 bg-emerald-500 text-white"
                      : "border-input bg-background text-transparent hover:border-primary",
                  )}
                >
                  <Check className="size-4" strokeWidth={3} />
                </button>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-bold text-foreground">{it.name}</div>
                  <div className="text-[11px] font-semibold tabular-nums text-muted-foreground">
                    מק״ט {it.sku}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => updateItemQuantity(order.orderId, it.sku, it.quantity - 1)}
                    className="grid size-6 place-items-center rounded-md bg-card text-foreground ring-1 ring-border"
                  >
                    <Minus className="size-3" />
                  </button>
                  <input
                    value={it.quantity}
                    onChange={(e) =>
                      updateItemQuantity(order.orderId, it.sku, Number(e.target.value) || 0)
                    }
                    className="w-12 rounded-md border border-input bg-background px-1 py-0.5 text-center text-sm font-black tabular-nums text-foreground outline-none focus:border-primary"
                  />
                  <button
                    onClick={() => updateItemQuantity(order.orderId, it.sku, it.quantity + 1)}
                    className="grid size-6 place-items-center rounded-md bg-card text-foreground ring-1 ring-border"
                  >
                    <Plus className="size-3" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function OrderEditor() {
  const { draft } = useDispatchBoard();
  return (
    <section className="space-y-2">
      <h3 className="text-base font-black text-foreground">עריכת הזמנות (טיוטה)</h3>
      <div className="space-y-2">
        {draft.map((o) => (
          <OrderRow key={o.orderId} order={o} />
        ))}
      </div>
    </section>
  );
}
