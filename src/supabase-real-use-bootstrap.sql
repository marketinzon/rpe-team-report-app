-- Real-use bootstrap for two teams.
-- Run after src/supabase-schema.sql.
--
-- This creates:
-- - Multi-team RPC functions used by the frontend
-- - Player report RLS policies for anonymous player submissions
-- - Team 1 and Team 2 demo/initial rosters
-- - Settings and pain areas per team
-- - Coach-to-team links, but only after the Supabase Auth users exist
--
-- Important:
-- This file does NOT create Supabase Auth users. Create them first in:
-- Supabase Dashboard -> Authentication -> Users -> Add user
--
-- Coach users to create:
-- 1. coach.team1@example.com / CoachTeam1!2026
-- 2. coach.team2@example.com / CoachTeam2!2026
--
-- After the users exist, run this file. You may safely rerun it.

create extension if not exists pgcrypto;

-- Compatibility step:
-- Base schema allows owner/coach/viewer.
-- Final Owner/Admin migration allows team_admin/coach/viewer.
-- During bootstrap we allow both so this file can recover from partially-run
-- migrations, but the coach rows inserted below still use the schema-compatible
-- legacy role 'owner'. Run src/supabase-owner-admin.sql after this file to
-- convert legacy owner rows to final team_admin rows.
alter table public.coaches
  drop constraint if exists coaches_role_check;

alter table public.coaches
  add constraint coaches_role_check
  check (role in ('owner', 'team_admin', 'coach', 'viewer'));

alter table public.gps_sessions
  drop constraint if exists gps_sessions_type_check;

alter table public.gps_sessions
  add constraint gps_sessions_type_check
  check (type in ('match', 'training', 'training_match'));

create or replace function public.current_coach_team_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select team_id
  from public.coaches
  where user_id = (select auth.uid())
    and active = true
$$;

create or replace function public.can_access_team(target_team_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.coaches
    where user_id = (select auth.uid())
      and active = true
      and team_id = target_team_id
  )
$$;

grant execute on function public.current_coach_team_ids() to authenticated;
grant execute on function public.can_access_team(uuid) to authenticated;

create or replace function public.player_team_list()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', id,
    'name', name,
    'slug', slug,
    'active', active
  ) order by name), '[]'::jsonb)
  from public.teams
  where active = true
$$;

create or replace function public.player_team_roster(p_team_code text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  target_team public.teams%rowtype;
  roster jsonb;
begin
  select *
  into target_team
  from public.teams
  where active = true
    and (slug = p_team_code or id::text = p_team_code)
  limit 1;

  if target_team.id is null then
    raise exception 'team not found';
  end if;

  select jsonb_build_object(
    'team', jsonb_build_object(
      'id', target_team.id,
      'name', target_team.name,
      'slug', target_team.slug,
      'active', target_team.active
    ),
    'players', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', id,
        'name', name,
        'active', active,
        'position', position
      ) order by name)
      from public.players
      where team_id = target_team.id
        and active = true
    ), '[]'::jsonb),
    'painAreas', coalesce((
      select jsonb_agg(name order by sort_order, name)
      from public.pain_areas
      where team_id = target_team.id
        and active = true
    ), '[]'::jsonb),
    'settings', coalesce((
      select jsonb_build_object(
        'rpeHigh', rpe_high,
        'fatigueHigh', fatigue_high,
        'sorenessHigh', soreness_high,
        'sleepHoursLow', sleep_hours_low,
        'sleepQualityLow', sleep_quality_low,
        'weeklyLoadJumpPercent', weekly_load_jump_percent,
        'readinessRiskScore', readiness_risk_score
      )
      from public.settings
      where team_id = target_team.id
      limit 1
    ), '{}'::jsonb)
  )
  into roster;

  return roster;
end;
$$;

