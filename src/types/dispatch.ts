export type OrderStatus = "ממתין" | "בהכנה" | "מוכן להעמסה" | "בהעמסה" | "יצא לדרך" | "סופק";

export interface OrderItem {
  sku: string;
  name: string;
  quantity: number;
  unit?: string;
  isApproved: boolean;
}

export interface LogisticsMetrics {
  /** שקי בלה - מק"ט 60002 */
  bellaBags: number;
  /** משטחי סבן - מק"ט 60060 */
  sabanPallets: number;
  /** משקל משוער בק"ג */
  estimatedWeightKg: number;
}

export interface Driver {
  id: string;
  name: string;
  vehicle: string;
  phone?: string;
}

export interface Warehouse {
  id: string;
  name: string;
  loadRatio: number; // 0..1 עומס נוכחי
}

export interface Order {
  orderId: string;
  customerNumber?: string;
  customerName: string;
  /** עמודה D: כתובת פריקה מדויקת */
  address: string;
  /** עמודה E: עיר פריקה */
  city: string;
  warehouse: string;
  driver: string;
  targetTime: string; // "11:00"
  round: number;
  status: OrderStatus;
  logisticsMetrics: LogisticsMetrics;
  items: OrderItem[];
  note?: string;
  updatedAt?: string;
  pickingStartedAt?: number;
  readyForLoadingAt?: number;
  assignedPicker?: string;
  deposits?: string[];
  itemsFormatted?: string;
  /** עמודה O: קישור Waze לניווט ישיר */
  wazeUrl?: string;
  deliveryNote?: string;
  driveFolderUrl?: string;
  orderFileUrl?: string;
  lifoOrder?: number;
}

export type AlertLevel = "info" | "warning" | "critical" | "success";

export interface NoaAlert {
  id: string;
  level: AlertLevel;
  message: string;
  createdAt: string;
  /** התראה מתפרצת - תוצג כמודל קופץ על הטלוויזיה */
  isFlash?: boolean;
  /** משך תצוגה לפלאש במילישניות */
  durationMs?: number;
}

export interface StatusSyncRecord {
  orderId: string;
  status: OrderStatus;
  updatedAt: string;
  syncedToSheet: boolean;
  syncError?: string;
  lastAttemptAt?: string;
  message?: string;
}

export interface OrderStatusOverride {
  status: OrderStatus;
  timestamp: number;
  synced: boolean;
}

export type OrderStatusOverrides = Record<string, OrderStatusOverride>;

export interface OrderEvent {
  type: "new_order" | "status_urgent" | "status_changed" | "override_synced";
  orderId: string;
  order?: Order;
  message: string;
  timestamp: number;
}

export type DataSourceMode = "mock" | "sheets";

export interface DispatchState {
  /** מה משודר כרגע לטלוויזיה */
  published: Order[];
  /** טיוטת עריכה בסטודיו */
  draft: Order[];
  alerts: NoaAlert[];
  flash: NoaAlert | null;
  drivers: Driver[];
  warehouses: Warehouse[];
  sourceMode: DataSourceMode;
  sheetUrl: string;
  webhookUrl: string;
  statusSyncRecords: Record<string, StatusSyncRecord>;
  orderStatusOverrides: OrderStatusOverrides;
  latestOrderEvent: OrderEvent | null;
  pollingSeconds: number;
  lastSyncAt: string | null;
  syncStatus: "idle" | "syncing" | "ok" | "error";
  syncError: string | null;
  isDirty: boolean;
  recentlyChangedOrderIds: Record<string, number>;
}
