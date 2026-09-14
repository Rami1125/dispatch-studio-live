import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type {
  AlertLevel,
  DataSourceMode,
  DispatchState,
  NoaAlert,
  Order,
  OrderStatus,
} from "@/types/dispatch";
import {
  DEFAULT_SHEET_URL,
  DRIVERS,
  WAREHOUSES,
  fetchOrdersFromSheet,
  getMockOrders,
} from "@/services/sheetsService";

interface DispatchContextValue extends DispatchState {
  /* studio */
  isStudioOpen: boolean;
  openStudio: () => void;
  closeStudio: () => void;
  toggleStudio: () => void;
  selectedOrderId: string | null;
  selectOrder: (orderId: string | null) => void;

  /* draft editing */
  updateOrder: (orderId: string, patch: Partial<Order>) => void;
  setOrderStatus: (orderId: string, status: OrderStatus) => void;
  toggleItemApproval: (orderId: string, sku: string) => void;
  approveAllItems: (orderId: string, approved: boolean) => void;
  updateItemQuantity: (orderId: string, sku: string, quantity: number) => void;

  /* broadcast */
  publish: () => void;
  discardDraft: () => void;

  /* alerts */
  pushAlert: (message: string, level?: AlertLevel, isFlash?: boolean) => void;
  dismissFlash: () => void;
  removeAlert: (id: string) => void;

  /* data source */
  setSourceMode: (mode: DataSourceMode) => void;
  setSheetUrl: (url: string) => void;
  setPollingSeconds: (seconds: number) => void;
  syncNow: () => Promise<void>;

  /* derived */
  focusOrder: Order | null;
  counts: Record<OrderStatus, number>;
}

const DispatchContext = createContext<DispatchContextValue | null>(null);

const clone = (orders: Order[]): Order[] => JSON.parse(JSON.stringify(orders)) as Order[];

const uid = () => Math.random().toString(36).slice(2, 10);

function minutesUntil(targetTime: string, now: Date): number {
  const [h, m] = targetTime.split(":").map((n) => Number(n));
  if (!Number.isFinite(h)) return Number.POSITIVE_INFINITY;
  const target = new Date(now);
  target.setHours(h ?? 0, m ?? 0, 0, 0);
  return Math.round((target.getTime() - now.getTime()) / 60000);
}

