/**
 * SabanOS - Dynamic Geospatial Coordinates & City Lookup Engine
 * ח. סבן חומרי בניין (1994) בע"מ | מרכז לוגיסטי ותפעול
 *
 * Provides:
 * - High-precision coordinates for company hubs & warehouses
 * - Full regional coverage: Central Sharon, Northern Sharon & Triangle, Gush Dan, East & Shomron
 * - Intelligent city auto-detection from unstructured Hebrew delivery addresses
 * - Fuzzy matching, acronyms resolution (ת"א, כ"ס, פ"ת, רמה"ש)
 * - Waze & Google Maps direct navigation resolution
 * - Dynamic registry for external "ערים_ויעדים" Google Sheets tab syncing
 */

export interface GeoPoint {
  lat: number;
  lon: number;
  defaultZoom?: number;
  region?: string;
  isWarehouse?: boolean;
}

/**
 * מוקדי החברה, מחסנים ראשיים וערים נתמכות
 */
export const KNOWN_CITY_COORDINATES: Record<string, GeoPoint> = {
  // --- מוקדי החברה ומחסנים (ח. סבן) ---
  "החרש 4": { lat: 32.1485, lon: 34.8967, defaultZoom: 16, region: "הוד השרון", isWarehouse: true },
  "התלמיד 1": {
    lat: 32.1432,
    lon: 34.8912,
    defaultZoom: 16,
    region: "הוד השרון",
    isWarehouse: true,
  },
  "מחסן 4": {
    lat: 32.132702508642204,
    lon: 34.89817514726974,
    defaultZoom: 16,
    region: "הוד השרון",
    isWarehouse: true,
  },
  "מחסן 1": { lat: 32.1432, lon: 34.8912, defaultZoom: 16, region: "הוד השרון", isWarehouse: true },
  "מחסן 30": { lat: 32.149, lon: 34.895, defaultZoom: 16, region: "הוד השרון", isWarehouse: true },
  "מחסן 7": { lat: 32.148, lon: 34.897, defaultZoom: 16, region: "הוד השרון", isWarehouse: true },

  // --- שרון מרכזי ---
  "הוד השרון": { lat: 32.155, lon: 34.893, defaultZoom: 13, region: "השרון" },
  "כפר סבא": { lat: 32.175, lon: 34.9069, defaultZoom: 13, region: "השרון" },
  רעננה: { lat: 32.1844, lon: 34.8707, defaultZoom: 13, region: "השרון" },
  הרצליה: { lat: 32.1663, lon: 34.8432, defaultZoom: 13, region: "השרון" },
  "רמת השרון": { lat: 32.1465, lon: 34.8385, defaultZoom: 14, region: "השרון" },

  // --- המשולש והשרון הצפוני ---
  טייבה: { lat: 32.2662, lon: 35.009, defaultZoom: 13, region: "המשולש" },
  טירה: { lat: 32.2341, lon: 34.9501, defaultZoom: 13, region: "המשולש" },
  קלנסווה: { lat: 32.2858, lon: 34.9814, defaultZoom: 13, region: "המשולש" },
  נתניה: { lat: 32.3215, lon: 34.8532, defaultZoom: 13, region: "השרון הצפוני" },
  "אבן יהודה": { lat: 32.2708, lon: 34.8906, defaultZoom: 14, region: "השרון הצפוני" },
  "תל מונד": { lat: 32.2536, lon: 34.9208, defaultZoom: 14, region: "השרון הצפוני" },
  קדימה: { lat: 32.2764, lon: 34.9142, defaultZoom: 14, region: "השרון הצפוני" },
  "קדימה צורן": { lat: 32.2764, lon: 34.9142, defaultZoom: 14, region: "השרון הצפוני" },
  צורן: { lat: 32.2844, lon: 34.9312, defaultZoom: 14, region: "השרון הצפוני" },
  "בני ציון": { lat: 32.2222, lon: 34.869, defaultZoom: 14, region: "השרון" },
  חרוצים: { lat: 32.223, lon: 34.862, defaultZoom: 14, region: "השרון" },
  בצרה: { lat: 32.213, lon: 34.872, defaultZoom: 14, region: "השרון" },
  רישפון: { lat: 32.203, lon: 34.832, defaultZoom: 14, region: "השרון" },
  שפיים: { lat: 32.221, lon: 34.821, defaultZoom: 14, region: "השרון" },
  געש: { lat: 32.233, lon: 34.825, defaultZoom: 14, region: "השרון" },
  "גנות הדר": { lat: 32.3167, lon: 34.9125, defaultZoom: 14, region: "השרון הצפוני" },
  פרדסייה: { lat: 32.3025, lon: 34.908, defaultZoom: 14, region: "השרון הצפוני" },
  "כפר יונה": { lat: 32.3169, lon: 34.9333, defaultZoom: 14, region: "השרון הצפוני" },
  "צור יגאל": { lat: 32.2289, lon: 34.9961, defaultZoom: 14, region: "השרון המזרחי" },
  "כוכב יאיר": { lat: 32.2325, lon: 35.005, defaultZoom: 14, region: "השרון המזרחי" },
  "צור יצחק": { lat: 32.228, lon: 34.991, defaultZoom: 14, region: "השרון המזרחי" },
  "צור נתן": { lat: 32.231, lon: 35.021, defaultZoom: 14, region: "השרון המזרחי" },
  "ג'לג'וליה": { lat: 32.155, lon: 34.954, defaultZoom: 14, region: "השרון המזרחי" },
  "כפר קאסם": { lat: 32.115, lon: 34.975, defaultZoom: 13, region: "המשולש" },
  חריש: { lat: 32.4578, lon: 35.0489, defaultZoom: 15, region: "שרון צפוני" },

  // --- גוש דן, בקעת אונו ומרכז ---
  "פתח תקווה": { lat: 32.084, lon: 34.8878, defaultZoom: 13, region: "מרכז" },
  "ראש העין": { lat: 32.0955, lon: 34.9566, defaultZoom: 13, region: "מרכז" },
  "תל אביב": { lat: 32.0853, lon: 34.7818, defaultZoom: 13, region: "גוש דן" },
  "תל אביב - יפו": { lat: 32.0853, lon: 34.7818, defaultZoom: 13, region: "גוש דן" },
  "רמת גן": { lat: 32.0684, lon: 34.8248, defaultZoom: 13, region: "גוש דן" },
  גבעתיים: { lat: 32.0722, lon: 34.8105, defaultZoom: 14, region: "גוש דן" },
  "בני ברק": { lat: 32.0833, lon: 34.8333, defaultZoom: 14, region: "גוש דן" },
  חולון: { lat: 32.0158, lon: 34.7874, defaultZoom: 13, region: "גוש דן" },
  "בת ים": { lat: 32.0223, lon: 34.7505, defaultZoom: 13, region: "גוש דן" },
  אזור: { lat: 32.0238, lon: 34.8055, defaultZoom: 14, region: "גוש דן" },
  "אור יהודה": { lat: 32.0294, lon: 34.8566, defaultZoom: 14, region: "בקעת אונו" },
  יהוד: { lat: 32.0333, lon: 34.8889, defaultZoom: 14, region: "בקעת אונו" },
  "יהוד-מונוסון": { lat: 32.0333, lon: 34.8889, defaultZoom: 14, region: "בקעת אונו" },
  "קריית אונו": { lat: 32.0636, lon: 34.855, defaultZoom: 14, region: "בקעת אונו" },
  "גני תקווה": { lat: 32.06, lon: 34.87, defaultZoom: 14, region: "בקעת אונו" },
  סביון: { lat: 32.05, lon: 34.88, defaultZoom: 14, region: "בקעת אונו" },
  "בית דגן": { lat: 32.0019, lon: 34.8308, defaultZoom: 14, region: "מרכז" },
  "ראשון לציון": { lat: 31.973, lon: 34.7925, defaultZoom: 13, region: "מרכז" },
  "נס ציונה": { lat: 31.9314, lon: 34.7981, defaultZoom: 14, region: "מרכז" },
  רחובות: { lat: 31.8928, lon: 34.8113, defaultZoom: 13, region: "מרכז" },
  רמלה: { lat: 31.9286, lon: 34.8694, defaultZoom: 13, region: "מרכז" },
  לוד: { lat: 31.9514, lon: 34.8881, defaultZoom: 13, region: "מרכז" },
  שוהם: { lat: 31.9983, lon: 34.9458, defaultZoom: 14, region: "מרכז" },
  אלעד: { lat: 32.052, lon: 34.951, defaultZoom: 14, region: "מרכז" },

  // --- מזרח ושומרון ---
  מודיעין: { lat: 31.8903, lon: 35.0104, defaultZoom: 13, region: "מודיעין" },
  "מודיעין מכבים רעות": { lat: 31.8903, lon: 35.0104, defaultZoom: 13, region: "מודיעין" },
  "מודיעין עילית": { lat: 31.9333, lon: 35.0444, defaultZoom: 14, region: "מודיעין" },
  "עלי זהב": { lat: 32.0772, lon: 35.1055, defaultZoom: 13, region: "שומרון" },
  לשם: { lat: 32.081, lon: 35.101, defaultZoom: 14, region: "שומרון" },
  אריאל: { lat: 32.105, lon: 35.185, defaultZoom: 13, region: "שומרון" },
  ברקן: { lat: 32.115, lon: 35.112, defaultZoom: 14, region: "שומרון" },
  אורנית: { lat: 32.131, lon: 35.012, defaultZoom: 14, region: "שומרון" },
  "אלפי מנשה": { lat: 32.169, lon: 35.019, defaultZoom: 14, region: "שומרון" },
  "קרני שומרון": { lat: 32.17, lon: 35.1, defaultZoom: 13, region: "שומרון" },
  קדומים: { lat: 32.208, lon: 35.174, defaultZoom: 14, region: "שומרון" },
};

