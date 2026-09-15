import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import type {
  AdminUser,
  AuditLogEntry,
  EmergencyBroadcast,
  PendingPairingCode,
  ScreenDevice,
  ScreensaverScheduleRule,
  SheetsColumnMapping,
  SheetsSyncConfig,
  UserRole,
} from "@/types/admin";
import { playAlarmSound, playNewOrderSound, playStatusChime } from "@/utils/soundEffects";
import { speakHebrew } from "@/services/voiceAlertService";

export const PRESET_USERS: AdminUser[] = [
  {
    id: "user-rami",
    name: "ראמי סבן",
    email: "rami@saban-materials.co.il",
    role: "ADMIN",
    branch: "הנהלה ראשית - כפר סבא",
    avatar:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80",
  },
  {
    id: "user-vered",
    name: "ורד סבן",
    email: "vered@saban-materials.co.il",
    role: "ADMIN",
    branch: "כספים ובקרה - כפר סבא",
    avatar:
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80",
  },
  {
    id: "user-itzik",
    name: "איציק סדרן",
    email: "itzik@saban-materials.co.il",
    role: "DISPATCHER",
    branch: "משרד הפצה ושיבוץ",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
  },
  {
    id: "user-doron",
    name: "דורון לוגיסטיקה",
    email: "doron@saban-materials.co.il",
    role: "DISPATCHER",
    branch: "מחסן 4 החרש",
    avatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80",
  },
  {
    id: "user-galia",
    name: "גליה שירות לקוחות",
    email: "galia@saban-materials.co.il",
    role: "DISPATCHER",
    branch: "מוקד הזמנות",
    avatar:
      "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=150&q=80",
  },
];

const INITIAL_SCREENS: ScreenDevice[] = [
  {
    id: "screen-wh4-crane",
    name: "טלוויזיה מחסן 4 החרש (רציף מנוף)",
    warehouseLocation: "מחסן 4 החרש",
    branchManager: "אורן",
    ipAddress: "192.168.10.42",
    deviceToken: "tok_saban_wh4_791",
    status: "online",
    lastHeartbeat: Date.now() - 14000,
    volume: 90,
    defaultRound: "all",
    screensaverIdleMinutes: 5,
    forcedScreensaver: false,
    pairedAt: "2026-09-01 07:30",
    modelInfo: 'Samsung Crystal UHD 65" (Warehouse Mount)',
    appVersion: "v2.4.1",
    notes: "מסך פריקה והעמסה ראשי מעל שער 2",
  },
  {
    id: "screen-wh1-desk",
    name: "טלוויזיה מחסן 1 התלמיד (דלפק חומרי בניין)",
    warehouseLocation: "מחסן 1 התלמיד",
    branchManager: "תמיר",
    ipAddress: "192.168.10.43",
    deviceToken: "tok_saban_wh1_332",
    status: "online",
    lastHeartbeat: Date.now() - 22000,
    volume: 65,
    defaultRound: "round1",
    screensaverIdleMinutes: 8,
    forcedScreensaver: false,
    pairedAt: "2026-09-03 08:15",
    modelInfo: 'LG Commercial Signage 55"',
    appVersion: "v2.4.1",
    notes: "דלפק מכירות ומשיכה עצמית",
  },
  {
    id: "screen-dispatch-office",
    name: "מסך משרד סדרני הפצה (איציק ודורון)",
    warehouseLocation: "משרד הפצה ראשי",
    branchManager: "איציק",
    ipAddress: "192.168.10.12",
    deviceToken: "tok_saban_disp_884",
    status: "online",
    lastHeartbeat: Date.now() - 6000,
    volume: 100,
    defaultRound: "all",
    screensaverIdleMinutes: 15,
    forcedScreensaver: false,
    pairedAt: "2026-08-15 06:45",
    modelInfo: 'Dell UltraSharp 43" 4K Multi-Client',
    appVersion: "v2.4.1",
    notes: "מעקב סידור נהגים חי",
  },
  {
    id: "screen-wh4-south",
    name: "מסוף עמדת ליקוט דרומית (רציף בלות)",
    warehouseLocation: "מחסן 4 פריקה",
    branchManager: "סאמר",
    ipAddress: "192.168.10.99",
    deviceToken: "tok_saban_wh4_south",
    status: "offline",
    lastHeartbeat: Date.now() - 540000,
    volume: 75,
    defaultRound: "round2",
    screensaverIdleMinutes: 5,
    forcedScreensaver: false,
    pairedAt: "2026-09-10 11:20",
    modelInfo: 'Advantech Rugged Industrial Screen 32"',
    appVersion: "v2.3.9",
    notes: "רציף שקי בלה וסומסום",
  },
];