export function DispatchProvider({ children }: { children: ReactNode }) {
  const initial = useMemo(() => getMockOrders(), []);
  const [published, setPublished] = useState<Order[]>(initial);
  const [draft, setDraft] = useState<Order[]>(() => clone(initial));
  const [alerts, setAlerts] = useState<NoaAlert[]>([]);
  const [flash, setFlash] = useState<NoaAlert | null>(null);
  const [isStudioOpen, setStudioOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [sourceMode, setSourceModeState] = useState<DataSourceMode>("mock");
  const [sheetUrl, setSheetUrlState] = useState("");
  const [pollingSeconds, setPollingSecondsState] = useState(45);
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<DispatchState["syncStatus"]>("idle");
  const [syncError, setSyncError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ---------------- alerts ---------------- */
  const pushAlert = useCallback((message: string, level: AlertLevel = "info", isFlash = false) => {
    const alert: NoaAlert = {
      id: uid(),
      level,
      message,
      createdAt: new Date().toISOString(),
      isFlash,
      durationMs: 9000,
    };
    setAlerts((prev) => [alert, ...prev].slice(0, 12));
    if (isFlash) {
      setFlash(alert);
      if (flashTimer.current) clearTimeout(flashTimer.current);
      flashTimer.current = setTimeout(() => setFlash(null), alert.durationMs);
    }
  }, []);

  const dismissFlash = useCallback(() => {
    if (flashTimer.current) clearTimeout(flashTimer.current);
    setFlash(null);
  }, []);

  const removeAlert = useCallback((id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  }, []);

  /* ---------------- draft editing ---------------- */
  const mutateDraft = useCallback((fn: (orders: Order[]) => Order[]) => {
    setDraft((prev) => fn(clone(prev)));
    setIsDirty(true);
  }, []);

  const updateOrder = useCallback(
    (orderId: string, patch: Partial<Order>) => {
      mutateDraft((orders) =>
        orders.map((o) =>
          o.orderId === orderId ? { ...o, ...patch, updatedAt: new Date().toISOString() } : o,
        ),
      );
    },
    [mutateDraft],
  );

  const setOrderStatus = useCallback(
    (orderId: string, status: OrderStatus) => {
      updateOrder(orderId, { status });
    },
    [updateOrder],
  );

  const toggleItemApproval = useCallback(
    (orderId: string, sku: string) => {
      mutateDraft((orders) =>
        orders.map((o) =>
          o.orderId === orderId
            ? {
                ...o,
                items: o.items.map((it) =>
                  it.sku === sku ? { ...it, isApproved: !it.isApproved } : it,
                ),
              }
            : o,
        ),
      );
    },
    [mutateDraft],
  );

  const approveAllItems = useCallback(
    (orderId: string, approved: boolean) => {
      mutateDraft((orders) =>
        orders.map((o) =>
          o.orderId === orderId
            ? { ...o, items: o.items.map((it) => ({ ...it, isApproved: approved })) }
            : o,
        ),
      );
    },
    [mutateDraft],
  );

  const updateItemQuantity = useCallback(
    (orderId: string, sku: string, quantity: number) => {
      mutateDraft((orders) =>
        orders.map((o) =>
          o.orderId === orderId
            ? {
                ...o,
                items: o.items.map((it) =>
                  it.sku === sku ? { ...it, quantity: Math.max(0, quantity) } : it,
                ),
              }
            : o,
        ),
      );
    },
    [mutateDraft],
  );

  /* ---------------- broadcast ---------------- */
  const publish = useCallback(() => {
    setPublished(clone(draft));
    setIsDirty(false);
    pushAlert("עודכן שידור חי — לוח ההזמנות רוענן", "success");
  }, [draft, pushAlert]);

  const discardDraft = useCallback(() => {
    setDraft(clone(published));
    setIsDirty(false);
  }, [published]);

  /* ---------------- data source ---------------- */
  const STORAGE_KEY = "saban-dispatch-source";
  const isDirtyRef = useRef(false);
  isDirtyRef.current = isDirty;
  const failures = useRef(0);

  /** מדווח בקול על שינויי סטטוס ומק"טים שהגיעו מהגיליון */
  const announceChanges = useCallback(
    (prev: Order[], next: Order[]) => {
      const prevById = new Map(prev.map((o) => [o.orderId, o]));
      next.forEach((order) => {
        const before = prevById.get(order.orderId);
        if (!before) {
          pushAlert(`הזמנה חדשה מהגיליון — ${order.orderId} ${order.customerName}`, "info");
          return;
        }
        if (before.status !== order.status) {
          pushAlert(
            `סטטוס עודכן — הזמנה ${order.orderId} ${order.customerName}: ${order.status}`,
            order.status === "בהעמסה" ? "warning" : "success",
          );
        }
        const beforeSkus = new Set(before.items.map((i) => i.sku));
        const added = order.items.filter((i) => !beforeSkus.has(i.sku));
        if (added.length > 0) {
          pushAlert(
            `נוספו ${added.length} מק"טים להזמנה ${order.orderId} (${added
              .map((i) => i.sku)
              .join(", ")})`,
            "info",
          );
        }
        const beforeApproved = before.items.filter((i) => i.isApproved).length;
        const nowApproved = order.items.filter((i) => i.isApproved).length;
        if (nowApproved > beforeApproved) {
          pushAlert(
            `אושרו ${nowApproved - beforeApproved} מק"טים נוספים בהזמנה ${order.orderId}`,
            "success",
          );
        }
      });
    },
    [pushAlert],
  );

  const syncNow = useCallback(async () => {
    setSyncStatus("syncing");
    setSyncError(null);
    try {
      const orders =
        sourceMode === "sheets" && sheetUrl
          ? await fetchOrdersFromSheet(sheetUrl)
          : getMockOrders();
      setPublished((prev) => {
        announceChanges(prev, orders);
        return orders;
      });
      // שומר על עריכות פתוחות בסטודיו; אחרת הטיוטה נשארת זהה לשידור
      if (!isDirtyRef.current) setDraft(clone(orders));
      setLastSyncAt(new Date().toISOString());
      setSyncStatus("ok");
      failures.current = 0;
    } catch (err) {
      failures.current += 1;
      setSyncStatus("error");
      setSyncError(err instanceof Error ? err.message : "שגיאת סנכרון לא ידועה");
      if (failures.current <= 2) {
        pushAlert("הסנכרון מול גיליון דשבורד_הזמנות נכשל", "critical");
      }
    }
  }, [sourceMode, sheetUrl, pushAlert, announceChanges]);

  const setSourceMode = useCallback((mode: DataSourceMode) => {
    setSourceModeState(mode);
    setSyncStatus("idle");
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const cfg = raw ? JSON.parse(raw) : {};
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...cfg, sourceMode: mode }));
    } catch {
      /* אחסון מקומי לא זמין */
    }
  }, []);

  const setSheetUrl = useCallback((url: string) => {
    setSheetUrlState(url);
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const cfg = raw ? JSON.parse(raw) : {};
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...cfg, sheetUrl: url }));
    } catch {
      /* אחסון מקומי לא זמין */
    }
  }, []);

  const setPollingSeconds = useCallback((seconds: number) => {
    const safe = Math.min(600, Math.max(30, seconds || 45));
    setPollingSecondsState(safe);
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const cfg = raw ? JSON.parse(raw) : {};
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...cfg, pollingSeconds: safe }));
    } catch {
      /* אחסון מקומי לא זמין */
    }
  }, []);

  // טעינת הגדרות שמורות והפעלה אוטומטית של הסנכרון החי
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const cfg = JSON.parse(raw) as Partial<{
        sourceMode: DataSourceMode;
        sheetUrl: string;
        pollingSeconds: number;
      }>;
      if (typeof cfg.sheetUrl === "string") setSheetUrlState(cfg.sheetUrl);
      if (typeof cfg.pollingSeconds === "number") setPollingSecondsState(cfg.pollingSeconds);
      if (cfg.sourceMode === "sheets" && cfg.sheetUrl) setSourceModeState("sheets");
    } catch {
      /* אחסון מקומי לא זמין */
    }
  }, []);

  // polling — משיכה אוטומטית מהגיליון
  useEffect(() => {
    if (sourceMode !== "sheets" || !sheetUrl) return;
    failures.current = 0;
    void syncNow();
    const id = setInterval(() => void syncNow(), Math.max(30, pollingSeconds) * 1000);
    const onVisible = () => {
      if (document.visibilityState === "visible") void syncNow();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceMode, sheetUrl, pollingSeconds]);

  /* ---------------- Noa AI automatic insights ---------------- */
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      published.forEach((order) => {
        if (order.status === "סופק") return;
        const mins = minutesUntil(order.targetTime, now);
        if (mins > 0 && mins <= 30) {
          setAlerts((prev) => {
            const key = `eta-${order.orderId}`;
            if (prev.some((a) => a.id === key)) return prev;
            return [
              {
                id: key,
                level: (mins <= 15 ? "critical" : "warning") as AlertLevel,
                message: `נותרו ${mins} דקות ליעד — הזמנה ${order.orderId} ל${order.customerName} (${order.city})`,
                createdAt: now.toISOString(),
              },
              ...prev,
            ].slice(0, 12);
          });
        }
      });
    };
    tick();
    const id = setInterval(tick, 60000);
    return () => clearInterval(id);
  }, [published]);

  /* ---------------- keyboard shortcuts ---------------- */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && (e.key === "E" || e.key === "e")) {
        e.preventDefault();
        setStudioOpen((v) => !v);
      }
      if (e.key === "Escape") {
        setStudioOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  /* ---------------- derived ---------------- */
  const focusOrder = useMemo(
    () => published.find((o) => o.status === "בהעמסה") ?? null,
    [published],
  );

  const counts = useMemo(() => {
    const base: Record<OrderStatus, number> = {
      ממתין: 0,
      בהעמסה: 0,
      "יצא לדרך": 0,
      סופק: 0,
    };
    published.forEach((o) => {
      base[o.status] += 1;
    });
    return base;
  }, [published]);

  const value: DispatchContextValue = {
    published,
    draft,
    alerts,
    flash,
    drivers: DRIVERS,
    warehouses: WAREHOUSES,
    sourceMode,
    sheetUrl,
    pollingSeconds,
    lastSyncAt,
    syncStatus,
    syncError,
    isDirty,
    isStudioOpen,
    openStudio: () => setStudioOpen(true),
    closeStudio: () => setStudioOpen(false),
    toggleStudio: () => setStudioOpen((v) => !v),
    selectedOrderId,
    selectOrder: setSelectedOrderId,
    updateOrder,
    setOrderStatus,
    toggleItemApproval,
    approveAllItems,
    updateItemQuantity,
    publish,
    discardDraft,
    pushAlert,
    dismissFlash,
    removeAlert,
    setSourceMode,
    setSheetUrl,
    setPollingSeconds,
    syncNow,
    focusOrder,
    counts,
  };

  return <DispatchContext.Provider value={value}>{children}</DispatchContext.Provider>;
}

export function useDispatchBoard() {
  const ctx = useContext(DispatchContext);
  if (!ctx) throw new Error("useDispatchBoard must be used inside DispatchProvider");
  return ctx;
}
