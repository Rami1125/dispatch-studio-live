import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  ArrowRight,
  Bot,
  Box,
  Building2,
  CheckCircle2,
  Clock,
  HardHat,
  Maximize2,
  Navigation,
  Play,
  Pause,
  FastForward,
  RotateCw,
  Sparkles,
  Truck,
  Volume2,
  VolumeX,
  Warehouse,
  Flame,
  Film,
  AlertTriangle,
  TrendingUp,
  Package,
  Share2,
  ExternalLink,
  Folder,
  Presentation,
} from "lucide-react";
import { useDispatchBoard } from "@/context/DispatchContext";
import { computeProductAnalytics, getDailyInventoryInsights } from "@/services/analyticsService";
import { ARTERIAL_ROUTES, calculateDriverETAs } from "@/services/trafficService";
import { LowStockBadge } from "@/components/inventory/LowStockBadge";
import { DriveMediaPlayer } from "./DriveMediaPlayer";
import { InventoryAlertSlide } from "./InventoryAlertSlide";
import type { ScreensaverMode } from "@/types/screensaver";
import { cn } from "@/lib/utils";

const VIDEO_THEMES = [
  {
    id: "warehouse-ambient",
    title: "לוגיסטיקה ומנופים חכמים",
    desc: "עבודת פריקה והעמסה של משאיות כבדות",
    // Reliable royalty-free ambient logistics/freight clips
    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
  },
  {
    id: "highway-freight",
    title: "שיירת הובלה בצירים פתוחים",
    desc: "משאיות פול-טריילר ורכינה בתנועה",
    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4",
  },
];

export const SCREENSAVER_MODES: {
  id: ScreensaverMode;
  label: string;
  shortLabel: string;
  badge: string;
  category: "alert" | "media" | "ops";
}[] = [
  {
    id: "INVENTORY_ALERT",
    label: "דוח משיכת מלאי (עמודה H)",
    shortLabel: "משיכת מלאי חי",
    badge: "התראת רכש מגרש",
    category: "alert",
  },
  {
    id: "drive_media",
    label: "מדיה ומצגות מ-Drive",
    shortLabel: "מדיה Drive",
    badge: "הדרכה ווידאו",
    category: "media",
  },
  {
    id: "STOCK_ALERT",
    label: "התראות רכש ומלאי מוגבר",
    shortLabel: "התראות רכש",
    badge: "מלאי מוגבר",
    category: "alert",
  },
  {
    id: "video",
    label: "וידאו לוגיסטיקה ואווירה",
    shortLabel: "וידאו אווירה",
    badge: "הפוגה מבצעית",
    category: "media",
  },
  {
    id: "analytics",
    label: "מדדי ביצועים ומותגי סבן",
    shortLabel: "ביצועי סבן",
    badge: "דשבורד מבצעי",
    category: "ops",
  },
  {
    id: "traffic",
    label: "מצב פקקים ו-ETA משאיות",
    shortLabel: "צירי תנועה",
    badge: "צי רכבים",
    category: "ops",
  },
];

/**
 * Standardized pure Framer Motion cross-fade variants for all screensaver slides.
 * Removes jarring Y jumps or extreme scales to produce smooth cinematic fades.
 */
