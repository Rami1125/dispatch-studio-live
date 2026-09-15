import { useState } from "react";
import {
  AlertTriangle,
  Clock,
  Flame,
  Info,
  MapPin,
  Plus,
  ShieldAlert,
  Trash2,
  User,
  X,
} from "lucide-react";
import type { WarehouseAlertPin, AlertPinCategory, TrafficSeverity } from "@/types/traffic";
import { ALERT_PIN_CATEGORIES, WAREHOUSE_PERIPHERY_HOTSPOTS } from "@/services/alertPinService";
import { useAdminControl } from "@/context/AdminControlContext";

interface CreateAlertPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddPin: (pin: WarehouseAlertPin) => void;
  initialHotspotId?: string;
}

export function CreateAlertPinModal({
  isOpen,
  onClose,
  onAddPin,
  initialHotspotId,
}: CreateAlertPinModalProps) {
  const { currentUser } = useAdminControl();

  const [selectedHotspotId, setSelectedHotspotId] = useState<string>(
    initialHotspotId || WAREHOUSE_PERIPHERY_HOTSPOTS[0]!.id,
  );
  const [selectedCategory, setSelectedCategory] = useState<AlertPinCategory>("bottleneck");
  const [severity, setSeverity] = useState<TrafficSeverity>("heavy");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [durationHours, setDurationHours] = useState<number>(2); // auto expires in 2 hours
  const [customLocationName, setCustomLocationName] = useState("");
  const [isCustomLocation, setIsCustomLocation] = useState(false);
  const [customLat, setCustomLat] = useState<string>("32.1327");
  const [customLon, setCustomLon] = useState<string>("34.8982");

  if (!isOpen) return null;

  const currentHotspot = WAREHOUSE_PERIPHERY_HOTSPOTS.find((h) => h.id === selectedHotspotId);
  const currentCategoryConfig = ALERT_PIN_CATEGORIES.find((c) => c.category === selectedCategory);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const chosenTitle =
      title.trim() ||
      `${currentCategoryConfig?.label || "שיבוש תנועה"} - ${isCustomLocation ? customLocationName || "אזור המחסן" : currentHotspot?.name || "הוד השרון"}`;

    const latNum = isCustomLocation
      ? parseFloat(customLat) || 32.1327
      : currentHotspot?.lat || 32.1327;
    const lonNum = isCustomLocation
      ? parseFloat(customLon) || 34.8982
      : currentHotspot?.lon || 34.8982;

    const newPin: WarehouseAlertPin = {
      id: `pin-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title: chosenTitle,
      category: selectedCategory,
      categoryLabel: currentCategoryConfig?.label || "התראה",
      severity,
      lat: latNum,
      lon: lonNum,
      zoom: 16,
      locationName: isCustomLocation
        ? customLocationName.trim() || "מיקום מותאם אישית"
        : currentHotspot?.name || "סביבת מחסן 4",
      description:
        description.trim() || `עומס / חסימה זמנית בסביבת המחסן. נהגי מנוף וחלוקה נקראים לתשומת לב.`,
      createdBy: `${currentUser?.name || "מנהל תורן"} (${currentUser?.role === "ADMIN" ? "הנהלה" : "סדרן"})`,
      createdAt: Date.now(),
      expiresAt: durationHours > 0 ? Date.now() + durationHours * 3600 * 1000 : undefined,
      affectedRoutes: currentHotspot?.suggestedRoutes || "צירי תנועה מרכזיים",
      isWarehousePeriphery: true,
    };

    onAddPin(newPin);
    onClose();
    // Reset inputs
    setTitle("");
    setDescription("");
  };

  return (
    <div
      dir="rtl"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
              <ShieldAlert className="size-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <span>דיווח חסימה / נעיצת סיכת התראה</span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  ניהול סביבת מחסן
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                סיכה זו תסומן במפת ה-Waze החיה ותעדכן מיידית את מסכי ה-TV והסדרנים
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-sm">
          {/* Category Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              סוג האירוע / המפגע:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {ALERT_PIN_CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat.category;
                return (
                  <button
                    key={cat.category}
                    type="button"
                    onClick={() => {
                      setSelectedCategory(cat.category);
                      setSeverity(cat.defaultSeverity);
                    }}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-right transition ${
                      isSelected
                        ? "bg-sky-500/20 border-sky-400 text-white ring-1 ring-sky-400 shadow-md"
                        : "bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                    }`}
                  >
                    <span className="text-lg">{cat.icon}</span>
                    <span className="text-xs font-bold leading-tight">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Location Selection: Warehouse Periphery Hotspots vs Custom */}
          <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <MapPin className="size-3.5 text-rose-400" />
                <span>מוקד גיאוגרפי בסביבת המחסן:</span>
              </label>
              <button
                type="button"
                onClick={() => setIsCustomLocation(!isCustomLocation)}
                className="text-xs text-sky-400 hover:underline font-medium"
              >
                {isCustomLocation ? "בחר מוקד קבוע ברשימה" : "הזן קואורדינטות ידניות"}
              </button>
            </div>

            {!isCustomLocation ? (
              <div className="space-y-2">
                <select
                  value={selectedHotspotId}
                  onChange={(e) => setSelectedHotspotId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs font-bold focus:outline-hidden focus:border-sky-500"
                >
                  {WAREHOUSE_PERIPHERY_HOTSPOTS.map((hotspot) => (
                    <option key={hotspot.id} value={hotspot.id}>
                      {hotspot.name}
                    </option>
                  ))}
                </select>
                {currentHotspot && (
                  <p className="text-[11px] text-slate-400 bg-slate-900/60 p-2 rounded-lg border border-slate-800/80">
                    <strong className="text-slate-300">השפעה צפויה: </strong>
                    {currentHotspot.suggestedRoutes}
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-2 text-xs">
                <input
                  type="text"
                  placeholder="שם המיקום (למשל: סמטת החרש, שער עליון)"
                  value={customLocationName}
                  onChange={(e) => setCustomLocationName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder:text-slate-500"
                />
                <div className="grid grid-cols-2 gap-2" dir="ltr">
                  <div>
                    <span className="text-[10px] text-slate-500 block mb-0.5">
                      Latitude (קו רוחב):
                    </span>
                    <input
                      type="text"
                      value={customLat}
                      onChange={(e) => setCustomLat(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-xs"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block mb-0.5">
                      Longitude (קו אורך):
                    </span>
                    <input
                      type="text"
                      value={customLon}
                      onChange={(e) => setCustomLon(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-xs"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Title & Description */}
          <div className="space-y-2">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                כותרת קצרה להתרעה (אופציונלי):
              </label>
              <input
                type="text"
                placeholder={`לדוגמה: ${currentCategoryConfig?.label || "צוואר בקבוק"} בשער מחסן 4`}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                פירוט והנחיות לנהגים ולסדרנים:
              </label>
              <textarea
                rows={2}
                placeholder="תאר את מהות החסימה, דרכים עוקפות מומלצות או הנחיות פריקה..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 text-xs"
              />
            </div>
          </div>

          {/* Severity & Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">רמת חומרה:</label>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => setSeverity("heavy")}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold border ${
                    severity === "heavy"
                      ? "bg-rose-600 text-white border-rose-500"
                      : "bg-slate-950 text-slate-400 border-slate-800"
                  }`}
                >
                  🔴 כבד
                </button>
                <button
                  type="button"
                  onClick={() => setSeverity("moderate")}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold border ${
                    severity === "moderate"
                      ? "bg-amber-600 text-white border-amber-500"
                      : "bg-slate-950 text-slate-400 border-slate-800"
                  }`}
                >
                  🟡 בינוני
                </button>
                <button
                  type="button"
                  onClick={() => setSeverity("incident")}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold border ${
                    severity === "incident"
                      ? "bg-purple-600 text-white border-purple-500"
                      : "bg-slate-950 text-slate-400 border-slate-800"
                  }`}
                >
                  🟣 אירוע
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                תוקף התרעה אוטומטי:
              </label>
              <select
                value={durationHours}
                onChange={(e) => setDurationHours(Number(e.target.value))}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs"
              >
                <option value={1}>שעה אחת (התרעה קצרה)</option>
                <option value={2}>שעתיים (מומלץ לעומסי פריקה)</option>
                <option value={4}>4 שעות (עבודות תשתית / חצי יום)</option>
                <option value={8}>8 שעות (כל יום העבודה)</option>
                <option value={0}>ללא תפוגה (הסרה ידנית בלבד)</option>
              </select>
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 transition"
            >
              ביטול
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-black text-xs shadow-lg shadow-rose-600/20 transition"
            >
              <Plus className="size-4" />
              <span>נעץ סיכת התראה במפה</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
