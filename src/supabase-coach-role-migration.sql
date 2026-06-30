-- Safe coach role constraint migration.
-- Use this only if you need to patch an existing database before running the
-- full Owner/Admin migration. It is safe to rerun.
--
-- Base schema roles: owner, coach, viewer.
-- Final app roles: team_admin, coach, viewer.

alter table public.coaches
  drop constraint if exists coaches_role_check;

update public.coaches
set role = 'team_admin'
where role = 'owner';

alter table public.coaches
  add constraint coaches_role_check
  check (role in ('team_admin', 'coach', 'viewer'));
