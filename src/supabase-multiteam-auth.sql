-- Multi-team + coach login production migration.
-- Run after src/supabase-schema.sql.
-- This file is additive and does not delete existing real data.
--
-- STATUS:
-- Optional reference migration only.
-- For the prepared Team 1 / Team 2 setup, do NOT run this file separately.
-- Run src/supabase-real-use-bootstrap.sql instead; it includes these RPCs,
-- player report policies, demo-policy cleanup, and the initial two-team data.

create extension if not exists pgcrypto;

-- The app can store friendly/training matches in gps_sessions.type.
alter table public.gps_sessions
  drop constraint if exists gps_sessions_type_check;

alter table public.gps_sessions
  add constraint gps_sessions_type_check
  check (type in ('match', 'training', 'training_match'));

-- Keep coach-owned access locked to the coach's team through Supabase Auth.
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

-- Player-facing helpers. They expose only roster labels and validate PINs
-- server-side. PINs are not hard-coded in frontend code.
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

grant insert, update on public.readiness_reports to anon;
grant insert, update on public.rpe_reports to anon;

drop policy if exists "public can select active teams" on public.teams;
create policy "public can select active teams"
on public.teams
for select
to anon
using (active = true);

drop policy if exists "players can insert own readiness reports" on public.readiness_reports;
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

-- IMPORTANT for real use:
-- Remove old demo anon policies before entering real team data:
--
-- drop policy if exists "demo anon fixed team access" on public.teams;
-- drop policy if exists "demo anon fixed team access" on public.players;
-- drop policy if exists "demo anon fixed team access" on public.settings;
-- drop policy if exists "demo anon fixed team access" on public.pain_areas;
-- drop policy if exists "demo anon fixed team access" on public.sessions;
-- drop policy if exists "demo anon fixed team access" on public.readiness_reports;
-- drop policy if exists "demo anon fixed team access" on public.rpe_reports;
-- drop policy if exists "demo anon fixed team access" on public.gps_sessions;
-- drop policy if exists "demo anon fixed team access" on public.gps_records;
-- drop policy if exists "demo anon fixed team access" on public.injuries;
-- drop policy if exists "demo anon fixed team access" on public.coach_notes;
