-- Owner/Admin management + role-aware RLS migration.
-- Run after src/supabase-schema.sql and src/supabase-real-use-bootstrap.sql.
--
-- This migration adds:
-- - platform owner support
-- - Team Admin / Coach / Viewer roles
-- - owner/team context RPC for the coach app
-- - role-aware RLS policies
--
-- Initial owner bootstrap:
-- 1. Create this Supabase Auth user in Authentication -> Users:
--    mark2fitness4max@gmail.com / OwnerAdmin!2026
-- 2. Confirm the email.
-- 3. Run this file. You may safely rerun it.

create extension if not exists pgcrypto;

create table if not exists public.platform_owners (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  name text not null default 'Platform Owner',
  email text not null unique,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.platform_owners enable row level security;

-- Normalize team roles. Existing legacy role 'owner' becomes Team Admin.
alter table public.coaches
  drop constraint if exists coaches_role_check;

update public.coaches
set role = 'team_admin'
where role = 'owner';

alter table public.coaches
  add constraint coaches_role_check
  check (role in ('team_admin', 'coach', 'viewer'));

create or replace function public.is_platform_owner()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.platform_owners
    where user_id = (select auth.uid())
      and active = true
  )
$$;

create or replace function public.can_access_team(target_team_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_platform_owner()
    or exists (
      select 1
      from public.coaches
      where user_id = (select auth.uid())
        and active = true
        and team_id = target_team_id
    )
$$;

create or replace function public.can_manage_team(target_team_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_platform_owner()
    or exists (
      select 1
      from public.coaches
      where user_id = (select auth.uid())
        and active = true
        and role = 'team_admin'
        and team_id = target_team_id
    )
$$;

create or replace function public.can_write_team(target_team_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_platform_owner()
    or exists (
      select 1
      from public.coaches
      where user_id = (select auth.uid())
        and active = true
        and role in ('team_admin', 'coach')
        and team_id = target_team_id
    )
$$;

create or replace function public.current_coach_team_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select id
  from public.teams
  where public.is_platform_owner()
  union
  select team_id
  from public.coaches
  where user_id = (select auth.uid())
    and active = true
$$;

grant execute on function public.is_platform_owner() to authenticated;
grant execute on function public.can_access_team(uuid) to authenticated;
grant execute on function public.can_manage_team(uuid) to authenticated;
grant execute on function public.can_write_team(uuid) to authenticated;
grant execute on function public.current_coach_team_ids() to authenticated;

drop policy if exists "platform owners can manage platform owners" on public.platform_owners;
create policy "platform owners can manage platform owners"
on public.platform_owners
for all
to authenticated
using (public.is_platform_owner())
with check (public.is_platform_owner());

grant select, insert, update, delete on public.platform_owners to authenticated;

create or replace function public.coach_session_context()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  uid uuid := (select auth.uid());
  owner_row public.platform_owners%rowtype;
  team_payload jsonb := '[]'::jsonb;
  coach_payload jsonb := '[]'::jsonb;
  profile_name text := '';
  profile_email text := coalesce((auth.jwt() ->> 'email'), '');
begin
  if uid is null then
    raise exception 'not authenticated';
  end if;

  select *
  into owner_row
  from public.platform_owners
  where user_id = uid
    and active = true
  limit 1;

  if owner_row.user_id is not null then
    select coalesce(jsonb_agg(jsonb_build_object(
      'id', t.id,
      'name', t.name,
      'slug', t.slug,
      'active', t.active,
      'role', 'owner',
      'coachId', null
    ) order by t.name), '[]'::jsonb)
    into team_payload
    from public.teams t;

    return jsonb_build_object(
      'isOwner', true,
      'role', 'owner',
      'coachId', null,
      'coachName', owner_row.name,
      'email', owner_row.email,
      'teams', team_payload
    );
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', t.id,
    'name', t.name,
    'slug', t.slug,
    'active', t.active,
    'role', c.role,
    'coachId', c.id
  ) order by t.name), '[]'::jsonb)
  into team_payload
  from public.coaches c
  join public.teams t on t.id = c.team_id
  where c.user_id = uid
    and c.active = true
    and t.active = true;

  select coalesce(jsonb_agg(jsonb_build_object(
    'coachId', c.id,
    'teamId', c.team_id,
    'name', c.name,
    'email', c.email,
    'role', c.role,
    'active', c.active
  ) order by c.name), '[]'::jsonb)
  into coach_payload
  from public.coaches c
  where c.user_id = uid
    and c.active = true;

  select coalesce(nullif(max(c.name), ''), 'צוות מקצועי'),
         coalesce(nullif(max(c.email), ''), profile_email)
  into profile_name, profile_email
  from public.coaches c
  where c.user_id = uid
    and c.active = true;

  if jsonb_array_length(team_payload) = 0 then
    raise exception 'no active coach teams';
  end if;

  return jsonb_build_object(
    'isOwner', false,
    'role', coalesce((team_payload -> 0 ->> 'role'), 'coach'),
    'coachId', (team_payload -> 0 ->> 'coachId'),
    'coachName', profile_name,
    'email', profile_email,
    'teams', team_payload,
    'coachAssignments', coach_payload
  );
