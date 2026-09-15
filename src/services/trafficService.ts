import type { TrafficRouteInfo, DriverETAInfo } from "@/types/screensaver";
import type { Order } from "@/types/dispatch";
import type { TrafficAlert, LocationPreset, TruckRouteInfo } from "@/types/traffic";

// ==========================================
// 1. LOCATION PRESETS (WAZE & DISPATCH HUBS)
// ==========================================
export const LOCATION_PRESETS: LocationPreset[] = [
  {
    id: "warehouse_4",
    label: "מחסן 4 החרש (ראשי)",
    shortLabel: "מחסן 4 החרש",
    icon: "🏭",
    lat: 32.1485,
    lon: 34.8967,
    zoom: 14,
    description: "רחוב החרש 8, אזור תעשייה הוד השרון — מרכז לוגיסטי וחומרי מליטה",
    pinText: "סבן מרכז לוגיסטי 4",
  },
  {
    id: "warehouse_1",
    label: "מחסן 1 התלמיד",
    shortLabel: "מחסן 1 התלמיד",
    icon: "🏟️",
    lat: 32.1432,
    lon: 34.8912,
    zoom: 14,
    description: "רחוב התלמיד, הוד השרון — מחסן ברזל, גבס ואיטום",
    pinText: "סבן מחסן 1",
  },
  {
    id: "kfar_saba_raanana",
    label: "כפר סבא - רעננה",
    shortLabel: "כפ״ס - רעננה",
    icon: "🏙️",
    lat: 32.1844,
    lon: 34.8878,
    zoom: 13,
    description: "צירי 531, ויצמן, אחוזה ואזור התעשייה כפר סבא מזרח",
  },
  {
    id: "gush_dan",
    label: "גוש דן ותל אביב",
    shortLabel: "גוש דן ומרכז",
    icon: "🌆",
    lat: 32.0853,
    lon: 34.7818,
    zoom: 12,
    description: "איילון (כביש 20), ציר ז'בוטינסקי ומחלף מורשה",
  },
];

// ==========================================
// 2. INITIAL LIVE TRAFFIC ALERTS (TICKER)
// ==========================================
export const INITIAL_TRAFFIC_ALERTS: TrafficAlert[] = [
  {
    id: "alert-531",
    timestamp: "11:05",
    timeAgo: "לפני 2 דק'",
    severity: "heavy",
    severityLabel: "פקק כבד 🔴",
    corridor: "כביש 531 מערב (מחלף סוקולוב ⟵ רעננה דרום)",
    details: "עומס כבד בעקבות תאונה קלה בנתיב המרכזי. מהירות ממוצעת 15 קמ״ש.",
    truckImpact: "משאית חכמת (615-41-002) ליעד רעננה (בר אילן 8) מתעכבת בכ-14 דק'.",
    affectedTruck: "hikmat",
    isLive: true,
  },
  {
    id: "alert-4",
    timestamp: "11:02",
    timeAgo: "לפני 5 דק'",
    severity: "moderate",
    severityLabel: "עומס בינוני 🟡",
    corridor: "כביש 40 צפון / ציר בית חולים מאיר כפר סבא",
    details: "עומסי תנועה בינוניים בצומת ויצמן וטשרניחובסקי.",
    truckImpact: "עלי איסוזו (651-51-701) בדרך לפריקה בחנין בית חולים מאיר 1 כפר סבא.",
    affectedTruck: "ali",
    isLive: true,
  },
  {
    id: "alert-local-harash",
    timestamp: "10:55",
    timeAgo: "לפני 12 דק'",
    severity: "incident",
    severityLabel: "שיבוש תנועה 🟣",
    corridor: "צומת החרש - סוקולוב (יציאה ממחסן 4 הוד השרון)",
    details: "עבודות תשתית של תאגיד המים בנתיב הימני; מעבר צר למשאיות פול-טריילר ומנוף.",
    truckImpact: "נהגי מנוף וחלוקה מתבקשים לצאת דרך ציר הנגר למניעת עיכוב.",
    affectedTruck: "both",
    isLive: true,
  },
  {
    id: "alert-6",
    timestamp: "10:48",
    timeAgo: "לפני 19 דק'",
    severity: "fluid",
    severityLabel: "זורם ותקין 🟢",
    corridor: "כביש 6 (מחלף חורשים ⟵ קסם ⟵ בן שמן ⟵ מודיעין)",
    details: "זרימת תנועה חלקה ומהירה ללא הפרעות או עבודות דרך.",
    truckImpact: "ציר מהיר ומאושר לפריקות מודיעין (מגדל הלבנון 14).",
    affectedTruck: "general",
    isLive: true,
  },
];

