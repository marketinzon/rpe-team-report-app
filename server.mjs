import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { handleAdminApiRequest } from "./api/admin.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const port = Number(process.env.PORT || 4173);

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg"
};

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

async function loadDotEnvValues() {
  const envPath = path.join(__dirname, ".env");
  const values = {};
  if (!existsSync(envPath)) return values;
  const text = await readFile(envPath, "utf8");
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

function envValue(values, key, fallback = "") {
  return process.env[key] !== undefined ? process.env[key] : values[key] !== undefined ? values[key] : fallback;
}

function booleanEnv(value, fallback) {
  if (value === undefined || value === null || value === "") return fallback;
  return ["1", "true", "yes", "on"].includes(String(value).toLowerCase());
}

async function createRuntimeEnvScript() {
  const values = localDotEnvValues;
  const storageDriver = String(envValue(values, "RPE_STORAGE_DRIVER", "local")).toLowerCase();
  const config = {
    appName: envValue(values, "RPE_APP_NAME", "דוח RPE קבוצתי"),
    environment: envValue(values, "RPE_APP_ENV", "development"),
    appVersion: envValue(values, "RPE_APP_VERSION", "local"),
    storageDriver: storageDriver === "supabase" ? "supabase" : "local",
    seedDemoData: booleanEnv(envValue(values, "RPE_SEED_DEMO_DATA", "true"), true),
    teamId: envValue(values, "RPE_TEAM_ID", "00000000-0000-4000-8000-000000000001"),
    teamName: envValue(values, "RPE_TEAM_NAME", "קבוצת דמו"),
    supabaseUrl: envValue(values, "SUPABASE_URL") || envValue(values, "NEXT_PUBLIC_SUPABASE_URL"),
    supabasePublishableKey:
      envValue(values, "SUPABASE_PUBLISHABLE_KEY") ||
      envValue(values, "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY") ||
      envValue(values, "SUPABASE_ANON_KEY") ||
      envValue(values, "NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    supabaseSchema: envValue(values, "SUPABASE_SCHEMA", "public"),
    supabaseTablePrefix: envValue(values, "SUPABASE_TABLE_PREFIX", "")
  };
  return `window.RPE_ENV_LOADED_AT = ${JSON.stringify(new Date().toISOString())};\nwindow.RPE_ENV = Object.freeze(${JSON.stringify(config, null, 2)});\n`;
}

function resolveRequestPath(requestUrl) {
  const url = new URL(requestUrl, `http://localhost:${port}`);
  const cleanPath = decodeURIComponent(url.pathname).replace(/^\/+/, "");
  const requested = path.resolve(__dirname, cleanPath || "index.html");
  if (!requested.startsWith(__dirname)) return path.join(__dirname, "index.html");
  if (existsSync(requested) && !requested.endsWith(path.sep)) return requested;
  return path.join(__dirname, "index.html");
}

const localDotEnvValues = await loadDotEnvValues();
Object.entries(localDotEnvValues).forEach(([key, value]) => {
  if (process.env[key] === undefined) process.env[key] = value;
});

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url || "/", `http://localhost:${port}`);
    if (url.pathname === "/api/admin") {
      await handleAdminApiRequest(req, res);
      return;
    }
    if (url.pathname === "/assets/env.js") {
      const script = await createRuntimeEnvScript();
      res.writeHead(200, {
        "Content-Type": "text/javascript; charset=utf-8",
        "Cache-Control": "no-store"
      });
      res.end(script);
      return;
    }
    const filePath = resolveRequestPath(req.url || "/");
    const ext = path.extname(filePath);
    const data = await readFile(filePath);
    res.writeHead(200, {
      "Content-Type": contentTypes[ext] || "application/octet-stream",
      "Cache-Control": ext === ".html" ? "no-store" : "public, max-age=3600"
    });
    res.end(data);
  } catch (error) {
    res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("שגיאה בטעינת האפליקציה");
  }
});

server.listen(port);
