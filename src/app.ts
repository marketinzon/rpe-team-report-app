const STORE_KEY = "rpe-team-report-state-v1";
const PLAYER_SESSION_KEY = "rpe-player-session-v2";
const RAW_RPE_ENV = window.RPE_ENV || null;
const STORAGE_DIAGNOSTICS = {
  envLoaded: Boolean(RAW_RPE_ENV),
  storageDriverFromEnv: RAW_RPE_ENV && RAW_RPE_ENV.storageDriver !== undefined ? String(RAW_RPE_ENV.storageDriver) : "לא נטען",
  selectedStorageDriver: "local",
  supabaseUrlPresent: false,
  supabaseKeyPresent: false,
  supabaseClientInitialized: false,
  lastSupabaseError: ""
};
const APP_CONFIG = getRuntimeConfig();
Object.assign(STORAGE_DIAGNOSTICS, {
  selectedStorageDriver: APP_CONFIG.storageDriver,
  supabaseUrlPresent: Boolean(APP_CONFIG.supabaseUrl),
  supabaseKeyPresent: Boolean(APP_CONFIG.supabasePublishableKey)
});
const NO_PAIN = "אין כאב";
const SESSION_TYPES = ["אימון", "משחק", "השלמת נפח", "מנוחה", "פציעה"];
const FULL_SESSION_OPTIONS = ["מלא", "חלקי", "לא"];
const DEFAULT_PAIN_AREAS = [
  "אין כאב",
  "ארבע ראשי",
  "המסטרינג",
  "מקרבים",
  "תאומים",
  "קרסול",
  "ברך",
  "גב תחתון",
  "מפשעה",
  "כתף",
  "אחר"
];

const DEFAULT_PLAYERS = [
  { id: "p1", name: "עומר", active: true, pin: "1111" },
  { id: "p2", name: "אביב", active: true, pin: "2222" },
  { id: "p3", name: "שי", active: true, pin: "3333" },
  { id: "p4", name: "שחר", active: true, pin: "4444" },
  { id: "p5", name: "אלון", active: true, pin: "5555" },
  { id: "p6", name: "יואב", active: true, pin: "6666" },
  { id: "p7", name: "גיא", active: true, pin: "7777" },
  { id: "p8", name: "יגל", active: true, pin: "8888" },
  { id: "p9", name: "בר", active: true, pin: "9999" }
];

const DEFAULT_SETTINGS = {
  rpeHigh: 8,
  fatigueHigh: 4,
  sorenessHigh: 4,
  sleepHoursLow: 6,
  sleepQualityLow: 2,
  weeklyLoadJumpPercent: 25,
  readinessRiskScore: 60
};

const GPS_SESSION_TYPES = ["משחק", "אימון"];
const GPS_PERIODS = ["משחק מלא", "מחצית ראשונה", "מחצית שנייה"];
const GPS_FIELDS = [
  ["date", "תאריך"],
  ["playerName", "שם שחקן"],
  ["position", "עמדה"],
  ["sessionName", "שם משחק / אימון"],
  ["period", "תקופה"],
  ["minutesPlayed", "דקות משחק"],
  ["totalDistance", "מרחק כולל"],
  ["distancePerMinute", "מרחק לדקה"],
  ["intensity", "עצימות"],
  ["gpsLoad", "עומס GPS משוער"],
  ["metabolicActivity", "פעילות מטבולית"],
  ["hmld", "HMLD"],
  ["highSpeedRunning", "ריצה במהירות גבוהה"],
  ["distanceAbove18", "מרחק מעל 18 קמ״ש"],
  ["distanceAbove25", "מרחק מעל 25 קמ״ש"],
  ["maxSpeed", "מהירות מקסימלית"],
  ["workRestRatio", "יחס עבודה/מנוחה"],
  ["accelerations", "האצות מעל 4"],
  ["decelerations", "האטות מעל 4"]
];
const GPS_REQUIRED_FIELDS = ["date", "playerName", "sessionName"];
const GPS_NUMERIC_FIELDS = new Set([
  "minutesPlayed",
  "totalDistance",
  "distancePerMinute",
  "intensity",
  "gpsLoad",
  "metabolicActivity",
  "hmld",
  "highSpeedRunning",
  "distanceAbove18",
  "distanceAbove25",
  "maxSpeed",
  "workRestRatio",
  "accelerations",
  "decelerations"
]);
const GPS_METRICS = [
  ["totalDistance", "מרחק כולל"],
  ["highSpeedRunning", "ריצה במהירות גבוהה"],
  ["distanceAbove25", "מרחק מעל 25 קמ״ש"],
  ["maxSpeed", "מהירות מקסימלית"],
  ["accelerations", "האצות"],
  ["decelerations", "האטות"],
  ["gpsLoad", "עומס GPS"],
  ["distancePerMinute", "מרחק לדקה"],
  ["intensity", "עצימות"]
];
const GPS_COLUMN_ALIASES = {
  date: ["תאריך", "date", "day", "יום"],
  playerName: ["שם שחקן", "שחקן", "שם", "player", "player name", "name"],
  position: ["עמדה", "תפקיד", "position", "pos"],
  sessionName: ["שם משחק", "שם אימון", "משחק", "אימון", "session", "session name", "match", "match name"],
  period: ["תקופה", "מחצית", "period", "half"],
  minutesPlayed: ["דקות", "דקות משחק", "minutes", "mins", "minutes played"],
  totalDistance: ["מרחק כולל", "total distance", "distance", "td"],
  distancePerMinute: ["מרחק לדקה", "distance per minute", "m/min", "m per min"],
  intensity: ["עצימות", "intensity"],
  gpsLoad: ["עומס gps", "עומס משוער", "estimated gps load", "gps load", "load"],
  metabolicActivity: ["פעילות מטבולית", "metabolic activity", "metabolic"],
  hmld: ["hmld", "hml distance", "high metabolic load distance"],
  highSpeedRunning: ["ריצה במהירות גבוהה", "hsr", "high speed running", "high speed distance"],
  distanceAbove18: ["מעל 18", "18", "distance above 18", ">18", "18 km/h"],
  distanceAbove25: ["מעל 25", "25", "distance above 25", ">25", "25 km/h", "sprint distance"],
  maxSpeed: ["מהירות מקסימלית", "מהירות מירבית", "max speed", "maximum speed", "vmax"],
  workRestRatio: ["יחס עבודה מנוחה", "יחס עבודה/מנוחה", "work/rest", "work rest ratio"],
  accelerations: ["האצות", "האצות מעל 4", "accelerations", "acc", "acc >4"],
  decelerations: ["האטות", "האטות מעל 4", "decelerations", "dec", "dec >4"]
};

const numberFormat = new Intl.NumberFormat("he-IL", { maximumFractionDigits: 1 });
const integerFormat = new Intl.NumberFormat("he-IL", { maximumFractionDigits: 0 });

const uiState = {
  dashboardFilters: {
    playerId: "all",
    date: todayIso(),
    weekDate: todayIso(),
    sessionType: "all",
    painArea: "all",
    riskLevel: "all"
  },
  gpsFilters: {
    date: "all",
    sessionId: "all",
    playerId: "all",
    position: "all",
    period: "all",
    metric: "totalDistance"
  },
  gpsImport: null,
  sessionEditId: null
};

const app = document.getElementById("app");
let supabaseStatus = isSupabaseMode() ? "loading" : "local";
let supabaseError = "";
let supabaseFatalError = false;
let supabaseSaveTimer = null;
let supabaseClient = null;
let state = isSupabaseMode() ? createEmptyState() : loadState();
logRuntimeStartup();

window.addEventListener("popstate", render);
document.addEventListener("click", (event) => {
  const link = event.target.closest("a[data-route]");
  if (!link) return;
  const url = new URL(link.href);
  if (url.origin !== window.location.origin) return;
  event.preventDefault();
  navigate(url.pathname);
});

if (isSupabaseMode()) {
  bootstrapSupabaseState();
}
render();

function render() {
  if (!isSupabaseMode()) {
    state = loadState();
  }
  if (isSupabaseMode() && supabaseStatus === "loading") {
    renderLoadingScreen("טוען נתונים מ-Supabase...");
    return;
  }
  if (isSupabaseMode() && supabaseFatalError) {
    renderStorageError();
    return;
  }
  const path = normalizePath(window.location.pathname);
  if (path === "/" || path === "/index.html") {
    navigate("/report", true);
    return;
  }

  if (path === "/report") {
    renderReportPage();
    return;
  }

  if (path === "/report/pre") {
    renderPlayerProtected(renderReadinessForm);
    return;
  }

  if (path === "/report/post") {
    renderPlayerProtected(renderPostReportForm);
    return;
  }

  if (path === "/coach") {
    renderCoachDashboard();
    return;
  }

  if (path === "/coach/players") {
    renderCoachPlayersPage();
    return;
  }

  if (path === "/coach/reports") {
    renderCoachReportsPage();
    return;
  }

  if (path.startsWith("/coach/player/")) {
    renderPlayerProfile(path.split("/").pop() || "");
    return;
  }

  if (path === "/coach/sessions") {
    renderSessionsPage();
    return;
  }

  if (path === "/coach/gps") {
    renderGpsPage();
    return;
  }

  if (path === "/coach/settings") {
    renderSettingsPage();
    return;
  }

  renderNotFound();
}

function normalizePath(path) {
  return path.endsWith("/") && path.length > 1 ? path.slice(0, -1) : path;
}

function navigate(path, replace = false) {
  if (replace) {
    window.history.replaceState({}, "", path);
  } else {
    window.history.pushState({}, "", path);
  }
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function mount(html, bind) {
  app.innerHTML = html;
  if (typeof bind === "function") bind();
}

function renderLoadingScreen(message = "טוען נתונים...") {
  mount(`
    <main class="loading-screen">
      ${renderStorageStatus()}
      <h1>${escapeHtml(APP_CONFIG.appName)}</h1>
      <p>${escapeHtml(message)}</p>
    </main>
  `);
}

function renderStorageError() {
  mount(`
    <main class="not-found">
      <div class="surface form-panel">
        ${renderStorageStatus()}
        <h1>שגיאת חיבור ל-Supabase</h1>
        <p>${escapeHtml(supabaseError || "לא ניתן לטעון נתונים כרגע.")}</p>
        <button id="retrySupabase" class="btn primary" type="button">נסה שוב</button>
      </div>
    </main>
  `, () => {
    document.getElementById("retrySupabase").addEventListener("click", bootstrapSupabaseState);
  });
}

function renderStorageStatus() {
  const status = getStorageStatus();
  return `
    <div class="storage-status ${status.tone}" title="${escapeAttr(status.detail)}">
      <span class="status-dot ${status.dot}"></span>
      <span>${escapeHtml(status.label)}</span>
    </div>
  `;
}

function getStorageStatus() {
  if (!isSupabaseMode()) {
    return {
      label: "Local fallback",
      detail: STORAGE_DIAGNOSTICS.envLoaded
        ? "מצב דמו: RPE_STORAGE_DRIVER אינו supabase ולכן הנתונים נשמרים בדפדפן המקומי בלבד"
        : "env.js לא נטען, לכן האפליקציה במצב local fallback",
      tone: "neutral",
      dot: "yellow"
    };
  }
  if (supabaseStatus === "connected") {
    return {
      label: "Supabase connected",
      detail: `מחובר ל-Supabase · Team ${APP_CONFIG.teamId}`,
      tone: "green",
      dot: "green"
    };
  }
  if (supabaseStatus === "loading") {
    return {
      label: "Supabase connecting",
      detail: "טוען נתונים מ-Supabase",
      tone: "yellow",
      dot: "yellow"
    };
  }
  return {
    label: "Supabase error",
    detail: supabaseError || "שגיאת קריאה/שמירה מול Supabase",
    tone: "red",
    dot: "red"
  };
}

function refreshStorageStatus() {
  document.querySelectorAll(".storage-status").forEach((node) => {
    const wrapper = document.createElement("div");
    wrapper.innerHTML = renderStorageStatus().trim();
    node.replaceWith(wrapper.firstElementChild);
  });
}

function showStorageWarning(message) {
  let warning = document.getElementById("storageWarning");
  if (!warning) {
    warning = document.createElement("div");
    warning.id = "storageWarning";
    warning.className = "storage-warning";
    warning.setAttribute("role", "alert");
    document.body.appendChild(warning);
  }
  warning.textContent = message;
  refreshStorageStatus();
}

function clearStorageWarning() {
  const warning = document.getElementById("storageWarning");
  if (warning) warning.remove();
  refreshStorageStatus();
}

function renderStorageDiagnosticsPanel() {
  return `
    <section class="section surface storage-diagnostics-panel">
      <div class="section-title">
        <h3>אבחון אחסון</h3>
        ${renderStorageStatus()}
      </div>
      <div class="diagnostic-grid">
        ${diagnosticItem("env.js נטען", yesNo(STORAGE_DIAGNOSTICS.envLoaded), STORAGE_DIAGNOSTICS.envLoaded ? "green" : "red")}
        ${diagnosticItem("storage driver מה-env", STORAGE_DIAGNOSTICS.storageDriverFromEnv || "לא נטען", STORAGE_DIAGNOSTICS.selectedStorageDriver === "supabase" ? "green" : "yellow")}
        ${diagnosticItem("storage driver פעיל", STORAGE_DIAGNOSTICS.selectedStorageDriver, STORAGE_DIAGNOSTICS.selectedStorageDriver === "supabase" ? "green" : "yellow")}
        ${diagnosticItem("Supabase URL קיים", yesNo(STORAGE_DIAGNOSTICS.supabaseUrlPresent), STORAGE_DIAGNOSTICS.supabaseUrlPresent ? "green" : "red")}
        ${diagnosticItem("Supabase key קיים", yesNo(STORAGE_DIAGNOSTICS.supabaseKeyPresent), STORAGE_DIAGNOSTICS.supabaseKeyPresent ? "green" : "red")}
        ${diagnosticItem("Supabase client initialized", yesNo(STORAGE_DIAGNOSTICS.supabaseClientInitialized), STORAGE_DIAGNOSTICS.supabaseClientInitialized ? "green" : "yellow")}
        ${diagnosticItem("שגיאת Supabase אחרונה", STORAGE_DIAGNOSTICS.lastSupabaseError || "אין", STORAGE_DIAGNOSTICS.lastSupabaseError ? "red" : "green")}
      </div>
      <div class="actions">
        <button id="testSupabaseConnection" class="btn secondary" type="button">Test Supabase Connection</button>
        <span id="supabaseTestResult" class="diagnostic-result"></span>
      </div>
    </section>
  `;
}

function diagnosticItem(label, value, tone = "neutral") {
  return `
    <div class="diagnostic-item ${tone}">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
    </div>
  `;
}

function yesNo(value) {
  return value ? "כן" : "לא";
}

function updateStorageDiagnosticsError(message) {
  STORAGE_DIAGNOSTICS.lastSupabaseError = message || "";
  supabaseError = STORAGE_DIAGNOSTICS.lastSupabaseError;
}

function getRuntimeConfig() {
  const env = RAW_RPE_ENV || {};
  const storageDriver = String(env.storageDriver || "local").toLowerCase() === "supabase" ? "supabase" : "local";
  return {
    appName: String(env.appName || "דוח RPE קבוצתי"),
    environment: String(env.environment || "development"),
    appVersion: String(env.appVersion || "local"),
    storageDriver,
    seedDemoData: env.seedDemoData !== false,
    teamId: String(env.teamId || "00000000-0000-4000-8000-000000000001"),
    teamName: String(env.teamName || "קבוצת דמו"),
    supabaseUrl: String(env.supabaseUrl || ""),
    supabasePublishableKey: String(env.supabasePublishableKey || ""),
    supabaseSchema: String(env.supabaseSchema || "public"),
    supabaseTablePrefix: String(env.supabaseTablePrefix || "")
  };
}

function isSupabaseMode() {
  return APP_CONFIG.storageDriver === "supabase";
}

function logRuntimeStartup() {
  console.info("[RPE Runtime] env loaded", {
    envLoaded: STORAGE_DIAGNOSTICS.envLoaded,
    envKeys: RAW_RPE_ENV ? Object.keys(RAW_RPE_ENV).sort() : []
  });
  console.info("[RPE Runtime] selected storage driver", {
    fromEnv: STORAGE_DIAGNOSTICS.storageDriverFromEnv,
    selected: STORAGE_DIAGNOSTICS.selectedStorageDriver,
    supabaseUrlPresent: STORAGE_DIAGNOSTICS.supabaseUrlPresent,
    supabaseKeyPresent: STORAGE_DIAGNOSTICS.supabaseKeyPresent,
    teamId: APP_CONFIG.teamId
  });
}

function createSupabaseRestClient() {
  ensureSupabaseConfig();
  const baseUrl = APP_CONFIG.supabaseUrl.replace(/\/$/, "");
  console.info("[RPE Runtime] Supabase client creation", {
    baseUrlPresent: Boolean(baseUrl),
    publishableKeyPresent: Boolean(APP_CONFIG.supabasePublishableKey),
    teamId: APP_CONFIG.teamId
  });
  STORAGE_DIAGNOSTICS.supabaseClientInitialized = true;
  return {
    async request(path, options = {}) {
      const method = options.method || "GET";
      const headers = {
        apikey: APP_CONFIG.supabasePublishableKey,
        Authorization: `Bearer ${APP_CONFIG.supabasePublishableKey}`,
        ...options.headers
      };
      const response = await fetch(`${baseUrl}/rest/v1/${path}`, { ...options, headers });
      const text = await response.text();
      if (!response.ok) {
        console.error("[RPE Supabase] Request failed", {
          method,
          path,
          status: response.status,
          statusText: response.statusText,
          response: text
        });
        throw new Error(text || `Supabase request failed: ${response.status}`);
      }
      if (response.status === 204 || !text) return [];
      return JSON.parse(text);
    }
  };
}

function ensureSupabaseClient() {
  if (!supabaseClient) {
    supabaseClient = createSupabaseRestClient();
  }
  return supabaseClient;
}

function createInitialState() {
  return APP_CONFIG.seedDemoData ? createDemoState() : createEmptyState();
}

function createEmptyState() {
  return {
    schemaVersion: 2,
    seededAt: new Date().toISOString(),
    players: [],
    painAreas: [...DEFAULT_PAIN_AREAS],
    settings: { ...DEFAULT_SETTINGS },
    readinessReports: [],
    reports: [],
    sessions: [],
    gpsSessions: [],
    gpsRecords: []
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) {
      const seeded = createInitialState();
      localStorage.setItem(STORE_KEY, JSON.stringify(seeded));
      return seeded;
    }
    const parsed = JSON.parse(raw);
    const normalized = normalizeState(parsed);
    if (JSON.stringify(parsed) !== JSON.stringify(normalized)) {
      localStorage.setItem(STORE_KEY, JSON.stringify(normalized));
    }
    return normalized;
  } catch (error) {
    const seeded = createInitialState();
    localStorage.setItem(STORE_KEY, JSON.stringify(seeded));
    return seeded;
  }
}

function normalizeState(data) {
  const defaultPinById = new Map(DEFAULT_PLAYERS.map((player) => [player.id, player.pin]));
  const fallbackPlayers = APP_CONFIG.seedDemoData ? DEFAULT_PLAYERS : [];
  const sourcePlayers = Array.isArray(data.players) ? data.players : fallbackPlayers;
  const players = sourcePlayers.map((player, index) => ({
    id: player.id || createId("p"),
    name: player.name || `שחקן ${index + 1}`,
    active: player.active !== false,
    pin: normalizePin(player.pin || defaultPinById.get(player.id) || "1234")
  }));

  const reports = Array.isArray(data.reports) ? data.reports.map((report) => ({
    ...report,
    completedFullSession: report.completedFullSession || "מלא",
    fatigue: Number(report.fatigue ?? report.fatigueAfterTraining ?? 0),
    soreness: Number(report.soreness ?? report.sorenessAfterTraining ?? 0),
    painArea: report.painArea || NO_PAIN,
    bodyWeightAfter: report.bodyWeightAfter === undefined || report.bodyWeightAfter === "" ? null : Number(report.bodyWeightAfter),
    comments: report.comments || ""
  })) : [];

  return {
    schemaVersion: 2,
    seededAt: data.seededAt || new Date().toISOString(),
    players,
    painAreas: Array.isArray(data.painAreas) && data.painAreas.length ? data.painAreas : [...DEFAULT_PAIN_AREAS],
    settings: { ...DEFAULT_SETTINGS, ...(data.settings || {}) },
    readinessReports: Array.isArray(data.readinessReports) ? data.readinessReports : [],
    reports,
    sessions: Array.isArray(data.sessions) ? data.sessions : [],
    gpsSessions: Array.isArray(data.gpsSessions) ? data.gpsSessions : [],
    gpsRecords: Array.isArray(data.gpsRecords) ? data.gpsRecords : []
  };
}

function saveState() {
  if (isSupabaseMode()) {
    queueSupabaseSave();
    return;
  }
  localStorage.setItem(STORE_KEY, JSON.stringify(state));
}

function resetDemoState() {
  state = createDemoState();
  saveState();
  localStorage.removeItem(PLAYER_SESSION_KEY);
  render();
}

async function bootstrapSupabaseState() {
  supabaseStatus = "loading";
  supabaseError = "";
  supabaseFatalError = false;
  renderLoadingScreen("טוען נתונים מ-Supabase...");
  try {
    state = await loadSupabaseState();
    supabaseStatus = "connected";
    updateStorageDiagnosticsError("");
    clearStorageWarning();
    render();
  } catch (error) {
    logSupabaseError("initial-load", error);
    supabaseStatus = "error";
    supabaseFatalError = true;
    updateStorageDiagnosticsError(error.message || "שגיאת טעינת נתונים");
    render();
  }
}

function queueSupabaseSave() {
  if (supabaseSaveTimer) window.clearTimeout(supabaseSaveTimer);
  supabaseSaveTimer = window.setTimeout(async () => {
    try {
      await saveSupabaseState(state);
      supabaseStatus = "connected";
      updateStorageDiagnosticsError("");
      clearStorageWarning();
    } catch (error) {
      logSupabaseError("save-state", error);
      supabaseStatus = "error";
      updateStorageDiagnosticsError(error.message || "שגיאת שמירה ל-Supabase");
      showStorageWarning(`שגיאת שמירה ל-Supabase: ${supabaseError}. הנתונים נשמרו במסך הנוכחי אך לא נשמרו בענן.`);
    }
  }, 250);
}