end;
$$;

grant execute on function public.coach_session_context() to authenticated;

-- Replace broad base policies with role-aware policies.
drop policy if exists "coaches can access own teams" on public.teams;
drop policy if exists "coaches can select teams" on public.teams;
drop policy if exists "owners can insert teams" on public.teams;
drop policy if exists "owners can update teams" on public.teams;
drop policy if exists "owners can delete teams" on public.teams;
create policy "coaches can select teams"
on public.teams for select to authenticated
using (public.can_access_team(id));
create policy "owners can insert teams"
on public.teams for insert to authenticated
with check (public.is_platform_owner());
create policy "owners can update teams"
on public.teams for update to authenticated
using (public.is_platform_owner())
with check (public.is_platform_owner());
create policy "owners can delete teams"
on public.teams for delete to authenticated
using (public.is_platform_owner());

drop policy if exists "coaches can access own coach rows" on public.coaches;
drop policy if exists "coaches can select coach rows" on public.coaches;
drop policy if exists "team admins can insert coach rows" on public.coaches;
drop policy if exists "team admins can update coach rows" on public.coaches;
drop policy if exists "team admins can delete coach rows" on public.coaches;
create policy "coaches can select coach rows"
on public.coaches for select to authenticated
using (public.can_access_team(team_id));
create policy "team admins can insert coach rows"
on public.coaches for insert to authenticated
with check (public.can_manage_team(team_id));
create policy "team admins can update coach rows"
on public.coaches for update to authenticated
using (public.can_manage_team(team_id))
with check (public.can_manage_team(team_id));
create policy "team admins can delete coach rows"
on public.coaches for delete to authenticated
using (public.can_manage_team(team_id));

drop policy if exists "coaches can access own players" on public.players;
drop policy if exists "coaches can select players" on public.players;
drop policy if exists "team admins can insert players" on public.players;
drop policy if exists "team admins can update players" on public.players;
drop policy if exists "team admins can delete players" on public.players;
create policy "coaches can select players"
on public.players for select to authenticated
using (public.can_access_team(team_id));
create policy "team admins can insert players"
on public.players for insert to authenticated
with check (public.can_manage_team(team_id));
create policy "team admins can update players"
on public.players for update to authenticated
using (public.can_manage_team(team_id))
with check (public.can_manage_team(team_id));
create policy "team admins can delete players"
on public.players for delete to authenticated
using (public.can_manage_team(team_id));

