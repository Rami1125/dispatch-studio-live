import type { Driver, Order, OrderItem, OrderStatus, Warehouse } from "@/types/dispatch";

export const DRIVERS: Driver[] = [
  { id: "d1", name: "חכמת", vehicle: "משאית מרצדס מנוף" },
  { id: "d2", name: "אורן", vehicle: "משאית וולוו מנוף" },
  { id: "d3", name: "סאמר", vehicle: "משאית סקניה צד" },
  { id: "d4", name: "יוסי", vehicle: "טנדר הפצה" },
];

/** גיליון העבודה של ח. סבן — טאב "דשבורד_הזמנות" */
export const DEFAULT_SHEET_URL =
  "https://docs.google.com/spreadsheets/d/1VA9J6n9IYcooO_s2xOpnkvyDQWWQD3pfhh0cnenCkoA/edit";

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
    orderId: "6215454",
    customerName: "שחר שאול תכנון",
    address: "משיכה עצמית מחסן 4 החרש",
    city: "כפר סבא",
    warehouse: "🏭 4️⃣(החרש)",
    driver: "נהג הלקוח (איסוף עצמי)",
    targetTime: "12:00",
    round: 1,
    status: "בהכנה",
    logisticsMetrics: { bellaBags: 2, sabanPallets: 2, estimatedWeightKg: 3800 },
    itemsFormatted:
      '2 סומסום, 80 ריצופית אפור, 30 פלסטומר 603, 12 גבס כחול, 10 מסלול 70, 20 ניצב 70, 1 אלסטוסיל SE980, 4 מלט, 4 טיט, 15 בלוק 7, 1 רשת טיח ממ"ד',
    items: [
      item("11511", "סומסום בלה", 2, true),
      item("60088", "ריצופית אפור", 80, true),
      item("60089", "פלסטומר 603", 30),
      item("10002", "מלט אפור 25 ק״ג", 4),
      item("11551", "טיט שק", 4),
      item("18094", "בלוק 7", 15),
    ],
    note: "איסוף עצמי עד 12:00",
  },
  {
    orderId: "6215440",
    customerName: 'מאריו הנדסה בע"מ',
    address: "בר אילן 8",
    city: "רעננה",
    warehouse: "מחסן 4 החרש",
    driver: "חכמת (מרצדס מנוף)",
    targetTime: "11:00",
    round: 2,
    status: "סופק",
    logisticsMetrics: { bellaBags: 5, sabanPallets: 1, estimatedWeightKg: 6200 },
    itemsFormatted:
      '2 סומסום בלה, 3 חול בלה, 6 מלט אפור 25 ק"ג, 10 טיח גבס MP75, 1 הובלת מנוף כ"ס-רעננה',
    items: [
      item("11511", "סומסום בלה", 2, true),
      item("11501", "חול בלה", 3, true),
      item("10002", "מלט אפור 25 ק״ג", 6, true),
      item("11551", "טיח גבס MP75", 10, true),
    ],
    note: "סופק במלואו ברעננה",
  },
  {
    orderId: "6215462",
    customerName: "אילתי אברהם/כללי (אבי אילתי)",
    address: "מגדל הלבנון 14",
    city: "מודיעין",
    warehouse: "🏭 4️⃣(החרש)",
    driver: "חכמת (משאית מרצדס מנוף 615-41-002)",
    targetTime: "08:00",
    round: 1,
    status: "בהעמסה",
    logisticsMetrics: { bellaBags: 11, sabanPallets: 1, estimatedWeightKg: 13500 },
    itemsFormatted:
      '8 סומסום שק גדול, 3 טיט שק גדול, 20 מלט אפור 25 ק"ג, 1 הובלת מנוף מודיעין (18094)',
    items: [
      item("11511", "סומסום שק גדול", 8, true),
      item("11551", "טיט שק גדול", 3, true),
      item("10002", "מלט אפור 25 ק״ג", 20, true),
    ],
    note: "מנוף פריקה מודיעין",
  },
  {
    orderId: "6215463",
    customerName: "השוקדים-כללי (ירון)",
    address: "חנין בית חולים מאיר 1",
    city: "כפר סבא",
    warehouse: "🏭 4️⃣(החרש)",
    driver: "עלי (משאית איסוזו פתוחה 651-51-701)",
    targetTime: "08:30",
    round: 1,
    status: "מוכן להעמסה",
    logisticsMetrics: { bellaBags: 0, sabanPallets: 0, estimatedWeightKg: 1900 },
    itemsFormatted:
      '25 מלט אפור 25 ק"ג, 25 טיט שק, 1 פוליגג משוריין 20 ק"ג, 1 מברשת זפת, הובלה ללא פריקה כ"ס-רעננה (818055)',
    items: [
      item("10002", "מלט אפור 25 ק״ג", 25, true),
      item("11551", "טיט שק", 25, true),
      item("11600", "פוליגג משוריין 20 ק״ג", 1),
    ],
    note: "הובלה ללא פריקה",
  },
  {
    orderId: "6215465",
    customerName: "פנינית ומור בר",
    address: "איגוז 9",
    city: "בני ציון",
    warehouse: "🏭 4️⃣(החרש)",
    driver: "חכמת (מרצדס מנוף)",
    targetTime: "07:30",
    round: 1,
    status: "בהכנה",
    logisticsMetrics: { bellaBags: 5, sabanPallets: 6, estimatedWeightKg: 14200 },
    itemsFormatted:
      "25 מלט אפור, 300 בלוק 20, 150 בלוק 10, 1 חול בלה, 2 סומסום בלה, 2 טיט בלה, 1 רשת טיח",
    items: [
      item("10002", "מלט אפור", 25),
      item("18094", "בלוק 20", 300),
      item("18095", "בלוק 10", 150),
      item("11501", "חול בלה", 1),
      item("11511", "סומסום בלה", 2),
      item("11551", "טיט בלה", 2),
    ],
    note: "5 משטחי בלוקים, 1 משטח סבן, 5 בלות",
  },
  {
    orderId: "6215473",
    customerName: "קדם גלעד",
    address: "מזל דלי 1",
    city: "הוד השרון",
    warehouse: "מחסן 4 החרש",
    driver: "חכמת (מרצדס מנוף)",
    targetTime: "14:00",
    round: 2,
    status: "ממתין",
    logisticsMetrics: { bellaBags: 0, sabanPallets: 2, estimatedWeightKg: 2800 },
    itemsFormatted:
      '30 לוח עץ פיני 3 מטר, 50 מייק 10, 6 שליכט בגר, 6 איסכורית 2 מטר, 2 רשת צל, 2 רשת ממ"ד, מנוף הוד השרון',
    items: [
      item("19001", "לוח עץ פיני 3 מטר", 30),
      item("19002", "מייק 10", 50),
      item("11551", "שליכט בגר", 6),
      item("19003", "איסכורית 2 מטר", 6),
    ],
    note: "מנוף הוד השרון",
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
    status: "יצא לדרך",
    logisticsMetrics: { bellaBags: 6, sabanPallets: 4, estimatedWeightKg: 5200 },
    itemsFormatted: '80 מלט אפור 25 ק"ג, 10 טיט שק גדול, 4 משטחי סבן',
    items: [
      item("10002", "מלט אפור 25 ק״ג", 80),
      item("11551", "טיט שק גדול", 10),
      item("60060", "משטחי סבן", 4),
    ],
  },
];

