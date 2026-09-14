# Dispatch Studio Live

Plaintext

צור אפליקציית React + TypeScript ייעודית שלמה מ-0 עבור "ח. סבן - לוח סידור והפצה חי (Noa AI Live Dispatch & Studio)" המיועדת להקרנה בטלוויזיות דרך Monitors AnyWhere ולניהול שוטף במשרד.

שפת עיצוב וויזואליה (Enterprise Slate / Balanced High-End Theme):

פלטת צבעים מאוזנת (Enterprise Slate):

רקע כללי: גווני Slate/Zinc ניטרליים (slate-100 עד slate-200, ללא לבן בוהק מסנוור וללא רקע שחור מלא).

כרטיסים ואלמנטים: slate-50 עם מסגרות דקיקות (border slate-200/80), צלליות עדינות (shadow-sm עד shadow-md) וזכוכית מודרנית (backdrop-blur-md).

צבעי מיתוג ודגש: כחול תעשייתי עמוק (Sky/Blue 600) ואמבר/כתום בטיחותי (Amber 500) להדגשות מחסן ולוגיסטיקה.

טיפוגרפיה: תמיכה מלאה ב-RTL, גופנים נקיים (Inter / Rubik), היררכיה חדה וקריאה ממרחק של 5-10 מטרים ממסך הטלוויזיה.

מיקרו-אינטראקציות: אנימציות חלקות באמצעות Framer Motion לשינויי סטטוס, כניסת הזמנות והודעות מתפרצות.

ארכיטקטורת המערכת ומבנה תיקיות (Folder Structure):

src/ ├── types/ │ └── dispatch.ts # ממשקים להזמנה, פריט מוצר, נהג, מחסן, התראת נועה AI ├── context/ │ └── DispatchContext.tsx # ניהול State גלובלי, מצב סנכרון עם הגיליון, מצב Studio ├── components/ │ ├── tv/ # רכיבי תצוגת השידור לטלוויזיה (Live Broadcast) │ │ ├── TVHeader.tsx # שעון חי, מונה הזמנות, סטטוס סנכרון, מיתוג ח. סבן │ │ ├── NoaAIBanner.tsx # באנר התראות חכמות ופלאשים של נועה AI │ │ ├── OrderCard.tsx # כרטיס הזמנה רגיל (נהג, שעה, יעד, סבב) │ │ └── LoadingFocusModal.tsx # מודל פוקוס ענק להזמנה שבהעמסה (עבור חכמת / אורן) │ ├── studio/ # כלי עריכה וניהול (Studio Editor Panel) │ │ ├── StudioDrawer.tsx # פאנל שליטה נשלף (נפתח ב-Ctrl+Shift+E או כפתור מוסתר) │ │ ├── OrderEditor.tsx # עריכת הזמנות, עדכון כמויות, אישור מק"טים │ │ ├── BroadcastControl.tsx # שליטה על שידור ישיר לטלוויזיה (Publish State) │ │ └── QuickTemplates.tsx # תבניות התראה מהירות לנועה AI │ └── ui/ # כפתורים, תגיות, שדות קלט מודרניים ├── services/ │ └── sheetsService.ts # משיכה וסנכרון מטאב "דשבורד_הזמנות" (CSV / Google Sheets API) └── App.tsx

מפרט נתונים ושדות (Data Schema):

כל הזמנה מכילה:

orderId: מספר הזמנה (למשל 6215440)

customerName: שם הלקוח (למשל "ערוגת הבשם", "מאריו הנדסה")

address & city: כתובת פריקה ועיר

warehouse: מחסן מוצא (למשל: מחסן 4, מחסן 30)

driver: נהג מוקצה (למשל: חכמת - משאית מרצדס מנוף)

targetTime & round: שעת יעד וסבב (למשל: 11:00, סבב 2)

status: סטטוס ('ממתין' | 'בהעמסה' | 'יצא לדרך' | 'סופק')

logisticsMetrics: שקי בלה (60002), משטחי סבן (60060), משקל משוער בק"ג

items: מערך פריטים ומק"טים:

sku: מק"ט (לדוגמה: 11511, 11551, 10002, 14604, 18094)

name: תיאור המוצר (סומסום שק גדול, טיט שק גדול, מלט אפור 25 ק"ג וכו')

quantity: כמות

isApproved: בוליאני (האם המוצר אושר להעמסה ✅)

מודול התצוגה לטלוויזיה (Live TV Screen):

Fullscreen / Kiosk Mode ללא סקרולברים מיותרים (100vh / 100vw).

גריד רספונסיבי של כרטיסי הזמנות לפי סבבים ושעות.

פוקוס העמסה (Focus Mode): הזמנה שעוברת לסטטוס "בהעמסה" מקבלת אזור בולט במיוחד במסך עם תצוגת רשימת מק"טים מוגדלת:

אייקון מוצר, מק"ט, שם הפריט, כמות ותגית אישור ירוקה בולטת.

באנר עליון חכם של "נועה AI":

חישוב אוטומטי של זמני יעד (התראה כאשר נותרו 30 דקות לאספקה).

הודעות מתחלפות באנימציית Slide Fade כל 10 שניות (מצב נהגים, עומס במחסן, התראות קריטיות).

מודול הסטודיו וכלי העריכה (Hidden Control Studio):

נפתח בלחיצה על Escape, צירוף Ctrl + Shift + E, או לחיצה ממושכת על האייקון בפינה העליונה.

פאנל צידי / מגירה (Drawer) המאפשר:

עריכת טיוטה (Draft Mode): שינוי סטטוסים וסימון אישורי מק"טים לפני שליחה למסך.

כפתור "שדר לטלוויזיה" (Publish): מעדכן את מסך השידור החי בזמן אמת.

תבניות הודעה מתפרצת של נועה AI (Custom Flash Alert) שתקפוץ לטלוויזיה עם אייקון התראה.

הגדרת מקור נתונים: מתג בין סנכרון חי מגיליון "דשבורד_הזמנות" (Polling כל 30-60 שניות) לבין נתוני הדגמה מקומיים (Mock Data).

אנא ספק את כל קבצי הקוד בצורה מלאה, מודולרית ומוכנה להרצה ללא קיצורים (פונקציות מלאות, עיצוב Tailwind מדויק וייצוא מלא).

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/59263eee-9744-4d0e-a4d1-1cea6b97da6e).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
