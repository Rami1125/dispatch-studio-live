<!-- LOVABLE:BEGIN -->

> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

<!-- LOVABLE:END -->

## Base44 Dev Environment

- **Stack**: TanStack Start (SSR) + Vite 8 + React 19 + TypeScript + Tailwind v4. Lovable-generated (`@lovable.dev/vite-tanstack-config` provides all Vite plugins — do NOT add them manually).
- **Run**: `docker compose -f docker-compose.base44.yml up -d` — uses `node:22` base image with source bind-mounted at `/app`, deps in a named volume, and `npm run dev` (vite dev with SSR via nitro).
- **Port**: 3000 (mapped in compose). Health check: `GET /`.
- **Env vars** (both optional at boot, delivered via `/run/base44/app.env`):
  - `GEMINI_API_KEY` — Google Gemini API key for "Noa AI" server-side insights (`src/server/geminiService.ts`). Falls back to local heuristics if absent.
  - `SHEETS_WEBHOOK_URL` — Google Apps Script URL for write-back to Google Sheets (`src/server.ts`). Status updates stay in-memory if absent.
- **Firebase**: Config is hardcoded in `firebase-applet-config.json` (no env var needed). Used for Google OAuth (Drive media access) — client-side only.
- **Known fix**: `src/constants/geo.ts` line 35 had a missing `lon:` key that caused a parse error — fixed by adding the key.
- **Vite host allowlist**: `__VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS` is passed via compose environment (Vite >= 6.1 appends it to allowedHosts).