// City coordinate lookup for dynamic presets
const KNOWN_CITY_COORDINATES: Record<string, { lat: number; lon: number }> = {
  רעננה: { lat: 32.1844, lon: 34.8707 },
  "כפר סבא": { lat: 32.175, lon: 34.9069 },
  "הוד השרון": { lat: 32.155, lon: 34.893 },
  מודיעין: { lat: 31.8903, lon: 35.0104 },
  "בני ציון": { lat: 32.2222, lon: 34.869 },
  הרצליה: { lat: 32.1663, lon: 34.8432 },
  "תל אביב": { lat: 32.0853, lon: 34.7818 },
  "פתח תקווה": { lat: 32.084, lon: 34.8878 },
  נתניה: { lat: 32.3215, lon: 34.8532 },
};

export function getCoordinatesForCity(city: string): { lat: number; lon: number } {
  const cleanCity = city.trim();
  for (const [key, coords] of Object.entries(KNOWN_CITY_COORDINATES)) {
    if (cleanCity.includes(key) || key.includes(cleanCity)) {
      return coords;
    }
  }
  return { lat: 32.155, lon: 34.893 }; // Default Hod Hasharon
}

/**
 * Builds dynamic LocationPresets from the real orders in דשבורד_הזמנות
 * Uses exact Column D (כתובת פריקה) and Column E (עיר).
 */
export function buildDeliveryPresetsFromOrders(orders: Order[]): LocationPreset[] {
  return orders
    .filter((o) => o.address && o.city)
    .map((o) => {
      const coords = getCoordinatesForCity(o.city);
      return {
        id: `order-preset-${o.orderId}`,
        label: `#${o.orderId} - ${o.customerName} (${o.city})`,
        shortLabel: `${o.city} (#${o.orderId})`,
        icon: "📍",
        lat: coords.lat,
        lon: coords.lon,
        zoom: 15,
        description: `כתובת פריקה: ${o.address}, ${o.city} | נהג: ${o.driver} | סטטוס: ${o.status}`,
        pinText: `${o.customerName} - ${o.address}`,
      };
    });
}