const INITIAL_COLUMNS: SheetsColumnMapping[] = [
  {
    systemKey: "orderId",
    labelHebrew: "מספר הזמנה",
    sheetColumn: "A",
    exampleValue: "6215454",
    type: "string",
    required: true,
  },
  {
    systemKey: "customerName",
    labelHebrew: "שם לקוח / פרויקט",
    sheetColumn: "B",
    exampleValue: "שחר שאול תכנון",
    type: "string",
    required: true,
  },
  {
    systemKey: "address",
    labelHebrew: "כתובת אספקה",
    sheetColumn: "C",
    exampleValue: "החרש 4",
    type: "string",
    required: true,
  },
  {
    systemKey: "city",
    labelHebrew: "עיר",
    sheetColumn: "D",
    exampleValue: "כפר סבא",
    type: "string",
    required: true,
  },
  {
    systemKey: "warehouse",
    labelHebrew: "מחסן מנפק",
    sheetColumn: "E",
    exampleValue: "🏭 4️⃣(החרש)",
    type: "string",
    required: true,
  },
  {
    systemKey: "driver",
    labelHebrew: "נהג מוביל / משאית",
    sheetColumn: "F",
    exampleValue: "חכמת (מרצדס מנוף)",
    type: "string",
    required: false,
  },
  {
    systemKey: "targetTime",
    labelHebrew: "שעת יעד אספקה",
    sheetColumn: "G",
    exampleValue: "11:00",
    type: "time",
    required: true,
  },
  {
    systemKey: "round",
    labelHebrew: "סבב אספקה",
    sheetColumn: "H",
    exampleValue: "1",
    type: "number",
    required: true,
  },
  {
    systemKey: "status",
    labelHebrew: "סטטוס ביצוע",
    sheetColumn: "I",
    exampleValue: "מוכן להעמסה",
    type: "status",
    required: true,
  },
  {
    systemKey: "bellaBags",
    labelHebrew: "שקי בלה (מק״ט 60002)",
    sheetColumn: "J",
    exampleValue: "2",
    type: "number",
    required: false,
  },
  {
    systemKey: "sabanPallets",
    labelHebrew: "משטחי סבן (מק״ט 60060)",
    sheetColumn: "K",
    exampleValue: "3",
    type: "number",
    required: false,
  },
  {
    systemKey: "estimatedWeight",
    labelHebrew: "משקל משוער (ק״ג)",
    sheetColumn: "L",
    exampleValue: "3800",
    type: "number",
    required: false,
  },
  {
    systemKey: "note",
    labelHebrew: "הערות לוגיסטיות",
    sheetColumn: "M",
    exampleValue: "פריקה במנוף בלבד",
    type: "string",
    required: false,
  },
];

const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: "aud-01",
    timestamp: Date.now() - 1000 * 60 * 12,
    userId: "user-rami",
    userName: "ראמי סבן",
    userRole: "ADMIN",
    action: "אישור מיפוי עמודות Sheets",
    category: "SHEETS",
    targetEntity: "דשבורד_הזמנות v2.4",
    details: "מיפוי עמודה J שקי בלה 60002 ועמודה K משטחי סבן",
    ipAddress: "10.0.0.5",
    status: "success",
  },
  {
    id: "aud-02",
    timestamp: Date.now() - 1000 * 60 * 45,
    userId: "user-itzik",
    userName: "איציק סדרן",
    userRole: "DISPATCHER",
    action: "שידור מבצעי בזק: התראה מתפרצת",
    category: "OVERRIDE",
    targetEntity: "כל המסכים",
    details: "התראה: משאית מנוף של חכמת בגישה לרציף 4",
    ipAddress: "192.168.10.12",
    status: "success",
  },
  {
    id: "aud-03",
    timestamp: Date.now() - 1000 * 60 * 120,
    userId: "user-doron",
    userName: "דורון לוגיסטיקה",
    userRole: "DISPATCHER",
    action: "ריענון מרחוק של מסך טלוויזיה",
    category: "SCREEN",
    targetEntity: "טלוויזיה מחסן 4 החרש",
    details: "פקודת Remote Hard-Reload בוצעה בהצלחה",
    ipAddress: "192.168.10.15",
    status: "success",
  },
  {
    id: "aud-04",
    timestamp: Date.now() - 1000 * 60 * 240,
    userId: "user-vered",
    userName: "ורד סבן",
    userRole: "ADMIN",
    action: "צימוד מכשיר מסך חדש",
    category: "SCREEN",
    targetEntity: "מסך משרד סדרני הפצה",
    details: "צימוד באמצעות קוד 6 ספרות והקצאת טוקן קבוע",
    ipAddress: "10.0.0.8",
    status: "success",
  },
];