export function getMockOrders(): Order[] {
  return JSON.parse(JSON.stringify(MOCK_ORDERS)) as Order[];
}

/* ------------------------------------------------------------------ */
/* Google Sheets (tab: דשבורד_הזמנות) — CSV parsing                    */
/* ------------------------------------------------------------------ */

const STATUSES: OrderStatus[] = ["ממתין", "בהכנה", "מוכן להעמסה", "בהעמסה", "יצא לדרך", "סופק"];

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

/** מפצל CSV לשורות תוך כיבוד מרכאות (תאים עם ירידות שורה). */
export function splitCsvRecords(csv: string): string[] {
  const records: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < csv.length; i++) {
    const ch = csv[i];
    if (ch === '"') {
      if (inQuotes && csv[i + 1] === '"') {
        cur += '""';
        i++;
        continue;
      }
      inQuotes = !inQuotes;
      cur += ch;
    } else if ((ch === "\n" || ch === "\r") && !inQuotes) {
      if (ch === "\r" && csv[i + 1] === "\n") i++;
      if (cur.trim().length > 0) records.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  if (cur.trim().length > 0) records.push(cur);
  return records;
}

function toNumber(value: string | undefined): number {
  if (!value) return 0;
  const n = Number(String(value).replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function toStatus(value: string | undefined): OrderStatus {
  const v = (value ?? "").trim();
  if (STATUSES.includes(v as OrderStatus)) return v as OrderStatus;
  if (/סופק|נמסר|הושלם|בוצע/.test(v)) return "סופק";
  if (/יצא|בדרך|בהפצה|נשלח/.test(v)) return "יצא לדרך";
  if (/מוכן|מוכן להעמסה|ברציף/.test(v)) return "מוכן להעמסה";
  if (/העמסה|נטען|מועמס/.test(v)) return "בהעמסה";
  if (/הכנה|בהכנה|ליקוט|בליקוט/.test(v)) return "בהכנה";
  return "ממתין";
}

const HEBREW_NUMBERS: Record<string, number> = {
  אחד: 1,
  שני: 2,
  שתי: 2,
  שלוש: 3,
  ארבע: 4,
  חמש: 5,
};

/**
 * ממיר תא "פירוט מוצרים וכמויות" (טקסט חופשי) לרשימת פריטים.
 * דוגמה: "2 בלות סומסום, 3 בלות חול, 6 שק מלט אפור"
 */
export function parseProductList(text: string, orderId = ""): OrderItem[] {
  if (!text || !text.trim()) return [];
  return text
    .split(/[,;\n]|\s\+\s/)
    .map((part) => part.trim())
    .filter((part) => part.length > 0)
    .map((part, index) => {
      const leading = part.match(/^(\d+(?:\.\d+)?)\s*(.*)$/);
      let quantity = leading ? Number(leading[1]) : 0;
      let name = leading ? (leading[2] ?? "").trim() : part;
      if (!leading) {
        const inner = part.match(/(\d+(?:\.\d+)?)/);
        if (inner) quantity = Number(inner[1]);
      }
      if (!quantity) {
        const word = Object.keys(HEBREW_NUMBERS).find((w) => part.startsWith(w));
        if (word) {
          quantity = HEBREW_NUMBERS[word] ?? 0;
          name = part.slice(word.length).trim();
        }
      }
      return {
        sku: `${orderId || "P"}-${index + 1}`,
        name: name || part,
        quantity: quantity || 1,
        isApproved: false,
      } satisfies OrderItem;
    });
}

/**
 * Parses rows of the "דשבורד_הזמנות" sheet exported as CSV.
 * Expected headers (Hebrew or English aliases):
 * מספר הזמנה, לקוח, כתובת, עיר, מחסן, נהג, שעת יעד, סבב, סטטוס,
 * שקי בלה, משטחי סבן, משקל, מק"ט, תיאור, כמות, אושר
 * Multiple rows sharing the same order id are merged into one order with items.
 */
export function parseOrdersCsv(csv: string): Order[] {
  const lines = splitCsvRecords(csv);
  if (lines.length < 2) return [];

  // Search first 10 lines for the actual header row
  let headerRowIndex = 0;
  let headers = parseCsvLine(lines[0] ?? "").map((h) => h.replace(/^"|"$/g, "").trim());
  for (let i = 0; i < Math.min(lines.length, 10); i++) {
    const candidate = parseCsvLine(lines[i] ?? "").map((h) => h.replace(/^"|"$/g, "").trim());
    if (
      candidate.some(
        (h) =>
          h.includes("הזמנה") ||
          h.includes("לקוח") ||
          h.includes("מוצרים") ||
          h.includes("סבב ושעה"),
      )
    ) {
      headerRowIndex = i;
      headers = candidate;
      break;
    }
  }

  // התאמה מדויקת ואם אין — התאמה חלקית
  const idx = (...names: string[]) => {
    for (const n of names) {
      const i = headers.findIndex((h) => h === n);
      if (i >= 0) return i;
    }
    for (const n of names) {
      const i = headers.findIndex((h) => h.includes(n));
      if (i >= 0) return i;
    }
    return -1;
  };

  const c = {
    orderId: idx("מספר הזמנה", "הזמנה", "orderId"),
    customer: idx("שם לקוח", "שם הלקוח", "לקוח", "customerName"),
    address: idx("כתובת פריקה", "כתובת יעד ועיר", "כתובת", "address"),
    city: idx("עיר", "city"),
    warehouse: idx("מחסן יוצא", "מחסן מקור", "מחסן", "warehouse"),
    driver: idx("נהג מוקצה", "נהג משובץ", "נהג", "driver"),
    products: idx("פירוט מוצרים וכמויות", "פירוט מוצרים", "מוצרים", "itemsFormatted"),
    targetTime: idx("שעת יעד", "שעה", "targetTime"),
    round: idx("סבב ושעה", "סבב", "round"),
    status: idx("סטטוס ביצוע", "סטטוס", "status"),
    deposits: idx("פקדונות", "בלות/משטחים", "פקדונות (בלות/משטחים)"),
    bella: idx("שקי בלה", "60002"),
    pallets: idx("משטחי סבן", "60060"),
    weight: idx("משקל", "משקל משוער", "weight"),
    sku: idx("מק\u05f4ט", 'מק"ט', "מקט", "sku"),
    itemName: idx("תיאור המוצר", "תיאור", "name"),
    quantity: idx("כמות", "quantity"),
    approved: idx("אושר", "אישור", "isApproved"),
    updatedAt: idx("תאריך עדכון", "תאריך", "updatedAt", "עדכון"),
  };

  const map = new Map<string, Order>();

  for (let i = headerRowIndex + 1; i < lines.length; i++) {
    const cells = parseCsvLine(lines[i] ?? "").map((v) => v.replace(/^"|"$/g, ""));
    const orderId = (c.orderId >= 0 ? cells[c.orderId] : "")?.trim();
    // Skip empty rows, header rows repeated, or archive section separators
    if (!orderId || orderId.includes("הזמנה") || orderId.length > 20) continue;

    if (!map.has(orderId)) {
      const rawDate = (c.updatedAt >= 0 ? cells[c.updatedAt] : "")?.trim();
      const roundCell = (c.round >= 0 ? cells[c.round] : "") || "";
      let targetTime = (c.targetTime >= 0 ? cells[c.targetTime] : "")?.trim() || "";
      if (!targetTime || targetTime === "--:--") {
        const timeMatch = roundCell.match(/(\d{1,2}:\d{2})/);
        if (timeMatch) {
          targetTime = timeMatch[1];
        } else {
          targetTime = "11:00";
        }
      }

      const roundMatch = roundCell.match(/סבב\s*(\d+)/);
      const roundNum = roundMatch ? Number(roundMatch[1]) : toNumber(roundCell) || 1;

      // Extract deposits if available (e.g. "2 בלות (60002), 2 משטחי סבן (60060)")
      const depositsCell = (c.deposits >= 0 ? cells[c.deposits] : "")?.trim();
      let bellaCount = toNumber(c.bella >= 0 ? cells[c.bella] : "");
      let palletsCount = toNumber(c.pallets >= 0 ? cells[c.pallets] : "");

      if (depositsCell) {
        const bellaMatch = depositsCell.match(/(\d+)\s*(?:בלות|בלה)/);
        if (bellaMatch && !bellaCount) bellaCount = Number(bellaMatch[1]);
        const palletMatch = depositsCell.match(/(\d+)\s*(?:משטחי סבן|משטחים)/);
        if (palletMatch && !palletsCount) palletsCount = Number(palletMatch[1]);
      }

      map.set(orderId, {
        orderId,
        customerName: (c.customer >= 0 ? cells[c.customer] : "") || "ללא שם",
        address: (c.address >= 0 ? cells[c.address] : "") || "",
        city: (c.city >= 0 ? cells[c.city] : "") || "",
        warehouse: (c.warehouse >= 0 ? cells[c.warehouse] : "") || "מגרש 4 החרש",
        driver: (c.driver >= 0 ? cells[c.driver] : "") || "לא שובץ",
        targetTime,
        round: roundNum,
        status: toStatus(c.status >= 0 ? cells[c.status] : undefined),
        logisticsMetrics: {
          bellaBags: bellaCount,
          sabanPallets: palletsCount,
          estimatedWeightKg: toNumber(c.weight >= 0 ? cells[c.weight] : ""),
        },
        items: [],
        itemsFormatted: "",
        updatedAt: rawDate || new Date().toISOString(),
      });
    }

    const order = map.get(orderId)!;

    // פורמט שורה-אחת-להזמנה: כל המוצרים בתא טקסט אחד
    const productsCell = (c.products >= 0 ? cells[c.products] : "")?.trim();
    if (productsCell) {
      order.itemsFormatted = productsCell;
      if (order.items.length === 0) {
        order.items = parseProductList(productsCell, orderId);
      }
    }

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

/* ------------------------------------------------------------------ */
/* Google Sheets Status Column Write-Back Service                     */
/* ------------------------------------------------------------------ */

export interface UpdateStatusPayload {
  orderId: string;
  status: OrderStatus;
  webhookUrl?: string;
  spreadsheetId?: string;
  sheetName?: string;
}

export interface UpdateStatusResult {
  success: boolean;
  orderId: string;
  status: OrderStatus;
  syncedToSheet: boolean;
  message: string;
  updatedAt: string;
  row?: number;
  statusColumn?: number;
  error?: string;
}

/**
 * שולח בקשת עדכון סטטוס לעמודת 'סטטוס' בגיליון Google Sheets.
 * קורא לשרת Proxy מקומי (/api/sheets/update-status) המזרים ישירות ל-Google Apps Script Webhook.
 */
export async function updateSheetOrderStatus(
  payload: UpdateStatusPayload,
): Promise<UpdateStatusResult> {
  const res = await fetch("/api/sheets/update-status", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorText = await res.text();
    let msg = `שגיאת שרת (${res.status})`;
    try {
      const parsed = JSON.parse(errorText) as { error?: string; message?: string };
      msg = parsed.error || parsed.message || msg;
    } catch {
      msg = errorText || msg;
    }
    throw new Error(msg);
  }

  return (await res.json()) as UpdateStatusResult;
}

/**
 * בודק תקינות חיבור כתיבה ל-Google Apps Script Webhook
 */
export async function testSheetWebhookConnection(
  webhookUrl: string,
): Promise<{ success: boolean; message: string }> {
  const res = await fetch("/api/sheets/test-connection", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ webhookUrl }),
  });

  if (!res.ok) {
    const errText = await res.text();
    let msg = `בדיקת חיבור נכשלה (${res.status})`;
    try {
      const parsed = JSON.parse(errText) as { error?: string; message?: string };
      msg = parsed.error || parsed.message || msg;
    } catch {
      msg = errText || msg;
    }
    throw new Error(msg);
  }

  return (await res.json()) as { success: boolean; message: string };
}

/**
 * קוד Google Apps Script מלא להעתקה בלחיצת כפתור אחת.
 * מותאם בדיוק למבנה הגיליון 'נועה Ai' / 'דשבורד_הזמנות':
 * מאתר לפי עמודה A (מספר הזמנה), ומעדכן את עמודה N (סטטוס) ועמודה T (תאריך עדכון).
 */
export const APPS_SCRIPT_TEMPLATE = `/**
 * Google Apps Script Web App - עדכון עמודת סטטוס עבור ח. סבן
 * קובץ: נועה Ai | טאב: דשבורד_הזמנות
 * פריסה: Extensions -> Apps Script -> הדבק -> Deploy as Web App (Anyone)
 */

function doGet(e) {
  return handleStatusUpdate(e.parameter || {});
}

function doPost(e) {
  var params = {};
  if (e.postData && e.postData.contents) {
    try {
      params = JSON.parse(e.postData.contents);
    } catch(err) {
      params = e.parameter || {};
    }
  } else {
    params = e.parameter || {};
  }
  return handleStatusUpdate(params);
}

function handleStatusUpdate(params) {
  // בדיקת פינג
  if (params.ping) {
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: "חיבור Google Apps Script לעמודת סטטוס פעיל ומגיב בהצלחה!"
    })).setMimeType(ContentService.MimeType.JSON);
  }

  var orderId = String(params.orderId || "").trim();
  var newStatus = String(params.status || "").trim();
  var sheetName = String(params.sheetName || "דשבורד_הזמנות").trim();

  if (!orderId || !newStatus) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: "חסר מספר הזמנה (orderId) או סטטוס (status)"
    })).setMimeType(ContentService.MimeType.JSON);
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName) || ss.getActiveSheet();
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: "לא נמצאו נתונים בגיליון " + sheetName
    })).setMimeType(ContentService.MimeType.JSON);
  }

  var headers = data[0];
  var orderIdCol = 0;   // עמודה A - מספר הזמנה
  var statusCol = 13;   // עמודה N - סטטוס (עמודה 14)
  var updateDateCol = 19; // עמודה T - תאריך עדכון (עמודה 20)

  for (var c = 0; c < headers.length; c++) {
    var h = String(headers[c] || "").trim();
    if (h === "מספר הזמנה" || h === "הזמנה" || h === "orderId") orderIdCol = c;
    if (h === "סטטוס" || h === "status") statusCol = c;
    if (h === "תאריך עדכון" || h === "updatedAt" || h === "עדכון") updateDateCol = c;
  }

  var rowIndex = -1;
  for (var r = 1; r < data.length; r++) {
    var cellId = String(data[r][orderIdCol]).trim();
    if (cellId === orderId) {
      rowIndex = r + 1; // שורה 1-indexed בגוגל שיטס
      break;
    }
  }

  if (rowIndex === -1) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      orderId: orderId,
      error: "הזמנה #" + orderId + " לא אותרה בגיליון " + sheetName
    })).setMimeType(ContentService.MimeType.JSON);
  }

  // עדכון ישיר של עמודת סטטוס בגיליון
  sheet.getRange(rowIndex, statusCol + 1).setValue(newStatus);

  // עדכון חותמת זמן ישראל
  var nowStr = Utilities.formatDate(new Date(), "Asia/Jerusalem", "yyyy-MM-dd HH:mm:ss");
  sheet.getRange(rowIndex, updateDateCol + 1).setValue(nowStr);

  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    orderId: orderId,
    status: newStatus,
    updatedAt: nowStr,
    row: rowIndex,
    statusColumn: statusCol + 1,
    message: "עודכן בהצלחה בעמודת סטטוס (שורה " + rowIndex + ") בגיליון " + sheetName
  })).setMimeType(ContentService.MimeType.JSON);
}
`;