// ==========================================
// 3. ACTIVE FLEET DATA (HIKMAT & ALI) - REAL LIVE SHEET DATA
// ==========================================
export function getActiveFleetTraffic(orders?: Order[]): TruckRouteInfo[] {
  const now = new Date();
  const formatEta = (minutesFromNow: number) => {
    const d = new Date(now.getTime() + minutesFromNow * 60000);
    return d.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" });
  };

  // Find real orders for Hikmat
  const hikmatOrder =
    orders?.find(
      (o) =>
        (o.driver.includes("חכמת") || o.driver.includes("מרצדס") || o.driver.includes("מנוף")) &&
        (o.status === "בהעמסה" ||
          o.status === "יצא לדרך" ||
          o.status === "בהכנה" ||
          o.status === "מוכן להעמסה"),
    ) ||
    orders?.find(
      (o) => o.driver.includes("חכמת") || o.driver.includes("מרצדס") || o.driver.includes("מנוף"),
    );

  // Find real orders for Ali
  const aliOrder =
    orders?.find(
      (o) =>
        (o.driver.includes("עלי") || o.driver.includes("איסוזו")) &&
        (o.status === "בהעמסה" ||
          o.status === "יצא לדרך" ||
          o.status === "מוכן להעמסה" ||
          o.status === "בהכנה"),
    ) || orders?.find((o) => o.driver.includes("עלי") || o.driver.includes("איסוזו"));

  // Coordinates from real cities in sheet
  const hikmatCoords = hikmatOrder
    ? getCoordinatesForCity(hikmatOrder.city)
    : { lat: 32.1844, lon: 34.8707 };
  const aliCoords = aliOrder ? getCoordinatesForCity(aliOrder.city) : { lat: 32.175, lon: 34.9069 };

  const hikmatTruck: TruckRouteInfo = {
    id: "hikmat",
    driverName: "חכמת סבן",
    truckPlate: "615-41-002",
    truckModel: "מרצדס ארוקס (Arocs 3340) מנוף כבד",
    truckType: "crane",
    phone: "052-6154100",
    currentOrderNumber: hikmatOrder ? `#${hikmatOrder.orderId}` : "#6215440",
    customerName: hikmatOrder ? hikmatOrder.customerName : 'מאריו הנדסה אספקה חומרי בניין בע"מ',
    destination: hikmatOrder ? `${hikmatOrder.address}, ${hikmatOrder.city}` : "בר אילן 8, רעננה",
    destinationCity: hikmatOrder ? hikmatOrder.city : "רעננה",
    cleanTimeMinutes: 18,
    actualTimeMinutes: 32,
    delayMinutes: 14,
    primaryCorridor: "כביש 531 מערב",
    etaTime: formatEta(32),
    cargoSummary: hikmatOrder
      ? hikmatOrder.itemsFormatted ||
        `${hikmatOrder.logisticsMetrics.bellaBags} בלות + ${hikmatOrder.logisticsMetrics.sabanPallets} משטחי סבן`
      : "2 בלות סומסום, 3 בלות חול, 6 מלט, 10 טיח MP75",
    status:
      hikmatOrder?.status === "בהעמסה"
        ? "loading"
        : hikmatOrder?.status === "סופק"
          ? "fluid"
          : "on_route",
    severity: "heavy",
    wazeDestinationQuery: hikmatOrder
      ? `${hikmatOrder.address}, ${hikmatOrder.city}`
      : "בר אילן 8, רעננה",
    wazeLat: hikmatCoords.lat,
    wazeLon: hikmatCoords.lon,
    lastGpsUpdate: "לפני 30 שנ'",
  };

  const aliTruck: TruckRouteInfo = {
    id: "ali",
    driverName: "עלי מנסור",
    truckPlate: "651-51-701",
    truckModel: "איסוזו פורוורד (Forward) 12 טון חלוקה",
    truckType: "distribution",
    phone: "054-6515170",
    currentOrderNumber: aliOrder ? `#${aliOrder.orderId}` : "#6215463",
    customerName: aliOrder ? aliOrder.customerName : "השוקדים-כללי",
    destination: aliOrder
      ? `${aliOrder.address}, ${aliOrder.city}`
      : "חנין בית חולים מאיר 1, כפר סבא",
    destinationCity: aliOrder ? aliOrder.city : "כפר סבא",
    cleanTimeMinutes: 14,
    actualTimeMinutes: 21,
    delayMinutes: 7,
    primaryCorridor: "כביש 40 צפון / בן יהודה",
    etaTime: formatEta(21),
    cargoSummary: aliOrder
      ? aliOrder.itemsFormatted ||
        `${aliOrder.logisticsMetrics.bellaBags} בלות + ${aliOrder.logisticsMetrics.sabanPallets} משטחי סבן`
      : '25 מלט אפור 25 ק"ג, 25 טיט שק, 1 פוליגג',
    status:
      aliOrder?.status === "בהעמסה"
        ? "loading"
        : aliOrder?.status === "סופק"
          ? "fluid"
          : "on_route",
    severity: "moderate",
    wazeDestinationQuery: aliOrder
      ? `${aliOrder.address}, ${aliOrder.city}`
      : "חנין בית חולים מאיר 1, כפר סבא",
    wazeLat: aliCoords.lat,
    wazeLon: aliCoords.lon,
    lastGpsUpdate: "לפני 45 שנ'",
  };

  return [hikmatTruck, aliTruck];
}

// ==========================================
// 4. WAZE URL GENERATORS & DEEP LINKS
// ==========================================

export function buildWazeEmbedUrl(preset: LocationPreset): string {
  // Official Waze embed with coordinate anchoring
  return `https://embed.waze.com/iframe?zoom=${preset.zoom}&lat=${preset.lat}&lon=${preset.lon}&pin=1`;
}

export function buildWazeNavigationUrl(lat: number, lon: number): string {
  return `https://www.waze.com/ul?ll=${lat},${lon}&navigate=yes`;
}