async function loadSupabaseState() {
  ensureSupabaseConfig();
  const teamId = APP_CONFIG.teamId;
  console.info("[RPE Runtime] first test query to teams", { teamId });
  const teamRows = await supabaseSelect("teams", `id=eq.${encodeURIComponent(teamId)}&select=*`);
  console.info("[RPE Runtime] first test query to teams completed", { rows: teamRows.length });
  const [players, painRows, settingsRows, sessions, readinessReports, reports, gpsSessions, gpsRecords] = await Promise.all([
    supabaseSelect("players", `team_id=eq.${encodeURIComponent(teamId)}&select=*&order=name.asc`),
    supabaseSelect("pain_areas", `team_id=eq.${encodeURIComponent(teamId)}&select=*&order=sort_order.asc`),
    supabaseSelect("settings", `team_id=eq.${encodeURIComponent(teamId)}&select=*`),
    supabaseSelect("sessions", `team_id=eq.${encodeURIComponent(teamId)}&select=*&order=session_date.desc`),
    supabaseSelect("readiness_reports", `team_id=eq.${encodeURIComponent(teamId)}&select=*&order=report_date.desc`),
    supabaseSelect("rpe_reports", `team_id=eq.${encodeURIComponent(teamId)}&select=*&order=report_date.desc`),
    supabaseSelect("gps_sessions", `team_id=eq.${encodeURIComponent(teamId)}&select=*&order=session_date.desc`),
    supabaseSelect("gps_records", `team_id=eq.${encodeURIComponent(teamId)}&select=*`)
  ]);

  const shouldSeedDemo = APP_CONFIG.seedDemoData && (!teamRows.length || !players.length);
  console.info("[RPE Runtime] seed attempt", {
    seedDemoData: APP_CONFIG.seedDemoData,
    shouldSeedDemo,
    teamRows: teamRows.length,
    playerRows: players.length
  });
  if (shouldSeedDemo) {
    const initial = createInitialState();
    await saveSupabaseState(initial);
    console.info("[RPE Supabase] Demo data seeded into Supabase", {
      teamId,
      players: initial.players.length,
      readinessReports: initial.readinessReports.length,
      rpeReports: initial.reports.length,
      gpsRecords: initial.gpsRecords.length
    });
    return initial;
  }

  return normalizeState({
    schemaVersion: 3,
    seededAt: teamRows[0].created_at || new Date().toISOString(),
    players: players.map(fromSupabasePlayer),
    painAreas: painRows.length ? painRows.map((row) => row.name) : [...DEFAULT_PAIN_AREAS],
    settings: settingsRows.length ? fromSupabaseSettings(settingsRows[0]) : { ...DEFAULT_SETTINGS },
    readinessReports: readinessReports.map(fromSupabaseReadinessReport),
    reports: reports.map(fromSupabaseRpeReport),
    sessions: sessions.map(fromSupabaseSession),
    gpsSessions: gpsSessions.map(fromSupabaseGpsSession),
    gpsRecords: gpsRecords.map(fromSupabaseGpsRecord)
  });
}

async function saveSupabaseState(nextState) {
  ensureSupabaseConfig();
  const teamId = APP_CONFIG.teamId;
  await supabaseUpsert("teams", [{
    id: teamId,
    name: APP_CONFIG.teamName,
    slug: slugify(APP_CONFIG.teamName),
    active: true
  }], "id");

  await Promise.all([
    supabaseUpsert("players", nextState.players.map(toSupabasePlayer), "team_id,id"),
    supabaseUpsert("pain_areas", nextState.painAreas.map((name, index) => ({
      team_id: teamId,
      name,
      sort_order: index,
      active: true
    })), "team_id,name"),
    supabaseUpsert("settings", [toSupabaseSettings(nextState.settings)], "team_id"),
    supabaseUpsert("sessions", nextState.sessions.map(toSupabaseSession), "team_id,id"),
    supabaseUpsert("readiness_reports", nextState.readinessReports.map(toSupabaseReadinessReport), "team_id,id"),
    supabaseUpsert("rpe_reports", nextState.reports.map(toSupabaseRpeReport), "team_id,id"),
    supabaseUpsert("gps_sessions", nextState.gpsSessions.map(toSupabaseGpsSession), "team_id,id"),
    supabaseUpsert("gps_records", nextState.gpsRecords.map(toSupabaseGpsRecord), "team_id,id")
  ]);

  await Promise.all([
    supabaseDeleteMissing("players", "id", nextState.players.map((item) => item.id)),
    supabaseDeleteMissing("sessions", "id", nextState.sessions.map((item) => item.id)),
    supabaseDeleteMissing("readiness_reports", "id", nextState.readinessReports.map((item) => item.id)),
    supabaseDeleteMissing("rpe_reports", "id", nextState.reports.map((item) => item.id)),
    supabaseDeleteMissing("gps_sessions", "id", nextState.gpsSessions.map((item) => item.id)),
    supabaseDeleteMissing("gps_records", "id", nextState.gpsRecords.map((item) => item.id))
  ]);
}

function ensureSupabaseConfig() {
  if (!APP_CONFIG.supabaseUrl || !APP_CONFIG.supabasePublishableKey) {
    const message = "חסרים SUPABASE_URL או SUPABASE_PUBLISHABLE_KEY.";
    updateStorageDiagnosticsError(message);
    throw new Error(message);
  }
}

async function supabaseSelect(table, query) {
  return supabaseRequest(`${APP_CONFIG.supabaseTablePrefix}${table}?${query}`, { method: "GET" });
}

async function supabaseUpsert(table, rows, onConflict) {
  if (!rows.length) return [];
  return supabaseRequest(`${APP_CONFIG.supabaseTablePrefix}${table}?on_conflict=${encodeURIComponent(onConflict)}`, {
    method: "POST",
    headers: {
      Prefer: "resolution=merge-duplicates,return=minimal",
      "Content-Type": "application/json"
    },
    body: JSON.stringify(rows)
  });
}

async function supabaseDeleteMissing(table, column, values) {
  const teamFilter = `team_id=eq.${encodeURIComponent(APP_CONFIG.teamId)}`;
  const uniqueValues = unique(values.filter(Boolean));
  const missingFilter = uniqueValues.length
    ? `&${column}=not.in.(${uniqueValues.map((value) => encodeURIComponent(String(value))).join(",")})`
    : "";
  return supabaseRequest(`${APP_CONFIG.supabaseTablePrefix}${table}?${teamFilter}${missingFilter}`, {
    method: "DELETE",
    headers: {
      Prefer: "return=minimal"
    }
  });
}

async function supabaseRequest(path, options = {}) {
  const method = options.method || "GET";
  const client = ensureSupabaseClient();
  try {
    return await client.request(path, options);
  } catch (error) {
    updateStorageDiagnosticsError(error.message || String(error));
    if (!String(error.message || "").includes("Supabase request failed")) {
      console.error("[RPE Supabase] Network or parsing error", {
        method,
        path,
        message: error.message || String(error)
      });
    }
    throw error;
  }
}

function logSupabaseError(context, error) {
  console.error(`[RPE Supabase] ${context} error`, {
    storageDriver: APP_CONFIG.storageDriver,
    teamId: APP_CONFIG.teamId,
    message: error.message || String(error),
    error
  });
}

async function testSupabaseConnection() {
  console.info("[RPE Runtime] manual Supabase connection test", {
    selectedStorageDriver: APP_CONFIG.storageDriver,
    teamId: APP_CONFIG.teamId
  });
  if (!isSupabaseMode()) {
    const message = "האפליקציה במצב Local fallback. בדוק ש-env.js נטען וש-RPE_STORAGE_DRIVER=supabase.";
    updateStorageDiagnosticsError(message);
    return { ok: false, message };
  }
  try {
    const rows = await supabaseSelect("teams", `id=eq.${encodeURIComponent(APP_CONFIG.teamId)}&select=id,name`);
    supabaseStatus = "connected";
    updateStorageDiagnosticsError("");
    clearStorageWarning();
    return { ok: true, message: `חיבור תקין. נמצאו ${rows.length} שורות בטבלת teams עבור הקבוצה.` };
  } catch (error) {
    supabaseStatus = "error";
    updateStorageDiagnosticsError(error.message || String(error));
    logSupabaseError("manual-test", error);
    showStorageWarning(`בדיקת Supabase נכשלה: ${STORAGE_DIAGNOSTICS.lastSupabaseError}`);
    return { ok: false, message: `בדיקה נכשלה: ${STORAGE_DIAGNOSTICS.lastSupabaseError}` };
  } finally {
    refreshStorageStatus();
  }
}

function toSupabasePlayer(player) {
  return {
    id: player.id,
    team_id: APP_CONFIG.teamId,
    name: player.name,
    active: player.active !== false,
    pin_code: normalizePin(player.pin || "1234"),
    position: getPlayerPrimaryPosition(player.id) || null
  };
}

function fromSupabasePlayer(row) {
  return {
    id: row.id,
    name: row.name,
    active: row.active !== false,
    pin: normalizePin(row.pin_code || "1234")
  };
}

function toSupabaseSettings(settings) {
  return {
    team_id: APP_CONFIG.teamId,
    rpe_high: settings.rpeHigh,
    fatigue_high: settings.fatigueHigh,
    soreness_high: settings.sorenessHigh,
    sleep_hours_low: settings.sleepHoursLow,
    sleep_quality_low: settings.sleepQualityLow,
    weekly_load_jump_percent: settings.weeklyLoadJumpPercent,
    readiness_risk_score: settings.readinessRiskScore
  };
}

function fromSupabaseSettings(row) {
  return {
    rpeHigh: Number(row.rpe_high ?? DEFAULT_SETTINGS.rpeHigh),
    fatigueHigh: Number(row.fatigue_high ?? DEFAULT_SETTINGS.fatigueHigh),
    sorenessHigh: Number(row.soreness_high ?? DEFAULT_SETTINGS.sorenessHigh),
    sleepHoursLow: Number(row.sleep_hours_low ?? DEFAULT_SETTINGS.sleepHoursLow),
    sleepQualityLow: Number(row.sleep_quality_low ?? DEFAULT_SETTINGS.sleepQualityLow),
    weeklyLoadJumpPercent: Number(row.weekly_load_jump_percent ?? DEFAULT_SETTINGS.weeklyLoadJumpPercent),
    readinessRiskScore: Number(row.readiness_risk_score ?? DEFAULT_SETTINGS.readinessRiskScore)
  };
}

function toSupabaseSession(sessionItem) {
  return {
    id: sessionItem.id,
    team_id: APP_CONFIG.teamId,
    session_date: sessionItem.date,
    session_type: sessionItem.sessionType,
    default_minutes: Number(sessionItem.defaultMinutes) || 0,
    notes: sessionItem.notes || "",
    player_minutes: sessionItem.playerMinutes || {}
  };
}

function fromSupabaseSession(row) {
  return {
    id: row.id,
    date: row.session_date,
    sessionType: row.session_type,
    defaultMinutes: Number(row.default_minutes) || 0,
    notes: row.notes || "",
    playerMinutes: row.player_minutes || {}
  };
}

function toSupabaseReadinessReport(report) {
  return {
    id: report.id,
    team_id: APP_CONFIG.teamId,
    player_id: report.playerId,
    player_name: report.playerName,
    created_at: report.createdAt,
    report_date: report.date,
    sleep_hours: Number(report.sleepHours) || 0,
    sleep_quality: Number(report.sleepQuality) || 0,
    energy: Number(report.energy) || 0,
    mood: Number(report.mood) || 0,
    soreness: Number(report.soreness) || 0,
    pain_area: report.painArea || NO_PAIN,
    load_feeling: Number(report.loadFeeling) || 0,
    body_weight: report.bodyWeight,
    medical_limitation: Boolean(report.medicalLimitation),
    comments: report.comments || ""
  };
}

function fromSupabaseReadinessReport(row) {
  return {
    id: row.id,
    playerId: row.player_id,
    playerName: row.player_name,
    createdAt: row.created_at,
    date: row.report_date,
    sleepHours: Number(row.sleep_hours) || 0,
    sleepQuality: Number(row.sleep_quality) || 0,
    energy: Number(row.energy) || 0,
    mood: Number(row.mood) || 0,
    soreness: Number(row.soreness) || 0,
    painArea: row.pain_area || NO_PAIN,
    loadFeeling: Number(row.load_feeling) || 0,
    bodyWeight: row.body_weight === null ? null : Number(row.body_weight),
    medicalLimitation: Boolean(row.medical_limitation),
    comments: row.comments || ""
  };
}

function toSupabaseRpeReport(report) {
  return {
    id: report.id,
    team_id: APP_CONFIG.teamId,
    player_id: report.playerId,
    player_name: report.playerName,
    created_at: report.createdAt,
    report_date: report.date,
    session_type: report.sessionType,
    rpe: Number(report.rpe) || 0,
    fatigue: Number(report.fatigue) || 0,
    soreness: Number(report.soreness) || 0,
    pain_area: report.painArea || NO_PAIN,
    completed_full_session: report.completedFullSession || "מלא",
    body_weight_after: report.bodyWeightAfter,
    comments: report.comments || ""
  };
}

function fromSupabaseRpeReport(row) {
  return {
    id: row.id,
    playerId: row.player_id,
    playerName: row.player_name,
    createdAt: row.created_at,
    date: row.report_date,
    sessionType: row.session_type,
    rpe: Number(row.rpe) || 0,
    fatigue: Number(row.fatigue) || 0,
    soreness: Number(row.soreness) || 0,
    painArea: row.pain_area || NO_PAIN,
    completedFullSession: row.completed_full_session || "מלא",
    bodyWeightAfter: row.body_weight_after === null ? null : Number(row.body_weight_after),
    comments: row.comments || ""
  };
}

function toSupabaseGpsSession(sessionItem) {
  return {
    id: sessionItem.id,
    team_id: APP_CONFIG.teamId,
    session_date: sessionItem.date,
    session_name: sessionItem.sessionName,
    type: sessionItem.type,
    opponent: sessionItem.opponent || null,
    notes: sessionItem.notes || ""
  };
}

function fromSupabaseGpsSession(row) {
  return {
    id: row.id,
    date: row.session_date,
    sessionName: row.session_name,
    type: row.type,
    opponent: row.opponent || "",
    notes: row.notes || ""
  };
}

function toSupabaseGpsRecord(record) {
  return {
    id: record.id,
    team_id: APP_CONFIG.teamId,
    gps_session_id: record.gpsSessionId,
    player_id: record.playerId,
    player_name: record.playerName,
    position: record.position || "",
    period: record.period,
    minutes_played: Number(record.minutesPlayed) || 0,
    total_distance: Number(record.totalDistance) || 0,
    distance_per_minute: Number(record.distancePerMinute) || 0,
    intensity: Number(record.intensity) || 0,
    gps_load: Number(record.gpsLoad) || 0,
    metabolic_activity: Number(record.metabolicActivity) || 0,
    hmld: Number(record.hmld) || 0,
    high_speed_running: Number(record.highSpeedRunning) || 0,
    distance_above_18: Number(record.distanceAbove18) || 0,
    distance_above_25: Number(record.distanceAbove25) || 0,
    max_speed: Number(record.maxSpeed) || 0,
    work_rest_ratio: Number(record.workRestRatio) || 0,
    accelerations: Number(record.accelerations) || 0,
    decelerations: Number(record.decelerations) || 0
  };
}

function fromSupabaseGpsRecord(row) {
  return {
    id: row.id,
    gpsSessionId: row.gps_session_id,
    playerId: row.player_id,
    playerName: row.player_name,
    position: row.position || "",
    period: row.period,
    minutesPlayed: Number(row.minutes_played) || 0,
    totalDistance: Number(row.total_distance) || 0,
    distancePerMinute: Number(row.distance_per_minute) || 0,
    intensity: Number(row.intensity) || 0,
    gpsLoad: Number(row.gps_load) || 0,
    metabolicActivity: Number(row.metabolic_activity) || 0,
    hmld: Number(row.hmld) || 0,
    highSpeedRunning: Number(row.high_speed_running) || 0,
    distanceAbove18: Number(row.distance_above_18) || 0,
    distanceAbove25: Number(row.distance_above_25) || 0,
    maxSpeed: Number(row.max_speed) || 0,
    workRestRatio: Number(row.work_rest_ratio) || 0,
    accelerations: Number(row.accelerations) || 0,
    decelerations: Number(row.decelerations) || 0
  };
}

function slugify(value) {
  return String(value || "team")
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "") || "team";
}

function createDemoState() {
  const base = todayIso();
  const players = DEFAULT_PLAYERS.map((player) => ({ ...player }));
  const sessions = [
    session("s-today", 0, "אימון", 75, "אימון טקטי ועבודה בקצב גבוה", {
      p1: 80,
      p2: 70,
      p3: 75,
      p4: 75,
      p5: 45,
      p6: 60,
      p7: 75,
      p8: 0,
      p9: 75
    }),
    session("s-yesterday", -1, "השלמת נפח", 55, "השלמת נפח לשחקני סגל", {
      p1: 35,
      p2: 55,
      p3: 45,
      p4: 55,
      p5: 35,
      p6: 30,
      p7: 55,
      p8: 25,
      p9: 55
    }),
    session("s-game", -3, "משחק", 90, "משחק ליגה", {
      p1: 35,
      p2: 90,
      p3: 30,
      p4: 60,
      p5: 45,
      p6: 30,
      p7: 15,
      p8: 0,
      p9: 90
    }),
    session("s-rest", -4, "מנוחה", 0, "יום מנוחה", {}),
    session("s-train-5", -5, "אימון", 60, "אימון כוח וטכניקה", {
      p1: 35,
      p2: 60,
      p3: 60,
      p4: 60,
      p5: 45,
      p6: 35,
      p7: 60,
      p8: 25,
      p9: 60
    }),
    session("s-prev", -8, "משחק", 70, "משחק אימון", {
      p1: 30,
      p2: 70,
      p3: 45,
      p4: 60,
      p5: 40,
      p6: 25,
      p7: 40,
      p8: 0,
      p9: 70
    })
  ];

  const readinessSpecs = [
    readinessSpec(0, "p1", 5.5, 2, 2, 3, 4, "המסטרינג", 4, 72.4, true, "מרגיש מוגבל בספרינטים"),
    readinessSpec(0, "p2", 7.5, 4, 4, 4, 2, NO_PAIN, 2, 68.2, false, "מרגיש טוב"),
    readinessSpec(0, "p3", 5, 3, 3, 4, 2, NO_PAIN, 3, 74.1, false, "שינה קצרה"),
    readinessSpec(0, "p4", 6.2, 3, 3, 3, 4, "המסטרינג", 3, 70.8, false, "רגישות חוזרת מאחורי הירך"),
    readinessSpec(0, "p5", 7, 4, 3, 3, 2, NO_PAIN, 2, null, false, ""),
    readinessSpec(0, "p6", 5, 2, 2, 2, 3, "גב תחתון", 5, 76.5, false, "עייפות גבוהה מהבוקר"),
    readinessSpec(0, "p7", 7.8, 4, 4, 4, 1, NO_PAIN, 2, 69.6, false, ""),

    readinessSpec(-1, "p1", 6, 3, 3, 3, 3, "המסטרינג", 3, 72.5, false, ""),
    readinessSpec(-1, "p2", 8, 5, 4, 4, 1, NO_PAIN, 1, 68.1, false, ""),
    readinessSpec(-1, "p4", 6.4, 3, 3, 3, 4, "המסטרינג", 3, 70.7, false, ""),
    readinessSpec(-1, "p6", 5.5, 2, 2, 3, 2, "גב תחתון", 4, 76.2, false, ""),
    readinessSpec(-3, "p2", 6.5, 3, 3, 3, 2, NO_PAIN, 3, 68.2, false, ""),
    readinessSpec(-3, "p4", 6, 3, 3, 3, 3, "מפשעה", 3, 70.9, false, ""),
    readinessSpec(-5, "p6", 7, 4, 4, 4, 1, NO_PAIN, 2, 76.1, false, "")
  ];

  const postSpecs = [
    postSpec(0, "p1", "אימון", 9, 4, 4, "המסטרינג", "חלקי", 70.8, "הפסקתי מוקדם בגלל כאב"),
    postSpec(0, "p2", "אימון", 6, 2, 2, NO_PAIN, "מלא", 67.9, "אימון טוב"),
    postSpec(0, "p3", "אימון", 7, 3, 2, NO_PAIN, "מלא", 73.0, ""),
    postSpec(0, "p4", "אימון", 7, 3, 4, "המסטרינג", "מלא", 69.9, "רגישות אחרי ספרינטים"),
    postSpec(0, "p6", "אימון", 8, 5, 3, "גב תחתון", "חלקי", 74.7, "עייפות גבוהה"),
    postSpec(0, "p7", "אימון", 5, 2, 1, NO_PAIN, "מלא", 69.3, ""),

    postSpec(-1, "p1", "השלמת נפח", 7, 3, 3, "המסטרינג", "חלקי", 71.7, ""),
    postSpec(-1, "p2", "השלמת נפח", 5, 2, 1, NO_PAIN, "מלא", 67.8, ""),
    postSpec(-1, "p3", "השלמת נפח", 6, 2, 2, NO_PAIN, "מלא", null, ""),
    postSpec(-1, "p4", "השלמת נפח", 6, 3, 4, "המסטרינג", "מלא", 69.9, ""),
    postSpec(-1, "p5", "השלמת נפח", 4, 2, 2, NO_PAIN, "חלקי", null, ""),
    postSpec(-1, "p6", "השלמת נפח", 7, 4, 3, "גב תחתון", "חלקי", 75.1, ""),
    postSpec(-1, "p9", "השלמת נפח", 6, 3, 2, "תאומים", "מלא", null, ""),

    postSpec(-3, "p1", "משחק", 6, 3, 2, NO_PAIN, "חלקי", null, ""),
    postSpec(-3, "p2", "משחק", 8, 4, 3, NO_PAIN, "מלא", 67.2, "משחק מלא"),
    postSpec(-3, "p4", "משחק", 7, 3, 3, "מפשעה", "חלקי", 69.8, ""),
    postSpec(-3, "p9", "משחק", 8, 4, 3, "תאומים", "מלא", null, ""),
    postSpec(-5, "p2", "אימון", 6, 3, 2, NO_PAIN, "מלא", ""),
    postSpec(-5, "p4", "אימון", 6, 3, 3, "המסטרינג", "מלא", ""),
    postSpec(-5, "p6", "אימון", 4, 2, 2, NO_PAIN, "חלקי", ""),
    postSpec(-8, "p2", "משחק", 7, 3, 3, NO_PAIN, "מלא", ""),
    postSpec(-8, "p4", "משחק", 6, 3, 3, "מפשעה", "חלקי", ""),
    postSpec(-8, "p6", "משחק", 4, 2, 1, NO_PAIN, "חלקי", "")
  ];
  const gpsDemo = createDemoGpsData(players, base);

  return {
    schemaVersion: 2,
    seededAt: new Date().toISOString(),
    players,
    painAreas: [...DEFAULT_PAIN_AREAS],
    settings: { ...DEFAULT_SETTINGS },
    readinessReports: readinessSpecs.map((spec, index) => buildReadinessReport(spec, index, players, base)),
    reports: postSpecs.map((spec, index) => buildPostReport(spec, index, players, base)),
    sessions,
    gpsSessions: gpsDemo.sessions,
    gpsRecords: gpsDemo.records
  };
}

