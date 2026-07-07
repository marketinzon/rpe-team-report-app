# Supabase Migration Guide

This application now supports two storage modes:

- `RPE_STORAGE_DRIVER=supabase`: production data is loaded from and saved to Supabase tables.
- `RPE_STORAGE_DRIVER=local`: demo fallback using browser `localStorage`.

## Final Setup - Use This Order

This is the clean final setup for the current multi-team platform.

Run only these SQL files, in this exact order:

1. `src/supabase-schema.sql`
2. Create/confirm the Supabase Auth users listed below, or run `npm run seed:auth-users` if local `.env` contains `SUPABASE_SERVICE_ROLE_KEY`.
3. `src/supabase-real-use-bootstrap.sql`
4. `src/supabase-owner-admin.sql`
5. `src/supabase-player-portal-select.sql` if your project was already migrated before this file existed. New runs of `src/supabase-real-use-bootstrap.sql` already include these player read policies.

Do not run `src/supabase-multiteam-auth.sql` for the prepared Team 1 / Team 2 setup. It is kept as an optional/reference migration only. `src/supabase-real-use-bootstrap.sql` already includes the multi-team RPCs, player login RPCs, player report policies, demo-policy cleanup, and initial two-team data.

Role migration note:

- `src/supabase-schema.sql` originally allows coach roles: `owner`, `coach`, `viewer`.
- `src/supabase-real-use-bootstrap.sql` temporarily allows both `owner` and `team_admin` so it can recover from partially-run migrations, then links Team 1 / Team 2 coaches with the legacy `owner` role.
- `src/supabase-owner-admin.sql` then safely drops/recreates `coaches_role_check`, converts legacy `owner` rows to `team_admin`, and enables final roles: `team_admin`, `coach`, `viewer`.
- If you already hit `violates check constraint "coaches_role_check"` for `team_admin`, rerun the corrected `src/supabase-real-use-bootstrap.sql` first, then run `src/supabase-owner-admin.sql`.

Player login team picker:

- `/report` loads active teams directly from `public.teams` with:
  `active=eq.true&select=id,name,slug,active&order=name.asc`
- Run `src/supabase-public-team-listing.sql` or rerun `src/supabase-real-use-bootstrap.sql` so RLS allows anonymous users to read active team names/slugs.
- This public policy exposes only active team rows. It does not expose players, reports, GPS, PINs, or coach data.
- The player still logs in through `player_login(team, player, PIN)`; the team slug/id is selected behind the scenes.

Required Supabase Auth users:

| Email | Password | Role / Team |
|---|---|---|
| `mark2fitness4max@gmail.com` | `OwnerAdmin!2026` | Platform Owner |
| `coach.team1@example.com` | `CoachTeam1!2026` | Team Admin, קבוצת צפון |
| `coach.team2@example.com` | `CoachTeam2!2026` | Team Admin, קבוצת דרום |

Important:

- Mark every Auth user as confirmed / email confirmed.
- If login returns `invalid_credentials`, the user is missing, not confirmed, or the password is different.
- `SUPABASE_SERVICE_ROLE_KEY` is server-side only. Never expose it in `assets/env.js` or frontend code.
- Local and Vercel must use the same `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY`.

After running the SQL files, verify the live Supabase setup:

```bash
npm run verify:supabase
```

Expected output:

```text
SUPABASE_FINAL_SETUP_OK
```

## 0. Exact Two-Team Setup For Real Use

Use this section when starting from a clean Supabase project. Do not assume any tables, functions, teams, players, or coach users already exist.

### Step 1: Run Base Schema

Open Supabase SQL Editor and run:

```text
src/supabase-schema.sql
```

This creates the required tables and coach RLS model.

### Step 2: Create Supabase Auth Coach Users

Coach users must be created in Supabase Auth. The static frontend must never contain a service-role key, so the SQL migration links Auth users but does not create passwords inside public app code.

Create these users in Supabase Dashboard -> Authentication -> Users -> Add user:

| Coach email | Password | Team |
|---|---|---|
| `coach.team1@example.com` | `CoachTeam1!2026` | `קבוצת צפון` |
| `coach.team2@example.com` | `CoachTeam2!2026` | `קבוצת דרום` |

