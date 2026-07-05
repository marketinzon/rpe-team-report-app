import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const rootDir = path.resolve(path.dirname(__filename), "..");

const USERS = {
  owner: { email: "mark2fitness4max@gmail.com", password: "OwnerAdmin!2026" },
  team1: { email: "coach.team1@example.com", password: "CoachTeam1!2026", slug: "team-1" },
  team2: { email: "coach.team2@example.com", password: "CoachTeam2!2026", slug: "team-2" }
};

function parseEnvValue(value) {
  let next = value.trim();
  const quote = next[0];
  if ((quote === "\"" || quote === "'") && next.endsWith(quote)) {
    next = next.slice(1, -1);
  }
  return next.replace(/\\n/g, "\n").replace(/\\r/g, "\r").replace(/\\t/g, "\t");
}

async function loadDotEnv() {
  const envPath = path.join(rootDir, ".env");
  if (!existsSync(envPath)) return {};
  const text = await readFile(envPath, "utf8");
  const values = {};
  text.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) return;
    const key = trimmed.slice(0, separatorIndex).trim();
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) return;
    values[key] = parseEnvValue(trimmed.slice(separatorIndex + 1));
  });
  return values;
}

function envValue(values, key) {
  return process.env[key] || values[key] || "";
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function request(env, pathName, options = {}) {
  const response = await fetch(`${env.url.replace(/\/$/, "")}${pathName}`, {
    ...options,
    headers: {
      apikey: env.key,
      "Content-Type": "application/json",
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : { Authorization: `Bearer ${env.key}` }),
      ...(options.headers || {})
    }
  });
  const text = await response.text();
  const payload = text ? safeJson(text) : null;
  if (!response.ok) {
    const message = payload?.msg || payload?.message || payload?.error_description || payload?.error || text;
    const error = new Error(message || `Request failed: ${response.status}`);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }
  return payload;
}

function safeJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function login(env, user) {
  try {
    const payload = await request(env, "/auth/v1/token?grant_type=password", {
      method: "POST",
      body: JSON.stringify({ email: user.email, password: user.password })
    });
    const token = payload?.access_token;
    assert(token, `No access token returned for ${user.email}`);
    return token;
  } catch (error) {
    throw new Error(`Login failed for ${user.email}: ${error.message}. Create/confirm the Auth user or reset the password.`);
  }
}

async function rpc(env, token, fn, body = {}) {
  return request(env, `/rest/v1/rpc/${fn}`, {
    method: "POST",
    token,
    body: JSON.stringify(body)
  });
}

async function anonRpc(env, fn, body = {}) {
  return request(env, `/rest/v1/rpc/${fn}`, {
    method: "POST",
    body: JSON.stringify(body)
  });
}

async function getPlayers(env, token) {
  return request(env, "/rest/v1/players?select=id,name,team_id&order=name.asc", { token });
}

async function getPublicActiveTeams(env) {
  return request(env, "/rest/v1/teams?active=eq.true&select=id,name,slug,active&order=name.asc");
}

const dotEnv = await loadDotEnv();
const env = {
  url: envValue(dotEnv, "SUPABASE_URL") || envValue(dotEnv, "NEXT_PUBLIC_SUPABASE_URL"),
  key:
    envValue(dotEnv, "SUPABASE_PUBLISHABLE_KEY") ||
    envValue(dotEnv, "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY") ||
    envValue(dotEnv, "SUPABASE_ANON_KEY") ||
    envValue(dotEnv, "NEXT_PUBLIC_SUPABASE_ANON_KEY")
};

assert(env.url, "Missing SUPABASE_URL in .env");
assert(env.key, "Missing SUPABASE_PUBLISHABLE_KEY in .env");

const ownerToken = await login(env, USERS.owner);
const team1Token = await login(env, USERS.team1);
const team2Token = await login(env, USERS.team2);

const ownerContext = await rpc(env, ownerToken, "coach_session_context");
assert(ownerContext?.isOwner === true, "Owner context is not marked as isOwner=true");
assert((ownerContext.teams || []).some((team) => team.slug === "team-1"), "Owner does not see Team 1");
assert((ownerContext.teams || []).some((team) => team.slug === "team-2"), "Owner does not see Team 2");

const team1Context = await rpc(env, team1Token, "coach_session_context");
const team2Context = await rpc(env, team2Token, "coach_session_context");

assert(team1Context?.isOwner === false, "Team 1 coach should not be platform owner");
assert(team2Context?.isOwner === false, "Team 2 coach should not be platform owner");
assert((team1Context.teams || []).length === 1 && team1Context.teams[0].slug === "team-1", "Team 1 coach team assignment is wrong");
assert((team2Context.teams || []).length === 1 && team2Context.teams[0].slug === "team-2", "Team 2 coach team assignment is wrong");

const roster1 = await anonRpc(env, "player_team_roster", { p_team_code: "team-1" });
const roster2 = await anonRpc(env, "player_team_roster", { p_team_code: "team-2" });
const teamList = await getPublicActiveTeams(env);
assert(Array.isArray(teamList) && teamList.some((team) => team.slug === "team-1") && teamList.some((team) => team.slug === "team-2"), "Public active teams query failed or is missing Team 1 / Team 2");
assert(roster1?.team?.slug === "team-1" && (roster1.players || []).length > 0, "Team 1 player roster RPC failed");
assert(roster2?.team?.slug === "team-2" && (roster2.players || []).length > 0, "Team 2 player roster RPC failed");

const team1Players = await getPlayers(env, team1Token);
const team2Players = await getPlayers(env, team2Token);
const team1Id = team1Context.teams[0].id;
const team2Id = team2Context.teams[0].id;
assert(team1Players.length > 0 && team1Players.every((player) => player.team_id === team1Id), "Team 1 coach can see players outside Team 1");
assert(team2Players.length > 0 && team2Players.every((player) => player.team_id === team2Id), "Team 2 coach can see players outside Team 2");

console.log("SUPABASE_FINAL_SETUP_OK");
console.log(JSON.stringify({
  owner: USERS.owner.email,
  ownerTeams: ownerContext.teams.map((team) => team.slug),
  team1CoachTeams: team1Context.teams.map((team) => team.slug),
  team2CoachTeams: team2Context.teams.map((team) => team.slug),
  publicActiveTeams: teamList.map((team) => team.name),
  team1Players: team1Players.length,
  team2Players: team2Players.length
}, null, 2));