function createDemoGpsData(players, base) {
  const sessionItem = {
    id: "gps-demo-match",
    date: base,
    sessionName: "משחק ליגה - מחזור 12",
    type: "match",
    opponent: "הפועל צפון",
    notes: "נתוני דמו ממערכת GPS"
  };
  const specs = [
    ["p1", "כנף", 80, 9650, 121, 8.7, 910, 24, 890, 780, 620, 210, 31.8, 1.7, 42, 38, 63, 58, 7.7, 6.7],
    ["p2", "קשר", 70, 8750, 125, 7.8, 760, 21, 720, 520, 410, 130, 29.5, 1.5, 31, 29, 64, 61, 7.6, 7.2],
    ["p3", "בלם", 75, 8200, 109, 6.9, 650, 19, 590, 360, 250, 70, 28.1, 1.3, 24, 27, 56, 53, 6.8, 6.5],
    ["p4", "חלוץ", 75, 9100, 121, 8.4, 840, 23, 830, 760, 640, 230, 32.4, 1.8, 39, 41, 64, 57, 7.9, 6.6],
    ["p5", "מגן", 45, 5650, 126, 7.3, 430, 17, 410, 380, 320, 120, 30.1, 1.4, 21, 19, 62, 60, 7.4, 7.1],
    ["p6", "קשר", 60, 7900, 132, 8.8, 870, 25, 860, 690, 540, 170, 30.8, 1.9, 45, 43, 70, 56, 8.9, 6.5],
    ["p7", "כנף", 75, 8400, 112, 7.0, 610, 18, 520, 530, 420, 160, 31.2, 1.4, 27, 24, 58, 54, 7.1, 6.8],
    ["p9", "מגן", 75, 9000, 120, 7.5, 700, 20, 640, 610, 480, 150, 30.6, 1.6, 34, 31, 62, 58, 7.5, 7.0]
  ];
  const records = [];
  specs.forEach((spec, index) => {
    const [playerId, position, minutes, totalDistance, distancePerMinute, intensity, gpsLoad, metabolicActivity, hmld, hsr, above18, above25, maxSpeed, workRestRatio, accelerations, decelerations, firstDpm, secondDpm, firstIntensity, secondIntensity] = spec;
    const player = players.find((item) => item.id === playerId);
    records.push(buildGpsRecord(`gps-full-${index}`, sessionItem.id, player, position, "משחק מלא", minutes, totalDistance, distancePerMinute, intensity, gpsLoad, metabolicActivity, hmld, hsr, above18, above25, maxSpeed, workRestRatio, accelerations, decelerations));
    records.push(buildGpsRecord(`gps-first-${index}`, sessionItem.id, player, position, "מחצית ראשונה", Math.round(minutes / 2), Math.round(firstDpm * minutes / 2), firstDpm, firstIntensity, Math.round(gpsLoad * 0.52), metabolicActivity * 0.52, hmld * 0.52, hsr * 0.55, above18 * 0.55, above25 * 0.58, maxSpeed, workRestRatio, Math.round(accelerations * 0.52), Math.round(decelerations * 0.52)));
    records.push(buildGpsRecord(`gps-second-${index}`, sessionItem.id, player, position, "מחצית שנייה", Math.round(minutes / 2), Math.round(secondDpm * minutes / 2), secondDpm, secondIntensity, Math.round(gpsLoad * 0.48), metabolicActivity * 0.48, hmld * 0.48, hsr * 0.45, above18 * 0.45, above25 * 0.42, Math.max(0, maxSpeed - 0.8), workRestRatio * 0.94, Math.round(accelerations * 0.48), Math.round(decelerations * 0.48)));
  });
  return { sessions: [sessionItem], records };
}

function buildGpsRecord(id, gpsSessionId, player, position, period, minutesPlayed, totalDistance, distancePerMinute, intensity, gpsLoad, metabolicActivity, hmld, highSpeedRunning, distanceAbove18, distanceAbove25, maxSpeed, workRestRatio, accelerations, decelerations) {
  return {
    id,
    gpsSessionId,
    playerId: player ? player.id : "",
    playerName: player ? player.name : "",
    position,
    period,
    minutesPlayed,
    totalDistance,
    distancePerMinute,
    intensity,
    gpsLoad,
    metabolicActivity,
    hmld,
    highSpeedRunning,
    distanceAbove18,
    distanceAbove25,
    maxSpeed,
    workRestRatio,
    accelerations,
    decelerations
  };
}

function session(id, offset, sessionType, defaultMinutes, notes, playerMinutes) {
  return {
    id,
    date: addDays(todayIso(), offset),
    sessionType,
    defaultMinutes,
    notes,
    playerMinutes: playerMinutes || {}
  };
}

function readinessSpec(offset, playerId, sleepHours, sleepQuality, energy, mood, soreness, painArea, loadFeeling, bodyWeight, medicalLimitation, comments) {
  return { offset, playerId, sleepHours, sleepQuality, energy, mood, soreness, painArea, loadFeeling, bodyWeight, medicalLimitation, comments };
}

function postSpec(offset, playerId, sessionType, rpe, fatigue, soreness, painArea, completedFullSession, bodyWeightAfterOrComments, comments = "") {
  const hasWeight = typeof bodyWeightAfterOrComments === "number" || bodyWeightAfterOrComments === null;
  return {
    offset,
    playerId,
    sessionType,
    rpe,
    fatigue,
    soreness,
    painArea,
    completedFullSession,
    bodyWeightAfter: hasWeight ? bodyWeightAfterOrComments : null,
    comments: hasWeight ? comments : bodyWeightAfterOrComments
  };
}

function buildReadinessReport(spec, index, players, base) {
  const player = players.find((item) => item.id === spec.playerId);
  const date = addDays(base, spec.offset);
  return {
    id: `pre-demo-${index + 1}`,
    playerId: spec.playerId,
    playerName: player ? player.name : "",
    createdAt: createDemoCreatedAt(date, 8 + (index % 5)),
    date,
    sleepHours: spec.sleepHours,
    sleepQuality: spec.sleepQuality,
    energy: spec.energy,
    mood: spec.mood,
    soreness: spec.soreness,
    painArea: spec.painArea,
    loadFeeling: spec.loadFeeling,
    bodyWeight: spec.bodyWeight,
    medicalLimitation: spec.medicalLimitation,
    comments: spec.comments
  };
}

function buildPostReport(spec, index, players, base) {
  const player = players.find((item) => item.id === spec.playerId);
  const date = addDays(base, spec.offset);
  return {
    id: `post-demo-${index + 1}`,
    playerId: spec.playerId,
    playerName: player ? player.name : "",
    createdAt: createDemoCreatedAt(date, 17 + (index % 5)),
    date,
    sessionType: spec.sessionType,
    rpe: spec.rpe,
    fatigue: spec.fatigue,
    soreness: spec.soreness,
    painArea: spec.painArea,
    completedFullSession: spec.completedFullSession,
    bodyWeightAfter: spec.bodyWeightAfter,
    comments: spec.comments
  };
}

function createDemoCreatedAt(date, hour) {
  return new Date(`${date}T${String(hour).padStart(2, "0")}:15:00`).toISOString();
}

function renderReportPage() {
  const player = getLoggedPlayer();
  if (!player) {
    renderPlayerLogin();
    return;
  }
  renderPlayerHome(player);
}

function renderPlayerProtected(renderer) {
  const player = getLoggedPlayer();
  if (!player) {
    navigate("/report", true);
    return;
  }
  renderer(player);
}

function renderPlayerLogin() {
  const html = `
    <main class="player-page player-app">
      <header class="player-hero player-login-hero">
        <div class="brand">
          <span class="brand-mark" aria-hidden="true"></span>
          <div>
            <h1>דוח RPE קבוצתי</h1>
            <p>כניסה אישית לשחקן · ${escapeHtml(formatDateDisplay(todayIso()))}</p>
          </div>
        </div>
        <div class="hero-actions">
          ${renderStorageStatus()}
          <a href="/coach" data-route class="btn secondary">מאמן</a>
        </div>
      </header>

      <form id="playerLoginForm" class="surface form-panel grid player-login-card" autocomplete="off">
        <div class="form-intro">
          <span class="eyebrow">שחקנים</span>
          <h2>התחברות מהירה</h2>
          <p>בחר שם והזן PIN אישי כדי למלא רק את הדוחות שלך.</p>
        </div>
        <div class="field">
          <label for="loginPlayerId">שם שחקן</label>
          <select id="loginPlayerId" name="playerId" required>
            <option value="">בחירה</option>
            ${getActivePlayers().map((player) => `<option value="${escapeAttr(player.id)}">${escapeHtml(player.name)}</option>`).join("")}
          </select>
        </div>
        <div class="field">
          <label for="loginPin">PIN אישי</label>
          <input id="loginPin" name="pin" inputmode="numeric" maxlength="4" pattern="[0-9]{4}" placeholder="4 ספרות" required />
          <small>ה-PIN מנוהל על ידי המאמן בהגדרות.</small>
        </div>
        <button class="btn primary" type="submit">כניסה</button>
        <div id="loginError" class="success-box danger-box">שם או PIN אינם נכונים</div>
      </form>
    </main>
  `;

  mount(html, () => {
    document.getElementById("playerLoginForm").addEventListener("submit", (event) => {
      event.preventDefault();
      const data = new FormData(event.currentTarget);
      const playerId = String(data.get("playerId") || "");
      const pin = normalizePin(data.get("pin"));
      const player = state.players.find((item) => item.id === playerId && item.active && item.pin === pin);
      if (!player) {
        document.getElementById("loginError").classList.add("show");
        return;
      }
      localStorage.setItem(PLAYER_SESSION_KEY, player.id);
      navigate("/report");
    });
  });
}

function renderPlayerHome(player) {
  const date = todayIso();
  const readiness = getReadinessFor(player.id, date);
  const post = getPostReportFor(player.id, date);
  const readinessComputed = readiness ? getComputedReadiness(readiness) : null;
  const html = `
    <main class="player-page player-app">
      <header class="player-hero player-home-hero">
        <div class="brand">
          <span class="brand-mark" aria-hidden="true"></span>
          <div>
            <h1>שלום ${escapeHtml(player.name)}</h1>
            <p>היום שלך בקבוצה · ${escapeHtml(formatDateDisplay(date))}</p>
          </div>
        </div>
        <div class="hero-actions">
          ${renderStorageStatus()}
          <button id="logoutPlayer" class="btn ghost" type="button">יציאה</button>
        </div>
      </header>

      <section class="surface form-panel grid">
        <div class="form-intro">
          <span class="eyebrow">דיווח יומי</span>
          <h2>מה צריך למלא היום?</h2>
          <p>שני דוחות קצרים שעוזרים לצוות להבין עומס, מוכנות והתאוששות.</p>
        </div>
        <div class="player-status-grid">
          ${statusCard("דוח מוכנות לפני אימון", readiness ? "בוצע" : "חסר", readiness ? "green" : "yellow", readinessComputed ? `ציון מוכנות ${readinessComputed.readinessScore}` : "לפני האימון")}
          ${statusCard("דוח RPE אחרי אימון", post ? "בוצע" : "חסר", post ? "green" : "yellow", post ? `RPE ${post.rpe}` : "אחרי האימון")}
        </div>
        <div class="player-home-actions">
          <a href="/report/pre" data-route class="player-action-card primary-action">
            <span class="action-kicker">${readiness ? "עדכון" : "לפני אימון"}</span>
            <strong>דוח מוכנות לפני אימון</strong>
            <small>שינה, אנרגיה, כאבים, עומס והגבלות.</small>
          </a>
          <a href="/report/post" data-route class="player-action-card">
            <span class="action-kicker">${post ? "עדכון" : "אחרי אימון"}</span>
            <strong>דוח RPE אחרי אימון</strong>
            <small>RPE, עייפות, כאבים, השלמת אימון ומשקל.</small>
          </a>
        </div>
      </section>
    </main>
  `;

  mount(html, () => {
    document.getElementById("logoutPlayer").addEventListener("click", () => {
      localStorage.removeItem(PLAYER_SESSION_KEY);
      renderReportPage();
    });
  });
}

function statusCard(title, status, color, note) {
  return `
    <article class="status-card ${color}">
      <div>
        <strong>${escapeHtml(title)}</strong>
        <span>${escapeHtml(note)}</span>
      </div>
      <span class="badge ${color}">${escapeHtml(status)}</span>
    </article>
  `;
}

function renderReadinessForm(player) {
  const existing = getReadinessFor(player.id, todayIso());
  const html = playerFormShell(player, "דוח מוכנות לפני אימון", `
    <form id="readinessForm" class="surface form-panel grid" autocomplete="off">
      ${readonlyPlayerAndDate(player)}
      <div class="grid two">
        <div class="field">
          <label for="sleepHours">שעות שינה</label>
          <input id="sleepHours" name="sleepHours" type="number" min="0" max="12" step="0.5" value="${escapeAttr(existing ? existing.sleepHours : 7)}" required />
          <small>רשום כמה שעות ישנת בפועל בלילה האחרון.</small>
        </div>
        <div class="field">
          <span class="field-label">איכות שינה</span>
          ${renderScaleControl("sleepQuality", 1, 5, existing ? existing.sleepQuality : 3)}
          <small>1 = נמוכה מאוד, 5 = מצוינת.</small>
        </div>
      </div>
      <div class="grid two">
        <div class="field">
          <span class="field-label">רמת אנרגיה</span>
          ${renderScaleControl("energy", 1, 5, existing ? existing.energy : 3)}
          <small>עד כמה אתה מרגיש אנרגטי לפני האימון.</small>
        </div>
        <div class="field">
          <span class="field-label">מצב רוח / מוטיבציה</span>
          ${renderScaleControl("mood", 1, 5, existing ? existing.mood : 3)}
          <small>תחושה כללית ומוטיבציה לקראת האימון.</small>
        </div>
      </div>
      <div class="grid two">
        <div class="field">
          <span class="field-label">כאבי שריר</span>
          ${renderScaleControl("soreness", 1, 5, existing ? existing.soreness : 2)}
          <small>1 = אין כמעט כאב, 5 = כאב משמעותי.</small>
        </div>
        <div class="field">
          <span class="field-label">תחושת עומס כללית</span>
          ${renderScaleControl("loadFeeling", 1, 5, existing ? existing.loadFeeling : 2)}
          <small>כמה הגוף מרגיש עמוס לפני האימון.</small>
        </div>
      </div>
      ${painField(existing ? existing.painArea : NO_PAIN)}
      <div class="grid two">
        <div class="field">
          <label for="bodyWeight">משקל גוף לפני אימון</label>
          <input id="bodyWeight" name="bodyWeight" type="number" min="30" max="140" step="0.1" value="${escapeAttr(existing && existing.bodyWeight ? existing.bodyWeight : "")}" placeholder="אופציונלי" />
          <small>אופציונלי. ישמש להשוואת הידרציה אחרי האימון.</small>
        </div>
        <div class="field">
          <label for="medicalLimitation">מגבלה רפואית</label>
          <select id="medicalLimitation" name="medicalLimitation">
            <option value="false" ${existing && existing.medicalLimitation ? "" : "selected"}>לא</option>
            <option value="true" ${existing && existing.medicalLimitation ? "selected" : ""}>כן</option>
          </select>
          <small>סמן כן אם יש מגבלה שדורשת התייחסות של הצוות.</small>
        </div>
      </div>
      <div class="field">
        <label for="comments">הערות</label>
        <textarea id="comments" name="comments" maxlength="260">${escapeHtml(existing ? existing.comments : "")}</textarea>
      </div>
      <button class="btn primary" type="submit">שלח דוח מוכנות</button>
      <div id="successMessage" class="success-box">הדוח נשלח בהצלחה. תודה!</div>
    </form>
  `);

  mount(html, () => {
    bindScaleButtons();
    bindBodyMap();
    document.getElementById("readinessForm").addEventListener("submit", (event) => {
      event.preventDefault();
      const data = new FormData(event.currentTarget);
      const date = todayIso();
      const report = {
        id: existing ? existing.id : createId("pre"),
        playerId: player.id,
        playerName: player.name,
        createdAt: new Date().toISOString(),
        date,
        sleepHours: numberFromForm(data, "sleepHours"),
        sleepQuality: numberFromForm(data, "sleepQuality"),
        energy: numberFromForm(data, "energy"),
        mood: numberFromForm(data, "mood"),
        soreness: numberFromForm(data, "soreness"),
        painArea: String(data.get("painArea") || NO_PAIN),
        loadFeeling: numberFromForm(data, "loadFeeling"),
        bodyWeight: optionalNumberFromForm(data, "bodyWeight"),
        medicalLimitation: String(data.get("medicalLimitation")) === "true",
        comments: String(data.get("comments") || "").trim()
      };
      state.readinessReports = state.readinessReports.filter((item) => !(item.playerId === player.id && item.date === date));
      state.readinessReports.unshift(report);
      saveState();
      renderPlayerSuccess(player, "דוח המוכנות נשלח בהצלחה", "הצוות קיבל את תמונת המצב שלך לפני האימון.");
    });
  });
}

function renderPostReportForm(player) {
  const existing = getPostReportFor(player.id, todayIso());
  const html = playerFormShell(player, "דוח RPE אחרי אימון", `
    <form id="postForm" class="surface form-panel grid" autocomplete="off">
      ${readonlyPlayerAndDate(player)}
      <div class="field">
        <label for="sessionType">סוג מפגש</label>
        <select id="sessionType" name="sessionType" required>
          ${renderSimpleOptions(SESSION_TYPES, existing ? existing.sessionType : "אימון")}
        </select>
      </div>
      <div class="field">
        <span class="field-label">RPE</span>
        ${renderScaleControl("rpe", 1, 10, existing ? existing.rpe : 5)}
        <small>כמה קשה היה האימון עבורך: 1 קל מאוד, 10 מקסימלי.</small>
      </div>
      <div class="grid two">
        <div class="field">
          <span class="field-label">עייפות אחרי אימון</span>
          ${renderScaleControl("fatigue", 1, 5, existing ? existing.fatigue : 3)}
          <small>1 = רענן, 5 = עייף מאוד.</small>
        </div>
        <div class="field">
          <span class="field-label">כאבי שריר אחרי אימון</span>
          ${renderScaleControl("soreness", 1, 5, existing ? existing.soreness : 2)}
          <small>בחר לפי התחושה מיד אחרי האימון.</small>
        </div>
      </div>
      ${painField(existing ? existing.painArea : NO_PAIN)}
      <div class="field">
        <label for="completedFullSession">השלמת את כל האימון?</label>
        <select id="completedFullSession" name="completedFullSession">
          ${renderSimpleOptions(FULL_SESSION_OPTIONS, existing ? existing.completedFullSession : "מלא")}
        </select>
        <small>המאמן עדיין קובע את הדקות בפועל.</small>
      </div>
      <div class="field">
        <label for="bodyWeightAfter">משקל גוף אחרי אימון</label>
        <input id="bodyWeightAfter" name="bodyWeightAfter" type="number" min="30" max="140" step="0.1" value="${escapeAttr(existing && existing.bodyWeightAfter ? existing.bodyWeightAfter : "")}" placeholder="אופציונלי" />
        <small>אופציונלי. אם יש משקל לפני ואחרי, נחושב איבוד נוזלים.</small>
      </div>
      <div class="field">
        <label for="comments">הערות</label>
        <textarea id="comments" name="comments" maxlength="260">${escapeHtml(existing ? existing.comments : "")}</textarea>
      </div>
      <button class="btn primary" type="submit">שלח דוח RPE</button>
      <div id="successMessage" class="success-box">הדוח נשלח בהצלחה. תודה!</div>
    </form>
  `);

  mount(html, () => {
    bindScaleButtons();
    bindBodyMap();
    document.getElementById("postForm").addEventListener("submit", (event) => {
      event.preventDefault();
      const data = new FormData(event.currentTarget);
      const date = todayIso();
      const report = {
        id: existing ? existing.id : createId("post"),
        playerId: player.id,
        playerName: player.name,
        createdAt: new Date().toISOString(),
        date,
        sessionType: String(data.get("sessionType") || "אימון"),
        rpe: numberFromForm(data, "rpe"),
        fatigue: numberFromForm(data, "fatigue"),
        soreness: numberFromForm(data, "soreness"),
        painArea: String(data.get("painArea") || NO_PAIN),
        completedFullSession: String(data.get("completedFullSession") || "מלא"),
        bodyWeightAfter: optionalNumberFromForm(data, "bodyWeightAfter"),
        comments: String(data.get("comments") || "").trim()
      };
      state.reports = state.reports.filter((item) => !(item.playerId === player.id && item.date === date));
      state.reports.unshift(report);
      saveState();
      renderPlayerSuccess(player, "דוח ה-RPE נשלח בהצלחה", "הצוות יראה את העומס, העייפות וההידרציה שלך.");
    });
  });
}

function playerFormShell(player, title, content) {
  return `
    <main class="player-page player-app">
      <header class="player-hero player-form-hero">
        <div class="brand">
          <span class="brand-mark" aria-hidden="true"></span>
          <div>
            <span class="eyebrow">דיווח שחקן</span>
            <h1>${escapeHtml(title)}</h1>
            <p>${escapeHtml(player.name)} · ${escapeHtml(formatDateDisplay(todayIso()))}</p>
          </div>
        </div>
        <div class="hero-actions">
          ${renderStorageStatus()}
          <a href="/report" data-route class="btn secondary">בית</a>
        </div>
      </header>
      ${content}
    </main>
  `;
}

function renderPlayerSuccess(player, title, detail) {
  const html = `
    <main class="player-page player-app">
      <section class="surface success-state">
        ${renderStorageStatus()}
        <span class="success-mark" aria-hidden="true">✓</span>
        <span class="eyebrow">הדוח נקלט</span>
        <h1>${escapeHtml(title)}</h1>
        <p>${escapeHtml(player.name)}, ${escapeHtml(detail)}</p>
        <a href="/report" data-route class="btn primary">חזרה למסך הבית שלי</a>
      </section>
    </main>
  `;
  mount(html);
}

function readonlyPlayerAndDate(player) {
  return `
    <div class="grid two">
      <div class="field">
        <label>שם שחקן</label>
        <input value="${escapeAttr(player.name)}" readonly />
      </div>
      <div class="field">
        <label>תאריך ושעה</label>
        <input value="${escapeAttr(formatDateTimeDisplay(new Date()))}" readonly />
      </div>
    </div>
  `;
}

function painField(selected) {
  return `
    <div class="field">
      <span class="field-label">אזור כאב</span>
      <small>אם אין כאב, השאר "אין כאב". אם יש, בחר את האזור המרכזי.</small>
      <div class="body-map-wrap">
        ${renderBodyMap(selected)}
        <select id="painArea" name="painArea" required>
          ${renderSimpleOptions(state.painAreas, selected)}
        </select>
      </div>
    </div>
  `;
}

