import React, { useState } from "react";
import {
  Film,
  Plus,
  Play,
  Trash2,
  ExternalLink,
  Clock,
  Calendar,
  Layers,
  Sparkles,
  CheckCircle,
  Video,
  Presentation,
  Image as ImageIcon,
  Save,
} from "lucide-react";
import { useAdminControl } from "@/context/AdminControlContext";
import { FALLBACK_MEDIA_ITEMS } from "@/services/googleDriveMediaService";
import type { DriveMediaItem } from "@/types/screensaver";
import type { ScreensaverScheduleRule } from "@/types/admin";
import { toast } from "sonner";

export default function MediaPage() {
  const { scheduleRules, updateScheduleRules, canDispatch } = useAdminControl();

  const [mediaItems, setMediaItems] = useState<DriveMediaItem[]>(FALLBACK_MEDIA_ITEMS);
  const [selectedMedia, setSelectedMedia] = useState<DriveMediaItem>(FALLBACK_MEDIA_ITEMS[0]!);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New media form state
  const [newMediaTitle, setNewMediaTitle] = useState("");
  const [newMediaType, setNewMediaType] = useState<"video" | "presentation" | "image">("video");
  const [newMediaUrl, setNewMediaUrl] = useState("");
  const [newMediaDuration, setNewMediaDuration] = useState(15);

  // Scheduling rules state
  const [rules, setRules] = useState<ScreensaverScheduleRule[]>(scheduleRules);

  const handleAddMedia = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMediaTitle || !newMediaUrl) {
      toast.error("נא למלא כותרת וכתובת קישור למדיה");
      return;
    }

    const newItem: DriveMediaItem = {
      id: `media-${Date.now()}`,
      name: newMediaTitle,
      type: newMediaType,
      mimeType:
        newMediaType === "video"
          ? "video/mp4"
          : newMediaType === "presentation"
            ? "application/vnd.google-apps.presentation"
            : "image/jpeg",
      embedUrl: newMediaUrl,
      downloadUrl: newMediaUrl,
      thumbnailLink:
        newMediaType === "video"
          ? "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80"
          : "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=600&q=80",
      durationSeconds: newMediaDuration,
      createdTime: new Date().toISOString(),
    };

    setMediaItems([newItem, ...mediaItems]);
    setIsAddModalOpen(false);
    setNewMediaTitle("");
    setNewMediaUrl("");
    toast.success(`המדיה "${newMediaTitle}" נוספה לספריית שומר המסך!`);
  };

  const handleDeleteMedia = (id: string, name: string) => {
    setMediaItems(mediaItems.filter((m) => m.id !== id));
    toast.success(`המדיה "${name}" הוסרה`);
  };

  const handleToggleRule = (ruleId: string) => {
    const updated = rules.map((r) => (r.id === ruleId ? { ...r, enabled: !r.enabled } : r));
    setRules(updated);
    updateScheduleRules(updated);
    toast.success("תזמון שומר המסך עודכן");
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400">
            <Film className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white tracking-tight">
              ספריית מדיה ותזמון שומר מסך
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              סרטוני הדרכת בטיחות מנופים, מצגות נהלים מ-Google Drive ותזמון הפסקות צהריים
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-purple-600/30 transition-all border border-purple-400/30"
        >
          <Plus className="w-4 h-4" />
          <span>הוסף סרטון או מצגת Drive</span>
        </button>
      </div>

      {/* 2-Column: Media Playlist & Live Player (Left) + Scheduler Rules (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Media List & Live Player */}
        <div className="lg:col-span-2 space-y-5">
          {/* Active Media Player Preview */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Play className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-black text-white truncate max-w-md">
                  {selectedMedia.name}
                </h3>
              </div>
              <span className="text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/40 px-2 py-0.5 rounded font-mono">
                משך: {selectedMedia.durationSeconds || 15} שניות
              </span>
            </div>

            <div className="rounded-xl overflow-hidden border border-slate-800 bg-black aspect-video relative flex items-center justify-center">
              {selectedMedia.type === "video" ? (
                <video
                  src={selectedMedia.embedUrl || selectedMedia.downloadUrl}
                  controls
                  className="w-full h-full object-contain"
                  poster={selectedMedia.thumbnailLink}
                />
              ) : selectedMedia.type === "presentation" ? (
                <iframe
                  src={selectedMedia.embedUrl}
                  title={selectedMedia.name}
                  className="w-full h-full border-0"
                />
              ) : (
                <img
                  src={selectedMedia.thumbnailLink || selectedMedia.embedUrl}
                  alt={selectedMedia.name}
                  className="w-full h-full object-contain"
                />
              )}
            </div>
          </div>

          {/* Playlist items list */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-sky-400" />
                <span>רשימת סבב שומר המסך ({mediaItems.length} פריטים)</span>
              </h3>
              <span className="text-xs text-slate-500">לחץ לצפייה מקדימה</span>
            </div>

            <div className="space-y-2">
              {mediaItems.map((item, idx) => {
                const isSelected = selectedMedia.id === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedMedia(item)}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-slate-850 border-purple-500/60 shadow-lg shadow-purple-500/10"
                        : "bg-slate-950/60 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="font-mono text-xs text-slate-500 font-bold w-5">
                        {idx + 1}.
                      </span>
                      <div className="w-12 h-8 rounded-lg overflow-hidden bg-slate-800 shrink-0 border border-slate-700">
                        <img
                          src={
                            item.thumbnailLink ||
                            "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80"
                          }
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="truncate">
                        <div className="text-xs font-bold text-white truncate">{item.name}</div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                          <span className="capitalize">{item.type}</span>
                          <span>&bull;</span>
                          <span>{item.durationSeconds || 15} שניות</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isSelected && (
                        <span className="text-[10px] bg-purple-500 text-white font-bold px-1.5 py-0.5 rounded">
                          מנוגן כעת
                        </span>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteMedia(item.id, item.name);
                        }}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                        title="מחק מדיה"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Lightweight Scheduling Rules */}
        <div className="space-y-5">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>תזמון קל-משקל לשומר מסך</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                הגדרת שעות להפעלת שומר מסך כפוי בזמני הפסקות או בסיום יום עבודה
              </p>
            </div>

            <div className="space-y-3">
              {rules.map((rule) => (
                <div
                  key={rule.id}
                  className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{rule.name}</span>
                    <button
                      onClick={() => handleToggleRule(rule.id)}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition-colors ${
                        rule.enabled
                          ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                          : "bg-slate-800 text-slate-500 border-slate-700"
                      }`}
                    >
                      {rule.enabled ? "פעיל" : "כבוי"}
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-sky-400" />
                      <span>
                        {rule.startTime} - {rule.endTime}
                      </span>
                    </div>
                    <span className="text-[11px] text-amber-400 font-sans">
                      {rule.mode === "force_screensaver" ? "כפה שומר מסך" : "מנע שומר מסך"}
                    </span>
                  </div>

                  <div className="text-[10px] text-slate-500">ימי פעילות: ראשון עד חמישי (א-ה)</div>
                </div>
              ))}
            </div>

            <div className="p-3 bg-amber-950/30 border border-amber-800/40 rounded-xl text-xs text-amber-300">
              <span className="font-bold">תפעול מהיר (Live Apply):</span> כאשר מגיע חלון הזמן
              המוגדר, כל המסכים המחוברים עוברים מיד למצב שומר מסך ללא צורך בהתערבות ידנית.
            </div>
          </div>
        </div>
      </div>

      {/* Add Media Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-purple-400" />
                <span>הוספת סרטון או מצגת מ-Google Drive</span>
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddMedia} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">כותרת המדיה:</label>
                <input
                  type="text"
                  placeholder="למשל: סרטון בטיחות העמסת בלוקים וטיט"
                  value={newMediaTitle}
                  onChange={(e) => setNewMediaTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">סוג מדיה:</label>
                  <select
                    value={newMediaType}
                    onChange={(e) =>
                      setNewMediaType(e.target.value as "video" | "presentation" | "image")
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="video">סרטון MP4 / Drive Video</option>
                    <option value="presentation">מצגת Google Slides</option>
                    <option value="image">תמונה / באנר מוצר</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    משך הצגה (שניות):
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={300}
                    value={newMediaDuration}
                    onChange={(e) => setNewMediaDuration(parseInt(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  כתובת קישור (URL) או Embed Link:
                </label>
                <input
                  type="url"
                  placeholder="https://commondatastorage.googleapis.com/... או Google Drive"
                  value={newMediaUrl}
                  onChange={(e) => setNewMediaUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-purple-300 focus:outline-none focus:border-purple-500"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl"
                >
                  ביטול
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-purple-600/30 transition-all"
                >
                  הוסף לספרייה
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
