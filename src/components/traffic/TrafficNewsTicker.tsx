import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Navigation,
  Pause,
  Play,
  Radio,
  Truck,
} from "lucide-react";
import type { TrafficAlert, TrafficSeverity } from "@/types/traffic";
import { INITIAL_TRAFFIC_ALERTS } from "@/services/trafficService";
import { cn } from "@/lib/utils";

interface TrafficNewsTickerProps {
  alerts?: TrafficAlert[];
  onSelectAlert?: (alert: TrafficAlert) => void;
  className?: string;
}

const SEVERITY_CONFIG: Record<
  TrafficSeverity,
  {
    badgeClass: string;
    borderClass: string;
    glowClass: string;
    icon: string;
    label: string;
    dotClass: string;
  }
> = {
  heavy: {
    badgeClass: "bg-rose-500/20 text-rose-300 border-rose-500/40",
    borderClass: "border-rose-500/40",
    glowClass: "shadow-[0_0_15px_rgba(244,63,94,0.15)]",
    icon: "🔴",
    label: "פקק כבד",
    dotClass: "bg-rose-500",
  },
  moderate: {
    badgeClass: "bg-amber-500/20 text-amber-300 border-amber-500/40",
    borderClass: "border-amber-500/40",
    glowClass: "shadow-[0_0_15px_rgba(245,158,11,0.15)]",
    icon: "🟡",
    label: "עומס תנועה",
    dotClass: "bg-amber-500",
  },
  incident: {
    badgeClass: "bg-purple-500/20 text-purple-300 border-purple-500/40",
    borderClass: "border-purple-500/40",
    glowClass: "shadow-[0_0_15px_rgba(168,85,247,0.15)]",
    icon: "🟣",
    label: "שיבוש / עבודות",
    dotClass: "bg-purple-500",
  },
  fluid: {
    badgeClass: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
    borderClass: "border-emerald-500/40",
    glowClass: "shadow-[0_0_15px_rgba(16,185,129,0.15)]",
    icon: "🟢",
    label: "תנועה זורמת",
    dotClass: "bg-emerald-500",
  },
};

export function TrafficNewsTicker({
  alerts = INITIAL_TRAFFIC_ALERTS,
  onSelectAlert,
  className,
}: TrafficNewsTickerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const currentAlert = alerts[currentIndex] || alerts[0];

  const nextAlert = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % alerts.length);
  }, [alerts.length]);

  const prevAlert = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + alerts.length) % alerts.length);
  }, [alerts.length]);

  // Auto-rotate every 6 seconds (if not paused or hovered)
  useEffect(() => {
    if (isPaused || isHovered || alerts.length <= 1) return;
    const timer = setInterval(() => {
      nextAlert();
    }, 6000);
    return () => clearInterval(timer);
  }, [isPaused, isHovered, alerts.length, nextAlert]);

  if (!currentAlert) return null;

  const severityStyle = SEVERITY_CONFIG[currentAlert.severity] || SEVERITY_CONFIG.moderate;

  return (
    <div
      dir="rtl"
      id="traffic-news-ticker"
      className={cn(
        "relative flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 px-4 py-2.5 rounded-2xl bg-slate-900/95 border transition-all duration-300 backdrop-blur-md select-none",
        severityStyle.borderClass,
        severityStyle.glowClass,
        className,
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={() => setIsHovered(true)}
      onTouchEnd={() => setIsHovered(false)}
    >
      {/* Right side: Pulse indicator + Title */}
      <div className="flex items-center gap-2.5 shrink-0">
        <div className="relative flex items-center justify-center size-8 rounded-xl bg-slate-800 border border-slate-700 text-sky-400">
          <Radio className="size-4 animate-pulse" />
          <span
            className={cn(
              "absolute -top-0.5 -right-0.5 size-2.5 rounded-full ring-2 ring-slate-900 animate-ping",
              severityStyle.dotClass,
            )}
          />
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-black tracking-wide text-white flex items-center gap-1.5">
            <span>מבזק תנועה חי</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-300 font-mono">
              WAZE
            </span>
          </span>
          <span className="text-[10px] text-slate-400 font-medium">סביבת הסניפים והצירים</span>
        </div>
      </div>

      {/* Center: Animated Alert Content */}
      <div className="flex-1 overflow-hidden min-h-[42px] flex items-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentAlert.id}
            initial={{ opacity: 0, y: 10, filter: "blur(2px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -10, filter: "blur(2px)" }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="flex flex-wrap items-center gap-2 md:gap-3 text-xs w-full"
            onClick={() => onSelectAlert?.(currentAlert)}
          >
            {/* Timestamp & TimeAgo */}
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-950/80 border border-slate-800 text-slate-300">
              <Clock className="size-3 text-slate-400" />
              <span className="font-mono font-bold" dir="ltr">
                {currentAlert.timestamp}
              </span>
              <span className="text-[10px] text-slate-500">({currentAlert.timeAgo})</span>
            </div>

            {/* Severity Pill */}
            <span
              className={cn(
                "inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-black border text-[11px]",
                severityStyle.badgeClass,
              )}
            >
              <span>{severityStyle.icon}</span>
              <span>{severityStyle.label}</span>
            </span>

            {/* Corridor Name */}
            <span className="font-black text-white flex items-center gap-1 bg-slate-800/80 px-2 py-1 rounded-lg border border-slate-700/60">
              <Navigation className="size-3 text-sky-400" />
              <span>{currentAlert.corridor}</span>
            </span>

            {/* Impact Details */}
            <span className="text-slate-200 font-medium line-clamp-1 flex-1">
              {currentAlert.details}
            </span>

            {/* Truck Impact Highlight */}
            {currentAlert.truckImpact && (
              <span className="hidden xl:inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] font-bold">
                <Truck className="size-3 text-amber-400" />
                <span>{currentAlert.truckImpact}</span>
              </span>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Left side: Controls & Counter */}
      <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
        {/* Pause Indicator on Hover */}
        {(isHovered || isPaused) && (
          <span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
            מושהה
          </span>
        )}

        {/* Counter: e.g. 1/4 */}
        <span
          className="text-xs font-mono font-bold text-slate-400 px-2 py-1 rounded-lg bg-slate-950 border border-slate-800"
          dir="ltr"
        >
          {currentIndex + 1}/{alerts.length}
        </span>

        {/* Prev / Next buttons */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={prevAlert}
            aria-label="מבזק קודם"
            className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
          >
            <ChevronRight className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setIsPaused(!isPaused)}
            aria-label={isPaused ? "המשך תחלופה" : "השהה תחלופה"}
            title={isPaused ? "המשך ניגון אוטומטי (כל 6 שנ')" : "השהה תחלופה"}
            className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
          >
            {isPaused ? <Play className="size-3.5" /> : <Pause className="size-3.5" />}
          </button>
          <button
            type="button"
            onClick={nextAlert}
            aria-label="מבזק הבא"
            className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
          >
            <ChevronLeft className="size-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
