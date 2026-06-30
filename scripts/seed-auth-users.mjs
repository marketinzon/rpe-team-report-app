import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const rootDir = path.resolve(path.dirname(__filename), "..");

const DEFAULT_USERS = [
  {
    email: "mark2fitness4max@gmail.com",
    password: "OwnerAdmin!2026",
    label: "Platform Owner"
  },
  {
    email: "coach.team1@example.com",
    password: "CoachTeam1!2026",
    label: "Coach Team 1"
  },
  {
    email: "coach.team2@example.com",
    password: "CoachTeam2!2026",
    label: "Coach Team 2"
  }
];

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

function assertEnv(env) {
  const missing = Object.entries(env)
    .filter(([, value]) => !value)
    .map(([key]) => key);
  if (missing.length) {
    throw new Error(`Missing required server env: ${missing.join(", ")}`);
  }
}

async function supabaseAdminFetch(env, pathName, options = {}) {
  const response = await fetch(`${env.SUPABASE_URL.replace(/\/$/, "")}${pathName}`, {
    ...options,
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });
  const text = await response.text();
  const payload = text ? safeJson(text) : null;
  if (!response.ok) {
    const message = payload?.msg || payload?.message || payload?.error_description || payload?.error || text;
    const error = new Error(message || `Supabase request failed: ${response.status}`);
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

async function findUserByEmail(env, email) {
  const payload = await supabaseAdminFetch(env, `/auth/v1/admin/users?page=1&per_page=1000`);
  const users = Array.isArray(payload?.users) ? payload.users : Array.isArray(payload) ? payload : [];
  return users.find((user) => String(user.email || "").toLowerCase() === email.toLowerCase()) || null;
}

async function createOrUpdateUser(env, user) {
  const existing = await findUserByEmail(env, user.email);
  if (existing?.id) {
    await supabaseAdminFetch(env, `/auth/v1/admin/users/${encodeURIComponent(existing.id)}`, {
      method: "PUT",
      body: JSON.stringify({
        password: user.password,
        email_confirm: true,
        user_metadata: { name: user.label }
      })
    });
    return { email: user.email, id: existing.id, status: "updated" };
  }

  const created = await supabaseAdminFetch(env, "/auth/v1/admin/users", {
    method: "POST",
    body: JSON.stringify({
      email: user.email,
      password: user.password,
      email_confirm: true,
      user_metadata: { name: user.label }
    })
  });
  return { email: user.email, id: created.id, status: "created" };
}

const dotEnv = await loadDotEnv();
const env = {
  SUPABASE_URL: envValue(dotEnv, "SUPABASE_URL") || envValue(dotEnv, "NEXT_PUBLIC_SUPABASE_URL"),
  SUPABASE_SERVICE_ROLE_KEY: envValue(dotEnv, "SUPABASE_SERVICE_ROLE_KEY")
};

assertEnv(env);

const results = [];
for (const user of DEFAULT_USERS) {
  results.push(await createOrUpdateUser(env, user));
}

console.log("AUTH_USERS_SEEDED");
results.forEach((result) => {
  console.log(`${result.status}: ${result.email} (${result.id})`);
});
console.log("Next: run src/supabase-real-use-bootstrap.sql and src/supabase-owner-admin.sql in Supabase SQL Editor.");
