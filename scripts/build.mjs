import { existsSync } from "node:fs";
import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __filename = fileURLToPath(import.meta.url);
const rootDir = path.resolve(path.dirname(__filename), "..");
const distDir = path.join(rootDir, "dist");
const spaRoutes = [
  "report",
  "report/pre",
  "report/post",
  "coach",
  "coach/login",
  "coach/admin",
  "coach/analytics",
  "coach/players",
  "coach/reports",
  "coach/gps",
  "coach/calendar",
  "coach/settings",
  "gps",
  "calendar",
  "reports"
];

function parseEnvValue(value) {
  let next = value.trim();
  if (!next) return "";
  const quote = next[0];
  if ((quote === "\"" || quote === "'") && next.endsWith(quote)) {
    next = next.slice(1, -1);
  }
  return next
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\t/g, "\t");
}

async function loadDotEnv() {
  const envPath = path.join(rootDir, ".env");
  if (!existsSync(envPath)) return;

  const text = await readFile(envPath, "utf8");
  text.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) return;

    const key = trimmed.slice(0, separatorIndex).trim();
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) return;
    if (process.env[key] !== undefined) return;

    const rawValue = trimmed.slice(separatorIndex + 1);
    process.env[key] = parseEnvValue(rawValue);
  });
}

function booleanEnv(value, fallback) {
  if (value === undefined || value === null || value === "") return fallback;
  return ["1", "true", "yes", "on"].includes(String(value).toLowerCase());
}

function readPublicConfig() {
  const storageDriver = String(process.env.RPE_STORAGE_DRIVER || "local").toLowerCase();
  const config = {
    appName: process.env.RPE_APP_NAME || "דוח RPE קבוצתי",
    environment: process.env.RPE_APP_ENV || process.env.VERCEL_ENV || "production",
    appVersion: process.env.RPE_APP_VERSION || (process.env.VERCEL_GIT_COMMIT_SHA || "").slice(0, 12) || "local",
    storageDriver: storageDriver === "supabase" ? "supabase" : "local",
    seedDemoData: booleanEnv(process.env.RPE_SEED_DEMO_DATA, true),
    teamId: process.env.RPE_TEAM_ID || "00000000-0000-4000-8000-000000000001",
    teamName: process.env.RPE_TEAM_NAME || "קבוצת דמו",
    supabaseUrl: process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    supabasePublishableKey:
      process.env.SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      "",
    supabaseSchema: process.env.SUPABASE_SCHEMA || "public",
    supabaseTablePrefix: process.env.SUPABASE_TABLE_PREFIX || ""
  };

  if (config.storageDriver === "supabase" && (!config.supabaseUrl || !config.supabasePublishableKey)) {
    throw new Error("RPE_STORAGE_DRIVER=supabase requires SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY.");
  }

  return config;
}

async function writeRuntimeEnv(config) {
  const output = `window.RPE_ENV_LOADED_AT = ${JSON.stringify(new Date().toISOString())};\nwindow.RPE_ENV = Object.freeze(${JSON.stringify(config, null, 2)});\n`;
  await writeFile(path.join(distDir, "assets", "env.js"), output, "utf8");
}

async function writeSpaRouteFiles(indexHtml) {
  await Promise.all(spaRoutes.map(async (route) => {
    const routeDir = path.join(distDir, route);
    await mkdir(routeDir, { recursive: true });
    await writeFile(path.join(routeDir, "index.html"), indexHtml, "utf8");
  }));
}

async function build() {
  await loadDotEnv();
  const config = readPublicConfig();
  await rm(distDir, { recursive: true, force: true });
  await mkdir(distDir, { recursive: true });
  await cp(path.join(rootDir, "assets"), path.join(distDir, "assets"), { recursive: true });

  const indexHtml = await readFile(path.join(rootDir, "index.html"), "utf8");
  await writeFile(path.join(distDir, "index.html"), indexHtml, "utf8");
  await writeSpaRouteFiles(indexHtml);
  await writeRuntimeEnv(config);

  console.log(`Built production app in ${path.relative(rootDir, distDir)}`);
  console.log(`Storage driver: ${config.storageDriver}`);
}

await build();
