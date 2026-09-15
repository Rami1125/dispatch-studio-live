/**
 * Warehouse Periphery Predefined Hotspots & Alert Pin Management
 * ח. סבן חומרי בניין (1994) בע"מ
 *
 * Provides:
 * - Specific pinpoint locations around Warehouse 4 (החרש) and Warehouse 1 (התלמיד)
 * - Category definitions (צוואר בקבוק, חסימת שער/רציף, משטרה/פיקוח, עבודות דרך, מפגע)
 * - Persistence in localStorage with cross-tab BroadcastChannel & storage events
 * - Conversion of AlertPins to LocationPresets for instant Waze map centering
 */

import type { WarehouseAlertPin, AlertPinCategory, LocationPreset } from "@/types/traffic";

export const WAREHOUSE_PERIPHERY_HOTSPOTS = [
  {
    id: "hotspot_harash_gate",
    name: "שער כניסה ראשי — החרש 4 (מחסן 4)",
    lat: 32.132702,
    lon: 34.898175,
    suggestedRoutes: "כניסת משאיות פול-טריילר וחומרי מליטה",
  },
  {
    id: "hotspot_harash_junction",
    name: 'צומת החרש - המסגר (אזה"ת הוד השרון)',
    lat: 32.13385,
    lon: 34.89752,
    suggestedRoutes: "ציר כניסה ויציאה של רחוב החרש",
  },
  {
    id: "hotspot_harash_sokolov",
    name: "צומת החרש - סוקולוב / היציאה לכביש 531",
    lat: 32.1362,
    lon: 34.8948,
    suggestedRoutes: "השתלבות לכיוון מחלף סוקולוב וכביש 531 מערב/מזרח",
  },
  {
    id: "hotspot_talmid_gate",
    name: "שער מחסן 1 — התלמיד (ברזל וגבס)",
    lat: 32.1432,
    lon: 34.8912,
    suggestedRoutes: "רחבת פריקה וליקוט מחסן 1",
  },
  {
    id: "hotspot_talmid_junction",
    name: "צומת התלמיד - דרך רמתיים",
    lat: 32.1451,
    lon: 34.8895,
    suggestedRoutes: 'ציר מרכזי הוד השרון לכיוון פ"ת וכפ"ס',
  },
  {
    id: "hotspot_magdiel_exit",
    name: "כיכר מגדיאל / ציר שחרור משאיות מזרח",
    lat: 32.1585,
    lon: 34.9082,
    suggestedRoutes: "יציאה לכביש 40 צפון ולכיוון כפר סבא מזרח",
  },
  {
    id: "hotspot_ramatayim_south",
    name: "דרך רמתיים דרום (גבול פתח תקווה - מחלף ירקון)",
    lat: 32.122,
    lon: 34.905,
    suggestedRoutes: "ציר כביש 40 דרום לכיוון פתח תקווה ומחלף ירקון",
  },
];

export const ALERT_PIN_CATEGORIES: {
  category: AlertPinCategory;
  label: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  icon: string;
  defaultSeverity: "heavy" | "moderate" | "incident";
}[] = [
  {
    category: "bottleneck",
    label: "צוואר בקבוק / פקק",
    badgeBg: "bg-amber-500/20",
    badgeBorder: "border-amber-500/40",
    badgeText: "text-amber-300",
    icon: "🛑",
    defaultSeverity: "heavy",
  },
  {
    category: "blockage",
    label: "חסימת ציר / כביש סגור",
    badgeBg: "bg-rose-600/20",
    badgeBorder: "border-rose-500/50",
    badgeText: "text-rose-300",
    icon: "🚫",
    defaultSeverity: "heavy",
  },
  {
    category: "loading_bay",
    label: "חסימת רציף פריקה / שער מחסן",
    badgeBg: "bg-orange-500/20",
    badgeBorder: "border-orange-500/40",
    badgeText: "text-orange-300",
    icon: "⚠️",
    defaultSeverity: "incident",
  },
  {
    category: "police",
    label: "משטרה / פיקוח עירוני / שקילה",
    badgeBg: "bg-blue-500/20",
    badgeBorder: "border-blue-500/40",
    badgeText: "text-blue-300",
    icon: "👮",
    defaultSeverity: "moderate",
  },
  {
    category: "roadworks",
    label: "עבודות דרך / תשתית",
    badgeBg: "bg-yellow-500/20",
    badgeBorder: "border-yellow-500/40",
    badgeText: "text-yellow-300",
    icon: "🚧",
    defaultSeverity: "moderate",
  },
  {
    category: "hazard",
    label: "מפגע בטיחות / שמן / מכשול",
    badgeBg: "bg-purple-500/20",
    badgeBorder: "border-purple-500/40",
    badgeText: "text-purple-300",
    icon: "⚡",
    defaultSeverity: "incident",
  },
];

