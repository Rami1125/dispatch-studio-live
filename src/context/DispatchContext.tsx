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
  StatusSyncRecord,
} from "@/types/dispatch";
import type {
  ScreensaverSettings,
  ScheduledBroadcast,
  AITrainingSettings,
} from "@/types/screensaver";
import {
  DEFAULT_SHEET_URL,
  DRIVERS,
  WAREHOUSES,
  fetchOrdersFromSheet,
  getMockOrders,
  updateSheetOrderStatus,
  testSheetWebhookConnection,
} from "@/services/sheetsService";

const DEFAULT_SCREENSAVER_SETTINGS: ScreensaverSettings = {
  isEnabled: true,
  idleTimeoutSeconds: 90, // 90 שניות של חוסר פעילות
  minOrderGapMinutes: 45, // אם ההזמנה הקרובה רחוקה מ-45 דקות או שאין הזמנות
  activeMode: "mixed",
  autoCycle: true,
  cycleIntervalSeconds: 12,
  videoSource: "warehouse-ambient",
  videoMuted: true,
  autoVideoOnLull: true,
};

const DEFAULT_AI_TRAINING: AITrainingSettings = {
  focusMode: "safety",
  customPromptRule: "תעדוף בטיחות בהעמסת שקי בלה ומשטחי סבן, והתראה על עומסים בצירים 1 ו-40",
  temperature: 0.3,
  autoPushToTV: true,
};

