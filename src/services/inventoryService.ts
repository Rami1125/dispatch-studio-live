import type { Order } from "@/types/dispatch";
import {
  PREDEFINED_SAFETY_STOCKS,
  type SafetyStockRule,
  evaluateItemStock,
  parseColumnHProductText,
} from "@/services/analyticsService";

export interface LiveInventoryItem {
  sku: string;
  name: string;
  category: "cement" | "big_bag" | "block" | "dry_mix" | "other";
  unit: string;
  initialStock: number;
  totalDispensedToday: number;
  committedDemand: number;
  currentStock: number;
  safetyStockLevel: number;
  isLowStock: boolean;
  isCritical: boolean;
  deficit: number;
  stockPercentage: number;
  recommendedOrder: string;
  explanation: string;
  lastUpdated: string;
  warehouseBranch: 1 | 4 | "all";
}

export interface LiveInventorySummary {
  items: LiveInventoryItem[];
  criticalCount: number;
  warningCount: number;
  totalBellaBags: number;
  totalSabanPallets: number;
  totalWeightKg: number;
  activeOrdersCount: number;
  completedOrdersCount: number;
  lastCalculatedAt: string;
}

/**
 * Automatically calculates real-time inventory floor stock and safety alerts
 * directly from live Google Sheets orders without requiring any human touch.
 */
