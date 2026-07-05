import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const rootDir = path.resolve(path.dirname(__filename), "..");

const app = await readFile(path.join(rootDir, "assets", "app.js"), "utf8");
const sql = await readFile(path.join(rootDir, "src", "supabase-multiteam-auth.sql"), "utf8");
const bootstrapSql = await readFile(path.join(rootDir, "src", "supabase-real-use-bootstrap.sql"), "utf8");
const ownerAdminSql = await readFile(path.join(rootDir, "src", "supabase-owner-admin.sql"), "utf8");
const adminApi = await readFile(path.join(rootDir, "api", "admin.js"), "utf8");
const schema = await readFile(path.join(rootDir, "src", "supabase-schema.sql"), "utf8");
const seedAuthUsers = await readFile(path.join(rootDir, "scripts", "seed-auth-users.mjs"), "utf8");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(app.includes("COACH_SESSION_KEY"), "coach session key is missing");
assert(app.includes("/auth/v1/"), "Supabase Auth endpoints are not used");
assert(app.includes("supabaseAuthPasswordLogin"), "coach password login function is missing");
assert(app.includes("getActiveTeamId()"), "active team helper is missing");
assert(app.includes("Authorization: getSupabaseAuthorizationHeader()"), "Supabase REST does not use dynamic auth header");
assert(app.includes("player_team_roster"), "player team roster RPC is missing");
assert(app.includes("player_team_list"), "player team list RPC is missing from player login flow");
assert(app.includes("player_login"), "player login RPC is missing");
assert(app.includes("x-rpe-team-id"), "player team RLS header is missing");
assert(app.includes("team_id=eq.${encodeURIComponent(teamId)}"), "Supabase loading is not visibly team-scoped");
assert(app.includes("team_id: getActiveTeamId()"), "Supabase writes are not visibly team-scoped");

assert(schema.includes("team_id uuid not null"), "base schema must include team_id columns");
assert(schema.includes("public.can_access_team(team_id)"), "coach RLS policies are missing from schema");
assert(sql.includes("create or replace function public.player_team_roster"), "player roster RPC migration missing");
assert(sql.includes("create or replace function public.player_team_list"), "player team list RPC migration missing");
assert(sql.includes("create or replace function public.player_login"), "player login RPC migration missing");
assert(sql.includes("public.can_player_submit_report"), "player report RLS helper missing");
assert(sql.includes("for insert") && sql.includes("for update"), "player report insert/update policies missing");
assert(sql.includes("training_match"), "GPS friendly match type migration missing");

assert(bootstrapSql.includes("create or replace function public.player_team_roster"), "real-use bootstrap is missing player roster RPC");
assert(bootstrapSql.includes("create or replace function public.player_team_list"), "real-use bootstrap is missing player team list RPC");
assert(bootstrapSql.includes("create or replace function public.player_login"), "real-use bootstrap is missing player login RPC");
assert(bootstrapSql.includes("coach.team1@example.com"), "Team 1 demo coach email missing from bootstrap");
assert(bootstrapSql.includes("coach.team2@example.com"), "Team 2 demo coach email missing from bootstrap");
assert(bootstrapSql.includes("CoachTeam1!2026"), "Team 1 demo coach password documentation missing from bootstrap");
assert(bootstrapSql.includes("CoachTeam2!2026"), "Team 2 demo coach password documentation missing from bootstrap");
assert(bootstrapSql.includes("'coach.team1@example.com', 'owner', true"), "Team 1 bootstrap must use schema-compatible legacy owner role before owner-admin migration");
assert(bootstrapSql.includes("'coach.team2@example.com', 'owner', true"), "Team 2 bootstrap must use schema-compatible legacy owner role before owner-admin migration");
assert(!bootstrapSql.includes("'coach.team1@example.com', 'team_admin', true"), "real-use bootstrap cannot insert team_admin before the role constraint is migrated");
assert(!bootstrapSql.includes("'coach.team2@example.com', 'team_admin', true"), "real-use bootstrap cannot insert team_admin before the role constraint is migrated");
assert(bootstrapSql.includes("קבוצת צפון") && bootstrapSql.includes("קבוצת דרום"), "demo team names missing from bootstrap");
assert(bootstrapSql.includes("'team-1'") && bootstrapSql.includes("'team-2'"), "demo team codes missing from bootstrap");
assert(bootstrapSql.includes("'1001'") && bootstrapSql.includes("'2011'"), "demo player PIN range missing from bootstrap");

assert(app.includes("/coach/admin"), "owner admin route is missing");
assert(app.includes("ניהול מערכת"), "owner admin navigation label is missing");
assert(app.includes("coach_session_context"), "coach session context RPC is not used");
assert(app.includes("isPlatformOwner"), "platform owner UI guard is missing");
assert(app.includes("data-team-switcher"), "multi-team switcher is missing");
assert(ownerAdminSql.includes("create table if not exists public.platform_owners"), "platform owners table migration is missing");
assert(ownerAdminSql.includes("create or replace function public.coach_session_context"), "coach session context migration is missing");
assert(ownerAdminSql.includes("public.is_platform_owner()"), "platform owner RLS helper is missing");
assert(ownerAdminSql.includes("public.can_manage_team") && ownerAdminSql.includes("public.can_write_team"), "role-aware RLS helpers are missing");
assert(ownerAdminSql.includes("mark2fitness4max@gmail.com"), "real owner bootstrap email is missing");
assert(adminApi.includes("SUPABASE_SERVICE_ROLE_KEY"), "admin API must use server-side service role key");
assert(adminApi.includes("createCoach") && adminApi.includes("resetCoachPassword"), "admin API coach actions are missing");
assert(seedAuthUsers.includes("mark2fitness4max@gmail.com"), "auth seed script must create the real owner user");

console.log("TEAM_ISOLATION_CHECK_OK");
