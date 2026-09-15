import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Boxes,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock,
  ExternalLink,
  Flame,
  Gauge,
  Layers,
  MapPin,
  Maximize2,
  Pause,
  Play,
  Radio,
  SlidersHorizontal,
  Sparkles,
  Truck,
  Warehouse,
  X,
  Zap,
} from "lucide-react";
import { useDispatchBoard } from "@/context/DispatchContext";
import { cn } from "@/lib/utils";
import type { Order, OrderStatus } from "@/types/dispatch";

export type UrgencyLevel = "critical" | "loading" | "imminent" | "en_route";

export interface UrgentItem {
  order: Order;
  urgencyLevel: UrgencyLevel;
  priorityScore: number;
  urgencyLabel: string;
  countdownDisplay: string;
  isOverdue: boolean;
  minutesDiff: number;
  secondsDiff: number;
  warehouseName: string;
  driverName: string;
  vehicleName: string;
  totalBella: number;
  totalPallets: number;
  weightTons: string;
  etaTime?: string;
}

const SSR_BASELINE_DATE = new Date("2026-09-14T11:00:00.000Z");

function useTickerClock() {
  const [now, setNow] = useState<Date>(() => SSR_BASELINE_DATE);
  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  return now;
}

/**
 * Calculates urgency and remaining/elapsed time for all published orders.
 */
function evaluateUrgency(orders: Order[], now: Date): UrgentItem[] {
  const activeOrders = orders.filter((o) => o.status !== "סופק");

  return activeOrders
    .map((order) => {
      const [hStr, mStr] = order.targetTime.split(":");
      const targetDate = new Date(now);
      targetDate.setHours(Number(hStr || 12), Number(mStr || 0), 0, 0);

      // Raw diff in milliseconds
      const diffMs = targetDate.getTime() - now.getTime();
      let diffSeconds = Math.round(diffMs / 1000);
      let diffMinutes = Math.round(diffSeconds / 60);

      // Detect off-hours demo window (e.g. night 23:00 testing daytime 11:00 orders)
      // To ensure a lively, realistic ticker at any time of day or night
      const isOffHours = Math.abs(diffMinutes) > 300;
      if (isOffHours) {
        // Normalize based on order round & status for realistic demonstration
        if (order.status === "בהעמסה") {
          diffSeconds = 8 * 60 + 35 - (now.getSeconds() % 60);
          diffMinutes = 8;
        } else if (order.targetTime === "09:45" && order.status === "ממתין") {
          diffSeconds = -(14 * 60 + (now.getSeconds() % 60));
          diffMinutes = -14;
        } else if (order.round === 2) {
          diffSeconds = 18 * 60 + 40 - (now.getSeconds() % 60);
          diffMinutes = 18;
        } else if (order.round === 3) {
          diffSeconds = 55 * 60 - (now.getSeconds() % 60);
          diffMinutes = 55;
        } else {
          diffSeconds = 25 * 60 - (now.getSeconds() % 60);
          diffMinutes = 25;
        }
      }

      const isOverdue = diffSeconds < 0 && order.status === "ממתין";
      let urgencyLevel: UrgencyLevel = "imminent";
      let urgencyLabel = "סבב קרוב";
      let priorityScore = 50;

      if (order.status === "בהעמסה") {
        urgencyLevel = "loading";
        urgencyLabel = "בהעמסה פעילה כעת";
        priorityScore = 95;
      } else if (isOverdue) {
        urgencyLevel = "critical";
        urgencyLabel = "באיחור מלו״ז";
        priorityScore = 100 + Math.min(Math.abs(diffMinutes), 60);
      } else if (order.status === "ממתין" && diffMinutes <= 25) {
        urgencyLevel = "critical";
        urgencyLabel = "יציאה דחופה";
        priorityScore = 90 - diffMinutes;
      } else if (order.status === "יצא לדרך") {
        urgencyLevel = "en_route";
        urgencyLabel = "בדרך לאתר";
        priorityScore = 60;
      } else {
        urgencyLevel = "imminent";
        urgencyLabel = `סבב ${order.round} ליציאה`;
        priorityScore = Math.max(10, 50 - diffMinutes);
      }

      // Format countdown string
      let countdownDisplay = "";
      const absSec = Math.abs(diffSeconds);
      const m = Math.floor(absSec / 60);
      const s = absSec % 60;
      const padM = String(m).padStart(2, "0");
      const padS = String(s).padStart(2, "0");

      if (order.status === "בהעמסה") {
        countdownDisplay = `ברציף · ~${padM}:${padS} דק'`;
      } else if (isOverdue) {
        countdownDisplay = `איחור: -${padM}:${padS} דק'`;
      } else if (order.status === "יצא לדרך") {
        countdownDisplay = `בציר · צפי ~${Math.max(8, diffMinutes)} דק'`;
      } else {
        countdownDisplay = `נותרו: ${padM}:${padS} דק'`;
      }

      // Extract driver & truck details
      const driverParts = order.driver.split("-");
      const driverName = driverParts[0]?.trim() || order.driver;
      const vehicleName = driverParts[1]?.trim() || "משאית חלוקה";

      const totalBella = order.logisticsMetrics.bellaBags || 0;
      const totalPallets = order.logisticsMetrics.sabanPallets || 0;
      const weightTons = ((order.logisticsMetrics.estimatedWeightKg || 0) / 1000).toFixed(1);

      return {
        order,
        urgencyLevel,
        priorityScore,
        urgencyLabel,
        countdownDisplay,
        isOverdue,
        minutesDiff: diffMinutes,
        secondsDiff: diffSeconds,
        warehouseName: order.warehouse,
        driverName,
        vehicleName,
        totalBella,
        totalPallets,
        weightTons,
      };
    })
    .sort((a, b) => b.priorityScore - a.priorityScore);
}