Important:

- Mark the users as confirmed / email confirmed.
- If email confirmation is required and the user is not confirmed, password login can still fail with `invalid login credentials`.
- Do not put these passwords in frontend environment variables.

### Step 3: Run Real-Use Bootstrap

After the two Auth users exist, run:

```text
src/supabase-real-use-bootstrap.sql
```

This file is safe to rerun. It creates or updates:

- `player_team_roster(p_team_code text)`
- `player_team_list()`
- `player_login(p_team_code text, p_player_id text, p_pin_code text)`
- anonymous player report insert/update RLS for the selected player and team
- Team 1: `קבוצת צפון`, code `team-1`
- Team 2: `קבוצת דרום`, code `team-2`
- initial player rosters and PINs
- settings and pain areas for both teams
- coach links in `public.coaches`, if the Auth users already exist. At this stage it uses the schema-compatible legacy role `owner`; the next Owner/Admin migration converts it to `team_admin`.

If you ran the bootstrap before creating Auth users, create the Auth users and run the bootstrap again.

Optional command-line shortcut:

If `.env` contains `SUPABASE_URL` and server-only `SUPABASE_SERVICE_ROLE_KEY`, you can create/update the demo Auth users with:

```bash
npm run seed:auth-users
```

Then run `src/supabase-real-use-bootstrap.sql` again so the Auth users are linked to Team 1 / Team 2.

### Step 4: Enable Owner/Admin Management

Create the first platform owner in Supabase Auth:

| Owner email | Password | Role |
|---|---|---|
| `mark2fitness4max@gmail.com` | `OwnerAdmin!2026` | Platform Owner |

Then run:

```text
src/supabase-owner-admin.sql
```

Optional command-line shortcut:

If `.env` contains `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`, `npm run seed:auth-users` also creates/updates `mark2fitness4max@gmail.com` with password `OwnerAdmin!2026`.

The first owner is a one-time bootstrap. After this, open `/coach/login`, log in as `mark2fitness4max@gmail.com`, and use `/coach/admin` / `ניהול מערכת` to create teams, create coaches, assign roles, reset coach passwords, and manage players/PINs from inside the platform.

Owner/Admin server actions require this server-side environment variable:

```bash
SUPABASE_SERVICE_ROLE_KEY=...
```

This key must be configured only in Vercel/server environment variables. It is never written to `/assets/env.js` and must never be exposed in frontend code.

### Verification SQL

Run these queries after the bootstrap:

```sql
select slug, name, active
from public.teams
where slug in ('team-1', 'team-2')
order by slug;

select c.email, c.name as coach_name, t.name as team_name, t.slug as team_code
from public.coaches c
join public.teams t on t.id = c.team_id
where c.email in ('coach.team1@example.com', 'coach.team2@example.com')
order by c.email;

select public.player_team_roster('team-1');
select public.player_team_roster('team-2');
```

Expected result:

- Two teams exist.
- Two coach rows exist, each linked to one team.
- The roster RPC returns players for each team and no `Could not find the function` error appears.

### Demo Coach Logins

Coach login URL:

```text
/coach/login
```

Credentials:

| Team | Team code | Coach email | Password |
|---|---|---|---|
| `קבוצת צפון` | `team-1` | `coach.team1@example.com` | `CoachTeam1!2026` |
| `קבוצת דרום` | `team-2` | `coach.team2@example.com` | `CoachTeam2!2026` |

Authentication type: Supabase Auth for coaches.

### Player Login Per Team

Player login URL:

```text
/report
```

Players enter the team code, load the roster, choose their name, and enter their 4-digit PIN.

Team 1, `קבוצת צפון`, code `team-1`:

| Player | PIN |
|---|---|
| נועם לוי | `1001` |
| איתי פרץ | `1002` |
| עומר כהן | `1003` |
| דניאל ביטון | `1004` |
| רועי אברהם | `1005` |
| יונתן מזרחי | `1006` |
| יואב דהן | `1007` |
| אביב אזולאי | `1008` |
| שחר בן דוד | `1009` |
| תומר מלכה | `1010` |
| אלון גבאי | `1011` |

