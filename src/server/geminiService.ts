import { GoogleGenAI } from "@google/genai";

let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI | null {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey: key });
  }
  return aiClient;
}

export interface GenerateInsightRequest {
  prompt?: string;
  role?: "warehouse" | "driver" | "dispatcher" | "screensaver";
  trainingFocus?: string;
  tone?: "urgent" | "informative" | "operational";
  contextData?: {
    activeOrdersCount?: number;
    loadingOrdersCount?: number;
    trafficSummary?: string;
    busiestWarehouse?: string;
    totalWeightKg?: number;
  };
}

export interface GenerateInsightResponse {
  message: string;
  roleSpecificBriefing: {
    forWarehouse: string;
    forDriver: string;
    scheduledNotice: string;
  };
  trafficAdvice: string;
  suggestedLevel: "info" | "warning" | "critical" | "success";
  source: "gemini" | "heuristic";
}

export async function handleGenerateInsight(
  body: GenerateInsightRequest,
): Promise<GenerateInsightResponse> {
  const {
    prompt = "",
    role = "dispatcher",
    trainingFocus = "בטיחות העמסה וזרימת נהגים",
    tone = "operational",
    contextData = {},
  } = body;

  const ai = getAiClient();

  if (ai) {
    try {
      const systemInstruction = `אתה מודל AI מבצעי בשם "נועה AI" של חברת "ח. סבן - חומרי בניין והפצה".
תפקידך לספק עדכונים לוגיסטיים בזמן אמת עבור לוח הטלוויזיה של מחלקת הסידור וההפצה, עבור שומר המסך הדיגיטלי, ועבור הנהגים והמחסנאים.
פוקוס האימון הנוכחי: "${trainingFocus}".
סגנון נדרש: תמציתי, מקצועי, לוגיסטי, בעברית רהוטה וברורה.
התייחס לסוגי המוצרים העיקריים של ח. סבן: שקי בלה (חול מחצבה, שומשום, טיט) ומשטחי סבן (בלוקים, דבקים, מלט).`;

      const userPrompt = `הפק ניתוח מבצעי והנחיות מיידיות בהתאם לנתוני המערכת הבאים:
- הזמנות פעילות: ${contextData.activeOrdersCount ?? 5}
- משאיות בהעמסה כעת: ${contextData.loadingOrdersCount ?? 1}
- עומס מחסנים: ${contextData.busiestWarehouse ?? "מחסן 7 (85%)"}
- מצב תנועה/צירים: ${contextData.trafficSummary ?? "עומס בכביש 1 לכיוון שער הגיא"}
- משקל מצטבר היום: ${contextData.totalWeightKg ?? 25000} ק"ג
- הנחיית מוקדן נוספת: "${prompt || "עדכון שוטף ודגשי בטיחות לשומר המסך והמסך הראשי"}"

עליך להחזיר תשובה בפורמט JSON תקני בלבד עם המבנה הבא:
{
  "message": "הודעה קצרה וממוקדת לסטריפ הטלוויזיה ושומר המסך (עד 15 מילים)",
  "roleSpecificBriefing": {
    "forWarehouse": "הנחיה מדויקת למחסנאי ולמלגזן (למשל: סדר העמסת שקי בלה לפני משטחים, בדיקת קשירה)",
    "forDriver": "הנחיה מדויקת לנהג (למשל: צפי פקקים, תיאום טלפוני עם אתר בנייה, חלוקת סרנים)",
    "scheduledNotice": "הודעה מתוזמנת לסבב הקרוב"
  },
  "trafficAdvice": "המלצת ציר נסיעה עוקף או התראה על עומסים",
  "suggestedLevel": "info" // אחת מהאפשרויות: "info" | "warning" | "critical" | "success"
}`;

      const result = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: userPrompt,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          temperature: 0.3,
        },
      });

      const text = result.text?.trim();
      if (text) {
        const parsed = JSON.parse(text) as {
          message: string;
          roleSpecificBriefing: {
            forWarehouse: string;
            forDriver: string;
            scheduledNotice: string;
          };
          trafficAdvice: string;
          suggestedLevel: "info" | "warning" | "critical" | "success";
        };

        return {
          ...parsed,
          source: "gemini",
        };
      }
    } catch (err) {
      console.warn("Gemini generation failed, falling back to heuristics:", err);
    }
  }

  // Realistic operational heuristics fallback
  return getHeuristicInsight(body);
}

function getHeuristicInsight(body: GenerateInsightRequest): GenerateInsightResponse {
  const focus = body.trainingFocus || "בטיחות וזמנים";
  const warehouse = body.contextData?.busiestWarehouse || "מחסן 7";
  const traffic = body.contextData?.trafficSummary || "עומס קל בכביש 1 וציר 431";

  const warehouseTips = [
    `לתעדף העמסת שקי בלה קודם בצמוד לקבינה לשמירה על יציבות סרן קדמי, ולאחר מכן משטחי סבן.`,
    `לוודא בדיקת תעודת משלוח ומספר מק״ט מול המלגזה לפני הידוק רצועות המנוף.`,
    `עומס גבוה ב${warehouse}: לשחרר קודם הזמנות סבב 1 שמועדיהן תוך 30 דקות.`,
  ];

  const driverTips = [
    `עדכון צירים: ${traffic}. מומלץ לנהגי חלוקה לרמלה ומודיעין לבדוק ציר 431 חלופי.`,
    `פריקה באתרי בנייה: לוודא פתיחת רגלי מנוף על משטח יציב בלבד ותיאום טלפוני 15 דק' לפני הגעה.`,
    `חלוקת משקל: משאית וולוו מנוף מקסימום 12 משטחים לנסיעה, לוודא סגירת דפנות.`,
  ];

  const randomWarehouseTip = warehouseTips[Math.floor(Math.random() * warehouseTips.length)]!;
  const randomDriverTip = driverTips[Math.floor(Math.random() * driverTips.length)]!;

  return {
    message: body.prompt
      ? `נועה AI: ${body.prompt}`
      : `דגש מבצעי (${focus}): תעדוף זרימת סבב 1 וסנכרון בין מחסן למשאיות מנוף`,
    roleSpecificBriefing: {
      forWarehouse: randomWarehouseTip,
      forDriver: randomDriverTip,
      scheduledNotice: `תזכורת סבב: בדיקת שלמות משטחי סבן 60060 לפני יציאה`,
    },
    trafficAdvice: `כביש 1 זורם חלקית. כביש 431 מומלץ למשאיות כבדות מדרום.`,
    suggestedLevel: "info",
    source: "heuristic",
  };
}