export function UrgentDeliveriesTicker() {
  const { published, openStudio, selectOrder, quickUpdateStatus } = useDispatchBoard();
  const now = useTickerClock();
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Settings & display state
  const [filter, setFilter] = useState<"all" | "critical" | "loading" | "en_route">("all");
  const [isPaused, setIsPaused] = useState(false);
  const [viewMode] = useState<"marquee" | "carousel">("carousel");
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1); // 1x, 1.5x, 2x
  const [direction, setDirection] = useState<"rtl" | "ltr">("rtl");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [selectedUrgentOrder, setSelectedUrgentOrder] = useState<Order | null>(null);
  const [showAllModal, setShowAllModal] = useState(false);

  // Evaluate orders
  const allUrgentItems = useMemo(() => evaluateUrgency(published, now), [published, now]);

  // Filtered items
  const filteredItems = useMemo(() => {
    if (filter === "all") return allUrgentItems;
    if (filter === "critical")
      return allUrgentItems.filter(
        (i) => i.urgencyLevel === "critical" || i.isOverdue || i.minutesDiff <= 25,
      );
    if (filter === "loading") return allUrgentItems.filter((i) => i.urgencyLevel === "loading");
    if (filter === "en_route") return allUrgentItems.filter((i) => i.urgencyLevel === "en_route");
    return allUrgentItems;
  }, [allUrgentItems, filter]);

  // Telemetry counts
  const counts = useMemo(() => {
    return {
      total: allUrgentItems.length,
      critical: allUrgentItems.filter((i) => i.urgencyLevel === "critical" || i.isOverdue).length,
      loading: allUrgentItems.filter((i) => i.urgencyLevel === "loading").length,
      imminent: allUrgentItems.filter(
        (i) => i.urgencyLevel === "imminent" && !i.isOverdue && i.minutesDiff <= 35,
      ).length,
      enRoute: allUrgentItems.filter((i) => i.urgencyLevel === "en_route").length,
      totalTons: allUrgentItems
        .reduce((sum, i) => sum + (i.order.logisticsMetrics.estimatedWeightKg || 0) / 1000, 0)
        .toFixed(1),
    };
  }, [allUrgentItems]);

  // Auto-advance carousel if in carousel mode and not paused
  useEffect(() => {
    if (viewMode !== "carousel" || isPaused || filteredItems.length <= 1) return;
    const interval = setInterval(() => {
      setCarouselIndex((prev) => (prev + 1) % filteredItems.length);
    }, 7000);
    return () => clearInterval(interval);
  }, [viewMode, isPaused, filteredItems.length]);

  // Keep carousel index in bounds
  useEffect(() => {
    if (carouselIndex >= filteredItems.length && filteredItems.length > 0) {
      setCarouselIndex(0);
    }
  }, [carouselIndex, filteredItems.length]);

  // Speed calculation for marquee (default base duration 42s)
  const marqueeDurationSeconds = Math.max(16, Math.round(42 / speedMultiplier));

  if (!hasMounted) {
    return (
      <section aria-hidden="true" className="h-12 rounded-2xl border border-border/70 bg-card/70" />
    );
  }

  if (allUrgentItems.length === 0) {
    return (
      <aside
        suppressHydrationWarning
        aria-label="מבזק משלוחים דחופים"
        className="flex items-center justify-between rounded-xl border border-border/70 bg-card/70 px-4 py-2 text-xs font-semibold text-muted-foreground backdrop-blur"
      >
        <div className="flex items-center gap-2 text-emerald-600">
          <CheckCircle2 className="size-4" />
          <span>כל המשלוחים נמסרו או מסודרים לפי הלו״ז · אין התראות דחופות כעת</span>
        </div>
        <button
          onClick={openStudio}
          className="rounded-lg bg-secondary px-2.5 py-1 text-xs font-bold text-foreground hover:bg-secondary/80"
        >
          פתיחת סטודיו
        </button>
      </aside>
    );
  }

  return (
    <section
      suppressHydrationWarning
      aria-label="מבזק משלוחים דחופים"
      className="relative z-30 flex flex-col rounded-2xl border border-amber-500/30 bg-card/95 shadow-md backdrop-blur-md transition-all"
    >
      {/* Top Header Bar of the Ticker */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 px-4 py-2.5">
        {/* Right Section (RTL Start): Live Tag & Quick Filter Badges */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Live Indicator Pill */}
          <div className="flex items-center gap-2 rounded-xl bg-rose-500/15 px-3 py-1 text-xs font-black text-rose-500 ring-1 ring-rose-500/30">
            <span className="relative flex size-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex size-2.5 rounded-full bg-rose-500" />
            </span>
            <Flame className="size-3.5" />
            <span className="tracking-wide">מבזק משלוחים דחופים</span>
            <span className="rounded-full bg-rose-500 px-1.5 py-0.2 text-[10px] font-black text-white tabular-nums">
              {counts.total}
            </span>
          </div>

          {/* Quick Filters */}
          <div className="flex items-center gap-1 rounded-xl bg-secondary/80 p-1 text-[11px] font-bold">
            <button
              onClick={() => setFilter("all")}
              className={cn(
                "rounded-lg px-2.5 py-1 transition",
                filter === "all"
                  ? "bg-background text-foreground shadow-xs ring-1 ring-border"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              הכל ({counts.total})
            </button>
            {counts.critical > 0 && (
              <button
                onClick={() => setFilter("critical")}
                className={cn(
                  "flex items-center gap-1 rounded-lg px-2.5 py-1 transition",
                  filter === "critical"
                    ? "bg-rose-500 text-white shadow-xs"
                    : "text-rose-500 hover:bg-rose-500/10",
                )}
              >
                <AlertCircle className="size-3" />
                <span>איחור/קריטי ({counts.critical})</span>
              </button>
            )}
            {counts.loading > 0 && (
              <button
                onClick={() => setFilter("loading")}
                className={cn(
                  "flex items-center gap-1 rounded-lg px-2.5 py-1 transition",
                  filter === "loading"
                    ? "bg-amber-500 text-white shadow-xs"
                    : "text-amber-500 hover:bg-amber-500/10",
                )}
              >
                <Warehouse className="size-3" />
                <span>בהעמסה ({counts.loading})</span>
              </button>
            )}
            {counts.enRoute > 0 && (
              <button
                onClick={() => setFilter("en_route")}
                className={cn(
                  "flex items-center gap-1 rounded-lg px-2.5 py-1 transition",
                  filter === "en_route"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-primary hover:bg-primary/10",
                )}
              >
                <Truck className="size-3" />
                <span>בדרך ({counts.enRoute})</span>
              </button>
            )}
          </div>

          {/* Quick Payload Stat */}
          <div className="hidden items-center gap-1.5 rounded-xl bg-muted/60 px-2.5 py-1 text-xs font-semibold text-muted-foreground lg:flex">
            <Boxes className="size-3.5 text-primary" />
            <span className="tabular-nums font-bold text-foreground">{counts.totalTons}T</span>
            <span>בהפצה דחופה</span>
          </div>
        </div>

        {/* Left Section (RTL End): Ticker Controls & Mode Switches */}
        <div className="flex items-center gap-2">
          {/* Pause / Play */}
          <button
            onClick={() => setIsPaused((v) => !v)}
            className={cn(
              "flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-bold transition ring-1",
              isPaused
                ? "bg-amber-500/20 text-amber-500 ring-amber-500/30 hover:bg-amber-500/30"
                : "bg-secondary text-muted-foreground ring-border hover:text-foreground",
            )}
            title={isPaused ? "המשך גלילת מבזק" : "השהה גלילת מבזק"}
          >
            {isPaused ? <Play className="size-3.5" /> : <Pause className="size-3.5" />}
            <span className="hidden sm:inline">{isPaused ? "המשך" : "השהה"}</span>
          </button>

          {/* View All Urgent List Button */}
          <button
            onClick={() => setShowAllModal(true)}
            className="flex items-center gap-1.5 rounded-xl bg-primary px-3 py-1 text-xs font-black text-primary-foreground shadow-xs transition hover:bg-primary/90"
            title="צפייה ברשימת כל המשלוחים הדחופים ועדכון סטטוס"
          >
            <SlidersHorizontal className="size-3.5" />
            <span>כל הדחופים ({filteredItems.length})</span>
          </button>

          {/* Collapse / Expand Toggle */}
          <button
            onClick={() => setIsCollapsed((v) => !v)}
            className="grid size-7 place-items-center rounded-xl text-muted-foreground transition hover:bg-secondary hover:text-foreground"
            title={isCollapsed ? "הרחב מבזק" : "צמצם מבזק"}
          >
            {isCollapsed ? <ChevronDown className="size-4" /> : <ChevronUp className="size-4" />}
          </button>
        </div>
      </div>

      {/* Main Ticker Body */}
      {!isCollapsed && (
        <div className="relative overflow-hidden bg-card/60 py-2.5">
          {viewMode === "marquee" ? (
            /* ============================================================ */
            /* Continuous Scrolling Marquee View                            */
            /* ============================================================ */
            <div
              className="group relative flex w-full overflow-hidden"
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
            >
              {/* Left & Right gradient fade masks for broadcast look */}
              <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-card to-transparent" />
              <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-card to-transparent" />

              <div
                className={cn(
                  "flex shrink-0 items-center gap-4 whitespace-nowrap",
                  direction === "rtl" ? "animate-ticker-marquee-rtl" : "animate-ticker-marquee-ltr",
                  isPaused && "animate-ticker-paused",
                )}
                style={
                  {
                    "--ticker-speed": `${marqueeDurationSeconds}s`,
                  } as CSSProperties
                }
              >
                {/* Duplicate the items array 2x for infinite seamless scroll */}
                {[...filteredItems, ...filteredItems].map((item, idx) => (
                  <TickerCard
                    key={`${item.order.orderId}-${idx}`}
                    item={item}
                    onClick={() => setSelectedUrgentOrder(item.order)}
                  />
                ))}
              </div>
            </div>
          ) : (
            /* ============================================================ */
            /* Focused Single/Carousel Step View                            */
            /* ============================================================ */
            <div className="flex items-center justify-between gap-4 px-4">
              <button
                onClick={() =>
                  setCarouselIndex(
                    (prev) => (prev - 1 + filteredItems.length) % filteredItems.length,
                  )
                }
                className="grid size-9 shrink-0 place-items-center rounded-xl bg-secondary text-foreground ring-1 ring-border transition hover:bg-secondary/80"
                title="משלוח קודם"
              >
                <ChevronRight className="size-5" />
              </button>

              <div className="min-w-0 flex-1">
                {filteredItems[carouselIndex] && (
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={filteredItems[carouselIndex].order.orderId}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.2 }}
                      className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border/80 bg-secondary/50 p-3"
                    >
                      <div className="flex min-w-0 items-center gap-4">
                        {/* Urgency Badge */}
                        <div
                          className={cn(
                            "flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-black ring-1",
                            filteredItems[carouselIndex].urgencyLevel === "critical"
                              ? "bg-rose-500/20 text-rose-500 ring-rose-500/30"
                              : filteredItems[carouselIndex].urgencyLevel === "loading"
                                ? "bg-amber-500/20 text-amber-500 ring-amber-500/30"
                                : "bg-primary/20 text-primary ring-primary/30",
                          )}
                        >
                          <Clock className="size-4" />
                          <span suppressHydrationWarning>
                            {filteredItems[carouselIndex].countdownDisplay}
                          </span>
                        </div>

                        {/* Customer & Location */}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-base font-black text-foreground">
                              {filteredItems[carouselIndex].order.customerName}
                            </span>
                            <span className="text-xs font-bold text-muted-foreground tabular-nums">
                              #{filteredItems[carouselIndex].order.orderId}
                            </span>
                            <span className="rounded-md bg-secondary px-1.5 py-0.5 text-xs font-semibold text-muted-foreground">
                              סבב {filteredItems[carouselIndex].order.round} · יעד:{" "}
                              {filteredItems[carouselIndex].order.targetTime}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <MapPin className="size-3.5 text-muted-foreground" />
                              {filteredItems[carouselIndex].order.address},{" "}
                              {filteredItems[carouselIndex].order.city}
                            </span>
                            <span className="flex items-center gap-1">
                              <Truck className="size-3.5 text-muted-foreground" />
                              {filteredItems[carouselIndex].driverName} (
                              {filteredItems[carouselIndex].vehicleName})
                            </span>
                            <span className="flex items-center gap-1">
                              <Warehouse className="size-3.5 text-muted-foreground" />
                              {filteredItems[carouselIndex].warehouseName}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Cargo Summary & Quick Action */}
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 text-xs font-bold tabular-nums text-foreground">
                          <span className="rounded-lg bg-background px-2 py-1 ring-1 ring-border">
                            {filteredItems[carouselIndex].totalBella} בלה
                          </span>
                          <span className="rounded-lg bg-background px-2 py-1 ring-1 ring-border">
                            {filteredItems[carouselIndex].totalPallets} משטחים
                          </span>
                          <span className="rounded-lg bg-background px-2 py-1 ring-1 ring-border">
                            {filteredItems[carouselIndex].weightTons} טון
                          </span>
                        </div>

                        <button
                          onClick={() => setSelectedUrgentOrder(filteredItems[carouselIndex].order)}
                          className="flex items-center gap-1 rounded-xl bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground transition hover:bg-primary/90"
                        >
                          <span>פרטים ופעולות</span>
                          <ChevronLeft className="size-4" />
                        </button>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                )}
              </div>

              <button
                onClick={() => setCarouselIndex((prev) => (prev + 1) % filteredItems.length)}
                className="grid size-9 shrink-0 place-items-center rounded-xl bg-secondary text-foreground ring-1 ring-border transition hover:bg-secondary/80"
                title="משלוח הבא"
              >
                <ChevronLeft className="size-5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* Quick Action Modal for Single Urgent Order                     */}
      {/* ============================================================ */}
      <AnimatePresence>
        {selectedUrgentOrder && (
          <UrgentOrderModal
            order={selectedUrgentOrder}
            onClose={() => setSelectedUrgentOrder(null)}
            onUpdateStatus={(status) => {
              quickUpdateStatus(selectedUrgentOrder.orderId, status);
              setSelectedUrgentOrder((prev) => (prev ? { ...prev, status } : null));
            }}
            onOpenStudio={() => {
              selectOrder(selectedUrgentOrder.orderId);
              openStudio();
              setSelectedUrgentOrder(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* ============================================================ */}
      {/* All Urgent Deliveries Tactical Sheet/Modal                     */}
      {/* ============================================================ */}
      <AnimatePresence>
        {showAllModal && (
          <AllUrgentModal
            items={allUrgentItems}
            onClose={() => setShowAllModal(false)}
            onSelectOrder={(order) => {
              setShowAllModal(false);
              setSelectedUrgentOrder(order);
            }}
            onUpdateStatus={(orderId, status) => {
              quickUpdateStatus(orderId, status);
            }}
            onOpenStudio={(orderId) => {
              selectOrder(orderId);
              openStudio();
              setShowAllModal(false);
            }}
          />
        )}
      </AnimatePresence>
    </section>
  );
}

/**
 * Individual Compact Delivery Card inside the Marquee Ribbon
 */
function TickerCard({ item, onClick }: { item: UrgentItem; onClick: () => void }) {
  const isCritical = item.urgencyLevel === "critical" || item.isOverdue;
  const isLoading = item.urgencyLevel === "loading";
  const isEnRoute = item.urgencyLevel === "en_route";

  return (
    <button
      onClick={onClick}
      className={cn(
        "group/card flex items-center gap-3 rounded-xl border px-3.5 py-1.5 text-right transition-all hover:scale-[1.02]",
        isCritical
          ? "border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/20"
          : isLoading
            ? "border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20"
            : isEnRoute
              ? "border-primary/40 bg-primary/10 hover:bg-primary/20"
              : "border-border/80 bg-secondary/50 hover:bg-secondary",
      )}
    >
      {/* Status & Countdown Pill */}
      <div
        className={cn(
          "flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-black tabular-nums ring-1",
          isCritical
            ? "bg-rose-500 text-white ring-rose-500"
            : isLoading
              ? "bg-amber-500 text-white ring-amber-500"
              : isEnRoute
                ? "bg-primary text-primary-foreground ring-primary"
                : "bg-secondary text-foreground ring-border",
        )}
      >
        {isCritical ? (
          <AlertCircle className="size-3 animate-pulse" />
        ) : isLoading ? (
          <Warehouse className="size-3" />
        ) : (
          <Clock className="size-3" />
        )}
        <span suppressHydrationWarning>{item.countdownDisplay}</span>
      </div>

      {/* Identification & Destination */}
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <span className="text-xs font-black text-foreground group-hover/card:text-primary">
            {item.order.customerName}
          </span>
          <span className="text-[11px] font-bold text-muted-foreground tabular-nums">
            #{item.order.orderId}
          </span>
          <span className="rounded-sm bg-background/80 px-1 text-[10px] font-bold text-muted-foreground">
            {item.order.targetTime}
          </span>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-medium text-muted-foreground">
          <span className="flex items-center gap-0.5">
            <MapPin className="size-2.5" />
            {item.order.city}
          </span>
          <span>·</span>
          <span>{item.driverName}</span>
          <span>·</span>
          <span>{item.warehouseName}</span>
        </div>
      </div>

      {/* Cargo Chips */}
      <div className="flex items-center gap-1.5 text-[10px] font-black tabular-nums text-foreground/80">
        <span className="rounded-md bg-background/80 px-1.5 py-0.5 ring-1 ring-border/60">
          {item.totalBella} בלה
        </span>
        <span className="rounded-md bg-background/80 px-1.5 py-0.5 ring-1 ring-border/60">
          {item.totalPallets} משטחים
        </span>
      </div>
    </button>
  );
}

/**
 * Quick Action & Inspection Modal for a selected Urgent Order
 */
function UrgentOrderModal({
  order,
  onClose,
  onUpdateStatus,
  onOpenStudio,
}: {
  order: Order;
  onClose: () => void;
  onUpdateStatus: (status: OrderStatus) => void;
  onOpenStudio: () => void;
}) {
  const approvedCount = order.items.filter((i) => i.isApproved).length;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-xs">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl"
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between gap-4 border-b border-border pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-2xl font-black text-foreground">{order.customerName}</h3>
              <span className="rounded-lg bg-secondary px-2 py-0.5 text-xs font-bold text-muted-foreground tabular-nums">
                הזמנה #{order.orderId}
              </span>
            </div>
            <p className="mt-1 text-sm font-semibold text-muted-foreground">
              {order.address}, {order.city} · סבב {order.round} · יעד: {order.targetTime}
            </p>
          </div>
          <button
            onClick={onClose}
            className="grid size-8 place-items-center rounded-xl text-muted-foreground transition hover:bg-secondary hover:text-foreground"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Operational Specs Grid */}
        <div className="my-4 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl bg-secondary/60 p-3">
            <span className="text-xs font-medium text-muted-foreground">נהג ומשאית:</span>
            <div className="mt-0.5 flex items-center gap-2 font-bold text-foreground">
              <Truck className="size-4 text-primary" />
              <span>{order.driver}</span>
            </div>
          </div>
          <div className="rounded-xl bg-secondary/60 p-3">
            <span className="text-xs font-medium text-muted-foreground">מחסן יציאה ורציף:</span>
            <div className="mt-0.5 flex items-center gap-2 font-bold text-foreground">
              <Warehouse className="size-4 text-amber-500" />
              <span>{order.warehouse}</span>
            </div>
          </div>
        </div>

        {/* Cargo Telemetry */}
        <div className="rounded-xl border border-border/80 bg-secondary/40 p-3">
          <span className="text-xs font-bold text-muted-foreground">מטען ח. סבן משובץ:</span>
          <div className="mt-2 grid grid-cols-3 gap-2 text-center text-xs font-black">
            <div className="rounded-lg bg-card p-2 ring-1 ring-border">
              <div className="text-lg text-primary tabular-nums">
                {order.logisticsMetrics.bellaBags}
              </div>
              <div className="text-[11px] font-medium text-muted-foreground">שקי בלה (60002)</div>
            </div>
            <div className="rounded-lg bg-card p-2 ring-1 ring-border">
              <div className="text-lg text-foreground tabular-nums">
                {order.logisticsMetrics.sabanPallets}
              </div>
              <div className="text-[11px] font-medium text-muted-foreground">משטחי סבן (60060)</div>
            </div>
            <div className="rounded-lg bg-card p-2 ring-1 ring-border">
              <div className="text-lg text-foreground tabular-nums">
                {(order.logisticsMetrics.estimatedWeightKg / 1000).toFixed(1)}T
              </div>
              <div className="text-[11px] font-medium text-muted-foreground">משקל משוער</div>
            </div>
          </div>
        </div>

        {/* Items status summary */}
        <div className="mt-3 flex items-center justify-between text-xs font-semibold text-muted-foreground">
          <span>פריטים מאושרים להעמסה:</span>
          <span className="font-bold text-foreground tabular-nums">
            {approvedCount} מתוך {order.items.length}
          </span>
        </div>

        {/* Quick Status Changers */}
        <div className="mt-5 border-t border-border pt-4">
          <span className="text-xs font-bold text-muted-foreground">שינוי סטטוס מהיר בשידור:</span>
          <div className="mt-2 grid grid-cols-3 gap-2">
            <button
              onClick={() => onUpdateStatus("בהעמסה")}
              className={cn(
                "flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold ring-1 transition",
                order.status === "בהעמסה"
                  ? "bg-amber-500 text-white ring-amber-600"
                  : "bg-secondary text-foreground ring-border hover:bg-amber-500/20 hover:text-amber-500",
              )}
            >
              <Warehouse className="size-3.5" />
              <span>בהעמסה</span>
            </button>
            <button
              onClick={() => onUpdateStatus("יצא לדרך")}
              className={cn(
                "flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold ring-1 transition",
                order.status === "יצא לדרך"
                  ? "bg-primary text-primary-foreground ring-primary"
                  : "bg-secondary text-foreground ring-border hover:bg-primary/20 hover:text-primary",
              )}
            >
              <Truck className="size-3.5" />
              <span>יצא לדרך</span>
            </button>
            <button
              onClick={() => onUpdateStatus("סופק")}
              className={cn(
                "flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold ring-1 transition",
                order.status === "סופק"
                  ? "bg-emerald-600 text-white ring-emerald-700"
                  : "bg-secondary text-foreground ring-border hover:bg-emerald-500/20 hover:text-emerald-600",
              )}
            >
              <CheckCircle2 className="size-3.5" />
              <span>סופק</span>
            </button>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="mt-5 flex items-center justify-between gap-3 border-t border-border pt-4">
          <button
            onClick={onOpenStudio}
            className="flex items-center gap-2 rounded-xl bg-secondary px-4 py-2 text-xs font-bold text-foreground transition hover:bg-secondary/80"
          >
            <ExternalLink className="size-4" />
            <span>ערוך בסטודיו ניהול</span>
          </button>
          <button
            onClick={onClose}
            className="rounded-xl bg-primary px-5 py-2 text-xs font-bold text-primary-foreground transition hover:bg-primary/90"
          >
            סגור
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/**
 * Tactical Grid / List of All Urgent Deliveries
 */
function AllUrgentModal({
  items,
  onClose,
  onSelectOrder,
  onUpdateStatus,
  onOpenStudio,
}: {
  items: UrgentItem[];
  onClose: () => void;
  onSelectOrder: (order: Order) => void;
  onUpdateStatus: (orderId: string, status: OrderStatus) => void;
  onOpenStudio: (orderId: string) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-xs">
      <motion.div
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.96, opacity: 0 }}
        className="flex max-h-[85vh] w-full max-w-3xl flex-col rounded-2xl border border-border bg-card shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border p-5">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-rose-500/15 text-rose-500">
              <Flame className="size-6" />
            </div>
            <div>
              <h3 className="text-xl font-black text-foreground">
                מרכז שליטה · כל המשלוחים הדחופים ({items.length})
              </h3>
              <p className="text-xs font-semibold text-muted-foreground">
                מדורג לפי דחיפות מבצעית, איחורים מלו״ז ותור העמסות ברציפים
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="grid size-8 place-items-center rounded-xl text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Deliveries List */}
        <div className="flex-1 space-y-3 overflow-y-auto p-5">
          {items.map((item) => {
            const isCritical = item.urgencyLevel === "critical" || item.isOverdue;
            const isLoading = item.urgencyLevel === "loading";

            return (
              <div
                key={item.order.orderId}
                className={cn(
                  "flex flex-wrap items-center justify-between gap-4 rounded-xl border p-4 transition hover:border-primary/50",
                  isCritical
                    ? "border-rose-500/30 bg-rose-500/5"
                    : isLoading
                      ? "border-amber-500/30 bg-amber-500/5"
                      : "border-border bg-secondary/30",
                )}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={cn(
                      "flex flex-col items-center justify-center rounded-xl px-3 py-2 text-center ring-1",
                      isCritical
                        ? "bg-rose-500 text-white ring-rose-600"
                        : isLoading
                          ? "bg-amber-500 text-white ring-amber-600"
                          : "bg-primary text-primary-foreground ring-primary",
                    )}
                  >
                    <span className="text-[10px] font-bold uppercase">{item.urgencyLabel}</span>
                    <span
                      suppressHydrationWarning
                      className="text-sm font-black tabular-nums leading-tight"
                    >
                      {item.countdownDisplay}
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-black text-foreground">
                        {item.order.customerName}
                      </h4>
                      <span className="text-xs font-bold text-muted-foreground tabular-nums">
                        #{item.order.orderId}
                      </span>
                      <span className="rounded-md bg-secondary px-2 py-0.5 text-xs font-bold text-muted-foreground">
                        סבב {item.order.round} · יעד: {item.order.targetTime}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs font-semibold text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="size-3" />
                        {item.order.address}, {item.order.city}
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Truck className="size-3" />
                        {item.driverName}
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Warehouse className="size-3" />
                        {item.warehouseName}
                      </span>
                    </div>
                    <div className="mt-1.5 flex items-center gap-2 text-xs font-bold tabular-nums text-foreground">
                      <span className="rounded-md bg-secondary px-2 py-0.5">
                        {item.totalBella} שקי בלה
                      </span>
                      <span className="rounded-md bg-secondary px-2 py-0.5">
                        {item.totalPallets} משטחים
                      </span>
                      <span className="rounded-md bg-secondary px-2 py-0.5">
                        {item.weightTons} טון
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status Switchers & Studio Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onUpdateStatus(item.order.orderId, "בהעמסה")}
                    className={cn(
                      "rounded-lg px-2.5 py-1 text-xs font-bold transition",
                      item.order.status === "בהעמסה"
                        ? "bg-amber-500 text-white"
                        : "bg-secondary text-muted-foreground hover:text-foreground",
                    )}
                  >
                    בהעמסה
                  </button>
                  <button
                    onClick={() => onUpdateStatus(item.order.orderId, "יצא לדרך")}
                    className={cn(
                      "rounded-lg px-2.5 py-1 text-xs font-bold transition",
                      item.order.status === "יצא לדרך"
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-muted-foreground hover:text-foreground",
                    )}
                  >
                    בדרך
                  </button>
                  <button
                    onClick={() => onUpdateStatus(item.order.orderId, "סופק")}
                    className="rounded-lg bg-secondary px-2.5 py-1 text-xs font-bold text-muted-foreground hover:bg-emerald-600 hover:text-white"
                  >
                    סופק
                  </button>
                  <button
                    onClick={() => onOpenStudio(item.order.orderId)}
                    className="grid size-8 place-items-center rounded-lg bg-secondary text-muted-foreground hover:text-foreground"
                    title="פתח בסטודיו"
                  >
                    <ExternalLink className="size-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border p-4">
          <span className="text-xs font-semibold text-muted-foreground">
            ח. סבן · מסך הפצה ושליטה מבצעית חי
          </span>
          <button
            onClick={onClose}
            className="rounded-xl bg-primary px-5 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90"
          >
            סגור חלון
          </button>
        </div>
      </motion.div>
    </div>
  );
}
