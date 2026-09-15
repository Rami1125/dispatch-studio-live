import React, { useState } from "react";
import {
  Radio,
  Send,
  AlertTriangle,
  StopCircle,
  Clock,
  Volume2,
  Tv,
  Sparkles,
  CheckCircle,
  History,
  Trash2,
  Info,
  Flame,
} from "lucide-react";
import { useAdminControl } from "@/context/AdminControlContext";
import { toast } from "sonner";

const BROADCAST_PRESETS = [
  {
    title: "משאית מנוף בגישה לרציף 4",
    message: "משאית מרצדס מנוף של חכמת בגישה לרציף 4 — נא לפנות מעבר מלגזות ועגלות משטחים מיד.",
    level: "critical" as const,
    durationMinutes: 15,
  },
  {
    title: "הפסקת העמסות זמנית ברציף בלות",
    message: "העמסת שקי בלה וסומסום מושהית למשך 20 דקות עקב בדיקת בטיחות תפעולית.",
    level: "warning" as const,
    durationMinutes: 20,
  },
  {
    title: "היערכות לגשם: עטיפת משטחי גבס ומלט",
    message: "גשם צפוי בשעות הצהריים. חובה לעטוף בניילון נצמד כל משטח גבס ומלט שיוצא להפצה.",
    level: "warning" as const,
    durationMinutes: 60,
  },
  {
    title: "הקדמת סבב 2 להעמסת צהריים",
    message: "סבב 2 הוקדם ל-11:45. נהגים מתבקשים להיכנס לרציפים לפי תור קריאת מנופאים.",
    level: "info" as const,
    durationMinutes: 45,
  },
];