/**
 * קיצורים וכינויים נפוצים בעברית
 */
const CITY_ALIASES: Record<string, string> = {
  'ת"א': "תל אביב",
  "תל-אביב": "תל אביב",
  תא: "תל אביב",
  'כ"ס': "כפר סבא",
  "כפר-סבא": "כפר סבא",
  כס: "כפר סבא",
  'פ"ת': "פתח תקווה",
  "פתח-תקווה": "פתח תקווה",
  פת: "פתח תקווה",
  'רמה"ש': "רמת השרון",
  "רמת-השרון": "רמת השרון",
  'ראשל"צ': "ראשון לציון",
  ראשלצ: "ראשון לציון",
  "מודיעין-מכבים-רעות": "מודיעין",
  "מכבים רעות": "מודיעין",
  מכבים: "מודיעין",
  רעות: "מודיעין",
  "הוד-השרון": "הוד השרון",
  הודהשרון: "הוד השרון",
  "בני-ציון": "בני ציון",
  "צור-יגאל": "צור יגאל",
  "כוכב-יאיר": "כוכב יאיר",
  "צור-יצחק": "צור יצחק",
  "ראש-העין": "ראש העין",
  "גני-תקווה": "גני תקווה",
  "קרית אונו": "קריית אונו",
  "ק.אונו": "קריית אונו",
};