Team 2, `קבוצת דרום`, code `team-2`:

| Player | PIN |
|---|---|
| גיא שלום | `2001` |
| ברק סויסה | `2002` |
| רז חדד | `2003` |
| יהלי אוחנה | `2004` |
| ליאם אדרי | `2005` |
| איתמר בוסקילה | `2006` |
| עידו דיין | `2007` |
| ניב אלקיים | `2008` |
| מאור יצחק | `2009` |
| אריאל חזן | `2010` |
| דור רפאלי | `2011` |

Authentication type: player team-code + PIN through Supabase RPC, not Supabase Auth.

### How To Test Team Isolation

1. Go to `/coach/login`.
2. Log in as `coach.team1@example.com` / `CoachTeam1!2026`.
3. Confirm the sidebar/header shows `קבוצת צפון`.
4. Open players, reports, GPS, calendar, and settings. Only Team 1 data should appear.
5. Log out.
6. Log in as `coach.team2@example.com` / `CoachTeam2!2026`.
7. Confirm the sidebar/header shows `קבוצת דרום`.
8. Confirm Team 1 players are not visible.
9. Go to `/report`, enter `team-1`, and verify only Team 1 players appear.
10. Go to `/report`, enter `team-2`, and verify only Team 2 players appear.

### Creating Additional Coaches

Preferred flow after Owner/Admin is enabled:

1. Log in at `/coach/login` as `mark2fitness4max@gmail.com`.
2. Open `/coach/admin`.
3. Go to `מאמנים`.
4. Enter coach name, email, temporary password.
5. Select one or more teams and assign a role:
   - `Team Admin`
   - `Coach`
   - `Viewer`
6. Submit. The secure `/api/admin` endpoint creates the Supabase Auth user and writes the `public.coaches` team assignments.

Manual fallback if the API is not configured:

```sql
insert into public.coaches (team_id, user_id, name, email, role, active)
select t.id, u.id, 'שם המאמן', 'new.coach@example.com', 'coach', true
from public.teams t
join auth.users u on lower(u.email) = 'new.coach@example.com'
where t.slug = 'team-1'
on conflict (team_id, user_id) do update
set name = excluded.name,
    email = excluded.email,
    role = excluded.role,
    active = true,
    updated_at = now();
```

Change `team-1` to `team-2` to assign the coach to Team 2.

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
  'team_admin'
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

### One-month demo reseed

The coach settings page includes `טעינה / רענון חודש דמו`. In Supabase mode this is a safe, team-scoped reseed:

- Demo rows are identified by the `demo-month-` ID prefix.
- Current `demo-month-` rows are removed before reseeding. Legacy built-in demo IDs are removed only when the entire loaded state matches the old pure demo dataset.
- Existing non-demo players, reports, sessions, and GPS records remain loaded and are upserted unchanged.
- The operation remains restricted to `RPE_TEAM_ID` by the existing demo RLS policies.
- No schema migration is required. Detailed post-training pain fields are stored as backward-compatible metadata inside `rpe_reports.comments`.

See [DEMO_DATA.md](DEMO_DATA.md) for the exact loading and verification flow.

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

## 5. Custom Multi-Team Production Setup

For the current two-team rollout, use the final exact setup at the top of this document. Do not run this custom section for Team 1 / Team 2.

Use the manual steps below only when creating custom teams/coaches instead of the prepared Team 1 / Team 2 bootstrap.

Run this order in Supabase SQL Editor:

1. `src/supabase-schema.sql`
2. `src/supabase-multiteam-auth.sql` only if you are not using `src/supabase-real-use-bootstrap.sql`
3. Remove old demo anon policies if you previously ran `src/supabase-demo-policies.sql`.

### Create Team 1 And Team 2

Use real UUIDs generated by Supabase or `gen_random_uuid()`. Example:

```sql
insert into public.teams (id, name, slug, active)
values
  ('11111111-1111-4111-8111-111111111111', 'Team 1', 'team-1', true),
  ('22222222-2222-4222-8222-222222222222', 'Team 2', 'team-2', true)
on conflict (id) do update
set name = excluded.name,
    slug = excluded.slug,
    active = excluded.active;
```

### Create Coach Logins

1. Open Supabase Dashboard.
2. Go to Authentication → Users.
3. Create one user for each coach with email + password.
4. Copy each user's `id`.
5. Link each Auth user to one team:

```sql
insert into public.coaches (team_id, user_id, name, email, role, active)
values
  ('11111111-1111-4111-8111-111111111111', '<team-1-auth-user-id>', 'Coach Team 1', 'coach1@example.com', 'team_admin', true),
  ('22222222-2222-4222-8222-222222222222', '<team-2-auth-user-id>', 'Coach Team 2', 'coach2@example.com', 'team_admin', true)
on conflict (team_id, user_id) do update
set name = excluded.name,
    email = excluded.email,
    role = excluded.role,
    active = excluded.active;
```

After login, `/coach` loads only the team linked to the authenticated coach row. Coach A cannot read Team B rows because all coach RLS policies use `auth.uid()` through `public.coaches`.

### Add Players Per Team

```sql
insert into public.players (team_id, id, name, active, position, pin_code)
values
  ('11111111-1111-4111-8111-111111111111', 't1-p1', 'עומר כהן', true, 'Midfielder', '1234'),
  ('11111111-1111-4111-8111-111111111111', 't1-p2', 'אביב לוי', true, 'Winger', '2345'),
  ('22222222-2222-4222-8222-222222222222', 't2-p1', 'יואב מזרחי', true, 'Defender', '3456'),
  ('22222222-2222-4222-8222-222222222222', 't2-p2', 'גיא אברהם', true, 'Striker', '4567')
on conflict (team_id, id) do update
set name = excluded.name,
    active = excluded.active,
    position = excluded.position,
    pin_code = excluded.pin_code;
```

You can also add and edit players from `/coach/settings` after the coach logs in.

### Player Login Per Team

Players open `/report` and enter the team code:

- Team 1: `team-1`
- Team 2: `team-2`

The app calls `player_team_roster(team_code)` and shows only active players from that team. PIN verification is done by `player_login(team_code, player_id, pin_code)` in Supabase. New readiness and RPE reports are saved with the selected `team_id` and RLS only allows the logged player to write reports for himself.

### Demo Data Separation

- The built-in demo team remains `00000000-0000-4000-8000-000000000001`.
- Automatic demo seeding now runs only for that demo team.
- Do not run `src/supabase-demo-policies.sql` in the same project after you start entering real Team 1 / Team 2 data.
- If demo policies were used earlier, drop the `"demo anon fixed team access"` policies listed at the bottom of `src/supabase-multiteam-auth.sql`.

### Environment Variables

```bash
RPE_STORAGE_DRIVER=supabase
RPE_SEED_DEMO_DATA=false
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxx
SUPABASE_SCHEMA=public
SUPABASE_TABLE_PREFIX=
```

`RPE_TEAM_ID` is now only a fallback/demo default. In real multi-team mode, the active team comes from the authenticated coach's `coaches.team_id`.

The current static browser adapter can write to Supabase when the project policies allow the configured client role to access the configured team. If a write fails, the app shows a visible warning and logs the failed Supabase request in the browser console.

Runtime storage status is visible in the app:

- `Supabase connected`: reads/writes are configured and the latest save succeeded.
- `Supabase error`: Supabase read/write failed; open the browser console for method, path, status, and response body.
- `Local fallback`: `RPE_STORAGE_DRIVER=local`; data is stored only in browser `localStorage`.

Production data source rule:

- When `RPE_STORAGE_DRIVER=supabase`, professional data is never loaded from browser `localStorage` as a fallback.
- Player team lists are queried from `public.teams` on load.
- Player sessions may remain in `localStorage` only as authentication state; roster, reports and GPS are reloaded from Supabase.
- Critical HTML/JS/env assets are served with `Cache-Control: no-store`, and the app unregisters legacy service workers and clears Cache Storage on startup.