export function buildWazeSearchUrl(addressQuery: string): string {
  return `https://www.waze.com/ul?q=${encodeURIComponent(addressQuery)}&navigate=yes`;
}

// ==========================================
// 5. BACKWARD-COMPATIBLE ARTERIAL ROUTES
// ==========================================
export const ARTERIAL_ROUTES: TrafficRouteInfo[] = [
  {
    id: "r-531",
    road: "כביש 531",
    segment: "מחלף סוקולוב ⟵ רעננה דרום ⟵ שפיים",
    status: "heavy",
    statusText: "עומס תנועה כבד ברמזורים ומחלפים",
    delayMinutes: 14,
    avgSpeedKmh: 24,
    alert: "עבודות תשתית ותאונה קלה בנתיב המרכזי",
    updatedAt: "לפני 2 דק'",
  },
  {
    id: "r-4",
    road: "כביש 4",
    segment: "צומת רעננה צפון ⟵ מחלף מורשה",
    status: "moderate",
    statusText: "עומס בינוני לכיוון דרום",
    delayMinutes: 8,
    avgSpeedKmh: 46,
    alert: "תנועה איטית אך מתקדמת",
    updatedAt: "לפני 3 דק'",
  },
  {
    id: "r-6",
    road: "כביש 6",
    segment: "מחלף חורשים ⟵ מחלף קסם ⟵ נחשונים",
    status: "fluid",
    statusText: "תנועה זורמת ומהירה לשני הכיוונים",
    delayMinutes: 1,
    avgSpeedKmh: 94,
    updatedAt: "לפני 1 דק'",
  },
  {
    id: "r-40",
    road: "כביש 40",
    segment: "הוד השרון ⟵ כפר סבא מזרח ⟵ צומת נווה ימין",
    status: "moderate",
    statusText: "עומס רגיל בשעות הצהריים",
    delayMinutes: 6,
    avgSpeedKmh: 52,
    updatedAt: "לפני 4 דק'",
  },
];

export function calculateDriverETAs(orders: Order[]): DriverETAInfo[] {
  const activeOrders = orders.filter((o) => o.status === "יצא לדרך" || o.status === "בהעמסה");

  return activeOrders.map((o) => {
    let routeRoad = "כביש 531 / 4";
    let baseDelay = 5;
    let trafficState: "fluid" | "moderate" | "heavy" = "fluid";

    if (o.city.includes("רעננה") || o.city.includes("הרצליה")) {
      routeRoad = "כביש 531 מערב";
      baseDelay = 14;
      trafficState = "heavy";
    } else if (o.city.includes("כפר סבא") || o.city.includes("הוד השרון")) {
      routeRoad = "ציר בן גוריון / סוקולוב";
      baseDelay = 6;
      trafficState = "moderate";
    } else if (o.city.includes("תל אביב") || o.city.includes("פתח תקווה")) {
      routeRoad = "כביש 4 / מחלף מורשה";
      baseDelay = 9;
      trafficState = "moderate";
    }

    const now = new Date();
    const [hStr, mStr] = o.targetTime.split(":");
    const targetDate = new Date();
    targetDate.setHours(Number(hStr || 12), Number(mStr || 0), 0, 0);

    const diffMinutes = Math.round((targetDate.getTime() - now.getTime()) / 60000);
    const remainingMinutes = Math.max(5, diffMinutes > 0 ? diffMinutes : 15 + baseDelay);

    const etaDate = new Date(now.getTime() + remainingMinutes * 60000);
    const etaTime = etaDate.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" });

    const totalBella = o.logisticsMetrics.bellaBags;
    const totalSaban = o.logisticsMetrics.sabanPallets;
    const weightTons = (o.logisticsMetrics.estimatedWeightKg / 1000).toFixed(1);

    return {
      orderId: o.orderId,
      driverName: o.driver || "חכמת / עלי",
      vehicle: o.driver.includes("מנוף") ? "מרצדס מנוף" : "איסוזו חלוקה",
      destination: o.address,
      city: o.city,
      targetTime: o.targetTime,
      etaTime,
      remainingMinutes,
      trafficState,
      routeRoad,
      warehouse: o.warehouse,
      itemsSummary: `${totalBella} בלה · ${totalSaban} משטחים (${weightTons} טון)`,
    };
  });
}
