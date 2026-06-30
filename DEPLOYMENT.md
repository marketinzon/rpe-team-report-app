# Production Deployment Guide

This app is a static Hebrew RTL SPA. Production deployment is configured for Vercel with a generated runtime environment file at `/assets/env.js`.

## Vercel Deployment Steps

1. Push the `rpe-team-report-app` folder to a Git repository.
2. In Vercel, create a new project from the repository.
3. Set the project root to `outputs/rpe-team-report-app` if the repository includes the parent workspace.
4. Keep the framework preset as `Other`.
5. Vercel reads `vercel.json`:
   - Build command: `node scripts/build.mjs`
   - Output directory: `dist`
   - SPA rewrites for `/report`, `/coach`, `/coach/player/:playerId`, `/coach/gps`, `/coach/calendar`, `/coach/analytics`, `/coach/settings`, `/coach/admin`
6. Add environment variables in Vercel Project Settings.
7. Deploy.
8. After deploy, open:
   - `/report`
   - `/coach`
   - `/coach/players`
   - `/coach/reports`
   - `/coach/gps`
   - `/coach/calendar`
   - `/coach/analytics`
   - `/coach/settings`
   - `/coach/admin`
   - `/coach/player/p2`

## Required Environment Variables

For local demo fallback, no Supabase variables are required. For real multi-team use, configure Supabase Auth and the Supabase variables below.

| Variable | Required | Example | Notes |
| --- | --- | --- | --- |
| `RPE_APP_NAME` | No | `דוח RPE קבוצתי` | Display/config name. |
| `RPE_APP_ENV` | No | `production` | Defaults to Vercel environment or `production`. |
| `RPE_APP_VERSION` | No | `1.0.0` | Defaults to Vercel commit SHA when available. |
| `RPE_STORAGE_DRIVER` | No | `local` | Use `local` now. Use `supabase` only after connecting the adapter. |
| `RPE_SEED_DEMO_DATA` | No | `true` | Set `false` for a clean production database/local state. |
| `SUPABASE_URL` | Yes when Supabase is enabled | `https://project.supabase.co` | Public project URL. |
| `SUPABASE_PUBLISHABLE_KEY` | Yes when Supabase is enabled | `sb_publishable_...` | Public browser key. Legacy anon key can work, but publishable key is preferred. |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes for Owner/Admin API | `sb_secret_...` | Server-side only. Required for `/api/admin` to create/reset Supabase Auth coach users. Never exposed in `/assets/env.js`. |
| `SUPABASE_SCHEMA` | No | `public` | Defaults to `public`. |
| `RPE_TEAM_ID` | Yes for Supabase | `00000000-0000-4000-8000-000000000001` | Team to load/save for this deployment. |
| `RPE_TEAM_NAME` | Yes for Supabase | `קבוצת דמו` | Team name used when seeding. |
| `SUPABASE_TABLE_PREFIX` | No | empty | Leave empty for the migration schema table names. |

Do not expose `SUPABASE_SECRET_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, or any database password in the browser.

## Supabase Setup Guide

1. Create a Supabase project.
2. Copy the Project URL and publishable key from the Supabase Dashboard.
3. Open SQL Editor and run `src/supabase-schema.sql`.
4. For real multi-team use, create the first platform owner Auth user and run `src/supabase-owner-admin.sql`.
5. For the current no-auth demo phase only, run `src/supabase-demo-policies.sql` after replacing the demo UUID with `RPE_TEAM_ID`.
6. Confirm tables exist:
   - `teams`
   - `coaches`
   - `players`
   - `readiness_reports`
   - `rpe_reports`
   - `gps_sessions`
   - `gps_records`
   - `injuries`
   - `coach_notes`
   - `settings`
   - `pain_areas`
   - `platform_owners`
7. Keep RLS enabled.
8. Coach authentication uses Supabase Auth. Owner-only management actions use `/api/admin` with `SUPABASE_SERVICE_ROLE_KEY` on the server.
9. Player login stays team code + PIN through Supabase RPCs for now.
10. Store production PINs as hashes in `players.pin_hash`; avoid plain text PINs for real athletes.
11. Replace demo `anon` policies with authenticated coach/player policies before storing real athlete data.
12. Set Vercel env vars:
   - `RPE_STORAGE_DRIVER=supabase`
   - `SUPABASE_URL=...`
   - `SUPABASE_PUBLISHABLE_KEY=...`
   - `SUPABASE_SERVICE_ROLE_KEY=...`
13. The current browser adapter loads/saves the app data from these tables when `RPE_STORAGE_DRIVER=supabase`.

## Owner/Admin Setup

1. Create the first owner in Supabase Dashboard -> Authentication -> Users:
   - Email: `mark2fitness4max@gmail.com`
   - Password: `OwnerAdmin!2026`
   - Confirm email: yes
2. Run `src/supabase-owner-admin.sql` in Supabase SQL Editor.
3. Add `SUPABASE_SERVICE_ROLE_KEY` in Vercel environment variables. This is server-side only.
4. Log in at `/coach/login` as the owner.
5. Open `/coach/admin` or the sidebar item `ניהול מערכת`.
6. Manage teams, coaches, coach roles, players, positions, and player PINs from inside the platform.

## Production Build and Checks

Local commands:

```bash
npm run check
npm run build
npm run check:prod
```

When `npm` is unavailable, run the equivalent Node commands:

```bash
node --check assets/app.js
node --check server.mjs
node --check scripts/build.mjs
node --check scripts/verify-routes.mjs
node scripts/build.mjs
node scripts/verify-routes.mjs
```

## Production Checklist

- Vercel project root points at `outputs/rpe-team-report-app`.
- `vercel.json` is included in the deployed root.
- Build output `dist/` is generated by Vercel.
- `/assets/env.js` is served with `Cache-Control: no-store`.
- All SPA routes open directly from a fresh browser tab.
- `<html lang="he" dir="rtl">` is present in production HTML.
- Player login works on mobile.
- Coach navigation works on desktop.
- GPS import still previews, maps, and saves rows.
- Demo data setting is intentional: `RPE_SEED_DEMO_DATA=true` for demo, `false` for clean production.
- Supabase RLS is enabled before any real data is stored.
- No Supabase secret/service role key is exposed to frontend env.
- Player PIN strategy is reviewed before using with real athletes.