const DEFAULT_SCHEDULED_MESSAGES: ScheduledBroadcast[] = [
  {
    id: "sch-1",
    time: "07:30",
    target: "all",
    title: "תדריך בוקר",
    content: "בדיקת שמן ומים במשאיות מנוף, ספירת מלאי שקי בלה במחסן 7",
    isActive: true,
  },
  {
    id: "sch-2",
    time: "11:30",
    target: "warehouse",
    title: "הכנת סבב 2",
    content: "ריכוז משטחי סבן 60060 ברציף העמסה מרכזי",
    isActive: true,
  },
  {
    id: "sch-3",
    time: "13:30",
    target: "driver",
    title: "עומסי צהריים",
    content: "הימנעות מכביש 40, עדיפות לציר 431 לכיוון רמלה וראשל״צ",
    isActive: true,
  },
  {
    id: "sch-4",
    time: "16:00",
    target: "all",
    title: "סיכום יומי",
    content: "קשירת רצועות, נעילת שער מחסן 1 ובדיקת תעודות משלוח",
    isActive: true,
  },
];

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
  quickUpdateStatus: (orderId: string, status: OrderStatus) => void;
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

  /* data source & sheets write-back */
  setSourceMode: (mode: DataSourceMode) => void;
  setSheetUrl: (url: string) => void;
  setWebhookUrl: (url: string) => void;
  setPollingSeconds: (seconds: number) => void;
  syncNow: () => Promise<void>;
  syncStatusToSheet: (orderId: string, status: OrderStatus) => Promise<boolean>;
  syncAllStatusesToSheet: () => Promise<void>;
  testSheetWriteConnection: () => Promise<{ success: boolean; message: string }>;

  /* screensaver */
  isScreensaverActive: boolean;
  setScreensaverActive: (active: boolean) => void;
  screensaverSettings: ScreensaverSettings;
  updateScreensaverSettings: (patch: Partial<ScreensaverSettings>) => void;
  nearestOrderMinutesRemaining: number | null;
  idleSecondsCount: number;

  /* AI model training & dispatching */
  aiTraining: AITrainingSettings;
  updateAITraining: (patch: Partial<AITrainingSettings>) => void;
  scheduledMessages: ScheduledBroadcast[];
  addScheduledMessage: (msg: Omit<ScheduledBroadcast, "id">) => void;
  toggleScheduledMessage: (id: string, active: boolean) => void;
  deleteScheduledMessage: (id: string) => void;
  targetedBriefings: {
    forWarehouse: string;
    forDriver: string;
    scheduledNotice: string;
    trafficAdvice: string;
    updatedAt: string;
  };
  generateAIBriefing: (customPrompt?: string) => Promise<void>;
  isGeneratingAI: boolean;

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
  const [sourceMode, setSourceModeState] = useState<DataSourceMode>("sheets");
  const [sheetUrl, setSheetUrlState] = useState(DEFAULT_SHEET_URL);
  const [pollingSeconds, setPollingSecondsState] = useState(45);
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<DispatchState["syncStatus"]>("idle");
  const [syncError, setSyncError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  /* ---------------- screensaver state ---------------- */
  const [isScreensaverActive, setScreensaverActive] = useState(false);
  const [screensaverSettings, setScreensaverSettings] = useState<ScreensaverSettings>(() => {
    try {
      const raw = localStorage.getItem("saban-screensaver-cfg");
      return raw
        ? { ...DEFAULT_SCREENSAVER_SETTINGS, ...JSON.parse(raw) }
        : DEFAULT_SCREENSAVER_SETTINGS;
    } catch {
      return DEFAULT_SCREENSAVER_SETTINGS;
    }
  });
  const [idleSecondsCount, setIdleSecondsCount] = useState(0);
  const lastInteractionTime = useRef(Date.now());

  /* ---------------- AI model & schedule state ---------------- */
  const [aiTraining, setAiTraining] = useState<AITrainingSettings>(() => {
    try {
      const raw = localStorage.getItem("saban-ai-training-cfg");
      return raw ? { ...DEFAULT_AI_TRAINING, ...JSON.parse(raw) } : DEFAULT_AI_TRAINING;
    } catch {
      return DEFAULT_AI_TRAINING;
    }
  });
  const [scheduledMessages, setScheduledMessages] = useState<ScheduledBroadcast[]>(() => {
    try {
      const raw = localStorage.getItem("saban-scheduled-broadcasts");
      return raw ? JSON.parse(raw) : DEFAULT_SCHEDULED_MESSAGES;
    } catch {
      return DEFAULT_SCHEDULED_MESSAGES;
    }
  });
  const [targetedBriefings, setTargetedBriefings] = useState({
    forWarehouse: "לתעדף העמסת שקי בלה צמוד לקבינה ולאחריהם משטחי סבן 60060.",
    forDriver: "עומס בכביש 1 לכיוון שער הגיא (14 דק' עיכוב). מומלץ שימוש בציר 431.",
    scheduledNotice: "הכנת סבב הבא: וידוא תעודות משלוח חתומות עם המנופאי.",
    trafficAdvice: "כביש 6 וכביש 4 זורמים חלק. כביש 40 פקוק מצומת אחיסמך.",
    updatedAt: "08:15",
  });
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  const updateScreensaverSettings = useCallback((patch: Partial<ScreensaverSettings>) => {
    setScreensaverSettings((prev) => {
      const next = { ...prev, ...patch };
      try {
        localStorage.setItem("saban-screensaver-cfg", JSON.stringify(next));
      } catch {
        /* storage unavailable */
      }
      return next;
    });
  }, []);

  const updateAITraining = useCallback((patch: Partial<AITrainingSettings>) => {
    setAiTraining((prev) => {
      const next = { ...prev, ...patch };
      try {
        localStorage.setItem("saban-ai-training-cfg", JSON.stringify(next));
      } catch {
        /* storage unavailable */
      }
      return next;
    });
  }, []);

  const addScheduledMessage = useCallback((msg: Omit<ScheduledBroadcast, "id">) => {
    setScheduledMessages((prev) => {
      const next = [...prev, { ...msg, id: `sch-${uid()}` }];
      try {
        localStorage.setItem("saban-scheduled-broadcasts", JSON.stringify(next));
      } catch {
        /* storage unavailable */
      }
      return next;
    });
  }, []);

  const toggleScheduledMessage = useCallback((id: string, active: boolean) => {
    setScheduledMessages((prev) => {
      const next = prev.map((m) => (m.id === id ? { ...m, isActive: active } : m));
      try {
        localStorage.setItem("saban-scheduled-broadcasts", JSON.stringify(next));
      } catch {
        /* storage unavailable */
      }
      return next;
    });
  }, []);

  const deleteScheduledMessage = useCallback((id: string) => {
    setScheduledMessages((prev) => {
      const next = prev.filter((m) => m.id !== id);
      try {
        localStorage.setItem("saban-scheduled-broadcasts", JSON.stringify(next));
      } catch {
        /* storage unavailable */
      }
      return next;
    });
  }, []);

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

  const quickUpdateStatus = useCallback(
    (orderId: string, status: OrderStatus) => {
      const nowIso = new Date().toISOString();
      setPublished((prev) =>
        prev.map((o) => (o.orderId === orderId ? { ...o, status, updatedAt: nowIso } : o)),
      );
      setDraft((prev) =>
        prev.map((o) => (o.orderId === orderId ? { ...o, status, updatedAt: nowIso } : o)),
      );
      pushAlert(`הזמנה #${orderId} עודכנה ישירות לסטטוס: ${status}`, "info");
    },
    [pushAlert],
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
      if (cfg.sourceMode === "mock") setSourceModeState("mock");
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

  /* ---------------- AI briefing generator ---------------- */
  const generateAIBriefing = useCallback(
    async (customPrompt?: string) => {
      setIsGeneratingAI(true);
      try {
        const busiestWh = [...WAREHOUSES].sort((a, b) => b.loadRatio - a.loadRatio)[0];
        const res = await fetch("/api/ai/insights", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            prompt: customPrompt || aiTraining.customPromptRule,
            trainingFocus: aiTraining.focusMode,
            contextData: {
              activeOrdersCount: published.length,
              loadingOrdersCount: published.filter((o) => o.status === "בהעמסה").length,
              busiestWarehouse: busiestWh
                ? `${busiestWh.name} (${Math.round(busiestWh.loadRatio * 100)}%)`
                : "מחסן 7",
              trafficSummary: "עומס בכביש 1 לכיוון שער הגיא ועומס בציר 40",
              totalWeightKg: published.reduce(
                (s, o) => s + o.logisticsMetrics.estimatedWeightKg,
                0,
              ),
            },
          }),
        });

        if (res.ok) {
          const data = (await res.json()) as {
            message?: string;
            roleSpecificBriefing?: {
              forWarehouse?: string;
              forDriver?: string;
              scheduledNotice?: string;
            };
            trafficAdvice?: string;
            suggestedLevel?: AlertLevel;
          };

          setTargetedBriefings({
            forWarehouse:
              data.roleSpecificBriefing?.forWarehouse ||
              "לתעדף העמסת שקי בלה צמוד לקבינה ולאחריהם משטחי סבן 60060.",
            forDriver:
              data.roleSpecificBriefing?.forDriver ||
              "עומס בכביש 1 לכיוון שער הגיא (14 דק' עיכוב). מומלץ שימוש בציר 431.",
            scheduledNotice:
              data.roleSpecificBriefing?.scheduledNotice ||
              "הכנת סבב הבא: וידוא תעודות משלוח חתומות עם המנופאי.",
            trafficAdvice:
              data.trafficAdvice || "כביש 6 וכביש 4 זורמים חלק. כביש 40 פקוק מצומת אחיסמך.",
            updatedAt: new Date().toLocaleTimeString("he-IL", {
              hour: "2-digit",
              minute: "2-digit",
            }),
          });

          if (data.message) {
            pushAlert(data.message, data.suggestedLevel || "info");
          }
        }
      } catch (err) {
        console.warn("AI generation failed, fallback remains active:", err);
      } finally {
        setIsGeneratingAI(false);
      }
    },
    [aiTraining, published, pushAlert],
  );

  /* ---------------- scheduled messages ticker ---------------- */
  useEffect(() => {
    const checkSchedule = () => {
      const now = new Date();
      const currentClock = now.toLocaleTimeString("he-IL", {
        hour: "2-digit",
        minute: "2-digit",
      });
      setScheduledMessages((prev) =>
        prev.map((msg) => {
          if (msg.isActive && msg.time === currentClock && !msg.isTriggered) {
            pushAlert(`[הודעה מתוזמנת - ${msg.title}]: ${msg.content}`, "info");
            return { ...msg, isTriggered: true };
          }
          return msg;
        }),
      );
    };

    const timer = setInterval(checkSchedule, 20000);
    return () => clearInterval(timer);
  }, [pushAlert]);

  /* ---------------- nearest order distance & screensaver trigger ---------------- */
  const nearestOrderMinutesRemaining = useMemo(() => {
    const activeOrders = published.filter((o) => o.status === "ממתין" || o.status === "בהעמסה");
    if (activeOrders.length === 0) return 999; // No immediate order in queue

    const now = new Date();
    let minMinutes = Number.POSITIVE_INFINITY;
    for (const o of activeOrders) {
      const diff = minutesUntil(o.targetTime, now);
      if (diff >= 0 && diff < minMinutes) {
        minMinutes = diff;
      }
    }
    return Number.isFinite(minMinutes) ? minMinutes : 999;
  }, [published]);

  // Idle and gap monitoring
  useEffect(() => {
    const onUserAction = () => {
      lastInteractionTime.current = Date.now();
    };

    window.addEventListener("mousemove", onUserAction);
    window.addEventListener("mousedown", onUserAction);
    window.addEventListener("keydown", onUserAction);
    window.addEventListener("touchstart", onUserAction);
    window.addEventListener("wheel", onUserAction);

    return () => {
      window.removeEventListener("mousemove", onUserAction);
      window.removeEventListener("mousedown", onUserAction);
      window.removeEventListener("keydown", onUserAction);
      window.removeEventListener("touchstart", onUserAction);
      window.removeEventListener("wheel", onUserAction);
    };
  }, []);

  useEffect(() => {
    if (!screensaverSettings.isEnabled) return;

    const interval = setInterval(() => {
      const idleSec = Math.floor((Date.now() - lastInteractionTime.current) / 1000);
      setIdleSecondsCount(idleSec);

      // Trigger condition 1: Inactivity timeout reached
      const isIdleExceeded =
        screensaverSettings.idleTimeoutSeconds > 0 &&
        idleSec >= screensaverSettings.idleTimeoutSeconds;

      // Trigger condition 2: Nearest order is far beyond minimum threshold (e.g. > 45 minutes or queue is empty)
      // and user is idle for at least 15 seconds so as not to interrupt ongoing typing
      const isOrderGapExceeded =
        screensaverSettings.minOrderGapMinutes > 0 &&
        nearestOrderMinutesRemaining !== null &&
        nearestOrderMinutesRemaining >= screensaverSettings.minOrderGapMinutes &&
        idleSec >= 15;

      if ((isIdleExceeded || isOrderGapExceeded) && !isScreensaverActive && !isStudioOpen) {
        setScreensaverActive(true);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [screensaverSettings, nearestOrderMinutesRemaining, isScreensaverActive, isStudioOpen]);

  /* ---------------- keyboard shortcuts ---------------- */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && (e.key === "E" || e.key === "e")) {
        e.preventDefault();
        setStudioOpen((v) => !v);
      }
      if (e.key === "Escape") {
        if (isScreensaverActive) {
          setScreensaverActive(false);
          lastInteractionTime.current = Date.now();
        } else {
          setStudioOpen(false);
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isScreensaverActive]);

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
    quickUpdateStatus,
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
    /* screensaver */
    isScreensaverActive,
    setScreensaverActive,
    screensaverSettings,
    updateScreensaverSettings,
    nearestOrderMinutesRemaining,
    idleSecondsCount,
    /* AI */
    aiTraining,
    updateAITraining,
    scheduledMessages,
    addScheduledMessage,
    toggleScheduledMessage,
    deleteScheduledMessage,
    targetedBriefings,
    generateAIBriefing,
    isGeneratingAI,
  };

  return <DispatchContext.Provider value={value}>{children}</DispatchContext.Provider>;
}

export function useDispatchBoard() {
  const ctx = useContext(DispatchContext);
  if (!ctx) throw new Error("useDispatchBoard must be used inside DispatchProvider");
  return ctx;
}
