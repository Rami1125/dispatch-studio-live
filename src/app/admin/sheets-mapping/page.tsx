import React, { useState } from "react";
import {
  FileSpreadsheet,
  RefreshCw,
  Save,
  CheckCircle,
  AlertTriangle,
  ExternalLink,
  Table,
  Zap,
  ShieldCheck,
  ShieldAlert,
  Code,
} from "lucide-react";
import { useAdminControl } from "@/context/AdminControlContext";
import { toast } from "sonner";

export default function SheetsMappingPage() {
  const { sheetsConfig, updateSheetsConfig, testSheetsFetch, canManageSystem } = useAdminControl();

  const [webhookUrl, setWebhookUrl] = useState(sheetsConfig.webhookUrl);
  const [spreadsheetUrl, setSpreadsheetUrl] = useState(sheetsConfig.spreadsheetUrl);
  const [ordersTabName, setOrdersTabName] = useState(sheetsConfig.ordersTabName);
  const [logisticsDictTabName, setLogisticsDictTabName] = useState(
    sheetsConfig.logisticsDictTabName,
  );
  const [columns, setColumns] = useState(sheetsConfig.columns);

  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    latencyMs: number;
    rowCount: number;
    message: string;
    sampleData?: Record<string, unknown>;
  } | null>(null);

  const handleColumnChange = (systemKey: string, newCol: string) => {
    if (!canManageSystem) return;
    setColumns((prev) =>
      prev.map((c) =>
        c.systemKey === systemKey ? { ...c, sheetColumn: newCol.toUpperCase().trim() } : c,
      ),
    );
  };

  const handleTestFetch = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await testSheetsFetch();
      setTestResult(res);
      if (res.success) {
        toast.success(`בדיקת Fetch הצליחה! זמן תגובה: ${res.latencyMs}ms`);
      } else {
        toast.error(`בדיקת Fetch נכשלה: ${res.message}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`שגיאה בבדיקת חיבור: ${msg}`);
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveAll = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageSystem) {
      toast.error("אין לך הרשאת מנהל (ADMIN) לשינוי מיפוי עמודות");
      return;
    }

    updateSheetsConfig({
      webhookUrl,
      spreadsheetUrl,
      ordersTabName,
      logisticsDictTabName,
      columns,
    });

    toast.success("תצורת Google Sheets נשמרה והוחלה בהצלחה!");
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-white tracking-tight">
                מיפוי עמודות וסנכרון Google Sheets
              </h2>
              {canManageSystem ? (
                <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  <span>הרשאת מנהל (ADMIN)</span>
                </span>
              ) : (
                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3" />
                  <span>צפייה בלבד (DISPATCHER)</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              חיבור ישיר מול גיליון ההפצה של ח. סבן חומרי בניין (1994) בע"מ
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={spreadsheetUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
          >
            <span>פתח גיליון ב-Google Docs</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <button
            type="button"
            onClick={handleTestFetch}
            disabled={isTesting}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/30 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? "animate-spin" : ""}`} />
            <span>{isTesting ? "בודק Fetch..." : "בדיקת Fetch מול Sheets"}</span>
          </button>
        </div>
      </div>

      {/* Fetch Test Result Card if available */}
      {testResult && (
        <div
          className={`p-4 rounded-2xl border ${
            testResult.success
              ? "bg-emerald-950/40 border-emerald-800/60 text-emerald-200"
              : "bg-rose-950/40 border-rose-800/60 text-rose-200"
          } shadow-xl animate-in fade-in`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-sm">
              {testResult.success ? (
                <CheckCircle className="w-4 h-4 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-400" />
              )}
              <span>{testResult.message}</span>
            </div>
            <span className="font-mono text-xs bg-slate-950/60 px-2 py-0.5 rounded border border-slate-800">
              זמן תגובה: {testResult.latencyMs}ms
            </span>
          </div>
          {testResult.sampleData && (
            <div className="mt-2 text-xs text-slate-400 font-mono bg-slate-950/80 p-2.5 rounded-lg overflow-x-auto">
              {JSON.stringify(testResult.sampleData, null, 2)}
            </div>
          )}
        </div>
      )}

      {/* Connection Settings Form */}
      <form onSubmit={handleSaveAll} className="space-y-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <h3 className="text-sm font-black text-white border-b border-slate-800 pb-3 flex items-center gap-2">
            <Zap className="w-4 h-4 text-sky-400" />
            <span>הגדרות כתובת Webhook וטאבים בגיליון</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-300 mb-1">
                כתובת Google Apps Script Webhook URL:
              </label>
              <input
                type="url"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                disabled={!canManageSystem}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-sky-300 focus:outline-none focus:border-sky-500 disabled:opacity-60"
                required
              />
              <p className="text-[11px] text-slate-500 mt-1">
                הסקריפט מקבל בקשות POST לסנכרון סטטוסים ומחזיר את נתוני ההזמנות ב-JSON.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                שם טאב הזמנות ראשי:
              </label>
              <input
                type="text"
                value={ordersTabName}
                onChange={(e) => setOrdersTabName(e.target.value)}
                disabled={!canManageSystem}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500 disabled:opacity-60"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                שם טאב מילון לוגיסטי ומק"טים:
              </label>
              <input
                type="text"
                value={logisticsDictTabName}
                onChange={(e) => setLogisticsDictTabName(e.target.value)}
                disabled={!canManageSystem}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500 disabled:opacity-60"
                required
              />
            </div>
          </div>
        </div>

        {/* Column Mapping Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Table className="w-4 h-4 text-emerald-400" />
                <span>טבלת מיפוי עמודות (Column Mapping Engine)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                התאמת שדות המערכת (SabanOS) לאותיות העמודה בגיליון Google Sheets
              </p>
            </div>
            <span className="text-xs text-slate-400 font-mono">{columns.length} שדות ממופים</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-bold">
                  <th className="pb-3 pr-2">שדה מערכת (SabanOS Key)</th>
                  <th className="pb-3">תווית בעברית</th>
                  <th className="pb-3">עמודה ב-Sheets</th>
                  <th className="pb-3">סוג נתון</th>
                  <th className="pb-3">ערך לדוגמה</th>
                  <th className="pb-3">חובה?</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {columns.map((col) => (
                  <tr key={col.systemKey} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 pr-2 font-mono text-sky-400 font-bold">{col.systemKey}</td>
                    <td className="py-3 font-medium text-white">{col.labelHebrew}</td>
                    <td className="py-3">
                      <input
                        type="text"
                        maxLength={2}
                        value={col.sheetColumn}
                        onChange={(e) => handleColumnChange(col.systemKey, e.target.value)}
                        disabled={!canManageSystem}
                        className="w-14 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-center font-mono font-black text-amber-400 focus:outline-none focus:border-sky-500 disabled:opacity-60"
                      />
                    </td>
                    <td className="py-3 text-slate-400">
                      <span className="bg-slate-800 px-2 py-0.5 rounded text-[11px] font-mono">
                        {col.type}
                      </span>
                    </td>
                    <td className="py-3 text-slate-400 font-mono text-[11px]">
                      {col.exampleValue}
                    </td>
                    <td className="py-3">
                      {col.required ? (
                        <span className="text-rose-400 font-bold text-[11px]">חובה</span>
                      ) : (
                        <span className="text-slate-500 text-[11px]">אופציונלי</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Submit Button */}
          {canManageSystem && (
            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/30 transition-all"
              >
                <Save className="w-4 h-4" />
                <span>שמור מיפוי עמודות (Live Apply)</span>
              </button>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
