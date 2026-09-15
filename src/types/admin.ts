export type UserRole = "ADMIN" | "DISPATCHER" | "SCREEN_CLIENT";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  branch: string;
}

export interface ScreenDevice {
  id: string;
  name: string;
  warehouseLocation: string; // e.g. "מחסן 4 החרש"
  branchManager: string; // e.g. "אורן"
  ipAddress: string;
  deviceToken: string;
  status: "online" | "offline" | "pairing";
  lastHeartbeat: number;
  volume: number; // 0 - 100
  defaultRound: "all" | "round1" | "round2" | "auto";
  screensaverIdleMinutes: number;
  forcedScreensaver: boolean;
  notes?: string;
  pairedAt: string;
  modelInfo?: string;
  appVersion?: string;
}

export interface PendingPairingCode {
  code: string; // 6 digits, e.g. "742891"
  createdAt: number;
  expiresAt: number; // 15 mins
  suggestedWarehouse?: string;
}

export interface SheetsColumnMapping {
  systemKey: string;
  labelHebrew: string;
  sheetColumn: string; // e.g. "A", "B", etc.
  exampleValue: string;
  type: "string" | "number" | "status" | "time";
  required: boolean;
}

export interface SheetsSyncConfig {
  webhookUrl: string;
  spreadsheetUrl: string;
  ordersTabName: string;
  logisticsDictTabName: string;
  autoSyncIntervalSec: number;
  lastSyncTimestamp: number | null;
  lastSyncStatus: "ok" | "error" | "pending";
  lastSyncMessage?: string;
  syncLatencyMs: number;
  columns: SheetsColumnMapping[];
}

export interface EmergencyBroadcast {
  id: string;
  title: string;
  message: string;
  level: "critical" | "warning" | "info" | "success";
  targetScreenIds: string[]; // ['all'] or specific IDs
  voiceAnnounce: boolean;
  createdAt: number;
  expiresAt: number;
  createdBy: string;
  isActive: boolean;
}

export interface AuditLogEntry {
  id: string;
  timestamp: number;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  category: "SCREEN" | "SHEETS" | "OVERRIDE" | "AUTH" | "MEDIA" | "SETTINGS";
  targetEntity: string;
  details: string;
  ipAddress: string;
  status: "success" | "warning" | "error";
}

export interface ScreensaverScheduleRule {
  id: string;
  name: string;
  daysOfWeek: number[]; // 0=Sun..6=Sat
  startTime: string; // "12:00"
  endTime: string; // "13:00"
  mode: "force_screensaver" | "prohibit_screensaver";
  enabled: boolean;
}
