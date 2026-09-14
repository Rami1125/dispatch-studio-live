import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";
import { handleGenerateInsight, type GenerateInsightRequest } from "./server/geminiService";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const url = new URL(request.url);

      // Handle AI API endpoints server-side
      if (url.pathname === "/api/ai/insights" && request.method === "POST") {
        try {
          const body = (await request.json()) as GenerateInsightRequest;
          const result = await handleGenerateInsight(body);
          return new Response(JSON.stringify(result), {
            status: 200,
            headers: { "content-type": "application/json; charset=utf-8" },
          });
        } catch (err) {
          console.error("Error in /api/ai/insights:", err);
          return new Response(
            JSON.stringify({
              error: err instanceof Error ? err.message : "Internal AI Error",
            }),
            {
              status: 500,
              headers: { "content-type": "application/json; charset=utf-8" },
            },
          );
        }
      }

      // Handle Google Sheets Status Write-Back
      if (url.pathname === "/api/sheets/update-status" && request.method === "POST") {
        try {
          const body = (await request.json()) as {
            action?: string;
            sheet?: string;
            orderId: string;
            status: string;
            webhookUrl?: string;
            sheetName?: string;
          };
          const { orderId, status } = body;
          const webhookUrl = body.webhookUrl || process.env.SHEETS_WEBHOOK_URL;
          const sheetName = body.sheet || body.sheetName || "דשבורד_הזמנות";
          const action = body.action || "updateOrderStatus";

          if (!orderId || !status) {
            return new Response(
              JSON.stringify({ success: false, error: "Missing orderId or status" }),
              { status: 400, headers: { "content-type": "application/json; charset=utf-8" } },
            );
          }

          if (webhookUrl) {
            const scriptRes = await fetch(webhookUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                action,
                sheet: sheetName,
                sheetName,
                orderId,
                status,
              }),
              redirect: "follow",
            });

            const responseText = await scriptRes.text();
            let scriptJson: {
              success?: boolean;
              message?: string;
              updatedAt?: string;
              row?: number;
              error?: string;
            } | null = null;

            try {
              scriptJson = JSON.parse(responseText);
            } catch {
              /* response was not json */
            }

            if (scriptJson && scriptJson.success) {
              return new Response(
                JSON.stringify({
                  success: true,
                  orderId,
                  status,
                  syncedToSheet: true,
                  message: scriptJson.message || `עודכן בהצלחה בעמודת סטטוס בגיליון ${sheetName}`,
                  updatedAt: scriptJson.updatedAt || new Date().toISOString(),
                  row: scriptJson.row,
                }),
                { status: 200, headers: { "content-type": "application/json; charset=utf-8" } },
              );
            }

            return new Response(
              JSON.stringify({
                success: false,
                orderId,
                status,
                syncedToSheet: false,
                error:
                  scriptJson?.error ||
                  scriptJson?.message ||
                  responseText.slice(0, 200) ||
                  "Webhook error",
              }),
              { status: 200, headers: { "content-type": "application/json; charset=utf-8" } },
            );
          }

          // No webhook configured yet
          return new Response(
            JSON.stringify({
              success: true,
              orderId,
              status,
              syncedToSheet: false,
              message:
                "הסטטוס עודכן בלוח ונשמר בזיכרון המערכת. לחץ על הגדרות שידור להפעלת Webhook לסנכרון ישיר ל-Google Sheets.",
              updatedAt: new Date().toISOString(),
            }),
            { status: 200, headers: { "content-type": "application/json; charset=utf-8" } },
          );
        } catch (err) {
          console.error("Error in /api/sheets/update-status:", err);
          return new Response(
            JSON.stringify({
              success: false,
              error: err instanceof Error ? err.message : "Internal Server Error",
            }),
            { status: 500, headers: { "content-type": "application/json; charset=utf-8" } },
          );
        }
      }

      // Handle Webhook test connection
      if (url.pathname === "/api/sheets/test-connection" && request.method === "POST") {
        try {
          const body = (await request.json()) as { webhookUrl?: string };
          const webhookUrl = body.webhookUrl || process.env.SHEETS_WEBHOOK_URL;
          if (!webhookUrl) {
            return new Response(
              JSON.stringify({ success: false, error: "לא סופקה כתובת Webhook" }),
              { status: 400, headers: { "content-type": "application/json; charset=utf-8" } },
            );
          }

          const testRes = await fetch(webhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ping: true }),
            redirect: "follow",
          });

          const text = await testRes.text();
          let json: { success?: boolean; message?: string; error?: string } | null = null;
          try {
            json = JSON.parse(text);
          } catch {
            /* not json */
          }

          if (json && json.success) {
            return new Response(
              JSON.stringify({
                success: true,
                message: json.message || "חיבור תקין ל-Google Apps Script!",
              }),
              { status: 200, headers: { "content-type": "application/json; charset=utf-8" } },
            );
          }

          return new Response(
            JSON.stringify({
              success: false,
              error:
                json?.error || text.slice(0, 200) || `תגובה לא צפויה מ-Webhook (${testRes.status})`,
            }),
            { status: 200, headers: { "content-type": "application/json; charset=utf-8" } },
          );
        } catch (err) {
          return new Response(
            JSON.stringify({
              success: false,
              error: err instanceof Error ? err.message : "שגיאת רשת בבדיקת חיבור",
            }),
            { status: 500, headers: { "content-type": "application/json; charset=utf-8" } },
          );
        }
      }

      // Handle Replenishment / Log History into Google Sheets
      if (url.pathname === "/api/sheets/log-history" && request.method === "POST") {
        try {
          const body = (await request.json()) as {
            action?: string;
            sheetName?: string;
            caller?: string;
            warehouse?: string;
            summary?: string;
            webhookUrl?: string;
          };

          const webhookUrl = body.webhookUrl || process.env.SHEETS_WEBHOOK_URL;
          const sheetName = body.sheetName || "היסטוריית_שיחות_נועה";
          const action = body.action || "REPLENISHMENT_DISPATCHED";

          if (webhookUrl) {
            await fetch(webhookUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                action,
                sheetName,
                caller: body.caller || "מחסנאי",
                warehouse: body.warehouse || "ח. סבן",
                summary: body.summary || "",
                timestamp: new Date().toISOString(),
              }),
              redirect: "follow",
            }).catch(() => null);
          }

          return new Response(
            JSON.stringify({
              success: true,
              logged: true,
              sheetName,
              action,
              timestamp: new Date().toISOString(),
            }),
            { status: 200, headers: { "content-type": "application/json; charset=utf-8" } },
          );
        } catch (err) {
          return new Response(
            JSON.stringify({
              success: false,
              error: err instanceof Error ? err.message : "Error logging replenishment",
            }),
            { status: 500, headers: { "content-type": "application/json; charset=utf-8" } },
          );
        }
      }

      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