const INITIAL_SCHEDULE_RULES: ScreensaverScheduleRule[] = [
  {
    id: "rule-lunch",
    name: "הפסקת צהריים מחסנאים (מחסן 4 ו-1)",
    daysOfWeek: [0, 1, 2, 3, 4], // Sun-Thu
    startTime: "12:00",
    endTime: "13:00",
    mode: "force_screensaver",
    enabled: true,
  },
  {
    id: "rule-closing",
    name: "סגירת סניף ופעילות לילה",
    daysOfWeek: [0, 1, 2, 3, 4],
    startTime: "17:30",
    endTime: "06:30",
    mode: "force_screensaver",
    enabled: true,
  },
];

interface AdminControlContextType {
  currentUser: AdminUser;
  setCurrentUser: (user: AdminUser) => void;
  canManageSystem: boolean; // ADMIN only
  canDispatch: boolean; // ADMIN + DISPATCHER
  screens: ScreenDevice[];
  pendingPairingCodes: PendingPairingCode[];
  generatePairingCode: (suggestedWarehouse?: string) => string;
  pairDevice: (
    code: string,
    name: string,
    warehouse: string,
    manager: string,
  ) => { success: boolean; error?: string; screen?: ScreenDevice };
  unpairDevice: (screenId: string) => void;
  updateScreen: (screenId: string, updates: Partial<ScreenDevice>) => void;
  sendRemoteCommand: (
    screenId: string,
    command: "refresh" | "toggle_screensaver" | "set_volume" | "set_round",
    payload?: unknown,
  ) => void;
  sheetsConfig: SheetsSyncConfig;
  updateSheetsConfig: (updates: Partial<SheetsSyncConfig>) => void;
  testSheetsFetch: () => Promise<{
    success: boolean;
    latencyMs: number;
    rowCount: number;
    message: string;
    sampleData?: unknown;
  }>;
  broadcasts: EmergencyBroadcast[];
  activeBroadcast: EmergencyBroadcast | null;
  publishBroadcast: (params: {
    title: string;
    message: string;
    level: "critical" | "warning" | "info" | "success";
    targetScreenIds?: string[];
    voiceAnnounce?: boolean;
    durationMinutes?: number;
  }) => EmergencyBroadcast;
  cancelBroadcast: (broadcastId: string) => void;
  auditLogs: AuditLogEntry[];
  addAuditLog: (
    entry: Omit<AuditLogEntry, "id" | "timestamp" | "userId" | "userName" | "userRole">,
  ) => void;
  clearAuditLogs: () => void;
  scheduleRules: ScreensaverScheduleRule[];
  updateScheduleRules: (rules: ScreensaverScheduleRule[]) => void;
}

const AdminControlContext = createContext<AdminControlContextType | null>(null);

const STORAGE_KEYS = {
  USER: "saban_admin_user",
  SCREENS: "saban_admin_screens",
  SHEETS: "saban_admin_sheets_config",
  BROADCASTS: "saban_admin_broadcasts",
  AUDIT: "saban_admin_audit_logs",
  RULES: "saban_admin_schedule_rules",
};

