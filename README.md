# מוטיבציה · Motivation App

A modern, AI-powered, **Hebrew + RTL** motivation web app. Built as a multi-tenant SaaS-ready Next.js application that can later be packaged as a Capacitor APK / IPA for Android & iOS.

> Code is in English. UI is fully Hebrew with full RTL support.

---

## Stack

- **Frontend:** Next.js 14 (App Router) · TypeScript · TailwindCSS · shadcn/ui · Framer Motion · Lucide icons
- **Auth:** Clerk (email + Google + Organizations) with Hebrew localization
- **DB:** PostgreSQL (Neon, Supabase, RDS, Railway, …) via Prisma ORM
- **AI:** Anthropic (Claude) or OpenAI – switch via `AI_PROVIDER`
- **Rate limiting:** Upstash Redis (with in-memory fallback for dev)
- **Hosting:** Vercel (frontend + API) + cloud Postgres
- **Mobile:** Capacitor-ready (`BUILD_TARGET=capacitor`)

---

## Features

- Hero screen with `צור מוטיבציה` button → 10 unique Hebrew items per generation
- Topic + mood inputs feed the AI prompt
- Save / favorite / copy / share each card
- Dedicated `שמורים` tab with search, category filter, sort, edit and delete
- Multi-tenant: every row is scoped by `tenantId` (Clerk org or personal workspace)
- Dark mode, mobile-first layout, sticky bottom tab bar on mobile
- Production niceties: rate limiting, error boundaries, toasts, skeletons, optimistic UI
- PWA manifest + Capacitor config so the same codebase ships to web and APK

---

## Quick start

```bash
# 1. Install
npm install

# 2. Configure env
cp .env.example .env
#   fill in DATABASE_URL, Clerk keys, AI_PROVIDER + key

# 3. Push the schema to your Postgres
npx prisma db push
# or, in dev with migrations:
# npx prisma migrate dev --name init

# 4. Run
npm run dev
```

Open http://localhost:3000.

---

## Environment variables

See `.env.example` for the full list. The most important:

| Var | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | yes | Postgres connection string |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` / `CLERK_SECRET_KEY` | yes | Clerk auth |
| `AI_PROVIDER` | yes | `anthropic` or `openai` |
| `ANTHROPIC_API_KEY` / `ANTHROPIC_MODEL` | if anthropic | Claude API |
| `OPENAI_API_KEY` / `OPENAI_MODEL` | if openai | OpenAI API |
| `UPSTASH_REDIS_REST_URL` / `_TOKEN` | recommended | Production rate limiting |
| `BUILD_TARGET` | optional | Set to `capacitor` for static export |

---

## Project layout

```
src/
├── app/
│   ├── (auth)/                  # Clerk sign-in / sign-up
│   ├── (dashboard)/             # Protected pages (dashboard, saved)
│   ├── api/
│   │   ├── generate/route.ts    # POST: AI generation (10 items)
│   │   ├── saved/route.ts       # GET list, POST save
│   │   └── saved/[id]/route.ts  # PATCH update, DELETE remove
│   ├── layout.tsx               # html dir="rtl" lang="he", Hebrew fonts
│   ├── page.tsx                 # Landing page
│   └── globals.css              # Theme tokens (light + dark)
├── components/
│   ├── ui/                      # shadcn primitives (RTL-safe with ms/me classes)
│   ├── views/
│   │   ├── generate-view.tsx    # Home / generate screen
│   │   └── saved-view.tsx       # Saved items screen
│   ├── motivation-card.tsx
│   ├── app-nav.tsx              # Top header + mobile bottom tab bar
│   ├── theme-provider.tsx
│   └── theme-toggle.tsx
├── hooks/
│   └── use-toast.ts
├── lib/
│   ├── ai.ts                    # Provider-agnostic AI wrapper + zod schema
│   ├── api.ts                   # Response/error helpers
│   ├── constants.ts             # Hebrew copy, categories, moods
│   ├── prisma.ts                # Singleton Prisma client
│   ├── rate-limit.ts            # Upstash + in-memory limiter
│   ├── tenant.ts                # Tenant resolution + user provisioning
│   └── utils.ts
├── middleware.ts                # Clerk middleware + protected matcher
└── ...
prisma/schema.prisma             # Multi-tenant data model
public/manifest.webmanifest      # PWA manifest (he, dir=rtl)
capacitor.config.ts              # APK / IPA build config
```

---

## Multi-tenant architecture

Every data row carries a `tenantId`. The mapping is:

- If the Clerk session has an `orgId`, it **is** the tenant.
- Otherwise, every user gets a synthetic personal tenant (`personal_<userId>`).

`src/lib/tenant.ts → requireTenantContext()` is called at the top of every protected route. It:

1. Reads `auth()` from Clerk.
2. Upserts the matching `Tenant` row.
3. Upserts a per-tenant `User` row.
4. Returns `{ tenant, user, clerkUserId }` — never trust `userId` from the client.

All Prisma queries in the API filter by `tenantId` AND `userId`, so even a malicious user can never read another tenant's data.

---

## Deploying to Vercel

1. Push to GitHub.
2. Import the repo into Vercel.
3. Add the env vars from `.env.example` to the project.
4. Set the Postgres URL (Neon / Supabase / Vercel Postgres).
5. Deploy.

The `build` script runs `prisma generate && next build`. Run `prisma migrate deploy` from a one-off Vercel job (or as a `predeploy` step in your CI) for production migrations.

---

## Building an Android APK with Capacitor

```bash
# 1. Build a static bundle
BUILD_TARGET=capacitor npm run build

# 2. Add the Android platform (first time only)
npx cap add android

# 3. Sync the static `out/` into the native project
npx cap sync

# 4. Open Android Studio and build the APK
npx cap open android
```

If you'd rather keep using server-rendered routes (recommended for the AI calls), set `server.url` in `capacitor.config.ts` to your Vercel URL — the APK becomes a thin native shell over the live web app, while still supporting native splash, push notifications, etc.

> **Heads up:** the AI generation and DB code live in API routes. With `BUILD_TARGET=capacitor` (static export) those routes are removed, so always pair static export with `server.url` pointing at the deployed web app.

---

## Roadmap (bonus features stubbed in the schema)

- [ ] Daily motivation push notification (Capacitor Local Notifications)
- [ ] Streak system (count consecutive days with a generation)
- [ ] Mood-based generation (already wired via `mood` field)
- [ ] AI voice reading (Web Speech API)
- [ ] Export saved quotes (CSV/PDF)
- [ ] Widget-style daily quote card

---

## Scripts

| Script | What |
|---|---|
| `dev` | `next dev` |
| `build` | `prisma generate && next build` |
| `start` | `next start` |
| `lint` | `next lint` |
| `typecheck` | `tsc --noEmit` |
| `db:push` | Push schema to DB (dev) |
| `db:migrate` | Run a dev migration |
| `db:deploy` | Run prod migrations |
| `db:studio` | Open Prisma Studio |
| `cap:sync` | Sync static `out/` to native projects |

---

## License

MIT.
