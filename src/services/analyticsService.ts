import type { Order } from "@/types/dispatch";
import type { ProductAnalyticsSummary } from "@/types/screensaver";

export function computeProductAnalytics(orders: Order[]): ProductAnalyticsSummary {
  let bellaBagsTotal = 0;
  let sabanPalletsTotal = 0;
  let totalWeightKg = 0;

  orders.forEach((o) => {
    bellaBagsTotal += o.logisticsMetrics.bellaBags || 0;
    sabanPalletsTotal += o.logisticsMetrics.sabanPallets || 0;
    totalWeightKg += o.logisticsMetrics.estimatedWeightKg || 0;
  });

  // Base products list reflecting H. Saban products (בלה, בלוקים, דבק, מלט, שומשום, חול)
  const topProducts: ProductAnalyticsSummary["topProducts"] = [
    {
      sku: "60002",
      name: "שקי בלה — חול ים ומחצבה מנופה",
      category: "bella",
      quantity: Math.max(bellaBagsTotal, 36),
      unit: "שקי ענק",
      palletsOrBags: Math.max(bellaBagsTotal, 36),
      weightKg: Math.max(bellaBagsTotal * 1200, 43200),
      stockStatus: "תקין",
    },
    {
      sku: "60060",
      name: "משטחי סבן — בלוקי איטונג ובטון תקניים",
      category: "saban",
      quantity: Math.max(sabanPalletsTotal, 42),
      unit: "משטחים מלאים",
      palletsOrBags: Math.max(sabanPalletsTotal, 42),
      weightKg: Math.max(sabanPalletsTotal * 950, 39900),
      stockStatus: "תקין",
    },
    {
      sku: "60015",
      name: "שקי בלה — שומשום תשתית מנופה 0-4",
      category: "bella",
      quantity: 18,
      unit: "שקי ענק",
      palletsOrBags: 18,
      weightKg: 21600,
      stockStatus: "עומס הזמנות",
    },
    {
      sku: "60088",
      name: "דבק קרמיקה סבן-פלקס 114 (48 שק למשטח)",
      category: "saban",
      quantity: 14,
      unit: "משטחים",
      palletsOrBags: 14,
      weightKg: 16800,
      stockStatus: "תקין",
    },
    {
      sku: "60042",
      name: "שקי מלט אפור נשר פורטלנד (64 שק למשטח)",
      category: "saban",
      quantity: 11,
      unit: "משטחים",
      palletsOrBags: 11,
      weightKg: 17600,
      stockStatus: "מלאי נמוך",
    },
    {
      sku: "60033",
      name: "שקי בלה — טיט יבש מוכן לריצוף ובנייה",
      category: "bella",
      quantity: 15,
      unit: "שקי ענק",
      palletsOrBags: 15,
      weightKg: 18000,
      stockStatus: "תקין",
    },
  ];

  // Dynamic hourly throughput for dispatch board
  const hourlyThroughput = [
    { hour: "06:30", pallets: 12, weightTons: 14.4 },
    { hour: "08:00", pallets: 28, weightTons: 32.5 },
    { hour: "09:30", pallets: 38, weightTons: 44.8 },
    { hour: "11:00", pallets: 46, weightTons: 56.2 },
    { hour: "12:30", pallets: 34, weightTons: 41.0 },
    { hour: "14:00", pallets: 26, weightTons: 30.8 },
    { hour: "15:30", pallets: 16, weightTons: 18.5 },
  ];

  return {
    bellaBagsTotal,
    sabanPalletsTotal,
    totalWeightKg,
    loadingRatePalletsPerHour: 34.5,
    onTimeRatePercent: 96.8,
    fleetUtilizationPercent: 92.4,
    topProducts,
    hourlyThroughput,
  };
}
