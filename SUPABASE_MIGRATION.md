# Supabase Migration Guide

This application now supports two storage modes:

- `RPE_STORAGE_DRIVER=supabase`: production data is loaded from and saved to Supabase tables.
- `RPE_STORAGE_DRIVER=local`: demo fallback using browser `localStorage`.

## 1. SQL Schema

Run [src/supabase-schema.sql](src/supabase-schema.sql) in the Supabase SQL Editor.

The schema creates:

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

Every team-owned table includes `team_id`. Report, GPS, injury, and note tables are indexed by team and player/date where relevant.

## 2. Supabase Setup Instructions

1. Create a Supabase project.
2. Open SQL Editor.
3. Run `src/supabase-schema.sql`.
4. Create a team row:

```sql
insert into public.teams (id, name, slug)
values ('00000000-0000-4000-8000-000000000001', 'קבוצת דמו', 'demo-team')
on conflict (id) do update set name = excluded.name;
```

5. Create coach users in Supabase Auth.
6. Connect each coach to a team:

```sql
insert into public.coaches (team_id, user_id, name, email, role)
values (
  '00000000-0000-4000-8000-000000000001',
  '<auth-user-id>',
  'שם המאמן',
  'coach@example.com',
  'owner'
);
```

7. Configure Vercel environment variables.
8. Deploy.

## Demo RLS Policies For Current Static Phase

The app currently uses `SUPABASE_PUBLISHABLE_KEY` directly from the browser. Without Supabase Auth, requests use the `anon` role, so RLS blocks reads/writes unless demo policies are added.

For the current demo phase, run [src/supabase-demo-policies.sql](src/supabase-demo-policies.sql) after the main schema. Replace the UUID in `demo_rpe_team_id()` with your `RPE_TEAM_ID`.

Exact SQL:

```sql
create or replace function public.demo_rpe_team_id()
returns uuid
language sql
stable
as $$
  select '00000000-0000-4000-8000-000000000001'::uuid
$$;

grant execute on function public.demo_rpe_team_id() to anon, authenticated;
grant usage on schema public to anon;
grant usage, select on all sequences in schema public to anon;

grant select, insert, update, delete on public.teams to anon;
grant select, insert, update, delete on public.players to anon;
grant select, insert, update, delete on public.settings to anon;
grant select, insert, update, delete on public.pain_areas to anon;
grant select, insert, update, delete on public.sessions to anon;
grant select, insert, update, delete on public.readiness_reports to anon;
grant select, insert, update, delete on public.rpe_reports to anon;
grant select, insert, update, delete on public.gps_sessions to anon;
grant select, insert, update, delete on public.gps_records to anon;
grant select, insert, update, delete on public.injuries to anon;
grant select, insert, update, delete on public.coach_notes to anon;

drop policy if exists "demo anon fixed team access" on public.teams;
create policy "demo anon fixed team access"
on public.teams for all to anon
using (id = public.demo_rpe_team_id())
with check (id = public.demo_rpe_team_id());

drop policy if exists "demo anon fixed team access" on public.players;
create policy "demo anon fixed team access"
on public.players for all to anon
using (team_id = public.demo_rpe_team_id())
with check (team_id = public.demo_rpe_team_id());

drop policy if exists "demo anon fixed team access" on public.settings;
create policy "demo anon fixed team access"
on public.settings for all to anon
using (team_id = public.demo_rpe_team_id())
with check (team_id = public.demo_rpe_team_id());

drop policy if exists "demo anon fixed team access" on public.pain_areas;
create policy "demo anon fixed team access"
on public.pain_areas for all to anon
using (team_id = public.demo_rpe_team_id())
with check (team_id = public.demo_rpe_team_id());

drop policy if exists "demo anon fixed team access" on public.sessions;
create policy "demo anon fixed team access"
on public.sessions for all to anon
using (team_id = public.demo_rpe_team_id())
with check (team_id = public.demo_rpe_team_id());

drop policy if exists "demo anon fixed team access" on public.readiness_reports;
create policy "demo anon fixed team access"
on public.readiness_reports for all to anon
using (team_id = public.demo_rpe_team_id())
with check (team_id = public.demo_rpe_team_id());

drop policy if exists "demo anon fixed team access" on public.rpe_reports;
create policy "demo anon fixed team access"
on public.rpe_reports for all to anon
using (team_id = public.demo_rpe_team_id())
with check (team_id = public.demo_rpe_team_id());

drop policy if exists "demo anon fixed team access" on public.gps_sessions;
create policy "demo anon fixed team access"
on public.gps_sessions for all to anon
using (team_id = public.demo_rpe_team_id())
with check (team_id = public.demo_rpe_team_id());

drop policy if exists "demo anon fixed team access" on public.gps_records;
create policy "demo anon fixed team access"
on public.gps_records for all to anon
using (team_id = public.demo_rpe_team_id())
with check (team_id = public.demo_rpe_team_id());

drop policy if exists "demo anon fixed team access" on public.injuries;
create policy "demo anon fixed team access"
on public.injuries for all to anon
using (team_id = public.demo_rpe_team_id())
with check (team_id = public.demo_rpe_team_id());

drop policy if exists "demo anon fixed team access" on public.coach_notes;
create policy "demo anon fixed team access"
on public.coach_notes for all to anon
using (team_id = public.demo_rpe_team_id())
with check (team_id = public.demo_rpe_team_id());
```