export function calculateLiveInventory(
  orders: Order[],
  warehouseBranch: 1 | 4 | "all" = "all",
): LiveInventorySummary {
  // 1. Filter orders for this warehouse if specified
  const relevantOrders = orders.filter((o) => {
    if (warehouseBranch === 4) {
      const isBranch4 = /סניף 4|מחסן 4|החורש|חורש/i.test(o.warehouse);
      if (!isBranch4 && o.warehouse.trim() !== "") {
        if (/סניף 1|מחסן 1|מחסן 30|התלמיד/i.test(o.warehouse)) return false;
      }
    } else if (warehouseBranch === 1) {
      const isBranch1 = /סניף 1|מחסן 1|מחסן 30|התלמיד|תלמיד/i.test(o.warehouse);
      if (!isBranch1 && o.warehouse.trim() !== "") {
        if (/סניף 4|מחסן 4|החורש/i.test(o.warehouse)) return false;
      }
    }
    return true;
  });

  // 2. Track total bella bags, pallets, weight
  let totalBellaBags = 0;
  let totalSabanPallets = 0;
  let totalWeightKg = 0;
  let activeOrdersCount = 0;
  let completedOrdersCount = 0;

  // Map of aggregated items by product key (lowercase SKU or clean name)
  const productAggregator = new Map<
    string,
    {
      sku: string;
      name: string;
      unit: string;
      dispensed: number;
      committed: number;
    }
  >();

  // Ensure default safety stock items always exist in registry
  PREDEFINED_SAFETY_STOCKS.forEach((rule) => {
    const key = (rule.sku || rule.productName).trim().toLowerCase();
    productAggregator.set(key, {
      sku: rule.sku || "כללי",
      name: rule.productName,
      unit: rule.unit,
      dispensed: 0,
      committed: 0,
    });
  });

  // Scan all orders and aggregate quantities
  relevantOrders.forEach((order) => {
    const isDispensed = ["בהכנה", "מוכן להעמסה", "בהעמסה", "יצא לדרך", "סופק"].includes(
      order.status,
    );
    const isCommitted = order.status === "ממתין" || order.status === "בהכנה";

    if (order.status === "סופק" || order.status === "יצא לדרך") {
      completedOrdersCount++;
    } else {
      activeOrdersCount++;
    }

    // Logistics metrics
    if (isDispensed) {
      totalBellaBags += order.logisticsMetrics?.bellaBags || 0;
      totalSabanPallets += order.logisticsMetrics?.sabanPallets || 0;
      totalWeightKg += order.logisticsMetrics?.estimatedWeightKg || 0;
    }

    // Also track bella bags (60002) in product aggregator
    if (order.logisticsMetrics?.bellaBags) {
      const bellaKey = "11511";
      const existing = productAggregator.get(bellaKey);
      if (existing) {
        if (isDispensed) existing.dispensed += order.logisticsMetrics.bellaBags;
        if (isCommitted) existing.committed += order.logisticsMetrics.bellaBags;
      }
    }

    // Parse Column H (itemsFormatted) or order.items
    if (order.itemsFormatted && order.itemsFormatted.trim()) {
      const parsedItems = parseColumnHProductText(order.itemsFormatted);
      parsedItems.forEach((it) => {
        const key = (it.sku || it.name).trim().toLowerCase();
        const existing = productAggregator.get(key);
        if (existing) {
          if (isDispensed) existing.dispensed += it.quantity;
          if (isCommitted) existing.committed += it.quantity;
        } else {
          productAggregator.set(key, {
            sku: it.sku || "כללי",
            name: it.name,
            unit: it.unit || "יח'",
            dispensed: isDispensed ? it.quantity : 0,
            committed: isCommitted ? it.quantity : 0,
          });
        }
      });
    } else if (order.items && order.items.length > 0) {
      order.items.forEach((it) => {
        const key = (it.sku || it.name).trim().toLowerCase();
        const existing = productAggregator.get(key);
        if (existing) {
          if (isDispensed) existing.dispensed += it.quantity;
          if (isCommitted) existing.committed += it.quantity;
        } else {
          productAggregator.set(key, {
            sku: it.sku || "כללי",
            name: it.name,
            unit: it.unit || "יח'",
            dispensed: isDispensed ? it.quantity : 0,
            committed: isCommitted ? it.quantity : 0,
          });
        }
      });
    }
  });

  // Calculate live evaluation and reorder recommendations for each item
  const inventoryItems: LiveInventoryItem[] = [];
  let criticalCount = 0;
  let warningCount = 0;

  productAggregator.forEach((agg) => {
    const stockEval = evaluateItemStock({
      name: agg.name,
      quantity: agg.dispensed,
      sku: agg.sku,
      unit: agg.unit,
    });

    const nameLower = agg.name.toLowerCase();
    let recommendedOrder = "";
    let explanation = "";

    // Automated smart pallet & transport reorder calculation
    if (
      /מלט|דבק|טיח|שפכטל|ספירבונד|ביג גב|סיליקה/i.test(nameLower) &&
      !/בלה|שק גדול/i.test(nameLower)
    ) {
      const palletsNeeded = Math.max(1, Math.ceil(agg.dispensed / 40));
      const totalBags = palletsNeeded * 40;
      recommendedOrder = `${palletsNeeded} משטחים (${totalBags} שקים)`;
      explanation = stockEval.isLowStock
        ? `מתחת לסף ביטחון! נותרו ${stockEval.currentStock}/${stockEval.safetyStockLevel} שק. נדרש משטח שלם.`
        : `יצאו ${agg.dispensed} שק. עיגול למשטח שלם (40 שקים למשטח).`;
    } else if (/בלה|שק גדול|סומסום|חול|חצץ|טיט/i.test(nameLower)) {
      if (agg.dispensed >= 8 || stockEval.isLowStock) {
        const trucks = Math.max(1, Math.ceil(agg.dispensed / 14));
        const bags = trucks * 14;
        recommendedOrder = `${trucks} פול-טריילר (${bags} שקי בלה)`;
        explanation = stockEval.isLowStock
          ? `התראת מלאי קריטי! נותרו ${stockEval.currentStock}/${stockEval.safetyStockLevel} בלות. נדרש פול מלא.`
          : `ביקוש גבוה: מומלצת הזמנת פול מלא (14-28 בלות).`;
      } else {
        const rec = Math.max(4, Math.ceil(agg.dispensed * 1.5));
        recommendedOrder = `${rec} שקי בלה`;
        explanation = `השלמת מלאי חצר (+50% מרווח ביטחון).`;
      }
    } else if (/בלוק|איטונג|פומיס/i.test(nameLower)) {
      const palletSize = /10/i.test(nameLower) ? 150 : 75;
      const pallets = Math.max(1, Math.ceil(agg.dispensed / palletSize));
      const blocksRec = pallets * palletSize;
      recommendedOrder = `${pallets} משטחים (${blocksRec} בלוקים)`;
      explanation = stockEval.isLowStock
        ? `מתחת לסף ביטחון! נותרו ${stockEval.currentStock}/${stockEval.safetyStockLevel} יח'.`
        : `עיגול למשטחים שלמים (${palletSize} יח'/משטח).`;
    } else {
      const buffer = Math.max(1, Math.ceil(agg.dispensed * 1.25));
      recommendedOrder = `${buffer} ${agg.unit}`;
      explanation = stockEval.isLowStock
        ? `מלאי נמוך (${stockEval.currentStock}/${stockEval.safetyStockLevel} ${agg.unit}). חידוש דחוף.`
        : `מרווח ביטחון 25%+ לחידוש מלאי רציף.`;
    }

    if (stockEval.urgency === "critical") criticalCount++;
    if (stockEval.urgency === "warning") warningCount++;

    // Only include if it has movement or predefined safety stock rule
    const isPredefined = PREDEFINED_SAFETY_STOCKS.some(
      (r) => r.sku === agg.sku || r.productName === agg.name,
    );
    if (agg.dispensed > 0 || agg.committed > 0 || isPredefined) {
      inventoryItems.push({
        sku: agg.sku,
        name: agg.name,
        category: stockEval.category,
        unit: agg.unit,
        initialStock: stockEval.initialStock,
        totalDispensedToday: agg.dispensed,
        committedDemand: agg.committed,
        currentStock: stockEval.currentStock,
        safetyStockLevel: stockEval.safetyStockLevel,
        isLowStock: stockEval.isLowStock,
        isCritical: stockEval.urgency === "critical",
        deficit: stockEval.deficit,
        stockPercentage: stockEval.stockPercentage,
        recommendedOrder,
        explanation,
        lastUpdated: new Date().toISOString(),
        warehouseBranch,
      });
    }
  });

  // Sort critical and low stock to top, then by dispensed volume
  inventoryItems.sort((a, b) => {
    if (a.isCritical && !b.isCritical) return -1;
    if (!a.isCritical && b.isCritical) return 1;
    if (a.isLowStock && !b.isLowStock) return -1;
    if (!a.isLowStock && b.isLowStock) return 1;
    return b.totalDispensedToday - a.totalDispensedToday;
  });

  return {
    items: inventoryItems,
    criticalCount,
    warningCount,
    totalBellaBags,
    totalSabanPallets,
    totalWeightKg,
    activeOrdersCount,
    completedOrdersCount,
    lastCalculatedAt: new Date().toISOString(),
  };
}