create or replace function public.player_login(
  p_team_code text,
  p_player_id text,
  p_pin_code text
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  target_team public.teams%rowtype;
  target_player public.players%rowtype;
begin
  select *
  into target_team
  from public.teams
  where active = true
    and (slug = p_team_code or id::text = p_team_code)
  limit 1;

  if target_team.id is null then
    raise exception 'team not found';
  end if;

  select *
  into target_player
  from public.players
  where team_id = target_team.id
    and id = p_player_id
    and active = true
    and pin_code = p_pin_code
  limit 1;

  if target_player.id is null then
    raise exception 'invalid player credentials';
  end if;

  return jsonb_build_object(
    'team', jsonb_build_object(
      'id', target_team.id,
      'name', target_team.name,
      'slug', target_team.slug,
      'active', target_team.active
    ),
    'player', jsonb_build_object(
      'id', target_player.id,
      'name', target_player.name,
      'active', target_player.active,
      'position', target_player.position
    )
  );
end;
$$;

create or replace function public.rpe_request_header(header_name text)
returns text
language plpgsql
stable
as $$
declare
  headers jsonb := '{}'::jsonb;
begin
  headers := coalesce(nullif(current_setting('request.headers', true), '')::jsonb, '{}'::jsonb);
  return headers ->> lower(header_name);
exception
  when others then
    return null;
end;
$$;

create or replace function public.can_player_submit_report(target_team_id uuid, target_player_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.players p
    where p.team_id = target_team_id
      and p.id = target_player_id
      and p.active = true
      and p.team_id::text = public.rpe_request_header('x-rpe-team-id')
      and p.id = public.rpe_request_header('x-rpe-player-id')
      and p.pin_code = public.rpe_request_header('x-rpe-player-pin')
  )
$$;

grant usage on schema public to anon, authenticated;
grant select on public.teams to anon;
grant execute on function public.player_team_list() to anon, authenticated;
grant execute on function public.player_team_roster(text) to anon, authenticated;
grant execute on function public.player_login(text, text, text) to anon, authenticated;
grant execute on function public.rpe_request_header(text) to anon, authenticated;
grant execute on function public.can_player_submit_report(uuid, text) to anon, authenticated;
grant select on public.readiness_reports to anon;
grant select on public.rpe_reports to anon;
grant select on public.gps_records to anon;
grant select on public.gps_sessions to anon;
grant insert, update on public.readiness_reports to anon;
grant insert, update on public.rpe_reports to anon;

drop policy if exists "public can select active teams" on public.teams;
create policy "public can select active teams"
on public.teams
for select
to anon
using (active = true);

drop policy if exists "players can insert own readiness reports" on public.readiness_reports;
drop policy if exists "players can select own readiness reports" on public.readiness_reports;
create policy "players can select own readiness reports"
on public.readiness_reports
for select
to anon
using (public.can_player_submit_report(team_id, player_id));

create policy "players can insert own readiness reports"
on public.readiness_reports
for insert
to anon
with check (public.can_player_submit_report(team_id, player_id));

drop policy if exists "players can update own readiness reports" on public.readiness_reports;
create policy "players can update own readiness reports"
on public.readiness_reports
for update
to anon
using (public.can_player_submit_report(team_id, player_id))
with check (public.can_player_submit_report(team_id, player_id));

drop policy if exists "players can insert own rpe reports" on public.rpe_reports;
drop policy if exists "players can select own rpe reports" on public.rpe_reports;
create policy "players can select own rpe reports"
on public.rpe_reports
for select
to anon
using (public.can_player_submit_report(team_id, player_id));

create policy "players can insert own rpe reports"
on public.rpe_reports
for insert
to anon
with check (public.can_player_submit_report(team_id, player_id));

drop policy if exists "players can update own rpe reports" on public.rpe_reports;
create policy "players can update own rpe reports"
on public.rpe_reports
for update
to anon
using (public.can_player_submit_report(team_id, player_id))
with check (public.can_player_submit_report(team_id, player_id));

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

-- Remove unsafe one-team demo anon policies if they were previously installed.
drop policy if exists "demo anon fixed team access" on public.teams;
drop policy if exists "demo anon fixed team access" on public.players;
drop policy if exists "demo anon fixed team access" on public.settings;
drop policy if exists "demo anon fixed team access" on public.pain_areas;
drop policy if exists "demo anon fixed team access" on public.sessions;
drop policy if exists "demo anon fixed team access" on public.readiness_reports;
drop policy if exists "demo anon fixed team access" on public.rpe_reports;
drop policy if exists "demo anon fixed team access" on public.gps_sessions;
drop policy if exists "demo anon fixed team access" on public.gps_records;
drop policy if exists "demo anon fixed team access" on public.injuries;
drop policy if exists "demo anon fixed team access" on public.coach_notes;

-- Teams.
insert into public.teams (id, name, slug, active)
values
  ('11111111-1111-4111-8111-111111111111', 'קבוצת צפון', 'team-1', true),
  ('22222222-2222-4222-8222-222222222222', 'קבוצת דרום', 'team-2', true)
on conflict (id) do update
set name = excluded.name,
    slug = excluded.slug,
    active = excluded.active,
    updated_at = now();

-- Settings.
insert into public.settings (
  team_id,
  rpe_high,
  fatigue_high,
  soreness_high,
  sleep_hours_low,
  sleep_quality_low,
  weekly_load_jump_percent,
  readiness_risk_score
)
values
  ('11111111-1111-4111-8111-111111111111', 8, 4, 4, 6, 2, 25, 60),
  ('22222222-2222-4222-8222-222222222222', 8, 4, 4, 6, 2, 25, 60)
on conflict (team_id) do update
set rpe_high = excluded.rpe_high,
    fatigue_high = excluded.fatigue_high,
    soreness_high = excluded.soreness_high,
    sleep_hours_low = excluded.sleep_hours_low,
    sleep_quality_low = excluded.sleep_quality_low,
    weekly_load_jump_percent = excluded.weekly_load_jump_percent,
    readiness_risk_score = excluded.readiness_risk_score,
    updated_at = now();

-- Pain areas.
insert into public.pain_areas (team_id, name, sort_order, active)
select team_id, name, sort_order, true
from (
  values
    ('11111111-1111-4111-8111-111111111111'::uuid, 'אין כאב', 1),
    ('11111111-1111-4111-8111-111111111111'::uuid, 'ארבע ראשי', 2),
    ('11111111-1111-4111-8111-111111111111'::uuid, 'המסטרינג', 3),
    ('11111111-1111-4111-8111-111111111111'::uuid, 'מקרבים', 4),
    ('11111111-1111-4111-8111-111111111111'::uuid, 'מכופפי ירך', 5),
    ('11111111-1111-4111-8111-111111111111'::uuid, 'תאומים', 6),
    ('11111111-1111-4111-8111-111111111111'::uuid, 'קרסול', 7),
    ('11111111-1111-4111-8111-111111111111'::uuid, 'ברך', 8),
    ('11111111-1111-4111-8111-111111111111'::uuid, 'גב תחתון', 9),
    ('11111111-1111-4111-8111-111111111111'::uuid, 'מפשעה', 10),
    ('11111111-1111-4111-8111-111111111111'::uuid, 'כתף', 11),
    ('11111111-1111-4111-8111-111111111111'::uuid, 'אחר', 12),
    ('22222222-2222-4222-8222-222222222222'::uuid, 'אין כאב', 1),
    ('22222222-2222-4222-8222-222222222222'::uuid, 'ארבע ראשי', 2),
    ('22222222-2222-4222-8222-222222222222'::uuid, 'המסטרינג', 3),
    ('22222222-2222-4222-8222-222222222222'::uuid, 'מקרבים', 4),
    ('22222222-2222-4222-8222-222222222222'::uuid, 'מכופפי ירך', 5),
    ('22222222-2222-4222-8222-222222222222'::uuid, 'תאומים', 6),
    ('22222222-2222-4222-8222-222222222222'::uuid, 'קרסול', 7),
    ('22222222-2222-4222-8222-222222222222'::uuid, 'ברך', 8),
    ('22222222-2222-4222-8222-222222222222'::uuid, 'גב תחתון', 9),
    ('22222222-2222-4222-8222-222222222222'::uuid, 'מפשעה', 10),
    ('22222222-2222-4222-8222-222222222222'::uuid, 'כתף', 11),
    ('22222222-2222-4222-8222-222222222222'::uuid, 'אחר', 12)
) as pain(team_id, name, sort_order)
on conflict (team_id, name) do update
set sort_order = excluded.sort_order,
    active = true;

-- Players and PINs.
insert into public.players (team_id, id, name, active, position, pin_code)
values
  ('11111111-1111-4111-8111-111111111111', 't1-p01', 'נועם לוי', true, 'שוער', '1001'),
  ('11111111-1111-4111-8111-111111111111', 't1-p02', 'איתי פרץ', true, 'שוער', '1002'),
  ('11111111-1111-4111-8111-111111111111', 't1-p03', 'עומר כהן', true, 'בלם', '1003'),
  ('11111111-1111-4111-8111-111111111111', 't1-p04', 'דניאל ביטון', true, 'בלם', '1004'),
  ('11111111-1111-4111-8111-111111111111', 't1-p05', 'רועי אברהם', true, 'בלם', '1005'),
  ('11111111-1111-4111-8111-111111111111', 't1-p06', 'יונתן מזרחי', true, 'בלם', '1006'),
  ('11111111-1111-4111-8111-111111111111', 't1-p07', 'יואב דהן', true, 'מגן', '1007'),
  ('11111111-1111-4111-8111-111111111111', 't1-p08', 'אביב אזולאי', true, 'מגן', '1008'),
  ('11111111-1111-4111-8111-111111111111', 't1-p09', 'שחר בן דוד', true, 'מגן', '1009'),
  ('11111111-1111-4111-8111-111111111111', 't1-p10', 'תומר מלכה', true, 'מגן', '1010'),
  ('11111111-1111-4111-8111-111111111111', 't1-p11', 'אלון גבאי', true, 'קשר', '1011'),
  ('22222222-2222-4222-8222-222222222222', 't2-p01', 'גיא שלום', true, 'קשר', '2001'),
  ('22222222-2222-4222-8222-222222222222', 't2-p02', 'ברק סויסה', true, 'קשר', '2002'),
  ('22222222-2222-4222-8222-222222222222', 't2-p03', 'רז חדד', true, 'קשר', '2003'),
  ('22222222-2222-4222-8222-222222222222', 't2-p04', 'יהלי אוחנה', true, 'קשר', '2004'),
  ('22222222-2222-4222-8222-222222222222', 't2-p05', 'ליאם אדרי', true, 'כנף', '2005'),
  ('22222222-2222-4222-8222-222222222222', 't2-p06', 'איתמר בוסקילה', true, 'כנף', '2006'),
  ('22222222-2222-4222-8222-222222222222', 't2-p07', 'עידו דיין', true, 'כנף', '2007'),
  ('22222222-2222-4222-8222-222222222222', 't2-p08', 'ניב אלקיים', true, 'חלוץ', '2008'),
  ('22222222-2222-4222-8222-222222222222', 't2-p09', 'מאור יצחק', true, 'חלוץ', '2009'),
  ('22222222-2222-4222-8222-222222222222', 't2-p10', 'אריאל חזן', true, 'חלוץ', '2010'),
  ('22222222-2222-4222-8222-222222222222', 't2-p11', 'דור רפאלי', true, 'חלוץ', '2011')
on conflict (team_id, id) do update
set name = excluded.name,
    active = excluded.active,
    position = excluded.position,
    pin_code = excluded.pin_code,
    updated_at = now();

-- Link coaches to teams after creating the two Supabase Auth users.
-- This insert is safe to rerun. If Auth users do not exist yet, it inserts nothing.
insert into public.coaches (team_id, user_id, name, email, role, active)
select t.id, u.id, 'מאמן קבוצת צפון', 'coach.team1@example.com', 'owner', true
from public.teams t
join auth.users u on lower(u.email) = 'coach.team1@example.com'
where t.slug = 'team-1'
on conflict (team_id, user_id) do update
set name = excluded.name,
    email = excluded.email,
    active = true,
    updated_at = now();

insert into public.coaches (team_id, user_id, name, email, role, active)
select t.id, u.id, 'מאמן קבוצת דרום', 'coach.team2@example.com', 'owner', true
from public.teams t
join auth.users u on lower(u.email) = 'coach.team2@example.com'
where t.slug = 'team-2'
on conflict (team_id, user_id) do update
set name = excluded.name,
    email = excluded.email,
    active = true,
    updated_at = now();

