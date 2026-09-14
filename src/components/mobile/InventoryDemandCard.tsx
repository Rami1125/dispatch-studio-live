import { useState, useMemo, useEffect } from "react";
import {
  TrendingUp,
  Package,
  Layers,
  Truck,
  MessageCircle,
  PhoneCall,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  AlertCircle,
  Clock,
  Send,
  Building2,
  AlertTriangle,
  Flame,
} from "lucide-react";
import type { Order, OrderItem } from "@/types/dispatch";
import { parseColumnHProductText, evaluateItemStock } from "@/services/analyticsService";
import { LowStockBadge } from "@/components/inventory/LowStockBadge";
import { cn } from "@/lib/utils";

export interface InventoryDemandProps {
  orders: Order[];
  warehouseName: string;
  warehouseBranchNumber: 1 | 4 | "all";
  pickerName: string;
  onLogReplenishment?: (summaryText: string) => void;
}

interface AggregatedItem {
  sku: string;
  name: string;
  totalDispensed: number;
  unit: string;
  recommendedOrder: string;
  explanation: string;
  urgency: "critical" | "warning" | "high" | "normal" | "low";
  initialStock: number;
  currentStock: number;
  safetyStockLevel: number;
  isLowStock: boolean;
  deficit: number;
}

export function InventoryDemandCard({
  orders,
  warehouseName,
  warehouseBranchNumber,
  pickerName,
  onLogReplenishment,
}: InventoryDemandProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [buyerPhone, setBuyerPhone] = useState("050-0000000");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("saban_buyer_phone");
      if (saved) setBuyerPhone(saved);
    }
  }, []);
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [isSent, setIsSent] = useState(false);

  // 1. Filter orders for this warehouse & relevant statuses:
  // IN_PREPARATION ("בהכנה"), READY_FOR_LOADING ("מוכן להעמסה"), LOADING ("בהעמסה"), IN_TRANSIT ("יצא לדרך"), DELIVERED ("סופק")
  const relevantOrders = useMemo(() => {
    return orders.filter((o) => {
      // Branch filter
      if (warehouseBranchNumber === 4) {
        const isBranch4 = /סניף 4|מחסן 4|החורש|חורש/i.test(o.warehouse);
        if (!isBranch4 && o.warehouse.trim() !== "") {
          if (/סניף 1|מחסן 1|מחסן 30|התלמיד/i.test(o.warehouse)) return false;
        }
      } else if (warehouseBranchNumber === 1) {
        const isBranch1 = /סניף 1|מחסן 1|מחסן 30|התלמיד|תלמיד/i.test(o.warehouse);
        if (!isBranch1 && o.warehouse.trim() !== "") {
          if (/סניף 4|מחסן 4|החורש/i.test(o.warehouse)) return false;
        }
      }

      // Valid statuses
      const validStatuses = ["בהכנה", "מוכן להעמסה", "בהעמסה", "יצא לדרך", "סופק"];
      return validStatuses.includes(o.status);
    });
  }, [orders, warehouseBranchNumber]);

  // 2. Aggregate items and calculate smart burn-rate reorder recommendations with safety stock evaluation
  const aggregatedDemand = useMemo(() => {
    const map = new Map<string, { sku: string; name: string; total: number; unit: string }>();

    relevantOrders.forEach((order) => {
      // 1. Process itemsFormatted (Column H text) if available
      if (order.itemsFormatted && order.itemsFormatted.trim()) {
        const parsed = parseColumnHProductText(order.itemsFormatted);
        parsed.forEach((it) => {
          const key = (it.sku || it.name).trim().toLowerCase();
          const existing = map.get(key);
          if (existing) {
            existing.total += it.quantity;
          } else {
            map.set(key, {
              sku: it.sku || "כללי",
              name: it.name,
              total: it.quantity,
              unit: it.unit || "יח'",
            });
          }
        });
      } else if (order.items && order.items.length > 0) {
        order.items.forEach((it) => {
          const key = (it.sku || it.name).trim().toLowerCase();
          const existing = map.get(key);
          if (existing) {
            existing.total += it.quantity;
          } else {
            map.set(key, {
              sku: it.sku || "כללי",
              name: it.name,
              total: it.quantity,
              unit: it.unit || "יח'",
            });
          }
        });
      }
    });

    const items: AggregatedItem[] = [];

    map.forEach((val) => {
      // Evaluate safety stock status from parsed inventory data
      const stockEval = evaluateItemStock({
        name: val.name,
        quantity: val.total,
        sku: val.sku,
        unit: val.unit,
      });

      const nameLower = val.name.toLowerCase();
      let recommended = "";
      let explanation = "";
      let urgency: AggregatedItem["urgency"] = stockEval.urgency;

      // Reorder Rule 1: Small bags (Cement, Adhesive, Plaster) -> Multiples of 40 bags (1 full pallet = 40 bags)
      if (
        /מלט|דבק|טיח|שפכטל|ספירבונד|ביג גב|סיליקה|מילקו/i.test(nameLower) &&
        !/בלה|שק גדול/i.test(nameLower)
      ) {
        const palletsNeeded = Math.max(1, Math.ceil(val.total / 40));
        const totalBagsRec = palletsNeeded * 40;
        recommended = `${palletsNeeded} משטחים (${totalBagsRec} שקים)`;
        explanation = `נצרכו ${val.total} שק. עיגול למשטח שלם (40 שקים למשטח)`;
        if (stockEval.isLowStock) {
          urgency = "critical";
          explanation = `🚨 מתחת לסף ביטחון! יצאו ${val.total} שק. נותרו ${stockEval.currentStock}/${stockEval.safetyStockLevel} שק.`;
        }
      }
      // Reorder Rule 2: Bulk big bags (Sand, Sesame, Mortar, Gravel, etc.)
      else if (/בלה|שק גדול|סומסום|חול מחצבה|חצץ|טיט שק גדול/i.test(nameLower)) {
        if (val.total >= 8 || stockEval.isLowStock) {
          const trucks = Math.ceil(val.total / 12);
          const bagsTotal = Math.max(14, trucks * 14);
          recommended = `${trucks} פול-טריילר (${bagsTotal} שקי בלה)`;
          explanation = stockEval.isLowStock
            ? `🚨 מתחת לסף ביטחון (${stockEval.currentStock}/${stockEval.safetyStockLevel} בלות). מומלצת הזמנת פול מלא!`
            : `יצאו ${val.total} שקי בלה. דרישה גבוהה: מומלצת הזמנת פול מלא`;
          urgency = stockEval.isLowStock ? "critical" : "high";
        } else {
          const rec = Math.max(4, Math.ceil(val.total * 1.5));
          recommended = `${rec} שקי בלה`;
          explanation = `יצאו ${val.total} בלות. השלמת רצפת מלאי לחצר (+50% מרווח ביטחון)`;
        }
      }
      // Reorder Rule 3: Blocks (20/20, 10/20, Itong, concrete) -> Multiples of 75 or 150 blocks
      else if (/בלוק|איטונג|פומיס/i.test(nameLower)) {
        const palletSize = /10/i.test(nameLower) ? 150 : 75;
        const pallets = Math.max(1, Math.ceil(val.total / palletSize));
        const blocksRec = pallets * palletSize;
        recommended = `${pallets} משטחים (${blocksRec} בלוקים)`;
        explanation = stockEval.isLowStock
          ? `🚨 מתחת לסף ביטחון! נותרו ${stockEval.currentStock}/${stockEval.safetyStockLevel} יח' בלבד.`
          : `נצרכו ${val.total} יח'. עיגול למשטחים שלמים (${palletSize} יח'/משטח)`;
        if (stockEval.isLowStock) urgency = "critical";
      }
      // Reorder Rule 4: Generic / default logic
      else {
        const bufferQty = Math.ceil(val.total * 1.25);
        recommended = `${bufferQty} ${val.unit}`;
        explanation = stockEval.isLowStock
          ? `🚨 מלאי נמוך (${stockEval.currentStock}/${stockEval.safetyStockLevel} ${val.unit}). חידוש דחוף.`
          : `יצאו ${val.total} ${val.unit}. מרווח ביטחון 25%+ לחידוש מלאי`;
      }

      items.push({
        sku: val.sku,
        name: val.name,
        totalDispensed: val.total,
        unit: val.unit,
        recommendedOrder: recommended,
        explanation,
        urgency,
        initialStock: stockEval.initialStock,
        currentStock: stockEval.currentStock,
        safetyStockLevel: stockEval.safetyStockLevel,
        isLowStock: stockEval.isLowStock,
        deficit: stockEval.deficit,
      });
    });

    // Prioritize low stock items first, then by quantity dispensed descending
    return items.sort((a, b) => {
      if (a.isLowStock && !b.isLowStock) return -1;
      if (!a.isLowStock && b.isLowStock) return 1;
      return b.totalDispensed - a.totalDispensed;
    });
  }, [relevantOrders]);

  // Low stock count for quick alert badges
  const lowStockCount = useMemo(
    () => aggregatedDemand.filter((i) => i.isLowStock).length,
    [aggregatedDemand],
  );

  // Totals
  const totalBagsDispensed = useMemo(() => {
    let count = 0;
    relevantOrders.forEach((o) => {
      count += o.logisticsMetrics?.bellaBags || 0;
    });
    return count;
  }, [relevantOrders]);

  const totalPalletsDispensed = useMemo(() => {
    let count = 0;
    relevantOrders.forEach((o) => {
      count += o.logisticsMetrics?.sabanPallets || 0;
    });
    return count;
  }, [relevantOrders]);

  // Handle WhatsApp Reorder generation
  const handleSendWhatsAppToNetanel = () => {
    const dateStr = new Date().toLocaleDateString("he-IL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    const timeStr = new Date().toLocaleTimeString("he-IL", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const cleanPhone = buyerPhone.replace(/[^0-9]/g, "");
    const formattedPhone = cleanPhone.startsWith("0") ? `972${cleanPhone.slice(1)}` : cleanPhone;

    let msg = `*🏗️ דרישת רכש והשלמת מלאי — ח. סבן חומרי בניין*\n`;
    msg += `📍 *מחסן:* ${warehouseName} (סניף ${warehouseBranchNumber})\n`;
    msg += `👷 *שולח הדרישה:* ${pickerName}\n`;
    msg += `📅 *תאריך ושעה:* ${dateStr} בשעה ${timeStr}\n`;
    msg += `------------------------------------\n\n`;

    msg += `*📊 סיכום תנועות יציאה מהחצר היום:* (${relevantOrders.length} הזמנות פעילות/סופקו)\n`;
    msg += `• סה״כ שקי בלה שיצאו: *${totalBagsDispensed}*\n`;
    msg += `• סה״כ משטחים שיצאו: *${totalPalletsDispensed}*\n\n`;

    if (aggregatedDemand.length === 0) {
      msg += `אין פריטים שיצאו היום עד כה מהמחסן.\n\n`;
    } else {
      // Highlight low stock items first if any
      const criticalItems = aggregatedDemand.filter((i) => i.isLowStock);
      if (criticalItems.length > 0) {
        msg += `🚨 *התראת מלאי נמוך קריטי (ירד מתחת לסף ביטחון):*\n`;
        criticalItems.forEach((item, idx) => {
          msg += `⚠️ ${idx + 1}. *${item.name}* (מק״ט ${item.sku}): נותרו במגרש *${item.currentStock}* מתוך סף ${item.safetyStockLevel} ${item.unit}! (יצאו היום: ${item.totalDispensed} ${item.unit})\n   👈 נדרשת הזמנה דחופה: *${item.recommendedOrder}*\n`;
        });
        msg += `\n`;
      }

      msg += `*📦 פירוט פריטים שיצאו מהחצר היום:*\n`;
      aggregatedDemand.forEach((item, idx) => {
        msg += `${idx + 1}. ${item.name} (מק״ט ${item.sku}): *${item.totalDispensed} ${item.unit}* (נותרו: ${item.currentStock}/${item.safetyStockLevel})\n`;
      });

      msg += `\n*🎯 המלצת רכש חכמה למחר (מעוגל למשטחים/פול-טריילר):*\n`;
      aggregatedDemand.forEach((item) => {
        msg += `🔹 *${item.name}*: להזמין *${item.recommendedOrder}*\n   _${item.explanation}_\n`;
      });
    }

    msg += `\n------------------------------------\n`;
    msg += `_דרישת רכש אוטומטית שנוצרה ע״י מערכת נועה AI למחסנאי ח. סבן_\n`;
    msg += `המשך יום מוצלח, נתנאל! 👍`;

    // Save phone preference
    if (typeof window !== "undefined") {
      localStorage.setItem("saban_buyer_phone", buyerPhone);
    }

    // Optional notification log
    if (onLogReplenishment) {
      onLogReplenishment(
        `דרישת רכש עבור ${warehouseName} נשלחה לנתנאל הקניין (${aggregatedDemand.length} פריטים)`,
      );
    }

    setIsSent(true);
    setTimeout(() => setIsSent(false), 5000);

    const waUrl = `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(
      msg,
    )}`;
    window.open(waUrl, "_blank");
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg transition-all">
      {/* Header Bar */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="p-3.5 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border-b border-slate-800 flex items-center justify-between cursor-pointer hover:bg-slate-800/60 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="size-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <TrendingUp className="size-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-black text-white">סיכום יציאות ודרישת מלאי להיום</h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {warehouseName}
              </span>
              {lowStockCount > 0 && (
                <span className="flex items-center gap-1 rounded-full bg-rose-500/20 px-2 py-0.5 text-[10px] font-black text-rose-300 ring-1 ring-rose-500/50 animate-pulse">
                  <Flame className="size-3 text-rose-400" />
                  <span>{lowStockCount} מתחת לסף ביטחון</span>
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400">
              {relevantOrders.length} הזמנות יצאו/בהכנה · {aggregatedDemand.length} מק"טים פעילים
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {aggregatedDemand.length > 0 && (
            <span className="text-[11px] font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
              {aggregatedDemand.length} פריטים לרכש
            </span>
          )}
          <button className="p-1 text-slate-400 hover:text-white">
            {isOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="p-4 space-y-4">
          {/* Low Stock Urgent Alert Banner */}
          {lowStockCount > 0 && (
            <div className="rounded-xl border border-rose-500/50 bg-gradient-to-r from-rose-950/60 via-slate-900 to-rose-950/40 p-3 flex items-center justify-between gap-3 text-xs shadow-lg shadow-rose-950/30 animate-pulse">
              <div className="flex items-center gap-2.5">
                <span className="relative flex h-3 w-3 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500" />
                </span>
                <div>
                  <span className="font-black text-rose-200 block text-xs sm:text-sm">
                    ⚠️ התראת מלאי ביטחון: {lowStockCount} פריטים ירדו מתחת לסף הביטחון המוגדר!
                  </span>
                  <span className="text-[11px] text-rose-300/80">
                    קצב המשיכה מהחצר היום גבוה מסף הבטיחות של המגרש. נדרש תיאום רכש דחוף עם נתנאל.
                  </span>
                </div>
              </div>
              <span className="shrink-0 rounded-lg bg-rose-500/30 px-2 py-1 text-[11px] font-black text-rose-200 border border-rose-500/40">
                רכש דחוף 🔥
              </span>
            </div>
          )}

          {/* Quick Stats Badges */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-slate-950/70 p-2 rounded-xl border border-slate-800/80">
              <span className="text-[10px] text-slate-400 block">הזמנות שיצאו/בטיפול</span>
              <span className="text-base font-black text-sky-400">{relevantOrders.length}</span>
            </div>
            <div className="bg-slate-950/70 p-2 rounded-xl border border-slate-800/80">
              <span className="text-[10px] text-slate-400 block">שקי בלה שיצאו</span>
              <span className="text-base font-black text-amber-400">{totalBagsDispensed}</span>
            </div>
            <div className="bg-slate-950/70 p-2 rounded-xl border border-slate-800/80">
              <span className="text-[10px] text-slate-400 block">משטחי סבן שיצאו</span>
              <span className="text-base font-black text-emerald-400">{totalPalletsDispensed}</span>
            </div>
          </div>

          {/* Two-Column Breakdown Table */}
          {aggregatedDemand.length === 0 ? (
            <div className="p-4 bg-slate-950/50 rounded-xl border border-slate-800 text-center text-xs text-slate-400 space-y-1">
              <Package className="size-6 mx-auto text-slate-600 mb-1" />
              <p className="font-bold text-slate-300">אין עדיין תנועות יציאה מהחצר היום למחסן זה</p>
              <p className="text-[11px]">
                ברגע שהזמנות ייכנסו לליקוט או יסופקו, תחושב דרישת רכש חכמה.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 px-2">
                <span>פריט / מק"ט שיצא מהחצר</span>
                <span>המלצת רכש חכמה למחר</span>
              </div>

              <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                {aggregatedDemand.map((item) => (
                  <div
                    key={`${item.sku}_${item.name}`}
                    className={cn(
                      "rounded-xl p-3 border transition-all flex flex-col gap-2.5 text-xs relative overflow-hidden",
                      item.isLowStock
                        ? "bg-gradient-to-br from-rose-950/30 via-slate-900 to-slate-950/90 border-rose-500/50 shadow-md shadow-rose-950/30 ring-1 ring-rose-500/30"
                        : "bg-slate-950/80 border-slate-800 hover:border-slate-700",
                    )}
                  >
                    {/* Header Row: Item name, SKU, and Pulsating Low Stock Badge */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-black text-slate-100 text-sm leading-tight">
                            {item.name}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500">#{item.sku}</span>
                        </div>
                      </div>

                      {/* Pulsating Low Stock Alert Badge */}
                      {item.isLowStock && (
                        <LowStockBadge
                          currentStock={item.currentStock}
                          safetyStockLevel={item.safetyStockLevel}
                          unit={item.unit}
                          size="xs"
                          urgency={item.urgency === "critical" ? "critical" : "warning"}
                        />
                      )}
                    </div>

                    {/* Stock Metrics Row */}
                    <div className="grid grid-cols-3 gap-2 bg-slate-900/80 p-2 rounded-lg border border-slate-800/80 text-center">
                      <div>
                        <span className="text-[10px] text-slate-400 block">יצאו מהחצר היום</span>
                        <span className="font-mono font-black text-amber-400 text-xs">
                          {item.totalDispensed} {item.unit}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">נותרו במגרש</span>
                        <span
                          className={cn(
                            "font-mono font-black text-xs",
                            item.isLowStock
                              ? "text-rose-400 animate-pulse font-bold"
                              : "text-emerald-400",
                          )}
                        >
                          {item.currentStock} {item.unit}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">סף ביטחון מוגדר</span>
                        <span className="font-mono font-bold text-slate-300 text-xs">
                          {item.safetyStockLevel} {item.unit}
                        </span>
                      </div>
                    </div>

                    {/* Depletion Progress Gauge */}
                    <div className="space-y-1">
                      <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden flex">
                        <div
                          className={cn(
                            "h-full transition-all duration-500",
                            item.isLowStock
                              ? "bg-rose-500 animate-pulse"
                              : item.currentStock <= item.safetyStockLevel * 1.3
                                ? "bg-amber-400"
                                : "bg-emerald-500",
                          )}
                          style={{
                            width: `${Math.min(100, Math.max(5, (item.currentStock / Math.max(1, item.initialStock)) * 100))}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Bottom Row: AI Burn-Rate Reorder */}
                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/60">
                      <span className="text-[10px] text-slate-400 truncate flex-1">
                        {item.explanation}
                      </span>
                      <div className="flex items-center gap-1 text-sky-300 font-black shrink-0">
                        <Sparkles className="size-3 text-amber-400 shrink-0" />
                        <span className="font-bold text-xs">{item.recommendedOrder}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Buyer Phone Configuration & WhatsApp Trigger */}
          <div className="pt-2 border-t border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <span>קניין החברה:</span>
                <strong className="text-white">נתנאל</strong>
              </span>

              {isEditingPhone ? (
                <div className="flex items-center gap-1">
                  <input
                    type="tel"
                    value={buyerPhone}
                    onChange={(e) => setBuyerPhone(e.target.value)}
                    placeholder="050-0000000"
                    className="bg-slate-800 text-slate-100 text-xs px-2 py-0.5 rounded border border-slate-700 w-28 focus:outline-none focus:border-sky-500 font-mono"
                  />
                  <button
                    onClick={() => setIsEditingPhone(false)}
                    className="text-sky-400 text-[11px] font-bold px-1.5 py-0.5 rounded hover:bg-slate-800"
                  >
                    שמור
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsEditingPhone(true)}
                  className="text-sky-400 hover:text-sky-300 font-mono text-[11px] underline underline-offset-2 flex items-center gap-1"
                >
                  <span>{buyerPhone}</span>
                  <span className="text-[10px] text-slate-500">(ערוך)</span>
                </button>
              )}
            </div>

            <button
              onClick={handleSendWhatsAppToNetanel}
              disabled={aggregatedDemand.length === 0}
              className={cn(
                "w-full py-3 px-4 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98]",
                aggregatedDemand.length === 0
                  ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                  : "bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-900/30",
              )}
            >
              {isSent ? (
                <>
                  <CheckCircle2 className="size-4 text-white animate-bounce" />
                  <span>הדרישה נשלחה לנתנאל בהצלחה!</span>
                </>
              ) : (
                <>
                  <MessageCircle className="size-4 fill-white text-emerald-600" />
                  <span>📲 שלח דרישת רכש לנתנאל הקניין ב-WhatsApp</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
