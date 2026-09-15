import { useState } from "react";
import {
  AlertTriangle,
  Clock,
  ExternalLink,
  MapPin,
  Navigation,
  Plus,
  Radio,
  ShieldAlert,
  Trash2,
  X,
} from "lucide-react";
import type { WarehouseAlertPin, LocationPreset } from "@/types/traffic";
import { ALERT_PIN_CATEGORIES } from "@/services/alertPinService";
import { buildWazeNavigationUrl } from "@/services/trafficService";
import { cn } from "@/lib/utils";

interface AlertPinsManagerProps {
  pins: WarehouseAlertPin[];
  onAddPinClick: () => void;
  onRemovePin: (id: string) => void;
  onFocusPin: (pin: WarehouseAlertPin) => void;
  activePinId?: string;
  canManage?: boolean;
}

export function AlertPinsManager({
  pins,
  onAddPinClick,
  onRemovePin,
  onFocusPin,
  activePinId,
  canManage = true,
}: AlertPinsManagerProps) {
  const [filterCategory, setFilterCategory] = useState<string>("all");

  const filteredPins = pins.filter((p) => {
    if (filterCategory === "all") return true;
    return p.category === filterCategory;
  });

  return (
    <div
      dir="rtl"
      className="flex flex-col bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg"
    >
      {/* Header bar */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30">
            <ShieldAlert className="size-4" />
          </div>
          <div>
            <h4 className="text-sm font-black text-white flex items-center gap-2">
              <span>סיכות התראה וצווארי בקבוק במחסנים</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                {pins.length} פעילות
              </span>
            </h4>
            <p className="text-[11px] text-slate-400">
              דיווחים מבצעיים על חסימות, עומסי פריקה ותנועה ברדיוס מחסן 4 והתלמיד
            </p>
          </div>
        </div>

        {canManage && (
          <button
            type="button"
            onClick={onAddPinClick}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold text-xs shadow-md shadow-rose-500/20 transition shrink-0"
          >
            <Plus className="size-3.5" />
            <span>הוסף סיכת התראה</span>
          </button>
        )}
      </div>

      {/* Categories quick filter */}
      {pins.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none text-[11px] mb-2">
          <button
            type="button"
            onClick={() => setFilterCategory("all")}
            className={cn(
              "px-2.5 py-1 rounded-lg font-bold transition shrink-0 border",
              filterCategory === "all"
                ? "bg-slate-700 text-white border-slate-600"
                : "bg-slate-950 text-slate-400 hover:text-slate-200 border-slate-800",
            )}
          >
            הכל ({pins.length})
          </button>
          {ALERT_PIN_CATEGORIES.map((cat) => {
            const count = pins.filter((p) => p.category === cat.category).length;
            if (count === 0) return null;
            return (
              <button
                key={cat.category}
                type="button"
                onClick={() => setFilterCategory(cat.category)}
                className={cn(
                  "flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition shrink-0 border",
                  filterCategory === cat.category
                    ? `${cat.badgeBg} ${cat.badgeText} ${cat.badgeBorder}`
                    : "bg-slate-950 text-slate-400 hover:text-slate-200 border-slate-800",
                )}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
                <span className="opacity-75">({count})</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Pins List */}
      {filteredPins.length === 0 ? (
        <div className="text-center py-6 border border-dashed border-slate-800 rounded-xl bg-slate-950/40">
          <p className="text-xs text-slate-400">אין כרגע סיכות התראה פעילות בסביבת המחסנים.</p>
          {canManage && (
            <button
              type="button"
              onClick={onAddPinClick}
              className="mt-2 text-xs text-sky-400 hover:underline font-bold"
            >
              + לחץ כאן לנעיצת סיכת התראה ראשונה
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {filteredPins.map((pin) => {
            const cat = ALERT_PIN_CATEGORIES.find((c) => c.category === pin.category);
            const isSelected = activePinId === pin.id;
            const wazeNavUrl = buildWazeNavigationUrl(pin.lat, pin.lon);

            return (
              <div
                key={pin.id}
                className={cn(
                  "flex flex-col justify-between p-3 rounded-xl border transition-all relative overflow-hidden",
                  isSelected
                    ? "bg-slate-800/90 border-sky-400 ring-1 ring-sky-400 shadow-md"
                    : "bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-950",
                )}
              >
                {/* Top Pin line */}
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl shrink-0">{cat?.icon || "⚠️"}</span>
                      <div>
                        <h5 className="text-xs font-black text-white leading-tight">{pin.title}</h5>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5">
                          <MapPin className="size-3 text-rose-400 shrink-0" />
                          <span className="font-semibold text-slate-300">{pin.locationName}</span>
                        </div>
                      </div>
                    </div>

                    <span
                      className={cn(
                        "text-[10px] font-black px-2 py-0.5 rounded-full border shrink-0",
                        cat?.badgeBg,
                        cat?.badgeBorder,
                        cat?.badgeText,
                      )}
                    >
                      {cat?.label || pin.categoryLabel}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-300 mt-2 leading-relaxed bg-slate-900/60 p-2 rounded-lg border border-slate-800/80">
                    {pin.description}
                  </p>

                  {pin.affectedRoutes && (
                    <div className="text-[10px] text-amber-300/90 mt-1.5 flex items-center gap-1">
                      <span className="font-bold">השפעה:</span>
                      <span>{pin.affectedRoutes}</span>
                    </div>
                  )}
                </div>

                {/* Footer metadata & buttons */}
                <div className="flex items-center justify-between gap-2 pt-2.5 mt-2.5 border-t border-slate-800/80 text-[10px] text-slate-500">
                  <div className="flex items-center gap-1.5 truncate">
                    <span>{pin.createdBy}</span>
                    <span>•</span>
                    <span>
                      {new Date(pin.createdAt).toLocaleTimeString("he-IL", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Focus on map button */}
                    <button
                      type="button"
                      onClick={() => onFocusPin(pin)}
                      title="מרכז מפה על סיכה זו"
                      className="px-2 py-1 rounded-lg bg-sky-500/20 text-sky-300 hover:bg-sky-500/30 border border-sky-500/40 font-bold transition flex items-center gap-1"
                    >
                      <MapPin className="size-3" />
                      <span>הצג במפה</span>
                    </button>

                    {/* Waze nav link */}
                    <a
                      href={wazeNavUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="פתח Waze למקום זה"
                      className="p-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white transition"
                    >
                      <ExternalLink className="size-3" />
                    </a>

                    {/* Delete Pin (Admin only) */}
                    {canManage && (
                      <button
                        type="button"
                        onClick={() => onRemovePin(pin.id)}
                        title="הסר סיכת התראה זו"
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                      >
                        <Trash2 className="size-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
