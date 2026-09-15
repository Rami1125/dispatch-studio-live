export type TrafficSeverity = "heavy" | "moderate" | "incident" | "fluid";

export interface TrafficAlert {
  id: string;
  timestamp: string; // e.g. "10:48"
  timeAgo: string; // e.g. "לפני 3 דק'"
  severity: TrafficSeverity;
  severityLabel: string; // e.g. "פקק כבד 🔴"
  corridor: string; // e.g. "כביש 531 מזרח (מחלף סוקולוב ⟵ רעננה דרום)"
  details: string; // e.g. "תאונת דרכים קלה בנתיב האמצעי, תנועה איטית מאוד"
  truckImpact: string; // e.g. "עיכוב של כ-14 דק' למשאית חכמת (מרצדס מנוף)"
  affectedTruck?: "hikmat" | "ali" | "both" | "general";
  isLive?: boolean;
}

export interface LocationPreset {
  id: string;
  label: string;
  shortLabel: string;
  icon: string;
  lat: number;
  lon: number;
  zoom: number;
  description: string;
  pinText?: string;
}

export interface TruckRouteInfo {
  id: "hikmat" | "ali";
  driverName: string;
  truckPlate: string; // "615-41-002"
  truckModel: string; // "מרצדס ארוקס מנוף כבד" / "איסוזו חלוקה 12 טון"
  truckType: "crane" | "distribution";
  phone: string;
  currentOrderNumber?: string;
  customerName?: string;
  destination: string;
  destinationCity: string;
  cleanTimeMinutes: number; // e.g. 18
  actualTimeMinutes: number; // e.g. 32
  delayMinutes: number; // e.g. 14
  primaryCorridor: string; // e.g. "כביש 531 מערב"
  etaTime: string; // e.g. "11:22"
  cargoSummary: string; // e.g. "4 בלות חול + 2 משטחי בלוקים 20"
  status: "on_route" | "loading" | "delivered" | "delayed";
  severity: TrafficSeverity;
  wazeDestinationQuery: string; // For Waze Deep Link
  wazeLat: number;
  wazeLon: number;
  lastGpsUpdate: string;
}
