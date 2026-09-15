import React, { useState } from "react";
import {
  ClipboardList,
  Search,
  Filter,
  Download,
  ShieldCheck,
  ShieldAlert,
  Clock,
  User,
  Tv,
  FileSpreadsheet,
  Radio,
  Film,
  Key,
} from "lucide-react";
import { useAdminControl } from "@/context/AdminControlContext";
import { toast } from "sonner";

export default function AuditPage() {
  const { auditLogs, canManageSystem } = useAdminControl();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const filteredLogs = auditLogs.filter((log) => {
    const matchesSearch =
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.ipAddress.includes(searchQuery);

    if (selectedCategory !== "all") {
      return matchesSearch && log.category === selectedCategory;
    }
    return matchesSearch;
  });

  const handleExportJson = () => {
    const dataStr =
      "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(filteredLogs, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute(
      "download",
      `saban-audit-log-${new Date().toISOString().slice(0, 10)}.json`,
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    toast.success("קובץ יומן ביקורת (JSON) הורד בהצלחה");
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case "screens":
        return <Tv className="w-3.5 h-3.5 text-sky-400" />;
      case "sheets":
        return <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />;
      case "overrides":
        return <Radio className="w-3.5 h-3.5 text-rose-400" />;
      case "media":
        return <Film className="w-3.5 h-3.5 text-purple-400" />;
      case "auth":
        return <Key className="w-3.5 h-3.5 text-amber-400" />;
      default:
        return <ClipboardList className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-400">
            <ClipboardList className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-white tracking-tight">
                יומן ביקורת ואבטחה (Audit Log)
              </h2>
              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                <span>Zero-Trust Logged</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              תיעוד הרמטי של כל פעולות המשתמשים, צימודי מסכים, שינויי מיפוי ושידורים מתפרצים
            </p>
          </div>
        </div>

        <button
          onClick={handleExportJson}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 shadow-sm transition-all"
        >
          <Download className="w-3.5 h-3.5" />
          <span>ייצוא יומן (JSON)</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
        <div className="flex items-center gap-2 w-full sm:w-80 relative">
          <Search className="w-4 h-4 text-slate-500 absolute right-3 pointer-events-none" />
          <input
            type="text"
            placeholder="חיפוש לפי פעולה, משתמש, IP או תוכן..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-3 pr-9 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto">
          {["all", "screens", "sheets", "overrides", "media", "auth"].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${
                selectedCategory === cat
                  ? "bg-sky-600 text-white font-bold shadow-sm shadow-sky-600/30"
                  : "text-slate-400 hover:bg-slate-800/60"
              }`}
            >
              {cat === "all" ? "הכל" : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-400 font-bold">
                <th className="py-3 px-4">זמן ומועד</th>
                <th className="py-3 px-4">משתמש ומחלקה</th>
                <th className="py-3 px-4">קטגוריה</th>
                <th className="py-3 px-4">פעולה</th>
                <th className="py-3 px-4">פרטי האירוע</th>
                <th className="py-3 px-4">כתובת IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-4 whitespace-nowrap font-mono text-slate-400 text-[11px]">
                    {new Date(log.timestamp).toLocaleString("he-IL", {
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center font-bold text-[10px]">
                        {log.userName.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-white leading-tight">{log.userName}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{log.role}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-950 text-slate-300 border border-slate-800 text-[10px] font-medium capitalize">
                      {getCategoryIcon(log.category)}
                      <span>{log.category}</span>
                    </span>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap font-bold text-sky-400">
                    {log.action}
                  </td>
                  <td className="py-3 px-4 text-slate-300 max-w-md truncate">{log.details}</td>
                  <td className="py-3 px-4 whitespace-nowrap font-mono text-slate-500 text-[11px]">
                    {log.ipAddress}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
