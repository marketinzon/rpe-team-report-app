import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __filename = fileURLToPath(import.meta.url);
const rootDir = path.resolve(path.dirname(__filename), "..");
const distDir = path.join(rootDir, "dist");
const port = Number(process.env.RPE_VERIFY_PORT || 4191);
const baseUrl = `http://127.0.0.1:${port}`;

const routes = [
  "/",
  "/report",
  "/report/pre",
  "/report/post",
  "/coach",
  "/coach/analytics",
  "/coach/players",
  "/coach/reports",
  "/coach/player/p2",
  "/coach/gps",
  "/coach/calendar",
  "/coach/sessions",
  "/coach/settings"
];

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8"
};

function resolveRequest(requestUrl) {
  const url = new URL(requestUrl || "/", baseUrl);
  const cleanPath = decodeURIComponent(url.pathname).replace(/^\/+/, "");
  const requested = path.resolve(distDir, cleanPath || "index.html");
  if (requested.startsWith(distDir) && existsSync(requested) && !requested.endsWith(path.sep)) {
    return requested;
  }
  return path.join(distDir, "index.html");
}

const server = createServer(async (req, res) => {
  try {
    const filePath = resolveRequest(req.url);
    const ext = path.extname(filePath);
    const data = await readFile(filePath);
    res.writeHead(200, { "Content-Type": contentTypes[ext] || "application/octet-stream" });
    res.end(data);
  } catch (error) {
    res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("verify server error");
  }
});

if (!existsSync(path.join(distDir, "index.html"))) {
  throw new Error("dist/index.html is missing. Run npm run build first.");
}

await new Promise((resolve) => server.listen(port, "127.0.0.1", resolve));

try {
  for (const route of routes) {
    const response = await fetch(`${baseUrl}${route}`);
    if (!response.ok) throw new Error(`${route} returned ${response.status}`);
    const html = await response.text();
    if (!html.includes('dir="rtl"')) throw new Error(`${route} is missing RTL direction`);
    if (!html.includes('lang="he"')) throw new Error(`${route} is missing Hebrew lang`);
    if (!html.includes("/assets/env.js")) throw new Error(`${route} is missing runtime env script`);
  }

  const envResponse = await fetch(`${baseUrl}/assets/env.js`);
  if (!envResponse.ok) throw new Error("assets/env.js is not served");
  const envScript = await envResponse.text();
  if (!envScript.includes("window.RPE_ENV")) throw new Error("assets/env.js does not define runtime config");

  console.log("ROUTES_OK");
} finally {
  await new Promise((resolve) => server.close(resolve));
}
