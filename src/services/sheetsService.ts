import type { Driver, Order, OrderItem, OrderStatus, Warehouse } from "@/types/dispatch";

export const DRIVERS: Driver[] = [
  { id: "d1", name: "חכמת", vehicle: "משאית מרצדס מנוף" },
  { id: "d2", name: "אורן", vehicle: "משאית וולוו מנוף" },
  { id: "d3", name: "סאמר", vehicle: "משאית סקניה צד" },
  { id: "d4", name: "יוסי", vehicle: "טנדר הפצה" },
];

export const WAREHOUSES: Warehouse[] = [
  { id: "w4", name: "מחסן 4", loadRatio: 0.72 },
  { id: "w30", name: "מחסן 30", loadRatio: 0.41 },
  { id: "w7", name: "מחסן 7", loadRatio: 0.88 },
];

const item = (sku: string, name: string, quantity: number, isApproved = false): OrderItem => ({
  sku,
  name,
  quantity,
  isApproved,
});

export const MOCK_ORDERS: Order[] = [
  {
    orderId: "6215440",
    customerName: "ערוגת הבשם",
    address: "רחוב התעשייה 12",
    city: "מודיעין עילית",
    warehouse: "מחסן 4",
    driver: "חכמת - משאית מרצדס מנוף",
    targetTime: "11:00",
    round: 2,
    status: "בהעמסה",
    logisticsMetrics: { bellaBags: 12, sabanPallets: 8, estimatedWeightKg: 7400 },
    items: [
      item("11511", "סומסום שק גדול", 24, true),
      item("11551", "טיט שק גדול", 16, true),
      item("10002", "מלט אפור 25 ק״ג", 60),
      item("14604", "חול מחצבה שק", 30),
      item("18094", "בלוק איטונג 20", 48),
    ],
    note: "פריקה בחצר האחורית, נדרש מנוף",
  },
  {
    orderId: "6215441",
    customerName: "מאריו הנדסה",
    address: "שדרות הבנאים 3",
    city: "בית שמש",
    warehouse: "מחסן 30",
    driver: "אורן - משאית וולוו מנוף",
    targetTime: "11:30",
    round: 2,
    status: "ממתין",
    logisticsMetrics: { bellaBags: 6, sabanPallets: 4, estimatedWeightKg: 5200 },
    items: [
      item("10002", "מלט אפור 25 ק״ג", 80),
      item("11551", "טיט שק גדול", 10),
      item("60060", "משטחי סבן", 4),
    ],
  },
  {
    orderId: "6215442",
    customerName: "אחים כהן בנייה",
    address: "הרצל 88",
    city: "ירושלים",
    warehouse: "מחסן 4",
    driver: "סאמר - משאית סקניה צד",
    targetTime: "09:45",
    round: 1,
    status: "יצא לדרך",
    logisticsMetrics: { bellaBags: 18, sabanPallets: 12, estimatedWeightKg: 9100 },
    items: [
      item("14604", "חול מחצבה שק", 50, true),
      item("18094", "בלוק איטונג 20", 64, true),
      item("60002", "שקי בלה", 18, true),
    ],
  },
  {
    orderId: "6215443",
    customerName: "שיא הבנייה בע״מ",
    address: "אזור תעשייה מערב 22",
    city: "מודיעין",
    warehouse: "מחסן 7",
    driver: "יוסי - טנדר הפצה",
    targetTime: "08:30",
    round: 1,
    status: "סופק",
    logisticsMetrics: { bellaBags: 4, sabanPallets: 2, estimatedWeightKg: 1800 },
    items: [
      item("10002", "מלט אפור 25 ק״ג", 40, true),
      item("11511", "סומסום שק גדול", 12, true),
    ],
  },
  {
    orderId: "6215444",
    customerName: "גינות הדר",
    address: "הזית 5",
    city: "בית שמש",
    warehouse: "מחסן 30",
    driver: "חכמת - משאית מרצדס מנוף",
    targetTime: "13:15",
    round: 3,
    status: "ממתין",
    logisticsMetrics: { bellaBags: 9, sabanPallets: 6, estimatedWeightKg: 4300 },
    items: [
      item("14604", "חול מחצבה שק", 36),
      item("11551", "טיט שק גדול", 8),
      item("60060", "משטחי סבן", 6),
    ],
  },
  {
    orderId: "6215445",
    customerName: "בטון אלמוג",
    address: "דרך העמק 17",
    city: "רמלה",
    warehouse: "מחסן 7",
    driver: "אורן - משאית וולוו מנוף",
    targetTime: "14:00",
    round: 3,
    status: "ממתין",
    logisticsMetrics: { bellaBags: 15, sabanPallets: 10, estimatedWeightKg: 8800 },
    items: [
      item("18094", "בלוק איטונג 20", 96),
      item("10002", "מלט אפור 25 ק״ג", 120),
      item("60002", "שקי בלה", 15),
    ],
  },
];

export function getMockOrders(): Order[] {
  return JSON.parse(JSON.stringify(MOCK_ORDERS)) as Order[];
}

/* ------------------------------------------------------------------ */
/* Google Sheets (tab: דשבורד_הזמנות) — CSV parsing                    */
/* ------------------------------------------------------------------ */

