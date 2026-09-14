import type { TrafficRouteInfo, DriverETAInfo } from "@/types/screensaver";
import type { Order } from "@/types/dispatch";

export const ARTERIAL_ROUTES: TrafficRouteInfo[] = [
  {
    id: "r-1",
    road: "כביש 1",
    segment: "מחלף דניאל ⟵ שער הגיא ⟵ גינות סחרוב (ירושלים)",
    status: "moderate",
    statusText: "עומס בינוני בעלייה לשער הגיא",
    delayMinutes: 14,
    avgSpeedKmh: 48,
    alert: "עבודות תשתית בנתיב הימני ליד מחלף לטרון",
    updatedAt: "לפני 2 דק'",
  },
  {
    id: "r-6",
    road: "כביש 6",
    segment: "מחלף שורק ⟵ מחלף בן שמן ⟵ נחשונים",
    status: "fluid",
    statusText: "תנועה זורמת ומהירה לשני הכיוונים",
    delayMinutes: 2,
    avgSpeedKmh: 92,
    updatedAt: "לפני 1 דק'",
  },
  {
    id: "r-431",
    road: "כביש 431",
    segment: "רמלה / לוד ⟵ מחלף ראשונים ⟵ מחלף עין הקורא",
    status: "moderate",
    statusText: "עומס קל-בינוני סביב מחלף רמלה דרום",
    delayMinutes: 8,
    avgSpeedKmh: 62,
    alert: "מומלץ למשאיות מנוף לכיוון ראשל״צ להקדים יציאה",
    updatedAt: "לפני 3 דק'",
  },
  {
    id: "r-40",
    road: "כביש 40",
    segment: "עוקף רמלה-לוד ⟵ צומת ביל״ו ⟵ רחובות",
    status: "heavy",
    statusText: "עומס תנועה כבד ברמזורים",
    delayMinutes: 22,
    avgSpeedKmh: 28,
    alert: "פקק מתמשך מצומת אחיסמך לצומת רמלה",
    updatedAt: "לפני 4 דק'",
  },
  {
    id: "r-4",
    road: "כביש 4",
    segment: "יבנה ⟵ ראשון לציון ⟵ חולון דרום",
    status: "fluid",
    statusText: "זרימה תקינה למשאיות חלוקה",
    delayMinutes: 4,
    avgSpeedKmh: 75,
    updatedAt: "לפני 2 דק'",
  },
];

export function calculateDriverETAs(orders: Order[]): DriverETAInfo[] {
  const activeOrders = orders.filter((o) => o.status === "יצא לדרך" || o.status === "בהעמסה");

  return activeOrders.map((o) => {
    // Determine route road based on destination city
    let routeRoad = "כביש 431";
    let baseDelay = 5;
    let trafficState: "fluid" | "moderate" | "heavy" = "fluid";

    if (o.city.includes("ירושלים") || o.city.includes("בית שמש")) {
      routeRoad = "כביש 1 (שער הגיא)";
      baseDelay = 14;
      trafficState = "moderate";
    } else if (o.city.includes("רמלה") || o.city.includes("לוד") || o.city.includes("רחובות")) {
      routeRoad = "כביש 40 (עוקף רמלה)";
      baseDelay = 20;
      trafficState = "heavy";
    } else if (o.city.includes("תל אביב") || o.city.includes("חולון") || o.city.includes("ראשל")) {
      routeRoad = "כביש 431 / 4";
      baseDelay = 8;
      trafficState = "moderate";
    }

    // Parse targetTime ("11:00")
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
      driverName: o.driver || "נהג תורן",
      vehicle: o.driver.includes("וולוו") ? "וולוו מנוף" : "משאית רכינה",
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