export const screensaverCrossFadeVariants = {
  initial: {
    opacity: 0,
    scale: 0.995,
  },
  animate: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1],
    },
  },
  exit: {
    opacity: 0,
    scale: 1.005,
    transition: {
      duration: 0.35,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

export function DispatchScreensaver() {
  const {
    isScreensaverActive,
    setScreensaverActive,
    screensaverSettings,
    updateScreensaverSettings,
    published,
    targetedBriefings,
    nearestOrderMinutesRemaining,
    generateAIBriefing,
    isGeneratingAI,
    alerts,
    syncNow,
  } = useDispatchBoard();

  const [activeTab, setActiveTab] = useState<ScreensaverMode>("INVENTORY_ALERT");
  const [selectedVideoTheme, setSelectedVideoTheme] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState<string>("");
  const [currentDate, setCurrentDate] = useState<string>("");
  const [isCyclePaused, setIsCyclePaused] = useState(false);
  const [cycleProgress, setCycleProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Live clock
  useEffect(() => {
    const update = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("he-IL", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      );
      setCurrentDate(
        now.toLocaleDateString("he-IL", {
          weekday: "long",
          day: "numeric",
          month: "long",
        }),
      );
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  // Compute live analytics and driver ETAs
  const analytics = useMemo(() => computeProductAnalytics(published), [published]);
  const driverETAs = useMemo(() => calculateDriverETAs(published), [published]);
  const inventoryInsights = useMemo(() => getDailyInventoryInsights(published), [published]);

  // Active inventory insight index when on STOCK_ALERT slide
  const [activeStockIndex, setActiveStockIndex] = useState(0);

  const cycleDurationSec = screensaverSettings.cycleIntervalSeconds || 14;

  // Handler to switch tabs and reset the progress bar
  const handleSelectTab = useCallback((mode: ScreensaverMode) => {
    setActiveTab(mode);
    setCycleProgress(0);
  }, []);

  // Handler to trigger next slide immediately
  const handleNextSlide = useCallback(() => {
    setActiveTab((currTab) => {
      const currentIdx = SCREENSAVER_MODES.findIndex((m) => m.id === currTab);
      const nextIdx = (currentIdx + 1) % SCREENSAVER_MODES.length;
      return SCREENSAVER_MODES[nextIdx].id;
    });
    setCycleProgress(0);
  }, []);

  // Auto-cycle through views with smooth progress tracking
  useEffect(() => {
    if (!isScreensaverActive || !screensaverSettings.autoCycle || isCyclePaused) return;

    const intervalMs = 150;
    const stepIncrement = (intervalMs / (cycleDurationSec * 1000)) * 100;

    const timer = setInterval(() => {
      setCycleProgress((prev) => {
        if (prev + stepIncrement >= 100) {
          // Switch to next tab smoothly
          setActiveTab((currTab) => {
            const currentIdx = SCREENSAVER_MODES.findIndex((m) => m.id === currTab);
            const nextIdx = (currentIdx + 1) % SCREENSAVER_MODES.length;
            return SCREENSAVER_MODES[nextIdx].id;
          });
          return 0;
        }
        return prev + stepIncrement;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isScreensaverActive, screensaverSettings.autoCycle, isCyclePaused, cycleDurationSec]);

  // Auto-advance products within STOCK_ALERT every 7 seconds
  useEffect(() => {
    if (activeTab !== "STOCK_ALERT" || inventoryInsights.length <= 1 || isCyclePaused) return;
    const timer = setInterval(() => {
      setActiveStockIndex((prev) => (prev + 1) % inventoryInsights.length);
    }, 7000);
    return () => clearInterval(timer);
  }, [activeTab, inventoryInsights.length, isCyclePaused]);

  // Video play state sync
  useEffect(() => {
    if (videoRef.current) {
      if (isVideoPlaying) {
        videoRef.current.play().catch(() => {
          /* browser autoplay constraint */
        });
      } else {
        videoRef.current.pause();
      }
    }
  }, [isVideoPlaying, activeTab, selectedVideoTheme]);

  if (!isScreensaverActive) return null;

  const urgentAlertsCount = alerts.filter((a) => a.level === "critical").length;
  const isLullTime = urgentAlertsCount === 0;

  return (
    <AnimatePresence>
      <motion.div
        key="screensaver-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        dir="rtl"
        className="fixed inset-0 z-50 flex flex-col bg-slate-950/95 text-slate-100 backdrop-blur-xl overflow-hidden select-none"
      >
        {/* Background ambient lighting effects */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 right-1/4 h-96 w-96 rounded-full bg-blue-600/10 blur-[120px]" />
          <div className="absolute -bottom-40 left-1/4 h-96 w-96 rounded-full bg-amber-500/10 blur-[120px]" />
        </div>

        {/* TOP BAR */}
        <header className="relative z-10 flex items-center justify-between border-b border-slate-800/80 bg-slate-900/60 px-6 py-3.5 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <div className="grid size-11 place-items-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-md shadow-blue-500/20">
              <Truck className="size-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-tight text-white">ח. סבן</span>
                <span className="rounded-md bg-blue-500/20 px-2 py-0.5 text-xs font-bold text-blue-300 ring-1 ring-blue-500/30">
                  שומר מסך מבצעי
                </span>
                {isLullTime && (
                  <span className="flex items-center gap-1 rounded-md bg-emerald-500/15 px-2 py-0.5 text-xs font-bold text-emerald-400">
                    <CheckCircle2 className="size-3.5" /> הפוגה שקטה
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                ניתוחי ביצועים · מותגי מוצרים · מצב פקקים ו-ETA · נועה AI
              </p>
            </div>
          </div>

          {/* Mode Selector Tabs */}
          <div className="flex items-center gap-1 rounded-xl bg-slate-800/80 p-1 ring-1 ring-slate-700/60">
            <button
              onClick={() => setActiveTab("INVENTORY_ALERT")}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-bold transition relative",
                activeTab === "INVENTORY_ALERT"
                  ? "bg-amber-600 text-white shadow-sm ring-1 ring-amber-400"
                  : "text-slate-400 hover:text-white",
              )}
            >
              <Flame className="size-4 text-amber-400" />
              <span>🚨 משיכת מלאי (עמודה H)</span>
              <span className="size-2 rounded-full bg-red-500 animate-ping absolute -top-1 -right-1" />
            </button>
            <button
              onClick={() => setActiveTab("analytics")}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-bold transition",
                activeTab === "analytics"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white",
              )}
            >
              <Activity className="size-4" />
              <span>ביצועים ומותגי סבן</span>
            </button>
            <button
              onClick={() => setActiveTab("STOCK_ALERT")}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-bold transition relative",
                activeTab === "STOCK_ALERT"
                  ? "bg-amber-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white",
              )}
            >
              <AlertTriangle className="size-4 text-amber-400" />
              <span>התראות מלאי ורכש</span>
              {inventoryInsights.some((i) => i.alertLevel === "HIGH") && (
                <span className="size-2 rounded-full bg-red-500 animate-ping absolute -top-1 -right-1" />
              )}
            </button>
            <button
              onClick={() => setActiveTab("drive_media")}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-bold transition relative",
                activeTab === "drive_media"
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white",
              )}
            >
              <Folder className="size-4 text-purple-400" />
              <span>מדיה מדרייב (וידאו ומצגות)</span>
            </button>
            <button
              onClick={() => setActiveTab("traffic")}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-bold transition",
                activeTab === "traffic"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white",
              )}
            >
              <Navigation className="size-4" />
              <span>מצב פקקים וצפי הגעה</span>
            </button>
            <button
              onClick={() => setActiveTab("video")}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-bold transition",
                activeTab === "video"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white",
              )}
            >
              <Film className="size-4" />
              <span>וידאו הפוגה בלופ</span>
            </button>
          </div>

          {/* Right Clock & Dismiss button */}
          <div className="flex items-center gap-4">
            <div className="text-left">
              <div className="text-2xl font-black tabular-nums tracking-wide text-white">
                {currentTime}
              </div>
              <div className="text-[11px] font-medium text-slate-400">{currentDate}</div>
            </div>

            <button
              onClick={() => setScreensaverActive(false)}
              className="flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2 text-xs font-bold text-slate-200 ring-1 ring-slate-700 transition hover:bg-slate-700 hover:text-white"
            >
              <span>חזרה ללוח ההפצה</span>
              <ArrowRight className="size-4" />
            </button>
          </div>
        </header>

        {/* AI BRIEFING STRIP (Prominent AI Updates Bar) */}
        <div className="relative z-10 border-b border-slate-800 bg-slate-900/80 px-6 py-2.5">
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 rounded-lg bg-blue-500/20 px-2.5 py-1 text-xs font-black text-blue-400 ring-1 ring-blue-500/30">
                <Bot className="size-4" />
                <span>נועה AI</span>
              </div>
              <span className="font-bold text-slate-200">
                {targetedBriefings.scheduledNotice || "תדריך מבצעי בתוקף לשומר המסך"}
              </span>
            </div>

            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5 text-amber-400">
                <HardHat className="size-3.5" />
                <span className="font-semibold text-slate-300">למחסנאי:</span>
                <span className="truncate max-w-[280px] text-amber-300">
                  {targetedBriefings.forWarehouse}
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-sky-400">
                <Truck className="size-3.5" />
                <span className="font-semibold text-slate-300">לנהג:</span>
                <span className="truncate max-w-[280px] text-sky-300">
                  {targetedBriefings.forDriver}
                </span>
              </div>

              <button
                onClick={() => generateAIBriefing()}
                disabled={isGeneratingAI}
                className="flex items-center gap-1 rounded-lg bg-blue-600/30 px-2.5 py-1 text-[11px] font-bold text-blue-300 ring-1 ring-blue-500/40 hover:bg-blue-600/50"
              >
                <Sparkles className={cn("size-3", isGeneratingAI && "animate-spin")} />
                <span>{isGeneratingAI ? "מרענן..." : "רענן תובנות AI"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* MAIN DISPLAY AREA */}
        <main className="relative z-10 flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            {activeTab === "analytics" && (
              <motion.div
                key="analytics-view"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* 4 Hero KPI Cards */}
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-lg">
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="text-xs font-bold">קצב העמסה לשעה</span>
                      <Box className="size-4 text-blue-400" />
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-4xl font-black tabular-nums text-white">
                        {analytics.loadingRatePalletsPerHour}
                      </span>
                      <span className="text-xs font-bold text-emerald-400">+14% מהיעד</span>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-400">משטחים ממוצע / שעה במחסנים</p>
                  </div>

                  <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-lg">
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="text-xs font-bold">עמידה ביעד זמנים</span>
                      <Clock className="size-4 text-amber-400" />
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-4xl font-black tabular-nums text-emerald-400">
                        {analytics.onTimeRatePercent}%
                      </span>
                      <span className="text-xs font-semibold text-slate-400">יעד: 95%</span>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-400">
                      הזמנות שיצאו בטווח הדיוק המוגדר
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-lg">
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="text-xs font-bold">משקל מצטבר בהפצה</span>
                      <Building2 className="size-4 text-purple-400" />
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-4xl font-black tabular-nums text-white">
                        {(analytics.totalWeightKg / 1000).toFixed(1)}
                      </span>
                      <span className="text-sm font-bold text-slate-400">טון</span>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-400">
                      {analytics.bellaBagsTotal} שקי בלה · {analytics.sabanPalletsTotal} משטחי סבן
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-lg">
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="text-xs font-bold">ניצולת צי המשאיות</span>
                      <Truck className="size-4 text-emerald-400" />
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-4xl font-black tabular-nums text-white">
                        {analytics.fleetUtilizationPercent}%
                      </span>
                      <span className="text-xs font-bold text-blue-400">6/7 פעילות</span>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-400">חלוקה פעילה בצירים מרכזיים</p>
                  </div>
                </div>

                {/* Products and Brands Breakdown Grid */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                  {/* Left: Product lines table */}
                  <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg">
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Flame className="size-5 text-amber-500" />
                        <h3 className="text-base font-black text-white">
                          מותגי ומוצרי סבן מובילים בהפצה (בלה ומשטחים)
                        </h3>
                      </div>
                      <span className="text-xs font-medium text-slate-400">
                        סנכרון מק״טים חי מול דשבורד
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      {analytics.topProducts.map((p) => (
                        <div
                          key={p.sku}
                          className="flex items-center justify-between rounded-xl border border-slate-800/80 bg-slate-950/50 p-3 transition hover:border-slate-700"
                        >
                          <div className="flex items-center gap-3">
                            <span className="rounded-lg bg-slate-800 px-2 py-1 text-xs font-mono font-bold text-slate-300">
                              {p.sku}
                            </span>
                            <div>
                              <div className="text-sm font-bold text-white">{p.name}</div>
                              <div className="text-xs text-slate-400">
                                {p.quantity} {p.unit} · {(p.weightKg / 1000).toFixed(1)} טון
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <span
                              className={cn(
                                "rounded-full px-2.5 py-0.5 text-xs font-bold ring-1",
                                p.stockStatus === "תקין"
                                  ? "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20"
                                  : p.stockStatus === "עומס הזמנות"
                                    ? "bg-amber-500/10 text-amber-400 ring-amber-500/20"
                                    : "bg-red-500/10 text-red-400 ring-red-500/20",
                              )}
                            >
                              {p.stockStatus}
                            </span>
                            <div className="w-24 text-left">
                              <div className="text-sm font-black tabular-nums text-white">
                                {p.palletsOrBags}
                              </div>
                              <div className="text-[10px] text-slate-400">משטחים/שקים</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right: Hourly throughput & Nearest Order Distance */}
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg">
                      <h4 className="text-sm font-black text-white mb-3">תפוקת הפצה לאורך היום</h4>
                      <div className="space-y-2">
                        {analytics.hourlyThroughput.slice(0, 5).map((h) => (
                          <div key={h.hour} className="space-y-1">
                            <div className="flex justify-between text-xs text-slate-300 font-semibold">
                              <span>סבב {h.hour}</span>
                              <span>
                                {h.pallets} משטחים ({h.weightTons} טון)
                              </span>
                            </div>
                            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500"
                                style={{ width: `${Math.min(100, (h.pallets / 50) * 100)}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg">
                      <div className="flex items-center gap-2 text-blue-400 mb-2">
                        <Clock className="size-4" />
                        <h4 className="text-sm font-black text-white">סטטוס סף הזמנה קרובה</h4>
                      </div>
                      <div className="text-2xl font-black text-white tabular-nums">
                        {nearestOrderMinutesRemaining !== null && nearestOrderMinutesRemaining < 900
                          ? `עוד ${nearestOrderMinutesRemaining} דקות`
                          : "אין הזמנות קרובות בטווח מיידי"}
                      </div>
                      <p className="mt-1 text-xs text-slate-400">
                        סף שומר מסך מוגדר: {screensaverSettings.minOrderGapMinutes} דקות
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "INVENTORY_ALERT" && (
              <motion.div
                key="inventory-alert-view"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.35 }}
                className="h-full flex-1"
              >
                <InventoryAlertSlide orders={published} onRefresh={syncNow} />
              </motion.div>
            )}

            {activeTab === "STOCK_ALERT" && (
              <motion.div
                key="stock-alert-view"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.35 }}
                className="h-full flex flex-col gap-5 max-w-7xl mx-auto"
              >
                {/* Switcher tabs among high-demand products */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1.5 rounded-lg bg-amber-500/20 px-3 py-1.5 text-xs font-black text-amber-300 ring-1 ring-amber-500/40 animate-pulse">
                      <Sparkles className="size-4" />
                      <span>שקופית ניטור מלאי יומי חי</span>
                    </span>
                    <span className="text-sm font-bold text-slate-300">
                      מוצרים עם צריכת יציאה גבוהה מהמגרשים היום
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {inventoryInsights.map((ins, idx) => (
                      <button
                        key={ins.sku}
                        onClick={() => setActiveStockIndex(idx)}
                        className={cn(
                          "flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-bold transition ring-1",
                          activeStockIndex === idx
                            ? "bg-amber-600 text-white ring-amber-400 shadow-md shadow-amber-600/30"
                            : "bg-slate-900 text-slate-400 ring-slate-800 hover:text-white",
                        )}
                      >
                        <Package className="size-3.5" />
                        <span>{ins.productName.split("—")[0]}</span>
                        <span className="rounded-md bg-black/40 px-1.5 py-0.5 text-[10px] tabular-nums font-mono">
                          {ins.todayDispensedQty} {ins.unit}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Hero Inventory Slide */}
                {(() => {
                  const currentInsight =
                    inventoryInsights[activeStockIndex] || inventoryInsights[0];
                  if (!currentInsight) return null;

                  return (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch flex-1 min-h-[500px]">
                      {/* Left Column: High-resolution product image with smooth zoom-in */}
                      <div className="lg:col-span-5 relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl group flex flex-col justify-end">
                        <motion.img
                          key={currentInsight.sku}
                          src={currentInsight.imageUrl}
                          alt={currentInsight.productName}
                          initial={{ scale: 1.08, opacity: 0.8 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ duration: 1.4, ease: "easeOut" }}
                          className="absolute inset-0 h-full w-full object-cover transition-transform duration-1000 group-hover:scale-105"
                        />
                        {/* Gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

                        {/* Top floating badge */}
                        <div className="absolute top-5 right-5 z-10">
                          <span className="flex items-center gap-2 rounded-2xl bg-amber-500/90 px-4 py-2 text-sm font-black text-slate-950 shadow-xl backdrop-blur-md">
                            <TrendingUp className="size-4" />
                            <span>
                              יצאו היום: {currentInsight.todayDispensedQty} {currentInsight.unit}
                            </span>
                          </span>
                        </div>

                        {/* Bottom image details */}
                        <div className="relative z-10 p-6 space-y-2">
                          <span className="inline-block rounded-lg bg-black/60 px-3 py-1 font-mono text-xs font-bold text-amber-300 backdrop-blur-md border border-amber-400/30">
                            מק"ט {currentInsight.sku}
                          </span>
                          <h3 className="text-2xl font-black text-white drop-shadow-md">
                            {currentInsight.productName}
                          </h3>
                        </div>
                      </div>

                      {/* Right Column: Alert details and smart reorder recommendation */}
                      <div className="lg:col-span-7 flex flex-col justify-between rounded-3xl border border-slate-800/80 bg-slate-900/80 p-8 shadow-2xl backdrop-blur-md">
                        <div className="space-y-6">
                          {/* Header */}
                          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                            <div className="flex items-center gap-3 text-amber-400">
                              <div className="grid size-12 place-items-center rounded-2xl bg-amber-500/20 ring-1 ring-amber-500/30">
                                <AlertTriangle className="size-6 text-amber-400 animate-bounce" />
                              </div>
                              <div>
                                <h2 className="text-2xl font-black tracking-tight text-white">
                                  ⚠️ התראת מלאי יומי — {currentInsight.warehouseName}
                                </h2>
                                <p className="text-xs text-slate-400">
                                  חישוב ביקושים אוטומטי מבוסס תנועות אמת מהחצר
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {currentInsight.alertLevel === "HIGH" && (
                                <LowStockBadge urgency="critical" size="sm" className="shadow-md" />
                              )}
                              <span
                                className={cn(
                                  "rounded-full px-4 py-1 text-xs font-black ring-1",
                                  currentInsight.alertLevel === "HIGH"
                                    ? "bg-red-500/20 text-red-400 ring-red-500/40 animate-pulse"
                                    : "bg-amber-500/20 text-amber-300 ring-amber-500/40",
                                )}
                              >
                                {currentInsight.alertLevel === "HIGH"
                                  ? "דרישת רכש דחופה"
                                  : "ניטור פעיל"}
                              </span>
                            </div>
                          </div>

                          {/* SKU & Official Product Name */}
                          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                            <div className="text-xs font-semibold text-slate-400">
                              זיהוי מק״ט ומוצר רשמי:
                            </div>
                            <div className="text-lg font-black text-white mt-1">
                              מק"ט: {currentInsight.sku} | {currentInsight.productName}
                            </div>
                          </div>

                          {/* Total Dispensed Today Counter */}
                          <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-5 flex items-center justify-between">
                            <div>
                              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                סך הכל יצא מהמגרש היום:
                              </div>
                              <div className="text-5xl font-black text-white tabular-nums tracking-tight mt-1 flex items-baseline gap-3">
                                <span>{currentInsight.todayDispensedQty}</span>
                                <span className="text-xl font-bold text-amber-400">
                                  {currentInsight.unit}
                                </span>
                              </div>
                            </div>
                            <div className="text-left text-xs text-slate-400 max-w-[200px]">
                              נמסר או נמצא כעת בהעמסה על גבי משאיות חלוקה פעילות
                            </div>
                          </div>

                          {/* Smart Reorder Recommendation Box (Green Background) */}
                          <div className="rounded-2xl border border-emerald-500/40 bg-emerald-950/40 p-5 shadow-lg shadow-emerald-950/30">
                            <div className="flex items-center gap-2 text-emerald-400 text-xs font-black mb-2">
                              <Sparkles className="size-4" />
                              <span>המלצת רכש חכמה (Noa Burn-Rate AI):</span>
                            </div>
                            <div className="text-2xl font-black text-emerald-300">
                              להזמין {currentInsight.recommendedUnitsText}
                            </div>
                            <p className="mt-2 text-xs text-emerald-200/90 leading-relaxed">
                              {currentInsight.explanation}
                            </p>
                          </div>
                        </div>

                        {/* Footer Notice */}
                        <div className="mt-6 flex items-center justify-between rounded-2xl border border-slate-800 bg-blue-950/30 p-4">
                          <div className="flex items-center gap-3">
                            <div className="grid size-10 place-items-center rounded-xl bg-blue-600/30 text-blue-300 ring-1 ring-blue-500/30">
                              <Share2 className="size-5" />
                            </div>
                            <div>
                              <div className="text-sm font-bold text-white">
                                אורן, שלח דרישה בלחיצת כפתור לנתנאל דרך מסוף הליקוט במובייל 📲
                              </div>
                              <div className="text-xs text-slate-400">
                                שליחה ישירה לווצאפ עם פירוט משטחים ובלות ללא צורך בהקלדה ידנית
                              </div>
                            </div>
                          </div>

                          <span className="text-xs font-mono font-bold text-blue-400 bg-blue-900/40 px-3 py-1.5 rounded-lg border border-blue-800">
                            מחסן 4 החרש
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </motion.div>
            )}

            {activeTab === "drive_media" && (
              <motion.div
                key="drive-media-view"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.35 }}
                className="h-full flex-1"
              >
                <DriveMediaPlayer onActivity={() => {}} isScreensaverActive={isScreensaverActive} />
              </motion.div>
            )}

            {activeTab === "traffic" && (
              <motion.div
                key="traffic-view"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* Traffic summary banner */}
                <div className="flex items-center justify-between rounded-2xl border border-slate-800 bg-blue-950/40 p-4 shadow-lg">
                  <div className="flex items-center gap-3">
                    <Navigation className="size-6 text-blue-400" />
                    <div>
                      <h3 className="text-base font-black text-white">
                        מצב צירי תחבורה ארציים — רמלה, ירושלים, גוש דן
                      </h3>
                      <p className="text-xs text-slate-300">
                        עדכון תנועה חי למשאיות ח. סבן על פי דיווחי שטח
                      </p>
                    </div>
                  </div>
                  <div className="text-xs font-semibold text-slate-300 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-700">
                    המלצת מוקד: {targetedBriefings.trafficAdvice}
                  </div>
                </div>

                {/* Israeli Arterial Roads Radar Cards */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {ARTERIAL_ROUTES.map((route) => (
                    <div
                      key={route.id}
                      className={cn(
                        "rounded-2xl border p-4 shadow-md transition",
                        route.status === "heavy"
                          ? "border-red-500/40 bg-red-950/20"
                          : route.status === "moderate"
                            ? "border-amber-500/40 bg-amber-950/20"
                            : "border-slate-800 bg-slate-900/60",
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-black text-white">{route.road}</span>
                        <span
                          className={cn(
                            "rounded-full px-2.5 py-0.5 text-xs font-bold ring-1",
                            route.status === "heavy"
                              ? "bg-red-500/20 text-red-400 ring-red-500/30"
                              : route.status === "moderate"
                                ? "bg-amber-500/20 text-amber-400 ring-amber-500/30"
                                : "bg-emerald-500/20 text-emerald-400 ring-emerald-500/30",
                          )}
                        >
                          {route.statusText}
                        </span>
                      </div>

                      <div className="mt-2 text-xs font-medium text-slate-300">{route.segment}</div>

                      <div className="mt-3 flex items-center justify-between border-t border-slate-800/80 pt-2 text-xs">
                        <span className="text-slate-400">עיכוב משוער:</span>
                        <span className="font-bold text-white tabular-nums">
                          {route.delayMinutes > 0 ? `+${route.delayMinutes} דק'` : "ללא עיכוב"}
                        </span>
                        <span className="text-slate-400">מהירות ממוצעת:</span>
                        <span className="font-bold text-white tabular-nums">
                          {route.avgSpeedKmh} קמ״ש
                        </span>
                      </div>

                      {route.alert && (
                        <div className="mt-2 rounded-lg bg-amber-500/10 p-2 text-[11px] font-semibold text-amber-300">
                          {route.alert}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Driver ETAs on the road */}
                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg">
                  <h4 className="text-base font-black text-white mb-3">
                    צפי הגעה חי (ETA) למשאיות בחלוקה
                  </h4>
                  {driverETAs.length === 0 ? (
                    <div className="py-6 text-center text-sm text-slate-400">
                      אין כרגע משאיות בדרך. כל המשאיות נמצאות בהעמסה במחסנים.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      {driverETAs.map((eta) => (
                        <div
                          key={eta.orderId}
                          className="flex items-center justify-between rounded-xl border border-slate-800/80 bg-slate-950/50 p-3.5"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-black text-white">{eta.driverName}</span>
                              <span className="text-xs text-slate-400">({eta.vehicle})</span>
                            </div>
                            <div className="text-xs text-slate-300">
                              יעד: {eta.destination}, {eta.city}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {eta.itemsSummary} · דרך {eta.routeRoad}
                            </div>
                          </div>

                          <div className="text-left">
                            <div className="text-xl font-black text-emerald-400 tabular-nums">
                              {eta.etaTime}
                            </div>
                            <div className="text-xs font-semibold text-slate-400">
                              בעוד {eta.remainingMinutes} דקות
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === "video" && (
              <motion.div
                key="video-view"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.3 }}
                className="relative h-full flex flex-col gap-4 min-h-[500px]"
              >
                {/* Video controls header */}
                <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/80 p-3">
                  <div className="flex items-center gap-3">
                    <Film className="size-5 text-blue-400" />
                    <div>
                      <h4 className="text-sm font-black text-white">
                        וידאו לוגיסטיקה ואווירה בזמן הפוגה
                      </h4>
                      <p className="text-xs text-slate-400">
                        משודר אוטומטית כשיש הפוגה ואין התראות דחופות
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 rounded-lg bg-slate-800 p-1">
                      {VIDEO_THEMES.map((theme, i) => (
                        <button
                          key={theme.id}
                          onClick={() => setSelectedVideoTheme(i)}
                          className={cn(
                            "rounded-md px-3 py-1 text-xs font-bold transition",
                            selectedVideoTheme === i
                              ? "bg-blue-600 text-white"
                              : "text-slate-400 hover:text-white",
                          )}
                        >
                          {theme.title}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() =>
                        updateScreensaverSettings({ videoMuted: !screensaverSettings.videoMuted })
                      }
                      className="grid size-9 place-items-center rounded-lg bg-slate-800 text-slate-300 hover:text-white"
                      title={screensaverSettings.videoMuted ? "בטל השתקה" : "השתק"}
                    >
                      {screensaverSettings.videoMuted ? (
                        <VolumeX className="size-4" />
                      ) : (
                        <Volume2 className="size-4" />
                      )}
                    </button>

                    <button
                      onClick={() => setIsVideoPlaying((p) => !p)}
                      className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-500"
                    >
                      <Play className="size-3.5 fill-white" />
                      <span>{isVideoPlaying ? "השהה" : "הפעל"}</span>
                    </button>
                  </div>
                </div>

                {/* Video Player Box with Ambient Overlay */}
                <div className="relative flex-1 overflow-hidden rounded-2xl border border-slate-800 bg-black min-h-[420px]">
                  <video
                    ref={videoRef}
                    key={VIDEO_THEMES[selectedVideoTheme]?.url}
                    src={VIDEO_THEMES[selectedVideoTheme]?.url}
                    autoPlay
                    loop
                    muted={screensaverSettings.videoMuted}
                    playsInline
                    className="absolute inset-0 h-full w-full object-cover opacity-85"
                  />

                  {/* Fallback & Ambient Overlay Telemetry */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40 pointer-events-none p-6 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <div className="rounded-xl bg-black/60 px-4 py-2 backdrop-blur-md border border-white/10">
                        <div className="text-xs text-slate-400">ערוץ וידאו חי</div>
                        <div className="text-base font-black text-white">
                          {VIDEO_THEMES[selectedVideoTheme]?.title}
                        </div>
                      </div>

                      <div className="rounded-xl bg-black/60 px-4 py-2 backdrop-blur-md border border-white/10 text-left">
                        <div className="text-xs text-slate-400">זמן נוכחי</div>
                        <div className="text-lg font-black text-white tabular-nums">
                          {currentTime}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-end justify-between">
                      <div className="rounded-xl bg-black/60 p-3.5 backdrop-blur-md border border-white/10 max-w-md">
                        <div className="flex items-center gap-2 text-amber-400 text-xs font-bold mb-1">
                          <Bot className="size-4" />
                          <span>נועה AI — דגש תפעולי</span>
                        </div>
                        <p className="text-xs text-slate-200">
                          {targetedBriefings.forWarehouse ||
                            "עבודה בטוחה עם מנופים והקפדה על קשירת משטחים"}
                        </p>
                      </div>

                      <div className="rounded-xl bg-black/60 px-4 py-2 backdrop-blur-md border border-white/10 text-right">
                        <div className="text-xs text-slate-400">הזמנות סופקו היום</div>
                        <div className="text-xl font-black text-emerald-400">
                          {published.filter((o) => o.status === "סופק").length} / {published.length}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* BOTTOM STATUS FOOTER */}
        <footer className="relative z-10 flex items-center justify-between border-t border-slate-800 bg-slate-950/80 px-6 py-2.5 text-xs text-slate-400">
          <div className="flex items-center gap-4">
            <span>לחיצה על המקלדת או הזזת העכבר תחזיר ללוח ההפצה</span>
            <span className="text-slate-600">|</span>
            <span>Esc לסגירה מיידית</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>שומר מסך פעיל</span>
            </span>
          </div>
        </footer>
      </motion.div>
    </AnimatePresence>
  );
}
