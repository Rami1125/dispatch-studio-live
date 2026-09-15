import { useState, useId, useMemo } from "react";
import {
  Compass,
  ExternalLink,
  Layers,
  MapPin,
  Maximize2,
  Minimize2,
  Navigation,
  RefreshCw,
} from "lucide-react";
import type { LocationPreset } from "@/types/traffic";
import {
  LOCATION_PRESETS,
  buildWazeEmbedUrl,
  buildWazeNavigationUrl,
} from "@/services/trafficService";
import { cn } from "@/lib/utils";

interface WazeMapEmbedProps {
  selectedPreset?: LocationPreset;
  onSelectPreset?: (preset: LocationPreset) => void;
  customPresets?: LocationPreset[];
  className?: string;
  heightClass?: string;
}

export function WazeMapEmbed({
  selectedPreset: externalPreset,
  onSelectPreset,
  customPresets,
  className,
  heightClass = "h-[440px] md:h-[500px]",
}: WazeMapEmbedProps) {
  const allPresets = useMemo(() => {
    if (!customPresets || customPresets.length === 0) return LOCATION_PRESETS;
    return [...LOCATION_PRESETS, ...customPresets];
  }, [customPresets]);

  const [internalPreset, setInternalPreset] = useState<LocationPreset>(LOCATION_PRESETS[0]!);
  const [isLoading, setIsLoading] = useState(true);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const activePreset = externalPreset || internalPreset;

  const handlePresetClick = (preset: LocationPreset) => {
    setIsLoading(true);
    if (onSelectPreset) {
      onSelectPreset(preset);
    } else {
      setInternalPreset(preset);
    }
  };

  const handleRefresh = () => {
    setIsLoading(true);
    setRefreshKey((prev) => prev + 1);
  };

  const embedUrl = buildWazeEmbedUrl(activePreset);
  const mobileWazeUrl = buildWazeNavigationUrl(activePreset.lat, activePreset.lon);

  return (
    <div
      dir="rtl"
      id="waze-live-map-container"
      className={cn(
        "flex flex-col rounded-2xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden transition-all duration-300",
        isFullScreen ? "fixed inset-3 z-50 h-[calc(100vh-24px)]" : className,
      )}
    >
      {/* Top Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 px-4 py-3 bg-slate-950/80 border-b border-slate-800 backdrop-blur-sm">
        {/* Presets List */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none max-w-full">
          <span className="text-xs font-black text-slate-400 flex items-center gap-1 shrink-0 ml-1">
            <Layers className="size-3.5 text-sky-400" />
            <span>מוקדי תנועה:</span>
          </span>
          {allPresets.map((preset) => {
            const isSelected = preset.id === activePreset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handlePresetClick(preset)}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 border",
                  isSelected
                    ? "bg-sky-500/25 text-sky-200 border-sky-400/60 shadow-sm"
                    : "bg-slate-900 text-slate-400 hover:text-slate-200 border-slate-800 hover:bg-slate-850",
                )}
              >
                <span>{preset.icon}</span>
                <span>{preset.shortLabel}</span>
              </button>
            );
          })}
        </div>

        {/* Action Buttons: Mobile Waze & Refresh & Fullscreen */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Direct Mobile Waze Navigation Deep Link */}
          <a
            href={mobileWazeUrl}
            target="_blank"
            rel="noopener noreferrer"
            title={`פתח ניווט Waze חי ל-${activePreset.label}`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white text-xs font-black shadow-md hover:shadow-sky-500/25 transition-all border border-sky-400/30"
          >
            <Compass className="size-3.5 animate-spin-slow" />
            <span>פתח Waze בנייד</span>
            <ExternalLink className="size-3 opacity-75" />
          </a>

          {/* Refresh Map Button */}
          <button
            type="button"
            onClick={handleRefresh}
            title="רענן תמונת מצב מפת פקקים"
            className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition"
          >
            <RefreshCw className={cn("size-4", isLoading && "animate-spin text-sky-400")} />
          </button>

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={() => setIsFullScreen(!isFullScreen)}
            title={isFullScreen ? "צא ממסך מלא" : "הצג מפה במסך מלא"}
            className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition"
          >
            {isFullScreen ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
          </button>
        </div>
      </div>

      {/* Preset Details Sub-banner */}
      <div className="flex items-center justify-between px-4 py-1.5 bg-slate-950/40 border-b border-slate-800/60 text-[11px] text-slate-400">
        <div className="flex items-center gap-1.5 truncate">
          <MapPin className="size-3 text-rose-400 shrink-0" />
          <span className="font-bold text-slate-300">{activePreset.label}:</span>
          <span className="truncate">{activePreset.description}</span>
        </div>
        <div
          className="flex items-center gap-2 shrink-0 font-mono text-[10px] text-slate-500"
          dir="ltr"
        >
          <span>LAT: {activePreset.lat.toFixed(4)}</span>
          <span>LON: {activePreset.lon.toFixed(4)}</span>
        </div>
      </div>

      {/* Map Frame Viewport */}
      <div className={cn("relative w-full bg-slate-950", isFullScreen ? "flex-1" : heightClass)}>
        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-950/80 backdrop-blur-xs z-10 text-slate-400">
            <RefreshCw className="size-6 text-sky-400 animate-spin" />
            <span className="text-xs font-bold">טוען נתוני עומסי תנועה מ-Waze Live Map...</span>
          </div>
        )}

        {/* Live Waze Embed iframe */}
        <iframe
          key={`${activePreset.id}-${refreshKey}`}
          id="waze-iframe"
          title={`מפת עומסי תנועה Waze - ${activePreset.label}`}
          src={embedUrl}
          className="w-full h-full border-0"
          loading="lazy"
          allowFullScreen
          onLoad={() => setIsLoading(false)}
        />
      </div>

      {/* Bottom Live Footer & Legend */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2 bg-slate-950 border-t border-slate-800 text-xs">
        <div className="flex items-center gap-3 text-slate-400">
          <span className="font-bold text-slate-300 flex items-center gap-1">
            <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>מקרא עומסים:</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="size-2 rounded-full bg-emerald-500" /> זורם (60+ קמ״ש)
          </span>
          <span className="flex items-center gap-1">
            <span className="size-2 rounded-full bg-amber-500" /> עמוס (30-50 קמ״ש)
          </span>
          <span className="flex items-center gap-1">
            <span className="size-2 rounded-full bg-rose-500" /> פקק כבד (&lt;20 קמ״ש)
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
          <span>מתעדכן ברציפות מלווייני Waze GPS</span>
          <span>•</span>
          <span className="font-mono text-sky-400">SabanOS Telematics</span>
        </div>
      </div>
    </div>
  );
}