const STATUSES: OrderStatus[] = ["ממתין", "בהעמסה", "יצא לדרך", "סופק"];

/** Split a single CSV line honoring quoted fields. */
export function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      out.push(cur.trim());
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur.trim());
  return out;
}

function toNumber(value: string | undefined): number {
  if (!value) return 0;
  const n = Number(String(value).replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function toStatus(value: string | undefined): OrderStatus {
  const v = (value ?? "").trim();
  return STATUSES.includes(v as OrderStatus) ? (v as OrderStatus) : "ממתין";
}

/**
 * Parses rows of the "דשבורד_הזמנות" sheet exported as CSV.
 * Expected headers (Hebrew or English aliases):
 * מספר הזמנה, לקוח, כתובת, עיר, מחסן, נהג, שעת יעד, סבב, סטטוס,
 * שקי בלה, משטחי סבן, משקל, מק"ט, תיאור, כמות, אושר
 * Multiple rows sharing the same order id are merged into one order with items.
 */
export function parseOrdersCsv(csv: string): Order[] {
  const lines = csv.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];

  const headers = parseCsvLine(lines[0] ?? "").map((h) => h.replace(/^"|"$/g, "").trim());
  const idx = (...names: string[]) => {
    for (const n of names) {
      const i = headers.findIndex((h) => h === n);
      if (i >= 0) return i;
    }
    return -1;
  };

  const c = {
    orderId: idx("מספר הזמנה", "הזמנה", "orderId"),
    customer: idx("שם הלקוח", "לקוח", "customerName"),
    address: idx("כתובת", "address"),
    city: idx("עיר", "city"),
    warehouse: idx("מחסן", "warehouse"),
    driver: idx("נהג", "driver"),
    targetTime: idx("שעת יעד", "שעה", "targetTime"),
    round: idx("סבב", "round"),
    status: idx("סטטוס", "status"),
    bella: idx("שקי בלה", "60002"),
    pallets: idx("משטחי סבן", "60060"),
    weight: idx("משקל", "משקל משוער", "weight"),
    sku: idx("מק\u05f4ט", 'מק"ט', "מקט", "sku"),
    itemName: idx("תיאור המוצר", "תיאור", "name"),
    quantity: idx("כמות", "quantity"),
    approved: idx("אושר", "אישור", "isApproved"),
  };

  const map = new Map<string, Order>();

  for (let i = 1; i < lines.length; i++) {
    const cells = parseCsvLine(lines[i] ?? "").map((v) => v.replace(/^"|"$/g, ""));
    const orderId = (c.orderId >= 0 ? cells[c.orderId] : "")?.trim();
    if (!orderId) continue;

    if (!map.has(orderId)) {
      map.set(orderId, {
        orderId,
        customerName: (c.customer >= 0 ? cells[c.customer] : "") || "ללא שם",
        address: (c.address >= 0 ? cells[c.address] : "") || "",
        city: (c.city >= 0 ? cells[c.city] : "") || "",
        warehouse: (c.warehouse >= 0 ? cells[c.warehouse] : "") || "",
        driver: (c.driver >= 0 ? cells[c.driver] : "") || "לא שובץ",
        targetTime: (c.targetTime >= 0 ? cells[c.targetTime] : "") || "--:--",
        round: toNumber(c.round >= 0 ? cells[c.round] : "1") || 1,
        status: toStatus(c.status >= 0 ? cells[c.status] : undefined),
        logisticsMetrics: {
          bellaBags: toNumber(c.bella >= 0 ? cells[c.bella] : ""),
          sabanPallets: toNumber(c.pallets >= 0 ? cells[c.pallets] : ""),
          estimatedWeightKg: toNumber(c.weight >= 0 ? cells[c.weight] : ""),
        },
        items: [],
        updatedAt: new Date().toISOString(),
      });
    }

    const order = map.get(orderId)!;
    const sku = (c.sku >= 0 ? cells[c.sku] : "")?.trim();
    if (sku) {
      const approvedRaw = (c.approved >= 0 ? cells[c.approved] : "")?.trim().toLowerCase();
      order.items.push({
        sku,
        name: (c.itemName >= 0 ? cells[c.itemName] : "") || sku,
        quantity: toNumber(c.quantity >= 0 ? cells[c.quantity] : ""),
        isApproved: ["true", "1", "כן", "v", "✓", "✅", "אושר"].includes(approvedRaw ?? ""),
      });
    }
  }

  return Array.from(map.values());
}

/** Converts a normal Google Sheets URL to a CSV export URL for a given tab. */
export function toCsvUrl(url: string, sheetName = "דשבורד_הזמנות"): string {
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (!match) return url;
  return `https://docs.google.com/spreadsheets/d/${match[1]}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(
    sheetName,
  )}`;
}

export async function fetchOrdersFromSheet(url: string): Promise<Order[]> {
  const target = url.includes("output=csv") || url.includes("out:csv") ? url : toCsvUrl(url);
  const res = await fetch(target, { cache: "no-store" });
  if (!res.ok) throw new Error(`שגיאת גיליון: ${res.status}`);
  const csv = await res.text();
  const orders = parseOrdersCsv(csv);
  if (orders.length === 0) throw new Error("לא נמצאו שורות בגיליון דשבורד_הזמנות");
  return orders;
}
