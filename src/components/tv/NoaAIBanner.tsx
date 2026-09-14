import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Bot, CheckCircle2, Info, Siren, Sparkles } from "lucide-react";
import { useDispatchBoard } from "@/context/DispatchContext";
import { getDailyInventoryInsights } from "@/services/analyticsService";
import type { AlertLevel, NoaAlert } from "@/types/dispatch";
import { cn } from "@/lib/utils";

const LEVEL_STYLE: Record<AlertLevel, string> = {
  info: "bg-primary/10 text-primary ring-primary/25",
  warning: "bg-accent/15 text-accent ring-accent/30",
  critical: "bg-destructive/10 text-destructive ring-destructive/30",
  success: "bg-emerald-500/10 text-emerald-700 ring-emerald-500/25",
};

function LevelIcon({ level }: { level: AlertLevel }) {
  const cls = "size-6 shrink-0";
  if (level === "critical") return <Siren className={cls} />;
  if (level === "warning") return <AlertTriangle className={cls} />;
  if (level === "success") return <CheckCircle2 className={cls} />;
  return <Info className={cls} />;
}

export function NoaAIBanner() {
  const { alerts, published, warehouses, targetedBriefings } = useDispatchBoard();
  const [index, setIndex] = useState(0);

  const derived: NoaAlert[] = useMemo(() => {
    const list: NoaAlert[] = [];
    const loading = published.filter((o) => o.status === "בהעמסה");
    const driving = published.filter((o) => o.status === "יצא לדרך");
    const waiting = published.filter((o) => o.status === "ממתין");

    // Warehouse directive from AI
    if (targetedBriefings.forWarehouse) {
      list.push({
        id: "ai-wh-directive",
        level: "warning",
        message: `🏗️ למחסנאי: ${targetedBriefings.forWarehouse}`,
        createdAt: new Date().toISOString(),
      });
    }

    // Driver & traffic directive from AI
    if (targetedBriefings.forDriver) {
      list.push({
        id: "ai-driver-directive",
        level: "info",
        message: `🚛 לנהגים בצירים: ${targetedBriefings.forDriver}`,
        createdAt: new Date().toISOString(),
      });
    }

    list.push({
      id: "sum-drivers",
      level: "info",
      message: `${driving.length} משאיות בדרך · ${loading.length} בהעמסה · ${waiting.length} ממתינות לשיבוץ`,
      createdAt: new Date().toISOString(),
    });

    const busiest = [...warehouses].sort((a, b) => b.loadRatio - a.loadRatio)[0];
    if (busiest) {
      list.push({
        id: "sum-warehouse",
        level: busiest.loadRatio > 0.8 ? "warning" : "info",
        message: `עומס ב${busiest.name}: ${Math.round(busiest.loadRatio * 100)}% תפוסה — לתעדף העמסות סבב קרוב`,
        createdAt: new Date().toISOString(),
      });
    }

    const totalWeight = published.reduce((s, o) => s + o.logisticsMetrics.estimatedWeightKg, 0);
    list.push({
      id: "sum-weight",
      level: "info",
      message: `משקל כולל בהפצה היום: ${totalWeight.toLocaleString("he-IL")} ק״ג · ${published.reduce(
        (s, o) => s + o.logisticsMetrics.sabanPallets,
        0,
      )} משטחי סבן`,
      createdAt: new Date().toISOString(),
    });

    // Dynamic Outbound Inventory Insights
    const inventoryInsights = getDailyInventoryInsights(published);
    inventoryInsights.forEach((ins) => {
      list.push({
        id: `inventory-insight-${ins.sku}`,
        level: ins.alertLevel === "HIGH" ? "warning" : "info",
        message: ins.bannerText,
        createdAt: new Date().toISOString(),
      });
    });

    return list;
  }, [published, warehouses, targetedBriefings]);

  const feed = useMemo(() => [...alerts.filter((a) => !a.isFlash), ...derived], [alerts, derived]);

  useEffect(() => {
    const id = setInterval(() => setIndex((i) => i + 1), 10000);
    return () => clearInterval(id);
  }, []);

  if (feed.length === 0) return null;
  const current = feed[index % feed.length]!;

  return (
    <div className="flex items-stretch gap-3 rounded-2xl border border-border/80 bg-card/80 p-3 shadow-sm backdrop-blur-md">
      <div className="flex items-center gap-2 rounded-xl bg-primary px-4 text-primary-foreground">
        <Bot className="size-6" />
        <span className="text-lg font-black">נועה AI</span>
      </div>

      <div className="relative flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id + index}
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className={cn(
              "flex h-full items-center gap-3 rounded-xl px-4 py-2 text-xl font-bold ring-1 ring-inset",
              LEVEL_STYLE[current.level],
            )}
          >
            <LevelIcon level={current.level} />
            {current.id.startsWith("inventory-insight-") && (
              <span className="shrink-0 flex items-center gap-1 rounded-lg bg-amber-500/20 px-2.5 py-1 text-xs font-black text-amber-300 ring-1 ring-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.35)] animate-pulse">
                <Sparkles className="size-3.5" />
                <span>תובנת מלאי יומית</span>
              </span>
            )}
            <span className="truncate">{current.message}</span>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-1.5 px-2">
        {feed.slice(0, 8).map((a, i) => (
          <span
            key={a.id}
            className={cn(
              "size-2 rounded-full transition",
              i === index % feed.length ? "bg-primary" : "bg-border",
            )}
          />
        ))}
      </div>
    </div>
  );
}