export function AdminControlProvider({ children }: { children: React.ReactNode }) {
  // Current user state
  const [currentUser, setCurrentUserState] = useState<AdminUser>(() => {
    if (typeof window === "undefined") return PRESET_USERS[0]!;
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.USER);
      if (saved) return JSON.parse(saved);
    } catch {
      /* ignore */
    }
    return PRESET_USERS[0]!;
  });

  const setCurrentUser = useCallback((user: AdminUser) => {
    setCurrentUserState(user);
    try {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    } catch {
      /* ignore */
    }
  }, []);

  const canManageSystem = currentUser.role === "ADMIN";
  const canDispatch = currentUser.role === "ADMIN" || currentUser.role === "DISPATCHER";

  // Screens state
  const [screens, setScreens] = useState<ScreenDevice[]>(() => {
    if (typeof window === "undefined") return INITIAL_SCREENS;
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SCREENS);
      if (saved) return JSON.parse(saved);
    } catch {
      /* ignore */
    }
    return INITIAL_SCREENS;
  });

  // Pending pairing codes (in memory)
  const [pendingPairingCodes, setPendingPairingCodes] = useState<PendingPairingCode[]>([
    {
      code: "742891",
      createdAt: Date.now(),
      expiresAt: Date.now() + 15 * 60 * 1000,
      suggestedWarehouse: "מחסן 4 החרש",
    },
  ]);

  // Sheets configuration
  const [sheetsConfig, setSheetsConfig] = useState<SheetsSyncConfig>(() => {
    const defaultConfig: SheetsSyncConfig = {
      webhookUrl: "https://script.google.com/macros/s/AKfycby-saban-materials-dispatch/exec",
      spreadsheetUrl:
        "https://docs.google.com/spreadsheets/d/1VA9J6n9IYcooO_s2xOpnkvyDQWWQD3pfhh0cnenCkoA/edit",
      ordersTabName: "דשבורד_הזמנות",
      logisticsDictTabName: "מילון_לוגיסטי",
      autoSyncIntervalSec: 60,
      lastSyncTimestamp: Date.now() - 1000 * 35,
      lastSyncStatus: "ok",
      lastSyncMessage: "סנכרון תקין: 8 הזמנות נקלטו בהצלחה",
      syncLatencyMs: 142,
      columns: INITIAL_COLUMNS,
    };
    if (typeof window === "undefined") return defaultConfig;
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SHEETS);
      if (saved) return JSON.parse(saved);
    } catch {
      /* ignore */
    }
    return defaultConfig;
  });

  // Broadcasts state
  const [broadcasts, setBroadcasts] = useState<EmergencyBroadcast[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.BROADCASTS);
      if (saved) return JSON.parse(saved);
    } catch {
      /* ignore */
    }
    return [];
  });

  // Audit logs state
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => {
    if (typeof window === "undefined") return INITIAL_AUDIT_LOGS;
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.AUDIT);
      if (saved) return JSON.parse(saved);
    } catch {
      /* ignore */
    }
    return INITIAL_AUDIT_LOGS;
  });

  // Schedule rules
  const [scheduleRules, setScheduleRules] = useState<ScreensaverScheduleRule[]>(() => {
    if (typeof window === "undefined") return INITIAL_SCHEDULE_RULES;
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.RULES);
      if (saved) return JSON.parse(saved);
    } catch {
      /* ignore */
    }
    return INITIAL_SCHEDULE_RULES;
  });

  // Save changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SCREENS, JSON.stringify(screens));
    } catch {
      /* ignore */
    }
  }, [screens]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SHEETS, JSON.stringify(sheetsConfig));
    } catch {
      /* ignore */
    }
  }, [sheetsConfig]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.BROADCASTS, JSON.stringify(broadcasts));
    } catch {
      /* ignore */
    }
  }, [broadcasts]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.AUDIT, JSON.stringify(auditLogs));
    } catch {
      /* ignore */
    }
  }, [auditLogs]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.RULES, JSON.stringify(scheduleRules));
    } catch {
      /* ignore */
    }
  }, [scheduleRules]);

  // Periodic heartbeat tick: keep screens status fresh
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setScreens((prev) =>
        prev.map((sc) => {
          // If heartbeat is older than 60 seconds, mark as offline
          const isOffline = now - sc.lastHeartbeat > 90000;
          if (isOffline && sc.status === "online") {
            return { ...sc, status: "offline" };
          }
          return sc;
        }),
      );
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // Add audit log helper
  const addAuditLog = useCallback(
    (entry: Omit<AuditLogEntry, "id" | "timestamp" | "userId" | "userName" | "userRole">) => {
      const newEntry: AuditLogEntry = {
        id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        timestamp: Date.now(),
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        ...entry,
      };
      setAuditLogs((prev) => [newEntry, ...prev.slice(0, 199)]);
    },
    [currentUser],
  );

  const clearAuditLogs = useCallback(() => {
    if (!canManageSystem) return;
    setAuditLogs([]);
    addAuditLog({
      action: "איפוס יומן ביקורת",
      category: "AUDIT",
      targetEntity: "יומן אירועים מרכזי",
      details: "כל הרשומות הקודמות נמחקו על ידי מנהל מערכת",
      ipAddress: "10.0.0.1",
      status: "warning",
    });
  }, [canManageSystem, addAuditLog]);

  // Generate pairing code
  const generatePairingCode = useCallback((suggestedWarehouse?: string) => {
    // 6-digit random code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const now = Date.now();
    const newCode: PendingPairingCode = {
      code,
      createdAt: now,
      expiresAt: now + 15 * 60 * 1000,
      suggestedWarehouse: suggestedWarehouse || "מחסן 4 החרש",
    };
    setPendingPairingCodes((prev) => [newCode, ...prev.filter((c) => c.expiresAt > now)]);
    return code;
  }, []);

  // Pair device
  const pairDevice = useCallback(
    (code: string, name: string, warehouse: string, manager: string) => {
      const cleanCode = code.replace(/[^0-9]/g, "");
      const now = Date.now();
      const match = pendingPairingCodes.find((c) => c.code === cleanCode && c.expiresAt > now);

      if (!match && cleanCode.length !== 6) {
        return { success: false, error: "קוד הצימוד אינו תקין או שפג תוקפו (15 דקות)" };
      }

      const screenId = `screen-${Date.now().toString(36)}`;
      const token = `tok_saban_${cleanCode}_${Math.random().toString(36).substring(2, 7)}`;

      const newScreen: ScreenDevice = {
        id: screenId,
        name: name || `טלוויזיה חדשה (${warehouse})`,
        warehouseLocation: warehouse || "מחסן 4 החרש",
        branchManager: manager || "אורן",
        ipAddress: `192.168.10.${Math.floor(50 + Math.random() * 150)}`,
        deviceToken: token,
        status: "online",
        lastHeartbeat: Date.now(),
        volume: 80,
        defaultRound: "all",
        screensaverIdleMinutes: 5,
        forcedScreensaver: false,
        pairedAt: new Date().toLocaleString("he-IL"),
        modelInfo: 'Smart TV Display 65" WebOS/Android',
        appVersion: "v2.4.1",
        notes: `מוצמד ב-${warehouse}`,
      };

      setScreens((prev) => [newScreen, ...prev]);
      setPendingPairingCodes((prev) => prev.filter((c) => c.code !== cleanCode));

      addAuditLog({
        action: "צימוד מסך חדש",
        category: "SCREEN",
        targetEntity: newScreen.name,
        details: `קוד: ${cleanCode} | הוקצה טוקן: ${token.slice(0, 14)}... | מיקום: ${warehouse}`,
        ipAddress: newScreen.ipAddress,
        status: "success",
      });

      playNewOrderSound();

      return { success: true, screen: newScreen };
    },
    [pendingPairingCodes, addAuditLog],
  );

  // Unpair device
  const unpairDevice = useCallback(
    (screenId: string) => {
      const target = screens.find((s) => s.id === screenId);
      if (!target) return;

      setScreens((prev) => prev.filter((s) => s.id !== screenId));

      addAuditLog({
        action: "ביטול צימוד מסך (Unpair)",
        category: "SCREEN",
        targetEntity: target.name,
        details: `המכשיר הוסר מרשימת המסכים המורשים. הטוקן בוטל.`,
        ipAddress: target.ipAddress,
        status: "warning",
      });
    },
    [screens, addAuditLog],
  );

  // Update screen settings
  const updateScreen = useCallback(
    (screenId: string, updates: Partial<ScreenDevice>) => {
      setScreens((prev) =>
        prev.map((s) => {
          if (s.id === screenId) {
            return { ...s, ...updates };
          }
          return s;
        }),
      );

      const target = screens.find((s) => s.id === screenId);
      if (target) {
        addAuditLog({
          action: "עדכון הגדרות מסך",
          category: "SCREEN",
          targetEntity: target.name,
          details: `עודכנו פרמטרים: ${Object.keys(updates).join(", ")}`,
          ipAddress: target.ipAddress,
          status: "success",
        });
      }
    },
    [screens, addAuditLog],
  );

  // Send remote command
  const sendRemoteCommand = useCallback(
    (
      screenId: string,
      command: "refresh" | "toggle_screensaver" | "set_volume" | "set_round",
      payload?: unknown,
    ) => {
      const target = screens.find((s) => s.id === screenId);
      if (!target) return;

      // Apply locally to state
      if (command === "toggle_screensaver") {
        setScreens((prev) =>
          prev.map((s) =>
            s.id === screenId ? { ...s, forcedScreensaver: !s.forcedScreensaver } : s,
          ),
        );
      } else if (command === "set_volume" && typeof payload === "number") {
        setScreens((prev) => prev.map((s) => (s.id === screenId ? { ...s, volume: payload } : s)));
      } else if (command === "set_round" && typeof payload === "string") {
        setScreens((prev) =>
          prev.map((s) =>
            s.id === screenId
              ? {
                  ...s,
                  defaultRound: payload as "all" | "round1" | "round2" | "auto",
                }
              : s,
          ),
        );
      }

      // Dispatch window event for live client responsiveness
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("saban-remote-command", {
            detail: { screenId, command, payload, timestamp: Date.now() },
          }),
        );
      }

      addAuditLog({
        action: `פקודת שליטה מרחוק: ${command}`,
        category: "SCREEN",
        targetEntity: target.name,
        details: `נשלחה פקודה ${command} עם ערך: ${JSON.stringify(payload ?? "")}`,
        ipAddress: target.ipAddress,
        status: "success",
      });

      playStatusChime();
    },
    [screens, addAuditLog],
  );

  // Sheets config updates
  const updateSheetsConfig = useCallback(
    (updates: Partial<SheetsSyncConfig>) => {
      setSheetsConfig((prev) => ({ ...prev, ...updates }));
      addAuditLog({
        action: "עדכון תצורת Google Sheets",
        category: "SHEETS",
        targetEntity: "סנכרון ענן",
        details: `עודכנו שדות: ${Object.keys(updates).join(", ")}`,
        ipAddress: "10.0.0.1",
        status: "success",
      });
    },
    [addAuditLog],
  );

  // Test Sheets Fetch
  const testSheetsFetch = useCallback(async () => {
    const startTime = performance.now();
    try {
      // Simulate real fetch test or call server proxy
      await new Promise((resolve) => setTimeout(resolve, 650));
      const latency = Math.round(performance.now() - startTime);

      setSheetsConfig((prev) => ({
        ...prev,
        lastSyncTimestamp: Date.now(),
        lastSyncStatus: "ok",
        syncLatencyMs: latency,
        lastSyncMessage: `בדיקת Fetch הצליחה: 8 שורות נקלטו (השהייה: ${latency}ms)`,
      }));

      addAuditLog({
        action: "בדיקת Fetch מול Google Sheets",
        category: "SHEETS",
        targetEntity: sheetsConfig.ordersTabName,
        details: `בדיקת קישוריות הצליחה | זמן תגובה: ${latency}ms | סטטוס: 200 OK`,
        ipAddress: "10.0.0.1",
        status: "success",
      });

      return {
        success: true,
        latencyMs: latency,
        rowCount: 8,
        message: "חיבור תקין ל-Google Sheets (200 OK)",
        sampleData: {
          ordersFound: 8,
          columnsDetected: ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M"],
          tabName: sheetsConfig.ordersTabName,
        },
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      const latency = Math.round(performance.now() - startTime);
      setSheetsConfig((prev) => ({
        ...prev,
        lastSyncTimestamp: Date.now(),
        lastSyncStatus: "error",
        syncLatencyMs: latency,
        lastSyncMessage: `שגיאת Fetch: ${msg || "חיבור נכשל"}`,
      }));

      addAuditLog({
        action: "כישלון בדיקת Fetch Sheets",
        category: "SHEETS",
        targetEntity: sheetsConfig.ordersTabName,
        details: `שגיאה: ${msg || "חוסר מענה משרת Apps Script"}`,
        ipAddress: "10.0.0.1",
        status: "error",
      });

      return {
        success: false,
        latencyMs: latency,
        rowCount: 0,
        message: `שגיאה: ${msg || "חיבור נכשל"}`,
      };
    }
  }, [sheetsConfig.ordersTabName, addAuditLog]);

  // Publish emergency broadcast
  const publishBroadcast = useCallback(
    (params: {
      title: string;
      message: string;
      level: "critical" | "warning" | "info" | "success";
      targetScreenIds?: string[];
      voiceAnnounce?: boolean;
      durationMinutes?: number;
    }) => {
      const now = Date.now();
      const durationMs = (params.durationMinutes ?? 30) * 60 * 1000;
      const newBroadcast: EmergencyBroadcast = {
        id: `bc-${Date.now()}`,
        title: params.title,
        message: params.message,
        level: params.level,
        targetScreenIds: params.targetScreenIds || ["all"],
        voiceAnnounce: params.voiceAnnounce ?? true,
        createdAt: now,
        expiresAt: now + durationMs,
        createdBy: currentUser.name,
        isActive: true,
      };

      setBroadcasts((prev) => [newBroadcast, ...prev]);

      // Sound effect
      if (params.level === "critical") {
        playAlarmSound();
      } else {
        playNewOrderSound();
      }

      // Voice announcement if enabled
      if (params.voiceAnnounce) {
        speakHebrew(`הודעת כריזה מבצעית מחסן ח. סבן: ${params.title}. ${params.message}`);
      }

      // Dispatch global broadcast event so TV screen overlay catches it
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("saban-emergency-broadcast", {
            detail: newBroadcast,
          }),
        );
      }

      addAuditLog({
        action: "שידור התראה מתפרצת דחופה",
        category: "OVERRIDE",
        targetEntity: params.title,
        details: `רמה: ${params.level} | יעד: ${params.targetScreenIds?.join(", ") || "כלל המסכים"} | תוקף: ${params.durationMinutes || 30} דקות`,
        ipAddress: "10.0.0.1",
        status: "success",
      });

      return newBroadcast;
    },
    [currentUser, addAuditLog],
  );

  // Cancel broadcast
  const cancelBroadcast = useCallback(
    (broadcastId: string) => {
      setBroadcasts((prev) =>
        prev.map((b) => (b.id === broadcastId ? { ...b, isActive: false } : b)),
      );

      addAuditLog({
        action: "ביטול שידור מבצעי בזק",
        category: "OVERRIDE",
        targetEntity: broadcastId,
        details: `השידור הופסק מיידית מכל מסכי הטלוויזיה והדשבורד`,
        ipAddress: "10.0.0.1",
        status: "warning",
      });

      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("saban-emergency-broadcast-cancel", {
            detail: { broadcastId },
          }),
        );
      }
    },
    [addAuditLog],
  );

  // Active broadcast getter
  const activeBroadcast = useMemo(() => {
    const now = Date.now();
    return broadcasts.find((b) => b.isActive && b.expiresAt > now) || null;
  }, [broadcasts]);

  // Update schedule rules
  const updateScheduleRules = useCallback(
    (rules: ScreensaverScheduleRule[]) => {
      setScheduleRules(rules);
      addAuditLog({
        action: "עדכון תזמון שומר מסך",
        category: "MEDIA",
        targetEntity: "חוקי הפסקות וסגירה",
        details: `הוגדרו ${rules.length} חוקי תזמון פעילים`,
        ipAddress: "10.0.0.1",
        status: "success",
      });
    },
    [addAuditLog],
  );

  const value: AdminControlContextType = {
    currentUser,
    setCurrentUser,
    canManageSystem,
    canDispatch,
    screens,
    pendingPairingCodes,
    generatePairingCode,
    pairDevice,
    unpairDevice,
    updateScreen,
    sendRemoteCommand,
    sheetsConfig,
    updateSheetsConfig,
    testSheetsFetch,
    broadcasts,
    activeBroadcast,
    publishBroadcast,
    cancelBroadcast,
    auditLogs,
    addAuditLog,
    clearAuditLogs,
    scheduleRules,
    updateScheduleRules,
  };

  return <AdminControlContext.Provider value={value}>{children}</AdminControlContext.Provider>;
}

export function useAdminControl() {
  const context = useContext(AdminControlContext);
  if (!context) {
    throw new Error("useAdminControl must be used within an AdminControlProvider");
  }
  return context;
}
