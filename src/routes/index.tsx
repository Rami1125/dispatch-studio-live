import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence } from "framer-motion";
import { useMemo } from "react";
import { DispatchProvider, useDispatchBoard } from "@/context/DispatchContext";
import { TVHeader } from "@/components/tv/TVHeader";
import { NoaAIBanner } from "@/components/tv/NoaAIBanner";
import { OrderCard } from "@/components/tv/OrderCard";
import { LoadingFocusModal } from "@/components/tv/LoadingFocusModal";
import { NoaFlashOverlay } from "@/components/tv/NoaFlashOverlay";
import { StudioDrawer } from "@/components/studio/StudioDrawer";
import type { Order } from "@/types/dispatch";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ח. סבן · לוח סידור והפצה חי" },
      {
        name: "description",
        content:
          "לוח שידור חי להזמנות, העמסות ונהגים של ח. סבן, עם התראות נועה AI וסטודיו ניהול למשרד.",
      },
      { property: "og:title", content: "ח. סבן · לוח סידור והפצה חי" },
      {
        property: "og:description",
        content: "מסך הפצה חי להקרנה בטלוויזיות המחסן, כולל פוקוס העמסה והתראות נועה AI.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DispatchPage,
});

function RoundSection({ round, orders }: { round: number; orders: Order[] }) {
  return (
    <section className="space-y-2">
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-black text-foreground">סבב {round}</h2>
        <span className="rounded-full bg-secondary px-2.5 py-0.5 text-sm font-bold text-muted-foreground">
          {orders.length} הזמנות
        </span>
        <div className="h-px flex-1 bg-border" />
      </div>
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-3 2xl:grid-cols-4">
        <AnimatePresence mode="popLayout">
          {orders.map((o, i) => (
            <OrderCard key={o.orderId} order={o} index={i} />
          ))}
        </AnimatePresence>
      </div>
    </section>
  );
}

function LiveBoard() {
  const { published, focusOrder } = useDispatchBoard();

  const rounds = useMemo(() => {
    const map = new Map<number, Order[]>();
    [...published]
      .sort((a, b) => a.targetTime.localeCompare(b.targetTime))
      .forEach((o) => {
        const arr = map.get(o.round) ?? [];
        arr.push(o);
        map.set(o.round, arr);
      });
    return Array.from(map.entries()).sort((a, b) => a[0] - b[0]);
  }, [published]);

  return (
    <div dir="rtl" className="flex h-screen w-screen flex-col gap-3 overflow-hidden bg-background p-4">
      <TVHeader />
      <NoaAIBanner />

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 xl:grid-cols-[1.15fr_1fr]">
        {focusOrder && (
          <div className="min-h-0">
            <LoadingFocusModal order={focusOrder} />
          </div>
        )}
        <div className="min-h-0 space-y-4 overflow-y-auto pl-1">
          {rounds.map(([round, orders]) => (
            <RoundSection key={round} round={round} orders={orders} />
          ))}
        </div>
      </div>

      <StudioDrawer />
      <NoaFlashOverlay />
    </div>
  );
}

function DispatchPage() {
  return (
    <DispatchProvider>
      <LiveBoard />
    </DispatchProvider>
  );
}
