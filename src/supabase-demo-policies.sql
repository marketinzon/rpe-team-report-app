-- Demo-only RLS policies for the current static app phase.
-- Replace the UUID below with RPE_TEAM_ID from your .env/Vercel env.
-- This allows the public client role (anon) to read/write ONLY that one team.
-- Do not use these policies for real multi-team production with real athlete data.

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
on public.teams
for all
to anon
using (id = public.demo_rpe_team_id())
with check (id = public.demo_rpe_team_id());

drop policy if exists "demo anon fixed team access" on public.players;
create policy "demo anon fixed team access"
on public.players
for all
to anon
using (team_id = public.demo_rpe_team_id())
with check (team_id = public.demo_rpe_team_id());

drop policy if exists "demo anon fixed team access" on public.settings;
create policy "demo anon fixed team access"
on public.settings
for all
to anon
using (team_id = public.demo_rpe_team_id())
with check (team_id = public.demo_rpe_team_id());

drop policy if exists "demo anon fixed team access" on public.pain_areas;
create policy "demo anon fixed team access"
on public.pain_areas
for all
to anon
using (team_id = public.demo_rpe_team_id())
with check (team_id = public.demo_rpe_team_id());

drop policy if exists "demo anon fixed team access" on public.sessions;
create policy "demo anon fixed team access"
on public.sessions
for all
to anon
using (team_id = public.demo_rpe_team_id())
with check (team_id = public.demo_rpe_team_id());

drop policy if exists "demo anon fixed team access" on public.readiness_reports;
create policy "demo anon fixed team access"
on public.readiness_reports
for all
to anon
using (team_id = public.demo_rpe_team_id())
with check (team_id = public.demo_rpe_team_id());

drop policy if exists "demo anon fixed team access" on public.rpe_reports;
create policy "demo anon fixed team access"
on public.rpe_reports
for all
to anon
using (team_id = public.demo_rpe_team_id())
with check (team_id = public.demo_rpe_team_id());

drop policy if exists "demo anon fixed team access" on public.gps_sessions;
create policy "demo anon fixed team access"
on public.gps_sessions
for all
to anon
using (team_id = public.demo_rpe_team_id())
with check (team_id = public.demo_rpe_team_id());

drop policy if exists "demo anon fixed team access" on public.gps_records;
create policy "demo anon fixed team access"
on public.gps_records
for all
to anon
using (team_id = public.demo_rpe_team_id())
with check (team_id = public.demo_rpe_team_id());

drop policy if exists "demo anon fixed team access" on public.injuries;
create policy "demo anon fixed team access"
on public.injuries
for all
to anon
using (team_id = public.demo_rpe_team_id())
with check (team_id = public.demo_rpe_team_id());

drop policy if exists "demo anon fixed team access" on public.coach_notes;
create policy "demo anon fixed team access"
on public.coach_notes
for all
to anon
using (team_id = public.demo_rpe_team_id())
with check (team_id = public.demo_rpe_team_id());
