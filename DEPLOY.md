# Deploying Imprint

Frontend → **Vercel**, backend API → **Render**, database → **Render PostgreSQL** (or Neon).
Local development keeps working exactly as before — every production change falls back to the current localhost defaults.

---

## 0. What was changed in the code for deployment

| File | Change | Why |
|---|---|---|
| `backend/src/app.ts` | CORS origin now comes from `CORS_ORIGIN` env var (comma-separated list), default `http://localhost:5173` | The deployed frontend lives on `*.vercel.app`, so the API must allow it |
| `backend/src/controllers/auth.controller.ts` | Cookies use `SameSite=None; Secure` when `NODE_ENV=production`, `SameSite=Strict` in dev | Vercel and Render are **different sites** — `Strict` cookies are silently dropped on cross-site requests |
| `backend/src/middleware/auth.middleware.ts` | Same `SameSite` fix for the token-refresh cookie | Same reason |
| `backend/src/controllers/note.controller.ts` | Safe handling of `req.params.id` typing | The backend now runs `tsc` in production builds (`tsx` never typechecked) |

---

## 1. Push the code to GitHub

```bash
git add -A
git commit -m "deploy: env-driven CORS, cross-site cookies, build fixes"
git push origin main
```

Render and Vercel both deploy by connecting to this repo: `github.com/pranesh25joshi/typescript-note-agent`.

---

## 2. Database — Neon (already set up ✅)

The app uses **Neon Postgres**, project `sweet-unit-59046191` (org `org-hidden-wave-82683697`, branch `production`), linked via the Neon CLI — connection strings live in the root `.env.local` (git-ignored) and were already applied to `backend/.env` locally, with migrations already deployed.

Two connection strings matter, both from `.env.local` / the Neon console:

| Env var | Which string | Why |
|---|---|---|
| `DATABASE_URL` | the **pooled** one (host contains `-pooler`) | App runtime queries go through Neon's connection pooler |
| `DIRECT_URL` | the **unpooled / direct** one | `prisma migrate deploy` needs a direct connection (poolers break migration locks) |

`backend/prisma/schema.prisma` already wires this: `url = env("DATABASE_URL")`, `directUrl = env("DIRECT_URL")`.

> Tip: rotate the Neon role password if it was ever exposed (Neon console → project → Roles → reset), then re-run `neon roles` / re-copy the strings.

---

## 3. Backend on Render

1. Render dashboard → **New → Web Service** → connect the GitHub repo.
2. Settings:
   - **Root Directory:** `backend`
   - **Runtime:** Node
   - **Build Command:** `npm install && npx prisma generate && npm run build`
   - **Start Command:** `npx prisma migrate deploy && node dist/index.js`
   - **Instance Type:** Free
3. **Environment variables** (Render → Environment):

   | Key | Value |
   |---|---|
   | `NODE_ENV` | `production` |
   | `DATABASE_URL` | Neon **pooled** connection string (from `.env.local` / Neon console) |
   | `DIRECT_URL` | Neon **unpooled** connection string |
   | `CORS_ORIGIN` | `https://<your-app>.vercel.app` (fill in after step 4, then redeploy) |
   | `ACCESS_TOKEN_SECRET` | any long random string |
   | `REFRESH_TOKEN_SECRET` | any other long random string |
   | `OPENAI_API_KEY` | your Gemini API key (same value as in `backend/.env`) |
   | `BASE_URL` | `https://generativelanguage.googleapis.com/v1beta/openai/` |
   | `AI_MODEL` | `gemini-2.5-flash` |
   | `SYSTEM_PROMPT` | copy the full value from `backend/.env` — including the `{{USER_NOTES}}` and `{{USER_PROMPT}}` placeholders |

   Generate random secrets with: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`

4. Deploy. When it finishes you get `https://<service>.onrender.com` — sanity check: opening it in a browser should return `{"message":"Test home route is working"}`.

> **Free-tier cold starts:** Render sleeps the service after ~15 min idle; the first request then takes ~30–60 s to boot. The Neon connection is region-independent, so hosting on Render in any region works.

---

## 4. Frontend on Vercel

1. [vercel.com](https://vercel.com) → **Add New → Project** → import the same GitHub repo.
2. Configure:
   - **Root Directory:** `frontend` (Vite is auto-detected)
   - **Build Command / Output:** leave defaults (`npm run build` → `dist`)
3. **Environment Variables:**

   | Key | Value |
   |---|---|
   | `VITE_API_URL` | `https://<service>.onrender.com/api/v1` ← your Render URL from step 3 + `/api/v1` |

4. Deploy → you get `https://<your-app>.vercel.app`.

---

## 5. Close the loop

1. Copy your final Vercel URL.
2. Render → backend service → **Environment** → set `CORS_ORIGIN` to that URL → **Save** (triggers a redeploy).
3. Test the deployed app: register a new user → create a note via the agent command bar → tick it complete → edit it with the pencil. If notes load and the agent runs, cookies + CORS are wired correctly.

---

## Troubleshooting

- **"Cannot login / notes fail to load"** → almost always `CORS_ORIGIN` mismatch. The value must be the *exact* Vercel origin (no trailing slash).
- **Login succeeds but session doesn't persist** → `NODE_ENV` isn't `production` on Render (cookies need `Secure` + `SameSite=None` over HTTPS).
- **Render build fails on `prisma generate`** → confirm the Build Command includes it; the generated client is not committed to git.
- **Agent returns 500** → `OPENAI_API_KEY`, `BASE_URL`, `AI_MODEL`, or `SYSTEM_PROMPT` missing on Render.
- **Migrations fail on Render with prepared-statement / lock errors** → `DIRECT_URL` isn't set (migrations must use Neon's direct, unpooled connection).

## Local development (unchanged)

```bash
# terminal 1
cd backend && npm run dev        # port 4000, localhost defaults still apply
# terminal 2
cd frontend && npm run dev       # port 5173
```

`frontend/.env` is git-ignored, so each machine sets `VITE_API_URL` itself — in dev you can just delete it and the code falls back to `http://localhost:4000/api/v1`.