This is safe only for demo data. Anyone with the public project URL and publishable key can access rows for that one team. For real production, remove these `anon` policies and use Supabase Auth or server-side API routes.

## 3. Environment Variables Needed

```bash
RPE_STORAGE_DRIVER=supabase
RPE_SEED_DEMO_DATA=true
RPE_TEAM_ID=00000000-0000-4000-8000-000000000001
RPE_TEAM_NAME="קבוצת דמו"
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxx
SUPABASE_SCHEMA=public
SUPABASE_TABLE_PREFIX=
```

Use `SUPABASE_PUBLISHABLE_KEY` in the browser. Do not expose service-role, secret, database password, or JWT signing secret values.

## 4. Migration Guide

### From Demo LocalStorage To Supabase

1. Open the current local app.
2. Confirm the demo data is in the shape you want.
3. Set Supabase env vars locally or in Vercel.
4. Set `RPE_STORAGE_DRIVER=supabase`.
5. Run:

```bash
npm run build
npm run check:prod
```

6. On first Supabase load, if the configured `RPE_TEAM_ID` does not exist, the app seeds the current demo structure into Supabase.
   If the team exists but has no players and `RPE_SEED_DEMO_DATA=true`, it also seeds demo players, reports, sessions, GPS records, settings, and pain areas.
7. After seeding, verify tables in Supabase:
   - `players`
   - `sessions`
   - `readiness_reports`
   - `rpe_reports`
   - `gps_sessions`
   - `gps_records`

### Multi-Team Production Model

- Use one row per club/team in `teams`.
- Add coaches to `coaches` with `team_id` and Supabase Auth `user_id`.
- RLS policies use `auth.uid()` through the `coaches` table so coaches can only access teams they belong to.
- Use a unique `RPE_TEAM_ID` per deployment, or add a future team switcher for coaches who belong to multiple teams.

### Player Login

The current app keeps the existing player name + 4 digit PIN flow.

For a stronger production flow:

1. Store only `pin_hash` in `players`.
2. Replace direct PIN checks with a Supabase Edge Function or RPC that validates the PIN server-side.
3. Do not expose production PINs in frontend-readable rows.

### Notes About RLS

The SQL schema enables RLS and policies for authenticated coaches. For a fully locked-down multi-team deployment, add coach Supabase Auth login before allowing real production data.

The current static browser adapter can write to Supabase when the project policies allow the configured client role to access the configured team. If a write fails, the app shows a visible warning and logs the failed Supabase request in the browser console.

Runtime storage status is visible in the app:

- `Supabase connected`: reads/writes are configured and the latest save succeeded.
- `Supabase error`: Supabase read/write failed; open the browser console for method, path, status, and response body.
- `Local fallback`: `RPE_STORAGE_DRIVER=local`; data is stored only in browser `localStorage`.