const STORAGE_KEY = "saban_warehouse_alert_pins";
const BROADCAST_CHANNEL_NAME = "saban_alert_pins_sync";

const INITIAL_PINS: WarehouseAlertPin[] = [
  {
    id: "pin-harash-gate",
    title: "תור משאיות סמיטריילר בשער 2",
    category: "loading_bay",
    categoryLabel: "חסימת רציף פריקה / שער מחסן",
    severity: "incident",
    lat: 32.132702,
    lon: 34.898175,
    zoom: 17,
    locationName: "שער כניסה ראשי — החרש 4",
    description: "3 פול-טריילרים ממתינים לפריקת מלט ובלות. תנועת משאיות מנוף מופנית לשער העורפי.",
    createdBy: "איציק סדרן (סדרן ראשי)",
    createdAt: Date.now() - 1000 * 60 * 18,
    affectedRoutes: "גישה ישירה לרציף 4, כביש החרש",
    isWarehousePeriphery: true,
  },
  {
    id: "pin-harash-sokolov",
    title: "עבודות תשתית בצומת סוקולוב - החרש",
    category: "roadworks",
    categoryLabel: "עבודות דרך / תשתית",
    severity: "moderate",
    lat: 32.1362,
    lon: 34.8948,
    zoom: 16,
    locationName: "צומת החרש - סוקולוב",
    description: "נתיב ימני חסום לעבודות צנרת תאגיד המים. האטה מורגשת ביציאה לכיוון כביש 531.",
    createdBy: "ראמי סבן (הנהלה)",
    createdAt: Date.now() - 1000 * 60 * 45,
    affectedRoutes: 'יציאת משאיות מנוף ואיסוזו לכיוון רעננה וכפ"ס',
    isWarehousePeriphery: true,
  },
];

/**
 * Loads alert pins from localStorage with initial fallbacks
 */
export function getStoredAlertPins(): WarehouseAlertPin[] {
  if (typeof window === "undefined") return INITIAL_PINS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_PINS));
      return INITIAL_PINS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      // Filter expired pins if expiresAt is set
      const now = Date.now();
      return parsed.filter((pin) => !pin.expiresAt || pin.expiresAt > now);
    }
  } catch (err) {
    console.warn("Failed to read alert pins from storage:", err);
  }
  return INITIAL_PINS;
}

/**
 * Saves alert pins to localStorage and notifies other tabs/windows
 */
export function saveAlertPins(pins: WarehouseAlertPin[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pins));
    // Notify via BroadcastChannel
    if ("BroadcastChannel" in window) {
      const bc = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      bc.postMessage({ type: "ALERT_PINS_UPDATED", count: pins.length });
      bc.close();
    }
  } catch (err) {
    console.error("Failed to save alert pins:", err);
  }
}

/**
 * Converts active warehouse alert pins into map presets so they appear
 * in the Waze Map preset selector with distinctive icons and pin details
 */
export function convertAlertPinsToPresets(pins: WarehouseAlertPin[]): LocationPreset[] {
  return pins.map((pin) => {
    const cat = ALERT_PIN_CATEGORIES.find((c) => c.category === pin.category);
    const icon = cat?.icon || "⚠️";
    return {
      id: `alert-pin-${pin.id}`,
      label: `[דיווח שטח] ${pin.title}`,
      shortLabel: `${icon} ${pin.locationName.split("—")[0]?.trim() || pin.title.slice(0, 14)}`,
      icon,
      lat: pin.lat,
      lon: pin.lon,
      zoom: pin.zoom || 16,
      description: `${pin.categoryLabel}: ${pin.description} | דווח ע"י: ${pin.createdBy}`,
      pinText: `${pin.title} (${pin.locationName})`,
    };
  });
}
