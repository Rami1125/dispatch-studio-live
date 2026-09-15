import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Compass,
  ExternalLink,
  MapPin,
  Navigation,
  Phone,
  Truck,
} from "lucide-react";
import type { TruckRouteInfo, TrafficSeverity } from "@/types/traffic";
import { buildWazeSearchUrl } from "@/services/trafficService";
import { cn } from "@/lib/utils";

interface TruckTrafficCardProps {
  truck: TruckRouteInfo;
  onFocusOnMap?: (truck: TruckRouteInfo) => void;
  className?: string;
}

const SEVERITY_ACCENTS: Record<
  TrafficSeverity,
  {
    border: string;
    bg: string;
    badge: string;
    text: string;
    icon: string;
  }
> = {
  heavy: {
    border: "border-rose-500/40",
    bg: "bg-rose-500/10",
    badge: "bg-rose-500/20 text-rose-300 border-rose-500/30",
    text: "text-rose-400",
    icon: "🔴",
  },
  moderate: {
    border: "border-amber-500/40",
    bg: "bg-amber-500/10",
    badge: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    text: "text-amber-400",
    icon: "🟡",
  },
  incident: {
    border: "border-purple-500/40",
    bg: "bg-purple-500/10",
    badge: "bg-purple-500/20 text-purple-300 border-purple-500/30",
    text: "text-purple-400",
    icon: "🟣",
  },
  fluid: {
    border: "border-emerald-500/40",
    bg: "bg-emerald-500/10",
    badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    text: "text-emerald-400",
    icon: "🟢",
  },
};

export function TruckTrafficCard({ truck, onFocusOnMap, className }: TruckTrafficCardProps) {
  const accent = SEVERITY_ACCENTS[truck.severity] || SEVERITY_ACCENTS.moderate;
  const wazeNavUrl = buildWazeSearchUrl(truck.wazeDestinationQuery);

  return (
    <div
      dir="rtl"
      id={`truck-card-${truck.id}`}
      className={cn(
        "flex flex-col justify-between p-4 rounded-2xl bg-slate-900/90 border transition-all duration-200 shadow-md hover:shadow-lg relative overflow-hidden backdrop-blur-sm",
        accent.border,
        className,
      )}
    >
      {/* Top Header: Truck Plate & Driver Name */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex items-center justify-center size-11 rounded-xl text-white shadow-sm border",
                truck.truckType === "crane"
                  ? "bg-gradient-to-br from-amber-600 to-orange-700 border-amber-500/40"
                  : "bg-gradient-to-br from-sky-600 to-blue-700 border-sky-500/40",
              )}
            >
              <Truck className="size-6" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white">{truck.driverName}</h3>
                <span
                  className="px-2 py-0.5 rounded-md bg-yellow-400 text-slate-950 font-black text-xs tracking-wider border border-yellow-500 shadow-xs"
                  dir="ltr"
                >
                  {truck.truckPlate}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">{truck.truckModel}</p>
            </div>
          </div>

          {/* Status Badge */}
          <div className="flex flex-col items-end gap-1">
            <span
              className={cn(
                "inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black border",
                accent.badge,
              )}
            >
              <span>{accent.icon}</span>
              <span>
                {truck.status === "loading"
                  ? "בהעמסה במחסן"
                  : truck.delayMinutes > 10
                    ? "מעוכב בפקק"
                    : "בדרך ליעד"}
              </span>
            </span>
            <span className="text-[10px] text-slate-500" dir="ltr">
              GPS: {truck.lastGpsUpdate}
            </span>
          </div>
        </div>

        {/* Destination & Order info */}
        <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 mb-3 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 flex items-center gap-1 font-bold">
              <MapPin className="size-3.5 text-rose-400 shrink-0" />
              <span>יעד פריקה:</span>
            </span>
            {truck.currentOrderNumber && (
              <span className="font-mono font-bold text-sky-400 text-xs" dir="ltr">
                {truck.currentOrderNumber}
              </span>
            )}
          </div>

          <div className="text-sm font-black text-slate-100 pr-4">{truck.destination}</div>
          {truck.customerName && (
            <div className="text-xs text-slate-400 font-medium pr-4">{truck.customerName}</div>
          )}
          {truck.cargoSummary && (
            <div className="text-[11px] text-amber-300/90 font-medium pr-4 pt-1 border-t border-slate-850">
              📦 תכולה: {truck.cargoSummary}
            </div>
          )}
        </div>

        {/* DELTA CONGESTION COMPARISON: Clean time vs Actual Traffic Time */}
        <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 mb-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Clock className="size-3.5 text-sky-400" />
              <span>השוואת עומסי תנועה בציר:</span>
            </span>
            <span className="text-[11px] font-bold text-slate-400">{truck.primaryCorridor}</span>
          </div>

          {/* Visual Delta Display */}
          <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-slate-900 border border-slate-800">
            {/* Clean time */}
            <div className="flex flex-col items-center flex-1 text-center">
              <span className="text-[10px] text-slate-400 font-semibold">זמן חלק ללא פקקים</span>
              <span className="text-sm font-bold text-emerald-400 font-mono" dir="ltr">
                {truck.cleanTimeMinutes} דק׳
              </span>
            </div>

            <ArrowLeft className="size-4 text-slate-600 shrink-0" />

            {/* Actual time with congestion */}
            <div className="flex flex-col items-center flex-1 text-center">
              <span className="text-[10px] text-slate-400 font-semibold">זמן משוער בפועל</span>
              <span className={cn("text-base font-black font-mono", accent.text)} dir="ltr">
                {truck.actualTimeMinutes} דק׳
              </span>
            </div>

            <div className="h-7 w-px bg-slate-800" />

            {/* Congestion Delta */}
            <div className="flex flex-col items-center flex-1 text-center">
              <span className="text-[10px] text-slate-400 font-semibold">עיכוב עומסים</span>
              <span
                className={cn(
                  "text-xs font-black px-1.5 py-0.5 rounded font-mono",
                  truck.delayMinutes > 10
                    ? "bg-rose-500/20 text-rose-300"
                    : "bg-amber-500/20 text-amber-300",
                )}
                dir="ltr"
              >
                +{truck.delayMinutes} דק׳
              </span>
            </div>
          </div>

          {/* ETA Summary line */}
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/60 text-xs">
            <span className="text-slate-400">צפי הגעה משוער (ETA):</span>
            <div className="flex items-center gap-1.5 font-bold">
              <span className="text-sm font-black text-white font-mono" dir="ltr">
                {truck.etaTime}
              </span>
              <span className="text-[10px] text-slate-400">(משוער ל-Waze)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Action Buttons */}
      <div className="flex items-center gap-2 pt-1 border-t border-slate-800/80">
        {/* Direct Waze Link */}
        <a
          href={wazeNavUrl}
          target="_blank"
          rel="noopener noreferrer"
          title={`פתח מסלול נסיעה ב-Waze ליעד ${truck.driverName}`}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-black shadow-sm transition"
        >
          <Compass className="size-3.5" />
          <span>נווט Waze ליעד</span>
          <ExternalLink className="size-3 opacity-75" />
        </a>

        {/* Call Driver Button */}
        <a
          href={`tel:${truck.phone}`}
          title={`התקשר ל-${truck.driverName} (${truck.phone})`}
          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition"
        >
          <Phone className="size-3.5 text-emerald-400" />
          <span className="hidden sm:inline">חייג</span>
        </a>
      </div>
    </div>
  );
}
