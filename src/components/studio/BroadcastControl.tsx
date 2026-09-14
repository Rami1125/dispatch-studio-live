import { Database, MonitorPlay, RefreshCw, RotateCcw, Sheet } from "lucide-react";
import { useDispatchBoard } from "@/context/DispatchContext";
import { cn } from "@/lib/utils";

export function BroadcastControl() {
  const {
    publish,
    discardDraft,
    isDirty,
    sourceMode,
    setSourceMode,
    sheetUrl,
    setSheetUrl,
    pollingSeconds,
    setPollingSeconds,
    syncNow,
    syncStatus,
    syncError,
    lastSyncAt,
  } = useDispatchBoard();

  return (
    <section className="space-y-3">
      <h3 className="flex items-center gap-2 text-base font-black text-foreground">
        <MonitorPlay className="size-4 text-primary" /> שליטת שידור
      </h3>

      <div className="flex gap-2">
        <button
          onClick={publish}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-base font-black transition",
            isDirty
              ? "bg-primary text-primary-foreground hover:bg-primary/90"
              : "bg-secondary text-muted-foreground",
          )}
        >
          <MonitorPlay className="size-5" />
          שדר לטלוויזיה
        </button>
        <button
          onClick={discardDraft}
          className="flex items-center gap-2 rounded-xl bg-secondary px-3 py-3 text-sm font-bold text-muted-foreground transition hover:text-foreground"
        >
          <RotateCcw className="size-4" /> בטל
        </button>
      </div>
      <p className="text-xs font-semibold text-muted-foreground">
        {isDirty ? "יש שינויים בטיוטה שטרם שודרו למסך" : "המסך החי מסונכרן עם הטיוטה"}
      </p>

      <div className="space-y-2 rounded-xl border border-border/80 bg-card p-3">
        <div className="text-sm font-black text-foreground">מקור נתונים</div>
        <div className="flex gap-1">
          <button
            onClick={() => setSourceMode("mock")}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-bold transition",
              sourceMode === "mock"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground",
            )}
          >
            <Database className="size-4" /> נתוני הדגמה
          </button>
          <button
            onClick={() => setSourceMode("sheets")}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-bold transition",
              sourceMode === "sheets"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground",
            )}
          >
            <Sheet className="size-4" /> גיליון חי
          </button>
        </div>

        {sourceMode === "sheets" && (
          <div className="space-y-2">
            <input
              value={sheetUrl}
              onChange={(e) => setSheetUrl(e.target.value)}
              placeholder="קישור לגיליון דשבורד_הזמנות"
              dir="ltr"
              className="w-full rounded-lg border border-input bg-background px-2 py-1.5 text-xs font-semibold text-foreground outline-none focus:border-primary"
            />
            <label className="flex items-center justify-between text-xs font-bold text-muted-foreground">
              תדירות משיכה (שניות)
              <input
                type="number"
                min={30}
                max={600}
                value={pollingSeconds}
                onChange={(e) => setPollingSeconds(Number(e.target.value) || 45)}
                className="w-20 rounded-lg border border-input bg-background px-2 py-1 text-center text-sm font-black tabular-nums text-foreground outline-none focus:border-primary"
              />
            </label>
          </div>
        )}

        <button
          onClick={() => void syncNow()}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-secondary px-3 py-2 text-sm font-bold text-foreground transition hover:bg-secondary/70"
        >
          <RefreshCw className={cn("size-4", syncStatus === "syncing" && "animate-spin")} />
          סנכרן עכשיו
        </button>

        {syncError && <p className="text-xs font-bold text-destructive">{syncError}</p>}
        {lastSyncAt && (
          <p className="text-[11px] font-semibold text-muted-foreground">
            סונכרן לאחרונה: {new Date(lastSyncAt).toLocaleTimeString("he-IL")}
          </p>
        )}
      </div>
    </section>
  );
}