function renderCoachDashboard() {
  const filters = uiState.dashboardFilters;
  const selectedDate = filters.date || todayIso();
  const activePlayers = getActivePlayers();
  const readinessToday = state.readinessReports.filter((report) => report.date === selectedDate).map(getComputedReadiness);
  const postToday = state.reports.filter((report) => report.date === selectedDate).map(getComputedReport);
  const readinessIds = new Set(readinessToday.map((report) => report.playerId));
  const postIds = new Set(postToday.map((report) => report.playerId));
  const missingPre = activePlayers.filter((player) => !readinessIds.has(player.id));
  const missingPost = activePlayers.filter((player) => !postIds.has(player.id));
  const filteredPostReports = applyReportFilters(postToday, filters, false);
  const weekRows = buildWeeklyRows(filters);
  const dashboardCards = buildDashboardCards(activePlayers, readinessToday, postToday, missingPre, missingPost, weekRows);
  const weekRange = getWeekRange(filters.weekDate || selectedDate);

  const html = coachShell("players", `
    <div class="page-header premium-header">
      <div>
        <span class="eyebrow">מרכז מאמן</span>
        <h2>דשבורד מאמן</h2>
        <p>${escapeHtml(formatDateDisplay(selectedDate))} · תמונת מצב יומית למוכנות, עומס, הידרציה ו-GPS</p>
      </div>
      <div class="header-actions">
        <a href="/coach/reports" data-route class="btn primary">סיכום מאמן</a>
        <a href="/report" data-route class="btn secondary">כניסת שחקן</a>
      </div>
    </div>

    <section class="insight-grid" aria-label="כרטיסי מצב">
      ${dashboardCards.map(renderInsightCard).join("")}
    </section>

    <section class="load-info surface">
      <strong>איך מחושב עומס?</strong>
      <span>עומס = דקות פעילות × RPE. לדוגמה: 75 דקות × RPE 8 = 600. המספר שימושי בעיקר להשוואת שינויים יומיים ושבועיים.</span>
    </section>

    <section class="metric-grid section" aria-label="מדדי יום">
      ${metricCard("דוחות מוכנות", readinessToday.length, `${activePlayers.length} שחקנים פעילים`)}
      ${metricCard("דוחות RPE", postToday.length, "אחרי אימון")}
      ${metricCard("מוכנות ממוצעת", formatInteger(average(readinessToday.map((report) => report.readinessScore))), "מתוך 100")}
      ${metricCard("עומס יומי", formatInteger(sum(postToday.map((report) => report.trainingLoad))), "יחידות עומס")}
    </section>

    <section class="section surface">
      <div class="filters">
        ${filterSelect("filterPlayer", "שחקן", playerFilterOptions(), filters.playerId, playerFilterValues())}
        ${filterInput("filterDate", "תאריך", "date", selectedDate)}
        ${filterInput("filterWeek", "שבוע", "date", filters.weekDate || selectedDate)}
        ${filterSelect("filterSession", "סוג מפגש", ["הכול", ...SESSION_TYPES], filters.sessionType, ["all", ...SESSION_TYPES])}
        ${filterSelect("filterPain", "אזור כאב", ["הכול", ...state.painAreas], filters.painArea, ["all", ...state.painAreas])}
        ${filterSelect("filterRisk", "דרגת סיכון", ["הכול", "תקין", "שים לב", "סיכון"], filters.riskLevel, ["all", "normal", "attention", "risk"])}
      </div>
    </section>

    <section class="section">
      <div class="section-title">
        <h3>סטטוס יומי לפי שחקן</h3>
        <span>${activePlayers.length} שחקנים</span>
      </div>
      ${renderDailyStatusTable(activePlayers, readinessToday, postToday, selectedDate)}
    </section>

    <section class="section">
      <div class="section-title">
        <h3>דוחות RPE אחרי אימון</h3>
        <span>${filteredPostReports.length} רשומות</span>
      </div>
      ${renderReportsTable(filteredPostReports, true)}
    </section>

    <section class="section">
      <div class="section-title">
        <h3>עומס שבועי</h3>
        <span>${escapeHtml(formatDateDisplay(weekRange.start))} עד ${escapeHtml(formatDateDisplay(weekRange.end))}</span>
      </div>
      ${renderWeeklyTable(weekRows)}
    </section>
  `);

  mount(html, bindDashboardFilters);
}

function bindDashboardFilters() {
  const mapping = [
    ["filterPlayer", "playerId"],
    ["filterDate", "date"],
    ["filterWeek", "weekDate"],
    ["filterSession", "sessionType"],
    ["filterPain", "painArea"],
    ["filterRisk", "riskLevel"]
  ];
  mapping.forEach(([id, key]) => {
    const input = document.getElementById(id);
    if (!input) return;
    input.addEventListener("change", () => {
      uiState.dashboardFilters[key] = input.value || "all";
      renderCoachDashboard();
    });
  });
}

function buildDashboardCards(players, readinessToday, postToday, missingPre, missingPost, weekRows) {
  const readinessByPlayer = new Map(readinessToday.map((report) => [report.playerId, report]));
  const postByPlayer = new Map(postToday.map((report) => [report.playerId, report]));

  const highRisk = players
    .map((player) => {
      const readiness = readinessByPlayer.get(player.id);
      const post = postByPlayer.get(player.id);
      const reasons = unique([...(readiness ? readiness.riskFlags : []), ...(post ? post.riskFlags : [])]);
      return reasons.length ? { player, reason: reasons.join(", "), details: buildRiskExplanation(readiness, post) } : null;
    })
    .filter(Boolean);

  const highRpe = postToday
    .filter((report) => report.rpe >= state.settings.rpeHigh)
    .map((report) => ({ player: getPlayer(report.playerId), reason: `RPE ${report.rpe}`, details: `עומס מחושב ${formatInteger(report.trainingLoad)} דקות לפי המאמן: ${report.minutes}` }));

  const readinessCheck = readinessToday
    .filter((report) => report.readinessStatus && report.readinessStatus.tone === "red")
    .map((report) => ({
      player: getPlayer(report.playerId),
      reason: `מוכנות ${report.readinessScore}`,
      detailsHtml: `${readinessBadge(report.readinessScore)} <span>${escapeHtml(report.riskFlags.slice(0, 4).join(", ") || "לבדוק לפני אימון")}</span>`
    }));

  const lowSleep = readinessToday
    .filter((report) => report.sleepHours < state.settings.sleepHoursLow)
    .map((report) => ({ player: getPlayer(report.playerId), reason: `${formatNumber(report.sleepHours)} שעות שינה`, details: `איכות שינה ${report.sleepQuality}, ציון מוכנות ${report.readinessScore}` }));

  const painReports = mergePainReports(readinessToday, postToday);
  const highFatigue = postToday
    .filter((report) => report.fatigue >= state.settings.fatigueHigh)
    .map((report) => ({ player: getPlayer(report.playerId), reason: `עייפות ${report.fatigue}`, details: `RPE ${report.rpe}, כאבי שריר ${report.soreness}` }));

  const hydrationRisk = postToday
    .filter((report) => report.hydration && report.hydration.tone !== "green")
    .map((report) => ({
      player: getPlayer(report.playerId),
      reason: `${report.hydration.status} ${formatNumber(report.hydration.lossPercent)}%`,
      detailsHtml: `
        <span>לפני: ${escapeHtml(formatNumber(report.hydration.preTrainingWeight))} ק"ג</span>
        <span>אחרי: ${escapeHtml(formatNumber(report.hydration.postTrainingWeight))} ק"ג</span>
        <span>ירידה: ${escapeHtml(formatNumber(report.hydration.lossKg))} ק"ג (${escapeHtml(formatNumber(report.hydration.lossPercent))}%)</span>
        ${hydrationBadge(report.hydration)}
      `
    }));

  const weeklyLoadJump = weekRows
    .filter((row) => row.loadChangePercent !== null && row.loadChangePercent > 10)
    .map((row) => ({
      player: row.player,
      reason: `${formatPercent(row.loadChangePercent)}`,
      detailsHtml: `
        <span>שבוע נוכחי: ${escapeHtml(formatInteger(row.totalLoad))}</span>
        <span>שבוע קודם: ${escapeHtml(formatInteger(row.previousLoad))}</span>
        <span>שינוי: ${escapeHtml(formatPercent(row.loadChangePercent))}</span>
        ${weeklyLoadRiskBadge(row.loadChangePercent)}
      `
    }));

  return [
    {
      title: "חסרים דוח מוכנות",
      tone: "yellow",
      items: missingPre.map((player) => ({ player, reason: "חסר דוח מוכנות", details: "השחקן עדיין לא מילא דוח לפני אימון היום" }))
    },
    {
      title: "חסרים דוח RPE",
      tone: "yellow",
      items: missingPost.map((player) => ({ player, reason: "חסר דוח RPE", details: "השחקן עדיין לא מילא דוח אחרי אימון היום" }))
    },
    { title: "שחקנים בסיכון", tone: "red", items: highRisk },
    { title: "לבדוק לפני אימון", tone: "red", items: readinessCheck },
    { title: "RPE גבוה", tone: "red", items: highRpe },
    { title: "שינה נמוכה", tone: "yellow", items: lowSleep },
    { title: "סיכון הידרציה", tone: "red", items: hydrationRisk },
    { title: "קפיצה שבועית בעומס", tone: "red", items: weeklyLoadJump },
    { title: "דיווחי כאב", tone: "yellow", items: painReports },
    { title: "עייפות גבוהה", tone: "red", items: highFatigue }
  ];
}

function renderInsightCard(card) {
  const previewItems = card.items.length ? card.items : [{ player: null, reason: "אין חריגים", details: "אין רשומות להצגה" }];
  return `
    <details class="insight-card ${card.tone}">
      <summary>
        <span class="insight-title">${escapeHtml(card.title)}</span>
        <span class="insight-count">${escapeHtml(card.items.length)}</span>
        <span class="insight-list">
          ${previewItems.map((item) => `<span>${item.player ? `${escapeHtml(item.player.name)} - ` : ""}${escapeHtml(item.reason)}</span>`).join("")}
        </span>
      </summary>
      <div class="insight-panel">
        ${previewItems.map((item) => `
          <div class="insight-row">
            <strong>${item.player ? escapeHtml(item.player.name) : "מצב תקין"}</strong>
            ${item.detailsHtml ? `<span class="insight-detail-rich">${item.detailsHtml}</span>` : `<span>${escapeHtml(item.details || item.reason)}</span>`}
          </div>
        `).join("")}
      </div>
    </details>
  `;
}

