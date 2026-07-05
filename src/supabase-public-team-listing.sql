-- Public active team listing for player login.
-- Safe to rerun. This does not expose players, reports, GPS, PINs, or coach data.
-- It only lets anonymous player-login screens list active team names/slugs.

grant select on public.teams to anon;

drop policy if exists "public can select active teams" on public.teams;
create policy "public can select active teams"
on public.teams
for select
to anon
using (active = true);
