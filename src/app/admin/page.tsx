import React, { useState } from "react";
import {
  Tv,
  FileSpreadsheet,
  Radio,
  RefreshCw,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  TrendingUp,
  Boxes,
  Truck,
  Users,
  Eye,
  Sliders,
  Sparkles,
} from "lucide-react";
import { useAdminControl } from "@/context/AdminControlContext";
import { toast } from "sonner";

interface AdminDashboardPageProps {
  onNavigate?: (path: string) => void;
}

export default function AdminDashboardPage({ onNavigate }: AdminDashboardPageProps) {
  const {
    screens,
    sheetsConfig,
    testSheetsFetch,
    broadcasts,
    activeBroadcast,
    auditLogs,
    canManageSystem,
  } = useAdminControl();

  const [isSyncing, setIsSyncing] = useState(false);
  const [showLivePreview, setShowLivePreview] = useState(false);

  const onlineScreens = screens.filter((s) => s.status === "online");
  const offlineScreens = screens.filter((s) => s.status === "offline");

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      const res = await testSheetsFetch();
      if (res.success) {
        toast.success(`סנכרון הושלם בהצלחה! השהייה: ${res.latencyMs}ms`);
      } else {
        toast.error(`שגיאה בסנכרון: ${res.message}`);
      }
    } catch {
      toast.error("שגיאה בסנכרון מול Google Sheets");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Top Greeting & Operational Status */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black text-white tracking-tight">
              מרכז שליטה ובקרה לוגיסטית
            </h2>
            <span className="bg-sky-500/10 text-sky-400 border border-sky-500/30 px-2 py-0.5 rounded-full text-xs font-bold">
              מחסן 4 החרש + מחסן 1 התלמיד
            </span>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            מעקב בריאות מסכי שידור, סנכרון נתונים מול Google Sheets, שיבוץ מנופים והתראות מתפרצות
            בזמן אמת.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setShowLivePreview(!showLivePreview)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
              showLivePreview
                ? "bg-amber-500 text-slate-950 border-amber-400 shadow-lg shadow-amber-500/20"
                : "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700"
            }`}
          >
            <Eye className="w-4 h-4" />
            <span>
              {showLivePreview ? "הסתר תצוגה מקדימה חיה" : "תצוגה מקדימה חיה (Live Preview)"}
            </span>
          </button>

          <button
            onClick={handleManualSync}
            disabled={isSyncing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:bg-slate-800 text-white text-xs font-bold shadow-lg shadow-sky-600/30 transition-all border border-sky-400/30"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`} />
            <span>{isSyncing ? "מסנכרן כעת..." : "סנכרן Sheets עכשיו"}</span>
          </button>
        </div>
      </div>

      {/* Embedded Live Preview Panel (Collapsible) */}
      {showLivePreview && (
        <div className="bg-slate-900 border-2 border-sky-500/40 rounded-2xl p-4 shadow-2xl animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Tv className="w-5 h-5 text-sky-400" />
              <h3 className="text-sm font-black text-white">
                תצוגה מקדימה חיה של מסך הטלוויזיה (מחסן 4)
              </h3>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-bold">
                שידור מסך פעיל
              </span>
            </div>
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-sky-400 hover:underline flex items-center gap-1"
            >
              <span>פתיחה במסך מלא</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>
          <div className="rounded-xl overflow-hidden border border-slate-800 h-96 bg-black relative shadow-inner">
            <iframe
              src="/"
              title="Live TV Preview"
              className="w-full h-full border-0 pointer-events-auto"
            />
          </div>
        </div>
      )}

      {/* 4 Core Health Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Screens Health */}
        <div
          onClick={() => onNavigate?.("/admin/screens")}
          className="bg-slate-900 border border-slate-800 hover:border-sky-500/50 p-5 rounded-2xl transition-all cursor-pointer group shadow-lg"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">בריאות מסכים (Heartbeat)</span>
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 group-hover:bg-sky-500 group-hover:text-white transition-colors">
              <Tv className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{onlineScreens.length}</span>
            <span className="text-xs text-slate-400">מתוך {screens.length} מחוברים</span>
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs">
            <span className="flex items-center gap-1 text-emerald-400 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              {onlineScreens.length} Online
            </span>
            {offlineScreens.length > 0 && (
              <span className="flex items-center gap-1 text-rose-400 font-medium mr-2">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                {offlineScreens.length} Offline
              </span>
            )}
          </div>
        </div>

        {/* Metric 2: Google Sheets Sync */}
        <div
          onClick={() => onNavigate?.("/admin/sheets-mapping")}
          className="bg-slate-900 border border-slate-800 hover:border-emerald-500/50 p-5 rounded-2xl transition-all cursor-pointer group shadow-lg"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">סנכרון Google Sheets</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-400">
              {sheetsConfig.syncLatencyMs}ms
            </span>
            <span className="text-xs text-slate-400">זמן תגובה</span>
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="truncate">סנכרון אחרון: לפני דקה</span>
          </div>
        </div>

        {/* Metric 3: Emergency Overrides */}
        <div
          onClick={() => onNavigate?.("/admin/overrides")}
          className="bg-slate-900 border border-slate-800 hover:border-rose-500/50 p-5 rounded-2xl transition-all cursor-pointer group shadow-lg"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">שידור מבצעי בזק</span>
            <div
              className={`p-2 rounded-xl transition-colors ${
                activeBroadcast
                  ? "bg-rose-500 text-white animate-pulse"
                  : "bg-slate-800 text-slate-400 group-hover:bg-rose-500/20 group-hover:text-rose-400"
              }`}
            >
              <Radio className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span
              className={`text-2xl font-black ${activeBroadcast ? "text-rose-400" : "text-slate-300"}`}
            >
              {activeBroadcast ? "שידור פעיל" : "אין התראה"}
            </span>
          </div>
          <div className="mt-3 text-xs text-slate-400 truncate">
            {activeBroadcast ? activeBroadcast.title : "כל המסכים במצב שגרה"}
          </div>
        </div>

        {/* Metric 4: Logistics Load */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">עומס מחסן 4 (החרש)</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-amber-400">72%</span>
            <span className="text-xs text-slate-400">קיבולת פעילה</span>
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
            <Truck className="w-3.5 h-3.5 text-sky-400" />
            <span>4 משאיות מנוף בהעמסה</span>
          </div>
        </div>
      </div>

      {/* 2-Column Section: Connected Screens Grid + Audit Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 spans): Screens Status & Quick Controls */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <Tv className="w-4 h-4 text-sky-400" />
                  <span>מסכי הפצה ומסופים מוצמדים</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">חיווי סטטוס חי ופקודות שליטה מרחוק</p>
              </div>

              <button
                onClick={() => onNavigate?.("/admin/screens")}
                className="text-xs font-bold text-sky-400 hover:text-sky-300 flex items-center gap-1"
              >
                <span>נהל את כל המסכים</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {screens.map((screen) => (
                <div
                  key={screen.id}
                  className="bg-slate-950/70 border border-slate-800 hover:border-slate-700 p-4 rounded-xl flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-white truncate max-w-[180px]">
                        {screen.name}
                      </span>
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
                        {screen.status === "online" ? "מחובר (Online)" : "מנותק"}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400 space-y-1">
                      <div className="flex items-center justify-between">
                        <span>מיקום:</span>
                        <span className="text-slate-300 font-medium">
                          {screen.warehouseLocation}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>כתובת IP:</span>
                        <span className="font-mono text-slate-400">{screen.ipAddress}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>ווליום:</span>
                        <span className="text-sky-400 font-bold">{screen.volume}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <span className="text-[10px] text-slate-500">
                      {screen.branchManager} (אחראי)
                    </span>
                    <button
                      onClick={() => onNavigate?.(`/admin/screens/${screen.id}`)}
                      className="text-[11px] text-sky-400 hover:text-sky-300 font-bold hover:underline"
                    >
                      הגדרות מסך &larr;
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions Shortcuts */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <h3 className="text-sm font-black text-white mb-3">פעולות תפעול מהירות</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={() => onNavigate?.("/admin/screens")}
                className="p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 flex items-center gap-3 text-right transition-all group"
              >
                <div className="p-2 rounded-lg bg-sky-500/20 text-sky-400 group-hover:bg-sky-500 group-hover:text-white transition-colors">
                  <Tv className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">צימוד מסך חדש</div>
                  <div className="text-[10px] text-slate-400">קוד בן 6 ספרות</div>
                </div>
              </button>

              <button
                onClick={() => onNavigate?.("/admin/overrides")}
                className="p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 flex items-center gap-3 text-right transition-all group"
              >
                <div className="p-2 rounded-lg bg-rose-500/20 text-rose-400 group-hover:bg-rose-500 group-hover:text-white transition-colors">
                  <Radio className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">שיגור כריזה מתפרצת</div>
                  <div className="text-[10px] text-slate-400">באנר אדום + קול נועה</div>
                </div>
              </button>

              <button
                onClick={() => onNavigate?.("/admin/media")}
                className="p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 flex items-center gap-3 text-right transition-all group"
              >
                <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">שומר מסך ומדיה</div>
                  <div className="text-[10px] text-slate-400">סרטוני Drive ומצגות</div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column (1 span): Recent Audit Activities Stream */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                <span>יומן אירועים חי (Audit)</span>
              </h3>
              <button
                onClick={() => onNavigate?.("/admin/audit")}
                className="text-xs font-bold text-sky-400 hover:text-sky-300"
              >
                לכל היומן &larr;
              </button>
            </div>

            <div className="space-y-3">
              {auditLogs.slice(0, 5).map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">{log.action}</span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(log.timestamp).toLocaleTimeString("he-IL", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <div className="text-slate-400 text-[11px] line-clamp-1">{log.details}</div>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                    <span className="text-sky-400 font-medium">{log.userName}</span>
                    <span className="bg-slate-800 px-1.5 py-0.2 rounded font-mono">
                      {log.category}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 p-3 bg-slate-950/40 border border-slate-800/60 rounded-xl text-xs text-slate-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>כל הפעולות מאובטחות ומתועדות בהתאם לנוהלי ח. סבן בע״מ</span>
          </div>
        </div>
      </div>
    </div>
  );
}