function renderDailyStatusTable(players, readinessReports, postReports, selectedDate) {
  const readinessByPlayer = new Map(readinessReports.map((report) => [report.playerId, report]));
  const postByPlayer = new Map(postReports.map((report) => [report.playerId, report]));
  return `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>שם שחקן</th>
            <th>דוח מוכנות</th>
            <th>דוח RPE</th>
            <th>ציון מוכנות</th>
            <th>שינה</th>
            <th>עייפות / אנרגיה</th>
            <th>הידרציה</th>
            <th>כאב</th>
            <th>דגלים</th>
          </tr>
        </thead>
        <tbody>
          ${players.map((player) => {
            const readiness = readinessByPlayer.get(player.id);
            const post = postByPlayer.get(player.id);
            const pain = unique([readiness && readiness.painArea !== NO_PAIN ? readiness.painArea : "", post && post.painArea !== NO_PAIN ? post.painArea : ""].filter(Boolean));
            const flags = unique([...(readiness ? readiness.riskFlags : []), ...(post ? post.riskFlags : [])]);
            return `
              <tr>
                <td><a href="/coach/player/${escapeAttr(player.id)}" data-route class="table-link">${escapeHtml(player.name)}</a></td>
                <td>${readiness ? `<span class="badge green">בוצע</span>` : `<span class="badge yellow">חסר</span>`}</td>
                <td>${post ? `<span class="badge green">בוצע</span>` : `<span class="badge yellow">חסר</span>`}</td>
                <td>${readiness ? readinessBadge(readiness.readinessScore) : "אין נתון"}</td>
                <td>${readiness ? `${formatNumber(readiness.sleepHours)} שעות` : "אין נתון"}</td>
                <td>${post ? `עייפות ${post.fatigue}` : readiness ? `אנרגיה ${readiness.energy}` : "אין נתון"}</td>
                <td>${post ? hydrationSummary(post.hydration) : "אין נתון"}</td>
                <td>${pain.length ? escapeHtml(pain.join(", ")) : NO_PAIN}</td>
                <td>${renderRiskBadges(flags)}</td>
              </tr>
            `;
          }).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderCoachPlayersPage() {
  const players = state.players;
  const today = todayIso();
  const html = coachShell("players", `
    <div class="page-header premium-header">
      <div>
        <span class="eyebrow">סגל</span>
        <h2>שחקנים</h2>
        <p>תמונת מצב מקצועית לפי מוכנות, עומס, GPS והידרציה</p>
      </div>
      <a href="/coach/settings" data-route class="btn secondary">ניהול סגל</a>
    </div>

    <section class="athlete-grid">
      ${players.map((player) => {
        const readiness = getReadinessFor(player.id, today);
        const computedReadiness = readiness ? getComputedReadiness(readiness) : null;
        const post = getPostReportFor(player.id, today);
        const computedPost = post ? getComputedReport(post) : null;
        const summary = summarizePlayerWeek(player.id, today);
        const position = getPlayerPrimaryPosition(player.id);
        const trend = getLoadTrend(player.id);
        return `
          <a href="/coach/player/${escapeAttr(player.id)}" data-route class="athlete-card">
            <div class="athlete-card-top">
              <div>
                <strong>${escapeHtml(player.name)}</strong>
                <span>${escapeHtml(position || "עמדה לא מוגדרת")}</span>
              </div>
              <span class="badge ${player.active ? "green" : "neutral"}">${player.active ? "פעיל" : "לא פעיל"}</span>
            </div>
            <div class="athlete-card-metrics">
              <span>${computedReadiness ? readinessBadge(computedReadiness.readinessScore) : `<span class="badge yellow">חסר מוכנות</span>`}</span>
              <span>${computedPost ? hydrationBadge(computedPost.hydration) : `<span class="badge neutral">אין הידרציה</span>`}</span>
              <span class="badge ${trend.tone}">${escapeHtml(trend.label)}</span>
            </div>
            <div class="athlete-card-load">
              <span>עומס שבועי</span>
              <strong>${escapeHtml(formatInteger(summary.totalLoad))}</strong>
            </div>
          </a>
        `;
      }).join("")}
    </section>
  `);
  mount(html);
}

function renderCoachReportsPage() {
  const selectedDate = uiState.dashboardFilters.date || todayIso();
  const activePlayers = getActivePlayers();
  const readinessToday = state.readinessReports.filter((report) => report.date === selectedDate).map(getComputedReadiness);
  const postToday = state.reports.filter((report) => report.date === selectedDate).map(getComputedReport);
  const readinessIds = new Set(readinessToday.map((report) => report.playerId));
  const postIds = new Set(postToday.map((report) => report.playerId));
  const missingPre = activePlayers.filter((player) => !readinessIds.has(player.id));
  const missingPost = activePlayers.filter((player) => !postIds.has(player.id));
  const weekRows = buildWeeklyRows(uiState.dashboardFilters);
  const cards = buildDashboardCards(activePlayers, readinessToday, postToday, missingPre, missingPost, weekRows);
  const reportCards = [
    ["שחקנים לבדיקה", cards.find((card) => card.title === "לבדוק לפני אימון")],
    ["עומסים חריגים", cards.find((card) => card.title === "קפיצה שבועית בעומס")],
    ["כאבים חוזרים", cards.find((card) => card.title === "דיווחי כאב")],
    ["הידרציה", cards.find((card) => card.title === "סיכון הידרציה")],
    ["שינה נמוכה", cards.find((card) => card.title === "שינה נמוכה")],
    ["GPS חריג", { title: "GPS חריג", tone: "red", items: buildGpsReportRisks(selectedDate) }]
  ].map(([title, card]) => ({ ...(card || { tone: "green", items: [] }), title }));

  const html = coachShell("reports", `
    <div class="page-header premium-header report-header">
      <div>
        <span class="eyebrow">Coach Summary</span>
        <h2>דוח מאמן יומי</h2>
        <p>${escapeHtml(formatDateDisplay(selectedDate))} · סיכום מקצועי מוכן לשיתוף</p>
      </div>
      <a href="/coach" data-route class="btn secondary">דשבורד מלא</a>
    </div>

    <section class="report-summary-grid">
      ${reportCards.map(renderCoachSummaryCard).join("")}
    </section>

    <section class="section">
      <div class="section-title">
        <h3>סטטוס יומי לפי שחקן</h3>
        <span>${activePlayers.length} שחקנים</span>
      </div>
      ${renderDailyStatusTable(activePlayers, readinessToday, postToday, selectedDate)}
    </section>
  `);
  mount(html);
}

function renderCoachSummaryCard(card) {
  const items = card.items && card.items.length ? card.items : [{ player: null, reason: "תקין", details: "אין חריגים משמעותיים" }];
  const tone = card.items && card.items.length ? card.tone : "green";
  return `
    <details class="coach-summary-card ${tone}" open>
      <summary>
        <span>${escapeHtml(card.title)}</span>
        <strong>${escapeHtml(card.items ? card.items.length : 0)}</strong>
      </summary>
      <div>
        ${items.slice(0, 6).map((item) => `
          <p>
            <b>${item.player ? escapeHtml(item.player.name) : "מצב תקין"}</b>
            <span>${escapeHtml(item.reason || item.details || "אין חריגים")}</span>
          </p>
        `).join("")}
      </div>
    </details>
  `;
}

function renderPlayerProfile(playerId) {
  const player = state.players.find((item) => item.id === playerId);
  if (!player) {
    renderNotFound();
    return;
  }

  const postReports = state.reports
    .filter((report) => report.playerId === player.id)
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
    .map(getComputedReport);
  const readinessReports = state.readinessReports
    .filter((report) => report.playerId === player.id)
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
    .map(getComputedReadiness);
  const lastPost = postReports[0] || null;
  const lastReadiness = readinessReports[0] || null;
  const currentSummary = summarizePlayerWeek(player.id, todayIso());
  const previousSummary = summarizePlayerWeek(player.id, addDays(getWeekRange(todayIso()).start, -1));
  const change = calculateChangePercent(currentSummary.totalLoad, previousSummary.totalLoad);
  const postSeries = buildPlayerPostSeries(player.id).slice(-14);
  const readinessSeries = buildPlayerReadinessSeries(player.id).slice(-14);
  const hydrationSeries = postSeries.filter((report) => report.hydration).map((report) => ({ ...report, hydrationLossPercent: report.hydration.lossPercent }));
  const weeklyLoadSeries = buildWeeklyLoadSeries(player.id).slice(-8);
  const gpsRecords = state.gpsRecords
    .filter((record) => record.playerId === player.id)
    .map(getComputedGpsRecord)
    .sort((a, b) => b.date.localeCompare(a.date));
  const gpsFullRecords = (gpsRecords.filter((record) => record.period === "משחק מלא").length ? gpsRecords.filter((record) => record.period === "משחק מלא") : gpsRecords).sort((a, b) => a.date.localeCompare(b.date));
  const internalExternalSeries = buildInternalExternalSeries(player.id);
  const painHistory = buildPainHistory(player.id);
  const comments = [...postReports, ...readinessReports]
    .filter((report) => report.comments)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);
  const position = getPlayerPrimaryPosition(player.id) || "עמדה לא מוגדרת";
  const trend = getLoadTrend(player.id);
  const profileHydration = lastPost && lastPost.hydration ? hydrationBadge(lastPost.hydration) : `<span class="badge neutral">אין נתון</span>`;
  const readinessStatus = lastReadiness ? readinessBadge(lastReadiness.readinessScore) : `<span class="badge yellow">אין דוח מוכנות</span>`;
  const profileTabs = ["מוכנות", "עומסים", "GPS", "שינה", "כאבים", "הידרציה", "הערות מאמן"];

  const html = coachShell("dashboard", `
    <section class="profile-hero surface">
      <div class="profile-identity">
        <span class="eyebrow">פרופיל שחקן</span>
        <h2>${escapeHtml(player.name)}</h2>
        <p>${escapeHtml(position)} · ${lastPost ? `דוח RPE אחרון: ${escapeHtml(formatDateDisplay(lastPost.date))}` : "אין דוח RPE"}</p>
        <div class="profile-badges">
          <span class="badge ${player.active ? "green" : "neutral"}">${player.active ? "פעיל" : "לא פעיל"}</span>
          <span class="badge ${trend.tone}">${escapeHtml(trend.label)}</span>
          ${readinessStatus}
          ${profileHydration}
        </div>
      </div>
      <div class="profile-status-strip">
        <div>
          <span>מוכנות</span>
          <strong>${lastReadiness ? escapeHtml(formatInteger(lastReadiness.readinessScore)) : "אין נתון"}</strong>
        </div>
        <div>
          <span>עומס שבועי</span>
          <strong>${escapeHtml(formatInteger(currentSummary.totalLoad))}</strong>
        </div>
        <div>
          <span>שינוי עומס</span>
          <strong>${escapeHtml(formatPercent(change))}</strong>
        </div>
        <div>
          <span>הידרציה</span>
          <strong>${lastPost && lastPost.hydration ? escapeHtml(lastPost.hydration.status) : "אין נתון"}</strong>
        </div>
      </div>
      <a href="/coach/players" data-route class="btn secondary">חזרה לשחקנים</a>
    </section>

    <nav class="profile-tabs" aria-label="אזורי פרופיל">
      ${profileTabs.map((item) => `<a href="#${escapeAttr(item)}">${escapeHtml(item)}</a>`).join("")}
    </nav>

    <section class="metric-grid">
      ${metricCard("עומס שבועי", formatInteger(currentSummary.totalLoad), "יחידות עומס")}
      ${metricCard("שבוע קודם", formatInteger(previousSummary.totalLoad), "יחידות עומס")}
      ${metricCard("שינוי בעומס", formatPercent(change), "לעומת שבוע קודם")}
      ${metricCard("מוכנות אחרונה", lastReadiness ? formatInteger(lastReadiness.readinessScore) : "אין נתון", "מתוך 100")}
      ${metricCard("RPE ממוצע", formatNumber(currentSummary.avgRpe), "השבוע")}
      ${metricCard("עייפות ממוצעת", formatNumber(currentSummary.avgFatigue), "אחרי אימון")}
      ${metricCard("כאבי שריר", formatNumber(currentSummary.avgSoreness), "ממוצע")}
      ${metricCard("שעות שינה", formatNumber(currentSummary.avgSleep), "ממוצע")}
      ${metricCard("משקל לפני", lastPost && lastPost.hydration ? `${formatNumber(lastPost.hydration.preTrainingWeight)} ק\"ג` : "אין נתון", "דוח אחרון")}
      ${metricCard("משקל אחרי", lastPost && lastPost.hydration ? `${formatNumber(lastPost.hydration.postTrainingWeight)} ק\"ג` : "אין נתון", "דוח אחרון")}
      ${metricCard("ירידה במשקל", lastPost && lastPost.hydration ? `${formatNumber(lastPost.hydration.lossKg)} ק\"ג` : "אין נתון", lastPost && lastPost.hydration ? `${formatNumber(lastPost.hydration.lossPercent)}%` : "")}
      ${metricCard("סטטוס הידרציה", lastPost && lastPost.hydration ? lastPost.hydration.status : "אין נתון", "דוח אחרון")}
    </section>

    <section class="charts-grid section">
      ${chartCard("עומס יומי לאורך זמן", renderLineChart(postSeries, "trainingLoad", "עומס"))}
      ${chartCard("עומס שבועי", renderLineChart(weeklyLoadSeries, "totalLoad", "עומס שבועי"))}
      ${chartCard("RPE לאורך זמן", renderLineChart(postSeries, "rpe", "RPE"))}
      ${chartCard("עייפות אחרי אימון", renderLineChart(postSeries, "fatigue", "עייפות"))}
      ${chartCard("ציון מוכנות לאורך זמן", renderLineChart(readinessSeries, "readinessScore", "ציון מוכנות"))}
      ${chartCard("שעות שינה", renderLineChart(readinessSeries, "sleepHours", "שינה"))}
      ${chartCard("כאבי שריר", renderLineChart(readinessSeries, "soreness", "כאבי שריר"))}
      ${chartCard("אובדן נוזלים %", renderLineChart(hydrationSeries, "hydrationLossPercent", "אובדן נוזלים"))}
      <div class="surface chart-card">
        <h3>היסטוריית כאב</h3>
        ${renderPainHistory(painHistory)}
      </div>
    </section>

    <section class="split section">
      <div>
        <div class="section-title">
          <h3>הערות מאמן / הערות דוח</h3>
          <span>${comments.length} הערות</span>
        </div>
        ${renderCommentsList(comments)}
      </div>
      <div>
        <div class="section-title">
          <h3>דוח מוכנות אחרון</h3>
          <span>${lastReadiness ? escapeHtml(formatDateDisplay(lastReadiness.date)) : "אין"}</span>
        </div>
        ${lastReadiness ? renderReadinessCard(lastReadiness) : `<div class="surface empty">אין דוח מוכנות</div>`}
      </div>
    </section>

    <section class="section">
      <div class="section-title">
        <h3>היסטוריית הידרציה</h3>
        <span>${hydrationSeries.length} רשומות</span>
      </div>
      ${renderHydrationHistory(hydrationSeries)}
    </section>

    <section class="section">
      <div class="section-title">
        <h3>GPS</h3>
        <span>${gpsRecords.length} רשומות</span>
      </div>
      ${renderPlayerGpsTable(gpsRecords)}
    </section>

    <section class="charts-grid section">
      ${chartCard("GPS - מרחק כולל", renderLineChart(gpsFullRecords, "totalDistance", "מרחק כולל"))}
      ${chartCard("GPS - HSR", renderLineChart(gpsFullRecords, "highSpeedRunning", "HSR"))}
      ${chartCard("GPS - מעל 25 קמ״ש", renderLineChart(gpsFullRecords, "distanceAbove25", "מעל 25"))}
      ${chartCard("GPS - מהירות מקסימלית", renderLineChart(gpsFullRecords, "maxSpeed", "מהירות"))}
      ${chartCard("האצות והאטות", renderDualLineChart(gpsFullRecords, "accelerations", "decelerations", "האצות", "האטות"))}
      ${chartCard("עומס פנימי מול חיצוני", renderDualLineChart(internalExternalSeries, "internalLoad", "gpsLoad", "עומס RPE", "עומס GPS"))}
    </section>

    <section class="section">
      <div class="section-title">
        <h3>השוואה לממוצעים</h3>
        <span>שחקן מול עצמו ומול עמדה</span>
      </div>
      ${renderGpsAverageComparison(player.id, gpsFullRecords)}
    </section>

    <section class="section">
      <div class="section-title">
        <h3>כל דוחות RPE</h3>
        <span>${postReports.length} רשומות</span>
      </div>
      ${renderReportsTable(postReports, true)}
    </section>

    <section class="section">
      <div class="section-title">
        <h3>כל דוחות המוכנות</h3>
        <span>${readinessReports.length} רשומות</span>
      </div>
      ${renderReadinessTable(readinessReports)}
    </section>
  `);

  mount(html);
}

function renderSessionsPage() {
  const activePlayers = getActivePlayers();
  const editing = uiState.sessionEditId ? state.sessions.find((sessionItem) => sessionItem.id === uiState.sessionEditId) : null;
  const sortedSessions = [...state.sessions].sort((a, b) => b.date.localeCompare(a.date));

  const html = coachShell("sessions", `
    <div class="page-header premium-header">
      <div>
        <span class="eyebrow">אימונים</span>
        <h2>ניהול אימונים</h2>
        <p>דקות נקבעות על ידי המאמן בלבד</p>
      </div>
      ${editing ? `<button class="btn ghost" type="button" id="cancelSessionEdit">ביטול עריכה</button>` : ""}
    </div>

    <form id="sessionForm" class="surface form-panel grid">
      <input type="hidden" name="sessionId" value="${escapeAttr(editing ? editing.id : "")}" />
      <div class="grid three">
        <div class="field">
          <label for="sessionDate">תאריך</label>
          <input id="sessionDate" name="date" type="date" value="${escapeAttr(editing ? editing.date : todayIso())}" required />
        </div>
        <div class="field">
          <label for="coachSessionType">סוג מפגש</label>
          <select id="coachSessionType" name="sessionType" required>
            ${renderSimpleOptions(SESSION_TYPES, editing ? editing.sessionType : "אימון")}
          </select>
        </div>
        <div class="field">
          <label for="defaultMinutes">דקות ברירת מחדל</label>
          <input id="defaultMinutes" name="defaultMinutes" type="number" min="0" max="140" step="1" value="${escapeAttr(editing ? editing.defaultMinutes : 75)}" required />
        </div>
      </div>

      <div class="field">
        <label for="sessionNotes">הערות</label>
        <textarea id="sessionNotes" name="notes">${escapeHtml(editing ? editing.notes : "")}</textarea>
      </div>

      <div class="field">
        <span class="field-label">דקות אישיות לשחקן</span>
        <div class="session-minutes">
          ${activePlayers.map((player) => {
            const value = editing && editing.playerMinutes && editing.playerMinutes[player.id] !== undefined ? editing.playerMinutes[player.id] : "";
            return `
              <label class="player-minute">
                <span>${escapeHtml(player.name)}</span>
                <input name="minutes-${escapeAttr(player.id)}" type="number" min="0" max="140" step="1" value="${escapeAttr(value)}" placeholder="ברירת מחדל" />
              </label>
            `;
          }).join("")}
        </div>
      </div>

      <div class="actions">
        <button class="btn primary" type="submit">${editing ? "שמור אימון" : "צור אימון"}</button>
      </div>
    </form>

    <section class="section">
      <div class="section-title">
        <h3>אימונים קיימים</h3>
        <span>${sortedSessions.length} רשומות</span>
      </div>
      ${renderSessionsTable(sortedSessions)}
    </section>
  `);

  mount(html, bindSessionsPage);
}

function bindSessionsPage() {
  const form = document.getElementById("sessionForm");
  const cancelButton = document.getElementById("cancelSessionEdit");
  if (cancelButton) {
    cancelButton.addEventListener("click", () => {
      uiState.sessionEditId = null;
      renderSessionsPage();
    });
  }
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const sessionId = String(data.get("sessionId") || "");
    const playerMinutes = {};
    getActivePlayers().forEach((player) => {
      const raw = String(data.get(`minutes-${player.id}`) || "").trim();
      if (raw !== "") playerMinutes[player.id] = Number(raw);
    });
    const nextSession = {
      id: sessionId || createId("s"),
      date: String(data.get("date") || todayIso()),
      sessionType: String(data.get("sessionType") || "אימון"),
      defaultMinutes: numberFromForm(data, "defaultMinutes"),
      notes: String(data.get("notes") || "").trim(),
      playerMinutes
    };
    if (sessionId) {
      state.sessions = state.sessions.map((item) => (item.id === sessionId ? nextSession : item));
    } else {
      state.sessions.unshift(nextSession);
    }
    uiState.sessionEditId = null;
    saveState();
    renderSessionsPage();
  });
  document.querySelectorAll("[data-edit-session]").forEach((button) => {
    button.addEventListener("click", () => {
      uiState.sessionEditId = button.getAttribute("data-edit-session");
      renderSessionsPage();
    });
  });
  document.querySelectorAll("[data-delete-session]").forEach((button) => {
    button.addEventListener("click", () => {
      if (!confirm("למחוק אימון?")) return;
      const sessionId = button.getAttribute("data-delete-session");
      state.sessions = state.sessions.filter((item) => item.id !== sessionId);
      saveState();
      renderSessionsPage();
    });
  });
}

function renderGpsPage() {
  const filters = uiState.gpsFilters;
  const metric = filters.metric || "totalDistance";
  const records = getFilteredGpsRecords();
  const allRecords = state.gpsRecords.map(getComputedGpsRecord);
  const selectedSession = getSelectedGpsSession();
  const positions = unique(allRecords.map((record) => record.position).filter(Boolean)).sort();
  const dates = unique(state.gpsSessions.map((sessionItem) => sessionItem.date)).sort().reverse();
  const html = coachShell("gps", `
    <div class="page-header premium-header">
      <div>
        <span class="eyebrow">GPS</span>
        <h2>GPS</h2>
        <p>ייבוא, ניתוח והשוואת עומס חיצוני מול דוחות RPE ומוכנות</p>
      </div>
      <button class="btn secondary" id="clearGpsImport" type="button">נקה ייבוא</button>
    </div>

    ${renderGpsImportPanel()}

    <section class="section surface">
      <div class="filters gps-filters">
        ${filterSelect("gpsDateFilter", "תאריך", ["הכול", ...dates.map(formatDateDisplay)], filters.date, ["all", ...dates])}
        ${filterSelect("gpsSessionFilter", "מפגש", ["הכול", ...state.gpsSessions.map((sessionItem) => sessionItem.sessionName)], filters.sessionId, ["all", ...state.gpsSessions.map((sessionItem) => sessionItem.id)])}
        ${filterSelect("gpsPlayerFilter", "שחקן", playerFilterOptions(), filters.playerId, playerFilterValues())}
        ${filterSelect("gpsPositionFilter", "עמדה", ["הכול", ...positions], filters.position, ["all", ...positions])}
        ${filterSelect("gpsPeriodFilter", "תקופה", ["הכול", ...GPS_PERIODS], filters.period, ["all", ...GPS_PERIODS])}
        ${filterSelect("gpsMetricFilter", "מדד", GPS_METRICS.map((item) => item[1]), metric, GPS_METRICS.map((item) => item[0]))}
      </div>
    </section>

    <section class="metric-grid section">
      ${metricCard("רשומות GPS", records.length, selectedSession ? selectedSession.sessionName : "כל המפגשים")}
      ${metricCard("מרחק כולל", formatInteger(sum(records.map((record) => record.totalDistance))), "מטרים")}
      ${metricCard("HSR", formatInteger(sum(records.map((record) => record.highSpeedRunning))), "מטרים")}
      ${metricCard("עומס GPS ממוצע", formatInteger(average(records.map((record) => record.gpsLoad))), "משוער")}
    </section>

    <section class="section">
      <div class="section-title">
        <h3>דגלי GPS ועומס פנימי</h3>
        <span>${sum(records.map((record) => record.riskFlags.length ? 1 : 0))} שחקנים</span>
      </div>
      ${renderGpsRiskPanel(records)}
    </section>

    <section class="section">
      <div class="section-title">
        <h3>סקירת משחק / אימון</h3>
        <span>${records.length} רשומות</span>
      </div>
      ${renderGpsTable(records)}
    </section>

    <section class="section">
      <div class="section-title">
        <h3>Top 5</h3>
        <span>מדדים מרכזיים</span>
      </div>
      <div class="top-grid">
        ${renderGpsTopList(records, "totalDistance", "מרחק כולל")}
        ${renderGpsTopList(records, "highSpeedRunning", "HSR")}
        ${renderGpsTopList(records, "distanceAbove25", "מעל 25 קמ״ש")}
        ${renderGpsTopList(records, "maxSpeed", "מהירות מקסימלית")}
        ${renderGpsTopList(records, "accelerations", "האצות")}
        ${renderGpsTopList(records, "decelerations", "האטות")}
      </div>
    </section>

    <section class="charts-grid section">
      ${chartCard(`מדד לפי שחקן - ${escapeHtml(getGpsMetricLabel(metric))}`, renderBarChart(records.filter((record) => record.period === "משחק מלא" || filters.period !== "all"), metric))}
      ${chartCard("מחצית ראשונה מול שנייה", renderPeriodComparisonChart(records, metric))}
      ${chartCard("ממוצע לפי עמדה", renderPositionAverageChart(records, metric))}
      ${chartCard("שחקן מול ממוצע קבוצה", renderPlayerVsTeamAverageChart(records, metric))}
    </section>
  `);

  mount(html, bindGpsPage);
}

function bindGpsPage() {
  const clearButton = document.getElementById("clearGpsImport");
  if (clearButton) clearButton.addEventListener("click", () => {
    uiState.gpsImport = null;
    renderGpsPage();
  });
  const fileInput = document.getElementById("gpsFileInput");
  if (fileInput) {
    fileInput.addEventListener("change", async () => {
      const file = fileInput.files && fileInput.files[0];
      if (!file) return;
      try {
        const parsed = await parseGpsFile(file);
        uiState.gpsImport = {
          fileName: file.name,
          headers: parsed.headers,
          rows: parsed.rows,
          mapping: createAutoGpsMapping(parsed.headers),
          playerMatches: {},
          sessionType: "match",
          opponent: "",
          notes: ""
        };
        renderGpsPage();
      } catch (error) {
        alert(error.message || "לא ניתן לקרוא את הקובץ");
      }
    });
  }
  document.querySelectorAll("[data-gps-map]").forEach((select) => {
    select.addEventListener("change", () => {
      if (!uiState.gpsImport) return;
      uiState.gpsImport.mapping[select.getAttribute("data-gps-map")] = select.value;
      renderGpsPage();
    });
  });
  document.querySelectorAll("[data-gps-match]").forEach((select) => {
    select.addEventListener("change", () => {
      if (!uiState.gpsImport) return;
      uiState.gpsImport.playerMatches[select.getAttribute("data-gps-match")] = select.value;
      renderGpsPage();
    });
  });
  ["gpsImportType", "gpsImportOpponent", "gpsImportNotes"].forEach((id) => {
    const input = document.getElementById(id);
    if (!input || !uiState.gpsImport) return;
    input.addEventListener("input", () => {
      if (id === "gpsImportType") uiState.gpsImport.sessionType = input.value;
      if (id === "gpsImportOpponent") uiState.gpsImport.opponent = input.value;
      if (id === "gpsImportNotes") uiState.gpsImport.notes = input.value;
    });
  });
  const saveImport = document.getElementById("saveGpsImport");
  if (saveImport) saveImport.addEventListener("click", saveGpsImport);

  [
    ["gpsDateFilter", "date"],
    ["gpsSessionFilter", "sessionId"],
    ["gpsPlayerFilter", "playerId"],
    ["gpsPositionFilter", "position"],
    ["gpsPeriodFilter", "period"],
    ["gpsMetricFilter", "metric"]
  ].forEach(([id, key]) => {
    const input = document.getElementById(id);
    if (!input) return;
    input.addEventListener("change", () => {
      uiState.gpsFilters[key] = input.value || "all";
      renderGpsPage();
    });
  });
}

function renderGpsImportPanel() {
  const importState = uiState.gpsImport;
  if (!importState) {
    return `
      <section class="surface form-panel grid">
        <div class="section-title">
          <h3>ייבוא דוח GPS</h3>
          <span>CSV או Excel XLSX</span>
        </div>
        <div class="field">
          <label for="gpsFileInput">בחירת קובץ</label>
          <input id="gpsFileInput" type="file" accept=".csv,.tsv,.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv" />
        </div>
      </section>
    `;
  }
  const mappedRows = mapGpsImportRows(importState).slice(0, 8);
  const unmatchedNames = getGpsUnmatchedNames(importState);
  return `
    <section class="surface form-panel grid">
      <div class="section-title">
        <h3>מיפוי עמודות</h3>
        <span>${escapeHtml(importState.fileName)} · ${importState.rows.length} שורות</span>
      </div>
      <div class="grid three">
        <div class="field">
          <label for="gpsImportType">סוג מפגש</label>
          <select id="gpsImportType">
            <option value="match" ${importState.sessionType === "match" ? "selected" : ""}>משחק</option>
            <option value="training" ${importState.sessionType === "training" ? "selected" : ""}>אימון</option>
          </select>
        </div>
        <div class="field">
          <label for="gpsImportOpponent">יריבה</label>
          <input id="gpsImportOpponent" value="${escapeAttr(importState.opponent || "")}" placeholder="אופציונלי" />
        </div>
        <div class="field">
          <label for="gpsImportNotes">הערות</label>
          <input id="gpsImportNotes" value="${escapeAttr(importState.notes || "")}" />
        </div>
      </div>
      <div class="mapping-grid">
        ${GPS_FIELDS.map(([field, label]) => `
          <div class="field">
            <label>${escapeHtml(label)}${GPS_REQUIRED_FIELDS.includes(field) ? " *" : ""}</label>
            <select data-gps-map="${escapeAttr(field)}">
              <option value="">לא למפות</option>
              ${importState.headers.map((header) => `<option value="${escapeAttr(header)}" ${importState.mapping[field] === header ? "selected" : ""}>${escapeHtml(header)}</option>`).join("")}
            </select>
          </div>
        `).join("")}
      </div>
      ${unmatchedNames.length ? `
        <div class="section-title">
          <h3>התאמת שמות שחקנים</h3>
          <span>${unmatchedNames.length} לא זוהו אוטומטית</span>
        </div>
        <div class="mapping-grid">
          ${unmatchedNames.map((name) => `
            <div class="field">
              <label>${escapeHtml(name)}</label>
              <select data-gps-match="${escapeAttr(name)}">
                <option value="">בחירה</option>
                ${state.players.map((player) => `<option value="${escapeAttr(player.id)}" ${importState.playerMatches[name] === player.id ? "selected" : ""}>${escapeHtml(player.name)}</option>`).join("")}
              </select>
            </div>
          `).join("")}
        </div>
      ` : ""}
      <div class="section-title">
        <h3>תצוגה מקדימה</h3>
        <span>${mappedRows.length} שורות ראשונות</span>
      </div>
      ${renderGpsImportPreview(mappedRows)}
      <div class="actions">
        <button id="saveGpsImport" class="btn primary" type="button">שמור GPS</button>
      </div>
    </section>
  `;
}

function renderGpsImportPreview(rows) {
  if (!rows.length) return `<div class="empty">אין שורות להצגה</div>`;
  return `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>תאריך</th>
            <th>שחקן</th>
            <th>עמדה</th>
            <th>מפגש</th>
            <th>תקופה</th>
            <th>דקות</th>
            <th>מרחק</th>
            <th>HSR</th>
            <th>מעל 25</th>
            <th>מהירות מקס׳</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map((row) => `
            <tr>
              <td>${escapeHtml(row.date || "חסר")}</td>
              <td>${escapeHtml(row.playerName || "חסר")}</td>
              <td>${escapeHtml(row.position || "")}</td>
              <td>${escapeHtml(row.sessionName || "חסר")}</td>
              <td>${escapeHtml(row.period || "")}</td>
              <td>${escapeHtml(formatNumber(row.minutesPlayed))}</td>
              <td>${escapeHtml(formatInteger(row.totalDistance))}</td>
              <td>${escapeHtml(formatInteger(row.highSpeedRunning))}</td>
              <td>${escapeHtml(formatInteger(row.distanceAbove25))}</td>
              <td>${escapeHtml(formatNumber(row.maxSpeed))}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function saveGpsImport() {
  const importState = uiState.gpsImport;
  if (!importState) return;
  const missingFields = GPS_REQUIRED_FIELDS.filter((field) => !importState.mapping[field]);
  if (missingFields.length) {
    alert("חסרים שדות חובה במיפוי");
    return;
  }
  const rows = mapGpsImportRows(importState);
  const unmatched = getGpsUnmatchedNames(importState);
  const unresolved = unmatched.filter((name) => !importState.playerMatches[name]);
  if (unresolved.length) {
    alert("יש להתאים את כל שמות השחקנים לפני שמירה");
    return;
  }
  const first = rows[0];
  if (!first) return;
  const sessionId = createId("gps-session");
  const gpsSession = {
    id: sessionId,
    date: first.date || todayIso(),
    sessionName: first.sessionName || "GPS",
    type: importState.sessionType || "match",
    opponent: importState.opponent || "",
    notes: importState.notes || ""
  };
  const records = rows.map((row, index) => {
    const player = findGpsMatchedPlayer(row.playerName, importState);
    return {
      id: createId(`gps-${index}`),
      gpsSessionId: sessionId,
      playerId: player ? player.id : "",
      playerName: player ? player.name : row.playerName,
      position: row.position || "",
      period: normalizeGpsPeriod(row.period),
      minutesPlayed: Number(row.minutesPlayed) || 0,
      totalDistance: Number(row.totalDistance) || 0,
      distancePerMinute: Number(row.distancePerMinute) || 0,
      intensity: Number(row.intensity) || 0,
      gpsLoad: Number(row.gpsLoad) || 0,
      metabolicActivity: Number(row.metabolicActivity) || 0,
      hmld: Number(row.hmld) || 0,
      highSpeedRunning: Number(row.highSpeedRunning) || 0,
      distanceAbove18: Number(row.distanceAbove18) || 0,
      distanceAbove25: Number(row.distanceAbove25) || 0,
      maxSpeed: Number(row.maxSpeed) || 0,
      workRestRatio: Number(row.workRestRatio) || 0,
      accelerations: Number(row.accelerations) || 0,
      decelerations: Number(row.decelerations) || 0
    };
  });
  state.gpsSessions.unshift(gpsSession);
  state.gpsRecords.unshift(...records);
  saveState();
  uiState.gpsImport = null;
  uiState.gpsFilters.sessionId = sessionId;
  uiState.gpsFilters.date = gpsSession.date;
  renderGpsPage();
}

function getFilteredGpsRecords() {
  const filters = uiState.gpsFilters;
  return state.gpsRecords
    .map(getComputedGpsRecord)
    .filter((record) => {
      if (filters.date !== "all" && record.date !== filters.date) return false;
      if (filters.sessionId !== "all" && record.gpsSessionId !== filters.sessionId) return false;
      if (filters.playerId !== "all" && record.playerId !== filters.playerId) return false;
      if (filters.position !== "all" && record.position !== filters.position) return false;
      if (filters.period !== "all" && record.period !== filters.period) return false;
      return true;
    });
}

function getSelectedGpsSession() {
  const sessionId = uiState.gpsFilters.sessionId;
  if (!sessionId || sessionId === "all") return null;
  return state.gpsSessions.find((sessionItem) => sessionItem.id === sessionId) || null;
}

function getComputedGpsRecord(record) {
  const sessionItem = state.gpsSessions.find((item) => item.id === record.gpsSessionId) || null;
  const player = getPlayer(record.playerId);
  const computed = {
    ...record,
    playerName: player ? player.name : record.playerName,
    date: sessionItem ? sessionItem.date : "",
    sessionName: sessionItem ? sessionItem.sessionName : "",
    sessionType: sessionItem ? sessionItem.type : "",
    riskFlags: []
  };
  computed.riskFlags = getGpsRiskFlags(computed);
  return computed;
}

function getGpsRiskFlags(record) {
  const flags = [];
  const post = getPostReportFor(record.playerId, record.date);
  const readinessRaw = getReadinessFor(record.playerId, record.date);
  const readiness = readinessRaw ? getComputedReadiness(readinessRaw) : null;
  const postComputed = post ? getComputedReport(post) : null;
  const painAreas = [readinessRaw && readinessRaw.painArea, post && post.painArea].filter(Boolean);
  const hasHamstringGroinPain = painAreas.some((area) => area === "המסטרינג" || area === "מפשעה" || area === "מקרבים");
  const secondDrop = getGpsSecondHalfDrop(record);

  if (record.gpsLoad >= 800 && post && post.rpe >= state.settings.rpeHigh) flags.push("עומס GPS גבוה + RPE גבוה");
  if ((record.highSpeedRunning >= 650 || record.distanceAbove25 >= 180) && hasHamstringGroinPain) flags.push("HSR גבוה + כאב המסטרינג/מפשעה");
  if (readiness && readiness.readinessScore < 60 && record.minutesPlayed >= 60) flags.push("מוכנות נמוכה + דקות גבוהות");
  if (record.minutesPlayed >= 60 && postComputed && postComputed.hydration && postComputed.hydration.tone !== "green") flags.push("דקות גבוהות + סיכון הידרציה");
  if (secondDrop && (secondDrop.distancePerMinuteDrop > 15 || secondDrop.intensityDrop > 15)) flags.push("ירידה חדה במחצית השנייה");
  if ((record.accelerations >= 35 || record.decelerations >= 35) && ((post && post.soreness >= 4) || (readinessRaw && readinessRaw.soreness >= 4))) flags.push("האצות/האטות גבוהות + כאבי שריר");
  return unique(flags);
}

function getGpsSecondHalfDrop(record) {
  const first = state.gpsRecords.find((item) => item.gpsSessionId === record.gpsSessionId && item.playerId === record.playerId && normalizeGpsPeriod(item.period) === "מחצית ראשונה");
  const second = state.gpsRecords.find((item) => item.gpsSessionId === record.gpsSessionId && item.playerId === record.playerId && normalizeGpsPeriod(item.period) === "מחצית שנייה");
  if (!first || !second) return null;
  return {
    distancePerMinuteDrop: percentageDrop(first.distancePerMinute, second.distancePerMinute),
    intensityDrop: percentageDrop(first.intensity, second.intensity)
  };
}

function percentageDrop(first, second) {
  const start = Number(first);
  const end = Number(second);
  if (!Number.isFinite(start) || !Number.isFinite(end) || start <= 0) return 0;
  return ((start - end) / start) * 100;
}

function renderGpsRiskPanel(records) {
  const risky = records.filter((record) => record.riskFlags.length);
  if (!risky.length) return `<div class="surface empty">אין דגלי GPS</div>`;
  return `
    <div class="surface mini-list">
      ${risky.map((record) => `
        <div class="mini-row">
          <a href="/coach/player/${escapeAttr(record.playerId)}" data-route class="table-link">${escapeHtml(record.playerName)}</a>
          ${renderRiskBadges(record.riskFlags)}
        </div>
      `).join("")}
    </div>
  `;
}

function renderGpsTable(records) {
  if (!records.length) return `<div class="surface empty">אין נתוני GPS להצגה</div>`;
  return `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>תאריך</th>
            <th>מפגש</th>
            <th>שחקן</th>
            <th>עמדה</th>
            <th>תקופה</th>
            <th>דקות</th>
            <th>מרחק</th>
            <th>מ׳/דקה</th>
            <th>עצימות</th>
            <th>עומס GPS</th>
            <th>HMLD</th>
            <th>HSR</th>
            <th>מעל 18</th>
            <th>מעל 25</th>
            <th>מהירות מקס׳</th>
            <th>עבודה/מנוחה</th>
            <th>האצות</th>
            <th>האטות</th>
            <th>דגלים</th>
          </tr>
        </thead>
        <tbody>
          ${records.map((record) => `
            <tr>
              <td>${escapeHtml(formatDateDisplay(record.date))}</td>
              <td>${escapeHtml(record.sessionName)}</td>
              <td><a href="/coach/player/${escapeAttr(record.playerId)}" data-route class="table-link">${escapeHtml(record.playerName)}</a></td>
              <td>${escapeHtml(record.position)}</td>
              <td>${escapeHtml(record.period)}</td>
              <td>${escapeHtml(formatNumber(record.minutesPlayed))}</td>
              <td>${escapeHtml(formatInteger(record.totalDistance))}</td>
              <td>${escapeHtml(formatNumber(record.distancePerMinute))}</td>
              <td>${escapeHtml(formatNumber(record.intensity))}</td>
              <td>${escapeHtml(formatInteger(record.gpsLoad))}</td>
              <td>${escapeHtml(formatInteger(record.hmld))}</td>
              <td>${escapeHtml(formatInteger(record.highSpeedRunning))}</td>
              <td>${escapeHtml(formatInteger(record.distanceAbove18))}</td>
              <td>${escapeHtml(formatInteger(record.distanceAbove25))}</td>
              <td>${escapeHtml(formatNumber(record.maxSpeed))}</td>
              <td>${escapeHtml(formatNumber(record.workRestRatio))}</td>
              <td>${escapeHtml(formatInteger(record.accelerations))}</td>
              <td>${escapeHtml(formatInteger(record.decelerations))}</td>
              <td>${renderRiskBadges(record.riskFlags)}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderGpsTopList(records, metric, title) {
  const rows = getFullPeriodPreferred(records)
    .sort((a, b) => (Number(b[metric]) || 0) - (Number(a[metric]) || 0))
    .slice(0, 5);
  return `
    <article class="surface top-card">
      <h3>${escapeHtml(title)}</h3>
      ${rows.length ? rows.map((record, index) => `
        <div class="mini-row">
          <span>${index + 1}. ${escapeHtml(record.playerName)}</span>
          <strong>${escapeHtml(formatNumber(record[metric]))}</strong>
        </div>
      `).join("") : `<div class="empty">אין נתונים</div>`}
    </article>
  `;
}

function getFullPeriodPreferred(records) {
  const full = records.filter((record) => record.period === "משחק מלא");
  return full.length ? full : records;
}

function renderBarChart(records, metric) {
  const rows = getFullPeriodPreferred(records).map((record) => ({ label: record.playerName, value: Number(record[metric]) || 0 }));
  return renderSimpleBarChart(rows, metric);
}

function renderPeriodComparisonChart(records, metric) {
  const first = records.filter((record) => record.period === "מחצית ראשונה");
  const second = records.filter((record) => record.period === "מחצית שנייה");
  const labels = unique([...first.map((record) => record.playerName), ...second.map((record) => record.playerName)]);
  const rows = labels.map((label) => {
    const firstRecord = first.find((record) => record.playerName === label);
    const secondRecord = second.find((record) => record.playerName === label);
    return {
      label,
      value: Number(firstRecord ? firstRecord[metric] : 0) || 0,
      value2: Number(secondRecord ? secondRecord[metric] : 0) || 0
    };
  });
  return renderSimpleBarChart(rows, metric, "מחצית 1", "מחצית 2");
}

function renderPositionAverageChart(records, metric) {
  const positions = unique(records.map((record) => record.position).filter(Boolean));
  const rows = positions.map((position) => {
    const group = records.filter((record) => record.position === position && (record.period === "משחק מלא" || uiState.gpsFilters.period !== "all"));
    return { label: position, value: average(group.map((record) => record[metric])) || 0 };
  });
  return renderSimpleBarChart(rows, metric);
}

function renderPlayerVsTeamAverageChart(records, metric) {
  const fullRecords = getFullPeriodPreferred(records);
  const teamAvg = average(fullRecords.map((record) => record[metric])) || 0;
  const rows = fullRecords.map((record) => ({ label: record.playerName, value: Number(record[metric]) || 0, value2: teamAvg }));
  return renderSimpleBarChart(rows, metric, "שחקן", "ממוצע קבוצה");
}

function renderSimpleBarChart(rows, metric, label1 = getGpsMetricLabel(metric), label2 = "") {
  if (!rows.length) return `<div class="empty">אין נתונים לגרף</div>`;
  const width = 680;
  const rowHeight = 34;
  const height = Math.max(180, rows.length * rowHeight + 42);
  const maxValue = Math.max(...rows.flatMap((row) => [Number(row.value) || 0, Number(row.value2) || 0]), 1);
  const chartWidth = width - 160;
  return `
    <svg class="chart-svg bar-chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeAttr(label1)}">
      ${rows.map((row, index) => {
        const y = 24 + index * rowHeight;
        const w1 = ((Number(row.value) || 0) / maxValue) * chartWidth;
        const w2 = ((Number(row.value2) || 0) / maxValue) * chartWidth;
        return `
          <text class="chart-label" x="${width - 8}" y="${y + 14}" text-anchor="end">${escapeHtml(row.label)}</text>
          <rect class="bar-primary" x="72" y="${y}" width="${w1}" height="12" rx="4"></rect>
          ${label2 ? `<rect class="bar-secondary" x="72" y="${y + 15}" width="${w2}" height="10" rx="4"></rect>` : ""}
          <text class="chart-label" x="8" y="${y + 13}">${escapeHtml(formatNumber(row.value))}</text>
        `;
      }).join("")}
      <text class="chart-label" x="72" y="${height - 8}">${escapeHtml(label1)}${label2 ? ` / ${escapeHtml(label2)}` : ""}</text>
    </svg>
  `;
}

function getGpsMetricLabel(metric) {
  const item = GPS_METRICS.find(([key]) => key === metric);
  return item ? item[1] : metric;
}

async function parseGpsFile(file) {
  const lower = file.name.toLowerCase();
  if (lower.endsWith(".xlsx")) return parseXlsxFile(await file.arrayBuffer());
  if (lower.endsWith(".csv") || lower.endsWith(".tsv") || lower.endsWith(".txt")) return parseCsvText(await file.text());
  throw new Error("סוג קובץ לא נתמך. ניתן להעלות CSV או XLSX");
}

function parseCsvText(text) {
  const rows = [];
  let row = [];
  let value = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];
    if (char === '"' && inQuotes && next === '"') {
      value += '"';
      i += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (!inQuotes && (char === "," || char === ";" || char === "\t")) {
      row.push(value.trim());
      value = "";
    } else if (!inQuotes && (char === "\n" || char === "\r")) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(value.trim());
      if (row.some((cell) => cell !== "")) rows.push(row);
      row = [];
      value = "";
    } else {
      value += char;
    }
  }
  row.push(value.trim());
  if (row.some((cell) => cell !== "")) rows.push(row);
  return tableRowsToObjects(rows);
}

async function parseXlsxFile(buffer) {
  const entries = await unzipXlsxEntries(buffer);
  const sharedStrings = parseSharedStrings(entries.get("xl/sharedStrings.xml") || "");
  const sheetName = Array.from(entries.keys()).find((name) => /^xl\/worksheets\/sheet\d+\.xml$/.test(name));
  if (!sheetName) throw new Error("לא נמצא גיליון בקובץ Excel");
  const sheetRows = parseSheetXml(entries.get(sheetName), sharedStrings);
  return tableRowsToObjects(sheetRows);
}

function tableRowsToObjects(tableRows) {
  const cleanRows = tableRows.filter((row) => row.some((cell) => String(cell || "").trim() !== ""));
  if (!cleanRows.length) return { headers: [], rows: [] };
  const headers = cleanRows[0].map((header, index) => String(header || `עמודה ${index + 1}`).trim());
  const rows = cleanRows.slice(1).map((row) => {
    const object = {};
    headers.forEach((header, index) => {
      object[header] = row[index] === undefined ? "" : row[index];
    });
    return object;
  });
  return { headers, rows };
}

async function unzipXlsxEntries(buffer) {
  if (typeof DecompressionStream === "undefined") {
    throw new Error("הדפדפן הנוכחי לא תומך בקריאת XLSX. אפשר להעלות CSV במקום");
  }
  const bytes = new Uint8Array(buffer);
  const eocdOffset = findZipEndOfCentralDirectory(bytes);
  if (eocdOffset < 0) throw new Error("קובץ Excel לא תקין");
  const view = new DataView(bytes.buffer);
  const centralDirectorySize = view.getUint32(eocdOffset + 12, true);
  const centralDirectoryOffset = view.getUint32(eocdOffset + 16, true);
  const entries = new Map();
  let offset = centralDirectoryOffset;
  while (offset < centralDirectoryOffset + centralDirectorySize) {
    if (view.getUint32(offset, true) !== 0x02014b50) break;
    const method = view.getUint16(offset + 10, true);
    const compressedSize = view.getUint32(offset + 20, true);
    const nameLength = view.getUint16(offset + 28, true);
    const extraLength = view.getUint16(offset + 30, true);
    const commentLength = view.getUint16(offset + 32, true);
    const localOffset = view.getUint32(offset + 42, true);
    const name = decodeUtf8(bytes.slice(offset + 46, offset + 46 + nameLength));
    const localNameLength = view.getUint16(localOffset + 26, true);
    const localExtraLength = view.getUint16(localOffset + 28, true);
    const dataStart = localOffset + 30 + localNameLength + localExtraLength;
    const compressed = bytes.slice(dataStart, dataStart + compressedSize);
    const data = method === 0 ? compressed : await inflateRaw(compressed);
    entries.set(name, decodeUtf8(data));
    offset += 46 + nameLength + extraLength + commentLength;
  }
  return entries;
}

function findZipEndOfCentralDirectory(bytes) {
  for (let i = bytes.length - 22; i >= 0; i -= 1) {
    if (bytes[i] === 0x50 && bytes[i + 1] === 0x4b && bytes[i + 2] === 0x05 && bytes[i + 3] === 0x06) return i;
  }
  return -1;
}

async function inflateRaw(bytes) {
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
  const buffer = await new Response(stream).arrayBuffer();
  return new Uint8Array(buffer);
}

function parseSharedStrings(xml) {
  if (!xml) return [];
  return [...xml.matchAll(/<si[\s\S]*?<\/si>/g)].map((match) => {
    const textParts = [...match[0].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((part) => decodeXml(part[1]));
    return textParts.join("");
  });
}

function parseSheetXml(xml, sharedStrings) {
  const rows = [];
  const rowMatches = xml.matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g);
  for (const rowMatch of rowMatches) {
    const cells = [];
    const cellMatches = rowMatch[1].matchAll(/<c([^>]*)>([\s\S]*?)<\/c>/g);
    for (const cellMatch of cellMatches) {
      const attrs = cellMatch[1];
      const body = cellMatch[2];
      const cellRef = (attrs.match(/\sr="([A-Z]+)\d+"/) || [])[1] || "";
      const index = cellRef ? columnLettersToIndex(cellRef) : cells.length;
      const type = (attrs.match(/\st="([^"]+)"/) || [])[1] || "";
      const valueMatch = body.match(/<v[^>]*>([\s\S]*?)<\/v>/);
      const inlineMatch = body.match(/<t[^>]*>([\s\S]*?)<\/t>/);
      let value = valueMatch ? decodeXml(valueMatch[1]) : inlineMatch ? decodeXml(inlineMatch[1]) : "";
      if (type === "s") value = sharedStrings[Number(value)] || "";
      cells[index] = value;
    }
    rows.push(cells);
  }
  return rows;
}

function columnLettersToIndex(letters) {
  return letters.split("").reduce((total, letter) => total * 26 + letter.charCodeAt(0) - 64, 0) - 1;
}

function decodeUtf8(bytes) {
  return new TextDecoder("utf-8").decode(bytes);
}

function decodeXml(value) {
  return String(value || "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

function createAutoGpsMapping(headers) {
  const mapping = {};
  GPS_FIELDS.forEach(([field]) => {
    const aliases = GPS_COLUMN_ALIASES[field] || [];
    mapping[field] = headers.find((header) => aliases.some((alias) => normalizeColumnName(header).includes(normalizeColumnName(alias)))) || "";
  });
  return mapping;
}

function mapGpsImportRows(importState) {
  return importState.rows.map((row) => {
    const mapped = {};
    GPS_FIELDS.forEach(([field]) => {
      const source = importState.mapping[field];
      const raw = source ? row[source] : "";
      mapped[field] = GPS_NUMERIC_FIELDS.has(field) ? parseFlexibleNumber(raw) : String(raw || "").trim();
    });
    mapped.date = parseFlexibleDate(mapped.date);
    mapped.period = normalizeGpsPeriod(mapped.period);
    return mapped;
  });
}

function getGpsUnmatchedNames(importState) {
  const rows = mapGpsImportRows(importState);
  return unique(rows.map((row) => row.playerName).filter(Boolean)).filter((name) => !findGpsMatchedPlayer(name, importState));
}

function findGpsMatchedPlayer(name, importState) {
  if (!name) return null;
  const manual = importState && importState.playerMatches && importState.playerMatches[name];
  if (manual) return getPlayer(manual);
  const normalized = normalizeColumnName(name);
  return state.players.find((player) => normalizeColumnName(player.name) === normalized) || null;
}

function normalizeColumnName(value) {
  return String(value || "").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");
}

function parseFlexibleNumber(value) {
  const clean = String(value || "").replace(/,/g, "").replace(/[^\d.-]/g, "");
  const number = Number(clean);
  return Number.isFinite(number) ? number : 0;
}

function parseFlexibleDate(value) {
  if (value instanceof Date) return todayIso(value);
  const raw = String(value || "").trim();
  if (!raw) return "";
  const numeric = Number(raw);
  if (Number.isFinite(numeric) && numeric > 25000 && numeric < 80000) {
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    excelEpoch.setUTCDate(excelEpoch.getUTCDate() + numeric);
    return todayIso(excelEpoch);
  }
  const iso = raw.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (iso) return `${iso[1]}-${iso[2].padStart(2, "0")}-${iso[3].padStart(2, "0")}`;
  const local = raw.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})$/);
  if (local) {
    const year = local[3].length === 2 ? `20${local[3]}` : local[3];
    return `${year}-${local[2].padStart(2, "0")}-${local[1].padStart(2, "0")}`;
  }
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? raw : todayIso(date);
}

function normalizeGpsPeriod(value) {
  const text = String(value || "").trim().toLowerCase();
  if (!text) return "משחק מלא";
  if (text.includes("ראש") || text.includes("first") || text === "1") return "מחצית ראשונה";
  if (text.includes("שנ") || text.includes("second") || text === "2") return "מחצית שנייה";
  return "משחק מלא";
}

function renderSettingsPage() {
  const html = coachShell("settings", `
    <div class="page-header premium-header">
      <div>
        <span class="eyebrow">מערכת</span>
        <h2>הגדרות</h2>
        <p>שחקנים, PIN אישי, אזורי כאב וספי התראה</p>
      </div>
      <button class="btn danger" type="button" id="resetDemo">איפוס נתוני דמו</button>
    </div>

    ${renderStorageDiagnosticsPanel()}

    <section class="settings-grid">
      <div class="surface">
        <div class="compact-form">
          <div class="section-title">
            <h3>רשימת שחקנים</h3>
            <span>${state.players.length} שחקנים</span>
          </div>
          <form id="addPlayerForm" class="grid three">
            <input name="playerName" required placeholder="שם שחקן" />
            <input name="playerPin" inputmode="numeric" maxlength="4" pattern="[0-9]{4}" placeholder="PIN" />
            <button class="btn primary" type="submit">הוסף שחקן</button>
          </form>
          <div>
            ${state.players.map(renderPlayerSettingsRow).join("")}
          </div>
        </div>
      </div>

      <div class="surface">
        <div class="compact-form">
          <div class="section-title">
            <h3>ספי התראה</h3>
          </div>
          <form id="thresholdForm" class="grid">
            ${thresholdInput("rpeHigh", "RPE גבוה", state.settings.rpeHigh, 1, 10)}
            ${thresholdInput("fatigueHigh", "עייפות גבוהה", state.settings.fatigueHigh, 1, 5)}
            ${thresholdInput("sorenessHigh", "כאבי שריר גבוהים", state.settings.sorenessHigh, 1, 5)}
            ${thresholdInput("sleepHoursLow", "שינה נמוכה", state.settings.sleepHoursLow, 0, 12, 0.5)}
            ${thresholdInput("sleepQualityLow", "איכות שינה נמוכה", state.settings.sleepQualityLow, 1, 5)}
            ${thresholdInput("readinessRiskScore", "ציון מוכנות מסוכן", state.settings.readinessRiskScore, 0, 100)}
            <button class="btn primary" type="submit">שמור ספים</button>
          </form>
        </div>
      </div>
    </section>

    <section class="section surface">
      <div class="compact-form">
        <div class="section-title">
          <h3>אזורי כאב</h3>
          <span>${state.painAreas.length} אזורים</span>
        </div>
        <form id="addPainForm" class="grid two">
          <input name="painArea" required placeholder="אזור כאב" />
          <button class="btn primary" type="submit">הוסף אזור</button>
        </form>
        <div>
          ${state.painAreas.map(renderPainAreaRow).join("")}
        </div>
      </div>
    </section>
  `);

  mount(html, bindSettingsPage);
}

function bindSettingsPage() {
  document.getElementById("resetDemo").addEventListener("click", () => {
    if (confirm("לאפס את כל הנתונים לנתוני הדמו?")) resetDemoState();
  });
  const testSupabaseButton = document.getElementById("testSupabaseConnection");
  if (testSupabaseButton) {
    testSupabaseButton.addEventListener("click", async () => {
      const resultNode = document.getElementById("supabaseTestResult");
      testSupabaseButton.disabled = true;
      if (resultNode) {
        resultNode.textContent = "בודק חיבור...";
        resultNode.className = "diagnostic-result";
      }
      const result = await testSupabaseConnection();
      if (resultNode) {
        resultNode.textContent = result.message;
        resultNode.className = `diagnostic-result ${result.ok ? "green" : "red"}`;
      }
      testSupabaseButton.disabled = false;
    });
  }
  document.getElementById("addPlayerForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get("playerName") || "").trim();
    if (!name) return;
    state.players.push({ id: createId("p"), name, active: true, pin: normalizePin(data.get("playerPin") || "1234") });
    saveState();
    renderSettingsPage();
  });
  document.getElementById("thresholdForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    state.settings = {
      ...state.settings,
      rpeHigh: numberFromForm(data, "rpeHigh"),
      fatigueHigh: numberFromForm(data, "fatigueHigh"),
      sorenessHigh: numberFromForm(data, "sorenessHigh"),
      sleepHoursLow: numberFromForm(data, "sleepHoursLow"),
      sleepQualityLow: numberFromForm(data, "sleepQualityLow"),
      readinessRiskScore: numberFromForm(data, "readinessRiskScore")
    };
    saveState();
    renderSettingsPage();
  });
  document.getElementById("addPainForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const painArea = String(data.get("painArea") || "").trim();
    if (!painArea || state.painAreas.includes(painArea)) return;
    state.painAreas.push(painArea);
    saveState();
    renderSettingsPage();
  });
  document.querySelectorAll("[data-save-player]").forEach((button) => {
    button.addEventListener("click", () => {
      const playerId = button.getAttribute("data-save-player");
      const nameInput = document.querySelector(`[data-player-name="${cssEscape(playerId)}"]`);
      const pinInput = document.querySelector(`[data-player-pin="${cssEscape(playerId)}"]`);
      const activeInput = document.querySelector(`[data-player-active="${cssEscape(playerId)}"]`);
      state.players = state.players.map((player) => {
        if (player.id !== playerId) return player;
        return {
          ...player,
          name: String(nameInput.value || player.name).trim(),
          pin: normalizePin(pinInput.value || player.pin),
          active: Boolean(activeInput.checked)
        };
      });
      syncPlayerNames();
      saveState();
      renderSettingsPage();
    });
  });
  document.querySelectorAll("[data-delete-player]").forEach((button) => {
    button.addEventListener("click", () => {
      if (!confirm("למחוק שחקן?")) return;
      const playerId = button.getAttribute("data-delete-player");
      state.players = state.players.filter((player) => player.id !== playerId);
      saveState();
      renderSettingsPage();
    });
  });
  document.querySelectorAll("[data-save-pain]").forEach((button) => {
    button.addEventListener("click", () => {
      const index = Number(button.getAttribute("data-save-pain"));
      const input = document.querySelector(`[data-pain-index="${index}"]`);
      const value = String(input.value || "").trim();
      if (!value) return;
      state.painAreas[index] = value;
      saveState();
      renderSettingsPage();
    });
  });
  document.querySelectorAll("[data-delete-pain]").forEach((button) => {
    button.addEventListener("click", () => {
      const index = Number(button.getAttribute("data-delete-pain"));
      if (state.painAreas[index] === NO_PAIN) return;
      state.painAreas.splice(index, 1);
      saveState();
      renderSettingsPage();
    });
  });
}

function coachShell(active, content) {
  const navItems = [
    ["dashboard", "/coach", "דשבורד"],
    ["players", "/coach/players", "שחקנים"],
    ["reports", "/coach/reports", "דוחות"],
    ["gps", "/coach/gps", "GPS"],
    ["sessions", "/coach/sessions", "אימונים"],
    ["settings", "/coach/settings", "הגדרות"],
    ["report", "/report", "כניסת שחקן"]
  ];
  return `
    <div class="app-frame">
      <header class="topbar">
        <div class="topbar-inner">
          <a href="/coach" data-route class="brand" aria-label="דוח RPE קבוצתי">
            <span class="brand-mark" aria-hidden="true"></span>
            <div>
              <h1>דוח RPE קבוצתי</h1>
              <p>מרכז מאמן</p>
            </div>
          </a>
          <nav class="nav-tabs" aria-label="ניווט">
            ${navItems.map(([id, href, label]) => `
              <a href="${href}" data-route class="nav-link ${active === id ? "active" : ""}">${label}</a>
            `).join("")}
          </nav>
          ${renderStorageStatus()}
        </div>
      </header>
      <main class="page">${content}</main>
    </div>
  `;
}

function metricCard(label, value, note = "") {
  return `
    <article class="metric-card">
      <div class="metric-label">${escapeHtml(label)}</div>
      <div class="metric-value">${escapeHtml(value)}</div>
      ${note ? `<div class="metric-note">${escapeHtml(note)}</div>` : ""}
    </article>
  `;
}

function renderReportsTable(reports, alreadyComputed = false) {
  if (!reports.length) return `<div class="surface empty">אין דוחות להצגה</div>`;
  const rows = reports.map((report) => {
    const item = alreadyComputed || report.trainingLoad !== undefined ? report : getComputedReport(report);
    return `
      <tr>
        <td><a href="/coach/player/${escapeAttr(item.playerId)}" data-route class="table-link">${escapeHtml(item.playerName)}</a></td>
        <td>${sessionTypeBadge(item.sessionType)}</td>
        <td>${escapeHtml(item.rpe)}</td>
        <td>${escapeHtml(item.fatigue)}</td>
        <td>${escapeHtml(item.soreness)}</td>
        <td>${escapeHtml(item.painArea)}</td>
        <td>${escapeHtml(item.completedFullSession || "מלא")}</td>
        <td>${escapeHtml(item.bodyWeightAfter ? formatNumber(item.bodyWeightAfter) : "אין נתון")}</td>
        <td>${hydrationSummary(item.hydration)}</td>
        <td>${escapeHtml(item.comments || "אין")}</td>
        <td>${escapeHtml(item.minutes)}</td>
        <td>${escapeHtml(formatInteger(item.trainingLoad))}</td>
        <td>${loadCategoryBadge(item.trainingLoad)}</td>
        <td>${renderRiskBadges(item.riskFlags)}</td>
      </tr>
    `;
  }).join("");
  return `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>שם שחקן</th>
            <th>סוג מפגש</th>
            <th>RPE</th>
            <th>עייפות</th>
            <th>כאבי שריר</th>
            <th>אזור כאב</th>
            <th>השלמה</th>
            <th>משקל אחרי</th>
            <th>הידרציה</th>
            <th>הערות</th>
            <th>דקות</th>
            <th>עומס מחושב</th>
            <th>קטגוריה</th>
            <th>דגלים</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

function renderReadinessTable(reports) {
  if (!reports.length) return `<div class="surface empty">אין דוחות מוכנות להצגה</div>`;
  return `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>תאריך</th>
            <th>שינה</th>
            <th>איכות שינה</th>
            <th>אנרגיה</th>
            <th>מוטיבציה</th>
            <th>כאבי שריר</th>
            <th>אזור כאב</th>
            <th>תחושת עומס</th>
            <th>משקל לפני</th>
            <th>הידרציה</th>
            <th>מגבלה רפואית</th>
            <th>ציון מוכנות</th>
            <th>דגלים</th>
          </tr>
        </thead>
        <tbody>
          ${reports.map((report) => `
            <tr>
              <td>${escapeHtml(formatDateDisplay(report.date))}</td>
              <td>${escapeHtml(formatNumber(report.sleepHours))}</td>
              <td>${escapeHtml(report.sleepQuality)}</td>
              <td>${escapeHtml(report.energy)}</td>
              <td>${escapeHtml(report.mood)}</td>
              <td>${escapeHtml(report.soreness)}</td>
              <td>${escapeHtml(report.painArea)}</td>
              <td>${escapeHtml(report.loadFeeling)}</td>
              <td>${escapeHtml(report.bodyWeight ? formatNumber(report.bodyWeight) : "אין נתון")}</td>
              <td>${hydrationSummary(report.hydration)}</td>
              <td>${report.medicalLimitation ? "כן" : "לא"}</td>
              <td>${readinessBadge(report.readinessScore)}</td>
              <td>${renderRiskBadges(report.riskFlags)}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderWeeklyTable(rows) {
  if (!rows.length) return `<div class="surface empty">אין נתוני שבוע</div>`;
  return `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>שם שחקן</th>
            <th>עומס שבוע נוכחי</th>
            <th>שבוע קודם</th>
            <th>שינוי</th>
            <th>סיכון עומס</th>
            <th>RPE ממוצע</th>
            <th>עייפות ממוצעת</th>
            <th>כאבי שריר ממוצעים</th>
            <th>שינה ממוצעת</th>
            <th>מוכנות ממוצעת</th>
            <th>מספר דוחות RPE</th>
            <th>דגלים</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map((row) => `
            <tr>
              <td><a href="/coach/player/${escapeAttr(row.player.id)}" data-route class="table-link">${escapeHtml(row.player.name)}</a></td>
              <td>${escapeHtml(formatInteger(row.totalLoad))}</td>
              <td>${escapeHtml(formatInteger(row.previousLoad))}</td>
              <td>${escapeHtml(formatPercent(row.loadChangePercent))}</td>
              <td>${weeklyLoadRiskBadge(row.loadChangePercent)}</td>
              <td>${escapeHtml(formatNumber(row.avgRpe))}</td>
              <td>${escapeHtml(formatNumber(row.avgFatigue))}</td>
              <td>${escapeHtml(formatNumber(row.avgSoreness))}</td>
              <td>${escapeHtml(formatNumber(row.avgSleep))}</td>
              <td>${escapeHtml(formatInteger(row.avgReadiness))}</td>
              <td>${escapeHtml(row.reportCount)}</td>
              <td>${renderRiskBadges(row.flags)}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderSessionsTable(sessions) {
  if (!sessions.length) return `<div class="surface empty">אין אימונים</div>`;
  return `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>תאריך</th>
            <th>סוג מפגש</th>
            <th>דקות ברירת מחדל</th>
            <th>דקות אישיות</th>
            <th>הערות</th>
            <th>פעולות</th>
          </tr>
        </thead>
        <tbody>
          ${sessions.map((sessionItem) => `
            <tr>
              <td>${escapeHtml(formatDateDisplay(sessionItem.date))}</td>
              <td>${sessionTypeBadge(sessionItem.sessionType)}</td>
              <td>${escapeHtml(sessionItem.defaultMinutes)}</td>
              <td>${escapeHtml(formatPlayerMinutes(sessionItem.playerMinutes))}</td>
              <td>${escapeHtml(sessionItem.notes || "אין")}</td>
              <td>
                <div class="actions">
                  <button class="btn secondary" type="button" data-edit-session="${escapeAttr(sessionItem.id)}">עריכה</button>
                  <button class="btn danger" type="button" data-delete-session="${escapeAttr(sessionItem.id)}">מחיקה</button>
                </div>
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderPlayerSettingsRow(player) {
  return `
    <div class="inline-edit player-settings-row">
      <input data-player-name="${escapeAttr(player.id)}" value="${escapeAttr(player.name)}" />
      <input data-player-pin="${escapeAttr(player.id)}" inputmode="numeric" maxlength="4" pattern="[0-9]{4}" value="${escapeAttr(player.pin)}" aria-label="PIN" />
      <label class="checkbox-line">
        <input data-player-active="${escapeAttr(player.id)}" type="checkbox" ${player.active ? "checked" : ""} />
        פעיל
      </label>
      <div class="actions">
        <button class="btn secondary" type="button" data-save-player="${escapeAttr(player.id)}">שמירה</button>
        <button class="btn danger" type="button" data-delete-player="${escapeAttr(player.id)}">מחיקה</button>
      </div>
    </div>
  `;
}

function renderPainAreaRow(area, index) {
  const cannotDelete = area === NO_PAIN;
  return `
    <div class="inline-edit">
      <input data-pain-index="${index}" value="${escapeAttr(area)}" ${cannotDelete ? "readonly" : ""} />
      <span></span>
      <div class="actions">
        <button class="btn secondary" type="button" data-save-pain="${index}" ${cannotDelete ? "disabled" : ""}>שמירה</button>
        <button class="btn danger" type="button" data-delete-pain="${index}" ${cannotDelete ? "disabled" : ""}>מחיקה</button>
      </div>
    </div>
  `;
}

function renderCommentsList(comments) {
  if (!comments.length) return `<div class="surface empty">אין הערות</div>`;
  return `
    <div class="surface mini-list">
      ${comments.map((report) => `
        <div class="mini-row">
          <span>${escapeHtml(formatDateDisplay(report.date))}</span>
          <strong>${escapeHtml(report.comments)}</strong>
        </div>
      `).join("")}
    </div>
  `;
}

function renderReadinessCard(report) {
  return `
    <div class="surface mini-list">
      <div class="mini-row"><span>ציון מוכנות</span><strong>${readinessBadge(report.readinessScore)}</strong></div>
      <div class="mini-row"><span>סיבות מרכזיות</span><strong>${escapeHtml(report.riskFlags.join(", ") || "אין חריגים")}</strong></div>
      <div class="mini-row"><span>שינה</span><strong>${escapeHtml(formatNumber(report.sleepHours))} שעות</strong></div>
      <div class="mini-row"><span>אנרגיה</span><strong>${escapeHtml(report.energy)}</strong></div>
      <div class="mini-row"><span>כאב</span><strong>${escapeHtml(report.painArea)}</strong></div>
      <div class="mini-row"><span>הידרציה</span><strong>${hydrationSummary(report.hydration)}</strong></div>
      <div class="mini-row"><span>דגלים</span><strong>${renderRiskBadges(report.riskFlags)}</strong></div>
    </div>
  `;
}

function renderHydrationHistory(reports) {
  if (!reports.length) return `<div class="surface empty">אין נתוני הידרציה להצגה</div>`;
  return `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>תאריך</th>
            <th>משקל לפני</th>
            <th>משקל אחרי</th>
            <th>ירידה בק"ג</th>
            <th>ירידה %</th>
            <th>סטטוס</th>
          </tr>
        </thead>
        <tbody>
          ${reports.map((report) => `
            <tr>
              <td>${escapeHtml(formatDateDisplay(report.date))}</td>
              <td>${escapeHtml(formatNumber(report.hydration.preTrainingWeight))}</td>
              <td>${escapeHtml(formatNumber(report.hydration.postTrainingWeight))}</td>
              <td>${escapeHtml(formatNumber(report.hydration.lossKg))}</td>
              <td>${escapeHtml(formatNumber(report.hydration.lossPercent))}%</td>
              <td>${hydrationBadge(report.hydration)}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderPlayerGpsTable(records) {
  if (!records.length) return `<div class="surface empty">אין נתוני GPS לשחקן</div>`;
  return `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>תאריך</th>
            <th>מפגש</th>
            <th>עמדה</th>
            <th>תקופה</th>
            <th>דקות</th>
            <th>מרחק</th>
            <th>מ׳/דקה</th>
            <th>HSR</th>
            <th>מעל 25</th>
            <th>מהירות מקס׳</th>
            <th>האצות</th>
            <th>האטות</th>
            <th>עומס GPS</th>
            <th>דגלים</th>
          </tr>
        </thead>
        <tbody>
          ${records.map((record) => `
            <tr>
              <td>${escapeHtml(formatDateDisplay(record.date))}</td>
              <td>${escapeHtml(record.sessionName)}</td>
              <td>${escapeHtml(record.position)}</td>
              <td>${escapeHtml(record.period)}</td>
              <td>${escapeHtml(formatNumber(record.minutesPlayed))}</td>
              <td>${escapeHtml(formatInteger(record.totalDistance))}</td>
              <td>${escapeHtml(formatNumber(record.distancePerMinute))}</td>
              <td>${escapeHtml(formatInteger(record.highSpeedRunning))}</td>
              <td>${escapeHtml(formatInteger(record.distanceAbove25))}</td>
              <td>${escapeHtml(formatNumber(record.maxSpeed))}</td>
              <td>${escapeHtml(formatInteger(record.accelerations))}</td>
              <td>${escapeHtml(formatInteger(record.decelerations))}</td>
              <td>${escapeHtml(formatInteger(record.gpsLoad))}</td>
              <td>${renderRiskBadges(record.riskFlags)}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderGpsAverageComparison(playerId, records) {
  if (!records.length) return `<div class="surface empty">אין נתוני GPS להשוואה</div>`;
  const metrics = ["totalDistance", "highSpeedRunning", "distanceAbove25", "maxSpeed", "accelerations", "decelerations", "gpsLoad"];
  const position = records[records.length - 1].position;
  const allFull = state.gpsRecords.map(getComputedGpsRecord).filter((record) => record.period === "משחק מלא");
  return `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>מדד</th>
            <th>ממוצע שחקן</th>
            <th>ממוצע עמדה</th>
            <th>פער</th>
          </tr>
        </thead>
        <tbody>
          ${metrics.map((metric) => {
            const playerAvg = average(records.map((record) => record[metric]));
            const positionAvg = average(allFull.filter((record) => record.position === position).map((record) => record[metric]));
            const diff = playerAvg !== null && positionAvg ? playerAvg - positionAvg : null;
            return `
              <tr>
                <td>${escapeHtml(getGpsMetricLabel(metric))}</td>
                <td>${escapeHtml(formatNumber(playerAvg))}</td>
                <td>${escapeHtml(formatNumber(positionAvg))}</td>
                <td>${escapeHtml(diff === null ? "אין נתון" : `${diff > 0 ? "+" : ""}${formatNumber(diff)}`)}</td>
              </tr>
            `;
          }).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderPainHistory(items) {
  if (!items.length) return `<div class="empty">אין כאבים מדווחים</div>`;
  return `
    <div class="mini-list">
      ${items.map((item) => `
        <div class="mini-row">
          <span>${escapeHtml(item.area)}</span>
          <strong>${escapeHtml(item.count)} פעמים</strong>
        </div>
      `).join("")}
    </div>
  `;
}

function chartCard(title, chart) {
  return `
    <div class="surface chart-card">
      <h3>${escapeHtml(title)}</h3>
      ${chart}
    </div>
  `;
}

function renderLineChart(series, key, label) {
  if (!series.length) return `<div class="empty">אין נתונים לגרף</div>`;
  const width = 680;
  const height = 230;
  const padX = 42;
  const padY = 24;
  const values = series.map((point) => Number(point[key]) || 0);
  const max = Math.max(...values, 1);
  const min = Math.min(0, ...values);
  const range = max - min || 1;
  const innerWidth = width - padX * 2;
  const innerHeight = height - padY * 2 - 22;
  const xFor = (index) => padX + (series.length === 1 ? innerWidth / 2 : (innerWidth * index) / (series.length - 1));
  const yFor = (value) => padY + ((max - value) / range) * innerHeight;
  const points = series.map((point, index) => `${xFor(index).toFixed(1)},${yFor(Number(point[key]) || 0).toFixed(1)}`).join(" ");
  const gridLines = [0, 0.25, 0.5, 0.75, 1].map((ratio) => {
    const y = padY + innerHeight * ratio;
    return `<line class="chart-grid" x1="${padX}" y1="${y}" x2="${width - padX}" y2="${y}" />`;
  }).join("");
  return `
    <svg class="chart-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeAttr(label)}">
      ${gridLines}
      <line class="chart-axis" x1="${padX}" y1="${padY + innerHeight}" x2="${width - padX}" y2="${padY + innerHeight}" />
      <line class="chart-axis" x1="${padX}" y1="${padY}" x2="${padX}" y2="${padY + innerHeight}" />
      <polyline class="chart-line" points="${points}" />
      ${series.map((point, index) => `<circle class="chart-dot" cx="${xFor(index).toFixed(1)}" cy="${yFor(Number(point[key]) || 0).toFixed(1)}" r="4" />`).join("")}
      <text class="chart-label" x="${padX}" y="${height - 8}">${escapeHtml(formatShortDate(series[0].date))}</text>
      <text class="chart-label" x="${width - padX - 60}" y="${height - 8}">${escapeHtml(formatShortDate(series[series.length - 1].date))}</text>
      <text class="chart-label" x="${padX + 6}" y="${padY + 12}">${escapeHtml(formatNumber(max))}</text>
    </svg>
  `;
}

function renderDualLineChart(series, keyA, keyB, labelA, labelB) {
  if (!series.length) return `<div class="empty">אין נתונים לגרף</div>`;
  const width = 680;
  const height = 230;
  const padX = 42;
  const padY = 24;
  const values = series.flatMap((point) => [Number(point[keyA]) || 0, Number(point[keyB]) || 0]);
  const max = Math.max(...values, 1);
  const min = Math.min(0, ...values);
  const range = max - min || 1;
  const innerWidth = width - padX * 2;
  const innerHeight = height - padY * 2 - 22;
  const xFor = (index) => padX + (series.length === 1 ? innerWidth / 2 : (innerWidth * index) / (series.length - 1));
  const yFor = (value) => padY + ((max - value) / range) * innerHeight;
  const pointsA = series.map((point, index) => `${xFor(index).toFixed(1)},${yFor(Number(point[keyA]) || 0).toFixed(1)}`).join(" ");
  const pointsB = series.map((point, index) => `${xFor(index).toFixed(1)},${yFor(Number(point[keyB]) || 0).toFixed(1)}`).join(" ");
  return `
    <svg class="chart-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeAttr(labelA)} מול ${escapeAttr(labelB)}">
      <line class="chart-axis" x1="${padX}" y1="${padY + innerHeight}" x2="${width - padX}" y2="${padY + innerHeight}" />
      <line class="chart-axis" x1="${padX}" y1="${padY}" x2="${padX}" y2="${padY + innerHeight}" />
      <polyline class="chart-line" points="${pointsA}" />
      <polyline class="chart-line secondary-line" points="${pointsB}" />
      <text class="chart-label" x="${padX}" y="${height - 8}">${escapeHtml(formatShortDate(series[0].date))}</text>
      <text class="chart-label" x="${width - padX - 60}" y="${height - 8}">${escapeHtml(formatShortDate(series[series.length - 1].date))}</text>
      <text class="chart-label" x="${padX + 6}" y="${padY + 12}">${escapeHtml(labelA)}</text>
      <text class="chart-label" x="${padX + 110}" y="${padY + 12}">${escapeHtml(labelB)}</text>
    </svg>
  `;
}

function renderScaleControl(name, min, max, selected) {
  const count = max - min + 1;
  return `
    <input type="hidden" name="${escapeAttr(name)}" id="${escapeAttr(name)}" value="${escapeAttr(selected)}" />
    <div class="scale-control ${count === 10 ? "ten" : ""}" data-scale="${escapeAttr(name)}">
      ${Array.from({ length: count }, (_, index) => {
        const value = min + index;
        return `<button class="scale-button ${value === selected ? "is-selected" : ""}" type="button" data-scale-value="${value}" aria-pressed="${value === selected ? "true" : "false"}">${value}</button>`;
      }).join("")}
    </div>
  `;
}

function bindScaleButtons() {
  document.querySelectorAll("[data-scale]").forEach((group) => {
    const field = group.getAttribute("data-scale");
    group.querySelectorAll("[data-scale-value]").forEach((button) => {
      button.addEventListener("click", () => resetScale(field, Number(button.getAttribute("data-scale-value"))));
    });
  });
}

function resetScale(field, value) {
  const input = document.getElementById(field);
  const group = document.querySelector(`[data-scale="${cssEscape(field)}"]`);
  if (!input || !group) return;
  input.value = String(value);
  group.querySelectorAll("[data-scale-value]").forEach((button) => {
    const selected = Number(button.getAttribute("data-scale-value")) === Number(value);
    button.classList.toggle("is-selected", selected);
    button.setAttribute("aria-pressed", selected ? "true" : "false");
  });
}

function renderBodyMap(selected) {
  const points = [
    ["pain-none", NO_PAIN],
    ["pain-shoulder", "כתף"],
    ["pain-back", "גב תחתון"],
    ["pain-groin", "מפשעה"],
    ["pain-quad", "ארבע ראשי"],
    ["pain-hamstring", "המסטרינג"],
    ["pain-adductor", "מקרבים"],
    ["pain-knee", "ברך"],
    ["pain-calf", "תאומים"],
    ["pain-ankle", "קרסול"]
  ];
  return `
    <div class="body-map" aria-label="מפת גוף">
      <div class="body-shape" aria-hidden="true">
        <span class="shape-head"></span>
        <span class="shape-torso"></span>
        <span class="shape-arm-left"></span>
        <span class="shape-arm-right"></span>
        <span class="shape-leg-left"></span>
        <span class="shape-leg-right"></span>
      </div>
      ${points.map(([className, area]) => `
        <button class="pain-point ${className} ${area === selected ? "is-selected" : ""}" type="button" data-pain-area="${escapeAttr(area)}">${escapeHtml(area)}</button>
      `).join("")}
    </div>
  `;
}

function bindBodyMap() {
  document.querySelectorAll("[data-pain-area]").forEach((button) => {
    button.addEventListener("click", () => {
      const area = button.getAttribute("data-pain-area");
      const select = document.getElementById("painArea");
      select.value = area;
      updateBodyMapSelection(area);
    });
  });
  const select = document.getElementById("painArea");
  if (select) select.addEventListener("change", () => updateBodyMapSelection(select.value));
}

function updateBodyMapSelection(area) {
  document.querySelectorAll("[data-pain-area]").forEach((button) => {
    button.classList.toggle("is-selected", button.getAttribute("data-pain-area") === area);
  });
}

function filterSelect(id, label, labels, selected, values) {
  const optionValues = values || labels;
  return `
    <div class="field">
      <label for="${escapeAttr(id)}">${escapeHtml(label)}</label>
      <select id="${escapeAttr(id)}">
        ${labels.map((item, index) => `<option value="${escapeAttr(optionValues[index])}" ${String(optionValues[index]) === String(selected) ? "selected" : ""}>${escapeHtml(item)}</option>`).join("")}
      </select>
    </div>
  `;
}

function filterInput(id, label, type, value) {
  return `
    <div class="field">
      <label for="${escapeAttr(id)}">${escapeHtml(label)}</label>
      <input id="${escapeAttr(id)}" type="${escapeAttr(type)}" value="${escapeAttr(value)}" />
    </div>
  `;
}

function thresholdInput(name, label, value, min, max, step = 1) {
  return `
    <div class="field">
      <label for="${escapeAttr(name)}">${escapeHtml(label)}</label>
      <input id="${escapeAttr(name)}" name="${escapeAttr(name)}" type="number" min="${min}" max="${max}" step="${step}" value="${escapeAttr(value)}" required />
    </div>
  `;
}

function playerFilterOptions() {
  return ["הכול", ...state.players.map((player) => player.name)];
}

function playerFilterValues() {
  return ["all", ...state.players.map((player) => player.id)];
}

function renderSimpleOptions(items, selected) {
  return items.map((item) => `<option value="${escapeAttr(item)}" ${item === selected ? "selected" : ""}>${escapeHtml(item)}</option>`).join("");
}

function applyReportFilters(reports, filters, includeDate = true) {
  return reports
    .map((report) => report.trainingLoad !== undefined ? report : getComputedReport(report))
    .filter((report) => {
      if (filters.playerId !== "all" && report.playerId !== filters.playerId) return false;
      if (includeDate && filters.date && filters.date !== "all" && report.date !== filters.date) return false;
      if (filters.sessionType !== "all" && report.sessionType !== filters.sessionType) return false;
      if (filters.painArea !== "all" && report.painArea !== filters.painArea) return false;
      if (filters.riskLevel !== "all" && getRiskLevel(report.riskFlags) !== filters.riskLevel) return false;
      return true;
    });
}

function buildWeeklyRows(filters) {
  const weekDate = filters.weekDate || todayIso();
  const range = getWeekRange(weekDate);
  return getActivePlayers()
    .filter((player) => filters.playerId === "all" || player.id === filters.playerId)
    .map((player) => {
      const postReports = state.reports.filter((report) => report.playerId === player.id && isWithinRange(report.date, range));
      const readinessReports = state.readinessReports.filter((report) => report.playerId === player.id && isWithinRange(report.date, range)).map(getComputedReadiness);
      const filteredPostReports = applyReportFilters(postReports, { ...filters, date: "all" }, false);
      const summary = summarizeComputedReports(filteredPostReports, readinessReports);
      const previousSummary = summarizePlayerWeek(player.id, addDays(range.start, -1));
      const loadChangePercent = calculateChangePercent(summary.totalLoad, previousSummary.totalLoad);
      const weeklyLoadRisk = getWeeklyLoadRisk(loadChangePercent);
      const weeklyFlags = weeklyLoadRisk.tone === "red" ? ["קפיצה חדה בעומס"] : weeklyLoadRisk.tone === "yellow" ? ["עלייה בעומס"] : [];
      const flags = unique(flatten([...filteredPostReports.map((report) => report.riskFlags), ...readinessReports.map((report) => report.riskFlags), weeklyFlags]));
      return {
        player,
        totalLoad: summary.totalLoad,
        previousLoad: previousSummary.totalLoad,
        loadChangePercent,
        weeklyLoadRisk,
        avgRpe: summary.avgRpe,
        avgFatigue: summary.avgFatigue,
        avgSoreness: summary.avgSoreness,
        avgSleep: summary.avgSleep,
        avgReadiness: average(readinessReports.map((report) => report.readinessScore)),
        reportCount: filteredPostReports.length,
        flags
      };
    })
    .filter((row) => row.reportCount > 0 || filters.playerId !== "all")
    .sort((a, b) => b.totalLoad - a.totalLoad);
}

function getComputedReport(report, includeRisks = true) {
  const player = getPlayer(report.playerId);
  const minutes = getMinutesForReport(report);
  const trainingLoad = Math.round((Number(report.rpe) || 0) * minutes);
  const readiness = getReadinessFor(report.playerId, report.date);
  const hydration = calculateHydration(readiness ? readiness.bodyWeight : null, report.bodyWeightAfter);
  const computed = {
    ...report,
    playerName: player ? player.name : report.playerName,
    fatigue: Number(report.fatigue || 0),
    soreness: Number(report.soreness || 0),
    painArea: report.painArea || NO_PAIN,
    completedFullSession: report.completedFullSession || "מלא",
    bodyWeightAfter: report.bodyWeightAfter === undefined || report.bodyWeightAfter === "" ? null : Number(report.bodyWeightAfter),
    preTrainingWeight: readiness ? readiness.bodyWeight : null,
    sleepHours: report.sleepHours ?? (readiness ? readiness.sleepHours : null),
    sleepQuality: report.sleepQuality ?? (readiness ? readiness.sleepQuality : null),
    minutes,
    trainingLoad,
    loadCategory: getLoadCategory(trainingLoad),
    hydration
  };
  computed.riskFlags = includeRisks ? getPostRiskFlags(computed) : [];
  return computed;
}

function getComputedReadiness(report) {
  const player = getPlayer(report.playerId);
  const post = getPostReportFor(report.playerId, report.date);
  const hydration = calculateHydration(report.bodyWeight, post ? post.bodyWeightAfter : null);
  const computed = {
    ...report,
    playerName: player ? player.name : report.playerName,
    painArea: report.painArea || NO_PAIN,
    medicalLimitation: Boolean(report.medicalLimitation),
    hydration
  };
  computed.readinessScore = calculateReadinessScore(computed);
  computed.riskFlags = getReadinessRiskFlags(computed);
  computed.readinessStatus = getReadinessStatus(computed.readinessScore);
  return computed;
}

function getMinutesForReport(report) {
  const sessionItem = findSessionForReport(report);
  if (!sessionItem) return 0;
  if (sessionItem.playerMinutes && sessionItem.playerMinutes[report.playerId] !== undefined) {
    return Number(sessionItem.playerMinutes[report.playerId]) || 0;
  }
  return Number(sessionItem.defaultMinutes) || 0;
}

function findSessionForReport(report) {
  return state.sessions.find((sessionItem) => sessionItem.date === report.date && sessionItem.sessionType === report.sessionType)
    || state.sessions.find((sessionItem) => sessionItem.date === report.date)
    || null;
}

function getPostRiskFlags(report) {
  const flags = [];
  const settings = state.settings;
  if (Number(report.rpe) >= settings.rpeHigh) flags.push("RPE גבוה");
  if (Number(report.fatigue) >= settings.fatigueHigh) flags.push("עייפות גבוהה");
  if (Number(report.soreness) >= settings.sorenessHigh) flags.push("כאבי שריר גבוהים");
  if (report.painArea && report.painArea !== NO_PAIN && countWeeklyPainReports(report.playerId, report.painArea, report.date) >= 2) flags.push(`כאב חוזר ב${report.painArea}`);
  if (report.hydration && report.hydration.tone === "red") flags.push("סיכון התייבשות");
  const change = getWeeklyLoadChangeForReport(report);
  if (change !== null && change > settings.weeklyLoadJumpPercent) flags.push("קפיצה בעומס");
  return unique(flags);
}

function getReadinessRiskFlags(report) {
  const flags = [];
  const settings = state.settings;
  if (Number(report.sleepHours) < settings.sleepHoursLow) flags.push("שינה נמוכה");
  if (Number(report.sleepQuality) <= settings.sleepQualityLow) flags.push("איכות שינה נמוכה");
  if (Number(report.energy) <= 2) flags.push("אנרגיה נמוכה");
  if (Number(report.mood) <= 2) flags.push("מוטיבציה נמוכה");
  if (Number(report.soreness) >= settings.sorenessHigh) flags.push("כאבי שריר גבוהים");
  if (Number(report.loadFeeling) >= 4) flags.push("תחושת עומס גבוהה");
  if (report.medicalLimitation) flags.push("מגבלה רפואית");
  if (report.hydration && report.hydration.tone === "yellow") flags.push("אובדן נוזלים");
  if (report.hydration && report.hydration.tone === "red") flags.push("סיכון התייבשות");
  if (report.painArea && report.painArea !== NO_PAIN && countWeeklyPainReports(report.playerId, report.painArea, report.date) >= 2) flags.push(`כאב חוזר ב${report.painArea}`);
  if (report.readinessScore < settings.readinessRiskScore) flags.push("מוכנות נמוכה");
  return unique(flags);
}

function calculateReadinessScore(report) {
  let score = 100;
  if (Number(report.sleepHours) < 6) score -= 15;
  if (Number(report.sleepQuality) <= 2) score -= 10;
  if (Number(report.energy) <= 2) score -= 15;
  if (Number(report.mood) <= 2) score -= 10;
  if (Number(report.soreness) >= 4) score -= 15;
  if (Number(report.loadFeeling) >= 4) score -= 10;
  if (report.medicalLimitation) score -= 25;
  if (report.hydration && report.hydration.lossPercent > 2) score -= 20;
  else if (report.hydration && report.hydration.lossPercent > 1) score -= 10;
  return Math.max(0, Math.min(100, score));
}

function sleepHoursToScore(hours) {
  if (hours >= 8) return 5;
  if (hours >= 7) return 4;
  if (hours >= 6) return 3;
  if (hours >= 5) return 2;
  return 1;
}

function calculateHydration(preTrainingWeight, postTrainingWeight) {
  const pre = Number(preTrainingWeight);
  const post = Number(postTrainingWeight);
  if (!Number.isFinite(pre) || !Number.isFinite(post) || pre <= 0 || post <= 0) return null;
  const lossKg = pre - post;
  const lossPercent = (lossKg / pre) * 100;
  const status = getHydrationStatus(lossPercent);
  return {
    preTrainingWeight: pre,
    postTrainingWeight: post,
    lossKg,
    lossPercent,
    status: status.label,
    tone: status.tone
  };
}

function getHydrationStatus(lossPercent) {
  if (lossPercent > 2) return { label: "סיכון התייבשות", tone: "red" };
  if (lossPercent > 1) return { label: "לשים לב", tone: "yellow" };
  return { label: "תקין", tone: "green" };
}

function hydrationBadge(hydration) {
  if (!hydration) return `<span class="badge neutral">אין נתון</span>`;
  return `<span class="badge ${hydration.tone}">${escapeHtml(hydration.status)}</span>`;
}

function hydrationSummary(hydration) {
  if (!hydration) return `<span class="badge neutral">אין נתון</span>`;
  return `
    <div class="badges">
      ${hydrationBadge(hydration)}
      <span class="badge neutral">${escapeHtml(formatNumber(hydration.lossKg))} ק"ג</span>
      <span class="badge neutral">${escapeHtml(formatNumber(hydration.lossPercent))}%</span>
    </div>
  `;
}

function getLoadCategory(load) {
  const value = Number(load) || 0;
  if (value < 200) return { label: "קל מאוד", tone: "green" };
  if (value < 400) return { label: "קל", tone: "green" };
  if (value < 600) return { label: "בינוני", tone: "yellow" };
  if (value < 800) return { label: "קשה", tone: "red" };
  return { label: "קשה מאוד", tone: "red" };
}

function loadCategoryBadge(load) {
  const category = getLoadCategory(load);
  return `<span class="badge ${category.tone}">${escapeHtml(category.label)}</span>`;
}

function getWeeklyLoadRisk(changePercent) {
  if (changePercent === null || changePercent === undefined || Number.isNaN(Number(changePercent))) {
    return { label: "אין נתון", tone: "neutral" };
  }
  if (changePercent > 25) return { label: "קפיצה חדה בעומס", tone: "red" };
  if (changePercent > 10) return { label: "לשים לב", tone: "yellow" };
  return { label: "תקין", tone: "green" };
}

function weeklyLoadRiskBadge(changePercent) {
  const risk = getWeeklyLoadRisk(changePercent);
  return `<span class="badge ${risk.tone}">${escapeHtml(risk.label)}</span>`;
}

function getReadinessStatus(score) {
  if (score >= 80) return { label: "מוכן לאימון", short: "מוכן", tone: "green" };
  if (score >= 60) return { label: "לשים לב", short: "לשים לב", tone: "yellow" };
  return { label: "לבדוק לפני אימון", short: "לבדוק", tone: "red" };
}

function countWeeklyPainReports(playerId, painArea, date) {
  const range = getWeekRange(date);
  const postCount = state.reports.filter((item) => item.playerId === playerId && item.painArea === painArea && item.painArea !== NO_PAIN && isWithinRange(item.date, range)).length;
  const readinessCount = state.readinessReports.filter((item) => item.playerId === playerId && item.painArea === painArea && item.painArea !== NO_PAIN && isWithinRange(item.date, range)).length;
  return postCount + readinessCount;
}

function getWeeklyLoadChangeForReport(report) {
  const current = summarizePlayerWeek(report.playerId, report.date);
  const previous = summarizePlayerWeek(report.playerId, addDays(getWeekRange(report.date).start, -1));
  return calculateChangePercent(current.totalLoad, previous.totalLoad);
}

function summarizePlayerWeek(playerId, anchorDate) {
  const range = getWeekRange(anchorDate);
  const postReports = state.reports
    .filter((report) => report.playerId === playerId && isWithinRange(report.date, range))
    .map((report) => getComputedReport(report, false));
  const readinessReports = state.readinessReports
    .filter((report) => report.playerId === playerId && isWithinRange(report.date, range))
    .map(getComputedReadiness);
  return summarizeComputedReports(postReports, readinessReports);
}

function summarizeComputedReports(postReports, readinessReports = []) {
  const totalLoad = sum(postReports.map((report) => report.trainingLoad));
  return {
    reportCount: postReports.length,
    totalLoad,
    avgRpe: average(postReports.map((report) => report.rpe)),
    avgFatigue: average(postReports.map((report) => report.fatigue)),
    avgSoreness: average([...postReports.map((report) => report.soreness), ...readinessReports.map((report) => report.soreness)]),
    avgSleep: average(readinessReports.map((report) => report.sleepHours)),
    avgSleepQuality: average(readinessReports.map((report) => report.sleepQuality))
  };
}

function buildPlayerPostSeries(playerId) {
  return state.reports
    .filter((report) => report.playerId === playerId)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(getComputedReport);
}

function buildPlayerReadinessSeries(playerId) {
  return state.readinessReports
    .filter((report) => report.playerId === playerId)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(getComputedReadiness);
}

function buildWeeklyLoadSeries(playerId) {
  const rows = new Map();
  state.reports
    .filter((report) => report.playerId === playerId)
    .map((report) => getComputedReport(report, false))
    .forEach((report) => {
      const range = getWeekRange(report.date);
      const current = rows.get(range.start) || { date: range.start, totalLoad: 0 };
      current.totalLoad += report.trainingLoad;
      rows.set(range.start, current);
    });
  return Array.from(rows.values()).sort((a, b) => a.date.localeCompare(b.date));
}

function buildInternalExternalSeries(playerId) {
  const dates = unique([
    ...state.reports.filter((report) => report.playerId === playerId).map((report) => report.date),
    ...state.gpsSessions
      .filter((sessionItem) => state.gpsRecords.some((record) => record.playerId === playerId && record.gpsSessionId === sessionItem.id))
      .map((sessionItem) => sessionItem.date)
  ]).sort();
  return dates.map((date) => {
    const post = state.reports.find((report) => report.playerId === playerId && report.date === date);
    const gpsSessionIds = state.gpsSessions.filter((sessionItem) => sessionItem.date === date).map((sessionItem) => sessionItem.id);
    const gpsLoad = sum(state.gpsRecords
      .filter((record) => record.playerId === playerId && gpsSessionIds.includes(record.gpsSessionId) && normalizeGpsPeriod(record.period) === "משחק מלא")
      .map((record) => record.gpsLoad));
    return {
      date,
      internalLoad: post ? getComputedReport(post, false).trainingLoad : 0,
      gpsLoad
    };
  });
}

function buildPainHistory(playerId) {
  const counts = new Map();
  [...state.reports, ...state.readinessReports]
    .filter((report) => report.playerId === playerId && report.painArea && report.painArea !== NO_PAIN)
    .forEach((report) => counts.set(report.painArea, (counts.get(report.painArea) || 0) + 1));
  return Array.from(counts.entries())
    .map(([area, count]) => ({ area, count }))
    .sort((a, b) => b.count - a.count);
}

function mergePainReports(readinessToday, postToday) {
  const byPlayer = new Map();
  [...readinessToday, ...postToday].forEach((report) => {
    if (!report.painArea || report.painArea === NO_PAIN) return;
    const player = getPlayer(report.playerId);
    const current = byPlayer.get(report.playerId) || { player, areas: new Set(), details: [] };
    current.areas.add(report.painArea);
    current.details.push(`${report.painArea}${report.riskFlags.some((flag) => flag.includes("כאב חוזר")) ? " חוזר" : ""}`);
    byPlayer.set(report.playerId, current);
  });
  return Array.from(byPlayer.values()).map((item) => ({
    player: item.player,
    reason: Array.from(item.areas).join(", "),
    details: unique(item.details).join(", ")
  }));
}

function buildRiskExplanation(readiness, post) {
  const details = [];
  if (readiness) details.push(`מוכנות ${readiness.readinessScore}, ${readiness.riskFlags.join(", ")}`);
  if (post) details.push(`RPE ${post.rpe}, עייפות ${post.fatigue}, ${post.riskFlags.join(", ")}`);
  return details.filter(Boolean).join(" | ");
}

function getReadinessFor(playerId, date) {
  return state.readinessReports.find((report) => report.playerId === playerId && report.date === date) || null;
}

function getPostReportFor(playerId, date) {
  return state.reports.find((report) => report.playerId === playerId && report.date === date) || null;
}

function getLoggedPlayer() {
  const playerId = localStorage.getItem(PLAYER_SESSION_KEY);
  if (!playerId) return null;
  return state.players.find((player) => player.id === playerId && player.active) || null;
}

function getActivePlayers() {
  return state.players.filter((player) => player.active);
}

function getPlayer(playerId) {
  return state.players.find((player) => player.id === playerId) || null;
}

function getPlayerPrimaryPosition(playerId) {
  const gps = state.gpsRecords.filter((record) => record.playerId === playerId && record.position);
  if (!gps.length) return "";
  const counts = new Map();
  gps.forEach((record) => counts.set(record.position, (counts.get(record.position) || 0) + 1));
  return Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0][0];
}

function getLoadTrend(playerId) {
  const weeks = buildWeeklyLoadSeries(playerId);
  if (weeks.length < 2) return { label: "יציב", tone: "green" };
  const last = weeks[weeks.length - 1].totalLoad;
  const previous = weeks[weeks.length - 2].totalLoad;
  const change = calculateChangePercent(last, previous);
  if (change === null || Math.abs(change) <= 10) return { label: "יציב", tone: "green" };
  if (change > 10) return { label: "דורש מעקב", tone: change > 25 ? "red" : "yellow" };
  return { label: "בירידה", tone: "yellow" };
}

function buildGpsReportRisks(date) {
  const sessionIds = state.gpsSessions.filter((sessionItem) => sessionItem.date === date).map((sessionItem) => sessionItem.id);
  return state.gpsRecords
    .filter((record) => sessionIds.includes(record.gpsSessionId))
    .map(getComputedGpsRecord)
    .filter((record) => record.riskFlags.length)
    .map((record) => ({
      player: getPlayer(record.playerId),
      reason: record.riskFlags.slice(0, 2).join(", "),
      details: record.sessionName
    }));
}

function syncPlayerNames() {
  const sync = (report) => {
    const player = getPlayer(report.playerId);
    return player ? { ...report, playerName: player.name } : report;
  };
  state.reports = state.reports.map(sync);
  state.readinessReports = state.readinessReports.map(sync);
}

function sessionTypeBadge(type) {
  const badgeClass = type === "משחק" ? "red" : type === "מנוחה" ? "green" : type === "פציעה" ? "yellow" : "neutral";
  return `<span class="badge ${badgeClass}">${escapeHtml(type)}</span>`;
}

function readinessBadge(score) {
  const status = getReadinessStatus(Number(score) || 0);
  return `<span class="badge ${status.tone}">${escapeHtml(status.short)} ${escapeHtml(formatInteger(score))}</span>`;
}

function renderRiskBadges(flags) {
  if (!flags || !flags.length) return `<span class="badge green">תקין</span>`;
  const level = getRiskLevel(flags);
  const className = level === "risk" ? "red" : "yellow";
  return `<div class="badges">${flags.map((flag) => `<span class="badge ${className}">${escapeHtml(flag)}</span>`).join("")}</div>`;
}

function getRiskLevel(flags) {
  if (!flags || !flags.length) return "normal";
  return flags.length >= 2 ? "risk" : "attention";
}

function formatPlayerMinutes(playerMinutes) {
  const entries = Object.entries(playerMinutes || {});
  if (!entries.length) return "אין";
  return entries.map(([playerId, minutes]) => {
    const player = getPlayer(playerId);
    return `${player ? player.name : playerId}: ${minutes}`;
  }).join(", ");
}

function calculateChangePercent(current, previous) {
  if (!previous || previous <= 0) return null;
  return ((current - previous) / previous) * 100;
}

function average(values) {
  const clean = values.map(Number).filter((value) => Number.isFinite(value));
  if (!clean.length) return null;
  return sum(clean) / clean.length;
}

function sum(values) {
  return values.reduce((total, value) => total + (Number(value) || 0), 0);
}

function flatten(items) {
  return items.reduce((all, item) => all.concat(item), []);
}

function unique(items) {
  return [...new Set(items)];
}

function numberFromForm(formData, key) {
  return Number(formData.get(key) || 0);
}

function optionalNumberFromForm(formData, key) {
  const value = String(formData.get(key) || "").trim();
  return value === "" ? null : Number(value);
}

function normalizePin(value) {
  return String(value || "").replace(/\D/g, "").slice(0, 4).padStart(4, "0");
}

function formatNumber(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "אין נתון";
  return numberFormat.format(Number(value));
}

function formatInteger(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "אין נתון";
  return integerFormat.format(Number(value));
}

function formatPercent(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "אין נתון";
  const sign = value > 0 ? "+" : "";
  return `${sign}${formatNumber(value)}%`;
}

function todayIso(date = new Date()) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function parseIsoDate(isoDate) {
  return new Date(`${isoDate}T12:00:00`);
}

function addDays(isoDate, offset) {
  const date = parseIsoDate(isoDate);
  date.setDate(date.getDate() + offset);
  return todayIso(date);
}

function getWeekRange(anchorDate) {
  const date = parseIsoDate(anchorDate);
  const start = new Date(date);
  start.setDate(date.getDate() - date.getDay());
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { start: todayIso(start), end: todayIso(end) };
}

function isWithinRange(isoDate, range) {
  return isoDate >= range.start && isoDate <= range.end;
}

function formatDateDisplay(isoDate) {
  return parseIsoDate(isoDate).toLocaleDateString("he-IL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
}

function formatShortDate(isoDate) {
  return parseIsoDate(isoDate).toLocaleDateString("he-IL", {
    day: "2-digit",
    month: "2-digit"
  });
}

function formatDateTimeDisplay(date) {
  return date.toLocaleString("he-IL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function createId(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function escapeAttr(value) {
  return escapeHtml(value);
}

function cssEscape(value) {
  if (window.CSS && typeof window.CSS.escape === "function") return window.CSS.escape(value);
  return String(value).replace(/[^a-zA-Z0-9_-]/g, "\\$&");
}

function renderNotFound() {
  mount(`
    <main class="not-found">
      <div>
        <h1>העמוד לא נמצא</h1>
        <p><a href="/report" data-route class="btn primary">חזרה לכניסת שחקן</a></p>
      </div>
    </main>
  `);
}
