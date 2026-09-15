import React, { useState, useEffect } from "react";
import {
  Tv,
  ArrowRight,
  Volume2,
  Sliders,
  Power,
  RefreshCw,
  Save,
  CheckCircle,
  Clock,
  Shield,
  Trash2,
  ExternalLink,
  Laptop,
} from "lucide-react";
import { useAdminControl } from "@/context/AdminControlContext";
import { toast } from "sonner";

interface ScreenDetailProps {
  screenId: string;
  onNavigate?: (path: string) => void;
}

export default function ScreenDetailPage({ screenId, onNavigate }: ScreenDetailProps) {
  const { screens, updateScreen, sendRemoteCommand, unpairDevice, canManageSystem } =
    useAdminControl();

  const screen = screens.find((s) => s.id === screenId);

  // Local state for editing form
  const [name, setName] = useState(screen?.name || "");
  const [warehouseLocation, setWarehouseLocation] = useState(screen?.warehouseLocation || "");
  const [branchManager, setBranchManager] = useState(screen?.branchManager || "");
  const [volume, setVolume] = useState(screen?.volume ?? 80);
  const [defaultRound, setDefaultRound] = useState(screen?.defaultRound || "all");
  const [idleMinutes, setIdleMinutes] = useState(screen?.screensaverIdleMinutes ?? 5);
  const [notes, setNotes] = useState(screen?.notes || "");
  const [forcedScreensaver, setForcedScreensaver] = useState(screen?.forcedScreensaver ?? false);

  useEffect(() => {
    if (screen) {
      setName(screen.name);
      setWarehouseLocation(screen.warehouseLocation);
      setBranchManager(screen.branchManager);
      setVolume(screen.volume);
      setDefaultRound(screen.defaultRound);
      setIdleMinutes(screen.screensaverIdleMinutes);
      setNotes(screen.notes || "");
      setForcedScreensaver(screen.forcedScreensaver);
    }
  }, [screen]);

  if (!screen) {
    return (
      <div className="max-w-4xl mx-auto text-center py-20">
        <div className="p-4 rounded-full bg-slate-900 border border-slate-800 w-16 h-16 mx-auto flex items-center justify-center text-slate-500 mb-4">
          <Tv className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-white mb-2">המכשיר המבוקש לא נמצא</h3>
        <p className="text-xs text-slate-400 mb-4">ייתכן שהמסך בוטל או שקוד המכשיר השתנה.</p>
        <button
          onClick={() => onNavigate?.("/admin/screens")}
          className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl"
        >
          חזרה לרשימת המסכים
        </button>
      </div>
    );
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateScreen(screen.id, {
      name,
      warehouseLocation,
      branchManager,
      volume,
      defaultRound: defaultRound as "all" | "round1" | "round2" | "auto",
      screensaverIdleMinutes: idleMinutes,
      forcedScreensaver,
      notes,
    });
    toast.success(`הגדרות המסך "${name}" נשמרו והוחלו מיד (Live Apply)!`);
  };

  const handleRemoteRefresh = () => {
    sendRemoteCommand(screen.id, "refresh");
    toast.success(`נשלחה פקודת ריענון למסך`);
  };

  const handleToggleScreensaver = () => {
    const next = !forcedScreensaver;
    setForcedScreensaver(next);
    sendRemoteCommand(screen.id, "toggle_screensaver");
    toast.success(next ? "שומר מסך הופעל מרחוק" : "שומר מסך בוטל מרחוק");
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      {/* Top Header & Navigation Back */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate?.("/admin/screens")}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            title="חזרה לרשימת המסכים"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-white tracking-tight">{screen.name}</h2>
              <span
                className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  screen.status === "online"
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                    : "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${screen.status === "online" ? "bg-emerald-400 animate-pulse" : "bg-rose-500"}`}
                />
                {screen.status === "online" ? "Online" : "Offline"}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {screen.warehouseLocation} &bull; טוקן:{" "}
              <span className="font-mono text-slate-300">{screen.deviceToken}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRemoteRefresh}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5 text-sky-400" />
            <span>ריענון מרחוק</span>
          </button>
          <button
            type="button"
            onClick={handleToggleScreensaver}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-colors ${
              forcedScreensaver
                ? "bg-amber-500/20 text-amber-300 border-amber-500/50"
                : "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700"
            }`}
          >
            <Power className="w-3.5 h-3.5 text-amber-400" />
            <span>{forcedScreensaver ? "בטל שומר מסך" : "כפה שומר מסך"}</span>
          </button>
        </div>
      </div>

      {/* Main 2-Column Grid: Settings Form (Left) & Mini Preview (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings Form: 2 cols */}
        <div className="lg:col-span-2">
          <form
            onSubmit={handleSave}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5"
          >
            <h3 className="text-sm font-black text-white border-b border-slate-800 pb-3 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-sky-400" />
              <span>הגדרות תצוגה ושמע פרטניות</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  שם המסך לתצוגה:
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  שיוך מחסן ורציף:
                </label>
                <input
                  type="text"
                  value={warehouseLocation}
                  onChange={(e) => setWarehouseLocation(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">מנהל אחראי:</label>
                <input
                  type="text"
                  value={branchManager}
                  onChange={(e) => setBranchManager(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  סבב ברירת מחדל:
                </label>
                <select
                  value={defaultRound}
                  onChange={(e) =>
                    setDefaultRound(e.target.value as "all" | "round1" | "round2" | "auto")
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                >
                  <option value="all">כל הסבבים (סבב 1 וסבב 2)</option>
                  <option value="round1">סבב 1 בלבד (העמסת בוקר)</option>
                  <option value="round2">סבב 2 בלבד (העמסת צהריים)</option>
                  <option value="auto">אוטומטי לפי שעת היום</option>
                </select>
              </div>
            </div>

            {/* Volume Control */}
            <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-sky-400" />
                  <span className="font-bold text-slate-200">עוצמת שמע וכריזת נועה AI:</span>
                </div>
                <span className="font-mono font-bold text-sky-400 text-sm">{volume}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={(e) => setVolume(parseInt(e.target.value))}
                className="w-full accent-sky-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
              />
              <p className="text-[11px] text-slate-400">
                קובע את עוצמת צפצופי ההזמנות החדשות, כריזת נהגים והתראות מתפרצות ברמקול המסך.
              </p>
            </div>

            {/* Screensaver Idle Delay */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  השהיית מעבר לשומר מסך (בדקות של חוסר פעילות):
                </label>
                <select
                  value={idleMinutes}
                  onChange={(e) => setIdleMinutes(parseInt(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                >
                  <option value={2}>2 דקות (מהיר)</option>
                  <option value={5}>5 דקות (מומלץ למחסן)</option>
                  <option value={10}>10 דקות</option>
                  <option value={15}>15 דקות</option>
                  <option value={0}>ללא שומר מסך אוטומטי</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  הערות לוגיסטיות למסך:
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="למשל: תלוי מעל שער 2 ליד רציף מנוף"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            {/* Submit Bar */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              {canManageSystem && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`האם לבטל את צימוד המסך "${screen.name}"?`)) {
                      unpairDevice(screen.id);
                      onNavigate?.("/admin/screens");
                    }
                  }}
                  className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 font-medium"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>בטל צימוד מסך (Unpair)</span>
                </button>
              )}

              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-2.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-sky-600/30 transition-all mr-auto"
              >
                <Save className="w-4 h-4" />
                <span>החל שינויים מיד (Live Apply)</span>
              </button>
            </div>
          </form>
        </div>

        {/* Mini Preview & Technical Specs: 1 col */}
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-black text-white flex items-center gap-2">
                <Laptop className="w-4 h-4 text-sky-400" />
                <span>תצוגה מקדימה חיה (Mini-Preview)</span>
              </h3>
              <a
                href="/"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-sky-400 hover:underline flex items-center gap-0.5"
              >
                <span>מסך מלא</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* Scaled iframe container */}
            <div className="rounded-xl overflow-hidden border border-slate-800 bg-black aspect-video relative shadow-inner">
              <iframe
                src="/"
                title="Screen Preview"
                className="w-full h-full border-0 pointer-events-none transform origin-top-left"
              />
            </div>

            <div className="mt-4 space-y-2 text-xs text-slate-400 border-t border-slate-800/80 pt-3">
              <div className="flex justify-between">
                <span>דגם:</span>
                <span className="text-slate-300 font-medium">{screen.modelInfo || "Smart TV"}</span>
              </div>
              <div className="flex justify-between">
                <span>כתובת IP:</span>
                <span className="font-mono text-slate-300">{screen.ipAddress}</span>
              </div>
              <div className="flex justify-between">
                <span>תאריך צימוד:</span>
                <span className="text-slate-300">{screen.pairedAt}</span>
              </div>
              <div className="flex justify-between">
                <span>גרסת אפליקציה:</span>
                <span className="font-mono text-sky-400 font-bold">{screen.appVersion}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