drop policy if exists "coaches can access own settings" on public.settings;
drop policy if exists "coaches can select settings" on public.settings;
drop policy if exists "team admins can insert settings" on public.settings;
drop policy if exists "team admins can update settings" on public.settings;
drop policy if exists "team admins can delete settings" on public.settings;
create policy "coaches can select settings"
on public.settings for select to authenticated
using (public.can_access_team(team_id));
create policy "team admins can insert settings"
on public.settings for insert to authenticated
with check (public.can_manage_team(team_id));
create policy "team admins can update settings"
on public.settings for update to authenticated
using (public.can_manage_team(team_id))
with check (public.can_manage_team(team_id));
create policy "team admins can delete settings"
on public.settings for delete to authenticated
using (public.can_manage_team(team_id));

drop policy if exists "coaches can access own pain areas" on public.pain_areas;
drop policy if exists "coaches can select pain areas" on public.pain_areas;
drop policy if exists "team admins can insert pain areas" on public.pain_areas;
drop policy if exists "team admins can update pain areas" on public.pain_areas;
drop policy if exists "team admins can delete pain areas" on public.pain_areas;
create policy "coaches can select pain areas"
on public.pain_areas for select to authenticated
using (public.can_access_team(team_id));
create policy "team admins can insert pain areas"
on public.pain_areas for insert to authenticated
with check (public.can_manage_team(team_id));
create policy "team admins can update pain areas"
on public.pain_areas for update to authenticated
using (public.can_manage_team(team_id))
with check (public.can_manage_team(team_id));
create policy "team admins can delete pain areas"
on public.pain_areas for delete to authenticated
using (public.can_manage_team(team_id));

drop policy if exists "coaches can access own sessions" on public.sessions;
drop policy if exists "coaches can select sessions" on public.sessions;
drop policy if exists "coaches can insert sessions" on public.sessions;
drop policy if exists "coaches can update sessions" on public.sessions;
drop policy if exists "coaches can delete sessions" on public.sessions;
create policy "coaches can select sessions"
on public.sessions for select to authenticated
using (public.can_access_team(team_id));
create policy "coaches can insert sessions"
on public.sessions for insert to authenticated
with check (public.can_write_team(team_id));
create policy "coaches can update sessions"
on public.sessions for update to authenticated
using (public.can_write_team(team_id))
with check (public.can_write_team(team_id));
create policy "coaches can delete sessions"
on public.sessions for delete to authenticated
using (public.can_write_team(team_id));

drop policy if exists "coaches can access own readiness reports" on public.readiness_reports;
drop policy if exists "coaches can select readiness reports" on public.readiness_reports;
drop policy if exists "coaches can insert readiness reports" on public.readiness_reports;
drop policy if exists "coaches can update readiness reports" on public.readiness_reports;
drop policy if exists "coaches can delete readiness reports" on public.readiness_reports;
create policy "coaches can select readiness reports"
on public.readiness_reports for select to authenticated
using (public.can_access_team(team_id));
create policy "coaches can insert readiness reports"
on public.readiness_reports for insert to authenticated
with check (public.can_write_team(team_id));
create policy "coaches can update readiness reports"
on public.readiness_reports for update to authenticated
using (public.can_write_team(team_id))
with check (public.can_write_team(team_id));
create policy "coaches can delete readiness reports"
on public.readiness_reports for delete to authenticated
using (public.can_write_team(team_id));

drop policy if exists "coaches can access own rpe reports" on public.rpe_reports;
drop policy if exists "coaches can select rpe reports" on public.rpe_reports;
drop policy if exists "coaches can insert rpe reports" on public.rpe_reports;
drop policy if exists "coaches can update rpe reports" on public.rpe_reports;
drop policy if exists "coaches can delete rpe reports" on public.rpe_reports;
create policy "coaches can select rpe reports"
on public.rpe_reports for select to authenticated
using (public.can_access_team(team_id));
create policy "coaches can insert rpe reports"
on public.rpe_reports for insert to authenticated
with check (public.can_write_team(team_id));
create policy "coaches can update rpe reports"
on public.rpe_reports for update to authenticated
using (public.can_write_team(team_id))
with check (public.can_write_team(team_id));
create policy "coaches can delete rpe reports"
on public.rpe_reports for delete to authenticated
using (public.can_write_team(team_id));