// מטמון דינמי להרחבות מטאב "ערים_ויעדים" בגיליון
const dynamicCityRegistry: Map<string, GeoPoint> = new Map();

/**
 * מאפשר הרחבה דינמית של יעדים וקואורדינטות (למשל מטאב 'ערים_ויעדים' בגיליון)
 */
export function registerCustomCoordinates(custom: Record<string, GeoPoint>): void {
  for (const [cityName, point] of Object.entries(custom)) {
    if (cityName && point && typeof point.lat === "number" && typeof point.lon === "number") {
      dynamicCityRegistry.set(cityName.trim(), point);
    }
  }
}

/**
 * מאתר שם עיר מנורמל מתוך טקסט כתובת חופשי (עמודה D) או עמודת עיר (עמודה E).
 */
export function detectCityFromAddress(address?: string, explicitCity?: string): string {
  // 1. בדיקת עיר מפורשת
  if (explicitCity && typeof explicitCity === "string" && explicitCity.trim()) {
    const trimmed = explicitCity.trim();
    if (CITY_ALIASES[trimmed]) return CITY_ALIASES[trimmed];
    // בדיקה מול ערים ידועות
    for (const known of Object.keys(KNOWN_CITY_COORDINATES)) {
      if (trimmed === known || trimmed.includes(known) || known.includes(trimmed)) {
        return known;
      }
    }
    return trimmed;
  }

  // 2. בדיקה מתוך טקסט כתובת חופשי (עמודה D)
  if (!address || typeof address !== "string") return "הוד השרון";
  const cleanAddr = address.trim();

  // א. פיצול לפי פסיק (דוגמה: "בר אילן 8, רעננה")
  if (cleanAddr.includes(",")) {
    const parts = cleanAddr
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);
    for (let i = parts.length - 1; i >= 0; i--) {
      const candidate = parts[i];
      if (CITY_ALIASES[candidate]) return CITY_ALIASES[candidate];
      for (const known of Object.keys(KNOWN_CITY_COORDINATES)) {
        if (candidate === known || candidate.includes(known)) {
          return known;
        }
      }
    }
  }

  // ב. בדיקת כינויים וקיצורים (כ"ס, ת"א וכו')
  for (const [alias, canonical] of Object.entries(CITY_ALIASES)) {
    const regex = new RegExp(`(^|\\s|[.,])${alias.replace(/"/g, '\\"')}(\\s|[.,]|$)`);
    if (regex.test(cleanAddr)) {
      return canonical;
    }
  }

  // ג. בדיקת ערים ידועות מתוך המחרוזת
  for (const known of Object.keys(KNOWN_CITY_COORDINATES)) {
    if (cleanAddr.includes(known)) {
      return known;
    }
  }

  return "הוד השרון";
}

