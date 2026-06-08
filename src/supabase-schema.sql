-- Supabase schema for "דוח RPE קבוצתי"
-- Tables requested: teams, coaches, players, readiness_reports, rpe_reports,
-- gps_sessions, gps_records, injuries, coach_notes.
-- Extra operational tables used by the app: settings, pain_areas.

create extension if not exists pgcrypto;

create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.coaches (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  email text,
  role text not null default 'coach' check (role in ('owner', 'coach', 'viewer')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (team_id, user_id)
);

create table if not exists public.players (
  team_id uuid not null references public.teams(id) on delete cascade,
  id text not null,
  name text not null,
  active boolean not null default true,
  position text,
  pin_code text,
  pin_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (team_id, id)
);

create table if not exists public.settings (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null unique references public.teams(id) on delete cascade,
  rpe_high integer not null default 8,
  fatigue_high integer not null default 4,
  soreness_high integer not null default 4,
  sleep_hours_low numeric not null default 6,
  sleep_quality_low integer not null default 2,
  weekly_load_jump_percent numeric not null default 25,
  readiness_risk_score integer not null default 60,
  updated_at timestamptz not null default now()
);

create table if not exists public.pain_areas (
  team_id uuid not null references public.teams(id) on delete cascade,
  id bigint generated always as identity,
  name text not null,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (team_id, id),
  unique (team_id, name)
);

create table if not exists public.sessions (
  team_id uuid not null references public.teams(id) on delete cascade,
  id text not null,
  session_date date not null,
  session_type text not null,
  default_minutes integer not null default 0,
  notes text not null default '',
  player_minutes jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (team_id, id)
);

create table if not exists public.readiness_reports (
  team_id uuid not null,
  id text not null,
  player_id text not null,
  player_name text not null,
  created_at timestamptz not null default now(),
  report_date date not null,
  sleep_hours numeric not null,
  sleep_quality integer not null check (sleep_quality between 1 and 5),
  energy integer not null check (energy between 1 and 5),
  mood integer not null check (mood between 1 and 5),
  soreness integer not null check (soreness between 1 and 5),
  pain_area text not null,
  load_feeling integer not null check (load_feeling between 1 and 5),
  body_weight numeric,
  medical_limitation boolean not null default false,
  comments text not null default '',
  primary key (team_id, id),
  unique (team_id, player_id, report_date),
  foreign key (team_id, player_id) references public.players(team_id, id) on delete cascade,
  foreign key (team_id) references public.teams(id) on delete cascade
);

create table if not exists public.rpe_reports (
  team_id uuid not null,
  id text not null,
  player_id text not null,
  player_name text not null,
  created_at timestamptz not null default now(),
  report_date date not null,
  session_type text not null,
  rpe integer not null check (rpe between 1 and 10),
  fatigue integer not null check (fatigue between 1 and 5),
  soreness integer not null check (soreness between 1 and 5),
  pain_area text not null,
  completed_full_session text not null,
  body_weight_after numeric,
  comments text not null default '',
  primary key (team_id, id),
  unique (team_id, player_id, report_date),
  foreign key (team_id, player_id) references public.players(team_id, id) on delete cascade,
  foreign key (team_id) references public.teams(id) on delete cascade
);

create table if not exists public.gps_sessions (
  team_id uuid not null references public.teams(id) on delete cascade,
  id text not null,
  session_date date not null,
  session_name text not null,
  type text not null check (type in ('match', 'training')),
  opponent text,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (team_id, id)
);

create table if not exists public.gps_records (
  team_id uuid not null,
  id text not null,
  gps_session_id text not null,
  player_id text not null,
  player_name text not null,
  position text not null default '',
  period text not null,
  minutes_played numeric not null default 0,
  total_distance numeric not null default 0,
  distance_per_minute numeric not null default 0,
  intensity numeric not null default 0,
  gps_load numeric not null default 0,
  metabolic_activity numeric not null default 0,
  hmld numeric not null default 0,
  high_speed_running numeric not null default 0,
  distance_above_18 numeric not null default 0,
  distance_above_25 numeric not null default 0,
  max_speed numeric not null default 0,
  work_rest_ratio numeric not null default 0,
  accelerations numeric not null default 0,
  decelerations numeric not null default 0,
  created_at timestamptz not null default now(),
  primary key (team_id, id),
  foreign key (team_id, gps_session_id) references public.gps_sessions(team_id, id) on delete cascade,
  foreign key (team_id, player_id) references public.players(team_id, id) on delete cascade,
  foreign key (team_id) references public.teams(id) on delete cascade
);

create table if not exists public.injuries (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null,
  player_id text not null,
  injury_date date not null default current_date,
  pain_area text not null,
  severity text not null default 'monitoring' check (severity in ('monitoring', 'attention', 'risk')),
  status text not null default 'open' check (status in ('open', 'limited', 'resolved')),
  source_report_type text check (source_report_type in ('readiness', 'rpe', 'coach')),
  source_report_id text,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (team_id, player_id) references public.players(team_id, id) on delete cascade,
  foreign key (team_id) references public.teams(id) on delete cascade
);

create table if not exists public.coach_notes (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null,
  coach_id uuid references public.coaches(id) on delete set null,
  player_id text,
  note_date date not null default current_date,
  category text not null default 'general',
  note text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (team_id, player_id) references public.players(team_id, id) on delete cascade,
  foreign key (team_id) references public.teams(id) on delete cascade
);

create index if not exists coaches_user_id_idx on public.coaches(user_id);
create index if not exists coaches_team_id_idx on public.coaches(team_id);
create index if not exists players_team_id_idx on public.players(team_id);
create index if not exists readiness_reports_team_date_idx on public.readiness_reports(team_id, report_date);
create index if not exists readiness_reports_team_player_idx on public.readiness_reports(team_id, player_id);
create index if not exists rpe_reports_team_date_idx on public.rpe_reports(team_id, report_date);
create index if not exists rpe_reports_team_player_idx on public.rpe_reports(team_id, player_id);
create index if not exists sessions_team_date_idx on public.sessions(team_id, session_date);
create index if not exists gps_sessions_team_date_idx on public.gps_sessions(team_id, session_date);
create index if not exists gps_records_team_session_idx on public.gps_records(team_id, gps_session_id);
create index if not exists gps_records_team_player_idx on public.gps_records(team_id, player_id);
create index if not exists injuries_team_player_idx on public.injuries(team_id, player_id);
create index if not exists coach_notes_team_player_idx on public.coach_notes(team_id, player_id);

alter table public.teams enable row level security;
alter table public.coaches enable row level security;
alter table public.players enable row level security;
alter table public.settings enable row level security;
alter table public.pain_areas enable row level security;
alter table public.sessions enable row level security;
alter table public.readiness_reports enable row level security;
alter table public.rpe_reports enable row level security;
alter table public.gps_sessions enable row level security;
alter table public.gps_records enable row level security;
alter table public.injuries enable row level security;
alter table public.coach_notes enable row level security;

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

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.teams to authenticated;
grant select, insert, update, delete on public.coaches to authenticated;
grant select, insert, update, delete on public.players to authenticated;
grant select, insert, update, delete on public.settings to authenticated;
grant select, insert, update, delete on public.pain_areas to authenticated;
grant select, insert, update, delete on public.sessions to authenticated;
grant select, insert, update, delete on public.readiness_reports to authenticated;
grant select, insert, update, delete on public.rpe_reports to authenticated;
grant select, insert, update, delete on public.gps_sessions to authenticated;
grant select, insert, update, delete on public.gps_records to authenticated;
grant select, insert, update, delete on public.injuries to authenticated;
grant select, insert, update, delete on public.coach_notes to authenticated;
grant execute on function public.current_coach_team_ids() to authenticated;
grant execute on function public.can_access_team(uuid) to authenticated;

drop policy if exists "coaches can access own teams" on public.teams;
create policy "coaches can access own teams"
on public.teams
for all
to authenticated
using (public.can_access_team(id))
with check (public.can_access_team(id));

drop policy if exists "coaches can access own coach rows" on public.coaches;
create policy "coaches can access own coach rows"
on public.coaches
for all
to authenticated
using (public.can_access_team(team_id))
with check (public.can_access_team(team_id));

drop policy if exists "coaches can access own players" on public.players;
create policy "coaches can access own players"
on public.players
for all
to authenticated
using (public.can_access_team(team_id))
with check (public.can_access_team(team_id));

drop policy if exists "coaches can access own settings" on public.settings;
create policy "coaches can access own settings"
on public.settings
for all
to authenticated
using (public.can_access_team(team_id))
with check (public.can_access_team(team_id));

drop policy if exists "coaches can access own pain areas" on public.pain_areas;
create policy "coaches can access own pain areas"
on public.pain_areas
for all
to authenticated
using (public.can_access_team(team_id))
with check (public.can_access_team(team_id));

drop policy if exists "coaches can access own sessions" on public.sessions;
create policy "coaches can access own sessions"
on public.sessions
for all
to authenticated
using (public.can_access_team(team_id))
with check (public.can_access_team(team_id));

drop policy if exists "coaches can access own readiness reports" on public.readiness_reports;
create policy "coaches can access own readiness reports"
on public.readiness_reports
for all
to authenticated
using (public.can_access_team(team_id))
with check (public.can_access_team(team_id));

drop policy if exists "coaches can access own rpe reports" on public.rpe_reports;
create policy "coaches can access own rpe reports"
on public.rpe_reports
for all
to authenticated
using (public.can_access_team(team_id))
with check (public.can_access_team(team_id));

drop policy if exists "coaches can access own gps sessions" on public.gps_sessions;
create policy "coaches can access own gps sessions"
on public.gps_sessions
for all
to authenticated
using (public.can_access_team(team_id))
with check (public.can_access_team(team_id));

drop policy if exists "coaches can access own gps records" on public.gps_records;
create policy "coaches can access own gps records"
on public.gps_records
for all
to authenticated
using (public.can_access_team(team_id))
with check (public.can_access_team(team_id));

drop policy if exists "coaches can access own injuries" on public.injuries;
create policy "coaches can access own injuries"
on public.injuries
for all
to authenticated
using (public.can_access_team(team_id))
with check (public.can_access_team(team_id));

drop policy if exists "coaches can access own coach notes" on public.coach_notes;
create policy "coaches can access own coach notes"
on public.coach_notes
for all
to authenticated
using (public.can_access_team(team_id))
with check (public.can_access_team(team_id));

-- Current static app migration mode:
-- The browser adapter writes with SUPABASE_PUBLISHABLE_KEY. For true locked-down
-- multi-team production, sign coaches in with Supabase Auth and send their JWT
-- as the Authorization bearer token. Until that is enabled, use localStorage mode
-- or a single trusted demo Supabase project.
-- Never expose a service_role or secret key in the frontend.
