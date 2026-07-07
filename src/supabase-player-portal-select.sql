-- Player portal read policies.
-- Safe to rerun after src/supabase-real-use-bootstrap.sql.
-- Allows a PIN-authenticated player client to read only its own reports/GPS data.

grant select on public.readiness_reports to anon;
grant select on public.rpe_reports to anon;
grant select on public.gps_records to anon;
grant select on public.gps_sessions to anon;

drop policy if exists "players can select own readiness reports" on public.readiness_reports;
create policy "players can select own readiness reports"
on public.readiness_reports
for select
to anon
using (public.can_player_submit_report(team_id, player_id));

drop policy if exists "players can select own rpe reports" on public.rpe_reports;
create policy "players can select own rpe reports"
on public.rpe_reports
for select
to anon
using (public.can_player_submit_report(team_id, player_id));

drop policy if exists "players can select own gps records" on public.gps_records;
create policy "players can select own gps records"
on public.gps_records
for select
to anon
using (public.can_player_submit_report(team_id, player_id));

drop policy if exists "players can select own gps sessions" on public.gps_sessions;
create policy "players can select own gps sessions"
on public.gps_sessions
for select
to anon
using (
  exists (
    select 1
    from public.gps_records gr
    where gr.team_id = gps_sessions.team_id
      and gr.gps_session_id = gps_sessions.id
      and public.can_player_submit_report(gr.team_id, gr.player_id)
  )
);