drop policy if exists "coaches can access own gps sessions" on public.gps_sessions;
drop policy if exists "coaches can select gps sessions" on public.gps_sessions;
drop policy if exists "coaches can insert gps sessions" on public.gps_sessions;
drop policy if exists "coaches can update gps sessions" on public.gps_sessions;
drop policy if exists "coaches can delete gps sessions" on public.gps_sessions;
create policy "coaches can select gps sessions"
on public.gps_sessions for select to authenticated
using (public.can_access_team(team_id));
create policy "coaches can insert gps sessions"
on public.gps_sessions for insert to authenticated
with check (public.can_write_team(team_id));
create policy "coaches can update gps sessions"
on public.gps_sessions for update to authenticated
using (public.can_write_team(team_id))
with check (public.can_write_team(team_id));
create policy "coaches can delete gps sessions"
on public.gps_sessions for delete to authenticated
using (public.can_write_team(team_id));

drop policy if exists "coaches can access own gps records" on public.gps_records;
drop policy if exists "coaches can select gps records" on public.gps_records;
drop policy if exists "coaches can insert gps records" on public.gps_records;
drop policy if exists "coaches can update gps records" on public.gps_records;
drop policy if exists "coaches can delete gps records" on public.gps_records;
create policy "coaches can select gps records"
on public.gps_records for select to authenticated
using (public.can_access_team(team_id));
create policy "coaches can insert gps records"
on public.gps_records for insert to authenticated
with check (public.can_write_team(team_id));
create policy "coaches can update gps records"
on public.gps_records for update to authenticated
using (public.can_write_team(team_id))
with check (public.can_write_team(team_id));
create policy "coaches can delete gps records"
on public.gps_records for delete to authenticated
using (public.can_write_team(team_id));

drop policy if exists "coaches can access own injuries" on public.injuries;
drop policy if exists "coaches can select injuries" on public.injuries;
drop policy if exists "coaches can insert injuries" on public.injuries;
drop policy if exists "coaches can update injuries" on public.injuries;
drop policy if exists "coaches can delete injuries" on public.injuries;
create policy "coaches can select injuries"
on public.injuries for select to authenticated
using (public.can_access_team(team_id));
create policy "coaches can insert injuries"
on public.injuries for insert to authenticated
with check (public.can_write_team(team_id));
create policy "coaches can update injuries"
on public.injuries for update to authenticated
using (public.can_write_team(team_id))
with check (public.can_write_team(team_id));
create policy "coaches can delete injuries"
on public.injuries for delete to authenticated
using (public.can_write_team(team_id));

drop policy if exists "coaches can access own coach notes" on public.coach_notes;
drop policy if exists "coaches can select coach notes" on public.coach_notes;
drop policy if exists "coaches can insert coach notes" on public.coach_notes;
drop policy if exists "coaches can update coach notes" on public.coach_notes;
drop policy if exists "coaches can delete coach notes" on public.coach_notes;
create policy "coaches can select coach notes"
on public.coach_notes for select to authenticated
using (public.can_access_team(team_id));
create policy "coaches can insert coach notes"
on public.coach_notes for insert to authenticated
with check (public.can_write_team(team_id));
create policy "coaches can update coach notes"
on public.coach_notes for update to authenticated
using (public.can_write_team(team_id))
with check (public.can_write_team(team_id));
create policy "coaches can delete coach notes"
on public.coach_notes for delete to authenticated
using (public.can_write_team(team_id));

-- Bootstrap the initial platform owner if the Auth user already exists.
insert into public.platform_owners (user_id, name, email, active)
select u.id, 'בעלים מערכת', 'mark2fitness4max@gmail.com', true
from auth.users u
where lower(u.email) = 'mark2fitness4max@gmail.com'
on conflict (user_id) do update
set name = excluded.name,
    email = excluded.email,
    active = true,
    updated_at = now();
