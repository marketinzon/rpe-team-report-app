import {
  DEMO_DATA_PREFIX,
  DEMO_DATASET_VERSION,
  MONTH_DEMO_PLAYERS,
  createMonthDemoDataset,
  isLegacyBuiltInDemoId,
  isMonthDemoId
} from "./demo-data.js";
import { downloadDailyCoachPdf } from "./daily-pdf.js";

const STORE_KEY = "rpe-team-report-state-v1";
const PLAYER_SESSION_KEY = "rpe-player-session-v2";
const PLAYER_TEAM_KEY = "rpe-player-team-v1";
const COACH_SESSION_KEY = "rpe-coach-session-v1";
const CALENDAR_LOAD_PLANS_KEY = "rpe-calendar-load-plans-v1";
const COACH_SIDEBAR_STATE_KEY = "rpe-coach-sidebar-collapsed-v1";
const DEFAULT_DEMO_TEAM_ID = "00000000-0000-4000-8000-000000000001";
const OWNER_ADMIN_TABS = ["teams", "coaches", "players", "permissions"];
const TEAM_ROLES = ["team_admin", "coach", "viewer"];
const TEAM_ROLE_LABELS = {
  owner: "בעלים",
  team_admin: "מנהל קבוצה",
  coach: "מאמן",
  viewer: "צפייה בלבד"
};
const TEAM_ROLE_DESCRIPTIONS = {
  owner: "גישה מלאה לכל הקבוצות והמערכת",
  team_admin: "ניהול שחקנים, PINים והגדרות בקבוצה המשויכת",
  coach: "צפייה, דוחות, GPS והעלאת נתוני ביצוע",
  viewer: "קריאה בלבד ללא עריכה"
};
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
  "מכופפי ירך",
  "ישבן",
  "תאומים",
  "אכילס",
  "קרסול",
  "ברך",
  "גב תחתון",
  "גב עליון",
  "מפשעה",
  "כתף",
  "צוואר",
  "אחר"
];
const PAIN_SIDES = ["ימין", "שמאל", "דו צדדי"];
const FOOTBALL_PAIN_REGIONS = [
  { id: "neck-front", area: "צוואר", view: "front", shape: "rect", x: 91, y: 54, w: 18, h: 16, labelX: 100, labelY: 61 },
  { id: "shoulder-right-front", area: "כתף", view: "front", shape: "ellipse", cx: 62, cy: 82, rx: 16, ry: 13, labelX: 52, labelY: 77 },
  { id: "shoulder-left-front", area: "כתף", view: "front", shape: "ellipse", cx: 138, cy: 82, rx: 16, ry: 13, labelX: 148, labelY: 77 },
  { id: "hip-flexor-front", area: "מכופפי ירך", view: "front", shape: "rect", x: 78, y: 154, w: 44, h: 24, labelX: 100, labelY: 166 },
  { id: "groin-front", area: "מפשעה", view: "front", shape: "ellipse", cx: 100, cy: 184, rx: 22, ry: 16, labelX: 100, labelY: 189 },
  { id: "adductors-front", area: "מקרבים", view: "front", shape: "rect", x: 82, y: 196, w: 36, h: 76, labelX: 100, labelY: 230 },
  { id: "quad-right-front", area: "ארבע ראשי", view: "front", shape: "rect", x: 58, y: 192, w: 32, h: 78, labelX: 63, labelY: 228 },
  { id: "quad-left-front", area: "ארבע ראשי", view: "front", shape: "rect", x: 110, y: 192, w: 32, h: 78, labelX: 137, labelY: 228 },
  { id: "knee-right-front", area: "ברך", view: "front", shape: "ellipse", cx: 74, cy: 282, rx: 16, ry: 13, labelX: 74, labelY: 286 },
  { id: "knee-left-front", area: "ברך", view: "front", shape: "ellipse", cx: 126, cy: 282, rx: 16, ry: 13, labelX: 126, labelY: 286 },
  { id: "calf-right-front", area: "תאומים", view: "front", shape: "rect", x: 58, y: 298, w: 30, h: 48, labelX: 60, labelY: 322 },
  { id: "calf-left-front", area: "תאומים", view: "front", shape: "rect", x: 112, y: 298, w: 30, h: 48, labelX: 140, labelY: 322 },
  { id: "ankle-right-front", area: "קרסול", view: "front", shape: "ellipse", cx: 72, cy: 352, rx: 15, ry: 10, labelX: 72, labelY: 356 },
  { id: "ankle-left-front", area: "קרסול", view: "front", shape: "ellipse", cx: 128, cy: 352, rx: 15, ry: 10, labelX: 128, labelY: 356 },
  { id: "neck-back", area: "צוואר", view: "back", shape: "rect", x: 91, y: 54, w: 18, h: 16, labelX: 100, labelY: 61 },
  { id: "upper-back", area: "גב עליון", view: "back", shape: "rect", x: 70, y: 84, w: 60, h: 48, labelX: 100, labelY: 108 },
  { id: "lower-back", area: "גב תחתון", view: "back", shape: "rect", x: 76, y: 132, w: 48, h: 42, labelX: 100, labelY: 154 },
  { id: "glute", area: "ישבן", view: "back", shape: "ellipse", cx: 100, cy: 184, rx: 34, ry: 21, labelX: 100, labelY: 190 },
  { id: "hamstring-right", area: "המסטרינג", view: "back", shape: "rect", x: 58, y: 202, w: 32, h: 72, labelX: 62, labelY: 236 },
  { id: "hamstring-left", area: "המסטרינג", view: "back", shape: "rect", x: 110, y: 202, w: 32, h: 72, labelX: 138, labelY: 236 },
  { id: "knee-back-right", area: "ברך", view: "back", shape: "ellipse", cx: 74, cy: 282, rx: 16, ry: 13, labelX: 74, labelY: 286 },
  { id: "knee-back-left", area: "ברך", view: "back", shape: "ellipse", cx: 126, cy: 282, rx: 16, ry: 13, labelX: 126, labelY: 286 },
  { id: "calf-back-right", area: "תאומים", view: "back", shape: "rect", x: 58, y: 300, w: 30, h: 42, labelX: 60, labelY: 320 },
  { id: "calf-back-left", area: "תאומים", view: "back", shape: "rect", x: 112, y: 300, w: 30, h: 42, labelX: 140, labelY: 320 },
  { id: "achilles-right", area: "אכילס", view: "back", shape: "rect", x: 64, y: 342, w: 18, h: 24, labelX: 63, labelY: 354 },
  { id: "achilles-left", area: "אכילס", view: "back", shape: "rect", x: 118, y: 342, w: 18, h: 24, labelX: 138, labelY: 354 }
];

const DEFAULT_PLAYERS = MONTH_DEMO_PLAYERS.map((player) => ({ ...player }));

const PLAYER_POSITIONS = [
  ["שוער", "Goalkeeper"],
  ["בלם", "Defender"],
  ["מגן", "Full Back"],
  ["קשר", "Midfielder"],
  ["כנף", "Winger"],
  ["חלוץ", "Striker"]
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
const GPS_REQUIRED_FIELDS = ["playerName"];
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
  ["totalDistance", "Distance"],
  ["distancePerMinute", "Distance per minute"],
  ["highSpeedRunning", "HSR"],
  ["sprintDistance", "Sprint Distance"],
  ["sprintCount", "Number of Sprints"],
  ["maxSpeed", "Max Speed"],
  ["accelerations", "Accelerations"],
  ["decelerations", "Decelerations"],
  ["gpsLoad", "GPS Load"],
  ["metabolicActivity", "Metabolic Activity"],
  ["hmld", "HMLD"],
  ["workRestRatio", "Work Rest Ratio"],
  ["intensity", "Intensity"],
  ["minutesPlayed", "Minutes Played"],
  ["distanceAbove18", "Distance above 18"],
  ["distanceAbove25", "Distance above 25"]
];
const GPS_METRIC_GROUPS = [
  { title: "Volume", keys: ["totalDistance", "minutesPlayed", "distancePerMinute"] },
  { title: "Speed", keys: ["highSpeedRunning", "maxSpeed", "distanceAbove18", "distanceAbove25"] },
  { title: "Sprint", keys: ["sprintDistance", "sprintCount"] },
  { title: "Load", keys: ["gpsLoad", "metabolicActivity", "hmld", "intensity", "workRestRatio"] },
  { title: "Accel/Decel", keys: ["accelerations", "decelerations"] }
];
const GPS_SESSION_META_MARKER = "__GPS_SESSION_META__:";
const GPS_ACTIVITY_TYPES = [
  ["match", "משחק"],
  ["training", "אימון"],
  ["training_match", "משחק אימון"]
];
const GPS_COMPETITIONS = ["ליגה", "גביע המדינה", "גביע הטוטו", "ידידות / משחק אימון"];
const GPS_HOME_AWAY_OPTIONS = ["בית", "חוץ"];
const GPS_MATCH_DAY_RELATIONS = ["MD+1", "MD+2", "MD-4", "MD-3", "MD-2", "MD-1"];
const GPS_TRAINING_MATCH_FORMATS = ["11v11", "10v10", "8v8", "דקות מחולקות"];
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
    metric: "totalDistance",
    initializedSession: false
  },
  calendar: {
    view: "month",
    anchorDate: todayIso(),
    filter: "all",
    selectedDate: todayIso(),
    popoverDate: ""
  },
  gpsImport: null,
  gpsImportModalOpen: false,
  gpsSessionSetup: createDefaultGpsSessionSetup(),
  sessionEditId: null,
  playerLogin: {
    teams: [],
    teamsLoaded: false,
    teamsLoading: false,
    teamError: "",
    selectedTeamCode: "",
    rosterLoading: false,
    rosterError: ""
  },
  ownerAdmin: {
    tab: "teams",
    teamFilter: "all",
    loading: false,
    error: "",
    notice: "",
    teams: [],
    coaches: [],
    players: [],
    owners: []
  }
};

const app = document.getElementById("app");
let supabaseStatus = isSupabaseMode() ? "idle" : "local";
let supabaseError = "";
let supabaseFatalError = false;
let supabaseSaveTimer = null;
let supabaseClient = null;
let coachSession = loadCoachSession();
let state = isSupabaseMode() ? createEmptyState() : loadState();
logRuntimeStartup();

function createDefaultGpsSessionSetup() {
  return {
    date: todayIso(),
    sessionName: "GPS",
    activityType: "match",
    competition: "ליגה",
    matchRound: "",
    opponent: "",
    homeAway: "בית",
    result: "",
    matchDayRelation: "MD-1",
    format: "11v11",
    notes: ""
  };
}

window.addEventListener("popstate", render);
document.addEventListener("click", (event) => {
  const link = event.target.closest("a[data-route]");
  if (!link) return;
  const url = new URL(link.href);
  if (url.origin !== window.location.origin) return;
  event.preventDefault();
  navigate(url.pathname);
});
document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  const shell = document.querySelector("[data-coach-shell]");
  if (!shell?.classList.contains("sidebar-mobile-open")) return;
  shell.classList.remove("sidebar-mobile-open");
  shell.querySelector("[data-sidebar-mobile-toggle]")?.setAttribute("aria-expanded", "false");
  document.body.classList.remove("coach-menu-open");
});

startApplication();

async function startApplication() {
  if (!isSupabaseMode()) {
    render();
    return;
  }
  await restoreCoachSession();
  if (shouldLoadSupabaseStateForCurrentRoute()) {
    await bootstrapSupabaseState();
    return;
  }
  render();
}

function render() {
  if (!isSupabaseMode()) {
    state = loadState();
  }
  const path = normalizePath(window.location.pathname);
  if (path === "/coach/login") {
    renderCoachLogin();
    return;
  }
  if (isCoachRoute(path) && requiresCoachLogin() && !coachSession) {
    renderCoachLogin();
    return;
  }
  if (isSupabaseMode() && isCoachRoute(path) && coachSession && supabaseStatus === "idle") {
    bootstrapSupabaseState();
    return;
  }
  if (isSupabaseMode() && supabaseStatus === "loading") {
    renderLoadingScreen("טוען נתונים מ-Supabase...");
    return;
  }
  if (isSupabaseMode() && supabaseFatalError) {
    renderStorageError();
    return;
  }
  if (path === "/" || path === "/index.html") {
    navigate("/report", true);
    return;
  }

  const coachRouteAliases = {
    "/gps": "/coach/gps",
    "/calendar": "/coach/calendar",
    "/reports": "/coach/reports"
  };
  if (coachRouteAliases[path]) {
    navigate(coachRouteAliases[path], true);
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
    renderCoachHome();
    return;
  }

  if (path === "/coach/analytics") {
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
    const playerRoute = parseCoachPlayerRoute(path);
    renderPlayerProfile(playerRoute.playerId, playerRoute.tab);
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

  if (path === "/coach/calendar") {
    renderCalendarPage();
    return;
  }

  if (path === "/coach/settings") {
    renderSettingsPage();
    return;
  }

  if (path === "/coach/admin") {
    if (!isPlatformOwner()) {
      renderAccessDenied();
      return;
    }
    renderOwnerAdminPage();
    return;
  }

  renderNotFound();
}

function normalizePath(path) {
  return path.endsWith("/") && path.length > 1 ? path.slice(0, -1) : path;
}

function isCoachRoute(path) {
  return path === "/coach" || path.startsWith("/coach/");
}

function requiresCoachLogin() {
  return isSupabaseMode();
}

function shouldLoadSupabaseStateForCurrentRoute() {
  if (!isSupabaseMode()) return false;
  const path = normalizePath(window.location.pathname);
  if (isCoachRoute(path)) return Boolean(coachSession);
  if (path === "/report" || path.startsWith("/report/")) return Boolean(coachSession);
  return false;
}

function getActiveTeamId() {
  const playerTeam = getPlayerTeamContext();
  return coachSession?.teamId || playerTeam?.teamId || APP_CONFIG.teamId;
}

function getActiveTeamName() {
  const playerTeam = getPlayerTeamContext();
  return coachSession?.teamName || playerTeam?.teamName || APP_CONFIG.teamName;
}

function getActiveTeamSlug() {
  const playerTeam = getPlayerTeamContext();
  return coachSession?.teamSlug || playerTeam?.teamSlug || slugify(getActiveTeamName());
}

function getActiveCoachName() {
  return coachSession?.coachName || coachSession?.email || "צוות מקצועי";
}

function isPlatformOwner() {
  return Boolean(coachSession?.isOwner || coachSession?.platformRole === "owner" || coachSession?.role === "owner");
}

function getCoachTeams() {
  return Array.isArray(coachSession?.teams) ? coachSession.teams : [];
}

function getActiveTeamAssignment() {
  const teams = getCoachTeams();
  return teams.find((team) => team.id === getActiveTeamId()) || teams[0] || null;
}

function getActiveTeamRole() {
  if (isPlatformOwner()) return "owner";
  return coachSession?.role || getActiveTeamAssignment()?.role || "coach";
}

function getRoleLabel(role) {
  return TEAM_ROLE_LABELS[role] || role || "מאמן";
}

function canManageSystem() {
  return isPlatformOwner();
}

function canManageCurrentTeam() {
  return isPlatformOwner() || getActiveTeamRole() === "team_admin";
}

function canWriteOperationalData() {
  return isPlatformOwner() || ["team_admin", "coach"].includes(getActiveTeamRole());
}

function isReadOnlyCoach() {
  return isSupabaseMode() && getActiveTeamRole() === "viewer";
}

function getPlayerTeamContext() {
  try {
    const raw = localStorage.getItem(PLAYER_TEAM_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.teamId) return null;
    return parsed;
  } catch (error) {
    return null;
  }
}

function setPlayerTeamContext(context) {
  try {
    if (!context || !context.teamId) {
      localStorage.removeItem(PLAYER_TEAM_KEY);
      return;
    }
    localStorage.setItem(PLAYER_TEAM_KEY, JSON.stringify({
      teamId: context.teamId,
      teamName: context.teamName || APP_CONFIG.teamName,
      teamSlug: context.teamSlug || slugify(context.teamName || APP_CONFIG.teamName)
    }));
  } catch (error) {
    console.warn("[Player Team] Failed to persist team context", error);
  }
}

function loadCoachSession() {
  try {
    const raw = localStorage.getItem(COACH_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.accessToken || !parsed.userId || !parsed.teamId) return null;
    return parsed;
  } catch (error) {
    return null;
  }
}

function saveCoachSession(session) {
  coachSession = session;
  supabaseClient = null;
  try {
    if (session) {
      localStorage.setItem(COACH_SESSION_KEY, JSON.stringify(session));
    } else {
      localStorage.removeItem(COACH_SESSION_KEY);
    }
  } catch (error) {
    console.warn("[Coach Auth] Failed to persist session", error);
  }
}

function clearCoachSession() {
  saveCoachSession(null);
  state = createEmptyState();
  supabaseStatus = isSupabaseMode() ? "idle" : "local";
}

async function restoreCoachSession() {
  if (!coachSession) return null;
  if (!isCoachSessionExpiring(coachSession)) return coachSession;
  try {
    return await refreshCoachSession();
  } catch (error) {
    console.warn("[Coach Auth] Session refresh failed", error);
    clearCoachSession();
    return null;
  }
}

function isCoachSessionExpiring(session) {
  const expiresAt = Number(session?.expiresAt || 0);
  if (!expiresAt) return false;
  return expiresAt * 1000 < Date.now() + 60_000;
}

async function refreshCoachSession() {
  if (!coachSession?.refreshToken) throw new Error("אין refresh token לשחזור התחברות.");
  const auth = await supabaseAuthRequest("token?grant_type=refresh_token", {
    method: "POST",
    body: JSON.stringify({ refresh_token: coachSession.refreshToken })
  });
  const baseSession = buildAuthSession(auth, coachSession.email);
  const enriched = await enrichCoachSession(baseSession);
  saveCoachSession(enriched);
  return enriched;
}

function buildAuthSession(auth, emailFallback = "") {
  const user = auth.user || {};
  return {
    accessToken: auth.access_token,
    refreshToken: auth.refresh_token || "",
    expiresAt: auth.expires_at || Math.floor(Date.now() / 1000) + Number(auth.expires_in || 3600),
    userId: user.id || auth.user_id || "",
    email: user.email || emailFallback || "",
    coachId: "",
    coachName: "",
    teamId: "",
    teamName: "",
    teamSlug: "",
    role: "coach",
    isOwner: false,
    platformRole: "",
    teams: []
  };
}

async function enrichCoachSession(session) {
  const previousSession = coachSession;
  coachSession = session;
  supabaseClient = null;
  try {
    const context = await loadCoachSessionContext();
    const teams = normalizeCoachTeams(context.teams || []);
    if (!teams.length) throw new Error("לא נמצאה קבוצה פעילה למשתמש הזה.");
    const previousTeamId = previousSession?.teamId || "";
    const selectedTeam = teams.find((team) => team.id === previousTeamId) || teams[0];
    return {
      ...session,
      coachId: selectedTeam.coachId || context.coachId || "",
      coachName: context.coachName || context.email || session.email || "צוות מקצועי",
      email: context.email || session.email || "",
      role: context.isOwner ? "owner" : selectedTeam.role || context.role || "coach",
      isOwner: Boolean(context.isOwner),
      platformRole: context.isOwner ? "owner" : "",
      teamId: selectedTeam.id,
      teamName: selectedTeam.name,
      teamSlug: selectedTeam.slug || slugify(selectedTeam.name),
      teams
    };
  } catch (error) {
    coachSession = previousSession;
    supabaseClient = null;
    throw error;
  }
}

async function loadCoachSessionContext() {
  try {
    const payload = await supabaseRpc("coach_session_context", {});
    return normalizeRpcPayload(payload);
  } catch (error) {
    console.warn("[Coach Auth] coach_session_context RPC unavailable; falling back to direct coach lookup", error);
    const coachRows = await supabaseSelect("coaches", `user_id=eq.${encodeURIComponent(coachSession.userId)}&active=eq.true&select=id,team_id,name,email,role`);
    if (!coachRows.length) throw error;
    const teamIds = unique(coachRows.map((row) => row.team_id).filter(Boolean));
    const teamRows = await supabaseSelect("teams", `id=in.(${teamIds.map((id) => encodeURIComponent(id)).join(",")})&active=eq.true&select=id,name,slug,active`);
    return {
      isOwner: false,
      role: coachRows[0]?.role || "coach",
      coachId: coachRows[0]?.id || "",
      coachName: coachRows[0]?.name || coachRows[0]?.email || coachSession.email || "צוות מקצועי",
      email: coachRows[0]?.email || coachSession.email || "",
      teams: teamRows.map((team) => {
        const assignment = coachRows.find((row) => row.team_id === team.id) || {};
        return { ...team, role: assignment.role || "coach", coachId: assignment.id || "" };
      })
    };
  }
}

function normalizeCoachTeams(teams) {
  return (Array.isArray(teams) ? teams : []).map((team) => ({
    id: team.id,
    name: team.name || "קבוצה",
    slug: team.slug || slugify(team.name || "team"),
    active: team.active !== false,
    role: team.role || "coach",
    coachId: team.coachId || team.coach_id || ""
  })).filter((team) => team.id);
}

async function supabaseAuthPasswordLogin(email, password) {
  const auth = await supabaseAuthRequest("token?grant_type=password", {
    method: "POST",
    body: JSON.stringify({ email, password })
  });
  const baseSession = buildAuthSession(auth, email);
  if (!baseSession.accessToken || !baseSession.userId) {
    throw new Error("תגובה לא תקינה מ-Supabase Auth.");
  }
  return enrichCoachSession(baseSession);
}

async function supabaseAuthLogout() {
  if (!coachSession?.accessToken) return;
  try {
    await supabaseAuthRequest("logout", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${coachSession.accessToken}`
      }
    });
  } catch (error) {
    console.warn("[Coach Auth] Supabase logout failed; clearing local session anyway", error);
  }
}

async function supabaseAuthRequest(path, options = {}) {
  ensureSupabaseConfig();
  const baseUrl = APP_CONFIG.supabaseUrl.replace(/\/$/, "");
  const headers = {
    apikey: APP_CONFIG.supabasePublishableKey,
    "Content-Type": "application/json",
    ...(options.headers || {})
  };
  const response = await fetch(`${baseUrl}/auth/v1/${path}`, { ...options, headers });
  const text = await response.text();
  if (!response.ok) {
    console.error("[Coach Auth] Supabase Auth request failed", {
      path,
      status: response.status,
      response: text
    });
    throw new Error(text || `Supabase Auth failed: ${response.status}`);
  }
  return text ? JSON.parse(text) : {};
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

function parseCoachPlayerRoute(path) {
  const parts = normalizePath(path).split("/").filter(Boolean);
  return {
    playerId: parts[2] || "",
    tab: normalizeCoachPlayerProfileTab(parts[3] || "readiness")
  };
}

function normalizeCoachPlayerProfileTab(tab) {
  return getCoachPlayerProfileTabs().some((item) => item.id === tab) ? tab : "readiness";
}

function getCoachPlayerProfileTabs() {
  return [
    { id: "readiness", label: "מוכנות" },
    { id: "load", label: "עומסים" },
    { id: "gps", label: "GPS" },
    { id: "sleep", label: "שינה" },
    { id: "pain", label: "כאבים" },
    { id: "hydration", label: "הידרציה" },
    { id: "notes", label: "הערות דוח" }
  ];
}

function mount(html, bind) {
  document.body.classList.remove("coach-menu-open");
  app.innerHTML = html;
  if (typeof bind === "function") bind();
  bindCoachNavigation();
}

function renderLoadingScreen(message = "טוען נתונים...") {
  mount(`
    <main class="loading-screen">
      <h1>${escapeHtml(APP_CONFIG.appName)}</h1>
      <p>${escapeHtml(message)}</p>
    </main>
  `);
}

function renderStorageError() {
  mount(`
    <main class="not-found">
      <div class="surface form-panel">
        <h1>שגיאת חיבור ל-Supabase</h1>
        <p>${escapeHtml(supabaseError || "לא ניתן לטעון נתונים כרגע.")}</p>
        <button id="retrySupabase" class="btn primary" type="button">נסה שוב</button>
      </div>
    </main>
  `, () => {
    document.getElementById("retrySupabase").addEventListener("click", bootstrapSupabaseState);
  });
}

function renderCoachLogin() {
  mount(`
    <main class="coach-login-page">
      <section class="coach-login-shell">
        <div class="coach-login-brand">
          <span class="coach-sidebar-mark" aria-hidden="true">R</span>
          <div>
            <span class="eyebrow">מרכז צוות מקצועי</span>
            <h1>דוח RPE קבוצתי</h1>
            <p>כניסה מאובטחת למאמנים לפי צוות. כל מאמן רואה רק את נתוני הקבוצה שהוגדרה לו.</p>
          </div>
        </div>
        <form id="coachLoginForm" class="surface coach-login-card" autocomplete="on">
          <div class="form-intro">
            <h2>כניסת צוות מקצועי</h2>
            <p>${isSupabaseMode() ? "התחבר עם משתמש Supabase Auth שהוקצה לצוות שלך." : "מצב מקומי לפיתוח בלבד. בפרודקשן יש להשתמש ב-Supabase Auth."}</p>
          </div>
          <div class="field">
            <label for="coachEmail">אימייל / שם משתמש</label>
            <input id="coachEmail" name="email" type="email" inputmode="email" autocomplete="username" required />
          </div>
          <div class="field">
            <label for="coachPassword">סיסמה</label>
            <input id="coachPassword" name="password" type="password" autocomplete="current-password" required />
          </div>
          <button class="btn primary" type="submit">כניסה</button>
          <a href="/report" data-route class="btn secondary">כניסת שחקן</a>
          <div id="coachLoginError" class="success-box danger-box" role="alert"></div>
        </form>
      </section>
    </main>
  `, bindCoachLogin);
}

function bindCoachLogin() {
  const form = document.getElementById("coachLoginForm");
  const errorBox = document.getElementById("coachLoginError");
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = form.querySelector("button[type='submit']");
    const data = new FormData(form);
    const email = String(data.get("email") || "").trim();
    const password = String(data.get("password") || "");
    if (!email || !password) return;
    button.disabled = true;
    button.textContent = "מתחבר...";
    errorBox.classList.remove("show");
    errorBox.textContent = "";
    try {
      if (isSupabaseMode()) {
        const session = await supabaseAuthPasswordLogin(email, password);
        saveCoachSession(session);
        setPlayerTeamContext({ teamId: session.teamId, teamName: session.teamName, teamSlug: session.teamSlug });
        supabaseStatus = "idle";
        await bootstrapSupabaseState();
        navigate("/coach", true);
        return;
      }
      saveCoachSession({
        accessToken: "local-dev",
        refreshToken: "",
        expiresAt: 0,
        userId: "local-dev",
        email,
        coachId: "local-dev",
        coachName: email,
        teamId: APP_CONFIG.teamId,
        teamName: APP_CONFIG.teamName,
        teamSlug: slugify(APP_CONFIG.teamName),
        role: "owner",
        isOwner: true,
        platformRole: "owner",
        teams: [{
          id: APP_CONFIG.teamId,
          name: APP_CONFIG.teamName,
          slug: slugify(APP_CONFIG.teamName),
          active: true,
          role: "owner",
          coachId: "local-dev"
        }]
      });
      navigate("/coach", true);
    } catch (error) {
      console.error("[Coach Auth] login failed", error);
      errorBox.textContent = error.message || "התחברות נכשלה. בדוק אימייל וסיסמה.";
      errorBox.classList.add("show");
    } finally {
      button.disabled = false;
      button.textContent = "כניסה";
    }
  });
}

function renderStorageStatus() {
  const status = getStorageStatus();
  return `
    <div class="storage-status ${status.tone}" aria-label="${escapeAttr(status.detail)}">
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
      detail: `מחובר ל-Supabase · Team ${getActiveTeamId()}`,
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
        ${diagnosticItem("צוות פעיל", `${getActiveTeamName()} · ${getActiveTeamId()}`, getActiveTeamId() ? "green" : "red")}
        ${diagnosticItem("מאמן מחובר", coachSession ? getActiveCoachName() : "אין", coachSession ? "green" : "yellow")}
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
    teamId: getActiveTeamId()
  });
}

function createSupabaseRestClient() {
  ensureSupabaseConfig();
  const baseUrl = APP_CONFIG.supabaseUrl.replace(/\/$/, "");
  console.info("[RPE Runtime] Supabase client creation", {
    baseUrlPresent: Boolean(baseUrl),
    publishableKeyPresent: Boolean(APP_CONFIG.supabasePublishableKey),
    teamId: getActiveTeamId(),
    authenticatedCoach: Boolean(coachSession?.accessToken)
  });
  STORAGE_DIAGNOSTICS.supabaseClientInitialized = true;
  return {
    async request(path, options = {}) {
      const method = options.method || "GET";
      const headers = {
        apikey: APP_CONFIG.supabasePublishableKey,
        Authorization: getSupabaseAuthorizationHeader(),
        ...getSupabasePlayerAccessHeaders(),
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

function getSupabaseAuthorizationHeader() {
  return `Bearer ${coachSession?.accessToken || APP_CONFIG.supabasePublishableKey}`;
}

function getSupabasePlayerAccessHeaders() {
  if (coachSession) return {};
  const session = getPlayerSession();
  if (!session?.playerId || !session?.teamId || !session?.pin) return {};
  return {
    "x-rpe-team-id": session.teamId,
    "x-rpe-player-id": session.playerId,
    "x-rpe-player-pin": session.pin
  };
}

function ensureSupabaseClient() {
  if (!supabaseClient) {
    supabaseClient = createSupabaseRestClient();
  }
  return supabaseClient;
}

function createInitialState() {
  return APP_CONFIG.seedDemoData ? createMonthDemoState() : createEmptyState();
}

function createEmptyState() {
  return {
    schemaVersion: 3,
    seededAt: new Date().toISOString(),
    team: {
      id: getActiveTeamId(),
      name: getActiveTeamName(),
      slug: getActiveTeamSlug(),
      active: true
    },
    demoDataset: null,
    players: [],
    painAreas: [...DEFAULT_PAIN_AREAS],
    settings: { ...DEFAULT_SETTINGS },
    readinessReports: [],
    reports: [],
    sessions: [],
    gpsSessions: [],
    gpsRecords: [],
    calendarLoadPlans: loadCalendarLoadPlans()
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
  const defaultPlayerById = new Map(DEFAULT_PLAYERS.map((player) => [player.id, player]));
  const fallbackPlayers = APP_CONFIG.seedDemoData ? DEFAULT_PLAYERS : [];
  const sourcePlayers = Array.isArray(data.players) ? data.players : fallbackPlayers;
  const players = sourcePlayers.map((player, index) => ({
    id: player.id || createId("p"),
    teamId: player.teamId || getActiveTeamId(),
    name: player.name || `שחקן ${index + 1}`,
    active: player.active !== false,
    pin: normalizePin(player.pin || defaultPinById.get(player.id) || "1234"),
    position: normalizePlayerPosition(player.position || defaultPlayerById.get(player.id)?.position || "")
  }));

  const reports = Array.isArray(data.reports) ? data.reports.map((report) => {
    const painArea = report.painArea || NO_PAIN;
    return {
      ...report,
      completedFullSession: report.completedFullSession || "מלא",
      fatigue: Number(report.fatigue ?? report.fatigueAfterTraining ?? 0),
      soreness: Number(report.soreness ?? report.sorenessAfterTraining ?? 0),
      painArea,
      detailedPainArea: painArea === NO_PAIN ? "" : report.detailedPainArea || painArea,
      painSide: painArea === NO_PAIN ? "" : report.painSide || "דו צדדי",
      painIntensity: painArea === NO_PAIN || report.painIntensity === undefined || report.painIntensity === "" ? null : Number(report.painIntensity),
      bodyWeightAfter: report.bodyWeightAfter === undefined || report.bodyWeightAfter === "" ? null : Number(report.bodyWeightAfter),
      comments: report.comments || ""
    };
  }) : [];

  return {
    schemaVersion: 3,
    seededAt: data.seededAt || new Date().toISOString(),
    team: data.team || {
      id: getActiveTeamId(),
      name: getActiveTeamName(),
      slug: getActiveTeamSlug(),
      active: true
    },
    demoDataset: data.demoDataset || null,
    players,
    painAreas: unique([...(Array.isArray(data.painAreas) ? data.painAreas : []), ...DEFAULT_PAIN_AREAS]),
    settings: { ...DEFAULT_SETTINGS, ...(data.settings || {}) },
    readinessReports: Array.isArray(data.readinessReports) ? data.readinessReports.map(normalizeReadinessReport) : [],
    reports,
    sessions: Array.isArray(data.sessions) ? data.sessions : [],
    gpsSessions: Array.isArray(data.gpsSessions) ? data.gpsSessions : [],
    gpsRecords: Array.isArray(data.gpsRecords) ? data.gpsRecords : [],
    calendarLoadPlans: normalizeCalendarLoadPlans({ ...loadCalendarLoadPlans(), ...(data.calendarLoadPlans || {}) })
  };
}

function normalizeCalendarLoadPlans(plans) {
  return Object.fromEntries(Object.entries(plans || {})
    .filter(([date]) => /^\d{4}-\d{2}-\d{2}$/.test(date))
    .map(([date, plan]) => [date, {
      gpsLoad: normalizeLoadPlanValue(plan && plan.gpsLoad),
      rpeLoad: normalizeLoadPlanValue(plan && plan.rpeLoad)
    }]));
}

function normalizeLoadPlanValue(value) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 1 && number <= 5 ? Math.round(number) : null;
}

function loadCalendarLoadPlans() {
  try {
    return normalizeCalendarLoadPlans(JSON.parse(localStorage.getItem(getCalendarLoadPlansKey()) || "{}"));
  } catch (error) {
    return {};
  }
}

function persistCalendarLoadPlans() {
  try {
    localStorage.setItem(getCalendarLoadPlansKey(), JSON.stringify(state.calendarLoadPlans || {}));
  } catch (error) {
    console.warn("[Calendar] Failed to persist planned load scores", error);
  }
}

function getCalendarLoadPlansKey() {
  return `${CALENDAR_LOAD_PLANS_KEY}:${getActiveTeamId()}`;
}

function saveCalendarLoadPlan(date, gpsLoad, rpeLoad) {
  const plan = {
    gpsLoad: normalizeLoadPlanValue(gpsLoad),
    rpeLoad: normalizeLoadPlanValue(rpeLoad)
  };
  state.calendarLoadPlans = state.calendarLoadPlans || {};
  if (plan.gpsLoad || plan.rpeLoad) {
    state.calendarLoadPlans[date] = plan;
  } else {
    delete state.calendarLoadPlans[date];
  }
  persistCalendarLoadPlans();
  if (!isSupabaseMode()) saveState();
}

function normalizeReadinessReport(report) {
  const painArea = report.painArea || NO_PAIN;
  return {
    ...report,
    painArea,
    detailedPainArea: report.detailedPainArea || (painArea !== NO_PAIN ? painArea : ""),
    painSide: painArea === NO_PAIN ? "" : report.painSide || "דו צדדי",
    painIntensity: painArea === NO_PAIN || report.painIntensity === undefined || report.painIntensity === "" ? null : Number(report.painIntensity),
    comments: report.comments || ""
  };
}

function saveState() {
  if (isSupabaseMode()) {
    if (!canWriteOperationalData()) {
      showStorageWarning("למשתמש צפייה בלבד אין הרשאה לשמור שינויים.");
      return;
    }
    if (!coachSession) {
      showStorageWarning("שמירה מלאה ל-Supabase דורשת כניסת צוות מקצועי. דוחות שחקן נשמרים במסלול נקודתי בלבד.");
      return;
    }
    queueSupabaseSave();
    return;
  }
  localStorage.setItem(STORE_KEY, JSON.stringify(state));
}

async function savePlayerReportToSupabase(report, type) {
  ensureSupabaseConfig();
  if (type === "readiness") {
    try {
      await supabaseUpsert("readiness_reports", [toSupabaseReadinessReport(report, true)], "team_id,player_id,report_date");
    } catch (error) {
      if (!isMissingReadinessPainColumnError(error)) throw error;
      await supabaseUpsert("readiness_reports", [toSupabaseReadinessReport(report, false)], "team_id,player_id,report_date");
    }
    return;
  }
  if (type === "rpe") {
    await supabaseUpsert("rpe_reports", [toSupabaseRpeReport(report)], "team_id,player_id,report_date");
    return;
  }
  throw new Error("סוג דוח שחקן לא נתמך.");
}

async function persistPlayerReport(report, type) {
  if (!isSupabaseMode() || coachSession) {
    saveState();
    return true;
  }
  try {
    await savePlayerReportToSupabase(report, type);
    supabaseStatus = "connected";
    updateStorageDiagnosticsError("");
    clearStorageWarning();
    return true;
  } catch (error) {
    logSupabaseError(`player-${type}-save`, error);
    updateStorageDiagnosticsError(error.message || String(error));
    showStorageWarning(`שמירת דוח שחקן ל-Supabase נכשלה: ${STORAGE_DIAGNOSTICS.lastSupabaseError}`);
    alert("שמירת הדוח נכשלה מול Supabase. פנה לצוות המקצועי.");
    return false;
  }
}

async function resetDemoState() {
  const demoState = createMonthDemoState();
  const replaceLegacyDemo = isPureLegacyDemoState(state);
  state = mergeMonthDemoState(state, demoState, replaceLegacyDemo);
  persistCalendarLoadPlans();
  localStorage.removeItem(PLAYER_SESSION_KEY);
  if (isSupabaseMode()) {
    try {
      console.info("[RPE Demo] Safe month demo reseed started", {
        teamId: getActiveTeamId(),
        demoPrefix: DEMO_DATA_PREFIX,
        demoVersion: DEMO_DATASET_VERSION
      });
      await deleteKnownDemoRowsFromSupabase(replaceLegacyDemo);
      await saveSupabaseState(state);
      supabaseStatus = "connected";
      updateStorageDiagnosticsError("");
      clearStorageWarning();
      console.info("[RPE Demo] One-month demo data saved to Supabase", getDemoDatasetCounts(state));
    } catch (error) {
      logSupabaseError("month-demo-reseed", error);
      supabaseStatus = "error";
      updateStorageDiagnosticsError(error.message || String(error));
      showStorageWarning(`טעינת חודש הדמו ל-Supabase נכשלה: ${STORAGE_DIAGNOSTICS.lastSupabaseError}`);
    }
  } else {
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
  }
  render();
}

function createMonthDemoState() {
  const dataset = createMonthDemoDataset(todayIso());
  return {
    ...dataset,
    painAreas: [...DEFAULT_PAIN_AREAS],
    settings: { ...DEFAULT_SETTINGS }
  };
}

function mergeMonthDemoState(currentState, demoState, replaceLegacyDemo = false) {
  const current = currentState || createEmptyState();
  return normalizeState({
    ...current,
    schemaVersion: 3,
    seededAt: demoState.seededAt,
    demoDataset: demoState.demoDataset,
    players: replaceKnownDemoRows(current.players, demoState.players, replaceLegacyDemo),
    readinessReports: replaceKnownDemoRows(current.readinessReports, demoState.readinessReports, replaceLegacyDemo),
    reports: replaceKnownDemoRows(current.reports, demoState.reports, replaceLegacyDemo),
    sessions: replaceKnownDemoRows(current.sessions, demoState.sessions, replaceLegacyDemo),
    gpsSessions: replaceKnownDemoRows(current.gpsSessions, demoState.gpsSessions, replaceLegacyDemo),
    gpsRecords: replaceKnownDemoRows(current.gpsRecords, demoState.gpsRecords, replaceLegacyDemo),
    painAreas: unique([...(current.painAreas || []), ...demoState.painAreas]),
    settings: { ...demoState.settings, ...(current.settings || {}) },
    calendarLoadPlans: { ...(current.calendarLoadPlans || {}), ...(demoState.calendarLoadPlans || {}) }
  });
}

function replaceKnownDemoRows(currentRows = [], demoRows = [], replaceLegacyDemo = false) {
  const realRows = currentRows.filter((item) => !isKnownDemoRow(item, replaceLegacyDemo));
  return [...demoRows, ...realRows];
}

function isKnownDemoRow(item, includeLegacy = false) {
  const id = item && item.id;
  return isMonthDemoId(id) || (includeLegacy && isLegacyBuiltInDemoId(id));
}

function isPureLegacyDemoState(candidate) {
  if (!candidate || !Array.isArray(candidate.players) || candidate.players.length !== 9) return false;
  const collections = [candidate.players, candidate.readinessReports, candidate.reports, candidate.sessions, candidate.gpsSessions, candidate.gpsRecords];
  return collections.every((rows) => Array.isArray(rows) && rows.every((item) => isLegacyBuiltInDemoId(item.id)));
}

function getDemoDatasetCounts(nextState = state) {
  const count = (rows) => (rows || []).filter((item) => isMonthDemoId(item.id)).length;
  return {
    players: count(nextState.players),
    readinessReports: count(nextState.readinessReports),
    rpeReports: count(nextState.reports),
    sessions: count(nextState.sessions),
    gpsSessions: count(nextState.gpsSessions),
    gpsRecords: count(nextState.gpsRecords)
  };
}

function getDemoDatasetAnchorDate(nextState = state) {
  if (nextState.demoDataset && nextState.demoDataset.anchorDate) return nextState.demoDataset.anchorDate;
  return (nextState.readinessReports || [])
    .filter((report) => isMonthDemoId(report.id))
    .map((report) => report.date)
    .sort()
    .reverse()[0] || "";
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
  const teamId = getActiveTeamId();
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

  const shouldSeedDemo = shouldSeedDemoForActiveTeam(teamRows, players);
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
    team: teamRows[0] ? { id: teamRows[0].id, name: teamRows[0].name, slug: teamRows[0].slug, active: teamRows[0].active !== false } : null,
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

function shouldSeedDemoForActiveTeam(teamRows, playerRows) {
  const isDemoTeam = getActiveTeamId() === DEFAULT_DEMO_TEAM_ID;
  return Boolean(APP_CONFIG.seedDemoData && isDemoTeam && (!teamRows.length || !playerRows.length));
}

async function saveSupabaseState(nextState) {
  ensureSupabaseConfig();
  const teamId = getActiveTeamId();
  await supabaseUpsert("teams", [{
    id: teamId,
    name: getActiveTeamName(),
    slug: getActiveTeamSlug(),
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
    supabaseUpsertReadinessReports(nextState.readinessReports),
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

async function supabaseRpc(functionName, payload = {}) {
  return supabaseRequest(`rpc/${functionName}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
}

async function supabaseInsert(table, row) {
  return supabaseRequest(`${APP_CONFIG.supabaseTablePrefix}${table}`, {
    method: "POST",
    headers: {
      Prefer: "return=representation",
      "Content-Type": "application/json"
    },
    body: JSON.stringify(row)
  });
}

async function supabasePatch(table, query, patch) {
  return supabaseRequest(`${APP_CONFIG.supabaseTablePrefix}${table}?${query}`, {
    method: "PATCH",
    headers: {
      Prefer: "return=representation",
      "Content-Type": "application/json"
    },
    body: JSON.stringify(patch)
  });
}

async function ownerAdminApi(action, payload = {}) {
  if (!coachSession?.accessToken) throw new Error("נדרשת התחברות Owner.");
  const response = await fetch("/api/admin", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${coachSession.accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ action, ...payload })
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || result.ok === false) {
    throw new Error(result.error || `Admin API failed: ${response.status}`);
  }
  return result.result || result;
}

async function supabaseUpsertReadinessReports(reports) {
  if (!reports.length) return [];
  try {
    return await supabaseUpsert("readiness_reports", reports.map((report) => toSupabaseReadinessReport(report, true)), "team_id,id");
  } catch (error) {
    if (!isMissingReadinessPainColumnError(error)) throw error;
    console.warn("[RPE Supabase] readiness pain columns are missing; saving detailed pain data inside comments metadata", {
      message: error.message
    });
    return supabaseUpsert("readiness_reports", reports.map((report) => toSupabaseReadinessReport(report, false)), "team_id,id");
  }
}

function isMissingReadinessPainColumnError(error) {
  const message = String(error && error.message ? error.message : error || "");
  return /pain_side|pain_intensity|detailed_pain_area|schema cache|column/i.test(message);
}

async function supabaseDeleteMissing(table, column, values) {
  const teamFilter = `team_id=eq.${encodeURIComponent(getActiveTeamId())}`;
  const uniqueValues = unique(values.filter(Boolean));
  if (uniqueValues.length > 120) {
    console.info("[RPE Supabase] Skipping broad delete reconciliation for a large dataset", {
      table,
      values: uniqueValues.length
    });
    return [];
  }
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
    if (isSupabaseAuthFailure(error) && coachSession?.refreshToken && !options._retriedAuth) {
      await refreshCoachSession();
      return supabaseRequest(path, { ...options, _retriedAuth: true });
    }
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

function isSupabaseAuthFailure(error) {
  const message = String(error?.message || error || "");
  return message.includes("401") || /JWT|expired|invalid.*token|Auth/i.test(message);
}

async function deleteKnownDemoRowsFromSupabase(includeLegacy = false) {
  ensureSupabaseConfig();
  const legacySessionIds = ["s-today", "s-yesterday", "s-game", "s-rest", "s-train-5", "s-prev"];
  const legacyPlayerIds = Array.from({ length: 9 }, (_, index) => `p${index + 1}`);
  const deletionSteps = [
    ["gps_records", ["demo-month-*", ...(includeLegacy ? ["gps-full-*", "gps-first-*", "gps-second-*"] : [])]],
    ["readiness_reports", ["demo-month-*", ...(includeLegacy ? ["pre-demo-*"] : [])]],
    ["rpe_reports", ["demo-month-*", ...(includeLegacy ? ["post-demo-*"] : [])]],
    ["gps_sessions", ["demo-month-*", ...(includeLegacy ? ["gps-demo-*"] : [])]],
    ["sessions", ["demo-month-*"]]
  ];
  for (const [table, patterns] of deletionSteps) {
    for (const pattern of patterns) {
      await supabaseDeleteDemoPattern(table, pattern);
    }
  }
  if (includeLegacy) {
    await supabaseDeleteDemoIds("sessions", legacySessionIds);
    await supabaseDeleteDemoIds("players", legacyPlayerIds);
  }
  await supabaseDeleteDemoPattern("players", "demo-month-*");
}

async function supabaseDeleteDemoPattern(table, pattern) {
  const query = `team_id=eq.${encodeURIComponent(getActiveTeamId())}&id=like.${encodeURIComponent(pattern)}`;
  return supabaseRequest(`${APP_CONFIG.supabaseTablePrefix}${table}?${query}`, {
    method: "DELETE",
    headers: { Prefer: "return=minimal" }
  });
}

async function supabaseDeleteDemoIds(table, ids) {
  if (!ids.length) return [];
  const query = `team_id=eq.${encodeURIComponent(getActiveTeamId())}&id=in.(${ids.map((id) => encodeURIComponent(id)).join(",")})`;
  return supabaseRequest(`${APP_CONFIG.supabaseTablePrefix}${table}?${query}`, {
    method: "DELETE",
    headers: { Prefer: "return=minimal" }
  });
}

function logSupabaseError(context, error) {
  console.error(`[RPE Supabase] ${context} error`, {
    storageDriver: APP_CONFIG.storageDriver,
    teamId: getActiveTeamId(),
    message: error.message || String(error),
    error
  });
}

async function testSupabaseConnection() {
  console.info("[RPE Runtime] manual Supabase connection test", {
    selectedStorageDriver: APP_CONFIG.storageDriver,
    teamId: getActiveTeamId()
  });
  if (!isSupabaseMode()) {
    const message = "האפליקציה במצב Local fallback. בדוק ש-env.js נטען וש-RPE_STORAGE_DRIVER=supabase.";
    updateStorageDiagnosticsError(message);
    return { ok: false, message };
  }
  try {
    const rows = await supabaseSelect("teams", `id=eq.${encodeURIComponent(getActiveTeamId())}&select=id,name`);
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
    team_id: getActiveTeamId(),
    name: player.name,
    active: player.active !== false,
    pin_code: normalizePin(player.pin || "1234"),
    position: normalizePlayerPosition(player.position) || getPlayerPrimaryPosition(player.id) || null
  };
}

function fromSupabasePlayer(row) {
  return {
    id: row.id,
    teamId: row.team_id || getActiveTeamId(),
    name: row.name,
    active: row.active !== false,
    pin: normalizePin(row.pin_code || "1234"),
    position: normalizePlayerPosition(row.position || "")
  };
}

function toSupabaseSettings(settings) {
  return {
    team_id: getActiveTeamId(),
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
    team_id: getActiveTeamId(),
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

function toSupabaseReadinessReport(report, includeDetailedPainColumns = false) {
  const row = {
    id: report.id,
    team_id: getActiveTeamId(),
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
    comments: packReadinessComments(report)
  };
  if (includeDetailedPainColumns) {
    row.pain_side = report.painArea && report.painArea !== NO_PAIN ? report.painSide || null : null;
    row.pain_intensity = report.painArea && report.painArea !== NO_PAIN && report.painIntensity ? Number(report.painIntensity) : null;
    row.detailed_pain_area = report.painArea && report.painArea !== NO_PAIN ? report.detailedPainArea || report.painArea : null;
  }
  return row;
}

function fromSupabaseReadinessReport(row) {
  const unpacked = unpackReadinessComments(row.comments || "");
  const painArea = row.pain_area || NO_PAIN;
  return normalizeReadinessReport({
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
    painArea,
    detailedPainArea: row.detailed_pain_area || unpacked.metadata.detailedPainArea || (painArea !== NO_PAIN ? painArea : ""),
    painSide: row.pain_side || unpacked.metadata.painSide || "",
    painIntensity: row.pain_intensity === undefined || row.pain_intensity === null ? unpacked.metadata.painIntensity ?? null : Number(row.pain_intensity),
    loadFeeling: Number(row.load_feeling) || 0,
    bodyWeight: row.body_weight === null ? null : Number(row.body_weight),
    medicalLimitation: Boolean(row.medical_limitation),
    comments: unpacked.comments
  });
}

function packReadinessComments(report) {
  const comments = stripReadinessMetadata(report.comments || "").trim();
  const metadata = {};
  if (report.painArea && report.painArea !== NO_PAIN) {
    if (report.painSide) metadata.painSide = report.painSide;
    if (report.painIntensity !== null && report.painIntensity !== undefined && report.painIntensity !== "") metadata.painIntensity = Number(report.painIntensity);
    if (report.detailedPainArea) metadata.detailedPainArea = report.detailedPainArea;
  }
  if (!Object.keys(metadata).length) return comments;
  return `${comments}${comments ? "\n\n" : ""}[RPE_READINESS_METADATA]${JSON.stringify(metadata)}[/RPE_READINESS_METADATA]`;
}

function unpackReadinessComments(comments) {
  const text = String(comments || "");
  const match = text.match(/\[RPE_READINESS_METADATA\]([\s\S]*?)\[\/RPE_READINESS_METADATA\]/);
  if (!match) return { comments: text, metadata: {} };
  try {
    return {
      comments: stripReadinessMetadata(text).trim(),
      metadata: JSON.parse(match[1]) || {}
    };
  } catch (error) {
    return { comments: stripReadinessMetadata(text).trim(), metadata: {} };
  }
}

function stripReadinessMetadata(comments) {
  return String(comments || "").replace(/\s*\[RPE_READINESS_METADATA\][\s\S]*?\[\/RPE_READINESS_METADATA\]\s*/g, "").trim();
}

function toSupabaseRpeReport(report) {
  return {
    id: report.id,
    team_id: getActiveTeamId(),
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
    comments: packRpeComments(report)
  };
}

function fromSupabaseRpeReport(row) {
  const unpacked = unpackRpeComments(row.comments || "");
  const painArea = row.pain_area || NO_PAIN;
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
    painArea,
    detailedPainArea: painArea === NO_PAIN ? "" : unpacked.metadata.detailedPainArea || painArea,
    painSide: painArea === NO_PAIN ? "" : unpacked.metadata.painSide || "",
    painIntensity: painArea === NO_PAIN || unpacked.metadata.painIntensity === undefined ? null : Number(unpacked.metadata.painIntensity),
    completedFullSession: row.completed_full_session || "מלא",
    bodyWeightAfter: row.body_weight_after === null ? null : Number(row.body_weight_after),
    comments: unpacked.comments
  };
}

function packRpeComments(report) {
  const comments = stripRpeMetadata(report.comments || "").trim();
  if (!report.painArea || report.painArea === NO_PAIN) return comments;
  const metadata = {
    painSide: report.painSide || "",
    painIntensity: report.painIntensity === null || report.painIntensity === undefined ? null : Number(report.painIntensity),
    detailedPainArea: report.detailedPainArea || report.painArea
  };
  return `${comments}${comments ? "\n\n" : ""}[RPE_POST_METADATA]${JSON.stringify(metadata)}[/RPE_POST_METADATA]`;
}

function unpackRpeComments(comments) {
  const text = String(comments || "");
  const match = text.match(/\[RPE_POST_METADATA\]([\s\S]*?)\[\/RPE_POST_METADATA\]/);
  if (!match) return { comments: text, metadata: {} };
  try {
    return { comments: stripRpeMetadata(text).trim(), metadata: JSON.parse(match[1]) || {} };
  } catch (error) {
    return { comments: stripRpeMetadata(text).trim(), metadata: {} };
  }
}

function stripRpeMetadata(comments) {
  return String(comments || "").replace(/\s*\[RPE_POST_METADATA\][\s\S]*?\[\/RPE_POST_METADATA\]\s*/g, "").trim();
}

function toSupabaseGpsSession(sessionItem) {
  return {
    id: sessionItem.id,
    team_id: getActiveTeamId(),
    session_date: sessionItem.date,
    session_name: sessionItem.sessionName,
    type: sessionItem.type,
    opponent: sessionItem.opponent || null,
    notes: encodeGpsSessionNotes(sessionItem)
  };
}

function fromSupabaseGpsSession(row) {
  const parsedNotes = parseGpsSessionNotes(row.notes || "");
  return {
    id: row.id,
    date: row.session_date,
    sessionName: row.session_name,
    type: row.type,
    opponent: row.opponent || "",
    notes: parsedNotes.notes,
    ...parsedNotes.metadata
  };
}

function getGpsSessionMetadata(sessionItem) {
  return {
    activityType: sessionItem.activityType || sessionItem.type || "match",
    competition: sessionItem.competition || "",
    matchRound: sessionItem.matchRound || "",
    homeAway: sessionItem.homeAway || "",
    result: sessionItem.result || "",
    matchDayRelation: sessionItem.matchDayRelation || "",
    format: sessionItem.format || ""
  };
}

function encodeGpsSessionNotes(sessionItem) {
  const notes = String(sessionItem.notes || "").trim();
  const metadata = getGpsSessionMetadata(sessionItem);
  const metadataText = `${GPS_SESSION_META_MARKER}${JSON.stringify(metadata)}`;
  return notes ? `${notes}\n${metadataText}` : metadataText;
}

function parseGpsSessionNotes(notesText) {
  const text = String(notesText || "");
  const markerIndex = text.lastIndexOf(GPS_SESSION_META_MARKER);
  if (markerIndex === -1) return { notes: text, metadata: {} };
  const notes = text.slice(0, markerIndex).trim();
  const rawMetadata = text.slice(markerIndex + GPS_SESSION_META_MARKER.length).trim();
  try {
    const metadata = JSON.parse(rawMetadata);
    return { notes, metadata: metadata && typeof metadata === "object" ? metadata : {} };
  } catch (error) {
    console.warn("[GPS] Failed to parse session metadata", error);
    return { notes: text, metadata: {} };
  }
}

function toSupabaseGpsRecord(record) {
  return {
    id: record.id,
    team_id: getActiveTeamId(),
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
    activityType: "match",
    competition: "ליגה",
    matchRound: "מחזור 12",
    opponent: "הפועל צפון",
    homeAway: "בית",
    result: "2-1",
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

function renderPlayerTeamSelector() {
  if (!isSupabaseMode()) return "";
  const queryTeam = new URLSearchParams(window.location.search).get("team") || getActiveTeamSlug();
  return `
    <div class="field player-team-loader">
      <label for="playerTeamCode">קוד צוות</label>
      <div class="inline-control">
        <input id="playerTeamCode" name="teamCode" value="${escapeAttr(queryTeam)}" placeholder="לדוגמה: team-1" autocomplete="organization" />
        <button id="loadPlayerTeam" class="btn secondary" type="button">טען סגל</button>
      </div>
      <small>שחקנים רואים רק את רשימת השחקנים של הצוות שנבחר.</small>
      <div id="playerTeamLoadStatus" class="diagnostic-result"></div>
    </div>
  `;
}

async function loadPlayerTeamByCode(teamCode) {
  const code = String(teamCode || "").trim();
  if (!code) throw new Error("יש להזין קוד צוות.");
  const payload = await supabaseRpc("player_team_roster", { p_team_code: code });
  const roster = normalizeRpcPayload(payload);
  const team = roster.team;
  if (!team) throw new Error("לא נמצא צוות פעיל עבור הקוד שהוזן.");
  const teamId = team.id;
  setPlayerTeamContext({ teamId, teamName: team.name, teamSlug: team.slug });
  state = normalizeState({
    ...createEmptyState(),
    team: { id: team.id, name: team.name, slug: team.slug, active: team.active !== false },
    players: Array.isArray(roster.players) ? roster.players.map((player) => ({
      id: player.id,
      teamId,
      name: player.name,
      active: player.active !== false,
      position: normalizePlayerPosition(player.position || ""),
      pin: ""
    })) : [],
    painAreas: Array.isArray(roster.painAreas) && roster.painAreas.length ? roster.painAreas : [...DEFAULT_PAIN_AREAS],
    settings: roster.settings ? { ...DEFAULT_SETTINGS, ...roster.settings } : { ...DEFAULT_SETTINGS }
  });
  return state;
}

function normalizeRpcPayload(payload) {
  if (Array.isArray(payload)) return payload[0] || {};
  return payload || {};
}

async function verifyPlayerLoginWithSupabase(teamCode, playerId, pin) {
  const payload = await supabaseRpc("player_login", {
    p_team_code: String(teamCode || "").trim() || getActiveTeamSlug(),
    p_player_id: playerId,
    p_pin_code: pin
  });
  const result = normalizeRpcPayload(payload);
  if (!result || !result.player || !result.team) throw new Error("שם או PIN אינם נכונים.");
  setPlayerTeamContext({ teamId: result.team.id, teamName: result.team.name, teamSlug: result.team.slug });
  return {
    id: result.player.id,
    teamId: result.team.id,
    name: result.player.name,
    active: result.player.active !== false,
    position: normalizePlayerPosition(result.player.position || ""),
    pin
  };
}

function renderPlayerTeamSelectorV2() {
  if (!isSupabaseMode()) {
    return `
      <div class="field player-team-loader player-login-step-panel is-complete">
        <label for="playerTeamSelect">בחר קבוצה</label>
        <select id="playerTeamSelect" name="teamCode" disabled>
          <option value="${escapeAttr(getActiveTeamSlug())}">${escapeHtml(getActiveTeamName())}</option>
        </select>
        <small>מצב דמו מקומי משתמש בקבוצה הפעילה בלבד.</small>
      </div>
    `;
  }
  const loginState = uiState.playerLogin;
  const teams = Array.isArray(loginState.teams) ? loginState.teams : [];
  const selectedCode = loginState.selectedTeamCode || "";
  const loadingLabel = loginState.teamsLoading ? "טוען קבוצות..." : "בחר קבוצה";
  return `
    <div class="field player-team-loader player-login-step-panel ${selectedCode ? "is-complete" : ""}">
      <label for="playerTeamSelect">בחר קבוצה</label>
      <select id="playerTeamSelect" name="teamCode" required ${loginState.teamsLoading ? "disabled" : ""}>
        <option value="">${escapeHtml(loadingLabel)}</option>
        ${teams.map((team) => `<option value="${escapeAttr(team.slug || team.id)}" ${selectedCode === (team.slug || team.id) ? "selected" : ""}>${escapeHtml(team.name)}</option>`).join("")}
      </select>
      <small>בחר את הקבוצה שלך כדי לראות רק את שחקני הקבוצה הזו.</small>
      ${loginState.teamError ? `<div class="diagnostic-result red">${escapeHtml(loginState.teamError)}</div>` : ""}
      ${loginState.rosterError ? `<div class="diagnostic-result red">${escapeHtml(loginState.rosterError)}</div>` : ""}
      ${loginState.rosterLoading ? `<div class="diagnostic-result">טוען שחקנים...</div>` : ""}
    </div>
  `;
}

function renderPlayerSelectForLogin() {
  const canShowPlayers = !isSupabaseMode() || Boolean(uiState.playerLogin.selectedTeamCode);
  const players = canShowPlayers ? getActivePlayers() : [];
  const disabled = isSupabaseMode() && (!uiState.playerLogin.selectedTeamCode || uiState.playerLogin.rosterLoading);
  const placeholder = !uiState.playerLogin.selectedTeamCode && isSupabaseMode()
    ? "בחר קבוצה קודם"
    : uiState.playerLogin.rosterLoading
      ? "טוען שחקנים..."
      : "בחר שחקן";
  return `
    <div class="field player-login-step-panel ${players.length ? "is-complete" : ""}">
      <label for="loginPlayerId">בחר שחקן</label>
      <select id="loginPlayerId" name="playerId" required ${disabled ? "disabled" : ""}>
        <option value="">${escapeHtml(placeholder)}</option>
        ${players.map((player) => `<option value="${escapeAttr(player.id)}">${escapeHtml(player.name)}</option>`).join("")}
      </select>
    </div>
  `;
}

async function loadPlayerTeamsForLogin() {
  if (!isSupabaseMode() || uiState.playerLogin.teamsLoading || uiState.playerLogin.teamsLoaded) return;
  uiState.playerLogin.teamsLoading = true;
  uiState.playerLogin.teamError = "";
  renderPlayerLogin();
  try {
    const payload = await supabaseSelect("teams", "active=eq.true&select=id,name,slug,active&order=name.asc");
    const teams = (Array.isArray(payload) ? payload : [])
      .map((team) => ({
        id: team.id,
        name: team.name || team.slug || "קבוצה",
        slug: team.slug || team.id,
        active: team.active !== false
      }))
      .filter((team) => team.id && team.active);
    uiState.playerLogin.teams = teams;
    uiState.playerLogin.teamsLoaded = true;
    const savedTeam = getPlayerTeamContext();
    const queryTeam = new URLSearchParams(window.location.search).get("team") || "";
    const preferredCode = uiState.playerLogin.selectedTeamCode || queryTeam || savedTeam?.teamSlug || "";
    const preferredTeam = teams.find((team) => team.slug === preferredCode || team.id === preferredCode);
    if (preferredTeam && !uiState.playerLogin.selectedTeamCode) {
      uiState.playerLogin.selectedTeamCode = preferredTeam.slug || preferredTeam.id;
      if (!state.players.length || getActiveTeamId() !== preferredTeam.id) {
        await loadPlayerTeamByCodeV2(uiState.playerLogin.selectedTeamCode, { renderAfterLoad: false });
      }
    }
  } catch (error) {
    console.error("[Player Login] failed to load teams", error);
    uiState.playerLogin.teamError = error.message || "טעינת רשימת הקבוצות נכשלה. ודא שה-SQL המעודכן הורץ בסופאבייס.";
  } finally {
    uiState.playerLogin.teamsLoading = false;
    renderPlayerLogin();
  }
}

async function loadPlayerTeamByCodeV2(teamCode, options = {}) {
  const code = String(teamCode || "").trim();
  if (!code) throw new Error("יש לבחור קבוצה.");
  uiState.playerLogin.rosterLoading = true;
  uiState.playerLogin.rosterError = "";
  uiState.playerLogin.selectedTeamCode = code;
  if (options.renderAfterLoad !== false) renderPlayerLogin();
  try {
    const payload = await supabaseRpc("player_team_roster", { p_team_code: code });
    const roster = normalizeRpcPayload(payload);
    const team = roster.team;
    if (!team) throw new Error("לא נמצאה קבוצה פעילה.");
    const teamId = team.id;
    setPlayerTeamContext({ teamId, teamName: team.name, teamSlug: team.slug });
    state = normalizeState({
      ...createEmptyState(),
      team: { id: team.id, name: team.name, slug: team.slug, active: team.active !== false },
      players: Array.isArray(roster.players) ? roster.players.map((player) => ({
        id: player.id,
        teamId,
        name: player.name,
        active: player.active !== false,
        position: normalizePlayerPosition(player.position || ""),
        pin: ""
      })) : [],
      painAreas: Array.isArray(roster.painAreas) && roster.painAreas.length ? roster.painAreas : [...DEFAULT_PAIN_AREAS],
      settings: roster.settings ? { ...DEFAULT_SETTINGS, ...roster.settings } : { ...DEFAULT_SETTINGS }
    });
    uiState.playerLogin.selectedTeamCode = team.slug || code;
    return state;
  } catch (error) {
    uiState.playerLogin.rosterError = error.message || "טעינת שחקני הקבוצה נכשלה.";
    throw error;
  } finally {
    uiState.playerLogin.rosterLoading = false;
    if (options.renderAfterLoad !== false) renderPlayerLogin();
  }
}

function renderPlayerLogin() {
  if (isSupabaseMode() && !coachSession && !uiState.playerLogin.teamsLoaded && !uiState.playerLogin.teamsLoading) {
    setTimeout(() => loadPlayerTeamsForLogin(), 0);
  }
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
          <a href="/coach" data-route class="btn secondary">אזור צוות מקצועי</a>
        </div>
      </header>

      <form id="playerLoginForm" class="surface form-panel grid player-login-card" autocomplete="off">
        <div class="form-intro">
          <span class="eyebrow">שחקנים</span>
          <h2>התחברות מהירה</h2>
          <p>השלמת הדוח היומי מסייעת לצוות המקצועי לעקוב אחרי מוכנות, עומסים והתאוששות.</p>
        </div>
        <ol class="login-steps" aria-label="שלבי כניסה">
          <li><span>1</span><strong>בחר את שמך</strong></li>
          <li><span>2</span><strong>הזן קוד אישי</strong></li>
          <li><span>3</span><strong>לחץ כניסה</strong></li>
        </ol>
        ${renderPlayerTeamSelectorV2()}
        <div class="field">
          <label for="loginPlayerId">שם שחקן</label>
          <select id="loginPlayerId" name="playerId" required ${isSupabaseMode() && (!uiState.playerLogin.selectedTeamCode || uiState.playerLogin.rosterLoading) ? "disabled" : ""}>
            <option value="">בחירה</option>
            ${(!isSupabaseMode() || uiState.playerLogin.selectedTeamCode ? getActivePlayers() : []).map((player) => `<option value="${escapeAttr(player.id)}">${escapeHtml(player.name)}</option>`).join("")}
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
    document.querySelector('label[for="loginPlayerId"]')?.replaceChildren(document.createTextNode("בחר שחקן"));
    document.querySelector('label[for="loginPin"]')?.replaceChildren(document.createTextNode("קוד אישי / PIN"));
    const playerSelect = document.getElementById("loginPlayerId");
    if (playerSelect?.options?.length) {
      playerSelect.options[0].textContent = isSupabaseMode() && !uiState.playerLogin.selectedTeamCode
        ? "בחר קבוצה קודם"
        : uiState.playerLogin.rosterLoading
          ? "טוען שחקנים..."
          : "בחר שחקן";
    }
    const loginSubmitButton = document.querySelector('#playerLoginForm button[type="submit"]');
    if (loginSubmitButton) loginSubmitButton.textContent = "כניסה";
    document.querySelectorAll(".login-steps li strong").forEach((node, index) => {
      node.textContent = ["בחר קבוצה", "בחר שחקן", "הזן קוד אישי"][index] || node.textContent;
    });
    const teamSelect = document.getElementById("playerTeamSelect");
    if (teamSelect && isSupabaseMode()) {
      teamSelect.addEventListener("change", async (event) => {
        const code = event.currentTarget.value;
        uiState.playerLogin.selectedTeamCode = code;
        uiState.playerLogin.rosterError = "";
        if (!code) {
          setPlayerTeamContext(null);
          state = normalizeState({ ...createEmptyState() });
          renderPlayerLogin();
          return;
        }
        state = normalizeState({ ...createEmptyState() });
        try {
          await loadPlayerTeamByCodeV2(code);
        } catch (error) {
          console.error("[Player Login] failed to load selected team", error);
        }
      });
    }
    const loadTeamButton = document.getElementById("loadPlayerTeam");
    if (loadTeamButton) {
      loadTeamButton.addEventListener("click", async () => {
        const status = document.getElementById("playerTeamLoadStatus");
        const input = document.getElementById("playerTeamCode");
        loadTeamButton.disabled = true;
        if (status) {
          status.textContent = "טוען סגל...";
          status.className = "diagnostic-result";
        }
        try {
          await loadPlayerTeamByCode(input?.value || "");
          if (status) {
            status.textContent = "הסגל נטען בהצלחה.";
            status.className = "diagnostic-result green";
          }
          renderPlayerLogin();
        } catch (error) {
          console.error("[Player Team] failed to load roster", error);
          if (status) {
            status.textContent = error.message || "טעינת הסגל נכשלה.";
            status.className = "diagnostic-result red";
          }
        } finally {
          loadTeamButton.disabled = false;
        }
      });
    }
    document.getElementById("playerLoginForm").addEventListener("submit", async (event) => {
      event.preventDefault();
      const data = new FormData(event.currentTarget);
      const playerId = String(data.get("playerId") || "");
      const pin = normalizePin(data.get("pin"));
      const selectedTeamCode = String(data.get("teamCode") || uiState.playerLogin.selectedTeamCode || "");
      const loginError = document.getElementById("loginError");
      loginError.classList.remove("show");
      try {
        if (isSupabaseMode() && !coachSession && !selectedTeamCode) throw new Error("יש לבחור קבוצה.");
        const player = isSupabaseMode() && !coachSession
          ? await verifyPlayerLoginWithSupabase(selectedTeamCode, playerId, pin)
          : state.players.find((item) => item.id === playerId && item.active && item.pin === pin);
        if (!player) throw new Error("שם או PIN אינם נכונים.");
        if (!state.players.some((item) => item.id === player.id)) {
          state.players.unshift(player);
        }
        setLoggedPlayer(player, pin);
        navigate("/report");
      } catch (error) {
        console.error("[Player Login] failed", error);
        loginError.textContent = error.message || "שם או PIN אינם נכונים";
        loginError.classList.add("show");
      }
    });
  });
}

function renderPlayerHome(player) {
  const date = todayIso();
  const readiness = getReadinessFor(player.id, date);
  const post = getPostReportFor(player.id, date);
  const readinessComputed = readiness ? getComputedReadiness(readiness) : null;
  const completedCount = [readiness, post].filter(Boolean).length;
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
          <button id="logoutPlayer" class="btn ghost" type="button">יציאה</button>
        </div>
      </header>

      <section class="surface form-panel grid">
        <div class="form-intro">
          <span class="eyebrow">דיווח יומי</span>
          <h2>הדוחות שלך להיום</h2>
          <p>שני דוחות קצרים שעוזרים לצוות להבין עומס, מוכנות והתאוששות.</p>
        </div>
        <div class="daily-progress" aria-label="התקדמות יומית">
          <div>
            <strong>${completedCount}/2 דוחות הושלמו היום</strong>
            <span>${completedCount === 2 ? "כל הדיווחים להיום מוכנים." : "נשאר להשלים את הדוחות החסרים."}</span>
          </div>
          <div class="progress-track" aria-hidden="true">
            <span style="width: ${completedCount * 50}%"></span>
          </div>
        </div>
        <div class="player-home-actions">
          ${playerHomeActionCard({
            href: "/report/pre",
            title: "דוח מוכנות לפני אימון",
            completed: Boolean(readiness),
            explanation: readinessComputed
              ? "דוח המוכנות להיום נקלט. אפשר לעדכן אם משהו השתנה."
              : "שינה, אנרגיה, מצב רוח, כאבים והגבלות לפני האימון.",
            actionText: "מלא דוח מוכנות",
            primary: !readiness
          })}
          ${playerHomeActionCard({
            href: "/report/post",
            title: "דוח RPE אחרי אימון",
            completed: Boolean(post),
            explanation: post
              ? `RPE ${post.rpe} · עייפות, כאבים ומשקל אחרי האימון.`
              : "RPE, עייפות, כאבים, השלמת אימון ומשקל אחרי האימון.",
            actionText: "מלא דוח RPE",
            primary: !post && Boolean(readiness)
          })}
        </div>
      </section>
      ${renderPlayerPersonalArea(player)}
    </main>
  `;

  mount(html, () => {
    document.getElementById("logoutPlayer").addEventListener("click", () => {
      localStorage.removeItem(PLAYER_SESSION_KEY);
      renderReportPage();
    });
    bindPlayerPersonalArea(player.id);
  });
}

function playerHomeActionCard({ href, title, completed, explanation, actionText, primary }) {
  const color = completed ? "green" : "yellow";
  return `
    <a href="${escapeAttr(href)}" data-route class="player-action-card ${primary ? "primary-action" : ""}">
      <div class="action-card-head">
        <span class="badge ${color}">${completed ? "בוצע" : "חסר"}</span>
        <span class="action-kicker">${completed ? "אפשר לעדכן" : "ממתין לדיווח"}</span>
      </div>
      <div class="action-card-copy">
        <strong>${escapeHtml(title)}</strong>
        <small>${escapeHtml(explanation)}</small>
      </div>
      <span class="action-button">${completed ? "צפייה / עדכון דוח" : escapeHtml(actionText || "מלא דוח")}</span>
    </a>
  `;
}

function renderPlayerPersonalArea(player) {
  return `
    <section class="surface form-panel player-profile-area">
      <div class="form-intro">
        <span class="eyebrow">האזור האישי שלי</span>
        <h2>התאוששות, GPS ושיאים</h2>
        <p>מבט קצר על ההתאוששות והפעילות שלך. הדוחות היומיים נשארים הדבר החשוב ביותר.</p>
      </div>
      <div class="player-profile-tabs" role="tablist" aria-label="אזור אישי">
        <button class="is-active" type="button" data-player-profile-tab="recovery">התאוששות</button>
        <button type="button" data-player-profile-tab="gps">GPS Center</button>
        <button type="button" data-player-profile-tab="records">שיאים אישיים</button>
      </div>
      <div class="player-profile-panels">
        <section data-player-profile-panel="recovery">
          ${renderPlayerRecoverySection(player.id)}
        </section>
        <section data-player-profile-panel="gps" hidden>
          ${renderPlayerGpsCenter(player.id)}
        </section>
        <section data-player-profile-panel="records" hidden>
          ${renderPlayerPersonalRecords(player.id)}
        </section>
      </div>
    </section>
  `;
}

function bindPlayerPersonalArea(playerId) {
  document.querySelectorAll("[data-player-profile-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      const target = button.getAttribute("data-player-profile-tab");
      document.querySelectorAll("[data-player-profile-tab]").forEach((item) => item.classList.toggle("is-active", item === button));
      document.querySelectorAll("[data-player-profile-panel]").forEach((panel) => {
        panel.hidden = panel.getAttribute("data-player-profile-panel") !== target;
      });
    });
  });
  bindPlayerGpsControls(playerId);
}

function renderPlayerRecoverySection(playerId) {
  const readinessSeries = buildPlayerReadinessSeries(playerId).slice(-12);
  const postSeries = buildPlayerPostSeries(playerId).slice(-12);
  const hydrationSeries = postSeries
    .filter((report) => report.hydration)
    .map((report) => ({ ...report, hydrationLossPercent: report.hydration.lossPercent }));
  const latestReadiness = readinessSeries[readinessSeries.length - 1] || null;
  const latestHydration = hydrationSeries[hydrationSeries.length - 1] || null;
  const recovery = getPlayerRecoverySummary(latestReadiness, latestHydration);
  const avgSleep = average(readinessSeries.map((report) => report.sleepHours));
  const avgHydrationLoss = average(hydrationSeries.map((report) => report.hydrationLossPercent));
  const latestPain = getLatestPlayerPainReport(playerId);
  const hydrationStatus = latestHydration ? getPlayerHydrationStatus(latestHydration.hydrationLossPercent) : { label: "אין נתון", tone: "neutral" };

  return `
    <div class="player-section-grid">
      <article class="player-insight-card ${recovery.tone}">
        <span class="player-card-icon" aria-hidden="true">${escapeHtml(recovery.icon)}</span>
        <div>
          <h3>${escapeHtml(recovery.label)}</h3>
          <p>${escapeHtml(recovery.insight)}</p>
        </div>
      </article>
      <article class="player-mini-card">
        <span>שעות שינה ממוצעות</span>
        <strong>${escapeHtml(formatNumber(avgSleep))}</strong>
      </article>
      <article class="player-mini-card">
        <span>מצב הידרציה</span>
        <strong>${escapeHtml(hydrationStatus.label)}</strong>
      </article>
      <article class="player-mini-card">
        <span>איבוד נוזלים ממוצע</span>
        <strong>${avgHydrationLoss === null ? "אין נתון" : `${escapeHtml(formatNumber(avgHydrationLoss))}%`}</strong>
      </article>
    </div>
    <div class="player-chart-grid">
      ${playerChartCard("מגמת התאוששות", renderPlayerSparkline(readinessSeries, "readinessScore", "מגמת התאוששות"))}
      ${playerChartCard("שינה", renderLineChart(readinessSeries, "sleepHours", "שעות שינה"))}
      ${playerChartCard("מגמת הידרציה", renderLineChart(hydrationSeries, "hydrationLossPercent", "איבוד נוזלים"))}
    </div>
    <article class="player-latest-card">
      <span class="eyebrow">דיווח כאב אחרון</span>
      ${latestPain ? `
        <h3>${escapeHtml(latestPain.painArea)}</h3>
        <p>${escapeHtml(formatDateDisplay(latestPain.date))}${latestPain.painSide ? ` · ${escapeHtml(latestPain.painSide)}` : ""}${latestPain.painIntensity ? ` · עוצמה ${escapeHtml(formatInteger(latestPain.painIntensity))}/10` : ""}</p>
      ` : `
        <h3>אין דיווח כאב אחרון</h3>
        <p>אם מופיע כאב חדש, כדאי לציין אותו בדוח היומי.</p>
      `}
    </article>
  `;
}

function getPlayerRecoverySummary(latestReadiness, latestHydration) {
  if (!latestReadiness) {
    return {
      tone: "neutral",
      icon: "●",
      label: "אין מספיק נתוני התאוששות",
      insight: "מלא דוח מוכנות כדי לקבל תמונת התאוששות אישית."
    };
  }
  const reasons = [];
  if (Number(latestReadiness.sleepHours) < 6) reasons.push("השינה הייתה קצרה");
  if (Number(latestReadiness.sleepQuality) <= 2) reasons.push("איכות השינה נמוכה");
  if (Number(latestReadiness.energy) <= 2) reasons.push("האנרגיה נמוכה");
  if (Number(latestReadiness.soreness) >= 4) reasons.push("יש כאבי שריר");
  if (latestReadiness.painArea && latestReadiness.painArea !== NO_PAIN) reasons.push(`דווח כאב ב${latestReadiness.painArea}`);
  if (latestHydration && latestHydration.hydrationLossPercent > 2) reasons.push("איבוד הנוזלים גבוה");
  else if (latestHydration && latestHydration.hydrationLossPercent > 1) reasons.push("כדאי לשים לב להידרציה");

  if (latestReadiness.readinessScore >= 80 && !reasons.length) {
    return { tone: "green", icon: "🟢", label: "מצב התאוששות טוב", insight: "השינה, האנרגיה והתחושה הכללית נראות טובות לפי הדיווח האחרון." };
  }
  if (latestReadiness.readinessScore >= 60) {
    return { tone: "yellow", icon: "🟡", label: "כדאי לשים לב להתאוששות", insight: reasons.slice(0, 2).join(", ") || "יש כמה סימנים שכדאי לעקוב אחריהם היום." };
  }
  return { tone: "red", icon: "🔴", label: "נדרשת תשומת לב להתאוששות", insight: reasons.slice(0, 3).join(", ") || "התחושה הכללית דורשת מעקב לפני פעילות." };
}

function getLatestPlayerPainReport(playerId) {
  return [...state.readinessReports, ...state.reports]
    .filter((report) => report.playerId === playerId && report.painArea && report.painArea !== NO_PAIN)
    .sort((a, b) => b.date.localeCompare(a.date) || String(b.createdAt || "").localeCompare(String(a.createdAt || "")))
    .map((report) => ({
      ...report,
      painSide: report.painSide || "",
      painIntensity: report.painIntensity || null
    }))[0] || null;
}

function getPlayerHydrationStatus(lossPercent) {
  const value = Number(lossPercent);
  if (!Number.isFinite(value)) return { label: "אין נתון", tone: "neutral" };
  if (value > 2) return { label: "דורש מעקב", tone: "red" };
  if (value > 1) return { label: "לשים לב", tone: "yellow" };
  return { label: "תקין", tone: "green" };
}

function playerChartCard(title, chart) {
  return `
    <div class="player-chart-card">
      <h3>${escapeHtml(title)}</h3>
      ${chart}
    </div>
  `;
}

function renderPlayerSparkline(series, key, label) {
  if (!series.length) return `<div class="empty">אין נתונים לגרף</div>`;
  const width = 360;
  const height = 120;
  const pad = 16;
  const values = series.map((point) => Number(point[key]) || 0);
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const xFor = (index) => pad + (series.length === 1 ? (width - pad * 2) / 2 : ((width - pad * 2) * index) / (series.length - 1));
  const yFor = (value) => pad + ((max - value) / range) * (height - pad * 2);
  const points = series.map((point, index) => `${xFor(index).toFixed(1)},${yFor(Number(point[key]) || 0).toFixed(1)}`).join(" ");
  return `
    <svg class="player-sparkline" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeAttr(label)}">
      <polyline class="chart-line" points="${points}" />
      ${series.map((point, index) => `<circle class="chart-dot" cx="${xFor(index).toFixed(1)}" cy="${yFor(Number(point[key]) || 0).toFixed(1)}" r="3.5" />`).join("")}
    </svg>
  `;
}

function renderPlayerGpsCenter(playerId) {
  const metrics = getPlayerGpsMetricDefinitions();
  return `
    <div class="player-gps-center">
      <div class="player-filter-row" aria-label="סינון GPS">
        ${[
          ["all", "הכל"],
          ["training", "אימונים"],
          ["match", "משחקים"]
        ].map(([value, label], index) => `<button class="${index === 0 ? "is-active" : ""}" type="button" data-player-gps-activity="${escapeAttr(value)}">${escapeHtml(label)}</button>`).join("")}
      </div>
      <div id="playerGpsPeriodFilters" class="player-filter-row period-row" aria-label="תקופת GPS">
        ${renderPlayerGpsPeriodButtons("all")}
      </div>
      <div class="player-filter-row metric-row" aria-label="בחירת מדד GPS">
        ${metrics.map((metric, index) => `<button class="${index === 0 ? "is-active" : ""}" type="button" data-player-gps-metric="${escapeAttr(metric.key)}">${escapeHtml(metric.label)}</button>`).join("")}
      </div>
      <div id="playerGpsDynamic">
        ${renderPlayerGpsDynamic(playerId, "all", "latest", metrics[0].key)}
      </div>
    </div>
  `;
}

function bindPlayerGpsControls(playerId) {
  const dynamic = document.getElementById("playerGpsDynamic");
  const periodRow = document.getElementById("playerGpsPeriodFilters");
  if (!dynamic) return;
  const rerender = () => {
    const activity = document.querySelector("[data-player-gps-activity].is-active")?.getAttribute("data-player-gps-activity") || "all";
    const period = document.querySelector("[data-player-gps-period].is-active")?.getAttribute("data-player-gps-period") || "latest";
    const metric = document.querySelector("[data-player-gps-metric].is-active")?.getAttribute("data-player-gps-metric") || "totalDistance";
    dynamic.innerHTML = renderPlayerGpsDynamic(playerId, activity, period, metric);
    const recordsPanel = document.querySelector('[data-player-profile-panel="records"]');
    if (recordsPanel) recordsPanel.innerHTML = renderPlayerPersonalRecords(playerId, activity, period);
  };
  const bindPeriodButtons = () => {
    document.querySelectorAll("[data-player-gps-period]").forEach((button) => {
      button.addEventListener("click", () => {
        document.querySelectorAll("[data-player-gps-period]").forEach((item) => item.classList.toggle("is-active", item === button));
        rerender();
      });
    });
  };
  document.querySelectorAll("[data-player-gps-activity]").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll("[data-player-gps-activity]").forEach((item) => item.classList.toggle("is-active", item === button));
      if (periodRow) {
        periodRow.innerHTML = renderPlayerGpsPeriodButtons(button.getAttribute("data-player-gps-activity") || "all");
        bindPeriodButtons();
      }
      rerender();
    });
  });
  document.querySelectorAll("[data-player-gps-metric]").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll("[data-player-gps-metric]").forEach((item) => item.classList.toggle("is-active", item === button));
      rerender();
    });
  });
  bindPeriodButtons();
}

function renderPlayerGpsPeriodButtons(activity) {
  return getPlayerGpsPeriodOptions(activity)
    .map((option, index) => `<button class="${index === 0 ? "is-active" : ""}" type="button" data-player-gps-period="${escapeAttr(option.value)}">${escapeHtml(option.label)}</button>`)
    .join("");
}

function getPlayerGpsPeriodOptions(activity) {
  if (activity === "training") {
    return [
      { value: "latest", label: "אימון אחרון" },
      { value: "7", label: "7 ימים אחרונים" },
      { value: "month", label: "חודש אחרון" },
      { value: "season", label: "עונה" }
    ];
  }
  if (activity === "match") {
    return [
      { value: "latest", label: "משחק אחרון" },
      { value: "last5", label: "5 משחקים אחרונים" },
      { value: "month", label: "חודש אחרון" },
      { value: "season", label: "עונה" }
    ];
  }
  return [
    { value: "latest", label: "פעילות אחרונה" },
    { value: "7", label: "7 ימים אחרונים" },
    { value: "month", label: "חודש אחרון" },
    { value: "season", label: "עונה" }
  ];
}

function renderPlayerGpsDynamic(playerId, activity, period, metricKey) {
  const records = getPlayerGpsRecordsForProfile(playerId, activity, period);
  const metrics = getPlayerGpsMetricDefinitions();
  const selectedMetric = metrics.find((metric) => metric.key === metricKey) || metrics[0];
  const latest = records[0] || null;
  const lastTitle = getPlayerGpsLastSessionTitle(activity);
  const chartSeries = [...records].reverse();
  return `
    ${latest ? renderPlayerGpsLastSession(latest, lastTitle) : `<div class="surface empty">אין נתוני GPS להצגה</div>`}
    <div class="player-kpi-grid">
      ${renderPlayerGpsMetricCards(playerId, activity, records, metrics)}
    </div>
    <div class="player-chart-card">
      <h3>${escapeHtml(selectedMetric.label)}</h3>
      ${renderLineChart(chartSeries, selectedMetric.key, selectedMetric.label)}
      <p class="player-trend-text">${escapeHtml(getPlayerGpsTrendInsight(records, selectedMetric))}</p>
    </div>
  `;
}

function getPlayerGpsLastSessionTitle(activity) {
  if (activity === "match") return "משחק אחרון";
  if (activity === "training") return "אימון אחרון";
  return "פעילות אחרונה";
}

function renderPlayerGpsLastSession(record, title) {
  return `
    <article class="player-last-session">
      <div>
        <span class="eyebrow">${escapeHtml(title)}</span>
        <h3>${escapeHtml(record.sessionName || "פעילות GPS")}</h3>
        <p>${escapeHtml(formatDateDisplay(record.date))}${record.position ? ` · ${escapeHtml(record.position)}` : ""}</p>
      </div>
      <div class="player-last-session-grid">
        ${playerGpsValue("מרחק", formatNumber(record.totalDistance), "מ׳")}
        ${playerGpsValue("HSR", formatNumber(record.highSpeedRunning), "מ׳")}
        ${playerGpsValue("מרחק ספרינט", formatNumber(record.sprintDistance), "מ׳")}
        ${playerGpsValue("מספר ספרינטים", formatInteger(record.sprintCount), "")}
        ${playerGpsValue("מהירות מרבית", formatNumber(record.maxSpeed), "קמ״ש")}
      </div>
    </article>
  `;
}

function playerGpsValue(label, value, unit) {
  return `
    <div>
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}${unit ? ` ${escapeHtml(unit)}` : ""}</strong>
    </div>
  `;
}

function playerMetricCard(label, value, unit) {
  return `
    <article class="player-mini-card">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}${unit ? ` ${escapeHtml(unit)}` : ""}</strong>
    </article>
  `;
}

function renderPlayerGpsMetricCards(playerId, activity, records, metrics) {
  if (activity === "match") {
    const seasonGameRecords = getPlayerGpsRecordsForProfile(playerId, "match", "season");
    const current = records[0] || null;
    return metrics.map((metric) => renderPlayerGameMetricCard(metric, current, seasonGameRecords)).join("");
  }
  return metrics
    .map((metric) => playerMetricCard(metric.label, formatGpsMetricValue(metric, getPlayerGpsKpiValue(records, metric)), metric.unit))
    .join("");
}

function renderPlayerGameMetricCard(metric, current, seasonGameRecords) {
  const currentValue = current ? current[metric.key] : null;
  const seasonAverage = average(seasonGameRecords.map((record) => record[metric.key]));
  const personalBest = Math.max(0, ...seasonGameRecords.map((record) => Number(record[metric.key]) || 0));
  const percentOfBest = currentValue && personalBest ? Math.round((Number(currentValue) / personalBest) * 100) : null;
  return `
    <article class="game-metric-card">
      <span>${escapeHtml(metric.label)}</span>
      <strong>${escapeHtml(formatGpsMetricDisplay(metric, currentValue))}</strong>
      <div class="game-metric-detail">
        <small>ממוצע עונה:</small>
        <b>${escapeHtml(formatGpsMetricDisplay(metric, seasonAverage))}</b>
      </div>
      <p>${percentOfBest === null ? "אין מספיק נתונים לשיא אישי" : `${escapeHtml(formatInteger(percentOfBest))}% מהשיא האישי`}</p>
    </article>
  `;
}

function getPlayerGpsMetricDefinitions() {
  return [
    { key: "totalDistance", label: "מרחק", trendLabel: "המרחק", unit: "מ׳" },
    { key: "highSpeedRunning", label: "HSR", trendLabel: "ה-HSR", unit: "מ׳" },
    { key: "sprintDistance", label: "מרחק ספרינט", trendLabel: "מרחק הספרינט", unit: "מ׳" },
    { key: "sprintCount", label: "מספר ספרינטים", trendLabel: "מספר הספרינטים", unit: "" },
    { key: "maxSpeed", label: "מהירות מרבית", trendLabel: "המהירות המרבית", unit: "קמ״ש" }
  ];
}

function getPlayerGpsRecordsForProfile(playerId, activity = "all", period = "season") {
  const today = todayIso();
  const allRecords = state.gpsRecords
    .filter((record) => record.playerId === playerId)
    .map((record) => enrichPlayerGpsRecord(getComputedGpsRecord(record)))
    .filter((record) => record.date);
  const fullSessionIds = new Set(allRecords.filter((record) => normalizeGpsPeriod(record.period) === "משחק מלא").map((record) => record.gpsSessionId));
  const activityRecords = allRecords
    .filter((record) => !fullSessionIds.has(record.gpsSessionId) || normalizeGpsPeriod(record.period) === "משחק מלא")
    .filter((record) => {
      if (activity === "training") return record.sessionType === "training";
      if (activity === "match") return record.sessionType === "match" || record.sessionType === "training_match";
      return true;
    })
    .sort((a, b) => b.date.localeCompare(a.date));
  if (period === "latest") return activityRecords.slice(0, 1);
  if (period === "last5") return activityRecords.slice(0, 5);
  if (period === "7") return activityRecords.filter((record) => record.date >= addDays(today, -7));
  if (period === "month") return activityRecords.filter((record) => record.date >= addDays(today, -30));
  return activityRecords;
}

function enrichPlayerGpsRecord(record) {
  return {
    ...record,
    sprintDistance: Number(record.distanceAbove25) || 0,
    sprintCount: getGpsSprintCount(record)
  };
}

function getGpsSprintCount(record) {
  if (record.sprintCount !== undefined) return Number(record.sprintCount) || 0;
  if (record.sprints !== undefined) return Number(record.sprints) || 0;
  const sprintDistance = Number(record.distanceAbove25) || 0;
  return sprintDistance > 0 ? Math.max(1, Math.round(sprintDistance / 25)) : 0;
}

function formatGpsMetricValue(metric, value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "אין נתון";
  return metric.key === "sprintCount" ? formatInteger(value) : formatNumber(value);
}

function formatGpsMetricDisplay(metric, value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "אין נתון";
  const numeric = Number(value);
  if (metric.key === "totalDistance") return `${formatNumber(numeric / 1000)} ק״מ`;
  if (metric.key === "sprintCount") return formatInteger(numeric);
  if (metric.key === "maxSpeed") return `${formatNumber(numeric)} קמ״ש`;
  return `${formatNumber(numeric)} מ׳`;
}

function getPlayerGpsKpiValue(records, metric) {
  if (!records.length) return null;
  const values = records.map((record) => Number(record[metric.key])).filter((value) => Number.isFinite(value));
  if (!values.length) return null;
  if (records.length === 1) return values[0];
  if (metric.key === "maxSpeed") return Math.max(...values);
  return average(values);
}

function getPlayerGpsTrendInsight(records, metric) {
  if (records.length < 4) return "אין מספיק נתונים להצגת מגמה";
  const ordered = [...records].reverse();
  const half = Math.floor(ordered.length / 2);
  const previous = ordered.slice(0, half);
  const recent = ordered.slice(half);
  const previousAvg = average(previous.map((record) => record[metric.key]));
  const recentAvg = average(recent.map((record) => record[metric.key]));
  if (!previousAvg || recentAvg === null) return "אין מספיק נתונים להצגת מגמה";
  const change = calculateChangePercent(recentAvg, previousAvg);
  const label = metric.trendLabel || metric.label;
  if (change === null || Math.abs(change) < 5) return `${label} שלך יציב בתקופה האחרונה`;
  if (change > 0) return `${label} שלך במגמת שיפור בתקופה האחרונה`;
  return `${label} שלך ירד ביחס לתקופה הקודמת`;
}

function renderPlayerPersonalRecords(playerId, activity = "all", period = "latest") {
  const records = getPlayerGpsRecordsForProfile(playerId, activity, period);
  const metrics = getPlayerGpsMetricDefinitions();
  return `
    <div class="personal-record-grid">
      ${metrics.map((metric) => renderPlayerRecordCard(metric, getPlayerPersonalBest(records, metric))).join("")}
    </div>
  `;
}

function getPlayerPersonalBest(records, metric) {
  return records
    .filter((record) => Number(record[metric.key]) > 0)
    .sort((a, b) => Number(b[metric.key]) - Number(a[metric.key]))[0] || null;
}

function renderPlayerRecordCard(metric, record) {
  return `
    <article class="record-card">
      <span>${escapeHtml(metric.label)}</span>
      <strong>${record ? `${escapeHtml(formatGpsMetricValue(metric, record[metric.key]))}${metric.unit ? ` ${escapeHtml(metric.unit)}` : ""}` : "אין נתון"}</strong>
      <p>${record ? `${escapeHtml(formatDateDisplay(record.date))} · ${escapeHtml(record.sessionName || "GPS")}` : "עוד אין מספיק נתוני GPS"}</p>
    </article>
  `;
}

function renderReadinessLivePanel() {
  return `
    <section class="readiness-progress-panel" aria-live="polite">
      <div>
        <strong id="readinessProgressText">דוח הושלם 0%</strong>
        <span>התקדמות מילוי הטופס</span>
      </div>
      <div class="progress-track" aria-hidden="true">
        <span id="readinessProgressBar" style="width: 0%"></span>
      </div>
    </section>
  `;
}

function bindReadinessLiveFeedback() {
  const form = document.getElementById("readinessForm");
  if (!form) return;
  const update = () => {
    const snapshot = getReadinessFormSnapshot(form);
    const progress = calculateReadinessFormProgress(snapshot);
    const progressText = document.getElementById("readinessProgressText");
    const progressBar = document.getElementById("readinessProgressBar");
    if (progressText) progressText.textContent = `דוח הושלם ${progress}%`;
    if (progressBar) progressBar.style.width = `${progress}%`;
    updatePainSummary();
  };
  form.addEventListener("input", update);
  form.addEventListener("change", update);
  update();
}

function getReadinessFormSnapshot(form) {
  const data = new FormData(form);
  const painArea = String(data.get("painArea") || NO_PAIN);
  return {
    sleepHours: optionalNumberFromForm(data, "sleepHours"),
    sleepQuality: optionalNumberFromForm(data, "sleepQuality"),
    energy: optionalNumberFromForm(data, "energy"),
    mood: optionalNumberFromForm(data, "mood"),
    soreness: optionalNumberFromForm(data, "soreness"),
    loadFeeling: optionalNumberFromForm(data, "loadFeeling"),
    painArea,
    painSide: painArea === NO_PAIN ? "" : String(data.get("painSide") || ""),
    painIntensity: painArea === NO_PAIN ? null : optionalNumberFromForm(data, "painIntensity"),
    medicalLimitation: String(data.get("medicalLimitation")) === "true"
  };
}

function calculateReadinessFormProgress(snapshot) {
  const checks = [
    snapshot.sleepHours !== null,
    snapshot.sleepQuality !== null,
    snapshot.energy !== null,
    snapshot.mood !== null,
    snapshot.soreness !== null,
    snapshot.loadFeeling !== null,
    Boolean(snapshot.painArea),
    snapshot.medicalLimitation !== null && snapshot.medicalLimitation !== undefined
  ];
  if (snapshot.painArea && snapshot.painArea !== NO_PAIN) {
    checks.push(Boolean(snapshot.painSide));
    checks.push(snapshot.painIntensity !== null);
  }
  const done = checks.filter(Boolean).length;
  return Math.round((done / checks.length) * 100);
}

function renderReadinessForm(player) {
  const existing = getReadinessFor(player.id, todayIso());
  const html = playerFormShell(player, "דוח מוכנות לפני אימון", `
    <form id="readinessForm" class="surface form-panel grid" autocomplete="off">
      ${readonlyPlayerAndDate(player)}
      ${renderReadinessLivePanel(existing)}
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
      ${painField(existing ? existing.painArea : NO_PAIN, {
        detailed: true,
        painSide: existing ? existing.painSide : "",
        painIntensity: existing ? existing.painIntensity : null,
        detailedPainArea: existing ? existing.detailedPainArea : ""
      })}
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
    bindReadinessLiveFeedback();
    document.getElementById("readinessForm").addEventListener("submit", async (event) => {
      event.preventDefault();
      const data = new FormData(event.currentTarget);
      const date = todayIso();
      const painArea = String(data.get("painArea") || NO_PAIN);
      const painIntensity = painArea === NO_PAIN ? null : optionalNumberFromForm(data, "painIntensity");
      if (painArea !== NO_PAIN && (!painIntensity || painIntensity < 1 || painIntensity > 10)) {
        showPainValidation("בחר עוצמת כאב בין 1 ל-10.");
        return;
      }
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
        painArea,
        detailedPainArea: painArea === NO_PAIN ? "" : String(data.get("detailedPainArea") || painArea),
        painSide: painArea === NO_PAIN ? "" : String(data.get("painSide") || "דו צדדי"),
        painIntensity,
        loadFeeling: numberFromForm(data, "loadFeeling"),
        bodyWeight: optionalNumberFromForm(data, "bodyWeight"),
        medicalLimitation: String(data.get("medicalLimitation")) === "true",
        comments: String(data.get("comments") || "").trim()
      };
      state.readinessReports = state.readinessReports.filter((item) => !(item.playerId === player.id && item.date === date));
      state.readinessReports.unshift(report);
      const saved = await persistPlayerReport(report, "readiness");
      if (!saved) return;
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
    document.getElementById("postForm").addEventListener("submit", async (event) => {
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
      const saved = await persistPlayerReport(report, "rpe");
      if (!saved) return;
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

function painField(selected, options = {}) {
  const selectedArea = selected || NO_PAIN;
  const detailed = Boolean(options.detailed);
  const painOptions = unique([NO_PAIN, ...FOOTBALL_PAIN_REGIONS.map((region) => region.area), ...state.painAreas].filter(Boolean));
  if (!detailed) {
    return `
      <div class="field">
        <span class="field-label">אזור כאב</span>
        <small>אם אין כאב, השאר "אין כאב". אם יש, בחר את האזור המרכזי.</small>
        <select id="painArea" name="painArea" required>
          ${renderSimpleOptions(painOptions, selectedArea)}
        </select>
      </div>
    `;
  }
  const hasPain = selectedArea !== NO_PAIN;
  const selectedSide = options.painSide || (hasPain ? "דו צדדי" : "");
  const selectedIntensity = hasPain ? options.painIntensity || "" : "";
  const detailedPainArea = options.detailedPainArea || (hasPain ? selectedArea : "");
  return `
    <section class="field pain-field">
      <div class="field-heading">
        <span class="field-label">דיווח כאב / רגישות</span>
        <small>בחר "אין כאב" או סמן אזור מדויק במפת הגוף.</small>
      </div>
      <select id="painArea" name="painArea" required>
        ${renderSimpleOptions(painOptions, selectedArea)}
      </select>
      <input type="hidden" id="detailedPainArea" name="detailedPainArea" value="${escapeAttr(detailedPainArea)}" />
      <div id="painDetailsPanel" class="pain-details-panel ${hasPain ? "" : "is-hidden"}">
        ${renderBodyMap(selectedArea)}
        <div class="grid two pain-controls-grid">
          <div class="field">
            <label for="painSide">צד</label>
            <select id="painSide" name="painSide" ${hasPain ? "" : "disabled"}>
              <option value="">בחירה</option>
              ${PAIN_SIDES.map((side) => `<option value="${escapeAttr(side)}" ${side === selectedSide ? "selected" : ""}>${escapeHtml(side)}</option>`).join("")}
            </select>
          </div>
          <div class="field">
            <span class="field-label">עוצמת כאב</span>
            ${renderScaleControl("painIntensity", 1, 10, selectedIntensity)}
            <small>1 = כאב קל מאוד, 10 = כאב חזק מאוד</small>
          </div>
        </div>
        <div class="pain-summary" aria-live="polite">
          <span>אזור נבחר: <strong id="painSelectedArea">${escapeHtml(hasPain ? selectedArea : "אין כאב")}</strong></span>
          <span>צד: <strong id="painSelectedSide">${escapeHtml(selectedSide || "לא נבחר")}</strong></span>
          <span>עוצמה: <strong id="painSelectedIntensity">${escapeHtml(selectedIntensity ? `${selectedIntensity}/10` : "לא נבחר")}</strong></span>
        </div>
        <div id="painValidation" class="inline-error" role="alert"></div>
      </div>
    </section>
  `;
}

function renderCoachHome() {
  const context = buildCoachHomeContext();
  const priorityItems = buildCoachHomePriorityItems(context);
  const overall = getCoachHomeOverallStatus(context, priorityItems);
  const actions = buildCoachHomeActionItems(context, priorityItems);
  const squad = buildCoachHomeSquadStatus(context);
  const latestGps = getCoachHomeLatestGpsActivity();
  const pain = buildCoachHomePainSummary(context);
  const hydration = buildCoachHomeHydrationSummary(context);
  const recentLoad = buildCoachHomeRecentLoadSummary();

  const html = coachShell("home", `
    <section class="coach-home-hero">
      <div class="coach-home-hero-main">
        <span class="eyebrow">תדרוך צוות</span>
        <h2>תדרוך יומי</h2>
        <p>${escapeHtml(formatDateDisplay(context.selectedDate))} · ${escapeHtml(getActiveTeamName())}</p>
        <div class="coach-home-status ${overall.tone}">
          <strong>${escapeHtml(overall.icon)} ${escapeHtml(overall.label)}</strong>
          <span>${escapeHtml(overall.reason)}</span>
        </div>
      </div>
      <div class="coach-home-brief-actions">
        <div class="coach-home-brief-buttons">
          <a href="/coach/analytics" data-route class="btn primary">מעבר לניתוחים מלאים</a>
          <button type="button" id="downloadDailyPdf" class="btn secondary daily-pdf-button">הורדת דוח יומי PDF</button>
        </div>
        <div id="dailyPdfStatus" class="daily-pdf-status" role="status" hidden></div>
      </div>
    </section>

    ${renderCoachHomePriorityPanel(priorityItems)}

    ${renderCoachHomeActions(actions)}

    <section class="coach-home-grid">
      ${renderCoachHomeSquadCard(squad)}
      ${renderCoachHomeReportsCard(context)}
      ${renderCoachHomeGpsCard(latestGps)}
      ${renderCoachHomePainCard(pain)}
      ${renderCoachHomeHydrationCard(hydration)}
      ${renderCoachHomeRecentLoadCard(recentLoad)}
    </section>
  `);

  mount(html, bindCoachHomeTooltips);
}

function coachTooltipAttrs(text) {
  return `data-coach-tooltip="${escapeAttr(text)}" tabindex="0"`;
}

function coachInfoTip(text) {
  return `<span class="coach-info-tip" role="button" tabindex="0" aria-label="מידע" data-coach-tooltip="${escapeAttr(text)}">i</span>`;
}

function bindCoachHomeTooltips() {
  const closeTooltips = () => {
    document.querySelectorAll(".tooltip-open").forEach((element) => element.classList.remove("tooltip-open"));
  };
  const closeDetails = () => {
    document.querySelectorAll(".home-detail-trigger.detail-open").forEach((element) => element.classList.remove("detail-open"));
  };
  const closeAll = () => {
    closeTooltips();
    closeDetails();
  };
  const pdfButton = document.getElementById("downloadDailyPdf");
  if (pdfButton) {
    pdfButton.addEventListener("click", async () => {
      const originalText = pdfButton.textContent;
      pdfButton.disabled = true;
      pdfButton.setAttribute("aria-busy", "true");
      pdfButton.textContent = "מכין דוח PDF...";
      setDailyPdfStatus("", "neutral");
      try {
        const report = buildDailyCoachPdfData(addDays(todayIso(), -1));
        if (!report.hasData) {
          setDailyPdfStatus("אין מספיק נתונים להפקת דוח עבור אתמול", "yellow");
          return;
        }
        const result = await downloadDailyCoachPdf(report);
        setDailyPdfStatus(`הדוח הופק בהצלחה · ${result.pageCount} עמודים`, "green");
      } catch (error) {
        console.error("[Daily PDF] generation failed", error);
        const message = error?.code === "NO_DAILY_DATA"
          ? "אין מספיק נתונים להפקת דוח עבור אתמול"
          : "לא ניתן היה להפיק את הדוח. נסו שוב.";
        setDailyPdfStatus(message, "red");
      } finally {
        pdfButton.disabled = false;
        pdfButton.removeAttribute("aria-busy");
        pdfButton.textContent = originalText;
      }
    });
  }
  document.addEventListener("click", closeAll, { once: true });
  document.querySelectorAll("[data-coach-tooltip]").forEach((element) => {
    element.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      const isOpen = element.classList.contains("tooltip-open");
      closeAll();
      if (!isOpen) element.classList.add("tooltip-open");
      document.addEventListener("click", closeAll, { once: true });
    });
    element.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeTooltips();
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        element.click();
      }
    });
  });
  document.querySelectorAll("[data-home-detail]").forEach((element) => {
    element.addEventListener("click", (event) => {
      if (event.target.closest("a[data-route]")) return;
      event.preventDefault();
      event.stopPropagation();
      const isOpen = element.classList.contains("detail-open");
      closeAll();
      if (!isOpen) element.classList.add("detail-open");
      document.addEventListener("click", closeAll, { once: true });
    });
    element.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeAll();
      if ((event.key === "Enter" || event.key === " ") && !event.target.closest("a[data-route]")) {
        event.preventDefault();
        element.click();
      }
    });
  });
}

function setDailyPdfStatus(message, tone) {
  const status = document.getElementById("dailyPdfStatus");
  if (!status) return;
  status.textContent = message;
  status.className = `daily-pdf-status ${tone || "neutral"}`;
  status.hidden = !message;
}

function buildCoachHomeContext(selectedDate = todayIso()) {
  const activePlayers = getActivePlayers();
  const readinessToday = state.readinessReports.filter((report) => report.date === selectedDate).map(getComputedReadiness);
  const postToday = state.reports.filter((report) => report.date === selectedDate).map(getComputedReport);
  const readinessIds = new Set(readinessToday.map((report) => report.playerId));
  const postIds = new Set(postToday.map((report) => report.playerId));
  const missingPre = activePlayers.filter((player) => !readinessIds.has(player.id));
  const missingPost = activePlayers.filter((player) => !postIds.has(player.id));
  const weekRows = buildWeeklyRows({
    playerId: "all",
    date: selectedDate,
    weekDate: selectedDate,
    sessionType: "all",
    painArea: "all",
    riskLevel: "all"
  });
  const status = buildCoachDailyStatus(activePlayers, readinessToday, postToday, missingPre, missingPost, weekRows, selectedDate);
  return { selectedDate, activePlayers, readinessToday, postToday, missingPre, missingPost, weekRows, status, smartAlerts: status.smartAlerts };
}

function buildDailyCoachPdfData(selectedDate) {
  const context = buildCoachHomeContext(selectedDate);
  const gpsSessions = state.gpsSessions
    .filter((sessionItem) => sessionItem.date === selectedDate)
    .sort((a, b) => String(a.sessionName || "").localeCompare(String(b.sessionName || ""), "he"));
  const gpsSessionIds = new Set(gpsSessions.map((sessionItem) => sessionItem.id));
  const gpsRecords = summarizeDailyGpsRecords(
    gpsSessions.flatMap((sessionItem) => {
      const sessionRecords = state.gpsRecords
        .filter((record) => record.gpsSessionId === sessionItem.id && gpsSessionIds.has(record.gpsSessionId))
        .map(getComputedGpsRecord);
      return getFullPeriodPreferred(sessionRecords).map(enrichPlayerGpsRecord);
    })
  );
  const attention = buildCoachHomePriorityItems(context).map((item) => ({
    name: item.player.name,
    reason: item.reasons.join(" · ") || item.title,
    severity: item.severity,
    severityLabel: severityLabel(item.severity),
    tone: item.severity === "High" ? "red" : item.severity === "Medium" ? "yellow" : "green",
    action: item.actions.join(" · ") || "להמשיך מעקב."
  }));
  const readiness = context.readinessToday
    .slice()
    .sort((a, b) => a.readinessScore - b.readinessScore || a.playerName.localeCompare(b.playerName, "he"));
  const postReports = context.postToday
    .slice()
    .sort((a, b) => b.rpe - a.rpe || a.playerName.localeCompare(b.playerName, "he"));
  const hydrationReports = postReports.filter((report) => report.hydration);
  const painRows = buildDailyPdfPainRows(context.readinessToday, context.postToday, selectedDate);
  const readinessAverage = average(readiness.map((report) => report.readinessScore));
  const rpeAverage = average(postReports.map((report) => report.rpe));
  const gpsLoadAverage = average(gpsRecords.map((record) => record.gpsLoad));
  const sleepAverage = average(readiness.map((report) => report.sleepHours));
  const hydrationAverage = average(hydrationReports.map((report) => report.hydration.lossPercent));
  const sessionTypes = unique([
    ...gpsSessions.map((sessionItem) => formatGpsSessionType(sessionItem.activityType || sessionItem.type)),
    ...postReports.map((report) => report.sessionType)
  ].filter(Boolean));
  const report = {
    title: "דוח יומי - נתוני אתמול",
    dateIso: selectedDate,
    dateDisplay: formatDateDisplay(selectedDate),
    teamName: getActiveTeamName(),
    sessionLabel: sessionTypes.join(" · ") || "לא הוגדרה פעילות",
    activePlayerCount: context.activePlayers.length,
    hasData: Boolean(readiness.length || postReports.length || gpsRecords.length),
    executive: {
      readinessAverage,
      rpeAverage,
      gpsLoadAverage,
      sleepAverage,
      hydrationAverage
    },
    attention,
    gps: {
      sessionNames: gpsSessions.map((sessionItem) => sessionItem.sessionName).filter(Boolean),
      players: gpsRecords,
      loadScore: gpsLoadAverage === null ? null : loadValueToScore(gpsLoadAverage),
      hsrAverage: average(gpsRecords.map((record) => record.highSpeedRunning)),
      sprintAverage: average(gpsRecords.map((record) => record.sprintDistance))
    },
    readiness: {
      submittedCount: readiness.length,
      players: readiness.map((reportItem) => ({
        name: reportItem.playerName,
        score: `${formatInteger(reportItem.readinessScore)}/100`,
        status: reportItem.readinessStatus.label,
        tone: reportItem.readinessStatus.tone,
        reasons: reportItem.riskFlags.slice(0, 3).join(" · ") || "ללא חריגה"
      })),
      missingNames: context.missingPre.map((player) => player.name),
      lowNames: readiness.filter((reportItem) => reportItem.readinessScore < 60).map((reportItem) => `${reportItem.playerName} - ${formatInteger(reportItem.readinessScore)}`)
    },
    sleep: {
      underSix: readiness
        .filter((reportItem) => Number(reportItem.sleepHours) < 6)
        .map((reportItem) => ({ name: reportItem.playerName, hours: Number(reportItem.sleepHours) })),
      trend: buildDailyPdfSleepTrend(selectedDate)
    },
    rpe: {
      submittedCount: postReports.length,
      players: postReports.map((reportItem) => ({
        name: reportItem.playerName,
        rpe: `${formatNumber(reportItem.rpe)}/10`,
        sessionType: reportItem.sessionType,
        fatigue: reportItem.fatigue ? `${formatNumber(reportItem.fatigue)}/5` : "-",
        note: reportItem.comments || "-"
      })),
      highNames: postReports.filter((reportItem) => Number(reportItem.rpe) >= state.settings.rpeHigh).map((reportItem) => `${reportItem.playerName} - RPE ${formatNumber(reportItem.rpe)}`),
      missingNames: context.missingPost.map((player) => player.name)
    },
    pain: painRows,
    hydration: {
      players: hydrationReports
        .slice()
        .sort((a, b) => b.hydration.lossPercent - a.hydration.lossPercent)
        .map((reportItem) => ({
          name: reportItem.playerName,
          loss: `${formatNumber(reportItem.hydration.lossPercent)}%`,
          status: reportItem.hydration.status,
          tone: reportItem.hydration.tone,
          sessionType: reportItem.sessionType
        })),
      aboveOneNames: hydrationReports.filter((reportItem) => reportItem.hydration.lossPercent > 1).map((reportItem) => `${reportItem.playerName} - ${formatNumber(reportItem.hydration.lossPercent)}%`),
      aboveTwoNames: hydrationReports.filter((reportItem) => reportItem.hydration.lossPercent > 2).map((reportItem) => `${reportItem.playerName} - ${formatNumber(reportItem.hydration.lossPercent)}%`)
    },
    conclusions: []
  };
  report.conclusions = buildDailyPdfConclusions(report, context, gpsRecords);
  return report;
}

function summarizeDailyGpsRecords(records) {
  const sumKeys = ["minutesPlayed", "totalDistance", "gpsLoad", "highSpeedRunning", "distanceAbove18", "distanceAbove25", "sprintDistance", "sprintCount", "accelerations", "decelerations"];
  const averageKeys = ["distancePerMinute", "intensity", "metabolicActivity", "hmld", "workRestRatio"];
  const byPlayer = new Map();
  records.forEach((record) => {
    const key = record.playerId || record.playerName;
    if (!key) return;
    const current = byPlayer.get(key) || {
      playerId: record.playerId,
      playerName: record.playerName,
      position: record.position,
      maxSpeed: 0,
      sourceCount: 0,
      averageTotals: Object.fromEntries(averageKeys.map((field) => [field, 0]))
    };
    sumKeys.forEach((field) => { current[field] = (Number(current[field]) || 0) + (Number(record[field]) || 0); });
    averageKeys.forEach((field) => { current.averageTotals[field] += Number(record[field]) || 0; });
    current.maxSpeed = Math.max(Number(current.maxSpeed) || 0, Number(record.maxSpeed) || 0);
    current.sourceCount += 1;
    byPlayer.set(key, current);
  });
  return [...byPlayer.values()]
    .map((record) => {
      averageKeys.forEach((field) => { record[field] = record.sourceCount ? record.averageTotals[field] / record.sourceCount : 0; });
      delete record.averageTotals;
      delete record.sourceCount;
      return record;
    })
    .sort((a, b) => b.gpsLoad - a.gpsLoad || a.playerName.localeCompare(b.playerName, "he"));
}

function buildDailyPdfPainRows(readinessReports, postReports, selectedDate) {
  const byKey = new Map();
  [...readinessReports, ...postReports].forEach((report) => {
    if (!report.painArea || report.painArea === NO_PAIN) return;
    const key = `${report.playerId}-${report.painArea}-${report.painSide || ""}`;
    const current = byKey.get(key);
    if (!current || Number(report.painIntensity) > Number(current.intensity)) {
      byKey.set(key, {
        name: report.playerName || getPlayer(report.playerId)?.name || "שחקן",
        area: report.detailedPainArea || report.painArea,
        side: report.painSide || "לא צוין",
        intensity: report.painIntensity ? `${formatNumber(report.painIntensity)}/10` : "לא צוין",
        date: formatDateDisplay(selectedDate)
      });
    }
  });
  return [...byKey.values()].sort((a, b) => a.name.localeCompare(b.name, "he"));
}

function buildDailyPdfSleepTrend(selectedDate) {
  return Array.from({ length: 7 }, (_, index) => addDays(selectedDate, index - 6))
    .map((date) => {
      const reports = state.readinessReports.filter((report) => report.date === date);
      return { label: formatShortDate(date), value: average(reports.map((report) => report.sleepHours)) };
    })
    .filter((item) => item.value !== null);
}

function buildDailyPdfConclusions(report, context, gpsRecords) {
  const conclusions = [];
  conclusions.push(`אתמול התקבלו ${report.readiness.submittedCount} דוחות מוכנות ו-${report.rpe.submittedCount} דוחות RPE מתוך ${report.activePlayerCount} שחקנים פעילים.`);
  if (report.attention.length) {
    conclusions.push(`${report.attention.length} שחקנים דורשים תשומת לב. בראש הרשימה: ${report.attention.slice(0, 3).map((item) => item.name).join(", ")}.`);
  }
  const gpsAlerts = gpsRecords.filter((record) => Number(record.gpsLoad) >= 800 || Number(record.highSpeedRunning) >= 650 || Number(record.sprintDistance) >= 180);
  if (gpsAlerts.length) conclusions.push(`נמצאו ${gpsAlerts.length} חריגות GPS מרכזיות. מומלץ לעבור על עומס, HSR וספרינטים לפני קביעת העומס הבא.`);
  if (report.pain.length) conclusions.push(`${report.pain.length} דיווחי כאב דורשים שיחה קצרה ומעקב לפני הפעילות היום.`);
  if (report.hydration.aboveTwoNames.length) conclusions.push(`${report.hydration.aboveTwoNames.length} שחקנים מעל 2% איבוד נוזלים ודורשים מעקב הידרציה.`);
  else if (report.hydration.aboveOneNames.length) conclusions.push(`${report.hydration.aboveOneNames.length} שחקנים מעל 1% איבוד נוזלים. מומלץ לחזק הנחיות שתייה.`);
  const missingTotal = context.missingPre.length + context.missingPost.length;
  if (missingTotal) conclusions.push(`חסרים ${missingTotal} דוחות מאתמול. מומלץ להשלים את תמונת הנתונים מול השחקנים הרלוונטיים.`);
  if (conclusions.length === 1) conclusions.push("לא נמצאו חריגות מרכזיות. ניתן להמשיך במעקב שגרתי.");
  return conclusions.slice(0, 6);
}

function getCoachHomeOverallStatus(context, priorityItems = []) {
  const severeCount = priorityItems.filter((item) => item.severity === "High").length;
  const redHydration = context.status.hydrationAlerts.some((item) => item.report.hydration && item.report.hydration.tone === "red");
  if (severeCount || redHydration || context.status.gpsLoadAlerts.length >= 2) {
    return { tone: "red", icon: "🔴", label: "דורש בדיקה", reason: `${priorityItems.length} שחקנים דורשים תשומת לב היום.` };
  }
  if (priorityItems.length) {
    return { tone: "yellow", icon: "🟡", label: "דורש מעקב", reason: `${priorityItems.length} שחקנים דורשים מעקב היום.` };
  }
  return { tone: "green", icon: "🟢", label: "מצב תקין", reason: "אין חריגות מרכזיות לתדרוך היומי." };
}

function buildCoachHomePriorityItems(context) {
  const byPlayer = new Map();
  const add = (player, title, reason, severity, action, href) => {
    if (!player) return;
    const current = byPlayer.get(player.id) || {
      player,
      title,
      reasons: [],
      actions: [],
      severity: "Low",
      href: href || `/coach/player/${player.id}`
    };
    current.title = current.title || title;
    current.reasons = unique([...current.reasons, reason].filter(Boolean));
    current.actions = unique([...current.actions, action].filter(Boolean));
    current.severity = higherSeverity(current.severity, severity);
    current.href = href || current.href;
    byPlayer.set(player.id, current);
  };

  context.smartAlerts.forEach((alert) => add(alert.player, alert.title, alert.reason, alert.severity, alert.action, alert.href));
  context.status.riskPlayers.forEach((row) => add(
    row.player,
    row.mainReason,
    row.reasons.join(" · "),
    row.severity > 1 ? "High" : "Medium",
    "לבצע בדיקה קצרה לפני קבלת החלטת עומס.",
    `/coach/player/${row.player.id}`
  ));
  context.missingPre.forEach((player) => add(player, "דוח מוכנות חסר", "לא הוגש דוח מוכנות היום", "Low", "לשלוח תזכורת לפני הפעילות.", "/coach/reports"));
  context.missingPost.forEach((player) => add(player, "דוח RPE חסר", "לא הוגש דוח RPE היום", "Low", "לבקש השלמת דוח לאחר הפעילות.", "/coach/reports"));

  const rank = { High: 0, Medium: 1, Low: 2 };
  return [...byPlayer.values()].sort((a, b) => (rank[a.severity] ?? 3) - (rank[b.severity] ?? 3) || a.player.name.localeCompare(b.player.name, "he"));
}

function higherSeverity(first, second) {
  const rank = { High: 3, Medium: 2, Low: 1 };
  return (rank[second] || 0) > (rank[first] || 0) ? second : first;
}

function renderCoachHomePriorityPanel(items) {
  const visibleItems = items.slice(0, 5);
  const hiddenCount = Math.max(0, items.length - visibleItems.length);
  const detailRows = items.map((item) => ({
    name: item.player.name,
    reason: item.reasons.join(" · "),
    action: item.actions.join(" · "),
    severity: item.severity
  }));
  return `
    <section class="section decision-priority-panel coach-home-priority">
      <div class="section-title compact-title">
        <h3>דורש פעולה עכשיו</h3>
        <span>${items.length ? `${items.length} שחקנים` : "אין פעולה דחופה"}</span>
      </div>
      ${visibleItems.length ? `
        <div class="decision-alert-grid">
          ${visibleItems.map((item) => `
            <a class="decision-alert-card ${escapeAttr(item.severity.toLowerCase())}" href="${escapeAttr(item.href)}" data-route>
              <span class="severity-badge ${escapeAttr(item.severity.toLowerCase())}">${escapeHtml(severityLabel(item.severity))}</span>
              <strong>${escapeHtml(item.player.name)} · ${escapeHtml(item.title)}</strong>
              <p>${escapeHtml(item.reasons[0] || "דורש תשומת לב")}</p>
              <small>${escapeHtml(item.actions[0] || "לבדוק לפני הפעילות.")}</small>
            </a>
          `).join("")}
        </div>
        ${hiddenCount ? renderHomeDetailControl(`עוד ${hiddenCount} שחקנים · הצג הכל`, "כל השחקנים הדורשים פעולה", detailRows) : ""}
      ` : `<div class="surface empty compact-empty">אין שחקנים הדורשים פעולה מיידית.</div>`}
    </section>
  `;
}

function buildCoachHomeActionItems(context, priorityItems) {
  const actions = [];
  const missingPlayers = unique([...context.missingPre, ...context.missingPost].map((player) => player.id))
    .map((playerId) => context.activePlayers.find((player) => player.id === playerId))
    .filter(Boolean);
  if (missingPlayers.length) {
    actions.push({
      icon: "▤",
      title: `להזכיר ל־${missingPlayers.length} שחקנים להשלים דוחות`,
      summary: `${context.missingPre.length} מוכנות · ${context.missingPost.length} RPE`,
      href: "/coach/reports",
      details: missingPlayers.map((player) => ({
        name: player.name,
        reason: [context.missingPre.some((item) => item.id === player.id) ? "חסר דוח מוכנות" : "", context.missingPost.some((item) => item.id === player.id) ? "חסר דוח RPE" : ""].filter(Boolean).join(" · "),
        action: "לשלוח תזכורת ולבקש השלמה.",
        severity: "Low"
      }))
    });
  }
  if (context.status.painAlerts.length) {
    actions.push({
      icon: "+",
      title: `לבצע מעקב כאב אצל ${context.status.painAlerts.length} שחקנים`,
      summary: "שיחה קצרה לפני הפעילות",
      href: "/coach/analytics",
      details: context.status.painAlerts.map((item) => ({ name: item.player?.name || "שחקן", reason: item.details || item.reason, action: "לברר מצב עדכני לפני קביעת עומס.", severity: item.details?.includes("חוזר") ? "High" : "Medium" }))
    });
  }
  if (context.status.gpsLoadAlerts.length) {
    actions.push({
      icon: "GPS",
      title: "לעבור על חריגות GPS ועומס",
      summary: `${context.status.gpsLoadAlerts.length} פריטים לבדיקה`,
      href: "/coach/gps",
      details: context.status.gpsLoadAlerts.map((item) => ({ name: item.player?.name || "קבוצה", reason: item.reason, action: "לבחון דקות, HSR ועומס לפני הפעילות הבאה.", severity: "High" }))
    });
  }
  if (context.status.hydrationAlerts.length) {
    actions.push({
      icon: "H₂O",
      title: `להכין מעקב הידרציה ל־${context.status.hydrationAlerts.length} שחקנים`,
      summary: "הנחיית שתייה ושקילה חוזרת",
      href: "/coach/analytics",
      details: context.status.hydrationAlerts.map((item) => ({ name: item.player?.name || "שחקן", reason: item.reason, action: "להנחות שתייה ולבדוק התאוששות.", severity: item.report?.hydration?.tone === "red" ? "High" : "Medium" }))
    });
  }
  const workloadItems = priorityItems.filter((item) => item.reasons.some((reason) => /עומס|RPE|שינה|מוכנות/.test(reason)));
  if (workloadItems.length) {
    actions.push({
      icon: "↗",
      title: `לבחון התאמת עומס ל־${workloadItems.length} שחקנים`,
      summary: "לפי מוכנות, שינה ועומס אחרון",
      href: "/coach/analytics",
      details: workloadItems.map((item) => ({ name: item.player.name, reason: item.reasons.join(" · "), action: "להחליט אם להשאיר, להפחית או להתאים את העומס.", severity: item.severity }))
    });
  }
  if (!actions.length) {
    actions.push({ icon: "✓", title: "להמשיך מעקב שגרתי", summary: "אין משימה דחופה להיום", href: "/coach/calendar", details: [] });
  }
  return actions;
}

function renderCoachHomeActions(actions) {
  const visible = actions.slice(0, 4);
  const hidden = actions.slice(4);
  return `
    <section class="section coach-home-actions">
      <div class="section-title">
        <h3>פעולות מומלצות</h3>
        <span>${actions.length} משימות</span>
      </div>
      <div class="coach-action-grid">
        ${visible.map(renderCoachHomeActionItem).join("")}
      </div>
      ${hidden.length ? renderHomeDetailControl(`עוד ${hidden.length} פעולות · הצג הכל`, "כל הפעולות המומלצות", hidden.flatMap((item) => item.details.length ? item.details : [{ name: item.title, reason: item.summary, action: "", severity: "Low" }])) : ""}
    </section>
  `;
}

function renderCoachHomeActionItem(item) {
  return `
    <article class="coach-action-card home-detail-trigger" tabindex="0" data-home-detail>
      <span>${escapeHtml(item.icon)}</span>
      <div>
        <strong>${escapeHtml(item.title)}</strong>
        <p>${escapeHtml(item.summary)}</p>
        <a href="${escapeAttr(item.href)}" data-route class="text-link">פתיחת מסך</a>
      </div>
      ${renderHomeDetailPopover(item.title, item.details)}
    </article>
  `;
}

function renderHomeDetailControl(label, title, rows) {
  return `
    <div class="home-detail-control home-detail-trigger" role="button" tabindex="0" data-home-detail aria-label="${escapeAttr(label)}">
      <span>${escapeHtml(label)}</span>
      ${renderHomeDetailPopover(title, rows)}
    </div>
  `;
}

function renderHomeDetailPopover(title, rows = []) {
  return `
    <div class="home-detail-popover" role="tooltip">
      <strong class="home-detail-title">${escapeHtml(title)}</strong>
      <div class="home-detail-list">
        ${rows.length ? rows.map((row) => `
          <div class="home-detail-row${row.hideBadge ? " no-badge" : ""}">
            ${row.hideBadge ? "" : `<span class="severity-badge ${escapeAttr(row.tone || String(row.severity || "Low").toLowerCase())}">${escapeHtml(row.statusLabel || severityLabel(row.severity || "Low"))}</span>`}
            <div>
              <b>${escapeHtml(row.name || "קבוצה")}</b>
              ${row.reason ? `<p>${escapeHtml(row.reason)}</p>` : ""}
              ${row.action ? `<small>${escapeHtml(row.action)}</small>` : ""}
            </div>
          </div>
        `).join("") : `<p class="muted-text">אין פרטים נוספים.</p>`}
      </div>
    </div>
  `;
}

function buildCoachHomeSquadStatus(context) {
  const readinessByPlayer = new Map(context.readinessToday.map((report) => [report.playerId, report]));
  const postByPlayer = new Map(context.postToday.map((report) => [report.playerId, report]));
  const gpsByPlayer = new Map();
  context.status.gpsToday.filter((record) => record.riskFlags.length).forEach((record) => {
    gpsByPlayer.set(record.playerId, unique([...(gpsByPlayer.get(record.playerId) || []), ...record.riskFlags]));
  });
  const weekByPlayer = new Map(context.weekRows.map((row) => [row.player.id, row]));
  const groups = { normal: [], watch: [], check: [] };
  context.activePlayers.forEach((player) => {
    const status = getDashboardPlayerDailyStatus(player, readinessByPlayer.get(player.id), postByPlayer.get(player.id), gpsByPlayer, weekByPlayer);
    const item = { player, reason: status.reasons.join(" · ") || "ללא חריגה מרכזית" };
    if (status.tone === "red") groups.check.push(item);
    else if (status.tone === "yellow") groups.watch.push(item);
    else groups.normal.push(item);
  });
  return groups;
}

function renderCoachHomeSquadCard(squad) {
  return `
    <article class="surface coach-home-card squad-card">
      <div class="coach-home-card-title"><span>●</span><h3>מצב סגל</h3></div>
      <div class="squad-status-grid">
        ${renderSquadStatusCategory("green", "תקינים", squad.normal, "Low")}
        ${renderSquadStatusCategory("yellow", "במעקב", squad.watch, "Medium")}
        ${renderSquadStatusCategory("red", "לבדיקה", squad.check, "High")}
      </div>
    </article>
  `;
}

function renderSquadStatusCategory(tone, label, items, severity) {
  return `
    <div class="${escapeAttr(tone)} home-detail-trigger" tabindex="0" data-home-detail>
      <strong>${items.length}</strong><span>${escapeHtml(label)}</span>
      ${renderHomeDetailPopover(label, items.map((item) => ({ name: item.player.name, reason: item.reason, action: tone === "red" ? "לבדוק לפני הפעילות." : tone === "yellow" ? "להמשיך מעקב היום." : "אין פעולה נדרשת.", severity })))}
    </div>
  `;
}

function renderCoachHomeReportsCard(context) {
  const total = context.activePlayers.length;
  const readinessSubmitted = context.readinessToday.map((report) => report.playerName).filter(Boolean);
  const rpeSubmitted = context.postToday.map((report) => report.playerName).filter(Boolean);
  const detailRows = [
    { name: `הגישו מוכנות (${readinessSubmitted.length})`, reason: readinessSubmitted.join(", ") || "אין", statusLabel: "הוגש", tone: "green" },
    { name: `חסרים מוכנות (${context.missingPre.length})`, reason: context.missingPre.map((player) => player.name).join(", ") || "אין", statusLabel: "חסר", tone: "medium" },
    { name: `הגישו RPE (${rpeSubmitted.length})`, reason: rpeSubmitted.join(", ") || "אין", statusLabel: "הוגש", tone: "green" },
    { name: `חסרים RPE (${context.missingPost.length})`, reason: context.missingPost.map((player) => player.name).join(", ") || "אין", statusLabel: "חסר", tone: "medium" }
  ];
  return `
    <article class="surface coach-home-card coach-home-card-compact home-detail-trigger" tabindex="0" data-home-detail>
      <div class="coach-home-card-title"><span>▤</span><h3>דוחות היום</h3></div>
      <div class="report-completion-summary">
        <p><span>דוחות מוכנות</span><strong>${context.readinessToday.length}/${total}</strong></p>
        <p><span>דוחות RPE</span><strong>${context.postToday.length}/${total}</strong></p>
      </div>
      <a href="/coach/reports" data-route class="text-link">ניתוח דוחות</a>
      ${renderHomeDetailPopover("פירוט דוחות היום", detailRows)}
    </article>
  `;
}

function getCoachHomeLatestGpsActivity() {
  const sessionIdsWithRecords = new Set(state.gpsRecords.map((record) => record.gpsSessionId));
  const sessionItem = state.gpsSessions
    .filter((item) => item.date <= todayIso() && sessionIdsWithRecords.has(item.id))
    .sort((a, b) => b.date.localeCompare(a.date))[0] || null;
  if (!sessionItem) return null;
  const records = state.gpsRecords.filter((record) => record.gpsSessionId === sessionItem.id).map(getComputedGpsRecord);
  const preferredRecords = getFullPeriodPreferred(records).map(enrichPlayerGpsRecord);
  const averageGpsLoad = average(preferredRecords.map((record) => record.gpsLoad));
  const averageHsr = average(preferredRecords.map((record) => record.highSpeedRunning));
  const averageSprintDistance = average(preferredRecords.map((record) => record.sprintDistance));
  const alertRecords = preferredRecords.filter((record) => record.riskFlags.length);
  const aboveAverageHsr = preferredRecords.filter((record) => record.highSpeedRunning > averageHsr * 1.1);
  return {
    session: sessionItem,
    records: preferredRecords,
    playerCount: unique(preferredRecords.map((record) => record.playerId || record.playerName).filter(Boolean)).length,
    averageGpsLoad,
    gpsLoadScore: loadValueToScore(averageGpsLoad),
    averageHsr,
    averageSprintDistance,
    alertCount: alertRecords.length,
    alertRecords,
    aboveAverageHsr
  };
}

function renderCoachHomeGpsCard(latestGps) {
  if (!latestGps) {
    return `
      <article class="surface coach-home-card">
        <div class="coach-home-card-title"><span>📡</span><h3>פעילות GPS אחרונה ${coachInfoTip("הפעילות האחרונה שבה קיימים נתוני GPS במערכת.")}</h3></div>
        <p class="muted-text">אין נתוני GPS להצגה</p>
        <a href="/coach/gps" data-route class="text-link">פתיחת GPS</a>
      </article>
    `;
  }
  const sessionItem = latestGps.session;
  const detailRows = [
    {
      name: sessionItem.sessionName,
      reason: `${formatDateDisplay(sessionItem.date)} · ${formatGpsSessionType(sessionItem.activityType || sessionItem.type)} · ${latestGps.playerCount} שחקנים`,
      hideBadge: true
    },
    ...latestGps.alertRecords.map((record) => {
      const useHsr = record.riskFlags.some((flag) => /HSR|ספרינט/.test(flag));
      const value = useHsr ? record.highSpeedRunning : record.gpsLoad;
      const teamAverage = useHsr ? latestGps.averageHsr : latestGps.averageGpsLoad;
      const difference = calculateChangePercent(value, teamAverage);
      return {
        name: record.playerName,
        reason: `${record.riskFlags.join(" · ")} · ${useHsr ? "HSR" : "GPS Load"} ${formatInteger(value)} · ${formatPercent(difference)} מול ממוצע הקבוצה`,
        action: "לבחון את המדד יחד עם דקות, RPE ומוכנות.",
        severity: "High"
      };
    }),
    ...latestGps.aboveAverageHsr.filter((record) => !latestGps.alertRecords.some((alert) => alert.playerId === record.playerId)).slice(0, 6).map((record) => ({
      name: record.playerName,
      reason: `HSR ${formatInteger(record.highSpeedRunning)} מ׳ · ${formatPercent(calculateChangePercent(record.highSpeedRunning, latestGps.averageHsr))} מול ממוצע הקבוצה`,
      action: "מידע להשוואה; אין התראה אוטומטית.",
      severity: "Low"
    }))
  ];
  return `
    <article class="surface coach-home-card home-detail-trigger" tabindex="0" data-home-detail>
      <div class="coach-home-card-title"><span>GPS</span><h3>פעילות GPS אחרונה</h3></div>
      <div class="brief-stat-list coach-gps-brief">
        <p><span>עומס GPS ממוצע</span><strong>${latestGps.gpsLoadScore}/5</strong></p>
        <p><span>חריגות GPS</span><strong>${latestGps.alertCount}</strong></p>
        <p><span>מעל ממוצע HSR</span><strong>${latestGps.aboveAverageHsr.length} שחקנים</strong></p>
      </div>
      <a href="/coach/gps" data-route class="text-link">מעבר ל־GPS</a>
      ${renderHomeDetailPopover(`GPS אחרון · HSR ממוצע ${formatInteger(latestGps.averageHsr)} מ׳ · Sprint ממוצע ${formatInteger(latestGps.averageSprintDistance)} מ׳`, detailRows)}
    </article>
  `;
}

function buildCoachHomePainSummary(context) {
  const byPlayer = new Map();
  [...context.readinessToday, ...context.postToday].forEach((report) => {
    if (!report.painArea || report.painArea === NO_PAIN) return;
    const player = getPlayer(report.playerId);
    const repeated = countWeeklyPainReports(report.playerId, report.painArea, report.date) >= 2;
    const current = byPlayer.get(report.playerId);
    const entry = {
      player,
      painArea: report.painArea,
      painSide: report.painSide || "לא צוין",
      painIntensity: Number(report.painIntensity) || null,
      date: report.date,
      repeated
    };
    if (!current || (entry.painIntensity || 0) > (current.painIntensity || 0)) byPlayer.set(report.playerId, entry);
    else if (repeated) current.repeated = true;
  });
  const entries = [...byPlayer.values()].sort((a, b) => Number(b.repeated) - Number(a.repeated) || (b.painIntensity || 0) - (a.painIntensity || 0));
  return {
    count: entries.length,
    repeatedCount: entries.filter((item) => item.repeated).length,
    entries
  };
}

function renderCoachHomePainCard(pain) {
  const detailRows = pain.entries.map((item) => ({
    name: item.player?.name || "שחקן",
    reason: `${item.painArea} · ${item.painSide}${item.painIntensity ? ` · עוצמה ${item.painIntensity}/10` : ""} · ${formatDateDisplay(item.date)}${item.repeated ? " · דיווח חוזר" : ""}`,
    action: item.repeated || item.painIntensity >= 7 ? "דורש בדיקה לפני הפעילות." : "דורש מעקב ושיחה קצרה.",
    severity: item.repeated || item.painIntensity >= 7 ? "High" : "Medium"
  }));
  return `
    <article class="surface coach-home-card home-detail-trigger" tabindex="0" data-home-detail>
      <div class="coach-home-card-title"><span>+</span><h3>כאב / תשומת לב</h3></div>
      <div class="brief-stat-list">
        <p><span>דיווחי כאב</span><strong>${pain.count}</strong></p>
        <p><span>דיווחים חוזרים</span><strong>${pain.repeatedCount}</strong></p>
      </div>
      <small class="card-context-line">${pain.count ? "לחץ לפירוט שחקנים ואזורים" : "אין דיווחי כאב פעילים"}</small>
      ${renderHomeDetailPopover("דיווחי כאב פעילים", detailRows)}
    </article>
  `;
}

function buildCoachHomeHydrationSummary(context) {
  const alerts = context.status.hydrationAlerts;
  const highest = Math.max(0, ...alerts.map((item) => item.report.hydration ? Number(item.report.hydration.lossPercent) || 0 : 0));
  const aboveTwo = alerts.filter((item) => item.report.hydration && item.report.hydration.lossPercent > 2);
  return { alerts, highest, aboveTwo };
}

function renderCoachHomeHydrationCard(summary) {
  const detailRows = [...summary.alerts]
    .sort((a, b) => Number(b.report.hydration?.lossPercent || 0) - Number(a.report.hydration?.lossPercent || 0))
    .map((item) => ({
      name: item.player?.name || "שחקן",
      reason: `${formatNumber(item.report.hydration.lossPercent)}% איבוד נוזלים · ${formatDateDisplay(item.report.date)} · ${item.report.sessionType}`,
      action: item.report.hydration.lossPercent > 2 ? "דורש מעקב, הנחיית שתייה ובדיקה חוזרת." : "לשים לב לשתייה ולהתאוששות.",
      severity: item.report.hydration.lossPercent > 2 ? "High" : "Medium"
    }));
  return `
    <article class="surface coach-home-card home-detail-trigger" tabindex="0" data-home-detail>
      <div class="coach-home-card-title"><span>H₂O</span><h3>הידרציה</h3></div>
      <div class="brief-stat-list">
        <p><span>מעל 1%</span><strong>${summary.alerts.length} שחקנים</strong></p>
        <p><span>מעל 2%</span><strong>${summary.aboveTwo.length} שחקנים</strong></p>
        <p><span>איבוד מרבי</span><strong>${summary.highest ? `${formatNumber(summary.highest)}%` : "אין"}</strong></p>
      </div>
      ${renderHomeDetailPopover("שחקנים עם איבוד נוזלים מעל 1%", detailRows)}
    </article>
  `;
}

function buildCoachHomeRecentLoadSummary() {
  const dates = Array.from({ length: 7 }, (_, index) => addDays(todayIso(), index - 6));
  const daily = dates.map((date) => {
    const gpsSessionIds = state.gpsSessions.filter((sessionItem) => sessionItem.date === date).map((sessionItem) => sessionItem.id);
    const gpsRecords = getFullPeriodPreferred(state.gpsRecords.filter((record) => gpsSessionIds.includes(record.gpsSessionId)));
    const rpeReports = state.reports.filter((report) => report.date === date).map(getComputedReport);
    const gpsLoad = gpsRecords.length ? average(gpsRecords.map((record) => record.gpsLoad)) : 0;
    const rpeLoad = rpeReports.length ? average(rpeReports.map((report) => report.trainingLoad)) : 0;
    return {
      date,
      sessions: unique(gpsRecords.map((record) => record.gpsSessionId)).length,
      gpsLoad,
      rpeLoad,
      gpsScore: gpsLoad ? loadValueToScore(gpsLoad) : null,
      rpeScore: rpeLoad ? loadValueToScore(rpeLoad) : null
    };
  });
  const activeDays = daily.filter((item) => item.gpsLoad || item.rpeLoad);
  const highestDay = activeDays.sort((a, b) => (b.gpsLoad + b.rpeLoad) - (a.gpsLoad + a.rpeLoad))[0] || null;
  return {
    daily,
    sessions: sum(daily.map((item) => item.sessions)),
    averageGpsLoad: average(activeDays.filter((item) => item.gpsLoad).map((item) => item.gpsLoad)),
    averageRpeLoad: average(activeDays.filter((item) => item.rpeLoad).map((item) => item.rpeLoad)),
    highestDay
  };
}

function renderCoachHomeRecentLoadCard(summary) {
  const detailRows = [...summary.daily].reverse().map((item) => ({
    name: formatDateDisplay(item.date),
    reason: `GPS ${item.gpsScore ? `${item.gpsScore}/5 · ${formatInteger(item.gpsLoad)}` : "אין נתון"} · RPE ${item.rpeScore ? `${item.rpeScore}/5 · ${formatInteger(item.rpeLoad)}` : "אין נתון"}`,
    action: item.sessions ? `${item.sessions} פעילויות עם GPS` : "ללא פעילות GPS",
    hideBadge: true
  }));
  return `
    <article class="surface coach-home-card home-detail-trigger" tabindex="0" data-home-detail>
      <div class="coach-home-card-title"><span>7D</span><h3>עומס 7 ימים אחרונים</h3></div>
      <div class="brief-stat-list">
        <p><span>פעילויות</span><strong>${summary.sessions}</strong></p>
        <p><span>GPS Load ממוצע</span><strong>${summary.averageGpsLoad ? formatInteger(summary.averageGpsLoad) : "אין"}</strong></p>
        <p><span>RPE Load ממוצע</span><strong>${summary.averageRpeLoad ? formatInteger(summary.averageRpeLoad) : "אין"}</strong></p>
      </div>
      <small class="card-context-line">${summary.highestDay ? `יום העומס הגבוה: ${escapeHtml(formatDateDisplay(summary.highestDay.date))}` : "אין נתוני עומס לשבוע האחרון"}</small>
      <a href="/coach/calendar" data-route class="text-link">פתיחת לוח שנה</a>
      ${renderHomeDetailPopover("עומס יומי בשבעת הימים האחרונים", detailRows)}
    </article>
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
  const dashboardStatus = buildCoachDailyStatus(activePlayers, readinessToday, postToday, missingPre, missingPost, weekRows, selectedDate);
  const weekRange = getWeekRange(filters.weekDate || selectedDate);

  const html = coachShell("analytics", `
    <div class="page-header premium-header">
      <div>
        <span class="eyebrow">ניתוחים מלאים</span>
        <h2>ניתוחים</h2>
        <p>${escapeHtml(formatDateDisplay(selectedDate))} · תמונת מצב יומית למוכנות, עומס, הידרציה ו-GPS</p>
      </div>
      <div class="header-actions">
        <a href="/coach/reports" data-route class="btn primary">סיכום מאמן</a>
        <a href="/report" data-route class="btn secondary">כניסת שחקן</a>
      </div>
    </div>

    ${renderCoachAiSummary(dashboardStatus)}

    ${renderDecisionPriorityPanel(dashboardStatus.smartAlerts, "דורש פעולה עכשיו")}

    <section class="dashboard-kpi-grid" aria-label="מדדי יום מרכזיים">
      ${dashboardStatus.kpis.map(renderDashboardKpiCard).join("")}
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
        <h3>שחקנים בסיכון / דורשים בדיקה</h3>
        <span>${dashboardStatus.riskPlayers.length} שחקנים</span>
      </div>
      ${renderRiskPlayersSection(dashboardStatus.riskPlayers)}
    </section>

    <section class="section">
      <div class="section-title">
        <h3>מרכז התראות</h3>
        <span>${dashboardStatus.alertCount} התראות</span>
      </div>
      ${renderAlertCenter(dashboardStatus.alertGroups)}
    </section>

    <section class="section dashboard-chart-hub">
      <div class="section-title">
        <h3>מבט מגמות יומי</h3>
        <span>ניתוח לאחר בדיקת ההתראות</span>
      </div>
      ${renderDashboardChartHub(dashboardStatus)}
    </section>

    <section class="section">
      <div class="section-title">
        <h3>סטטוס יומי לפי שחקן</h3>
        <span>${activePlayers.length} שחקנים</span>
      </div>
      ${renderDailyStatusTable(activePlayers, readinessToday, postToday, selectedDate, dashboardStatus.gpsToday, weekRows)}
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

  mount(html, () => {
    bindDashboardFilters();
    bindDashboardChartHub();
    bindDashboardKpiCards();
    bindCoachHomeTooltips();
  });
}

function buildCoachDailyStatus(activePlayers, readinessToday, postToday, missingPre, missingPost, weekRows, selectedDate) {
  const readinessByPlayer = new Map(readinessToday.map((report) => [report.playerId, report]));
  const postByPlayer = new Map(postToday.map((report) => [report.playerId, report]));
  const gpsToday = getDashboardGpsRecordsForDate(selectedDate);
  const gpsRiskItems = gpsToday
    .filter((record) => record.riskFlags.length)
    .map((record) => ({ player: getPlayer(record.playerId), reason: record.riskFlags[0], record }));
  const painAlerts = mergePainReports(readinessToday, postToday);
  const hydrationAlerts = postToday
    .filter((report) => report.hydration && report.hydration.tone !== "green")
    .map((report) => ({ player: getPlayer(report.playerId), reason: `${report.hydration.status} ${formatNumber(report.hydration.lossPercent)}%`, report }));
  const loadAlerts = weekRows
    .filter((row) => row.weeklyLoadRisk && row.weeklyLoadRisk.tone !== "green")
    .map((row) => ({ player: row.player, reason: `${row.weeklyLoadRisk.label} ${formatPercent(row.loadChangePercent)}`, row }));
  const gpsLoadAlerts = [...gpsRiskItems, ...loadAlerts];
  const smartAlerts = buildSmartAlertsForDate(activePlayers, selectedDate, readinessToday, postToday, gpsToday, missingPre, missingPost);
  const missingItems = [
    ...missingPre.map((player) => ({ player, reason: "חסר דוח מוכנות" })),
    ...missingPost.map((player) => ({ player, reason: "חסר דוח RPE" }))
  ];
  const riskPlayers = buildDashboardRiskPlayers(activePlayers, readinessByPlayer, postByPlayer, gpsToday, weekRows);
  const readinessAvg = average(readinessToday.map((report) => report.readinessScore));
  const submittedTotal = readinessToday.length + postToday.length;
  const possibleReports = activePlayers.length * 2;
  const alertGroups = buildDashboardAlertGroups({
    activePlayers,
    readinessToday,
    postToday,
    missingPre,
    missingPost,
    gpsToday,
    weekRows,
    painAlerts,
    hydrationAlerts,
    gpsLoadAlerts,
    smartAlerts
  });
  const alertCount = sum(Object.values(alertGroups).map((items) => items.length));
  const kpis = buildDashboardKpis({
    readinessAvg,
    readinessToday,
    postToday,
    activePlayers,
    riskPlayers,
    missingPre,
    missingPost,
    missingItems,
    hydrationAlerts,
    gpsLoadAlerts,
    painAlerts,
    submittedTotal,
    possibleReports
  });
  const dailyTrend = buildTeamDailyTrendSeries(selectedDate, 7);
  const weeklyLoadTrend = buildTeamWeeklyLoadTrend(selectedDate, 6);
  const hasGpsData = dailyTrend.some((point) => point.gpsLoad > 0);
  const summary = buildCoachSummary({
    readinessAvg,
    readinessToday,
    postToday,
    activePlayers,
    riskPlayers,
    missingItems,
    painAlerts,
    hydrationAlerts,
    gpsLoadAlerts
  });

  return {
    readinessAvg,
    submittedTotal,
    possibleReports,
    gpsToday,
    riskPlayers,
    missingPre,
    missingPost,
    missingItems,
    painAlerts,
    hydrationAlerts,
    gpsLoadAlerts,
    smartAlerts,
    kpis,
    alertGroups,
    alertCount,
    dailyTrend,
    weeklyLoadTrend,
    hasGpsData,
    summary
  };
}

function buildDashboardKpis(data) {
  return [
    {
      icon: "⚠️",
      title: "שחקנים בסיכון",
      value: data.riskPlayers.length,
      note: "דורשים בדיקה",
      tone: data.riskPlayers.length ? "red" : "green",
      items: data.riskPlayers.map((row) => ({ player: row.player, reason: row.mainReason }))
    },
    {
      icon: "📝",
      title: "דוחות מוכנות חסרים",
      value: data.missingPre.length,
      note: "לפני אימון",
      tone: data.missingPre.length ? "yellow" : "green",
      items: data.missingPre.map((player) => ({ player, reason: "חסר דוח מוכנות" }))
    },
    {
      icon: "📝",
      title: "דוחות RPE חסרים",
      value: data.missingPost.length,
      note: "אחרי אימון",
      tone: data.missingPost.length ? "yellow" : "green",
      items: data.missingPost.map((player) => ({ player, reason: "חסר דוח RPE" }))
    },
    {
      icon: "✚",
      title: "כאבים פעילים",
      value: data.painAlerts.length,
      note: "דיווחי כאב",
      tone: data.painAlerts.length ? "yellow" : "green",
      items: data.painAlerts
    },
    {
      icon: "📡",
      title: "חריגות GPS",
      value: data.gpsLoadAlerts.length,
      note: "חריגות עומס",
      tone: data.gpsLoadAlerts.length ? "red" : "green",
      items: data.gpsLoadAlerts
    },
    {
      icon: "💧",
      title: "הידרציה חריגה",
      value: data.hydrationAlerts.length,
      note: "איבוד נוזלים",
      tone: data.hydrationAlerts.some((item) => item.report.hydration && item.report.hydration.tone === "red") ? "red" : data.hydrationAlerts.length ? "yellow" : "green",
      items: data.hydrationAlerts
    }
  ];
}

function buildCoachSummary(data) {
  const playerNames = data.riskPlayers.slice(0, 3).map((row) => row.player.name).join(", ");
  const missingNames = data.missingItems.slice(0, 3).map((item) => item.player.name).join(", ");
  const bullets = [
    {
      icon: "⚠️",
      title: "שחקנים לבדיקה",
      value: data.riskPlayers.length ? `${data.riskPlayers.length}${playerNames ? ` - ${playerNames}` : ""}` : "אין"
    },
    {
      icon: "📝",
      title: "דוחות חסרים",
      value: data.missingItems.length ? `${data.missingItems.length}${missingNames ? ` - ${missingNames}` : ""}` : "אין"
    },
    {
      icon: "📡",
      title: "GPS / עומס",
      value: data.gpsLoadAlerts.length ? `${data.gpsLoadAlerts.length} חריגות` : "אין חריגות"
    },
    {
      icon: "✚",
      title: "כאבים",
      value: data.painAlerts.length ? `${data.painAlerts.length} דיווחים` : "אין דיווחים חריגים"
    },
    {
      icon: "💧",
      title: "הידרציה",
      value: data.hydrationAlerts.length ? `${data.hydrationAlerts.length} התראות` : "תקין"
    }
  ];
  return { bullets };
}

function renderCoachAiSummary(status) {
  return `
    <section class="surface coach-ai-summary compact-summary">
      <div class="summary-main">
        <span class="eyebrow">AI Summary / Coach Summary</span>
        <h3>תמונת מצב יומית</h3>
        <div class="summary-bullets">
          ${status.summary.bullets.map((item) => `
            <p>
              <span class="summary-icon" aria-hidden="true">${escapeHtml(item.icon)}</span>
              <span><strong>${escapeHtml(item.title)}:</strong> ${escapeHtml(item.value)}</span>
            </p>
          `).join("")}
        </div>
      </div>
    </section>
  `;
}

function renderDashboardKpiCard(card) {
  const items = card.items && card.items.length ? card.items : [{ player: null, reason: "תקין" }];
  const statusLabel = card.tone === "green" ? "תקין" : card.tone === "yellow" ? "לשים לב" : "לבדוק";
  return `
    <article class="dashboard-kpi-card ${card.tone}" tabindex="0">
      <div class="kpi-card-top">
        <span><i aria-hidden="true">${escapeHtml(card.icon || "•")}</i>${escapeHtml(card.title)}</span>
      </div>
      <strong>${escapeHtml(card.value)}</strong>
      <small class="kpi-status ${card.tone}">${escapeHtml(statusLabel)} · ${escapeHtml(card.note)}</small>
      <div class="kpi-detail-popover" role="tooltip">
        <strong>${escapeHtml(card.title)}</strong>
        ${items.slice(0, 8).map((item) => `
          <p>
            <b>${item.player ? escapeHtml(item.player.name) : "מצב כללי"}</b>
            <span>${escapeHtml(item.reason || item.details || "תקין")}</span>
          </p>
        `).join("")}
        ${items.length > 8 ? `<em>ועוד ${items.length - 8}</em>` : ""}
      </div>
    </article>
  `;
}

function bindDashboardKpiCards() {
  const closeCards = () => {
    document.querySelectorAll(".dashboard-kpi-card.detail-open").forEach((card) => card.classList.remove("detail-open"));
  };
  document.querySelectorAll(".dashboard-kpi-card").forEach((card) => {
    card.addEventListener("click", (event) => {
      const wasOpen = card.classList.contains("detail-open");
      closeCards();
      if (!wasOpen) {
        event.stopPropagation();
        card.classList.add("detail-open");
        document.addEventListener("click", closeCards, { once: true });
      }
    });
    card.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeCards();
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        card.click();
      }
    });
  });
}

function buildDashboardRiskPlayers(players, readinessByPlayer, postByPlayer, gpsToday, weekRows) {
  const gpsByPlayer = new Map();
  gpsToday.filter((record) => record.riskFlags.length).forEach((record) => {
    const current = gpsByPlayer.get(record.playerId) || [];
    gpsByPlayer.set(record.playerId, unique([...current, ...record.riskFlags]));
  });
  const weekByPlayer = new Map(weekRows.map((row) => [row.player.id, row]));
  return players.map((player) => {
    const readiness = readinessByPlayer.get(player.id) || null;
    const post = postByPlayer.get(player.id) || null;
    const week = weekByPlayer.get(player.id) || null;
    const gpsFlags = gpsByPlayer.get(player.id) || [];
    const painArea = [post && post.painArea !== NO_PAIN ? post.painArea : "", readiness && readiness.painArea !== NO_PAIN ? readiness.painArea : ""].find(Boolean) || "";
    const reasons = unique([
      ...(readiness && readiness.readinessScore < 80 ? [`מוכנות ${readiness.readinessScore}`] : []),
      ...(post && post.rpe >= state.settings.rpeHigh ? [`RPE ${post.rpe}`] : []),
      ...(painArea ? [`כאב ב${painArea}`] : []),
      ...(post && post.hydration && post.hydration.tone !== "green" ? [post.hydration.status] : []),
      ...(week && week.weeklyLoadRisk && week.weeklyLoadRisk.tone !== "green" ? [week.weeklyLoadRisk.label] : []),
      ...gpsFlags.slice(0, 2),
      ...(readiness ? readiness.riskFlags.slice(0, 2) : []),
      ...(post ? post.riskFlags.slice(0, 2) : [])
    ]);
    if (!reasons.length) return null;
    const severity = (readiness && readiness.readinessScore < 60) || (post && post.rpe >= 9) || (post && post.hydration && post.hydration.tone === "red") || gpsFlags.length ? 2 : 1;
    return {
      player,
      mainReason: reasons[0],
      reasons,
      readinessScore: readiness ? readiness.readinessScore : null,
      rpe: post ? post.rpe : null,
      painArea,
      hydration: post ? post.hydration : null,
      gpsLoadAlert: gpsFlags[0] || (week && week.weeklyLoadRisk && week.weeklyLoadRisk.tone !== "green" ? week.weeklyLoadRisk.label : ""),
      severity
    };
  }).filter(Boolean).sort((a, b) => b.severity - a.severity || (a.readinessScore || 999) - (b.readinessScore || 999));
}

function renderRiskPlayersSection(rows) {
  if (!rows.length) return `<div class="surface empty">אין שחקנים בסיכון משמעותי היום</div>`;
  return `
    <div class="risk-player-grid">
      ${rows.map((row) => `
        <article class="risk-player-card ${row.severity > 1 ? "red" : "yellow"}">
          <div class="risk-player-head">
            <a href="/coach/player/${escapeAttr(row.player.id)}" data-route>${escapeHtml(row.player.name)}</a>
            <span class="badge ${row.severity > 1 ? "red" : "yellow"}">${escapeHtml(row.mainReason)}</span>
          </div>
          <div class="risk-player-metrics">
            <span>מוכנות: <b>${row.readinessScore !== null ? escapeHtml(formatInteger(row.readinessScore)) : "אין"}</b></span>
            <span>RPE: <b>${row.rpe !== null ? escapeHtml(row.rpe) : "אין"}</b></span>
            <span>כאב: <b>${escapeHtml(row.painArea || "אין")}</b></span>
            <span>הידרציה: <b>${row.hydration ? escapeHtml(row.hydration.status) : "אין נתון"}</b></span>
          </div>
          <p>${escapeHtml(row.reasons.slice(0, 4).join(" · "))}</p>
          ${row.gpsLoadAlert ? `<small>GPS/עומס: ${escapeHtml(row.gpsLoadAlert)}</small>` : ""}
        </article>
      `).join("")}
    </div>
  `;
}

function buildDashboardAlertGroups(data) {
  const highRpe = data.postToday
    .filter((report) => report.rpe >= state.settings.rpeHigh)
    .map((report) => dashboardAlert(getPlayer(report.playerId), "RPE גבוה", `RPE ${report.rpe}, עומס ${formatInteger(report.trainingLoad)}`, "לבדוק התאוששות ולשקול הורדת עומס.", "Medium"));
  return {
    "מגמות": data.smartAlerts || [],
    "GPS": data.gpsLoadAlerts.map((item) => dashboardAlert(item.player, "GPS/עומס", item.reason, "לבחון דקות, HSR ועומס שבועי.", "High")),
    "כאבים": data.painAlerts.map((item) => dashboardAlert(item.player, "דיווח כאב", item.reason, "לעקוב ולערב צוות מקצועי אם הכאב חוזר.", "Medium")),
    "הידרציה": data.hydrationAlerts.map((item) => dashboardAlert(item.player, "הידרציה", item.reason, "הנחיית שתייה, התאוששות ושקילה חוזרת.", item.report.hydration && item.report.hydration.tone === "red" ? "High" : "Medium")),
    "RPE": highRpe,
    "דוחות חסרים": [
      ...data.missingPre.map((player) => dashboardAlert(player, "חסר דוח מוכנות", "לא מילא דוח לפני אימון", "להזכיר מילוי לפני האימון.", "Low")),
      ...data.missingPost.map((player) => dashboardAlert(player, "חסר דוח RPE", "לא מילא דוח אחרי אימון", "להשלים דוח אחרי האימון.", "Low"))
    ]
  };
}

function dashboardAlert(player, type, reason, action, severity = "Medium", href = "") {
  return { player, type, title: type, reason, action, severity, href: href || (player ? `/coach/player/${player.id}` : "/coach/analytics") };
}

function buildSmartAlertsForDate(activePlayers, selectedDate, readinessToday, postToday, gpsToday, missingPre, missingPost) {
  const alerts = [];
  const gpsTodayByPlayer = new Map(gpsToday.map((record) => [record.playerId, record]));
  const postTodayByPlayer = new Map(postToday.map((report) => [report.playerId, report]));
  const missingTodayByPlayer = new Map();
  missingPre.forEach((player) => missingTodayByPlayer.set(player.id, [...(missingTodayByPlayer.get(player.id) || []), "דוח מוכנות"]));
  missingPost.forEach((player) => missingTodayByPlayer.set(player.id, [...(missingTodayByPlayer.get(player.id) || []), "דוח RPE"]));

  activePlayers.forEach((player) => {
    const gpsTrend = getPlayerGpsDailySeries(player.id, selectedDate, 5).filter((item) => item.gpsLoad > 0).slice(-3);
    if (gpsTrend.length === 3 && gpsTrend[0].gpsLoad < gpsTrend[1].gpsLoad && gpsTrend[1].gpsLoad < gpsTrend[2].gpsLoad) {
      alerts.push(smartAlert(player, "עומס GPS עולה", `עומס GPS עולה 3 פעילויות ברצף: ${gpsTrend.map((item) => formatInteger(item.gpsLoad)).join(" ← ")}`, "High", "לבדוק דקות, HSR והתאוששות לפני עומס נוסף.", `/coach/player/${player.id}/gps`));
    }

    const sleepTrend = getPlayerReadinessSeries(player.id, selectedDate, 5).filter((item) => Number(item.sleepHours) > 0).slice(-3);
    if (sleepTrend.length === 3 && sleepTrend[0].sleepHours > sleepTrend[1].sleepHours && sleepTrend[1].sleepHours > sleepTrend[2].sleepHours) {
      alerts.push(smartAlert(player, "שינה בירידה", `שעות שינה יורדות 2 ימים ברצף: ${sleepTrend.map((item) => `${formatNumber(item.sleepHours)}ש׳`).join(" ← ")}`, sleepTrend[2].sleepHours < 6 ? "High" : "Medium", "לשאול על התאוששות ולהתאים עומס אם צריך.", `/coach/player/${player.id}/sleep`));
    }

    const post = postTodayByPlayer.get(player.id);
    const gps = gpsTodayByPlayer.get(player.id);
    if (post && gps && post.rpe >= state.settings.rpeHigh && Number(gps.gpsLoad) >= 800) {
      alerts.push(smartAlert(player, "RPE גבוה אחרי עומס GPS גבוה", `RPE ${post.rpe} אחרי עומס GPS ${formatInteger(gps.gpsLoad)}`, "High", "לבדוק התאוששות ולשקול התאמת עומס מחר.", `/coach/player/${player.id}/load`));
    }

    const repeatedPain = getRepeatedPainAlertForPlayer(player.id, selectedDate);
    if (repeatedPain) {
      alerts.push(smartAlert(player, "כאב חוזר", repeatedPain.reason, repeatedPain.severity, "לעקוב בשיחה קצרה לפני פעילות. אין כאן אבחנה רפואית.", `/coach/player/${player.id}/pain`));
    }

    const missingDays = countPlayerMissingReportDays(player.id, selectedDate, 3);
    if (missingDays >= 2) {
      const todayMissing = missingTodayByPlayer.get(player.id);
      alerts.push(smartAlert(player, "דוחות חסרים מספר ימים", `${missingDays} ימים עם דוח חסר מתוך 3 האחרונים${todayMissing ? ` · היום חסר: ${todayMissing.join(", ")}` : ""}`, "Medium", "להזכיר מילוי עקבי כדי לשמור על תמונת מצב אמינה.", "/coach/reports"));
    }
  });

  return sortSmartAlerts(uniqueSmartAlerts(alerts));
}

function smartAlert(player, title, reason, severity, action, href) {
  return { player, type: title, title, reason, severity, action, href };
}

function sortSmartAlerts(alerts) {
  const rank = { High: 0, Medium: 1, Low: 2 };
  return alerts.sort((a, b) => (rank[a.severity] ?? 3) - (rank[b.severity] ?? 3) || String(a.player?.name || "").localeCompare(String(b.player?.name || ""), "he"));
}

function uniqueSmartAlerts(alerts) {
  const seen = new Set();
  return alerts.filter((alert) => {
    const key = `${alert.player?.id || ""}-${alert.title}-${alert.reason}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function getPlayerGpsDailySeries(playerId, selectedDate, days) {
  const startDate = addDays(selectedDate, -(days - 1));
  const records = state.gpsRecords
    .map(getComputedGpsRecord)
    .filter((record) => record.playerId === playerId && record.date >= startDate && record.date <= selectedDate);
  const byDate = new Map();
  records.forEach((record) => {
    const current = byDate.get(record.date) || [];
    current.push(record);
    byDate.set(record.date, current);
  });
  return [...byDate.entries()]
    .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
    .map(([date, dayRecords]) => {
      const preferred = getFullPeriodPreferred(dayRecords);
      return { date, gpsLoad: average(preferred.map((record) => record.gpsLoad)) || 0 };
    });
}

function getPlayerReadinessSeries(playerId, selectedDate, days) {
  const startDate = addDays(selectedDate, -(days - 1));
  return state.readinessReports
    .filter((report) => report.playerId === playerId && report.date >= startDate && report.date <= selectedDate)
    .map(getComputedReadiness)
    .sort((a, b) => a.date.localeCompare(b.date));
}

function getRepeatedPainAlertForPlayer(playerId, selectedDate) {
  const startDate = addDays(selectedDate, -6);
  const painReports = [
    ...state.readinessReports.filter((report) => report.playerId === playerId && report.date >= startDate && report.date <= selectedDate),
    ...state.reports.filter((report) => report.playerId === playerId && report.date >= startDate && report.date <= selectedDate)
  ].filter((report) => report.painArea && report.painArea !== NO_PAIN);
  const counts = new Map();
  painReports.forEach((report) => {
    const item = counts.get(report.painArea) || { count: 0, maxIntensity: 0 };
    item.count += 1;
    item.maxIntensity = Math.max(item.maxIntensity, Number(report.painIntensity) || 0);
    counts.set(report.painArea, item);
  });
  const repeated = [...counts.entries()].find(([, item]) => item.count >= 2);
  if (!repeated) return null;
  const [area, item] = repeated;
  return {
    severity: item.maxIntensity >= 8 ? "High" : "Medium",
    reason: `${item.count} דיווחים על ${area} בשבוע האחרון${item.maxIntensity ? ` · עוצמה עד ${item.maxIntensity}/10` : ""}`
  };
}

function countPlayerMissingReportDays(playerId, selectedDate, days) {
  return Array.from({ length: days }, (_, index) => addDays(selectedDate, -index)).filter((date) => {
    const hasReadiness = state.readinessReports.some((report) => report.playerId === playerId && report.date === date);
    const hasRpe = state.reports.some((report) => report.playerId === playerId && report.date === date);
    return !hasReadiness || !hasRpe;
  }).length;
}

function severityLabel(severity) {
  if (severity === "High") return "גבוה";
  if (severity === "Medium") return "בינוני";
  return "נמוך";
}

function severityIcon(severity) {
  if (severity === "High") return "!";
  if (severity === "Medium") return "•";
  return "i";
}

function renderDecisionPriorityPanel(alerts, title = "דורש פעולה עכשיו") {
  const topAlerts = sortSmartAlerts([...(alerts || [])]).slice(0, 5);
  return `
    <section class="section decision-priority-panel">
      <div class="section-title compact-title">
        <h3>${escapeHtml(title)}</h3>
        <span>${topAlerts.length ? `${topAlerts.length} התראות מרכזיות` : "אין פעולה דחופה"}</span>
      </div>
      ${topAlerts.length ? `
        <div class="decision-alert-grid">
          ${topAlerts.map((alert) => `
            <a class="decision-alert-card ${escapeAttr(alert.severity.toLowerCase())}" href="${escapeAttr(alert.href || "/coach/analytics")}" data-route>
              <span class="severity-badge ${escapeAttr(alert.severity.toLowerCase())}">${escapeHtml(severityLabel(alert.severity))}</span>
              <strong>${escapeHtml(alert.player ? `${alert.player.name} · ${alert.title}` : alert.title)}</strong>
              <p>${escapeHtml(alert.reason)}</p>
              <small>${escapeHtml(alert.action)}</small>
            </a>
          `).join("")}
        </div>
      ` : `<div class="surface empty compact-empty">אין התראות מגמה שדורשות פעולה מיידית.</div>`}
    </section>
  `;
}

function renderAlertCenter(groups) {
  const groupEntries = Object.entries(groups);
  if (!groupEntries.some(([, alerts]) => alerts.length)) return `<div class="surface empty">אין התראות פעילות היום</div>`;
  return `
    <div class="alert-center-grid">
      ${groupEntries.map(([title, alerts]) => renderAlertGroup(title, alerts)).join("")}
    </div>
  `;
}

function renderAlertGroup(title, alerts) {
  return `
    <details class="alert-group-card">
      <summary>
        <span><i aria-hidden="true">${escapeHtml(getAlertGroupIcon(title))}</i>${escapeHtml(title)}</span>
        <strong>${escapeHtml(alerts.length)}</strong>
      </summary>
      <div class="alert-group-list">
        ${alerts.length ? alerts.map(renderAlertRow).join("") : `<p class="muted-row">אין התראות</p>`}
      </div>
    </details>
  `;
}

function getAlertGroupIcon(title) {
  if (title.includes("מגמות")) return "!";
  if (title.includes("GPS")) return "📡";
  if (title.includes("כאב")) return "✚";
  if (title.includes("הידרציה")) return "💧";
  if (title.includes("RPE")) return "↗";
  if (title.includes("דוח")) return "📝";
  return "•";
}

function renderAlertRow(alert) {
  return `
    <article class="alert-row ${escapeAttr((alert.severity || "Medium").toLowerCase())}">
      <div>
        <strong>${alert.player ? escapeHtml(alert.player.name) : "שחקן לא ידוע"}</strong>
        <span><b class="severity-badge ${escapeAttr((alert.severity || "Medium").toLowerCase())}">${escapeHtml(severityLabel(alert.severity || "Medium"))}</b>${escapeHtml(alert.type)} · ${escapeHtml(alert.reason)}</span>
      </div>
      <p>${escapeHtml(alert.action)}</p>
    </article>
  `;
}

function getDashboardGpsRecordsForDate(date) {
  const records = state.gpsRecords.map(getComputedGpsRecord).filter((record) => record.date === date);
  return getFullPeriodPreferred(records);
}

function buildTeamDailyTrendSeries(anchorDate, days) {
  return Array.from({ length: days }, (_, index) => {
    const date = addDays(anchorDate, index - (days - 1));
    const readiness = state.readinessReports.filter((report) => report.date === date).map(getComputedReadiness);
    const posts = state.reports.filter((report) => report.date === date).map(getComputedReport);
    const gps = getDashboardGpsRecordsForDate(date);
    return {
      date,
      readinessAvg: average(readiness.map((report) => report.readinessScore)),
      avgRpe: average(posts.map((report) => report.rpe)),
      hydrationRiskCount: posts.filter((report) => report.hydration && report.hydration.tone !== "green").length,
      gpsLoad: Math.round(average(gps.map((record) => record.gpsLoad)) || 0)
    };
  });
}

function buildTeamWeeklyLoadTrend(anchorDate, weeks) {
  const currentRange = getWeekRange(anchorDate);
  return Array.from({ length: weeks }, (_, index) => {
    const weekStart = addDays(currentRange.start, (index - (weeks - 1)) * 7);
    const range = getWeekRange(weekStart);
    const posts = state.reports.filter((report) => isWithinRange(report.date, range)).map(getComputedReport);
    return {
      date: range.start,
      totalLoad: sum(posts.map((report) => report.trainingLoad))
    };
  });
}

function renderDashboardChartHub(status) {
  const charts = [
    {
      id: "readiness",
      label: "מוכנות",
      title: "מגמת מוכנות קבוצתית",
      content: renderLineChart(status.dailyTrend, "readinessAvg", "מוכנות")
    },
    {
      id: "load",
      label: "עומס",
      title: "מגמת עומס שבועית",
      content: renderLineChart(status.weeklyLoadTrend, "totalLoad", "עומס שבועי")
    },
    {
      id: "rpe",
      label: "RPE",
      title: "מגמת RPE ממוצע",
      content: renderLineChart(status.dailyTrend, "avgRpe", "RPE")
    },
    {
      id: "gps",
      label: "GPS",
      title: "סקירת עומס GPS",
      content: status.hasGpsData ? renderLineChart(status.dailyTrend, "gpsLoad", "עומס GPS") : `<div class="empty">אין נתוני GPS להצגה</div>`
    },
    {
      id: "hydration",
      label: "הידרציה",
      title: "מגמת הידרציה",
      content: renderLineChart(status.dailyTrend, "hydrationRiskCount", "חריגות הידרציה")
    }
  ];
  return `
    <div class="surface dashboard-chart-shell">
      <div class="chart-selector-row" role="tablist" aria-label="בחירת גרף דשבורד">
        ${charts.map((item, index) => `
          <button class="${index === 0 ? "is-active" : ""}" type="button" role="tab" aria-selected="${index === 0 ? "true" : "false"}" data-dashboard-chart="${escapeAttr(item.id)}">${escapeHtml(item.label)}</button>
        `).join("")}
      </div>
      <div class="dashboard-chart-panels">
        ${charts.map((item, index) => `
          <article class="dashboard-chart-panel" data-dashboard-chart-panel="${escapeAttr(item.id)}" ${index === 0 ? "" : "hidden"}>
            <h3>${escapeHtml(item.title)}</h3>
            ${item.content}
          </article>
        `).join("")}
      </div>
    </div>
  `;
}

function bindDashboardChartHub() {
  document.querySelectorAll("[data-dashboard-chart]").forEach((button) => {
    button.addEventListener("click", () => {
      const target = button.getAttribute("data-dashboard-chart");
      document.querySelectorAll("[data-dashboard-chart]").forEach((item) => {
        const isActive = item === button;
        item.classList.toggle("is-active", isActive);
        item.setAttribute("aria-selected", isActive ? "true" : "false");
      });
      document.querySelectorAll("[data-dashboard-chart-panel]").forEach((panel) => {
        panel.hidden = panel.getAttribute("data-dashboard-chart-panel") !== target;
      });
    });
  });
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

function renderDailyStatusTable(players, readinessReports, postReports, selectedDate, gpsToday = [], weekRows = []) {
  const readinessByPlayer = new Map(readinessReports.map((report) => [report.playerId, report]));
  const postByPlayer = new Map(postReports.map((report) => [report.playerId, report]));
  const gpsByPlayer = new Map();
  gpsToday.filter((record) => record.riskFlags && record.riskFlags.length).forEach((record) => {
    const current = gpsByPlayer.get(record.playerId) || [];
    gpsByPlayer.set(record.playerId, unique([...current, ...record.riskFlags]));
  });
  const weekByPlayer = new Map(weekRows.map((row) => [row.player.id, row]));
  return `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>סטטוס</th>
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
            const status = getDashboardPlayerDailyStatus(player, readiness, post, gpsByPlayer, weekByPlayer);
            const pain = unique([readiness && readiness.painArea !== NO_PAIN ? readiness.painArea : "", post && post.painArea !== NO_PAIN ? post.painArea : ""].filter(Boolean));
            const flags = unique([...(readiness ? readiness.riskFlags : []), ...(post ? post.riskFlags : [])]);
            return `
              <tr>
                <td><span class="daily-status-pill ${escapeAttr(status.tone)}" ${coachTooltipAttrs(status.reasons.join(", ") || "תקין")}>${escapeHtml(status.label)}</span></td>
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

function getDashboardPlayerDailyStatus(player, readiness, post, gpsByPlayer, weekByPlayer) {
  const reasons = [];
  let severity = 0;
  if (!readiness) {
    severity = Math.max(severity, 1);
    reasons.push("חסר דוח מוכנות");
  }
  if (!post) {
    severity = Math.max(severity, 1);
    reasons.push("חסר דוח RPE");
  }
  if (!readiness && !post) severity = 2;
  if (readiness && readiness.readinessScore < 60) {
    severity = 2;
    reasons.push("מוכנות נמוכה");
  } else if (readiness && readiness.readinessScore < 80) {
    severity = Math.max(severity, 1);
    reasons.push("מוכנות למעקב");
  }
  if (post && post.rpe >= 9) {
    severity = 2;
    reasons.push("RPE גבוה");
  } else if (post && post.rpe >= state.settings.rpeHigh) {
    severity = Math.max(severity, 1);
    reasons.push("RPE גבוה");
  }
  const hasPain = (readiness && readiness.painArea && readiness.painArea !== NO_PAIN) || (post && post.painArea && post.painArea !== NO_PAIN);
  if (hasPain) {
    severity = Math.max(severity, 1);
    reasons.push("דיווח כאב");
  }
  if (post && post.hydration && post.hydration.tone === "red") {
    severity = 2;
    reasons.push("הידרציה חריגה");
  } else if (post && post.hydration && post.hydration.tone === "yellow") {
    severity = Math.max(severity, 1);
    reasons.push("הידרציה למעקב");
  }
  const gpsFlags = gpsByPlayer.get(player.id) || [];
  if (gpsFlags.length) {
    severity = 2;
    reasons.push("חריגת GPS");
  }
  const week = weekByPlayer.get(player.id);
  if (week && week.weeklyLoadRisk && week.weeklyLoadRisk.tone === "red") {
    severity = 2;
    reasons.push("קפיצה בעומס");
  } else if (week && week.weeklyLoadRisk && week.weeklyLoadRisk.tone === "yellow") {
    severity = Math.max(severity, 1);
    reasons.push("עומס למעקב");
  }
  if (severity >= 2) return { label: "🔴 בדיקה", tone: "red", reasons: unique(reasons) };
  if (severity === 1) return { label: "🟡 מעקב", tone: "yellow", reasons: unique(reasons) };
  return { label: "🟢 תקין", tone: "green", reasons: [] };
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
  return renderCoachReportsAnalysisPage(selectedDate);
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

function renderCoachReportsAnalysisPage(selectedDate) {
  const context = buildReportsAnalysisContext(selectedDate);
  const html = coachShell("reports", `
    <div class="page-header premium-header report-header">
      <div>
        <span class="eyebrow">Report Analysis</span>
        <h2>מרכז ניתוח דוחות</h2>
        <p>${escapeHtml(formatDateDisplay(selectedDate))} · מה הדוחות מספרים לי על מוכנות, התאוששות ועומסים?</p>
      </div>
      <a href="/coach" data-route class="btn secondary">חזרה לתדרוך יומי</a>
    </div>

    ${renderReportsDecisionStrip(context)}

    <section class="report-analysis-hero surface">
      <div>
        <span class="eyebrow">תמונת מצב מקצועית</span>
        <h3>${escapeHtml(context.mainInsight.title)}</h3>
        <p>${escapeHtml(context.mainInsight.text)}</p>
      </div>
      <div class="report-analysis-hero-grid">
        ${reportInsightMini("מוכנות ממוצעת", context.averages.readiness ? `${formatInteger(context.averages.readiness)}/100` : "אין נתון")}
        ${reportInsightMini("שינה ממוצעת", context.averages.sleep ? `${formatNumber(context.averages.sleep)} ש׳` : "אין נתון")}
        ${reportInsightMini("RPE ממוצע", context.averages.rpe ? formatNumber(context.averages.rpe) : "אין נתון")}
        ${reportInsightMini("איבוד נוזלים ממוצע", context.averages.hydration ? `${formatNumber(context.averages.hydration)}%` : "אין נתון")}
      </div>
    </section>

    <section class="report-analysis-grid">
      ${renderReportAnalysisCard("מגמת מוכנות", context.trends.readiness, "מבוסס על ציון מוכנות יומי ממוצע", "readiness")}
      ${renderReportAnalysisCard("שינה והתאוששות", context.trends.sleep, "שעות שינה ואיכות שינה מהדוחות", "sleep")}
      ${renderReportAnalysisCard("הידרציה", context.trends.hydration, "איבוד נוזלים מחושב כאשר קיימים משקל לפני ואחרי", "hydration")}
      ${renderReportAnalysisCard("דיווחי כאב", context.trends.pain, "שחקנים שדיווחו כאב או כאב חוזר", "pain")}
      ${renderReportAnalysisCard("RPE ועומס פנימי", context.trends.rpe, "RPE ועומס מחושב לפי דקות המאמן", "rpe")}
      ${renderReportAnalysisCard("ממוצעים שבועיים", context.trends.weekly, "השוואת עומס ומוכנות לפי שחקן בשבוע הנוכחי", "weekly")}
    </section>

    <section class="section">
      <div class="section-title">
        <h3>מגמות קבוצה</h3>
        <span>14 ימים אחרונים</span>
      </div>
      <div class="charts-grid">
        ${chartCard("מוכנות", renderLineChart(context.dailySeries, "readinessAvg", "מוכנות"))}
        ${chartCard("שינה", renderLineChart(context.dailySeries, "sleepAvg", "שעות שינה"))}
        ${chartCard("RPE", renderLineChart(context.dailySeries, "rpeAvg", "RPE"))}
        ${chartCard("הידרציה", renderLineChart(context.dailySeries, "hydrationAvg", "איבוד נוזלים %"))}
      </div>
    </section>

    <section class="section">
      <div class="section-title">
        <h3>השוואת שחקנים השבוע</h3>
        <span>${context.weekRows.length} שחקנים עם נתונים</span>
      </div>
      ${renderReportsPlayerComparison(context.weekRows)}
    </section>

    <details class="surface report-raw-tables">
      <summary>
        <span>טבלת דוחות מלאה</span>
        <strong>${context.readinessReports.length + context.postReports.length} רשומות</strong>
      </summary>
      <div class="grid two">
        <section>
          <div class="section-title">
            <h3>דוחות מוכנות</h3>
            <span>${context.readinessReports.length} רשומות</span>
          </div>
          ${renderReadinessTable(context.readinessReports)}
        </section>
        <section>
          <div class="section-title">
            <h3>דוחות RPE</h3>
            <span>${context.postReports.length} רשומות</span>
          </div>
          ${renderReportsTable(context.postReports, true)}
        </section>
      </div>
    </details>
  `);
  mount(html);
}

function buildReportsAnalysisContext(selectedDate) {
  const activePlayers = getActivePlayers();
  const readinessReports = state.readinessReports
    .map(getComputedReadiness)
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
  const postReports = state.reports
    .map(getComputedReport)
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
  const dailySeries = buildReportsDailySeries(selectedDate, 14);
  const weekRows = buildWeeklyRows({ ...uiState.dashboardFilters, date: "all", weekDate: selectedDate })
    .filter((row) => row.reportCount || row.avgReadiness || row.avgSleep)
    .sort((a, b) => (b.flags.length - a.flags.length) || b.totalLoad - a.totalLoad)
    .slice(0, 8);
  const hydrationReports = postReports.filter((report) => report.hydration);
  const painReports = [...readinessReports, ...postReports].filter((report) => report.painArea && report.painArea !== NO_PAIN);
  const readinessToday = readinessReports.filter((report) => report.date === selectedDate);
  const postToday = postReports.filter((report) => report.date === selectedDate);
  const readinessIds = new Set(readinessToday.map((report) => report.playerId));
  const postIds = new Set(postToday.map((report) => report.playerId));
  const missingPre = activePlayers.filter((player) => !readinessIds.has(player.id));
  const missingPost = activePlayers.filter((player) => !postIds.has(player.id));
  const gpsToday = getDashboardGpsRecordsForDate(selectedDate);
  const smartAlerts = buildSmartAlertsForDate(activePlayers, selectedDate, readinessToday, postToday, gpsToday, missingPre, missingPost);
  const averages = {
    readiness: average(readinessReports.slice(0, 40).map((report) => report.readinessScore)),
    sleep: average(readinessReports.slice(0, 40).map((report) => report.sleepHours)),
    rpe: average(postReports.slice(0, 40).map((report) => report.rpe)),
    hydration: average(hydrationReports.slice(0, 40).map((report) => report.hydration.lossPercent))
  };
  const trends = {
    readiness: describeReportTrend(dailySeries, "readinessAvg", "מוכנות"),
    sleep: describeReportTrend(dailySeries, "sleepAvg", "שינה"),
    hydration: describeReportTrend(dailySeries, "hydrationAvg", "הידרציה", true),
    pain: {
      tone: painReports.length ? "yellow" : "green",
      value: painReports.length,
      label: painReports.length ? `${painReports.length} דיווחים` : "אין דיווחים חריגים",
      detail: painReports.length ? unique(painReports.slice(0, 5).map((report) => report.playerName)).join(", ") : "אין דיווחי כאב זמינים בתקופה."
    },
    rpe: describeReportTrend(dailySeries, "rpeAvg", "RPE", true),
    weekly: {
      tone: weekRows.some((row) => row.weeklyLoadRisk && row.weeklyLoadRisk.tone === "red") ? "red" : weekRows.length ? "yellow" : "green",
      value: weekRows.length,
      label: weekRows.length ? `${weekRows.length} שחקנים עם נתוני שבוע` : "אין נתוני שבוע",
      detail: weekRows[0] ? `${weekRows[0].player.name}: עומס ${formatInteger(weekRows[0].totalLoad)}` : "אין מספיק נתונים להשוואה."
    }
  };
  const mainInsight = buildReportsMainInsight(trends, averages);
  return { selectedDate, activePlayers, readinessReports, postReports, readinessToday, postToday, missingPre, missingPost, smartAlerts, dailySeries, weekRows, hydrationReports, painReports, averages, trends, mainInsight };
}

function renderReportsDecisionStrip(context) {
  const missingAlerts = [
    ...context.missingPre.map((player) => smartAlert(player, "חסר דוח מוכנות", "לא מולא דוח מוכנות להיום", "Low", "להזכיר מילוי לפני תחילת פעילות.", "/coach/reports")),
    ...context.missingPost.map((player) => smartAlert(player, "חסר דוח RPE", "לא מולא דוח RPE להיום", "Low", "להשלים דוח אחרי פעילות.", "/coach/reports"))
  ];
  const alerts = sortSmartAlerts([...context.smartAlerts, ...missingAlerts]).slice(0, 5);
  return `
    <section class="section decision-priority-panel">
      <div class="section-title compact-title">
        <h3>מה דורש פעולה בדוחות?</h3>
        <span>${alerts.length ? `${alerts.length} פריטים מרכזיים` : "אין פעולה מיידית"}</span>
      </div>
      ${alerts.length ? `
        <div class="decision-alert-grid">
          ${alerts.map((alert) => `
            <a class="decision-alert-card ${escapeAttr(alert.severity.toLowerCase())}" href="${escapeAttr(alert.href || "/coach/reports")}" data-route>
              <span class="severity-badge ${escapeAttr(alert.severity.toLowerCase())}">${escapeHtml(severityLabel(alert.severity))}</span>
              <strong>${escapeHtml(alert.player ? `${alert.player.name} · ${alert.title}` : alert.title)}</strong>
              <p>${escapeHtml(alert.reason)}</p>
              <small>${escapeHtml(alert.action)}</small>
            </a>
          `).join("")}
        </div>
      ` : `<div class="surface empty compact-empty">כל הדוחות המרכזיים תקינים להיום.</div>`}
    </section>
  `;
}

function buildReportsDailySeries(anchorDate, days) {
  return getDateRangeList(addDays(anchorDate, -(days - 1)), anchorDate).map((date) => {
    const readiness = state.readinessReports.filter((report) => report.date === date).map(getComputedReadiness);
    const posts = state.reports.filter((report) => report.date === date).map(getComputedReport);
    const hydration = posts.filter((report) => report.hydration);
    return {
      date,
      readinessAvg: average(readiness.map((report) => report.readinessScore)),
      sleepAvg: average(readiness.map((report) => report.sleepHours)),
      rpeAvg: average(posts.map((report) => report.rpe)),
      loadAvg: average(posts.map((report) => report.trainingLoad)),
      hydrationAvg: average(hydration.map((report) => report.hydration.lossPercent)),
      painCount: readiness.filter((report) => report.painArea && report.painArea !== NO_PAIN).length + posts.filter((report) => report.painArea && report.painArea !== NO_PAIN).length
    };
  });
}

function describeReportTrend(series, key, label, lowerIsBetter = false) {
  const values = series.map((point) => Number(point[key]) || 0).filter((value) => value > 0);
  if (values.length < 2) return { tone: "green", value: 0, label: "אין מספיק נתונים", detail: `אין מספיק נתונים להצגת מגמת ${label}.` };
  const first = average(values.slice(0, Math.ceil(values.length / 2)));
  const second = average(values.slice(Math.floor(values.length / 2)));
  const delta = second - first;
  const tone = Math.abs(delta) < 0.3 ? "green" : (lowerIsBetter ? delta > 0 : delta < 0) ? "yellow" : "green";
  const direction = Math.abs(delta) < 0.3 ? "יציבה" : delta > 0 ? "בעלייה" : "בירידה";
  return {
    tone,
    value: second,
    label: `${label} ${direction}`,
    detail: `ממוצע אחרון: ${formatNumber(second)} לעומת ${formatNumber(first)} בתחילת התקופה.`
  };
}

function buildReportsMainInsight(trends, averages) {
  const issues = [];
  if (trends.readiness.tone !== "green") issues.push("מוכנות בירידה");
  if (trends.sleep.tone !== "green" || (averages.sleep && averages.sleep < state.settings.sleepHoursLow)) issues.push("שינה דורשת מעקב");
  if (trends.hydration.tone !== "green") issues.push("הידרציה דורשת תשומת לב");
  if (trends.pain.value) issues.push("קיימים דיווחי כאב");
  if (trends.rpe.tone !== "green") issues.push("RPE במגמת עומס");
  if (!issues.length) {
    return { title: "הדוחות מצביעים על מצב יציב", text: "אין חריגה מרכזית במגמות האחרונות. מומלץ להמשיך מעקב שגרתי לפי שחקנים." };
  }
  return { title: `${issues.length} נושאים דורשים מעקב`, text: issues.slice(0, 4).join(" · ") };
}

function reportInsightMini(label, value) {
  return `
    <div>
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
    </div>
  `;
}

function renderReportAnalysisCard(title, trend, helper, iconClass) {
  return `
    <article class="surface report-analysis-card ${escapeAttr(trend.tone)} ${escapeAttr(iconClass)}">
      <span>${escapeHtml(helper)}</span>
      <strong>${escapeHtml(title)}</strong>
      <b>${escapeHtml(trend.label)}</b>
      <p>${escapeHtml(trend.detail)}</p>
    </article>
  `;
}

function renderReportsPlayerComparison(rows) {
  if (!rows.length) return `<div class="surface empty">אין מספיק נתונים להשוואת שחקנים השבוע</div>`;
  return `
    <div class="report-player-comparison">
      ${rows.map((row) => `
        <a href="/coach/player/${escapeAttr(row.player.id)}" data-route class="report-player-card">
          <div>
            <strong>${escapeHtml(row.player.name)}</strong>
            <span>${escapeHtml(row.flags.slice(0, 2).join(", ") || "ללא חריגה מרכזית")}</span>
          </div>
          <div class="report-player-metrics">
            <span>מוכנות <b>${escapeHtml(row.avgReadiness ? formatInteger(row.avgReadiness) : "אין")}</b></span>
            <span>שינה <b>${escapeHtml(row.avgSleep ? formatNumber(row.avgSleep) : "אין")}</b></span>
            <span>RPE <b>${escapeHtml(row.avgRpe ? formatNumber(row.avgRpe) : "אין")}</b></span>
            <span>עומס <b>${escapeHtml(formatInteger(row.totalLoad))}</b></span>
          </div>
        </a>
      `).join("")}
    </div>
  `;
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

function renderPlayerProfile(playerId, activeTab = "readiness") {
  const player = state.players.find((item) => item.id === playerId);
  if (!player) {
    renderNotFound();
    return;
  }
  activeTab = normalizeCoachPlayerProfileTab(activeTab);
  const postReports = state.reports
    .filter((report) => report.playerId === player.id)
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
    .map(getComputedReport);
  const readinessReports = state.readinessReports
    .filter((report) => report.playerId === player.id)
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
    .map(getComputedReadiness);
  const gpsRecords = state.gpsRecords
    .filter((record) => record.playerId === player.id)
    .map(getComputedGpsRecord)
    .sort((a, b) => b.date.localeCompare(a.date));
  const context = buildCoachPlayerProfileContext(player, activeTab, postReports, readinessReports, gpsRecords);

  const html = coachShell("players", `
    ${renderCoachPlayerProfileHero(context)}
    ${renderCoachPlayerTimeline(context)}
    ${renderCoachPlayerProfileTabs(context)}
    ${renderCoachPlayerProfileTabContent(context)}
  `);

  mount(html, () => bindCoachPlayerProfile(context));
}

function buildCoachPlayerProfileContext(player, activeTab, postReports, readinessReports, gpsRecords) {
  const lastPost = postReports[0] || null;
  const lastReadiness = readinessReports[0] || null;
  const currentSummary = summarizePlayerWeek(player.id, todayIso());
  const previousSummary = summarizePlayerWeek(player.id, addDays(getWeekRange(todayIso()).start, -1));
  const loadChange = calculateChangePercent(currentSummary.totalLoad, previousSummary.totalLoad);
  const postSeries = buildPlayerPostSeries(player.id).slice(-14);
  const readinessSeries = buildPlayerReadinessSeries(player.id).slice(-14);
  const hydrationSeries = postSeries.filter((report) => report.hydration).map((report) => ({ ...report, hydrationLossPercent: report.hydration.lossPercent }));
  const weeklyLoadSeries = buildWeeklyLoadSeries(player.id).slice(-8);
  const enrichedGpsRecords = gpsRecords.map((record) => enrichPlayerGpsRecord(record));
  const gpsFullRecords = getFullPeriodPreferred(enrichedGpsRecords).sort((a, b) => a.date.localeCompare(b.date));
  const latestGps = enrichedGpsRecords[0] || null;
  const painHistory = buildPainHistory(player.id);
  const latestPain = getLatestPlayerPainReport(player.id);
  const comments = [...postReports, ...readinessReports]
    .filter((report) => report.comments)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 8);
  const context = {
    player,
    activeTab,
    postReports,
    readinessReports,
    lastPost,
    lastReadiness,
    currentSummary,
    previousSummary,
    loadChange,
    postSeries,
    readinessSeries,
    hydrationSeries,
    weeklyLoadSeries,
    gpsRecords: enrichedGpsRecords,
    gpsFullRecords,
    latestGps,
    internalExternalSeries: buildInternalExternalSeries(player.id),
    painHistory,
    latestPain,
    comments,
    position: getPlayerPrimaryPosition(player.id) || "עמדה לא מוגדרת",
    trend: getLoadTrend(player.id)
  };
  context.status = getCoachPlayerProfileStatus(context);
  return context;
}

function renderCoachPlayerProfileHero(context) {
  const latestDate = getCoachPlayerLatestDate(context);
  const latestPainText = context.latestPain ? `${context.latestPain.painArea}${context.latestPain.painSide ? ` · ${context.latestPain.painSide}` : ""}` : "אין דיווח כאב";
  const latestGpsText = context.latestGps ? (context.latestGps.riskFlags.length ? `לבדוק · ${context.latestGps.riskFlags[0]}` : "תקין") : "אין נתון";
  return `
    <section class="profile-hero profile-drilldown-hero surface">
      <div class="profile-identity">
        <span class="eyebrow">פרופיל שחקן</span>
        <h2>${escapeHtml(context.player.name)}</h2>
        <p>${escapeHtml(context.position)} · ${latestDate ? `דוח אחרון: ${escapeHtml(formatDateDisplay(latestDate))}` : "אין דוחות זמינים"}</p>
        <div class="profile-badges">
          <span class="badge ${context.player.active ? "green" : "neutral"}">${context.player.active ? "פעיל" : "לא פעיל"}</span>
          <span class="badge ${context.status.tone}">${escapeHtml(context.status.label)}</span>
          <span class="badge ${context.trend.tone}">${escapeHtml(context.trend.label)}</span>
        </div>
      </div>
      <div class="profile-main-status ${context.status.tone}">
        <span>סטטוס נוכחי</span>
        <strong>${escapeHtml(context.status.label)}</strong>
        <p>${escapeHtml(context.status.mainReason)}</p>
      </div>
      <div class="profile-status-strip compact">
        <div>
          <span>מוכנות אחרונה</span>
          <strong>${context.lastReadiness ? `${escapeHtml(formatInteger(context.lastReadiness.readinessScore))}/100` : "אין נתון"}</strong>
        </div>
        <div>
          <span>עומס שבועי</span>
          <strong>${escapeHtml(formatInteger(context.currentSummary.totalLoad))}</strong>
        </div>
        <div>
          <span>כאב אחרון</span>
          <strong>${escapeHtml(latestPainText)}</strong>
        </div>
        <div>
          <span>הידרציה</span>
          <strong>${context.lastPost && context.lastPost.hydration ? escapeHtml(context.lastPost.hydration.status) : "אין נתון"}</strong>
        </div>
        <div>
          <span>GPS</span>
          <strong>${escapeHtml(latestGpsText)}</strong>
        </div>
      </div>
      <a href="/coach/players" data-route class="btn secondary">חזרה לשחקנים</a>
    </section>
  `;
}

function renderCoachPlayerTimeline(context) {
  const events = buildCoachPlayerTimelineEvents(context).slice(0, 9);
  return `
    <section class="section player-timeline-section">
      <div class="section-title">
        <h3>ציר זמן שחקן</h3>
        <span>${events.length ? "האירועים האחרונים" : "אין אירועים להצגה"}</span>
      </div>
      ${events.length ? `
        <div class="player-timeline">
          ${events.map((event) => `
            <article class="timeline-event ${escapeAttr(event.tone)}">
              <time>${escapeHtml(formatShortDate(event.date))}</time>
              <div>
                <span>${escapeHtml(event.type)}</span>
                <strong>${escapeHtml(event.title)}</strong>
                <p>${escapeHtml(event.detail)}</p>
              </div>
            </article>
          `).join("")}
        </div>
      ` : `<div class="surface empty compact-empty">אין מספיק נתונים לציר זמן.</div>`}
    </section>
  `;
}

function buildCoachPlayerTimelineEvents(context) {
  const events = [];
  getFullPeriodPreferred(context.gpsRecords).forEach((record) => {
    const gpsScore = loadValueToScore(record.gpsLoad);
    const activityType = formatGpsSessionType(record.sessionType || "");
    events.push({
      date: record.date,
      type: activityType,
      title: record.sessionName || "פעילות GPS",
      detail: `GPS Load ${gpsScore}/5 · ${formatGpsReviewMetric("totalDistance", record.totalDistance)} · HSR ${formatGpsReviewMetric("highSpeedRunning", record.highSpeedRunning)}`,
      tone: record.riskFlags.length ? "red" : gpsScore >= 4 ? "yellow" : "green"
    });
    record.riskFlags.slice(0, 2).forEach((flag) => {
      events.push({
        date: record.date,
        type: "התראת GPS",
        title: "דורש בדיקה",
        detail: flag,
        tone: "red"
      });
    });
  });
  context.postReports.forEach((report) => {
    events.push({
      date: report.date,
      type: "דוח RPE",
      title: `${report.sessionType} · RPE ${report.rpe}`,
      detail: `עומס ${formatInteger(report.trainingLoad)} · עייפות ${report.fatigue}/5${report.comments ? ` · ${report.comments}` : ""}`,
      tone: report.riskFlags.length ? "yellow" : "green"
    });
    if (report.painArea && report.painArea !== NO_PAIN) {
      events.push({
        date: report.date,
        type: "דיווח כאב",
        title: report.painArea,
        detail: report.painIntensity ? `עוצמה ${report.painIntensity}/10` : "דווח בדוח RPE",
        tone: "yellow"
      });
    }
    if (report.hydration && report.hydration.tone !== "green") {
      events.push({
        date: report.date,
        type: "הידרציה",
        title: report.hydration.status,
        detail: `איבוד נוזלים ${formatNumber(report.hydration.lossPercent)}% · ${formatNumber(report.hydration.lossKg)} ק״ג`,
        tone: report.hydration.tone
      });
    }
  });
  context.readinessReports.forEach((report) => {
    const status = getReadinessStatus(report.readinessScore);
    events.push({
      date: report.date,
      type: "מוכנות",
      title: status.label,
      detail: `שינה ${formatNumber(report.sleepHours)} שעות · אנרגיה ${report.energy}/5 · כאבי שריר ${report.soreness}/5`,
      tone: status.tone
    });
    if (report.painArea && report.painArea !== NO_PAIN) {
      events.push({
        date: report.date,
        type: "דיווח כאב",
        title: report.painArea,
        detail: `${report.painSide || "צד לא צוין"}${report.painIntensity ? ` · עוצמה ${report.painIntensity}/10` : ""}`,
        tone: report.painIntensity && report.painIntensity >= 7 ? "red" : "yellow"
      });
    }
    if (report.sleepHours && report.sleepHours < state.settings.sleepHoursLow) {
      events.push({
        date: report.date,
        type: "שינה",
        title: "שינה נמוכה",
        detail: `${formatNumber(report.sleepHours)} שעות · איכות ${report.sleepQuality}/5`,
        tone: "yellow"
      });
    }
  });
  const readinessDates = new Set(context.readinessReports.map((report) => report.date));
  const rpeDates = new Set(context.postReports.map((report) => report.date));
  unique(state.sessions.filter((sessionItem) => sessionItem.date <= todayIso()).map((sessionItem) => sessionItem.date))
    .filter((date) => !readinessDates.has(date) || !rpeDates.has(date))
    .slice(-4)
    .forEach((date) => {
      const missing = [!readinessDates.has(date) ? "מוכנות" : "", !rpeDates.has(date) ? "RPE" : ""].filter(Boolean);
      events.push({
        date,
        type: "דוח חסר",
        title: `חסר דוח ${missing.join(" ו-")}`,
        detail: "נדרשת השלמה כדי לשמור על רצף המעקב.",
        tone: "yellow"
      });
    });
  return events.sort((a, b) => b.date.localeCompare(a.date) || getTimelineToneRank(a.tone) - getTimelineToneRank(b.tone));
}

function getTimelineToneRank(tone) {
  if (tone === "red") return 0;
  if (tone === "yellow") return 1;
  return 2;
}

function renderCoachPlayerProfileTabs(context) {
  return `
    <nav class="profile-tabs drilldown-tabs" aria-label="אזורי פרופיל">
      ${getCoachPlayerProfileTabs().map((item) => `
        <a href="/coach/player/${escapeAttr(context.player.id)}/${escapeAttr(item.id)}" data-route class="${context.activeTab === item.id ? "active" : ""}" aria-current="${context.activeTab === item.id ? "page" : "false"}">${escapeHtml(item.label)}</a>
      `).join("")}
    </nav>
  `;
}

function renderCoachPlayerProfileTabContent(context) {
  const tab = getCoachPlayerProfileTabs().find((item) => item.id === context.activeTab) || getCoachPlayerProfileTabs()[0];
  const renderers = {
    readiness: renderCoachPlayerReadinessTab,
    load: renderCoachPlayerLoadTab,
    gps: renderCoachPlayerGpsTab,
    sleep: renderCoachPlayerSleepTab,
    pain: renderCoachPlayerPainTab,
    hydration: renderCoachPlayerHydrationTab,
    notes: renderCoachPlayerNotesTab
  };
  return `
    <section class="section profile-tab-panel" data-profile-tab="${escapeAttr(tab.id)}">
      <div class="section-title">
        <h3>${escapeHtml(tab.label)}</h3>
        <span>${escapeHtml(getCoachPlayerProfileTabSubtitle(context, tab.id))}</span>
      </div>
      ${renderers[tab.id](context)}
    </section>
  `;
}

function getCoachPlayerProfileTabSubtitle(context, tab) {
  if (tab === "readiness") return `${context.readinessReports.length} דוחות מוכנות`;
  if (tab === "load") return `${context.postReports.length} דוחות RPE`;
  if (tab === "gps") return `${context.gpsRecords.length} רשומות GPS`;
  if (tab === "sleep") return "שינה ואיכות התאוששות";
  if (tab === "pain") return context.latestPain ? `כאב אחרון: ${context.latestPain.painArea}` : "אין כאב פעיל";
  if (tab === "hydration") return `${context.hydrationSeries.length} רשומות הידרציה`;
  return `${context.comments.length} הערות שחקן`;
}

function renderCoachPlayerReadinessTab(context) {
  const readinessComments = context.readinessReports.filter((report) => report.comments).slice(0, 5);
  return `
    <div class="profile-focus-grid">
      ${profileFocusCard("ציון מוכנות אחרון", context.lastReadiness ? `${formatInteger(context.lastReadiness.readinessScore)}/100` : "אין נתון", context.lastReadiness ? getReadinessStatus(context.lastReadiness.readinessScore).label : "חסר דוח", context.lastReadiness ? getReadinessStatus(context.lastReadiness.readinessScore).tone : "yellow")}
      ${profileFocusCard("סיבה מרכזית", context.status.mainReason, "לפי דוחות מוכנות/RPE/GPS", context.status.tone)}
      ${profileFocusCard("מגמת עומס", context.trend.label, "לפי שבועות אחרונים", context.trend.tone)}
    </div>
    <div class="charts-grid section">
      ${chartCard("מגמת מוכנות", renderLineChart(context.readinessSeries, "readinessScore", "ציון מוכנות"))}
      ${chartCard("מגמת שינה", renderLineChart(context.readinessSeries, "sleepHours", "שעות שינה"))}
      ${chartCard("אנרגיה / מוטיבציה", renderDualLineChart(context.readinessSeries, "energy", "mood", "אנרגיה", "מוטיבציה"))}
      ${chartCard("כאבי שריר", renderLineChart(context.readinessSeries, "soreness", "כאבי שריר"))}
    </div>
    <div class="split section">
      <div>
        <div class="section-title">
          <h3>דוח מוכנות אחרון</h3>
          <span>${context.lastReadiness ? escapeHtml(formatDateDisplay(context.lastReadiness.date)) : "אין"}</span>
        </div>
        ${context.lastReadiness ? renderReadinessCard(context.lastReadiness) : `<div class="surface empty">אין דוח מוכנות</div>`}
      </div>
      <div>
        <div class="section-title">
          <h3>הערות שחקן מהדוחות</h3>
          <span>${readinessComments.length} הערות</span>
        </div>
        ${renderCommentsList(readinessComments)}
      </div>
    </div>
  `;
}

function renderCoachPlayerLoadTab(context) {
  const highRpe = context.postReports.filter((report) => report.rpe >= state.settings.rpeHigh);
  return `
    <div class="profile-focus-grid">
      ${profileFocusCard("עומס שבועי", formatInteger(context.currentSummary.totalLoad), "יחידות עומס", "neutral")}
      ${profileFocusCard("שבוע קודם", formatInteger(context.previousSummary.totalLoad), "יחידות עומס", "neutral")}
      ${profileFocusCard("שינוי בעומס", formatPercent(context.loadChange), "לעומת שבוע קודם", getWeeklyLoadRisk(context.loadChange).tone)}
      ${profileFocusCard("RPE ממוצע", formatNumber(context.currentSummary.avgRpe), "השבוע", average(context.postReports.slice(0, 3).map((report) => report.rpe)) >= state.settings.rpeHigh ? "yellow" : "green")}
    </div>
    <div class="charts-grid section">
      ${chartCard("עומס שבועי פנימי", renderLineChart(context.weeklyLoadSeries, "totalLoad", "עומס שבועי"))}
      ${chartCard("עומס יומי", renderLineChart(context.postSeries, "trainingLoad", "עומס"))}
      ${chartCard("RPE לאורך זמן", renderLineChart(context.postSeries, "rpe", "RPE"))}
    </div>
    <div class="section">
      <div class="section-title">
        <h3>התראות RPE גבוה</h3>
        <span>${highRpe.length} התראות</span>
      </div>
      ${renderCoachProfileAlertList(highRpe.map((report) => ({
        title: formatDateDisplay(report.date),
        detail: `RPE ${report.rpe} · עומס ${formatInteger(report.trainingLoad)} · ${report.comments || "אין הערה"}`
      })), "אין התראות RPE גבוה")}
    </div>
    <div class="section">
      <div class="section-title">
        <h3>טבלת עומסים</h3>
        <span>${context.postReports.length} דוחות</span>
      </div>
      ${renderReportsTable(context.postReports, true)}
    </div>
  `;
}

function renderCoachPlayerGpsTab(context) {
  const metrics = getCoachGpsMetricDefinitions();
  const selected = metrics[0];
  return `
    <div class="surface coach-gps-filter-panel">
      <div>
        <span class="field-label">סוג פעילות</span>
        <div class="player-filter-row" aria-label="סוג פעילות GPS">
          ${[
            ["all", "הכל"],
            ["training", "אימונים"],
            ["match", "משחקים"]
          ].map(([value, label], index) => `<button class="${index === 0 ? "is-active" : ""}" type="button" data-coach-profile-gps-activity="${escapeAttr(value)}">${escapeHtml(label)}</button>`).join("")}
        </div>
      </div>
      <div>
        <span class="field-label">תקופה</span>
        <div id="coachProfileGpsPeriods" class="player-filter-row" aria-label="תקופת GPS">
          ${renderCoachGpsPeriodButtons("all")}
        </div>
      </div>
      <div>
        <span class="field-label">מדד לגרף</span>
        <div class="player-filter-row metric-row" aria-label="בחירת מדד GPS">
          ${metrics.map((metric, index) => `<button class="${index === 0 ? "is-active" : ""}" type="button" data-coach-profile-gps-metric="${escapeAttr(metric.key)}">${escapeHtml(metric.label)}</button>`).join("")}
        </div>
      </div>
    </div>

    <div id="coachProfileGpsDynamic">
      ${renderCoachProfileGpsDynamic(context, "all", "latest", selected.key)}
    </div>
  `;
}

function renderCoachGpsPeriodButtons(activity) {
  return getPlayerGpsPeriodOptions(activity)
    .map((option, index) => `<button class="${index === 0 ? "is-active" : ""}" type="button" data-coach-profile-gps-period="${escapeAttr(option.value)}">${escapeHtml(option.label)}</button>`)
    .join("");
}

function renderCoachProfileGpsDynamic(context, activity, period, metricKey) {
  const metrics = getCoachGpsMetricDefinitions();
  const metric = metrics.find((item) => item.key === metricKey) || metrics[0];
  const records = getPlayerGpsRecordsForProfile(context.player.id, activity, period);
  const seasonRecords = getPlayerGpsRecordsForProfile(context.player.id, activity, "season");
  const latest = records[0] || null;
  const gpsAlerts = records.filter((record) => record.riskFlags.length);
  const lastTitle = getCoachGpsLastActivityTitle(activity);
  return `
    ${latest ? renderCoachGpsLastActivity(latest, lastTitle) : `<div class="surface empty">אין נתוני GPS לסינון שנבחר</div>`}

    <div class="player-kpi-grid coach-gps-kpi-grid">
      ${renderCoachGpsMetricCards(records, seasonRecords, metrics)}
    </div>

    <div class="surface profile-chart-selector section">
      ${renderCoachProfileGpsChart(records, metric.key)}
    </div>

    <section class="section">
      <div class="section-title">
        <h3>שיאים אישיים</h3>
        <span>${escapeHtml(getCoachGpsActivityLabel(activity))}</span>
      </div>
      ${renderCoachGpsPersonalRecords(seasonRecords, metrics)}
    </section>

    <section class="section">
      <div class="section-title">
        <h3>תובנות GPS למאמן</h3>
        <span>${records.length} רשומות בסינון</span>
      </div>
      ${renderCoachGpsInsights(records, seasonRecords, metric)}
    </section>

    <section class="section">
      <div class="section-title">
        <h3>התראות GPS</h3>
        <span>${gpsAlerts.length} התראות</span>
      </div>
      ${renderCoachProfileAlertList(gpsAlerts.map((record) => ({
        title: `${formatDateDisplay(record.date)} · ${record.sessionName}`,
        detail: record.riskFlags.join(", ")
      })), "אין התראות GPS בסינון שנבחר")}
    </section>

    <section class="section">
      <div class="section-title">
        <h3>היסטוריית GPS</h3>
        <span>${records.length} רשומות</span>
      </div>
      ${renderPlayerGpsTable(records)}
    </section>
  `;
}

function renderCoachGpsLastActivity(record, title) {
  return `
    <article class="player-last-session coach-gps-last-card">
      <div>
        <span class="eyebrow">${escapeHtml(title)}</span>
        <h3>${escapeHtml(record.sessionName || "פעילות GPS")}</h3>
        <p>${escapeHtml(formatDateDisplay(record.date))}${record.position ? ` · ${escapeHtml(record.position)}` : ""}</p>
      </div>
      <div class="player-last-session-grid">
        ${playerGpsValue("Distance", formatGpsMetricDisplay({ key: "totalDistance" }, record.totalDistance), "")}
        ${playerGpsValue("HSR", formatGpsMetricDisplay({ key: "highSpeedRunning" }, record.highSpeedRunning), "")}
        ${playerGpsValue("Sprint Distance", formatGpsMetricDisplay({ key: "sprintDistance" }, record.sprintDistance), "")}
        ${playerGpsValue("Number of Sprints", formatGpsMetricDisplay({ key: "sprintCount" }, record.sprintCount), "")}
        ${playerGpsValue("Max Speed", formatGpsMetricDisplay({ key: "maxSpeed" }, record.maxSpeed), "")}
      </div>
    </article>
  `;
}

function getCoachGpsLastActivityTitle(activity) {
  if (activity === "match") return "משחק אחרון";
  if (activity === "training") return "אימון אחרון";
  return "פעילות GPS אחרונה";
}

function renderCoachGpsMetricCards(records, seasonRecords, metrics) {
  return metrics.map((metric) => {
    const selectedValue = getPlayerGpsKpiValue(records, metric);
    const seasonAverage = average(seasonRecords.map((record) => record[metric.key]));
    const best = getCoachGpsBestRecord(seasonRecords, metric);
    const percentOfBest = selectedValue !== null && best && Number(best[metric.key]) ? Math.round((Number(selectedValue) / Number(best[metric.key])) * 100) : null;
    return `
      <article class="game-metric-card coach-gps-metric-card">
        <span>${escapeHtml(metric.label)}</span>
        <strong>${escapeHtml(formatGpsMetricDisplay(metric, selectedValue))}</strong>
        <div class="game-metric-detail">
          <small>ממוצע עונה:</small>
          <b>${escapeHtml(formatGpsMetricDisplay(metric, seasonAverage))}</b>
        </div>
        <p>${percentOfBest === null ? "אין מספיק נתונים לשיא אישי" : `${escapeHtml(formatInteger(percentOfBest))}% מהשיא האישי`}</p>
      </article>
    `;
  }).join("");
}

function renderCoachProfileGpsChart(records, metricKey) {
  const metric = getCoachGpsMetricDefinitions().find((item) => item.key === metricKey) || getCoachGpsMetricDefinitions()[0];
  return `
    <div class="player-chart-card">
      <h3>${escapeHtml(metric.label)}</h3>
      ${renderLineChart([...records].reverse(), metric.key, metric.label)}
      <p class="player-trend-text">${escapeHtml(getCoachGpsTrendInsight(records, metric))}</p>
    </div>
  `;
}

function renderCoachGpsPersonalRecords(records, metrics) {
  if (!records.length) return `<div class="surface empty">אין נתוני GPS להצגת שיאים</div>`;
  const ordered = [
    metrics.find((metric) => metric.key === "maxSpeed"),
    metrics.find((metric) => metric.key === "totalDistance"),
    metrics.find((metric) => metric.key === "highSpeedRunning"),
    metrics.find((metric) => metric.key === "sprintDistance"),
    metrics.find((metric) => metric.key === "sprintCount")
  ].filter(Boolean);
  return `
    <div class="personal-record-grid">
      ${ordered.map((metric) => {
        const best = getCoachGpsBestRecord(records, metric);
        return `
          <article class="record-card">
            <span>${escapeHtml(metric.label)}</span>
            <strong>${best ? escapeHtml(formatGpsMetricDisplay(metric, best[metric.key])) : "אין נתון"}</strong>
            <p>${best ? `${escapeHtml(formatDateDisplay(best.date))} · ${escapeHtml(best.sessionName || "GPS")}` : "אין רשומות"}</p>
          </article>
        `;
      }).join("")}
    </div>
  `;
}

function renderCoachGpsInsights(records, seasonRecords, metric) {
  const insights = getCoachGpsInsights(records, seasonRecords, metric);
  return `
    <div class="surface coach-gps-insight-list">
      ${insights.map((item) => `<p>${escapeHtml(item)}</p>`).join("")}
    </div>
  `;
}

function getCoachGpsInsights(records, seasonRecords, metric) {
  const insights = [getCoachGpsTrendInsight(records, metric)];
  const selectedHsr = getPlayerGpsKpiValue(records, { key: "highSpeedRunning" });
  const seasonHsr = average(seasonRecords.map((record) => record.highSpeedRunning));
  if (selectedHsr !== null && seasonHsr && selectedHsr > seasonHsr * 1.15) {
    insights.push("עומס HSR גבוה ביחס לממוצע העונתי.");
  }
  const selectedSprintDistance = getPlayerGpsKpiValue(records, { key: "sprintDistance" });
  const seasonSprintDistance = average(seasonRecords.map((record) => record.sprintDistance));
  if (selectedSprintDistance !== null && seasonSprintDistance && selectedSprintDistance > seasonSprintDistance * 1.15) {
    insights.push("מרחק הספרינט גבוה ביחס לממוצע העונתי.");
  }
  const selectedMaxSpeed = getPlayerGpsKpiValue(records, { key: "maxSpeed" });
  const seasonMaxSpeed = average(seasonRecords.map((record) => record.maxSpeed));
  if (selectedMaxSpeed !== null && seasonMaxSpeed && selectedMaxSpeed > seasonMaxSpeed * 1.03) {
    insights.push("המהירות המרבית מעל הממוצע העונתי של השחקן.");
  }
  return unique(insights).slice(0, 3);
}

function getCoachGpsTrendInsight(records, metric) {
  if (records.length < 4) return "אין מספיק נתונים להצגת מגמה.";
  const ordered = [...records].reverse();
  const half = Math.floor(ordered.length / 2);
  const previous = ordered.slice(0, half);
  const recent = ordered.slice(half);
  const previousValue = getPlayerGpsKpiValue(previous, metric);
  const recentValue = getPlayerGpsKpiValue(recent, metric);
  if (!previousValue || recentValue === null) return "אין מספיק נתונים להצגת מגמה.";
  const change = calculateChangePercent(recentValue, previousValue);
  if (change === null || Math.abs(change) < 5) return `${metric.coachTrendLabel} יציב בתקופה שנבחרה.`;
  if (change > 0) return `השחקן מציג עלייה ב${metric.coachTrendName} ביחס לתקופה הקודמת.`;
  return `${metric.coachTrendLabel} ירד ביחס לתקופה הקודמת.`;
}

function getCoachGpsBestRecord(records, metric) {
  return records
    .filter((record) => Number.isFinite(Number(record[metric.key])))
    .sort((a, b) => Number(b[metric.key]) - Number(a[metric.key]))[0] || null;
}

function getCoachGpsMetricDefinitions() {
  return [
    { key: "totalDistance", label: "Distance", coachTrendName: "מרחק", coachTrendLabel: "המרחק" },
    { key: "highSpeedRunning", label: "HSR", coachTrendName: "HSR", coachTrendLabel: "ה-HSR" },
    { key: "sprintDistance", label: "Sprint Distance", coachTrendName: "מרחק ספרינט", coachTrendLabel: "מרחק הספרינט" },
    { key: "sprintCount", label: "Sprints", coachTrendName: "מספר ספרינטים", coachTrendLabel: "מספר הספרינטים" },
    { key: "maxSpeed", label: "Max Speed", coachTrendName: "מהירות", coachTrendLabel: "המהירות" }
  ];
}

function getCoachGpsActivityLabel(activity) {
  if (activity === "match") return "משחקים";
  if (activity === "training") return "אימונים";
  return "כל הפעילויות";
}

function renderCoachPlayerSleepTab(context) {
  const lowSleep = context.readinessReports.filter((report) => report.sleepHours < state.settings.sleepHoursLow || report.sleepQuality <= 2);
  return `
    <div class="profile-focus-grid">
      ${profileFocusCard("שינה ממוצעת", formatNumber(context.currentSummary.avgSleep), "שעות השבוע", context.currentSummary.avgSleep && context.currentSummary.avgSleep < state.settings.sleepHoursLow ? "yellow" : "green")}
      ${profileFocusCard("איכות שינה ממוצעת", formatNumber(context.currentSummary.avgSleepQuality), "1-5", context.currentSummary.avgSleepQuality && context.currentSummary.avgSleepQuality <= 2 ? "yellow" : "green")}
      ${profileFocusCard("דוחות שינה נמוכה", lowSleep.length, "היסטוריה זמינה", lowSleep.length ? "yellow" : "green")}
    </div>
    <div class="charts-grid section">
      ${chartCard("שעות שינה", renderLineChart(context.readinessSeries, "sleepHours", "שעות שינה"))}
      ${chartCard("איכות שינה", renderLineChart(context.readinessSeries, "sleepQuality", "איכות שינה"))}
    </div>
    <div class="section">
      <div class="section-title">
        <h3>התראות שינה נמוכה</h3>
        <span>${lowSleep.length} התראות</span>
      </div>
      ${renderCoachProfileAlertList(lowSleep.map((report) => ({
        title: formatDateDisplay(report.date),
        detail: `${formatNumber(report.sleepHours)} שעות · איכות ${report.sleepQuality}/5`
      })), "אין התראות שינה נמוכה")}
    </div>
  `;
}

function renderCoachPlayerPainTab(context) {
  const painReports = [...context.postReports, ...context.readinessReports]
    .filter((report) => report.painArea && report.painArea !== NO_PAIN)
    .sort((a, b) => b.date.localeCompare(a.date));
  const repeatedPain = context.painHistory.filter((item) => item.count >= 2);
  return `
    <div class="profile-focus-grid">
      ${profileFocusCard("כאב אחרון", context.latestPain ? context.latestPain.painArea : "אין", context.latestPain ? formatDateDisplay(context.latestPain.date) : "אין דיווח", context.latestPain ? "yellow" : "green")}
      ${profileFocusCard("צד", context.latestPain && context.latestPain.painSide ? context.latestPain.painSide : "אין נתון", "אם דווח בדוח מוכנות", "neutral")}
      ${profileFocusCard("עוצמת כאב", context.latestPain && context.latestPain.painIntensity ? `${formatInteger(context.latestPain.painIntensity)}/10` : "אין נתון", "אם דווח", context.latestPain && context.latestPain.painIntensity >= 6 ? "red" : "neutral")}
      ${profileFocusCard("כאבים חוזרים", repeatedPain.length, "אזורים עם 2+ דיווחים", repeatedPain.length ? "yellow" : "green")}
    </div>
    <div class="split section">
      <div>
        <div class="section-title">
          <h3>היסטוריית כאב</h3>
          <span>${context.painHistory.length} אזורים</span>
        </div>
        <div class="surface">${renderPainHistory(context.painHistory)}</div>
      </div>
      <div>
        <div class="section-title">
          <h3>כאבים חוזרים</h3>
          <span>${repeatedPain.length} התראות</span>
        </div>
        ${renderCoachProfileAlertList(repeatedPain.map((item) => ({
          title: item.area,
          detail: `${item.count} דיווחים בהיסטוריה`
        })), "אין כאבים חוזרים")}
      </div>
    </div>
    <div class="section">
      <div class="section-title">
        <h3>דיווחי כאב לפי תאריך</h3>
        <span>${painReports.length} דיווחים</span>
      </div>
      ${renderCoachPainReportsTable(painReports)}
    </div>
  `;
}

function renderCoachPlayerHydrationTab(context) {
  const latest = context.lastPost && context.lastPost.hydration ? context.lastPost.hydration : null;
  const hydrationAlerts = context.postReports.filter((report) => report.hydration && report.hydration.tone !== "green");
  return `
    <div class="profile-focus-grid">
      ${profileFocusCard("משקל לפני", latest ? `${formatNumber(latest.preTrainingWeight)} ק״ג` : "אין נתון", "דוח אחרון", "neutral")}
      ${profileFocusCard("משקל אחרי", latest ? `${formatNumber(latest.postTrainingWeight)} ק״ג` : "אין נתון", "דוח אחרון", "neutral")}
      ${profileFocusCard("איבוד נוזלים", latest ? `${formatNumber(latest.lossPercent)}%` : "אין נתון", latest ? `${formatNumber(latest.lossKg)} ק״ג` : "", latest ? latest.tone : "neutral")}
      ${profileFocusCard("סטטוס הידרציה", latest ? latest.status : "אין נתון", "דוח אחרון", latest ? latest.tone : "neutral")}
    </div>
    <div class="charts-grid section">
      ${chartCard("מגמת הידרציה", renderLineChart(context.hydrationSeries, "hydrationLossPercent", "אובדן נוזלים %"))}
    </div>
    <div class="section">
      <div class="section-title">
        <h3>התראות הידרציה</h3>
        <span>${hydrationAlerts.length} התראות</span>
      </div>
      ${renderCoachProfileAlertList(hydrationAlerts.map((report) => ({
        title: formatDateDisplay(report.date),
        detail: `${report.hydration.status} · ${formatNumber(report.hydration.lossPercent)}% · ${formatNumber(report.hydration.lossKg)} ק״ג`
      })), "אין התראות הידרציה")}
    </div>
    <div class="section">
      <div class="section-title">
        <h3>היסטוריית הידרציה</h3>
        <span>${context.hydrationSeries.length} רשומות</span>
      </div>
      ${renderHydrationHistory(context.hydrationSeries)}
    </div>
  `;
}

function renderCoachPlayerNotesTab(context) {
  return `
    <div class="section">
      <div class="section-title">
        <h3>הערות שחקן מהדוחות</h3>
        <span>${context.comments.length} הערות</span>
      </div>
      ${renderCommentsList(context.comments)}
    </div>
  `;
}

function bindCoachPlayerProfile(context) {
  if (context.activeTab !== "gps") return;
  const dynamic = document.getElementById("coachProfileGpsDynamic");
  const periodRow = document.getElementById("coachProfileGpsPeriods");
  if (!dynamic) return;
  const gpsState = {
    activity: "all",
    period: "latest",
    metric: "totalDistance"
  };
  const rerender = () => {
    dynamic.innerHTML = renderCoachProfileGpsDynamic(context, gpsState.activity, gpsState.period, gpsState.metric);
  };
  const bindPeriodButtons = () => {
    document.querySelectorAll("[data-coach-profile-gps-period]").forEach((button) => {
      button.addEventListener("click", () => {
        gpsState.period = button.getAttribute("data-coach-profile-gps-period") || "latest";
        document.querySelectorAll("[data-coach-profile-gps-period]").forEach((item) => item.classList.toggle("is-active", item === button));
        rerender();
      });
    });
  };
  document.querySelectorAll("[data-coach-profile-gps-activity]").forEach((button) => {
    button.addEventListener("click", () => {
      gpsState.activity = button.getAttribute("data-coach-profile-gps-activity") || "all";
      const firstPeriod = getPlayerGpsPeriodOptions(gpsState.activity)[0];
      gpsState.period = firstPeriod ? firstPeriod.value : "latest";
      document.querySelectorAll("[data-coach-profile-gps-activity]").forEach((item) => item.classList.toggle("is-active", item === button));
      if (periodRow) {
        periodRow.innerHTML = renderCoachGpsPeriodButtons(gpsState.activity);
        bindPeriodButtons();
      }
      rerender();
    });
  });
  document.querySelectorAll("[data-coach-profile-gps-metric]").forEach((button) => {
    button.addEventListener("click", () => {
      gpsState.metric = button.getAttribute("data-coach-profile-gps-metric") || "totalDistance";
      document.querySelectorAll("[data-coach-profile-gps-metric]").forEach((item) => item.classList.toggle("is-active", item === button));
      rerender();
    });
  });
  bindPeriodButtons();
}

function getCoachPlayerProfileStatus(context) {
  const reasons = [];
  let severity = 0;
  if (!context.lastReadiness) {
    severity = Math.max(severity, 1);
    reasons.push("אין דוח מוכנות אחרון");
  } else if (context.lastReadiness.readinessScore < 60) {
    severity = 2;
    reasons.push(`מוכנות נמוכה ${context.lastReadiness.readinessScore}`);
  } else if (context.lastReadiness.readinessScore < 80) {
    severity = Math.max(severity, 1);
    reasons.push(`מוכנות למעקב ${context.lastReadiness.readinessScore}`);
  }
  if (context.lastPost && context.lastPost.rpe >= 9) {
    severity = 2;
    reasons.push(`RPE ${context.lastPost.rpe}`);
  } else if (context.lastPost && context.lastPost.rpe >= state.settings.rpeHigh) {
    severity = Math.max(severity, 1);
    reasons.push(`RPE ${context.lastPost.rpe}`);
  }
  if (context.latestPain) {
    severity = Math.max(severity, context.latestPain.painIntensity >= 8 ? 2 : 1);
    reasons.push(`כאב ב${context.latestPain.painArea}`);
  }
  if (context.lastPost && context.lastPost.hydration && context.lastPost.hydration.tone === "red") {
    severity = 2;
    reasons.push(context.lastPost.hydration.status);
  } else if (context.lastPost && context.lastPost.hydration && context.lastPost.hydration.tone === "yellow") {
    severity = Math.max(severity, 1);
    reasons.push(context.lastPost.hydration.status);
  }
  const weeklyRisk = getWeeklyLoadRisk(context.loadChange);
  if (weeklyRisk.tone === "red") {
    severity = 2;
    reasons.push(weeklyRisk.label);
  } else if (weeklyRisk.tone === "yellow") {
    severity = Math.max(severity, 1);
    reasons.push(weeklyRisk.label);
  }
  if (context.latestGps && context.latestGps.riskFlags.length) {
    severity = 2;
    reasons.push(context.latestGps.riskFlags[0]);
  }
  if (severity >= 2) return { label: "🔴 בדיקה", tone: "red", mainReason: unique(reasons)[0] || "דורש בדיקה", reasons: unique(reasons) };
  if (severity === 1) return { label: "🟡 מעקב", tone: "yellow", mainReason: unique(reasons)[0] || "דורש מעקב", reasons: unique(reasons) };
  return { label: "🟢 תקין", tone: "green", mainReason: "אין חריגים מרכזיים בדוחות האחרונים", reasons: [] };
}

function getCoachPlayerLatestDate(context) {
  return [context.lastReadiness && context.lastReadiness.date, context.lastPost && context.lastPost.date, context.latestGps && context.latestGps.date]
    .filter(Boolean)
    .sort((a, b) => b.localeCompare(a))[0] || "";
}

function profileFocusCard(label, value, note, tone = "neutral") {
  return `
    <article class="profile-focus-card ${escapeAttr(tone)}">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
      ${note ? `<small>${escapeHtml(note)}</small>` : ""}
    </article>
  `;
}

function renderCoachProfileAlertList(items, emptyText) {
  if (!items.length) return `<div class="surface empty">${escapeHtml(emptyText)}</div>`;
  return `
    <div class="surface mini-list">
      ${items.map((item) => `
        <div class="mini-row">
          <span>${escapeHtml(item.title)}</span>
          <strong>${escapeHtml(item.detail)}</strong>
        </div>
      `).join("")}
    </div>
  `;
}

function renderCoachPainReportsTable(reports) {
  if (!reports.length) return `<div class="surface empty">אין דיווחי כאב</div>`;
  return `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>תאריך</th>
            <th>סוג דוח</th>
            <th>אזור כאב</th>
            <th>צד</th>
            <th>עוצמה</th>
            <th>הערה</th>
          </tr>
        </thead>
        <tbody>
          ${reports.map((report) => `
            <tr>
              <td>${escapeHtml(formatDateDisplay(report.date))}</td>
              <td>${report.rpe !== undefined ? "דוח RPE" : "דוח מוכנות"}</td>
              <td>${escapeHtml(report.detailedPainArea || report.painArea)}</td>
              <td>${escapeHtml(report.painSide || "אין נתון")}</td>
              <td>${escapeHtml(report.painIntensity ? `${formatInteger(report.painIntensity)}/10` : "אין נתון")}</td>
              <td>${escapeHtml(report.comments || "אין")}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
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

function renderCalendarPage() {
  const calendar = uiState.calendar;
  const activePlayers = getActivePlayers();
  const range = calendar.view === "week" ? getWeekRange(calendar.anchorDate) : getCalendarMonthGridRange(calendar.anchorDate);
  const days = getDateRangeList(range.start, range.end).map((date) => buildCalendarDaySummary(date, activePlayers));
  const selectedDate = calendar.selectedDate || todayIso();
  const selectedDay = buildCalendarDaySummary(selectedDate, activePlayers);
  const html = coachShell("calendar", `
    <div class="page-header premium-header">
      <div>
        <span class="eyebrow">מרכז צוות מקצועי</span>
        <h2>לוח שנה</h2>
        <p>תצוגת פעילות, GPS, דוחות יומיים והתראות לפי יום</p>
      </div>
      <div class="header-actions">
        <button class="btn secondary" type="button" data-calendar-shift="-1">הקודם</button>
        <button class="btn primary" type="button" data-calendar-today>היום</button>
        <button class="btn secondary" type="button" data-calendar-shift="1">הבא</button>
      </div>
    </div>

    <section class="surface calendar-toolbar">
      <div>
        <span class="eyebrow">${calendar.view === "week" ? "שבוע" : "חודש"}</span>
        <h3>${escapeHtml(getCalendarTitle(calendar.anchorDate, calendar.view))}</h3>
      </div>
      <div class="calendar-control-stack">
        <div class="calendar-segment" aria-label="בחירת תצוגה">
          <button type="button" class="${calendar.view === "month" ? "active" : ""}" data-calendar-view="month">חודשי</button>
          <button type="button" class="${calendar.view === "week" ? "active" : ""}" data-calendar-view="week">שבועי</button>
        </div>
        <div class="calendar-filter-row" aria-label="סינון לוח שנה">
          ${getCalendarFilters().map((item) => `<button type="button" class="${calendar.filter === item.id ? "active" : ""}" data-calendar-filter="${escapeAttr(item.id)}">${escapeHtml(item.label)}</button>`).join("")}
        </div>
      </div>
    </section>

    <section class="calendar-layout">
      <div class="surface calendar-board">
        <div class="calendar-weekdays">
          ${["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ש׳"].map((day) => `<span>${day}</span>`).join("")}
        </div>
        <div class="calendar-grid ${calendar.view === "week" ? "week-view" : ""}">
          ${days.map((day) => renderCalendarDayCell(day, calendar)).join("")}
        </div>
      </div>
      ${renderCalendarDayPanel(selectedDay)}
    </section>
  `);

  mount(html, bindCalendarPage);
}

function bindCalendarPage() {
  document.querySelectorAll("[data-calendar-view]").forEach((button) => {
    button.addEventListener("click", () => {
      uiState.calendar.view = button.getAttribute("data-calendar-view") || "month";
      uiState.calendar.popoverDate = "";
      renderCalendarPage();
    });
  });
  document.querySelectorAll("[data-calendar-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      uiState.calendar.filter = button.getAttribute("data-calendar-filter") || "all";
      uiState.calendar.popoverDate = "";
      renderCalendarPage();
    });
  });
  document.querySelectorAll("[data-calendar-day]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      const date = button.getAttribute("data-calendar-day") || todayIso();
      uiState.calendar.selectedDate = date;
      uiState.calendar.popoverDate = isCalendarMobilePopoverMode() ? date : "";
      renderCalendarPage();
    });
  });
  document.querySelectorAll("[data-calendar-shift]").forEach((button) => {
    button.addEventListener("click", () => {
      const direction = Number(button.getAttribute("data-calendar-shift")) || 0;
      uiState.calendar.anchorDate = shiftCalendarAnchor(uiState.calendar.anchorDate, uiState.calendar.view, direction);
      uiState.calendar.selectedDate = uiState.calendar.anchorDate;
      uiState.calendar.popoverDate = "";
      renderCalendarPage();
    });
  });
  const todayButton = document.querySelector("[data-calendar-today]");
  if (todayButton) {
    todayButton.addEventListener("click", () => {
      uiState.calendar.anchorDate = todayIso();
      uiState.calendar.selectedDate = todayIso();
      uiState.calendar.popoverDate = "";
      renderCalendarPage();
    });
  }
  if (uiState.calendar.popoverDate && isCalendarMobilePopoverMode()) {
    window.setTimeout(() => {
      document.addEventListener("click", closeCalendarMobilePopoverOnOutsideTap, { once: true });
    }, 0);
  }
  document.querySelectorAll("[data-calendar-plan-form]").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const data = new FormData(form);
      const date = form.getAttribute("data-calendar-plan-form") || uiState.calendar.selectedDate || todayIso();
      saveCalendarLoadPlan(date, data.get("plannedGpsLoad"), data.get("plannedRpeLoad"));
      renderCalendarPage();
    });
  });
}

function isCalendarMobilePopoverMode() {
  return window.matchMedia("(max-width: 680px), (hover: none)").matches;
}

function closeCalendarMobilePopoverOnOutsideTap(event) {
  if (!uiState.calendar.popoverDate) return;
  if (event.target && event.target.closest && event.target.closest(".calendar-day.popover-open")) {
    document.addEventListener("click", closeCalendarMobilePopoverOnOutsideTap, { once: true });
    return;
  }
  uiState.calendar.popoverDate = "";
  renderCalendarPage();
}

function getCalendarFilters() {
  return [
    { id: "all", label: "הכל" },
    { id: "training", label: "אימונים" },
    { id: "matches", label: "משחקים" },
    { id: "gps", label: "GPS" },
    { id: "reports", label: "דוחות" },
    { id: "alerts", label: "התראות" }
  ];
}

function buildCalendarDaySummary(date, activePlayers) {
  const gpsSessions = state.gpsSessions.filter((sessionItem) => sessionItem.date === date);
  const gpsRecords = state.gpsRecords.map(getComputedGpsRecord).filter((record) => record.date === date);
  const readinessReports = state.readinessReports.filter((report) => report.date === date).map(getComputedReadiness);
  const rpeReports = state.reports.filter((report) => report.date === date).map(getComputedReport);
  const readinessIds = new Set(readinessReports.map((report) => report.playerId));
  const rpeIds = new Set(rpeReports.map((report) => report.playerId));
  const shouldTrackMissing = date <= todayIso() && (gpsSessions.length || readinessReports.length || rpeReports.length || date === todayIso());
  const missingReadiness = shouldTrackMissing ? activePlayers.filter((player) => !readinessIds.has(player.id)) : [];
  const missingRpe = shouldTrackMissing ? activePlayers.filter((player) => !rpeIds.has(player.id)) : [];
  const readinessAlerts = readinessReports.flatMap((report) => report.riskFlags.map((reason) => ({ type: "מוכנות", playerName: report.playerName, reason })));
  const rpeAlerts = rpeReports.flatMap((report) => report.riskFlags.map((reason) => ({ type: "RPE", playerName: report.playerName, reason })));
  const gpsAlerts = gpsRecords.flatMap((record) => record.riskFlags.map((reason) => ({ type: "GPS", playerName: record.playerName, reason })));
  const missingAlerts = [
    ...missingReadiness.map((player) => ({ type: "דוח חסר", playerName: player.name, reason: "חסר דוח מוכנות" })),
    ...missingRpe.map((player) => ({ type: "דוח חסר", playerName: player.name, reason: "חסר דוח RPE" }))
  ];
  const loadSummary = buildCalendarLoadSummary(date, gpsRecords, rpeReports);
  return {
    date,
    gpsSessions,
    gpsRecords,
    readinessReports,
    rpeReports,
    missingReadiness,
    missingRpe,
    alerts: [...readinessAlerts, ...rpeAlerts, ...gpsAlerts, ...missingAlerts],
    gpsAvailable: gpsRecords.length > 0,
    activePlayersCount: activePlayers.length,
    loadSummary
  };
}

function buildCalendarLoadSummary(date, gpsRecords, rpeReports) {
  const plan = (state.calendarLoadPlans && state.calendarLoadPlans[date]) || {};
  const preferredGps = getFullPeriodPreferred(gpsRecords);
  const gpsAverage = preferredGps.length ? average(preferredGps.map((record) => record.gpsLoad)) : 0;
  const rpeAverage = rpeReports.length ? average(rpeReports.map((report) => report.trainingLoad)) : 0;
  const gpsScore = preferredGps.length ? loadValueToScore(gpsAverage) : normalizeLoadPlanValue(plan.gpsLoad);
  const rpeScore = rpeReports.length ? loadValueToScore(rpeAverage) : normalizeLoadPlanValue(plan.rpeLoad);
  return {
    gpsScore,
    rpeScore,
    gpsValue: preferredGps.length ? gpsAverage : null,
    rpeValue: rpeReports.length ? rpeAverage : null,
    gpsSource: preferredGps.length ? `${preferredGps.length} רשומות GPS` : plan.gpsLoad ? "עומס GPS מתוכנן" : "אין נתון GPS",
    rpeSource: rpeReports.length ? `${rpeReports.length} דוחות RPE` : plan.rpeLoad ? "עומס RPE מתוכנן" : "אין נתון RPE",
    isGpsPlanned: !preferredGps.length && Boolean(plan.gpsLoad),
    isRpePlanned: !rpeReports.length && Boolean(plan.rpeLoad)
  };
}

function loadValueToScore(value) {
  const number = Number(value) || 0;
  if (number <= 200) return 1;
  if (number <= 400) return 2;
  if (number <= 600) return 3;
  if (number <= 800) return 4;
  return 5;
}

function calendarLoadScoreLabel(score) {
  return ["אין נתון", "קל מאוד", "קל", "בינוני", "גבוה", "גבוה מאוד"][Number(score) || 0] || "אין נתון";
}

function renderCalendarDayCell(day, calendar) {
  const inCurrentMonth = day.date.slice(0, 7) === calendar.anchorDate.slice(0, 7) || calendar.view === "week";
  const isSelected = day.date === calendar.selectedDate;
  const isToday = day.date === todayIso();
  const isPopoverOpen = day.date === calendar.popoverDate;
  const chips = getCalendarDayChips(day, calendar.filter);
  return `
    <button type="button" class="calendar-day ${inCurrentMonth ? "" : "muted"} ${isSelected ? "selected" : ""} ${isToday ? "today" : ""} ${isPopoverOpen ? "popover-open" : ""}" data-calendar-day="${escapeAttr(day.date)}">
      <div class="calendar-day-topline">
        <span class="calendar-day-number">${parseIsoDate(day.date).getDate()}</span>
        ${renderCalendarDaySignals(day, chips)}
      </div>
      ${renderCalendarMiniLoadChart(day.loadSummary)}
      ${renderCalendarDayPopover(day, chips)}
    </button>
  `;
}

function renderCalendarDaySignals(day, chips) {
  const activityType = day.gpsSessions[0] ? day.gpsSessions[0].activityType || day.gpsSessions[0].type : "";
  const activityTone = activityType === "training" ? "training" : activityType === "training_match" ? "friendly" : "match";
  const showActivity = chips.some((chip) => chip.group === "training" || chip.group === "matches");
  const showGps = chips.some((chip) => chip.group === "gps");
  const showMissing = chips.some((chip) => chip.tone === "missing");
  const showAlerts = chips.some((chip) => chip.group === "alerts");
  return `
    <span class="calendar-day-signals" aria-label="סימוני יום">
      ${showActivity ? `<i class="${escapeAttr(activityTone)}" aria-label="פעילות"></i>` : ""}
      ${showGps ? `<i class="gps" aria-label="GPS"></i>` : ""}
      ${showMissing ? `<i class="missing" aria-label="דוחות חסרים"></i>` : ""}
      ${showAlerts ? `<i class="alerts" aria-label="התראות"></i>` : ""}
    </span>
  `;
}

function renderCalendarDayPopover(day, chips) {
  const missingCount = day.missingReadiness.length + day.missingRpe.length;
  const attentionNames = getCalendarAttentionPlayerNames(day);
  const events = day.gpsSessions.length
    ? day.gpsSessions.slice(0, 3).map((sessionItem) => `${formatGpsSessionType(sessionItem.activityType || sessionItem.type)} · ${sessionItem.sessionName}`).join(" | ")
    : "אין פעילות";
  const missingText = missingCount
    ? `${missingCount} חסרים · ${[...day.missingReadiness, ...day.missingRpe].slice(0, 4).map((player) => player.name).join(", ")}`
    : "אין דוחות חסרים";
  const alertText = day.alerts.length
    ? day.alerts.slice(0, 4).map((alert) => `${alert.playerName}: ${alert.reason}`).join(" | ")
    : "אין התראות";
  return `
    <div class="calendar-day-popover" role="tooltip">
      <strong>${escapeHtml(formatDateDisplay(day.date))}</strong>
      <p><b>אירועים:</b> ${escapeHtml(events)}</p>
      <p><b>GPS Load:</b> ${day.loadSummary.gpsScore ? `${day.loadSummary.gpsScore}/5 · ${calendarLoadScoreLabel(day.loadSummary.gpsScore)}` : "אין נתון"}</p>
      <p><b>RPE Load:</b> ${day.loadSummary.rpeScore ? `${day.loadSummary.rpeScore}/5 · ${calendarLoadScoreLabel(day.loadSummary.rpeScore)}` : "אין נתון"}</p>
      <p><b>דוחות מוכנות:</b> ${day.readinessReports.length}/${day.activePlayersCount}</p>
      <p><b>דוחות RPE:</b> ${day.rpeReports.length}/${day.activePlayersCount}</p>
      <p><b>חסרים:</b> ${escapeHtml(missingText)}</p>
      <p><b>התראות:</b> ${escapeHtml(alertText)}</p>
      <p><b>דורשים תשומת לב:</b> ${attentionNames.length ? escapeHtml(attentionNames.slice(0, 6).join(", ")) : "אין"}</p>
    </div>
  `;
}

function renderCalendarMiniLoadChart(loadSummary) {
  return `
    <div class="calendar-mini-load" aria-label="השוואת עומס GPS מול RPE">
      ${renderCalendarMiniLoadBar("GPS", loadSummary.gpsScore, "gps")}
      ${renderCalendarMiniLoadBar("RPE", loadSummary.rpeScore, "rpe")}
    </div>
  `;
}

function renderCalendarMiniLoadBar(label, score, type) {
  const value = Number(score) || 0;
  return `
    <div class="calendar-mini-load-item ${escapeAttr(type)} ${value ? "" : "empty"}" aria-label="${escapeAttr(`${label}: ${value || "אין נתון"}`)}">
      <span class="calendar-mini-load-value">${value || "—"}</span>
      <i style="--load-score:${value};"></i>
      <b>${escapeHtml(label)}</b>
    </div>
  `;
}

function getCalendarDayChips(day, filter) {
  const activityChips = day.gpsSessions.map((sessionItem) => {
    const activityType = sessionItem.activityType || sessionItem.type;
    const tone = activityType === "training" ? "training" : activityType === "training_match" ? "friendly" : "match";
    return { tone, label: formatGpsSessionType(activityType), group: activityType === "training" ? "training" : "matches" };
  });
  const reportChips = [];
  if (day.readinessReports.length) reportChips.push({ tone: "reports", label: `מוכנות ${day.readinessReports.length}/${day.activePlayersCount}`, group: "reports" });
  if (day.rpeReports.length) reportChips.push({ tone: "reports", label: `RPE ${day.rpeReports.length}/${day.activePlayersCount}`, group: "reports" });
  if (day.gpsAvailable) reportChips.push({ tone: "gps", label: "GPS זמין", group: "gps" });
  if (day.missingReadiness.length || day.missingRpe.length) reportChips.push({ tone: "missing", label: `${day.missingReadiness.length + day.missingRpe.length} חסרים`, group: "reports" });
  if (day.alerts.length) reportChips.push({ tone: "alerts", label: `${day.alerts.length} התראות`, group: "alerts" });
  const chips = [...activityChips, ...reportChips];
  if (filter === "all") return chips;
  if (filter === "training") return chips.filter((chip) => chip.group === "training");
  if (filter === "matches") return chips.filter((chip) => chip.group === "matches");
  if (filter === "gps") return chips.filter((chip) => chip.group === "gps");
  if (filter === "reports") return chips.filter((chip) => chip.group === "reports");
  if (filter === "alerts") return chips.filter((chip) => chip.group === "alerts");
  return chips;
}

function renderCalendarChip(chip) {
  return `<span class="calendar-chip ${escapeAttr(chip.tone)}">${escapeHtml(chip.label)}</span>`;
}

function renderCalendarDayPanel(day) {
  return `
    <aside class="surface calendar-day-panel">
      <div class="section-title">
        <h3>${escapeHtml(formatDateDisplay(day.date))}</h3>
        <span>${day.alerts.length ? `${day.alerts.length} התראות` : "ללא התראות"}</span>
      </div>
      <div class="calendar-panel-grid">
        ${calendarPanelMetric("פעילויות", day.gpsSessions.length)}
        ${calendarPanelMetric("GPS", day.gpsAvailable ? "זמין" : "אין")}
        ${calendarPanelMetric("מוכנות", `${day.readinessReports.length}/${day.activePlayersCount}`)}
        ${calendarPanelMetric("RPE", `${day.rpeReports.length}/${day.activePlayersCount}`)}
        ${calendarPanelMetric("עומס GPS", day.loadSummary.gpsScore ? `${day.loadSummary.gpsScore}/5` : "אין")}
        ${calendarPanelMetric("עומס RPE", day.loadSummary.rpeScore ? `${day.loadSummary.rpeScore}/5` : "אין")}
      </div>
      <div class="calendar-panel-section">
        <h4>עומס יומי</h4>
        <div class="calendar-panel-load-card">
          ${renderCalendarPanelLoadRow("GPS Load", day.loadSummary.gpsScore, day.loadSummary.gpsSource, day.loadSummary.gpsValue)}
          ${renderCalendarPanelLoadRow("RPE Load", day.loadSummary.rpeScore, day.loadSummary.rpeSource, day.loadSummary.rpeValue)}
        </div>
        ${renderCalendarLoadPlanForm(day)}
      </div>
      <div class="calendar-panel-section">
        <h4>פעילות</h4>
        ${day.gpsSessions.length ? day.gpsSessions.map(renderCalendarSessionRow).join("") : `<p class="muted-text">אין פעילות GPS ליום זה</p>`}
      </div>
      <div class="calendar-panel-section">
        <h4>דוחות חסרים</h4>
        ${day.missingReadiness.length || day.missingRpe.length ? `
          ${day.missingReadiness.map((player) => `<p><b>${escapeHtml(player.name)}</b> · חסר דוח מוכנות</p>`).join("")}
          ${day.missingRpe.map((player) => `<p><b>${escapeHtml(player.name)}</b> · חסר דוח RPE</p>`).join("")}
        ` : `<p class="muted-text">אין דוחות חסרים</p>`}
      </div>
      <div class="calendar-panel-section">
        <h4>התראות</h4>
        ${day.alerts.length ? day.alerts.slice(0, 12).map((alert) => `<p><b>${escapeHtml(alert.playerName)}</b> · ${escapeHtml(alert.type)} · ${escapeHtml(alert.reason)}</p>`).join("") : `<p class="muted-text">אין התראות ליום זה</p>`}
      </div>
      <div class="calendar-panel-section">
        <h4>שחקנים הדורשים תשומת לב</h4>
        ${renderCalendarAttentionPlayers(day)}
      </div>
    </aside>
  `;
}

function renderCalendarPanelLoadRow(label, score, source, value) {
  return `
    <div class="calendar-panel-load-row">
      <span>${escapeHtml(label)}</span>
      <strong>${score ? `${score}/5 · ${calendarLoadScoreLabel(score)}` : "אין נתון"}</strong>
      <small>${escapeHtml(source)}${value !== null && value !== undefined ? ` · ערך: ${escapeHtml(formatInteger(value))}` : ""}</small>
    </div>
  `;
}

function renderCalendarLoadPlanForm(day) {
  if (day.date <= todayIso()) return "";
  const plan = (state.calendarLoadPlans && state.calendarLoadPlans[day.date]) || {};
  return `
    <form class="calendar-load-plan-form" data-calendar-plan-form="${escapeAttr(day.date)}">
      <strong>תכנון עומס עתידי</strong>
      <label>
        <span>GPS מתוכנן</span>
        ${calendarLoadSelect("plannedGpsLoad", plan.gpsLoad)}
      </label>
      <label>
        <span>RPE מתוכנן</span>
        ${calendarLoadSelect("plannedRpeLoad", plan.rpeLoad)}
      </label>
      <button type="submit" class="btn secondary">שמירת תכנון</button>
    </form>
  `;
}

function calendarLoadSelect(name, selected) {
  const options = ["", 1, 2, 3, 4, 5].map((value) => {
    const label = value === "" ? "אין נתון" : `${value} - ${calendarLoadScoreLabel(value)}`;
    return `<option value="${escapeAttr(value)}" ${String(selected || "") === String(value) ? "selected" : ""}>${escapeHtml(label)}</option>`;
  }).join("");
  return `<select name="${escapeAttr(name)}">${options}</select>`;
}

function renderCalendarAttentionPlayers(day) {
  const names = getCalendarAttentionPlayerNames(day);
  if (!names.length) return `<p class="muted-text">אין שחקנים הדורשים תשומת לב מעבר לדוחות חסרים</p>`;
  return names.slice(0, 8).map((name) => `<p><b>${escapeHtml(name)}</b> · דורש מעקב לפי התראות היום</p>`).join("");
}

function getCalendarAttentionPlayerNames(day) {
  return unique(day.alerts
    .filter((alert) => !String(alert.type || "").includes("חסר") && !String(alert.reason || "").includes("חסר"))
    .map((alert) => alert.playerName)
    .filter(Boolean));
}

function calendarPanelMetric(label, value) {
  return `
    <div>
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
    </div>
  `;
}

function renderCalendarSessionRow(sessionItem) {
  const type = sessionItem.activityType || sessionItem.type;
  const tone = type === "training" ? "training" : type === "training_match" ? "friendly" : "match";
  const recordsCount = state.gpsRecords.filter((record) => record.gpsSessionId === sessionItem.id).length;
  return `
    <article class="calendar-session-row ${tone}">
      <div>
        <strong>${escapeHtml(sessionItem.sessionName)}</strong>
        <span>${escapeHtml(formatGpsSessionType(type))}${sessionItem.opponent ? ` · ${escapeHtml(sessionItem.opponent)}` : ""}</span>
      </div>
      <span>${recordsCount ? `${recordsCount} רשומות GPS` : "אין GPS"}</span>
    </article>
  `;
}

function getCalendarTitle(anchorDate, view) {
  if (view === "week") {
    const range = getWeekRange(anchorDate);
    return `${formatShortDate(range.start)} - ${formatShortDate(range.end)}`;
  }
  return parseIsoDate(anchorDate).toLocaleDateString("he-IL", { month: "long", year: "numeric" });
}

function shiftCalendarAnchor(anchorDate, view, direction) {
  if (view === "week") return addDays(anchorDate, direction * 7);
  const date = parseIsoDate(anchorDate);
  date.setMonth(date.getMonth() + direction);
  return todayIso(date);
}

function getCalendarMonthGridRange(anchorDate) {
  const date = parseIsoDate(anchorDate);
  const first = new Date(date.getFullYear(), date.getMonth(), 1, 12);
  const last = new Date(date.getFullYear(), date.getMonth() + 1, 0, 12);
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay());
  const end = new Date(last);
  end.setDate(last.getDate() + (6 - last.getDay()));
  return { start: todayIso(start), end: todayIso(end) };
}

function getDateRangeList(start, end) {
  const dates = [];
  let current = start;
  while (current <= end) {
    dates.push(current);
    current = addDays(current, 1);
  }
  return dates;
}

function renderGpsPage() {
  const filters = uiState.gpsFilters;
  initializeGpsSessionFilter(filters);
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
      ${canWriteOperationalData() ? `<button class="btn primary" id="openGpsImport" type="button">ייבוא דוח GPS</button>` : `<span class="badge neutral">צפייה בלבד</span>`}
    </div>

    ${uiState.gpsImportModalOpen ? renderGpsImportModal() : ""}

    <section class="section surface">
      <div class="filters gps-filters">
        ${filterSelect("gpsDateFilter", "תאריך", ["הכול", ...dates.map(formatDateDisplay)], filters.date, ["all", ...dates])}
        ${filterSelect("gpsSessionFilter", "מפגש", ["הכול", ...state.gpsSessions.map((sessionItem) => sessionItem.sessionName)], filters.sessionId, ["all", ...state.gpsSessions.map((sessionItem) => sessionItem.id)])}
        ${filterSelect("gpsPlayerFilter", "שחקן", playerFilterOptions(), filters.playerId, playerFilterValues())}
        ${filterSelect("gpsPositionFilter", "עמדה", ["הכול", ...positions], filters.position, ["all", ...positions])}
        ${filterSelect("gpsPeriodFilter", "תקופה", ["הכול", ...GPS_PERIODS], filters.period, ["all", ...GPS_PERIODS])}
      </div>
    </section>

    ${renderGpsSessionReviewDashboard(records, selectedSession, filters)}
  `);

  mount(html, bindGpsPage);
}

function initializeGpsSessionFilter(filters) {
  if (filters.initializedSession) return;
  filters.initializedSession = true;
  const sessionIds = new Set(state.gpsRecords.map((record) => record.gpsSessionId));
  const latestCompleted = state.gpsSessions
    .filter((sessionItem) => sessionItem.date <= todayIso() && sessionIds.has(sessionItem.id))
    .sort((a, b) => b.date.localeCompare(a.date))[0];
  if (latestCompleted) filters.sessionId = latestCompleted.id;
}

function bindGpsPage() {
  const openImportButton = document.getElementById("openGpsImport");
  if (openImportButton) openImportButton.addEventListener("click", () => {
    uiState.gpsImportModalOpen = true;
    uiState.gpsImport = null;
    uiState.gpsSessionSetup = createDefaultGpsSessionSetup();
    renderGpsPage();
  });
  document.querySelectorAll("[data-close-gps-import]").forEach((button) => {
    button.addEventListener("click", () => closeGpsImportModal());
  });
  const modalBackdrop = document.querySelector(".gps-import-modal-backdrop");
  if (modalBackdrop) {
    modalBackdrop.addEventListener("click", (event) => {
      if (event.target === modalBackdrop) closeGpsImportModal();
    });
  }
  const clearButton = document.getElementById("clearGpsImport");
  if (clearButton) clearButton.addEventListener("click", () => {
    uiState.gpsImport = null;
    uiState.gpsSessionSetup = createDefaultGpsSessionSetup();
    renderGpsPage();
  });
  const fileInput = document.getElementById("gpsFileInput");
  if (fileInput) {
    fileInput.addEventListener("change", async () => {
      const file = fileInput.files && fileInput.files[0];
      if (!file) return;
      try {
        syncGpsSessionSetupFromDom(uiState.gpsSessionSetup);
        const parsed = await parseGpsFile(file);
        uiState.gpsImport = {
          fileName: file.name,
          headers: parsed.headers,
          rows: parsed.rows,
          mapping: createAutoGpsMapping(parsed.headers),
          playerMatches: {},
          ...normalizeGpsSessionSetup(uiState.gpsSessionSetup)
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
  document.querySelectorAll("[data-gps-setup]").forEach((input) => {
    const eventName = input.tagName === "SELECT" ? "change" : "input";
    input.addEventListener(eventName, () => {
      const target = uiState.gpsImport || uiState.gpsSessionSetup;
      const key = input.getAttribute("data-gps-setup");
      if (!key) return;
      target[key] = input.value;
      if (key === "activityType") renderGpsPage();
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
  document.querySelectorAll("[data-gps-review-metric]").forEach((button) => {
    button.addEventListener("click", () => {
      uiState.gpsFilters.metric = button.getAttribute("data-gps-review-metric") || "totalDistance";
      renderGpsPage();
    });
  });
}

function closeGpsImportModal() {
  uiState.gpsImportModalOpen = false;
  uiState.gpsImport = null;
  uiState.gpsSessionSetup = createDefaultGpsSessionSetup();
  renderGpsPage();
}

function renderGpsImportModal() {
  return `
    <div class="modal-backdrop gps-import-modal-backdrop" role="presentation">
      <section class="modal-panel gps-import-modal" role="dialog" aria-modal="true" aria-labelledby="gpsImportModalTitle">
        <header class="modal-header">
          <div>
            <span class="eyebrow">GPS</span>
            <h3 id="gpsImportModalTitle">ייבוא דוח GPS</h3>
            <p>הגדרת סשן, העלאת קובץ ומיפוי עמודות</p>
          </div>
          <button class="icon-button" type="button" data-close-gps-import aria-label="סגור">×</button>
        </header>
        <div class="modal-body">
          ${renderGpsImportPanel()}
        </div>
      </section>
    </div>
  `;
}

function normalizeGpsSessionSetup(input = {}) {
  const defaults = createDefaultGpsSessionSetup();
  const setup = { ...defaults, ...(input || {}) };
  setup.activityType = setup.activityType || setup.sessionType || setup.type || "match";
  setup.date = setup.date || todayIso();
  setup.sessionName = setup.sessionName || "";
  setup.opponent = setup.opponent || "";
  setup.type = setup.activityType;
  return setup;
}

function syncGpsSessionSetupFromDom(target) {
  if (!target) return target;
  document.querySelectorAll("[data-gps-setup]").forEach((input) => {
    const key = input.getAttribute("data-gps-setup");
    if (key) target[key] = input.value;
  });
  return target;
}

function validateGpsSessionSetup(setupInput) {
  const setup = normalizeGpsSessionSetup(setupInput);
  if (!setup.date) return "יש לבחור תאריך לסשן GPS";
  if (!setup.sessionName.trim()) return "יש להזין שם סשן GPS";
  if (setup.activityType === "training" && !setup.matchDayRelation) return "יש לבחור יחס ליום משחק";
  return "";
}

function renderGpsSessionSetupPanel(setupInput, showFileInput) {
  const setup = normalizeGpsSessionSetup(setupInput);
  return `
    <section class="surface form-panel grid gps-session-setup-panel">
      <div class="section-title">
        <h3>ייבוא דוח GPS</h3>
        <span>${showFileInput ? "הגדרת סשן לפני העלאת קובץ" : "פרטי הסשן לייבוא"}</span>
      </div>
      <div class="grid three">
        <div class="field">
          <label for="gpsSetupDate">תאריך</label>
          <input id="gpsSetupDate" data-gps-setup="date" type="date" value="${escapeAttr(setup.date)}" required />
        </div>
        <div class="field">
          <label for="gpsSetupName">שם סשן</label>
          <input id="gpsSetupName" data-gps-setup="sessionName" value="${escapeAttr(setup.sessionName)}" placeholder="לדוגמה: משחק ליגה - מחזור 12" required />
        </div>
        <div class="field">
          <label for="gpsSetupActivityType">סוג פעילות</label>
          <select id="gpsSetupActivityType" data-gps-setup="activityType">
            ${GPS_ACTIVITY_TYPES.map(([value, label]) => `<option value="${escapeAttr(value)}" ${setup.activityType === value ? "selected" : ""}>${escapeHtml(label)}</option>`).join("")}
          </select>
        </div>
      </div>
      ${renderGpsSessionConditionalFields(setup)}
      ${showFileInput ? `
        <div class="gps-upload-drop">
          <div>
            <strong>העלאת קובץ GPS</strong>
            <p>לאחר מילוי פרטי הסשן, העלה קובץ CSV או Excel למיפוי עמודות.</p>
          </div>
          <input id="gpsFileInput" type="file" accept=".csv,.tsv,.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv" />
        </div>
      ` : ""}
    </section>
  `;
}

function renderGpsSessionConditionalFields(setup) {
  if (setup.activityType === "training") {
    return `
      <div class="grid three gps-session-conditional">
        <div class="field">
          <label for="gpsSetupMdRelation">יחס ליום משחק</label>
          <select id="gpsSetupMdRelation" data-gps-setup="matchDayRelation">
            ${renderSimpleOptions(GPS_MATCH_DAY_RELATIONS, setup.matchDayRelation || "MD-1")}
          </select>
        </div>
      </div>
    `;
  }
  if (setup.activityType === "training_match") {
    return `
      <div class="grid three gps-session-conditional">
        <div class="field">
          <label for="gpsSetupOpponent">יריבה</label>
          <input id="gpsSetupOpponent" data-gps-setup="opponent" value="${escapeAttr(setup.opponent)}" placeholder="שם יריבה" />
        </div>
        <div class="field">
          <label for="gpsSetupFormat">פורמט</label>
          <select id="gpsSetupFormat" data-gps-setup="format">
            ${renderSimpleOptions(GPS_TRAINING_MATCH_FORMATS, setup.format || "11v11")}
          </select>
        </div>
      </div>
    `;
  }
  return `
    <div class="grid three gps-session-conditional">
      <div class="field">
        <label for="gpsSetupCompetition">מסגרת</label>
        <select id="gpsSetupCompetition" data-gps-setup="competition">
          ${renderSimpleOptions(GPS_COMPETITIONS, setup.competition || "ליגה")}
        </select>
      </div>
      <div class="field">
        <label for="gpsSetupRound">מחזור / שלב</label>
        <input id="gpsSetupRound" data-gps-setup="matchRound" value="${escapeAttr(setup.matchRound)}" placeholder="לדוגמה: מחזור 12" />
      </div>
      <div class="field">
        <label for="gpsSetupOpponent">יריבה</label>
        <input id="gpsSetupOpponent" data-gps-setup="opponent" value="${escapeAttr(setup.opponent)}" placeholder="שם יריבה" />
      </div>
      <div class="field">
        <label for="gpsSetupHomeAway">בית / חוץ</label>
        <select id="gpsSetupHomeAway" data-gps-setup="homeAway">
          ${renderSimpleOptions(GPS_HOME_AWAY_OPTIONS, setup.homeAway || "בית")}
        </select>
      </div>
      <div class="field">
        <label for="gpsSetupResult">תוצאה</label>
        <input id="gpsSetupResult" data-gps-setup="result" value="${escapeAttr(setup.result)}" placeholder="אופציונלי" />
      </div>
    </div>
  `;
}

function renderGpsImportPanel() {
  const importState = uiState.gpsImport;
  if (!importState) {
    return `
      ${renderGpsSessionSetupPanel(uiState.gpsSessionSetup, true)}
    `;
  }
  const mappedRows = mapGpsImportRows(importState).slice(0, 8);
  const unmatchedNames = getGpsUnmatchedNames(importState);
  return `
    ${renderGpsSessionSetupPanel(importState, false)}
    <section class="surface form-panel grid">
      <div class="section-title">
        <h3>מיפוי עמודות</h3>
        <span>${escapeHtml(importState.fileName)} · ${importState.rows.length} שורות</span>
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
  syncGpsSessionSetupFromDom(importState);
  const sessionSetup = normalizeGpsSessionSetup(importState);
  const setupError = validateGpsSessionSetup(sessionSetup);
  if (setupError) {
    alert(setupError);
    return;
  }
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
  const defaultSetup = createDefaultGpsSessionSetup();
  const sessionDate = sessionSetup.date === defaultSetup.date && first.date ? first.date : sessionSetup.date;
  const sessionName = sessionSetup.sessionName.trim() === defaultSetup.sessionName && first.sessionName ? first.sessionName : sessionSetup.sessionName.trim();
  const sessionId = createId("gps-session");
  const gpsSession = {
    id: sessionId,
    date: sessionDate,
    sessionName,
    type: sessionSetup.activityType,
    activityType: sessionSetup.activityType,
    competition: sessionSetup.competition || "",
    matchRound: sessionSetup.matchRound || "",
    opponent: sessionSetup.opponent || "",
    homeAway: sessionSetup.homeAway || "",
    result: sessionSetup.result || "",
    matchDayRelation: sessionSetup.matchDayRelation || "",
    format: sessionSetup.format || "",
    notes: sessionSetup.notes || ""
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
  uiState.gpsImportModalOpen = false;
  uiState.gpsSessionSetup = createDefaultGpsSessionSetup();
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
    position: normalizePlayerPosition(record.position || player?.position || ""),
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

function renderGpsSessionReviewDashboard(records, selectedSession, filters) {
  if (!records.length) return `<div class="surface empty section">אין נתוני GPS להצגה</div>`;
  const reviewRecords = getGpsReviewRecords(records, filters);
  const enrichedRecords = reviewRecords.map(enrichPlayerGpsRecord);
  const allEnrichedRecords = records.map(enrichPlayerGpsRecord);
  const selectedMetric = getGpsReviewMetric(filters.metric || "totalDistance");
  return `
    <section class="section gps-review-dashboard">
      ${renderGpsSessionSummaryHeader(enrichedRecords, selectedSession, filters)}
      ${renderGpsDecisionCenter(enrichedRecords, selectedMetric)}
      <article class="surface gps-main-chart-card">
        <div class="gps-main-chart-header">
          <div>
            <span class="eyebrow">מדדים לפי שחקן</span>
            <h3>${escapeHtml(selectedMetric.label)} לפי שחקן</h3>
            <p>השוואת שחקנים מול ממוצע הקבוצה. רחף על עמודה כדי לראות ערך, פער ואחוז מעל/מתחת לממוצע.</p>
          </div>
          <span>${enrichedRecords.length} שחקנים · ${escapeHtml(selectedMetric.axisLabel)}</span>
        </div>
        ${renderGpsMetricSelector(selectedMetric.key)}
        ${renderGpsMainMetricBarChart(enrichedRecords, selectedMetric)}
      </article>

      <section class="section">
        <div class="section-title">
          <h3>מצטיינים בסשן</h3>
          <span>Top performers</span>
        </div>
        <div class="gps-top-performer-grid">
          ${renderGpsTopPerformerCard(enrichedRecords, "totalDistance", "Highest Distance")}
          ${renderGpsTopPerformerCard(enrichedRecords, "highSpeedRunning", "Highest HSR")}
          ${renderGpsTopPerformerCard(enrichedRecords, "sprintDistance", "Highest Sprint Distance")}
          ${renderGpsTopPerformerCard(enrichedRecords, "sprintCount", "Most Sprints")}
          ${renderGpsTopPerformerCard(enrichedRecords, "maxSpeed", "Highest Max Speed")}
        </div>
      </section>

      <section class="section">
        <div class="section-title">
          <h3>התראות GPS</h3>
          <span>${sum(getGpsAlertGroups(enrichedRecords).map((group) => group.items.length))} התראות</span>
        </div>
        ${renderGpsAlertGroups(enrichedRecords)}
      </section>

      <details class="surface gps-full-data-table">
        <summary>
          <span>טבלת נתונים מלאה</span>
          <strong>${allEnrichedRecords.length} רשומות</strong>
        </summary>
        ${renderGpsTable(allEnrichedRecords)}
      </details>
    </section>
  `;
}

function getGpsReviewRecords(records, filters) {
  if (filters && filters.period && filters.period !== "all") return records;
  return getFullPeriodPreferred(records);
}

function renderGpsSessionSummaryHeader(records, selectedSession, filters) {
  const playersCount = unique(records.map((record) => record.playerId || record.playerName).filter(Boolean)).length;
  const maxSpeed = Math.max(0, ...records.map((record) => Number(record.maxSpeed) || 0));
  const sessionName = selectedSession ? selectedSession.sessionName : "כל המפגשים";
  const sessionDate = selectedSession ? formatDateDisplay(selectedSession.date) : filters.date !== "all" ? formatDateDisplay(filters.date) : "כל התאריכים";
  const sessionType = selectedSession ? formatGpsSessionType(selectedSession.type) : "כל הסוגים";
  return `
    <article class="surface gps-session-summary">
      <div class="gps-session-title">
        <span class="eyebrow">סקירת GPS</span>
        <h3>${escapeHtml(sessionName)}</h3>
        <p>${escapeHtml(sessionDate)} · ${escapeHtml(sessionType)}</p>
        ${selectedSession ? `<p class="gps-session-meta-line">${escapeHtml(getGpsSessionMetaSummary(selectedSession))}</p>` : ""}
      </div>
      <div class="gps-session-summary-grid">
        ${gpsSummaryMetric("שחקנים", playersCount)}
        ${gpsSummaryMetric("מרחק ממוצע", `${formatNumber(average(records.map((record) => record.totalDistance)) / 1000)} ק״מ`)}
        ${gpsSummaryMetric("HSR ממוצע", `${formatInteger(average(records.map((record) => record.highSpeedRunning)))} מ׳`)}
        ${gpsSummaryMetric("Sprint ממוצע", `${formatInteger(average(records.map((record) => record.sprintDistance)))} מ׳`)}
        ${gpsSummaryMetric("מהירות שיא", `${formatNumber(maxSpeed)} קמ״ש`)}
      </div>
    </article>
  `;
}

function getGpsSessionMetaSummary(sessionItem) {
  if (!sessionItem) return "";
  const type = sessionItem.activityType || sessionItem.type;
  if (type === "training") return sessionItem.matchDayRelation || "אימון";
  if (type === "training_match") {
    return [sessionItem.opponent, sessionItem.format].filter(Boolean).join(" · ") || "משחק אימון";
  }
  return [sessionItem.competition, sessionItem.matchRound, sessionItem.opponent, sessionItem.homeAway, sessionItem.result].filter(Boolean).join(" · ") || "משחק";
}

function gpsSummaryMetric(label, value) {
  return `
    <div>
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
    </div>
  `;
}

function renderGpsDecisionCenter(records, metric) {
  const rows = buildGpsBenchmarkRows(records, metric.key);
  if (!rows.length) {
    return `<section class="surface gps-decision-center empty">אין נתוני GPS להשוואה במדד הנבחר</section>`;
  }
  const actionRows = rows
    .map((row) => ({ row, priority: getGpsBenchmarkPriority(row) }))
    .filter((item) => item.priority.score > 0)
    .sort((a, b) => b.priority.score - a.priority.score)
    .slice(0, 3);
  return `
    <section class="surface gps-decision-center">
      <div class="gps-decision-head">
        <div>
          <span class="eyebrow">Decision Center</span>
          <h3>מה המדד ${escapeHtml(metric.label)} אומר?</h3>
          <p>השוואה מהירה מול קבוצה, עמדה, שיא אישי ומשחק קודם. הגרף למטה מיועד לניתוח אחרי הסריקה הראשונית.</p>
        </div>
        <span class="badge neutral">${escapeHtml(rows.length)} שחקנים</span>
      </div>
      ${actionRows.length ? `
        <div class="gps-decision-actions">
          ${actionRows.map(({ row, priority }) => `
            <a href="/coach/player/${escapeAttr(row.record.playerId)}/gps" data-route class="decision-alert-card ${escapeAttr(priority.severity.toLowerCase())}">
              <span class="severity-badge ${escapeAttr(priority.severity.toLowerCase())}">${escapeHtml(severityLabel(priority.severity))}</span>
              <strong>${escapeHtml(row.record.playerName)} · ${escapeHtml(priority.title)}</strong>
              <p>${escapeHtml(priority.reason)}</p>
              <small>בדוק עומס, דקות ותפקיד לפני החלטת עומס נוספת.</small>
            </a>
          `).join("")}
        </div>
      ` : `<div class="surface empty compact-empty">אין חריגה משמעותית במדד הנבחר.</div>`}
      <div class="gps-benchmark-grid">
        ${rows.map((row) => renderGpsBenchmarkCard(row, metric)).join("")}
      </div>
    </section>
  `;
}

function renderGpsBenchmarkCard(row, metric) {
  return `
    <article class="gps-benchmark-card">
      <header>
        <div>
          <strong>${escapeHtml(row.record.playerName)}</strong>
          <span>${escapeHtml(row.position)}</span>
        </div>
        <b>${escapeHtml(formatGpsReviewMetric(metric.key, row.currentValue))}</b>
      </header>
      <div class="gps-benchmark-mini-grid">
        ${renderGpsBenchmarkItem(metric.key, "ממוצע קבוצה", row.team.value, formatGpsBenchmarkDiff(metric.key, row.team), row.team)}
        ${renderGpsBenchmarkItem(metric.key, "ממוצע עמדה", row.positionAverage.value, formatGpsBenchmarkDiff(metric.key, row.positionAverage), row.positionAverage)}
        ${renderGpsBenchmarkItem(metric.key, "שיא אישי", row.personalBest ? row.personalBest.value : null, formatGpsPersonalBestShare(row), null)}
        ${renderGpsBenchmarkItem(metric.key, "משחק קודם", row.previousMatch ? row.previousMatch.value : null, row.previousMatch ? formatGpsBenchmarkDiff(metric.key, row.previousMatch) : "אין נתון", row.previousMatch)}
      </div>
    </article>
  `;
}

function renderGpsBenchmarkItem(metricKey, label, value, detail, comparison) {
  const tone = comparison ? getGpsBenchmarkTone(comparison) : "neutral";
  return `
    <div class="gps-benchmark-item ${escapeAttr(tone)}">
      <span>${escapeHtml(label)}</span>
      <strong>${value === null || value === undefined ? "אין נתון" : escapeHtml(formatGpsReviewMetric(metricKey, value))}</strong>
      <small>${escapeHtml(detail || "אין נתון")}</small>
    </div>
  `;
}

function getGpsBenchmarkTone(comparison) {
  if (!comparison || comparison.percent === null || comparison.percent === undefined) return "neutral";
  if (comparison.percent >= 10) return "above";
  if (comparison.percent <= -10) return "below";
  return "near";
}

function getGpsBenchmarkPriority(row) {
  const teamPercent = row.team.percent || 0;
  const positionPercent = row.positionAverage.percent || 0;
  const personalPercent = row.personalBest ? row.personalBest.percent : 100;
  if (teamPercent >= 25 || positionPercent >= 25) {
    return { score: 90 + Math.max(teamPercent, positionPercent), severity: "High", title: "גבוה ביחס לבנצ׳מרק", reason: `${formatNumber(Math.max(teamPercent, positionPercent))}% מעל ממוצע רלוונטי` };
  }
  if (teamPercent <= -20 || positionPercent <= -20) {
    return { score: 60 + Math.abs(Math.min(teamPercent, positionPercent)), severity: "Medium", title: "נמוך ביחס לבנצ׳מרק", reason: `${formatNumber(Math.abs(Math.min(teamPercent, positionPercent)))}% מתחת לממוצע רלוונטי` };
  }
  if (personalPercent >= 95) {
    return { score: 50 + personalPercent, severity: "Medium", title: "קרוב לשיא אישי", reason: `${formatNumber(personalPercent)}% מהשיא האישי` };
  }
  return { score: 0, severity: "Low", title: "תקין", reason: "אין חריגה משמעותית" };
}

function renderGpsMetricSelector(selectedKey) {
  const metricMap = new Map(GPS_METRICS);
  return `
    <div class="gps-metric-selector" aria-label="בחירת מדד GPS">
      ${GPS_METRIC_GROUPS.map((group) => `
        <div class="gps-metric-group">
          <span>${escapeHtml(group.title)}</span>
          <div class="gps-metric-buttons">
            ${group.keys.filter((key) => metricMap.has(key)).map((key) => {
              const metric = getGpsReviewMetric(key);
              return `<button class="gps-metric-button ${selectedKey === key ? "active" : ""}" type="button" data-gps-review-metric="${escapeAttr(key)}">${escapeHtml(metric.label)}</button>`;
            }).join("")}
          </div>
        </div>
      `).join("")}
    </div>
  `;
}

function renderGpsMainMetricBarChart(records, metric) {
  const rows = records
    .map((record) => ({ label: record.playerName, value: Number(record[metric.key]) || 0 }))
    .sort((a, b) => b.value - a.value);
  if (!rows.length) return `<div class="surface empty gps-chart-empty">אין נתוני GPS להצגה</div>`;
  const averageValue = average(rows.map((row) => row.value)) || 0;
  const maxValue = Math.max(...rows.map((row) => Number(row.value) || 0), averageValue, 1) * 1.12;
  const averagePercent = Math.max(0, Math.min(100, (averageValue / maxValue) * 100));
  const minWidth = Math.max(820, rows.length * 112);
  const ticks = [1, 0.75, 0.5, 0.25, 0];
  const averageLabel = formatGpsReviewMetric(metric.key, averageValue);
  return `
    <div class="gps-html-chart" style="--avg-position:${averagePercent}%; --bar-count:${rows.length};">
      <div class="gps-chart-context">
        <div>
          <span>מדד נבחר</span>
          <strong>${escapeHtml(metric.label)}</strong>
          <small>${escapeHtml(metric.axisLabel)}</small>
        </div>
        <div>
          <span>ממוצע קבוצה</span>
          <strong>${escapeHtml(averageLabel)}</strong>
          <small>הקו המקווקו בגרף</small>
        </div>
      </div>
      <div class="gps-html-chart-shell">
        <div class="gps-y-axis" aria-hidden="true">
          ${ticks.map((tick) => `<span>${escapeHtml(formatGpsReviewMetric(metric.key, maxValue * tick))}</span>`).join("")}
        </div>
        <div class="gps-bars-viewport" tabindex="0" aria-label="גרף ${escapeAttr(metric.label)} לפי שחקן">
          <div class="gps-bars-stage" style="min-width:${minWidth}px">
            <div class="gps-bars-plot">
              <div class="gps-average-rule" style="bottom:${averagePercent}%"><span>ממוצע קבוצה · ${escapeHtml(averageLabel)}</span></div>
              <div class="gps-bars-grid">
                ${rows.map((row) => {
                  const value = Number(row.value) || 0;
                  const barPercent = Math.max(0, Math.min(100, (value / maxValue) * 100));
                  const tone = getGpsAverageComparisonTone(value, averageValue);
                  const tooltip = getGpsChartTooltip(row.label, metric, value, averageValue);
                  return `
                    <button class="gps-bar-column" type="button" style="--bar-percent:${barPercent}%;" aria-label="${escapeAttr(tooltip)}">
                      <span class="gps-bar ${tone}"></span>
                      <span class="gps-html-tooltip">${escapeHtml(tooltip).replace(/\n/g, "<br>")}</span>
                    </button>
                  `;
                }).join("")}
              </div>
            </div>
            <div class="gps-player-label-row">
              ${rows.map((row) => `<span>${escapeHtml(row.label)}</span>`).join("")}
            </div>
          </div>
        </div>
      </div>
      <div class="gps-axis-captions">
        <span>Y: ${escapeHtml(metric.axisLabel)}</span>
        <span>X: שמות שחקנים</span>
      </div>
      <div class="gps-chart-legend" aria-label="מקרא השוואה לממוצע">
        <span class="above">מעל ממוצע</span>
        <span class="near">קרוב לממוצע</span>
        <span class="below">מתחת לממוצע</span>
      </div>
    </div>
  `;
}

function getGpsReviewMetric(metricKey) {
  const item = GPS_METRICS.find(([key]) => key === metricKey) || GPS_METRICS[0];
  const key = item[0];
  const unit = getGpsReviewMetricUnit(key);
  return {
    key,
    label: item[1],
    unit,
    axisLabel: unit ? `${item[1]} (${unit})` : item[1]
  };
}

function getGpsAverageComparisonTone(value, averageValue) {
  if (!averageValue) return "near";
  const percent = ((Number(value) - averageValue) / averageValue) * 100;
  if (percent >= 5) return "above";
  if (percent <= -5) return "below";
  return "near";
}

function getGpsChartTooltip(playerName, metric, value, averageValue) {
  const difference = Number(value) - averageValue;
  const percent = averageValue ? (difference / averageValue) * 100 : 0;
  const direction = percent > 0 ? "מעל ממוצע הקבוצה" : percent < 0 ? "מתחת לממוצע הקבוצה" : "זהה לממוצע הקבוצה";
  const signedPercent = percent > 0 ? `+${formatNumber(percent)}%` : `${formatNumber(percent)}%`;
  return [
    playerName,
    `${metric.label}: ${formatGpsReviewMetric(metric.key, value)}`,
    `פער מהממוצע: ${formatGpsReviewDifference(metric.key, difference)}`,
    `${signedPercent} ${direction}`
  ].join("\n");
}

function formatGpsReviewDifference(metric, value) {
  const numeric = Number(value) || 0;
  const prefix = numeric > 0 ? "+" : numeric < 0 ? "-" : "";
  return `${prefix}${formatGpsReviewMetric(metric, Math.abs(numeric))}`;
}

function renderGpsTeamBarChart(records, metric, title) {
  const rows = records
    .map((record) => ({ label: record.playerName, value: Number(record[metric]) || 0 }))
    .sort((a, b) => b.value - a.value);
  return chartCard(title, renderSimpleBarChart(rows, metric, title));
}

function renderGpsTopPerformerCard(records, metric, title) {
  const best = getGpsBestRecord(records, metric);
  return `
    <article class="gps-top-performer-card">
      <span>${escapeHtml(title)}</span>
      ${best ? `
        <strong>${escapeHtml(best.playerName)}</strong>
        <p>${escapeHtml(formatGpsReviewMetric(metric, best[metric]))}</p>
      ` : `
        <strong>אין נתון</strong>
        <p>אין רשומות להצגה</p>
      `}
    </article>
  `;
}

function getGpsBestRecord(records, metric) {
  return records
    .filter((record) => Number.isFinite(Number(record[metric])))
    .sort((a, b) => Number(b[metric]) - Number(a[metric]))[0] || null;
}

function formatGpsReviewMetric(metric, value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "אין נתון";
  const numeric = Number(value) || 0;
  if (metric === "totalDistance") return `${formatNumber(numeric / 1000)} ק״מ`;
  if (["highSpeedRunning", "sprintDistance", "distanceAbove18", "distanceAbove25", "hmld"].includes(metric)) return `${formatInteger(numeric)} מ׳`;
  if (metric === "maxSpeed") return `${formatNumber(numeric)} קמ״ש`;
  if (metric === "distancePerMinute") return `${formatNumber(numeric)} מ׳/דק׳`;
  if (metric === "minutesPlayed") return `${formatInteger(numeric)} דק׳`;
  if (metric === "workRestRatio") return formatNumber(numeric);
  if (["sprintCount", "accelerations", "decelerations"].includes(metric)) return formatInteger(numeric);
  return formatNumber(numeric);
}

function getGpsReviewMetricUnit(metric) {
  if (metric === "totalDistance") return "ק״מ";
  if (["highSpeedRunning", "sprintDistance", "distanceAbove18", "distanceAbove25", "hmld"].includes(metric)) return "מ׳";
  if (metric === "maxSpeed") return "קמ״ש";
  if (metric === "distancePerMinute") return "מ׳/דק׳";
  if (metric === "minutesPlayed") return "דקות";
  if (["sprintCount", "accelerations", "decelerations"].includes(metric)) return "כמות";
  return "";
}

function buildGpsBenchmarkRows(records, metricKey, allRecords = state.gpsRecords.map(getComputedGpsRecord)) {
  const currentRecords = getFullPeriodPreferred(records)
    .filter((record) => Number.isFinite(Number(record[metricKey])))
    .map((record) => ({ ...record, position: normalizePlayerPosition(record.position || getPlayerPrimaryPosition(record.playerId)) }));
  const allPreferred = getFullPeriodPreferred(allRecords)
    .filter((record) => Number.isFinite(Number(record[metricKey])))
    .map((record) => ({ ...record, position: normalizePlayerPosition(record.position || getPlayerPrimaryPosition(record.playerId)) }));
  const teamAverage = average(currentRecords.map((record) => record[metricKey])) || 0;

  return currentRecords
    .map((record) => {
      const currentValue = Number(record[metricKey]) || 0;
      const positionRecords = currentRecords.filter((item) => item.position && item.position === record.position);
      const positionAverage = average(positionRecords.map((item) => item[metricKey])) || 0;
      const playerHistory = allPreferred.filter((item) => item.playerId === record.playerId);
      const personalBest = Math.max(0, ...playerHistory.map((item) => Number(item[metricKey]) || 0));
      const previousMatch = getPreviousGpsMatchRecord(record, metricKey, allPreferred);
      return {
        record,
        player: getPlayer(record.playerId),
        position: record.position || "עמדה לא מוגדרת",
        currentValue,
        team: compareGpsMetricValue(currentValue, teamAverage),
        positionAverage: compareGpsMetricValue(currentValue, positionAverage),
        personalBest: personalBest ? {
          value: personalBest,
          percent: personalBest ? (currentValue / personalBest) * 100 : null
        } : null,
        previousMatch: previousMatch ? compareGpsMetricValue(currentValue, Number(previousMatch[metricKey]) || 0) : null
      };
    })
    .sort((a, b) => b.currentValue - a.currentValue);
}

function compareGpsMetricValue(currentValue, benchmarkValue) {
  const current = Number(currentValue) || 0;
  const benchmark = Number(benchmarkValue) || 0;
  const difference = current - benchmark;
  return {
    value: benchmark,
    difference,
    percent: benchmark ? (difference / benchmark) * 100 : null
  };
}

function getPreviousGpsMatchRecord(record, metricKey, allRecords) {
  return allRecords
    .filter((item) => item.playerId === record.playerId && item.date < record.date && isGpsMatchRecord(item) && Number.isFinite(Number(item[metricKey])))
    .sort((a, b) => b.date.localeCompare(a.date))[0] || null;
}

function isGpsMatchRecord(record) {
  const sessionItem = state.gpsSessions.find((item) => item.id === record.gpsSessionId) || null;
  const type = sessionItem ? sessionItem.activityType || sessionItem.type : record.sessionType;
  return type === "match" || type === "training_match" || type === "משחק" || type === "משחק אימון";
}

function formatGpsBenchmarkDiff(metricKey, comparison) {
  if (!comparison || comparison.percent === null || comparison.percent === undefined) return "אין נתון";
  const sign = comparison.difference > 0 ? "+" : comparison.difference < 0 ? "-" : "";
  const direction = comparison.difference > 0 ? "מעל" : comparison.difference < 0 ? "מתחת" : "זהה";
  return `${sign}${formatGpsReviewMetric(metricKey, Math.abs(comparison.difference))} · ${formatNumber(Math.abs(comparison.percent))}% ${direction}`;
}

function formatGpsPersonalBestShare(row) {
  if (!row.personalBest) return "אין נתון";
  return `${formatNumber(row.personalBest.percent)}% מהשיא`;
}

function getGpsAlertGroups(records) {
  return [
    {
      title: "GPS גבוה",
      tone: "red",
      items: records.filter((record) => record.gpsLoad >= 800 || record.riskFlags.some((flag) => flag.includes("עומס GPS")))
        .map((record) => ({ record, reason: `עומס GPS ${formatInteger(record.gpsLoad)}` }))
    },
    {
      title: "HSR גבוה",
      tone: "yellow",
      items: records.filter((record) => record.highSpeedRunning >= 650)
        .map((record) => ({ record, reason: `HSR ${formatInteger(record.highSpeedRunning)} מ׳` }))
    },
    {
      title: "ספרינטים גבוהים",
      tone: "yellow",
      items: records.filter((record) => record.sprintDistance >= 180 || record.sprintCount >= 8)
        .map((record) => ({ record, reason: `${formatInteger(record.sprintDistance)} מ׳ · ${formatInteger(record.sprintCount)} ספרינטים` }))
    },
    {
      title: "Speed high",
      tone: "green",
      items: records.filter((record) => record.maxSpeed >= 32)
        .map((record) => ({ record, reason: `${formatNumber(record.maxSpeed)} קמ״ש` }))
    },
    {
      title: "Risk alerts",
      tone: "red",
      items: records.filter((record) => record.riskFlags.length)
        .map((record) => ({ record, reason: record.riskFlags.join(", ") }))
    }
  ];
}

function renderGpsAlertGroups(records) {
  const groups = getGpsAlertGroups(records);
  if (!groups.some((group) => group.items.length)) return `<div class="surface empty">אין התראות GPS בסשן הנבחר</div>`;
  return `
    <div class="gps-alert-grid">
      ${groups.map((group) => `
        <article class="gps-alert-card ${escapeAttr(group.tone)}">
          <div>
            <span>${escapeHtml(group.title)}</span>
            <strong>${escapeHtml(group.items.length)}</strong>
          </div>
          ${group.items.length ? group.items.slice(0, 4).map((item) => `
            <p><b>${escapeHtml(item.record.playerName)}</b> · ${escapeHtml(item.reason)}</p>
          `).join("") : `<p>אין התראות</p>`}
        </article>
      `).join("")}
    </div>
  `;
}

function formatGpsSessionType(type) {
  if (type === "match" || type === "משחק") return "משחק";
  if (type === "training" || type === "אימון") return "אימון";
  if (type === "training_match" || type === "משחק אימון") return "משחק אימון";
  return type || "לא מוגדר";
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
  const setup = normalizeGpsSessionSetup(importState);
  return importState.rows.map((row) => {
    const mapped = {};
    GPS_FIELDS.forEach(([field]) => {
      const source = importState.mapping[field];
      const raw = source ? row[source] : "";
      mapped[field] = GPS_NUMERIC_FIELDS.has(field) ? parseFlexibleNumber(raw) : String(raw || "").trim();
    });
    mapped.date = parseFlexibleDate(mapped.date);
    mapped.date = mapped.date || setup.date;
    mapped.sessionName = mapped.sessionName || setup.sessionName;
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

function renderOwnerAdminPage() {
  if (!canManageSystem()) {
    renderAccessDenied();
    return;
  }
  if (!uiState.ownerAdmin.loading && !uiState.ownerAdmin.teams.length && !uiState.ownerAdmin.error) {
    loadOwnerAdminSnapshot();
  }
  const tab = OWNER_ADMIN_TABS.includes(uiState.ownerAdmin.tab) ? uiState.ownerAdmin.tab : "teams";
  const html = coachShell("admin", `
    <div class="page-header premium-header owner-admin-header">
      <div>
        <span class="eyebrow">Owner</span>
        <h2>ניהול מערכת</h2>
        <p>ניהול קבוצות, מאמנים, שחקנים והרשאות מכלי אחד מאובטח.</p>
      </div>
      <button class="btn secondary" type="button" id="refreshOwnerAdmin">רענון נתונים</button>
    </div>
    ${uiState.ownerAdmin.notice ? `<div class="success-box show">${escapeHtml(uiState.ownerAdmin.notice)}</div>` : ""}
    ${uiState.ownerAdmin.error ? `<div class="success-box danger-box show">${escapeHtml(uiState.ownerAdmin.error)}</div>` : ""}
    <section class="surface owner-admin-tabs" role="tablist" aria-label="ניהול מערכת">
      ${ownerAdminTabButton("teams", "קבוצות", tab)}
      ${ownerAdminTabButton("coaches", "מאמנים", tab)}
      ${ownerAdminTabButton("players", "שחקנים", tab)}
      ${ownerAdminTabButton("permissions", "הרשאות", tab)}
    </section>
    ${uiState.ownerAdmin.loading ? `<section class="surface empty">טוען נתוני ניהול מערכת...</section>` : renderOwnerAdminTab(tab)}
  `);
  mount(html, bindOwnerAdminPage);
}

function ownerAdminTabButton(id, label, activeTab) {
  return `<button type="button" class="${activeTab === id ? "is-active" : ""}" data-owner-admin-tab="${escapeAttr(id)}">${escapeHtml(label)}</button>`;
}

function renderOwnerAdminTab(tab) {
  if (tab === "coaches") return renderOwnerCoachesTab();
  if (tab === "players") return renderOwnerPlayersTab();
  if (tab === "permissions") return renderOwnerPermissionsTab();
  return renderOwnerTeamsTab();
}

async function loadOwnerAdminSnapshot() {
  uiState.ownerAdmin.loading = true;
  uiState.ownerAdmin.error = "";
  renderOwnerAdminPage();
  try {
    const [teams, coaches, players, owners] = await Promise.all([
      supabaseSelect("teams", "select=*&order=name.asc"),
      supabaseSelect("coaches", "select=*&order=email.asc"),
      supabaseSelect("players", "select=*&order=name.asc"),
      supabaseSelect("platform_owners", "select=*&order=email.asc")
    ]);
    uiState.ownerAdmin = { ...uiState.ownerAdmin, loading: false, error: "", teams, coaches, players, owners };
  } catch (error) {
    console.error("[Owner Admin] failed to load", error);
    uiState.ownerAdmin.loading = false;
    uiState.ownerAdmin.error = error.message || "טעינת ניהול מערכת נכשלה.";
  }
  renderOwnerAdminPage();
}

function getOwnerAdminTeam(teamId) {
  return uiState.ownerAdmin.teams.find((team) => team.id === teamId) || null;
}

function renderOwnerTeamsTab() {
  const { teams, players, coaches } = uiState.ownerAdmin;
  return `
    <section class="owner-admin-grid">
      <article class="surface owner-admin-panel">
        <div class="section-title">
          <h3>יצירת קבוצה</h3>
          <span>Team code משמש גם לכניסת שחקנים</span>
        </div>
        <form id="ownerCreateTeamForm" class="grid three">
          <input name="teamName" required placeholder="שם קבוצה" />
          <input name="teamSlug" required placeholder="קוד קבוצה / slug" dir="ltr" />
          <button class="btn primary" type="submit">צור קבוצה</button>
        </form>
      </article>
      <article class="surface owner-admin-panel wide">
        <div class="section-title"><h3>קבוצות</h3><span>${teams.length} קבוצות</span></div>
        <div class="owner-admin-list">
          ${teams.map((team) => {
            const playerCount = players.filter((player) => player.team_id === team.id).length;
            const coachCount = unique(coaches.filter((coach) => coach.team_id === team.id).map((coach) => coach.user_id || coach.email)).length;
            return `
              <div class="owner-admin-row team-row">
                <input data-team-name="${escapeAttr(team.id)}" value="${escapeAttr(team.name)}" aria-label="שם קבוצה" />
                <input data-team-slug="${escapeAttr(team.id)}" value="${escapeAttr(team.slug)}" aria-label="קוד קבוצה" dir="ltr" />
                <label class="checkbox-line"><input data-team-active="${escapeAttr(team.id)}" type="checkbox" ${team.active !== false ? "checked" : ""}/> פעילה</label>
                <span class="mini-stat">${playerCount} שחקנים</span>
                <span class="mini-stat">${coachCount} מאמנים</span>
                <button class="btn secondary" type="button" data-save-team="${escapeAttr(team.id)}">שמירה</button>
              </div>
            `;
          }).join("") || `<div class="empty">אין קבוצות להצגה</div>`}
        </div>
      </article>
    </section>
  `;
}

function renderOwnerCoachesTab() {
  const { teams, coaches } = uiState.ownerAdmin;
  const coachGroups = groupCoachesByUser(coaches);
  return `
    <section class="owner-admin-grid">
      <article class="surface owner-admin-panel">
        <div class="section-title"><h3>יצירת מאמן</h3><span>נוצר דרך Supabase Auth בצד שרת</span></div>
        <form id="ownerCreateCoachForm" class="grid">
          <input name="coachName" required placeholder="שם המאמן" />
          <input name="coachEmail" required type="email" placeholder="email@example.com" dir="ltr" />
          <input name="coachPassword" required type="password" minlength="8" placeholder="סיסמה זמנית" />
          <div class="assignment-picker">
            ${teams.map((team) => `
              <label class="assignment-line">
                <input type="checkbox" name="teamIds" value="${escapeAttr(team.id)}" />
                <span>${escapeHtml(team.name)}</span>
                <select name="role-${escapeAttr(team.id)}">${renderRoleOptions("coach")}</select>
              </label>
            `).join("")}
          </div>
          <button class="btn primary" type="submit">צור משתמש מאמן</button>
        </form>
      </article>
      <article class="surface owner-admin-panel">
        <div class="section-title"><h3>שיוך מאמן קיים לקבוצה</h3><span>למשתמש Auth שכבר קיים</span></div>
        <form id="ownerAssignCoachForm" class="grid">
          <select name="coachUser" required>
            <option value="">בחר מאמן קיים</option>
            ${coachGroups.map((coach) => `<option value="${escapeAttr(coach.userId)}">${escapeHtml(coach.name)} · ${escapeHtml(coach.email)}</option>`).join("")}
          </select>
          <select name="teamId" required>${renderTeamOptions(teams)}</select>
          <select name="role">${renderRoleOptions("coach")}</select>
          <button class="btn secondary" type="submit">הוסף שיוך</button>
        </form>
      </article>
    </section>
    <section class="surface owner-admin-panel wide">
      <div class="section-title"><h3>מאמנים והרשאות</h3><span>${coachGroups.length} משתמשי מאמן</span></div>
      <div class="owner-admin-list">${coachGroups.map((coach) => renderOwnerCoachGroup(coach)).join("") || `<div class="empty">אין מאמנים להצגה</div>`}</div>
    </section>
  `;
}

function groupCoachesByUser(coaches) {
  const map = new Map();
  coaches.forEach((coach) => {
    const key = coach.user_id || coach.email || coach.id;
    if (!map.has(key)) map.set(key, { userId: coach.user_id || "", name: coach.name || coach.email || "מאמן", email: coach.email || "", assignments: [] });
    map.get(key).assignments.push(coach);
  });
  return Array.from(map.values()).sort((a, b) => a.email.localeCompare(b.email));
}

function renderOwnerCoachGroup(coach) {
  return `
    <div class="owner-coach-card">
      <div class="owner-coach-head">
        <div><strong>${escapeHtml(coach.name)}</strong><span dir="ltr">${escapeHtml(coach.email)}</span></div>
        <form class="reset-password-form" data-reset-coach="${escapeAttr(coach.userId)}">
          <input name="password" type="password" minlength="8" placeholder="סיסמה זמנית חדשה" />
          <button class="btn secondary" type="submit">איפוס סיסמה</button>
        </form>
      </div>
      <div class="owner-assignment-list">
        ${coach.assignments.map((assignment) => {
          const team = getOwnerAdminTeam(assignment.team_id);
          return `
            <div class="owner-admin-row">
              <span>${escapeHtml(team?.name || assignment.team_id)}</span>
              <select data-coach-role="${escapeAttr(assignment.id)}">${renderRoleOptions(assignment.role)}</select>
              <label class="checkbox-line"><input data-coach-active="${escapeAttr(assignment.id)}" type="checkbox" ${assignment.active !== false ? "checked" : ""}/> פעיל</label>
              <button class="btn secondary" type="button" data-save-coach-assignment="${escapeAttr(assignment.id)}">שמירה</button>
            </div>
          `;
        }).join("")}
      </div>
    </div>
  `;
}

function renderOwnerPlayersTab() {
  const { teams, players } = uiState.ownerAdmin;
  const selectedTeam = uiState.ownerAdmin.teamFilter === "all" ? teams[0]?.id || "" : uiState.ownerAdmin.teamFilter;
  const visiblePlayers = players.filter((player) => uiState.ownerAdmin.teamFilter === "all" || player.team_id === uiState.ownerAdmin.teamFilter);
  return `
    <section class="owner-admin-grid">
      <article class="surface owner-admin-panel">
        <div class="section-title"><h3>הוספת שחקן</h3><span>PIN בן 4 ספרות</span></div>
        <form id="ownerCreatePlayerForm" class="grid">
          <select name="teamId" required>${renderTeamOptions(teams, selectedTeam)}</select>
          <input name="playerName" required placeholder="שם שחקן" />
          <select name="playerPosition">${renderPositionOptions("", true)}</select>
          <input name="playerPin" inputmode="numeric" maxlength="4" pattern="[0-9]{4}" required placeholder="PIN" />
          <button class="btn primary" type="submit">הוסף שחקן</button>
        </form>
      </article>
      <article class="surface owner-admin-panel wide">
        <div class="section-title">
          <h3>שחקנים</h3>
          <select id="ownerPlayerTeamFilter" aria-label="סינון לפי קבוצה">
            <option value="all" ${uiState.ownerAdmin.teamFilter === "all" ? "selected" : ""}>כל הקבוצות</option>
            ${teams.map((team) => `<option value="${escapeAttr(team.id)}" ${uiState.ownerAdmin.teamFilter === team.id ? "selected" : ""}>${escapeHtml(team.name)}</option>`).join("")}
          </select>
        </div>
        <div class="owner-admin-list">
          ${visiblePlayers.map((player) => {
            const key = `${player.team_id}::${player.id}`;
            return `
              <div class="owner-admin-row player-row">
                <span>${escapeHtml(getOwnerAdminTeam(player.team_id)?.name || "קבוצה")}</span>
                <input data-owner-player-name="${escapeAttr(key)}" value="${escapeAttr(player.name)}" />
                <select data-owner-player-position="${escapeAttr(key)}">${renderPositionOptions(player.position || "", true)}</select>
                <input data-owner-player-pin="${escapeAttr(key)}" inputmode="numeric" maxlength="4" pattern="[0-9]{4}" value="${escapeAttr(player.pin_code || "")}" aria-label="PIN" />
                <label class="checkbox-line"><input data-owner-player-active="${escapeAttr(key)}" type="checkbox" ${player.active !== false ? "checked" : ""}/> פעיל</label>
                <button class="btn secondary" type="button" data-save-owner-player="${escapeAttr(key)}">שמירה</button>
              </div>
            `;
          }).join("") || `<div class="empty">אין שחקנים להצגה</div>`}
        </div>
      </article>
    </section>
  `;
}

function renderOwnerPermissionsTab() {
  return `
    <section class="owner-admin-grid">
      <article class="surface owner-admin-panel wide">
        <div class="section-title"><h3>מודל הרשאות</h3><span>Action first, data scoped by team</span></div>
        <div class="permission-grid">
          ${permissionCard("Owner", "גישה מלאה לכל הקבוצות, יצירת קבוצות, מאמנים ושחקנים, ניהול הרשאות.", "green")}
          ${permissionCard("Team Admin", "ניהול הקבוצה המשויכת: שחקנים, PINים, הגדרות ודוחות.", "blue")}
          ${permissionCard("Coach", "צפייה בנתוני קבוצה, דוחות, GPS והעלאת נתוני GPS.", "yellow")}
          ${permissionCard("Viewer", "צפייה בלבד. אין שמירה או עריכה.", "neutral")}
        </div>
      </article>
      <article class="surface owner-admin-panel wide">
        <div class="section-title"><h3>בעלי מערכת</h3><span>${uiState.ownerAdmin.owners.length} Owners</span></div>
        <div class="owner-admin-list">
          ${uiState.ownerAdmin.owners.map((owner) => `
            <div class="owner-admin-row">
              <strong>${escapeHtml(owner.name || "Owner")}</strong>
              <span dir="ltr">${escapeHtml(owner.email || "")}</span>
              <span class="badge ${owner.active !== false ? "green" : "neutral"}">${owner.active !== false ? "פעיל" : "לא פעיל"}</span>
            </div>
          `).join("") || `<div class="empty">אין Owners להצגה</div>`}
        </div>
        <p class="muted-text">יצירת Owner חדש דורשת יצירת Supabase Auth user ואז הוספה ל-platform_owners דרך SQL מאובטח.</p>
      </article>
    </section>
  `;
}

function permissionCard(title, body, tone) {
  return `<div class="permission-card ${escapeAttr(tone)}"><strong>${escapeHtml(title)}</strong><p>${escapeHtml(body)}</p></div>`;
}

function renderRoleOptions(selectedRole) {
  return TEAM_ROLES.map((role) => `<option value="${escapeAttr(role)}" ${selectedRole === role ? "selected" : ""}>${escapeHtml(getRoleLabel(role))}</option>`).join("");
}

function renderTeamOptions(teams, selected = "") {
  return teams.map((team) => `<option value="${escapeAttr(team.id)}" ${selected === team.id ? "selected" : ""}>${escapeHtml(team.name)}</option>`).join("");
}

function bindOwnerAdminPage() {
  document.getElementById("refreshOwnerAdmin")?.addEventListener("click", () => {
    uiState.ownerAdmin.notice = "";
    loadOwnerAdminSnapshot();
  });
  document.querySelectorAll("[data-owner-admin-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      uiState.ownerAdmin.tab = button.getAttribute("data-owner-admin-tab") || "teams";
      uiState.ownerAdmin.notice = "";
      renderOwnerAdminPage();
    });
  });
  bindOwnerTeamForms();
  bindOwnerCoachForms();
  bindOwnerPlayerForms();
}

function setOwnerAdminNotice(message) {
  uiState.ownerAdmin.notice = message;
  uiState.ownerAdmin.error = "";
}

function setOwnerAdminError(error) {
  uiState.ownerAdmin.error = error.message || String(error || "שגיאה בניהול מערכת");
  uiState.ownerAdmin.notice = "";
}

function bindOwnerTeamForms() {
  document.getElementById("ownerCreateTeamForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    try {
      const teamRows = await supabaseInsert("teams", {
        name: String(data.get("teamName") || "").trim(),
        slug: String(data.get("teamSlug") || "").trim(),
        active: true
      });
      const team = Array.isArray(teamRows) ? teamRows[0] : null;
      if (team?.id) {
        await supabaseUpsert("settings", [{ ...toSupabaseSettings(DEFAULT_SETTINGS), team_id: team.id }], "team_id");
        await supabaseUpsert("pain_areas", DEFAULT_PAIN_AREAS.map((name, index) => ({ team_id: team.id, name, sort_order: index, active: true })), "team_id,name");
      }
      setOwnerAdminNotice("הקבוצה נוצרה בהצלחה.");
      await loadOwnerAdminSnapshot();
    } catch (error) {
      setOwnerAdminError(error);
      renderOwnerAdminPage();
    }
  });
  document.querySelectorAll("[data-save-team]").forEach((button) => {
    button.addEventListener("click", async () => {
      const teamId = button.getAttribute("data-save-team");
      try {
        await supabasePatch("teams", `id=eq.${encodeURIComponent(teamId)}`, {
          name: document.querySelector(`[data-team-name="${cssEscape(teamId)}"]`)?.value || "",
          slug: document.querySelector(`[data-team-slug="${cssEscape(teamId)}"]`)?.value || "",
          active: Boolean(document.querySelector(`[data-team-active="${cssEscape(teamId)}"]`)?.checked)
        });
        setOwnerAdminNotice("פרטי הקבוצה נשמרו.");
        await loadOwnerAdminSnapshot();
      } catch (error) {
        setOwnerAdminError(error);
        renderOwnerAdminPage();
      }
    });
  });
}

function bindOwnerCoachForms() {
  document.getElementById("ownerCreateCoachForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const assignments = Array.from(form.querySelectorAll('input[name="teamIds"]:checked')).map((input) => ({
      teamId: input.value,
      role: form.querySelector(`select[name="role-${input.value}"]`)?.value || "coach"
    }));
    try {
      await ownerAdminApi("createCoach", {
        name: String(data.get("coachName") || "").trim(),
        email: String(data.get("coachEmail") || "").trim(),
        password: String(data.get("coachPassword") || ""),
        assignments
      });
      setOwnerAdminNotice("משתמש המאמן נוצר ושויך לקבוצות.");
      await loadOwnerAdminSnapshot();
    } catch (error) {
      setOwnerAdminError(error);
      renderOwnerAdminPage();
    }
  });
  document.getElementById("ownerAssignCoachForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const coach = groupCoachesByUser(uiState.ownerAdmin.coaches).find((item) => item.userId === data.get("coachUser"));
    if (!coach) return;
    try {
      await supabaseUpsert("coaches", [{
        team_id: String(data.get("teamId")),
        user_id: coach.userId,
        name: coach.name,
        email: coach.email,
        role: String(data.get("role") || "coach"),
        active: true
      }], "team_id,user_id");
      setOwnerAdminNotice("השיוך נוסף.");
      await loadOwnerAdminSnapshot();
    } catch (error) {
      setOwnerAdminError(error);
      renderOwnerAdminPage();
    }
  });
  document.querySelectorAll("[data-save-coach-assignment]").forEach((button) => {
    button.addEventListener("click", async () => {
      const coachId = button.getAttribute("data-save-coach-assignment");
      try {
        await supabasePatch("coaches", `id=eq.${encodeURIComponent(coachId)}`, {
          role: document.querySelector(`[data-coach-role="${cssEscape(coachId)}"]`)?.value || "coach",
          active: Boolean(document.querySelector(`[data-coach-active="${cssEscape(coachId)}"]`)?.checked)
        });
        setOwnerAdminNotice("הרשאת המאמן נשמרה.");
        await loadOwnerAdminSnapshot();
      } catch (error) {
        setOwnerAdminError(error);
        renderOwnerAdminPage();
      }
    });
  });
  document.querySelectorAll("[data-reset-coach]").forEach((form) => {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const userId = form.getAttribute("data-reset-coach");
      const password = new FormData(form).get("password");
      try {
        await ownerAdminApi("resetCoachPassword", { userId, password });
        setOwnerAdminNotice("הסיסמה אופסה בהצלחה.");
        await loadOwnerAdminSnapshot();
      } catch (error) {
        setOwnerAdminError(error);
        renderOwnerAdminPage();
      }
    });
  });
}

function bindOwnerPlayerForms() {
  document.getElementById("ownerPlayerTeamFilter")?.addEventListener("change", (event) => {
    uiState.ownerAdmin.teamFilter = event.currentTarget.value || "all";
    renderOwnerAdminPage();
  });
  document.getElementById("ownerCreatePlayerForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    try {
      await supabaseUpsert("players", [{
        team_id: String(data.get("teamId")),
        id: createId("player"),
        name: String(data.get("playerName") || "").trim(),
        active: true,
        position: normalizePlayerPosition(data.get("playerPosition")),
        pin_code: normalizePin(data.get("playerPin"))
      }], "team_id,id");
      setOwnerAdminNotice("השחקן נוסף לקבוצה.");
      await loadOwnerAdminSnapshot();
    } catch (error) {
      setOwnerAdminError(error);
      renderOwnerAdminPage();
    }
  });
  document.querySelectorAll("[data-save-owner-player]").forEach((button) => {
    button.addEventListener("click", async () => {
      const key = button.getAttribute("data-save-owner-player");
      const [teamId, playerId] = key.split("::");
      try {
        await supabasePatch("players", `team_id=eq.${encodeURIComponent(teamId)}&id=eq.${encodeURIComponent(playerId)}`, {
          name: document.querySelector(`[data-owner-player-name="${cssEscape(key)}"]`)?.value || "",
          position: normalizePlayerPosition(document.querySelector(`[data-owner-player-position="${cssEscape(key)}"]`)?.value || ""),
          pin_code: normalizePin(document.querySelector(`[data-owner-player-pin="${cssEscape(key)}"]`)?.value || ""),
          active: Boolean(document.querySelector(`[data-owner-player-active="${cssEscape(key)}"]`)?.checked)
        });
        setOwnerAdminNotice("פרטי השחקן נשמרו.");
        await loadOwnerAdminSnapshot();
      } catch (error) {
        setOwnerAdminError(error);
        renderOwnerAdminPage();
      }
    });
  });
}

function renderSettingsPage() {
  const demoCounts = getDemoDatasetCounts(state);
  const demoAnchorDate = getDemoDatasetAnchorDate(state);
  const canManage = canManageCurrentTeam();
  const html = coachShell("settings", `
    <div class="page-header premium-header">
      <div>
        <span class="eyebrow">מערכת</span>
        <h2>הגדרות</h2>
        <p>שחקנים, PIN אישי, אזורי כאב וספי התראה</p>
      </div>
      ${canManage ? `<button class="btn primary" type="button" id="reseedMonthDemo">טעינה / רענון חודש דמו</button>` : ""}
    </div>

    <section class="surface demo-dataset-panel">
      <div>
        <span class="eyebrow">Demo Dataset v${DEMO_DATASET_VERSION}</span>
        <h3>חודש פעילות מלא לבדיקה</h3>
        <p>הטעינה מרעננת רק רשומות עם מזהי דמו ידועים. שחקנים, דוחות ונתוני GPS אמיתיים נשארים ללא שינוי.</p>
      </div>
      <div class="demo-dataset-counts">
        <span><b>${demoCounts.players}</b> שחקנים</span>
        <span><b>${demoCounts.sessions}</b> פעילויות</span>
        <span><b>${demoCounts.readinessReports}</b> דוחות מוכנות</span>
        <span><b>${demoCounts.rpeReports}</b> דוחות RPE</span>
        <span><b>${demoCounts.gpsRecords}</b> רשומות GPS</span>
      </div>
      <small>${demoAnchorDate ? `מעוגן לתאריך ${escapeHtml(formatDateDisplay(demoAnchorDate))}` : "חודש הדמו טרם נטען"} · מצב שמירה: ${isSupabaseMode() ? "Supabase" : "Local demo"}</small>
    </section>

    ${renderStorageDiagnosticsPanel()}

    <section class="settings-grid">
      <div class="surface">
        <div class="compact-form">
          <div class="section-title">
            <h3>רשימת שחקנים</h3>
            <span>${state.players.length} שחקנים</span>
          </div>
          ${canManage ? `<form id="addPlayerForm" class="grid four">
            <input name="playerName" required placeholder="שם שחקן" />
            <select name="playerPosition" aria-label="עמדה">
              ${renderPositionOptions("", true)}
            </select>
            <input name="playerPin" inputmode="numeric" maxlength="4" pattern="[0-9]{4}" placeholder="PIN" />
            <button class="btn primary" type="submit">הוסף שחקן</button>
          </form>` : `<p class="muted-text">אין לך הרשאה לעריכת שחקנים בקבוצה זו.</p>`}
          <div>
            ${state.players.map((player) => renderPlayerSettingsRow(player, canManage)).join("")}
          </div>
        </div>
      </div>

      <div class="surface">
        <div class="compact-form">
          <div class="section-title">
            <h3>ספי התראה</h3>
          </div>
          ${canManage ? `<form id="thresholdForm" class="grid">
            ${thresholdInput("rpeHigh", "RPE גבוה", state.settings.rpeHigh, 1, 10)}
            ${thresholdInput("fatigueHigh", "עייפות גבוהה", state.settings.fatigueHigh, 1, 5)}
            ${thresholdInput("sorenessHigh", "כאבי שריר גבוהים", state.settings.sorenessHigh, 1, 5)}
            ${thresholdInput("sleepHoursLow", "שינה נמוכה", state.settings.sleepHoursLow, 0, 12, 0.5)}
            ${thresholdInput("sleepQualityLow", "איכות שינה נמוכה", state.settings.sleepQualityLow, 1, 5)}
            ${thresholdInput("readinessRiskScore", "ציון מוכנות מסוכן", state.settings.readinessRiskScore, 0, 100)}
            <button class="btn primary" type="submit">שמור ספים</button>
          </form>` : `<p class="muted-text">ספי ההתראה זמינים לצפייה בלבד בהרשאה הנוכחית.</p>`}
        </div>
      </div>
    </section>

    <section class="section surface">
      <div class="compact-form">
        <div class="section-title">
          <h3>אזורי כאב</h3>
          <span>${state.painAreas.length} אזורים</span>
        </div>
        ${canManage ? `<form id="addPainForm" class="grid two">
          <input name="painArea" required placeholder="אזור כאב" />
          <button class="btn primary" type="submit">הוסף אזור</button>
        </form>` : ""}
        <div>
          ${state.painAreas.map((area, index) => renderPainAreaRow(area, index, canManage)).join("")}
        </div>
      </div>
    </section>
  `);

  mount(html, bindSettingsPage);
}

function bindSettingsPage() {
  document.getElementById("reseedMonthDemo")?.addEventListener("click", async (event) => {
    if (!confirm("לטעון מחדש חודש דמו מלא? רק רשומות דמו מזוהות ירועננו; נתונים אמיתיים לא יימחקו.")) return;
    const button = event.currentTarget;
    button.disabled = true;
    button.textContent = isSupabaseMode() ? "טוען ל-Supabase..." : "טוען נתוני דמו...";
    await resetDemoState();
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
  document.getElementById("addPlayerForm")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get("playerName") || "").trim();
    if (!name) return;
    state.players.push({ id: createId("p"), name, active: true, position: normalizePlayerPosition(data.get("playerPosition")), pin: normalizePin(data.get("playerPin") || "1234") });
    saveState();
    renderSettingsPage();
  });
  document.getElementById("thresholdForm")?.addEventListener("submit", (event) => {
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
  document.getElementById("addPainForm")?.addEventListener("submit", (event) => {
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
      const positionInput = document.querySelector(`[data-player-position="${cssEscape(playerId)}"]`);
      const activeInput = document.querySelector(`[data-player-active="${cssEscape(playerId)}"]`);
      state.players = state.players.map((player) => {
        if (player.id !== playerId) return player;
        return {
          ...player,
          name: String(nameInput.value || player.name).trim(),
          pin: normalizePin(pinInput.value || player.pin),
          position: normalizePlayerPosition(positionInput.value || ""),
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

function renderCoachTeamSwitcher() {
  const teams = getCoachTeams().filter((team) => team.active !== false);
  if (teams.length <= 1) return "";
  return `
    <label class="coach-team-switcher">
      <span class="coach-sidebar-label">קבוצה פעילה</span>
      <select data-team-switcher aria-label="בחירת קבוצה פעילה">
        ${teams.map((team) => `<option value="${escapeAttr(team.id)}" ${team.id === getActiveTeamId() ? "selected" : ""}>${escapeHtml(team.name)} · ${escapeHtml(getRoleLabel(team.role))}</option>`).join("")}
      </select>
    </label>
  `;
}

function coachShell(active, content) {
  const navItems = [
    ["home", "/coach", "תדרוך יומי", "home"],
    ["players", "/coach/players", "שחקנים", "users"],
    ["gps", "/coach/gps", "GPS", "satellite"],
    ["reports", "/coach/reports", "דוחות", "clipboard"],
    ["calendar", "/coach/calendar", "לוח שנה", "calendar"],
    ["analytics", "/coach/analytics", "ניתוחים", "chart"],
    ["settings", "/coach/settings", "הגדרות", "settings"],
    ...(isPlatformOwner() ? [["admin", "/coach/admin", "ניהול מערכת", "shield"]] : []),
    ["report", "/report", "כניסת שחקן", "log-in"]
  ];
  const activeItem = navItems.find(([id]) => id === active);
  const pageTitle = activeItem ? activeItem[2] : "מרכז מאמן";
  const collapsed = getCoachSidebarCollapsed();
  return `
    <div class="app-frame coach-app ${collapsed ? "sidebar-collapsed" : ""}" data-coach-shell>
      <aside class="coach-sidebar" id="coachSidebar" aria-label="ניווט צוות מקצועי">
        <div class="coach-sidebar-head">
          <a href="/coach" data-route class="coach-sidebar-brand" aria-label="דוח RPE קבוצתי">
            <span class="coach-sidebar-mark" aria-hidden="true">R</span>
            <span class="coach-sidebar-brand-copy">
              <strong>דוח RPE קבוצתי</strong>
              <small>מרכז מאמן</small>
            </span>
          </a>
          <button type="button" class="sidebar-collapse-button" data-sidebar-collapse aria-label="${collapsed ? "הרחבת סרגל הניווט" : "צמצום סרגל הניווט"}" aria-expanded="${collapsed ? "false" : "true"}">
            ${coachNavIcon(collapsed ? "panel-open" : "panel-close")}
          </button>
        </div>

        <nav class="coach-sidebar-nav" aria-label="ניווט ראשי">
          ${navItems.map(([id, href, label, icon], index) => `
            <a href="${href}" data-route class="coach-sidebar-link ${id === "report" ? "player-entry" : ""} ${active === id ? "active" : ""}" aria-current="${active === id ? "page" : "false"}" data-nav-label="${escapeAttr(label)}" ${id === "report" ? `style="--nav-order: ${index}"` : ""}>
              ${coachNavIcon(icon)}
              <span class="coach-sidebar-label">${escapeHtml(label)}</span>
            </a>
          `).join("")}
        </nav>
        <div class="coach-sidebar-account">
          <span>${escapeHtml(getActiveTeamName())}</span>
          <strong>${escapeHtml(getActiveCoachName())}</strong>
          ${renderCoachTeamSwitcher()}
          <small class="coach-role-label">${escapeHtml(getRoleLabel(getActiveTeamRole()))}</small>
          ${isSupabaseMode() ? `<button type="button" class="sidebar-logout-button" data-coach-logout>${coachNavIcon("log-out")}<span class="coach-sidebar-label">יציאה</span></button>` : ""}
        </div>
      </aside>

      <button type="button" class="coach-sidebar-overlay" data-sidebar-overlay aria-label="סגירת תפריט"></button>

      <div class="coach-workspace">
        <header class="coach-workspace-header">
          <button type="button" class="mobile-sidebar-button" data-sidebar-mobile-toggle aria-label="פתיחת תפריט" aria-controls="coachSidebar" aria-expanded="false">
            ${coachNavIcon("menu")}
          </button>
          <div class="coach-workspace-title">
            <span>${escapeHtml(pageTitle)}</span>
            <small>${escapeHtml(getActiveTeamName())} · ${escapeHtml(getRoleLabel(getActiveTeamRole()))} · ${escapeHtml(getActiveCoachName())} · ${escapeHtml(formatDateDisplay(todayIso()))}</small>
          </div>
        </header>
        <main class="page coach-page">${content}</main>
      </div>
    </div>
  `;
}

function getCoachSidebarCollapsed() {
  try {
    return localStorage.getItem(COACH_SIDEBAR_STATE_KEY) === "1";
  } catch (error) {
    return false;
  }
}

function coachNavIcon(name) {
  const icons = {
    home: '<path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M9 20v-6h6v6"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    satellite: '<path d="M13 7 9 3 5 7l4 4"/><path d="m17 11 4 4-4 4-4-4"/><path d="m8 12-4 4 4 4 4-4"/><path d="m16 8 3-3"/><path d="M2 22 7 17"/>',
    clipboard: '<rect width="14" height="18" x="5" y="3" rx="2"/><path d="M9 3V1h6v2"/><path d="M9 8h6M9 12h6M9 16h4"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-5"/>',
    calendar: '<rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/><path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/>',
    chart: '<path d="M3 3v18h18"/><path d="m7 16 4-5 4 3 5-7"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56V21h-4v-.08A1.7 1.7 0 0 0 8.94 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15 1.7 1.7 0 0 0 3.08 14H3v-4h.08A1.7 1.7 0 0 0 4.6 8.94a1.7 1.7 0 0 0-.34-1.88L4.2 7l2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.6 1.7 1.7 0 0 0 10 3.08V3h4v.08A1.7 1.7 0 0 0 15.06 4.6a1.7 1.7 0 0 0 1.88-.34L17 4.2 19.8 7l-.06.06A1.7 1.7 0 0 0 19.4 9 1.7 1.7 0 0 0 20.92 10H21v4h-.08A1.7 1.7 0 0 0 19.4 15Z"/>',
    "log-in": '<path d="M10 17l5-5-5-5"/><path d="M15 12H3"/><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>',
    "log-out": '<path d="M14 17l5-5-5-5"/><path d="M19 12H8"/><path d="M10 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    "panel-close": '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M15 3v18M10 9l-3 3 3 3"/>',
    "panel-open": '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M15 3v18M8 9l3 3-3 3"/>'
  };
  return `<svg class="coach-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || icons.home}</svg>`;
}

function bindCoachNavigation() {
  const shell = document.querySelector("[data-coach-shell]");
  if (!shell) return;
  const sidebar = shell.querySelector(".coach-sidebar");
  const collapseButton = shell.querySelector("[data-sidebar-collapse]");
  const mobileButton = shell.querySelector("[data-sidebar-mobile-toggle]");
  const overlay = shell.querySelector("[data-sidebar-overlay]");

  const setMobileOpen = (open) => {
    shell.classList.toggle("sidebar-mobile-open", open);
    mobileButton?.setAttribute("aria-expanded", String(open));
    document.body.classList.toggle("coach-menu-open", open);
  };

  collapseButton?.addEventListener("click", () => {
    const collapsed = shell.classList.toggle("sidebar-collapsed");
    collapseButton.setAttribute("aria-expanded", String(!collapsed));
    collapseButton.setAttribute("aria-label", collapsed ? "הרחבת סרגל הניווט" : "צמצום סרגל הניווט");
    collapseButton.innerHTML = coachNavIcon(collapsed ? "panel-open" : "panel-close");
    try {
      localStorage.setItem(COACH_SIDEBAR_STATE_KEY, collapsed ? "1" : "0");
    } catch (error) {
      console.warn("[UI] לא ניתן לשמור את מצב סרגל הניווט", error);
    }
  });

  mobileButton?.addEventListener("click", () => setMobileOpen(!shell.classList.contains("sidebar-mobile-open")));
  overlay?.addEventListener("click", () => setMobileOpen(false));
  sidebar?.querySelectorAll("a[data-route]").forEach((link) => link.addEventListener("click", () => setMobileOpen(false)));
  shell.querySelector("[data-team-switcher]")?.addEventListener("change", async (event) => {
    await switchActiveCoachTeam(event.currentTarget.value);
  });
  shell.querySelector("[data-coach-logout]")?.addEventListener("click", async () => {
    await supabaseAuthLogout();
    clearCoachSession();
    navigate("/coach/login", true);
  });
}

async function switchActiveCoachTeam(teamId) {
  const teams = getCoachTeams();
  const team = teams.find((item) => item.id === teamId);
  if (!team || !coachSession) return;
  saveCoachSession({
    ...coachSession,
    coachId: team.coachId || coachSession.coachId,
    teamId: team.id,
    teamName: team.name,
    teamSlug: team.slug || slugify(team.name),
    role: isPlatformOwner() ? "owner" : team.role || "coach"
  });
  setPlayerTeamContext({ teamId: team.id, teamName: team.name, teamSlug: team.slug || slugify(team.name) });
  state = createEmptyState();
  supabaseStatus = "idle";
  supabaseFatalError = false;
  supabaseError = "";
  await bootstrapSupabaseState();
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

function renderPlayerSettingsRow(player, canManage = true) {
  return `
    <div class="inline-edit player-settings-row">
      <input data-player-name="${escapeAttr(player.id)}" value="${escapeAttr(player.name)}" ${canManage ? "" : "readonly"} />
      <select data-player-position="${escapeAttr(player.id)}" aria-label="עמדה" ${canManage ? "" : "disabled"}>
        ${renderPositionOptions(player.position || getPlayerPrimaryPosition(player.id), true)}
      </select>
      <input data-player-pin="${escapeAttr(player.id)}" inputmode="numeric" maxlength="4" pattern="[0-9]{4}" value="${escapeAttr(player.pin)}" aria-label="PIN" ${canManage ? "" : "readonly"} />
      <label class="checkbox-line">
        <input data-player-active="${escapeAttr(player.id)}" type="checkbox" ${player.active ? "checked" : ""} ${canManage ? "" : "disabled"} />
        פעיל
      </label>
      ${canManage ? `<div class="actions">
        <button class="btn secondary" type="button" data-save-player="${escapeAttr(player.id)}">שמירה</button>
        <button class="btn danger" type="button" data-delete-player="${escapeAttr(player.id)}">מחיקה</button>
      </div>` : `<span class="badge neutral">צפייה</span>`}
    </div>
  `;
}

function renderPainAreaRow(area, index, canManage = true) {
  const cannotDelete = area === NO_PAIN;
  return `
    <div class="inline-edit">
      <input data-pain-index="${index}" value="${escapeAttr(area)}" ${cannotDelete || !canManage ? "readonly" : ""} />
      <span></span>
      ${canManage ? `<div class="actions">
        <button class="btn secondary" type="button" data-save-pain="${index}" ${cannotDelete ? "disabled" : ""}>שמירה</button>
        <button class="btn danger" type="button" data-delete-pain="${index}" ${cannotDelete ? "disabled" : ""}>מחיקה</button>
      </div>` : `<span class="badge neutral">צפייה</span>`}
    </div>
  `;
}

function renderCommentsList(comments) {
  if (!comments.length) return `<div class="surface empty">אין הערות מהדוחות</div>`;
  return `
    <div class="surface mini-list">
      ${comments.map((report) => `
        <div class="mini-row">
          <span>${escapeHtml(formatDateDisplay(report.date))} · ${report.rpe !== undefined ? "דוח RPE" : "דוח מוכנות"}</span>
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
  const selectedValue = selected === null || selected === undefined || selected === "" ? "" : Number(selected);
  return `
    <input type="hidden" name="${escapeAttr(name)}" id="${escapeAttr(name)}" value="${escapeAttr(selectedValue)}" />
    <div class="scale-control ${count === 10 ? "ten" : ""}" data-scale="${escapeAttr(name)}">
      ${Array.from({ length: count }, (_, index) => {
        const value = min + index;
        return `<button class="scale-button ${value === selectedValue ? "is-selected" : ""}" type="button" data-scale-value="${value}" aria-pressed="${value === selectedValue ? "true" : "false"}">${value}</button>`;
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
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
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
  const select = document.getElementById("painArea");
  const side = document.getElementById("painSide");
  const intensity = document.getElementById("painIntensity");
  document.querySelectorAll("[data-pain-area]").forEach((button) => {
    button.addEventListener("click", () => {
      const area = button.getAttribute("data-pain-area");
      if (select) select.value = area;
      updateBodyMapSelection(area);
      updatePainDetails(area);
    });
  });
  if (select) select.addEventListener("change", () => {
    updateBodyMapSelection(select.value);
    updatePainDetails(select.value);
  });
  if (side) side.addEventListener("change", () => updatePainSummary());
  if (intensity) intensity.addEventListener("change", () => updatePainSummary());
  if (select) updatePainDetails(select.value);
}

function updateBodyMapSelection(area) {
  document.querySelectorAll("[data-pain-area]").forEach((button) => {
    button.classList.toggle("is-selected", button.getAttribute("data-pain-area") === area);
  });
}

function updatePainDetails(area) {
  const hasPain = area && area !== NO_PAIN;
  const panel = document.getElementById("painDetailsPanel");
  const side = document.getElementById("painSide");
  const intensity = document.getElementById("painIntensity");
  const detailed = document.getElementById("detailedPainArea");
  if (panel) panel.classList.toggle("is-hidden", !hasPain);
  if (side) {
    side.disabled = !hasPain;
    if (hasPain && !side.value) side.value = "דו צדדי";
    if (!hasPain) side.value = "";
  }
  if (intensity) {
    intensity.disabled = !hasPain;
    if (!hasPain) resetScale("painIntensity", "");
  }
  if (detailed) detailed.value = hasPain ? area : "";
  hidePainValidation();
  updatePainSummary();
}

function updatePainSummary() {
  const area = document.getElementById("painArea")?.value || NO_PAIN;
  const side = document.getElementById("painSide")?.value || "";
  const intensity = document.getElementById("painIntensity")?.value || "";
  const selectedArea = document.getElementById("painSelectedArea");
  const selectedSide = document.getElementById("painSelectedSide");
  const selectedIntensity = document.getElementById("painSelectedIntensity");
  if (selectedArea) selectedArea.textContent = area && area !== NO_PAIN ? area : "אין כאב";
  if (selectedSide) selectedSide.textContent = area && area !== NO_PAIN ? side || "לא נבחר" : "לא נדרש";
  if (selectedIntensity) selectedIntensity.textContent = area && area !== NO_PAIN ? intensity ? `${intensity}/10` : "לא נבחר" : "לא נדרש";
}

function showPainValidation(message) {
  const validation = document.getElementById("painValidation");
  if (validation) {
    validation.textContent = message;
    validation.classList.add("show");
  }
}

function hidePainValidation() {
  const validation = document.getElementById("painValidation");
  if (validation) {
    validation.textContent = "";
    validation.classList.remove("show");
  }
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
  if (report.painArea && report.painArea !== NO_PAIN) flags.push(`כאב ב${report.painArea}`);
  if (Number(report.painIntensity) >= 8) flags.push("עוצמת כאב גבוהה");
  else if (Number(report.painIntensity) >= 6) flags.push("עוצמת כאב בינונית");
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
  if (report.painArea && report.painArea !== NO_PAIN) score -= 10;
  if (Number(report.painIntensity) >= 8) score -= 20;
  else if (Number(report.painIntensity) >= 6) score -= 10;
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
  if (score >= 60) return { label: "דורש מעקב", short: "מעקב", tone: "yellow" };
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
  const session = getPlayerSession();
  if (!session?.playerId) return null;
  if (session.teamId && session.teamId !== getActiveTeamId()) return null;
  return state.players.find((player) => player.id === session.playerId && player.active) || {
    id: session.playerId,
    teamId: session.teamId || getActiveTeamId(),
    name: session.playerName || "שחקן",
    active: true,
    pin: session.pin || "",
    position: ""
  };
}

function getPlayerSession() {
  try {
    const raw = localStorage.getItem(PLAYER_SESSION_KEY);
    if (!raw) return null;
    if (!raw.trim().startsWith("{")) return { playerId: raw, teamId: getActiveTeamId() };
    const parsed = JSON.parse(raw);
    return parsed && parsed.playerId ? parsed : null;
  } catch (error) {
    return null;
  }
}

function setLoggedPlayer(player, pin = "") {
  localStorage.setItem(PLAYER_SESSION_KEY, JSON.stringify({
    playerId: player.id,
    playerName: player.name,
    teamId: getActiveTeamId(),
    teamName: getActiveTeamName(),
    pin: normalizePin(pin || player.pin || ""),
    loggedAt: new Date().toISOString()
  }));
}

function getActivePlayers() {
  return state.players.filter((player) => player.active);
}

function getPlayer(playerId) {
  return state.players.find((player) => player.id === playerId) || null;
}

function normalizePlayerPosition(position) {
  const value = String(position || "").trim();
  if (!value) return "";
  const lower = value.toLowerCase();
  const aliases = new Map([
    ["goalkeeper", "שוער"],
    ["gk", "שוער"],
    ["שוער", "שוער"],
    ["defender", "בלם"],
    ["center back", "בלם"],
    ["centre back", "בלם"],
    ["cb", "בלם"],
    ["בלם", "בלם"],
    ["full back", "מגן"],
    ["fullback", "מגן"],
    ["fb", "מגן"],
    ["מגן", "מגן"],
    ["midfielder", "קשר"],
    ["midfield", "קשר"],
    ["cm", "קשר"],
    ["קשר", "קשר"],
    ["winger", "כנף"],
    ["wing", "כנף"],
    ["כנף", "כנף"],
    ["striker", "חלוץ"],
    ["forward", "חלוץ"],
    ["st", "חלוץ"],
    ["חלוץ", "חלוץ"]
  ]);
  return aliases.get(lower) || (PLAYER_POSITIONS.some(([label]) => label === value) ? value : value);
}

function renderPositionOptions(selected, includeEmpty = true) {
  const normalized = normalizePlayerPosition(selected);
  return `
    ${includeEmpty ? `<option value="">עמדה לא מוגדרת</option>` : ""}
    ${PLAYER_POSITIONS.map(([label]) => `<option value="${escapeAttr(label)}" ${normalized === label ? "selected" : ""}>${escapeHtml(label)}</option>`).join("")}
  `;
}

function getPlayerPrimaryPosition(playerId) {
  const player = getPlayer(playerId);
  if (player && player.position) return normalizePlayerPosition(player.position);
  const gps = state.gpsRecords.filter((record) => record.playerId === playerId && record.position);
  if (!gps.length) return "";
  const counts = new Map();
  gps.forEach((record) => {
    const position = normalizePlayerPosition(record.position);
    counts.set(position, (counts.get(position) || 0) + 1);
  });
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
  state.gpsRecords = state.gpsRecords.map((record) => {
    const player = getPlayer(record.playerId);
    return player ? { ...record, playerName: player.name, position: normalizePlayerPosition(record.position || player.position || "") } : record;
  });
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

function renderAccessDenied() {
  mount(coachShell("admin", `
    <section class="surface empty-state admin-denied">
      <span class="eyebrow">הרשאות</span>
      <h2>אין הרשאה לניהול מערכת</h2>
      <p>אזור זה פתוח רק למשתמשי Owner של הפלטפורמה.</p>
      <a href="/coach" data-route class="btn primary">חזרה לתדרוך יומי</a>
    </section>
  `));
}
