export type ScreensaverMode = "analytics" | "traffic" | "video" | "mixed";

export interface ScheduledBroadcast {
  id: string;
  time: string; // e.g. "11:30"
  target: "all" | "warehouse" | "driver";
  title: string;
  content: string;
  isActive: boolean;
  isTriggered?: boolean;
}

export interface AITrainingSettings {
  focusMode: "safety" | "speed" | "loading_balance" | "weather_traffic" | "custom";
  customPromptRule: string;
  temperature: number;
  autoPushToTV: boolean;
}

export interface ScreensaverSettings {
  isEnabled: boolean;
  idleTimeoutSeconds: number; // 30, 60, 120, 300 (0 = disabled)
  minOrderGapMinutes: number; // e.g. 45 (triggers if nearest order > 45m away)
  activeMode: ScreensaverMode;
  autoCycle: boolean;
  cycleIntervalSeconds: number;
  videoSource: string;
  videoMuted: boolean;
  autoVideoOnLull: boolean; // switches to ambient video when no urgent warnings exist
}

export interface TrafficRouteInfo {
  id: string;
  road: string;
  segment: string;
  status: "fluid" | "moderate" | "heavy";
  statusText: string;
  delayMinutes: number;
  avgSpeedKmh: number;
  alert?: string;
  updatedAt: string;
}

export interface DriverETAInfo {
  orderId: string;
  driverName: string;
  vehicle: string;
  destination: string;
  city: string;
  targetTime: string;
  etaTime: string;
  remainingMinutes: number;
  trafficState: "fluid" | "moderate" | "heavy";
  routeRoad: string;
  warehouse: string;
  itemsSummary: string;
}

export interface ProductAnalyticsSummary {
  bellaBagsTotal: number;
  sabanPalletsTotal: number;
  totalWeightKg: number;
  loadingRatePalletsPerHour: number;
  onTimeRatePercent: number;
  fleetUtilizationPercent: number;
  topProducts: {
    sku: string;
    name: string;
    category: "bella" | "saban" | "bulk" | "accessories";
    quantity: number;
    unit: string;
    palletsOrBags: number;
    weightKg: number;
    stockStatus: "תקין" | "מלאי נמוך" | "עומס הזמנות";
  }[];
  hourlyThroughput: {
    hour: string;
    pallets: number;
    weightTons: number;
  }[];
}