/**
 * מפענח קואורדינטות מדויקות עבור עיר או כתובת מלאה
 */
export function resolveGeoCoordinates(cityOrAddress?: string): GeoPoint & {
  cityName: string;
  isMatched: boolean;
} {
  const fallback = KNOWN_CITY_COORDINATES["הוד השרון"];

  if (!cityOrAddress || typeof cityOrAddress !== "string") {
    return {
      lat: fallback.lat,
      lon: fallback.lon,
      defaultZoom: fallback.defaultZoom,
      region: fallback.region,
      cityName: "הוד השרון",
      isMatched: false,
    };
  }

  const raw = cityOrAddress.trim();

  // 1. בדיקת מטמון דינמי
  if (dynamicCityRegistry.has(raw)) {
    const pt = dynamicCityRegistry.get(raw)!;
    return { ...pt, cityName: raw, isMatched: true };
  }

  // 2. בדיקת שם מדויק מול ערים ידועות
  if (KNOWN_CITY_COORDINATES[raw]) {
    const pt = KNOWN_CITY_COORDINATES[raw];
    return { ...pt, cityName: raw, isMatched: true };
  }

  // 3. בדיקת כינוי מדויק
  if (CITY_ALIASES[raw] && KNOWN_CITY_COORDINATES[CITY_ALIASES[raw]]) {
    const canonical = CITY_ALIASES[raw];
    const pt = KNOWN_CITY_COORDINATES[canonical];
    return { ...pt, cityName: canonical, isMatched: true };
  }

  // 4. זיהוי חכם מתוך הכתובת
  const detectedCity = detectCityFromAddress(raw);
  if (KNOWN_CITY_COORDINATES[detectedCity]) {
    const pt = KNOWN_CITY_COORDINATES[detectedCity];
    return { ...pt, cityName: detectedCity, isMatched: true };
  }

  // 5. חיפוש התאמה חלקית
  for (const [cityKey, pt] of Object.entries(KNOWN_CITY_COORDINATES)) {
    if (raw.includes(cityKey) || cityKey.includes(raw)) {
      return { ...pt, cityName: cityKey, isMatched: true };
    }
  }

  // ברירת מחדל הוד השרון (בסיס ח. סבן)
  return {
    lat: fallback.lat,
    lon: fallback.lon,
    defaultZoom: fallback.defaultZoom,
    region: fallback.region,
    cityName: raw || "הוד השרון",
    isMatched: false,
  };
}

/**
 * יצירת קישור Waze ישיר
 */
export function buildWazeSearchUrl(addressOrCity: string): string {
  const query = encodeURIComponent(addressOrCity.trim());
  return `https://waze.com/ul?q=${query}&navigate=yes`;
}

/**
 * יצירת קישור Google Maps ישיר
 */
export function buildGoogleMapsUrl(addressOrCity: string): string {
  const query = encodeURIComponent(addressOrCity.trim());
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}
