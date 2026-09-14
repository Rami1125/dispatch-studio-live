import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Flame,
  Truck,
  Layers,
  Package,
  Boxes,
  Send,
  Sparkles,
  CheckCircle2,
  RefreshCw,
  TrendingDown,
} from "lucide-react";
import type { Order } from "@/types/dispatch";
import { aggregateTodayDispensedInventory } from "@/services/analyticsService";
import { LowStockBadge } from "@/components/inventory/LowStockBadge";
import { cn } from "@/lib/utils";

interface InventoryAlertSlideProps {
  orders: Order[];
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

const slideContainerVariants = {
  initial: { opacity: 0, scale: 0.99 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1],
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
  exit: {
    opacity: 0,
    scale: 1.01,
    transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
  },
};

const cardItemVariants = {
  initial: { opacity: 0, y: 14, scale: 0.98 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  },
};

export function InventoryAlertSlide({
  orders,
  onRefresh,
  isRefreshing = false,
}: InventoryAlertSlideProps) {
  // Aggregate real-time Column H data across all orders
  const summary = useMemo(() => aggregateTodayDispensedInventory(orders), [orders]);

  // Generate WhatsApp message for Nataniel
  const whatsappUrl = useMemo(() => {
    const text =
      `שלום נתנאל, כאן אורן ממגרש 4 החרש 🚚%0A` +
      `להלן סיכום משיכת מלאי יומי מעודכן (עמודה H בדשבורד):%0A` +
      `• מלט אפור: ${summary.totalCementBags} שק (${summary.cementPallets} משטחים) — ${summary.isCementHighDemand ? "🔥 דרושה הזמנה דחופה!" : "תקין"}%0A` +
      `• שקי ענק (בלות): ${summary.totalBigBags} בלות (סומסום: ${summary.bigBagsBreakdown.sesame}, חול: ${summary.bigBagsBreakdown.sand}, טיט: ${summary.bigBagsBreakdown.tit}) — ${summary.isBigBagsQuarryAlert ? "🚜 לתאם פול-טריילר מהמחצבה!" : "תקין"}%0A` +
      `• בלוקים ולוחות: ${summary.totalBlocks} יח' (~${summary.blockPallets} משטחים)%0A` +
      `• תערובות ודבקים: ${summary.totalDryMixBags} שק%0A%0A` +
      `נא אשר קבלת הזמנה לחידוש רצפת המגרש.`;
    return `https://api.whatsapp.com/send?text=${text}`;
  }, [summary]);

  return (
    <motion.div
      variants={slideContainerVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="h-full flex flex-col justify-between gap-6 max-w-7xl mx-auto py-2"
    >
      {/* 1. Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="flex items-center gap-2 rounded-2xl bg-amber-500/20 px-4 py-2 text-sm font-black text-amber-300 ring-2 ring-amber-500/50 shadow-lg shadow-amber-500/20 animate-pulse">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
              </span>
              <span>🚨 דוח משיכת מלאי יומי — מגרש 4 החרש</span>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
              <span>התראות יציאת חומרי בניין מהמגרש</span>
              <span className="rounded-lg bg-cyan-500/20 px-2 py-0.5 text-xs font-bold text-cyan-300 ring-1 ring-cyan-500/30">
                זמן אמת
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              נתונים בזמן אמת מתוך עמודה H בדשבורד ההזמנות ({summary.ordersCount} הזמנות פעילות)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-slate-900/80 px-3.5 py-1.5 text-xs font-semibold text-slate-300 ring-1 ring-slate-800 backdrop-blur-md">
            <span>חישוב אחרון: </span>
            <span className="font-mono font-bold text-amber-400 tabular-nums">
              {summary.lastCalculatedAt}
            </span>
          </div>

          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 rounded-xl bg-slate-800 px-3.5 py-1.5 text-xs font-bold text-slate-200 ring-1 ring-slate-700 transition hover:bg-slate-700"
            >
              <RefreshCw className={cn("size-3.5", isRefreshing && "animate-spin")} />
              <span>רענן גיליון</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Main Grid: Top Dispensed Materials Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 flex-1 items-stretch">
        {/* Card 1: מלט וצמנט (Cement) */}
        <motion.div
          variants={cardItemVariants}
          className={cn(
            "relative overflow-hidden rounded-3xl p-6 flex flex-col justify-between border shadow-2xl backdrop-blur-md transition-all",
            summary.isCementLowStock
              ? "bg-gradient-to-b from-slate-900 via-slate-900 to-rose-950/50 border-rose-500/60 shadow-rose-950/50 ring-1 ring-rose-500/40"
              : summary.isCementHighDemand
                ? "bg-gradient-to-b from-slate-900 via-slate-900 to-amber-950/40 border-amber-500/50 shadow-amber-950/40"
                : "bg-slate-900/90 border-slate-800",
          )}
        >
          {/* Top Title & Status */}
          <div>
            <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
              <span className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Boxes className="size-4 text-amber-400" />
                <span>מלט וצמנט פורטלנד</span>
              </span>
              {summary.isCementLowStock ? (
                <LowStockBadge
                  currentStock={summary.cementCurrentStock}
                  safetyStockLevel={summary.cementSafetyStock}
                  unit="שק"
                  size="sm"
                  urgency="critical"
                />
              ) : summary.isCementHighDemand ? (
                <span className="flex items-center gap-1 rounded-full bg-amber-500/20 px-2.5 py-0.5 text-[11px] font-black text-amber-400 ring-1 ring-amber-500/40 animate-pulse">
                  <Flame className="size-3 text-amber-400" />
                  <span>קצב משיכה גבוה 🔥</span>
                </span>
              ) : (
                <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[11px] font-bold text-emerald-400 ring-1 ring-emerald-500/30">
                  מלאי תקין
                </span>
              )}
            </div>

            {/* Total Bags Display */}
            <div className="my-3">
              <div className="text-4xl lg:text-5xl font-black text-white tabular-nums tracking-tight">
                {summary.totalCementBags}{" "}
                <span className="text-lg lg:text-xl font-bold text-amber-400">שק</span>
              </div>
              <div className="mt-1 flex items-center gap-2 text-xs font-semibold text-slate-300">
                <span className="rounded bg-slate-800 px-2 py-0.5 font-mono text-cyan-300">
                  {summary.cementPallets} משטחים
                </span>
                <span className="text-slate-400">לפי 40 שק/משטח</span>
              </div>
            </div>

            {/* Safety Stock Health Indicator */}
            <div className="mt-2 p-2 rounded-xl bg-slate-950/60 border border-slate-800/80 text-[11px] space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">נותרו במגרש:</span>
                <span
                  className={cn(
                    "font-mono font-black",
                    summary.isCementLowStock ? "text-rose-400 animate-pulse" : "text-emerald-400",
                  )}
                >
                  {summary.cementCurrentStock} / {summary.cementSafetyStock} שק סף ביטחון
                </span>
              </div>
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full transition-all",
                    summary.isCementLowStock ? "bg-rose-500" : "bg-emerald-500",
                  )}
                  style={{
                    width: `${Math.min(100, (summary.cementCurrentStock / 120) * 100)}%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Reorder Recommendation Box */}
          <div className="mt-4 rounded-2xl bg-slate-950/70 p-3.5 border border-slate-800/80">
            <div className="text-[11px] font-bold text-slate-400 mb-1 flex items-center gap-1">
              <Truck className="size-3.5 text-amber-400" />
              <span>המלצת רכש לרצפת מגרש:</span>
            </div>
            <p className="text-xs font-bold text-amber-200 leading-snug">
              {summary.cementReorderRecommendation}
            </p>
          </div>
        </motion.div>

        {/* Card 2: שקים גדולים / בלות (Big Bags) */}
        <motion.div
          variants={cardItemVariants}
          className={cn(
            "relative overflow-hidden rounded-3xl p-6 flex flex-col justify-between border shadow-2xl backdrop-blur-md transition-all",
            summary.isBigBagsLowStock
              ? "bg-gradient-to-b from-slate-900 via-slate-900 to-rose-950/50 border-rose-500/60 shadow-rose-950/50 ring-1 ring-rose-500/40"
              : summary.isBigBagsQuarryAlert
                ? "bg-gradient-to-b from-slate-900 via-slate-900 to-cyan-950/40 border-cyan-500/50 shadow-cyan-950/40"
                : "bg-slate-900/90 border-slate-800",
          )}
        >
          <div>
            <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
              <span className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Package className="size-4 text-cyan-400" />
                <span>שקים גדולים / בלות</span>
              </span>
              {summary.isBigBagsLowStock ? (
                <LowStockBadge
                  currentStock={summary.bigBagsCurrentStock}
                  safetyStockLevel={summary.bigBagsSafetyStock}
                  unit="בלות"
                  size="sm"
                  urgency="critical"
                />
              ) : summary.isBigBagsQuarryAlert ? (
                <span className="flex items-center gap-1 rounded-full bg-cyan-500/20 px-2.5 py-0.5 text-[11px] font-black text-cyan-300 ring-1 ring-cyan-500/40 animate-pulse">
                  <AlertTriangle className="size-3" />
                  <span>התראת מחצבה 🚜</span>
                </span>
              ) : (
                <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[11px] font-bold text-emerald-400 ring-1 ring-emerald-500/30">
                  מלאי תקין
                </span>
              )}
            </div>

            <div className="my-3">
              <div className="text-4xl lg:text-5xl font-black text-white tabular-nums tracking-tight">
                {summary.totalBigBags}{" "}
                <span className="text-lg lg:text-xl font-bold text-cyan-400">בלות</span>
              </div>

              {/* Breakdown */}
              <div className="mt-2 flex flex-wrap gap-1.5 text-xs font-semibold">
                <span className="rounded-lg bg-slate-800 px-2 py-0.5 text-slate-200 flex items-center gap-1">
                  <span>סומסום:</span>{" "}
                  <b className="text-cyan-300">{summary.bigBagsBreakdown.sesame}</b>
                </span>
                <span className="rounded-lg bg-slate-800 px-2 py-0.5 text-slate-200 flex items-center gap-1">
                  <span>חול:</span> <b className="text-cyan-300">{summary.bigBagsBreakdown.sand}</b>
                </span>
                <span className="rounded-lg bg-slate-800 px-2 py-0.5 text-slate-200 flex items-center gap-1">
                  <span>טיט:</span> <b className="text-cyan-300">{summary.bigBagsBreakdown.tit}</b>
                </span>
              </div>
            </div>

            {/* Safety Stock Health Indicator */}
            <div className="mt-2 p-2 rounded-xl bg-slate-950/60 border border-slate-800/80 text-[11px] space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">נותרו במגרש:</span>
                <span
                  className={cn(
                    "font-mono font-black",
                    summary.isBigBagsLowStock ? "text-rose-400 animate-pulse" : "text-emerald-400",
                  )}
                >
                  {summary.bigBagsCurrentStock} / {summary.bigBagsSafetyStock} בלות סף
                </span>
              </div>
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full transition-all",
                    summary.isBigBagsLowStock ? "bg-rose-500" : "bg-cyan-500",
                  )}
                  style={{
                    width: `${Math.min(100, (summary.bigBagsCurrentStock / 40) * 100)}%`,
                  }}
                />
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-2xl bg-slate-950/70 p-3.5 border border-slate-800/80">
            <div className="text-[11px] font-bold text-slate-400 mb-1 flex items-center gap-1">
              <Truck className="size-3.5 text-cyan-400" />
              <span>תיאום מחצבה מומלץ:</span>
            </div>
            <p className="text-xs font-bold text-cyan-200 leading-snug">
              {summary.bigBagsReorderRecommendation}
            </p>
          </div>
        </motion.div>

        {/* Card 3: בלוקים ולוחות (Blocks & Boards) */}
        <motion.div
          variants={cardItemVariants}
          className={cn(
            "relative overflow-hidden rounded-3xl p-6 flex flex-col justify-between border shadow-2xl backdrop-blur-md transition-all",
            summary.isBlocksLowStock
              ? "border-rose-500/60 bg-gradient-to-b from-slate-900 via-slate-900 to-rose-950/50 shadow-rose-950/50 ring-1 ring-rose-500/40"
              : "border-indigo-500/40 bg-gradient-to-b from-slate-900 via-slate-900 to-indigo-950/30",
          )}
        >
          <div>
            <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
              <span className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Layers className="size-4 text-indigo-400" />
                <span>בלוקים ולוחות</span>
              </span>
              {summary.isBlocksLowStock ? (
                <LowStockBadge
                  currentStock={summary.blocksCurrentStock}
                  safetyStockLevel={summary.blocksSafetyStock}
                  unit="יח'"
                  size="sm"
                  urgency="critical"
                />
              ) : (
                <span className="rounded-full bg-indigo-500/20 px-2.5 py-0.5 text-[11px] font-black text-indigo-300 ring-1 ring-indigo-500/30">
                  מחסן 4
                </span>
              )}
            </div>

            <div className="my-3">
              <div className="text-4xl lg:text-5xl font-black text-white tabular-nums tracking-tight">
                {summary.totalBlocks}{" "}
                <span className="text-lg lg:text-xl font-bold text-indigo-400">יח'</span>
              </div>
              <div className="mt-1 flex items-center gap-2 text-xs font-semibold text-slate-300">
                <span className="rounded bg-slate-800 px-2 py-0.5 font-mono text-indigo-300">
                  {summary.blockPallets} משטחים
                </span>
                <span className="text-slate-400">בלוק 20, 10, 7 ולוחות</span>
              </div>
            </div>

            {/* Safety Stock Health Indicator */}
            <div className="mt-2 p-2 rounded-xl bg-slate-950/60 border border-slate-800/80 text-[11px] space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">נותרו במגרש:</span>
                <span
                  className={cn(
                    "font-mono font-black",
                    summary.isBlocksLowStock ? "text-rose-400 animate-pulse" : "text-indigo-300",
                  )}
                >
                  {summary.blocksCurrentStock} / {summary.blocksSafetyStock} יח' סף
                </span>
              </div>
            </div>

            {/* Sub-items preview */}
            <div className="mt-2 space-y-1">
              {Object.entries(summary.blocksBreakdown)
                .slice(0, 3)
                .map(([name, count]) => (
                  <div key={name} className="flex justify-between text-[11px] text-slate-300">
                    <span className="truncate max-w-[130px]">{name}:</span>
                    <span className="font-bold text-indigo-200 tabular-nums">{count} יח'</span>
                  </div>
                ))}
            </div>
          </div>

          <div className="mt-4 rounded-2xl bg-slate-950/70 p-3.5 border border-slate-800/80">
            <div className="text-[11px] font-bold text-slate-400 mb-1 flex items-center gap-1">
              <CheckCircle2 className="size-3.5 text-indigo-400" />
              <span>ארגון טורי מגרש:</span>
            </div>
            <p className="text-xs font-bold text-indigo-200 leading-snug">
              סך הכל ~{Math.ceil(summary.totalBlocks / 75)} משטחי סבן לחלוקה בין רציפי ההעמסה
            </p>
          </div>
        </motion.div>

        {/* Card 4: תערובות יבשות, טיח ודבקים (Dry-Mix & Adhesives) */}
        <motion.div
          variants={cardItemVariants}
          className={cn(
            "relative overflow-hidden rounded-3xl p-6 flex flex-col justify-between border shadow-2xl backdrop-blur-md transition-all",
            summary.isDryMixLowStock
              ? "border-rose-500/60 bg-gradient-to-b from-slate-900 via-slate-900 to-rose-950/50 shadow-rose-950/50 ring-1 ring-rose-500/40"
              : "border-fuchsia-500/40 bg-gradient-to-b from-slate-900 via-slate-900 to-fuchsia-950/30",
          )}
        >
          <div>
            <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
              <span className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Sparkles className="size-4 text-fuchsia-400" />
                <span>תערובות, טיח ודבק</span>
              </span>
              {summary.isDryMixLowStock ? (
                <LowStockBadge
                  currentStock={summary.dryMixCurrentStock}
                  safetyStockLevel={summary.dryMixSafetyStock}
                  unit="שק"
                  size="sm"
                  urgency="critical"
                />
              ) : (
                <span className="rounded-full bg-fuchsia-500/20 px-2.5 py-0.5 text-[11px] font-black text-fuchsia-300 ring-1 ring-fuchsia-500/30">
                  שקים ופחים
                </span>
              )}
            </div>

            <div className="my-3">
              <div className="text-4xl lg:text-5xl font-black text-white tabular-nums tracking-tight">
                {summary.totalDryMixBags}{" "}
                <span className="text-lg lg:text-xl font-bold text-fuchsia-400">שק</span>
              </div>
              <div className="mt-1 text-xs font-semibold text-slate-400">
                ריצופית, פלסטומר, טיט, טיח גבס
              </div>
            </div>

            {/* Safety Stock Health Indicator */}
            <div className="mt-2 p-2 rounded-xl bg-slate-950/60 border border-slate-800/80 text-[11px] space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">נותרו במגרש:</span>
                <span
                  className={cn(
                    "font-mono font-black",
                    summary.isDryMixLowStock ? "text-rose-400 animate-pulse" : "text-fuchsia-300",
                  )}
                >
                  {summary.dryMixCurrentStock} / {summary.dryMixSafetyStock} שק סף
                </span>
              </div>
            </div>

            {/* Dry mix breakdown */}
            <div className="mt-2 space-y-1">
              {Object.entries(summary.dryMixBreakdown)
                .slice(0, 3)
                .map(([name, count]) => (
                  <div key={name} className="flex justify-between text-[11px] text-slate-300">
                    <span className="truncate max-w-[130px]">{name}:</span>
                    <span className="font-bold text-fuchsia-200 tabular-nums">{count} שק</span>
                  </div>
                ))}
            </div>
          </div>

          <div className="mt-4 rounded-2xl bg-slate-950/70 p-3.5 border border-slate-800/80">
            <div className="text-[11px] font-bold text-slate-400 mb-1 flex items-center gap-1">
              <CheckCircle2 className="size-3.5 text-fuchsia-400" />
              <span>סטטוס ליקוט:</span>
            </div>
            <p className="text-xs font-bold text-fuchsia-200 leading-snug">
              הכנת משטחי ליקוט מרוכזים למלגזנים מגרש 4
            </p>
          </div>
        </motion.div>
      </div>

      {/* 3. Action Footer: Reminder for Oren and Direct Reorder Trigger */}
      <motion.div
        variants={cardItemVariants}
        className="rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-950/50 via-slate-900 to-slate-900 p-4 shadow-xl backdrop-blur-md flex flex-wrap items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-xl bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/40">
            <Send className="size-5" />
          </div>
          <div>
            <div className="text-sm font-black text-amber-300">
              אורן, שלח דרישת רכש מעודכנת לנתנאל הקניין ישירות ממסוף הליקוט במובייל 📲
            </div>
            <div className="text-xs text-slate-400">
              חישוב צריכת מלט ובלות לפי נתוני אמת שנסרקו מתוך עמודה H בדשבורד_הזמנות
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-black text-white shadow-lg shadow-emerald-600/30 transition hover:bg-emerald-500 active:scale-95"
          >
            <Send className="size-4" />
            <span>שידור דרישת רכש בוואטסאפ לנתנאל</span>
          </a>
        </div>
      </motion.div>
    </motion.div>
  );
}