export default function OverridesPage() {
  const { screens, broadcasts, activeBroadcast, publishBroadcast, cancelBroadcast, currentUser } =
    useAdminControl();

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [level, setLevel] = useState<"critical" | "warning" | "info" | "success">("critical");
  const [targetScope, setTargetScope] = useState<"all" | "custom">("all");
  const [selectedScreenIds, setSelectedScreenIds] = useState<string[]>([]);
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [voiceAnnounce, setVoiceAnnounce] = useState(true);

  const handleApplyPreset = (preset: (typeof BROADCAST_PRESETS)[0]) => {
    setTitle(preset.title);
    setMessage(preset.message);
    setLevel(preset.level);
    setDurationMinutes(preset.durationMinutes);
    toast.info(`נטענה תבנית: "${preset.title}"`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message) {
      toast.error("נא למלא כותרת והודעת שידור");
      return;
    }

    publishBroadcast({
      title,
      message,
      level,
      targetScreenIds: targetScope === "all" ? ["all"] : selectedScreenIds,
      voiceAnnounce,
      durationMinutes,
    });

    toast.success(`ההתראה שודרה מיידית לכל מסכי הטלוויזיה!`);
    setTitle("");
    setMessage("");
  };

  const handleCancelBroadcast = (id: string) => {
    cancelBroadcast(id);
    toast.success("השידור הופסק מיידית מכל המסכים");
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-white tracking-tight">
                שידור מבצעי בזק והתראות מתפרצות
              </h2>
              <span className="bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] px-2 py-0.5 rounded-full font-bold animate-pulse">
                שידור חי (LIVE)
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              הזרקת באנרים אדומים, התראות קופצות וכריזה קולית של נועה AI לכל מסכי המחסן
            </p>
          </div>
        </div>
      </div>

      {/* Active Broadcast Banner if running */}
      {activeBroadcast && (
        <div className="bg-gradient-to-r from-rose-950 via-rose-900/60 to-slate-900 border-2 border-rose-600 p-5 rounded-2xl shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-rose-600 text-white animate-bounce shrink-0 mt-0.5">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider bg-rose-600 text-white px-2 py-0.5 rounded">
                  שידור פעיל כעת במסכים
                </span>
                <span className="text-xs text-rose-300 font-mono">
                  יוזם: {activeBroadcast.createdBy}
                </span>
              </div>
              <h3 className="text-lg font-black text-white mt-1">{activeBroadcast.title}</h3>
              <p className="text-xs text-rose-200 mt-0.5">{activeBroadcast.message}</p>
              <div className="text-[11px] text-rose-300 mt-2 flex items-center gap-3">
                <span className="flex items-center gap-1 font-mono">
                  <Clock className="w-3.5 h-3.5" />
                  <span>
                    תפוגה:{" "}
                    {new Date(activeBroadcast.expiresAt).toLocaleTimeString("he-IL", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </span>
                {activeBroadcast.voiceAnnounce && (
                  <span className="flex items-center gap-1 text-emerald-400 font-bold">
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>כריזה קולית הופעלה</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={() => handleCancelBroadcast(activeBroadcast.id)}
            className="flex items-center gap-2 px-4 py-2.5 bg-rose-700 hover:bg-rose-600 text-white text-xs font-bold rounded-xl shadow-lg shadow-rose-900/40 transition-all border border-rose-400/40 shrink-0"
          >
            <StopCircle className="w-4 h-4" />
            <span>הפסק שידור מיידי</span>
          </button>
        </div>
      )}

      {/* Quick Presets Grid */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>תבניות התראה מהירות למחסן ח. סבן</span>
          </h3>
          <span className="text-[11px] text-slate-500">לחץ לטעינה מהירה</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {BROADCAST_PRESETS.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleApplyPreset(preset)}
              className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-sky-500/50 text-right transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="text-xs font-bold text-white group-hover:text-sky-300 transition-colors">
                  {preset.title}
                </div>
                <div className="text-[11px] text-slate-400 line-clamp-2 mt-1">{preset.message}</div>
              </div>
              <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500">
                <span
                  className={
                    preset.level === "critical"
                      ? "text-rose-400 font-bold"
                      : "text-amber-400 font-bold"
                  }
                >
                  {preset.level === "critical" ? "דחוף ביותר" : "תפעולי"}
                </span>
                <span>{preset.durationMinutes} דקות</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Broadcast Creator Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5"
      >
        <h3 className="text-sm font-black text-white border-b border-slate-800 pb-3 flex items-center gap-2">
          <Send className="w-4 h-4 text-rose-400" />
          <span>שיגור הודעת מתפרצת חדשה (Broadcast Composer)</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-300 mb-1">
              כותרת ההתראה (תופיע בבאנר הראשי):
            </label>
            <input
              type="text"
              placeholder="למשל: ⚠️ משאית מנוף נכנסת לרציף 4"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">רמת דחיפות:</label>
            <select
              value={level}
              onChange={(e) =>
                setLevel(e.target.value as "critical" | "warning" | "info" | "success")
              }
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
            >
              <option value="critical">🚨 קריטי (אדום - משאית מנוף, סכנה)</option>
              <option value="warning">⚠️ אזהרה תפעולית (כתום - גשם, בדיקה)</option>
              <option value="info">📢 עדכון לוגיסטי (כחול - הקדמת סבב)</option>
              <option value="success">✅ הודעה חיובית (ירוק - סיום העמסה)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1">
            תוכן ההודעה המפורטת:
          </label>
          <textarea
            rows={3}
            placeholder="פירוט ההנחיות למחסנאים, לנהגים ולמנופאים..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-rose-500"
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-slate-950/60 rounded-xl border border-slate-800">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">משך תצוגה ותוקף:</label>
            <select
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(parseInt(e.target.value))}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-rose-500"
            >
              <option value={15}>15 דקות</option>
              <option value={30}>30 דקות</option>
              <option value={60}>שעה אחת</option>
              <option value={180}>3 שעות (סוף יום)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">מסכי יעד לשידור:</label>
            <select
              value={targetScope}
              onChange={(e) => setTargetScope(e.target.value as "all" | "custom")}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-rose-500"
            >
              <option value="all">כל המסכים והטאבלטים (כולם)</option>
              <option value="custom">מסכים ספציפיים בלבד</option>
            </select>
          </div>

          <div className="flex flex-col justify-center">
            <label className="flex items-center gap-2 cursor-pointer mt-3">
              <input
                type="checkbox"
                checked={voiceAnnounce}
                onChange={(e) => setVoiceAnnounce(e.target.checked)}
                className="rounded accent-rose-500 w-4 h-4"
              />
              <span className="text-xs font-bold text-slate-200">
                הקראה קולית של נועה AI ברמקולים
              </span>
            </label>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-between pt-2">
          <p className="text-[11px] text-slate-500">
            השידור מיושם מיידית (Live Apply) ומופיע כבאנר מהבהב במסכי הטלוויזיה של המחסן.
          </p>

          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-rose-600/30 transition-all border border-rose-400/30"
          >
            <Send className="w-4 h-4" />
            <span>שגר שידור מבצעי מיד</span>
          </button>
        </div>
      </form>

      {/* Broadcast History */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <h3 className="text-xs font-black text-white flex items-center gap-2">
            <History className="w-4 h-4 text-sky-400" />
            <span>היסטוריית שידורים מבצעיים</span>
          </h3>
          <span className="text-xs text-slate-500">{broadcasts.length} שידורים תועדו</span>
        </div>

        <div className="divide-y divide-slate-800/60">
          {broadcasts.length === 0 ? (
            <div className="text-center py-6 text-xs text-slate-500">טרם בוצעו שידורים במערכת</div>
          ) : (
            broadcasts.slice(0, 8).map((b) => (
              <div key={b.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{b.title}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                        b.isActive
                          ? "bg-rose-500 text-white animate-pulse"
                          : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      {b.isActive ? "פעיל" : "הסתיים"}
                    </span>
                  </div>
                  <p className="text-slate-400 text-[11px] line-clamp-1 mt-0.5">{b.message}</p>
                  <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-2">
                    <span>שודר ע"י: {b.createdBy}</span>
                    <span>&bull;</span>
                    <span>{new Date(b.createdAt).toLocaleString("he-IL")}</span>
                  </div>
                </div>

                {b.isActive && (
                  <button
                    onClick={() => handleCancelBroadcast(b.id)}
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-rose-950 text-rose-400 text-[11px] font-medium border border-rose-900/50"
                  >
                    הפסק
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
