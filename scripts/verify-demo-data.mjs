import { createMonthDemoDataset, DEMO_DATA_PREFIX } from "../assets/demo-data.js";

const anchorDate = "2026-06-19";
const data = createMonthDemoDataset(anchorDate);

function assert(condition, message) {
  if (!condition) throw new Error(`DEMO_DATA_INVALID: ${message}`);
}

function assertUniqueIds(rows, label) {
  const ids = rows.map((item) => item.id);
  assert(ids.length === new Set(ids).size, `${label} contains duplicate ids`);
  assert(ids.every((id) => String(id).startsWith(DEMO_DATA_PREFIX)), `${label} contains an unmarked demo id`);
}

assert(data.players.length >= 20 && data.players.length <= 24, "player count must be between 20 and 24");
assert(new Set(data.players.map((player) => player.position)).size === 6, "all six supported positions must exist");
assert(data.players.every((player) => /^\d{4}$/.test(player.pin)), "every player must have a four-digit PIN");

const completedGpsSessions = data.gpsSessions.filter((session) => !session.planned);
const plannedGpsSessions = data.gpsSessions.filter((session) => session.planned);
assert(completedGpsSessions.length === 24, "four weeks must contain 24 completed activities");
assert(plannedGpsSessions.length === 5, "future microcycle must contain five planned activities");
assert(completedGpsSessions.filter((session) => session.matchDayRelation === "MATCH").length === 4, "four completed matches are required");
assert(completedGpsSessions.filter((session) => session.matchDayRelation === "MD+1").length === 4, "four recovery sessions are required");
assert(completedGpsSessions.filter((session) => ["MD-4", "MD-3", "MD-2", "MD-1"].includes(session.matchDayRelation)).length === 16, "four weekly training microcycles are required");
assert(new Set(completedGpsSessions.map((session) => session.competition).filter(Boolean)).has("גביע המדינה"), "cup match is missing");
assert(completedGpsSessions.some((session) => session.activityType === "training_match"), "friendly match is missing");

const fullGpsRecords = data.gpsRecords.filter((record) => record.period === "משחק מלא");
const requiredGpsMetrics = [
  "minutesPlayed", "totalDistance", "distancePerMinute", "intensity", "gpsLoad", "metabolicActivity", "hmld",
  "highSpeedRunning", "distanceAbove18", "distanceAbove25", "maxSpeed", "workRestRatio", "accelerations", "decelerations"
];
assert(fullGpsRecords.length > 400, "not enough full GPS records");
assert(fullGpsRecords.every((record) => requiredGpsMetrics.every((metric) => Number(record[metric]) > 0)), "GPS records contain missing metrics");

const average = (values) => values.reduce((total, value) => total + Number(value || 0), 0) / Math.max(1, values.length);
const wingerHsr = average(fullGpsRecords.filter((record) => record.position === "כנף").map((record) => record.highSpeedRunning));
const defenderHsr = average(fullGpsRecords.filter((record) => record.position === "בלם").map((record) => record.highSpeedRunning));
const midfielderDistance = average(fullGpsRecords.filter((record) => record.position === "קשר").map((record) => record.totalDistance));
const goalkeeperDistance = average(fullGpsRecords.filter((record) => record.position === "שוער").map((record) => record.totalDistance));
assert(wingerHsr > defenderHsr, "winger HSR must be higher than center-back HSR");
assert(midfielderDistance > goalkeeperDistance, "midfielder distance must be higher than goalkeeper distance");

assert(data.readinessReports.length > 450, "not enough readiness reports");
assert(data.reports.length > 450, "not enough RPE reports");
const missingPlayerId = `${DEMO_DATA_PREFIX}player-22`;
assert(data.readinessReports.filter((report) => report.playerId === missingPlayerId).length < 10, "missing-report player has too many readiness reports");
assert(data.reports.filter((report) => report.playerId === missingPlayerId).length < 10, "missing-report player has too many RPE reports");

const hamstringPlayerId = `${DEMO_DATA_PREFIX}player-16`;
assert(data.readinessReports.filter((report) => report.playerId === hamstringPlayerId && report.painArea === "המסטרינג").length >= 4, "repeated hamstring pain is missing");
assert(data.reports.some((report) => report.playerId === hamstringPlayerId && report.painIntensity >= 8), "high hamstring pain intensity is missing");
const groinPlayerId = `${DEMO_DATA_PREFIX}player-19`;
assert(data.reports.filter((report) => report.playerId === groinPlayerId && report.painArea === "מפשעה").length >= 2, "post-match groin pain is missing");

const sleepPlayerId = `${DEMO_DATA_PREFIX}player-12`;
const sleepTrend = data.readinessReports
  .filter((report) => report.playerId === sleepPlayerId && report.date >= "2026-06-16")
  .sort((a, b) => a.date.localeCompare(b.date))
  .map((report) => report.sleepHours);
assert(sleepTrend.length >= 4 && sleepTrend.every((value, index) => index === 0 || value < sleepTrend[index - 1]), "decreasing sleep trend is missing");

const readinessByPlayerDate = new Map(data.readinessReports.map((report) => [`${report.playerId}-${report.date}`, report]));
const hydrationAlertsToday = data.reports
  .filter((report) => report.date === anchorDate)
  .map((report) => {
    const readiness = readinessByPlayerDate.get(`${report.playerId}-${report.date}`);
    if (!readiness || !readiness.bodyWeight || !report.bodyWeightAfter) return null;
    return ((readiness.bodyWeight - report.bodyWeightAfter) / readiness.bodyWeight) * 100;
  })
  .filter((value) => value !== null && value > 1);
assert(hydrationAlertsToday.length >= 3, "at least three current hydration alerts are required");
assert(hydrationAlertsToday.some((value) => value > 2), "high hydration loss above 2% is missing");

const highLoadPlayerId = `${DEMO_DATA_PREFIX}player-11`;
const latestMatchSession = completedGpsSessions.find((session) => session.date === "2026-06-18" && session.matchDayRelation === "MATCH");
const highLoadGps = fullGpsRecords.find((record) => record.gpsSessionId === latestMatchSession?.id && record.playerId === highLoadPlayerId);
const highRpe = data.reports.find((report) => report.date === "2026-06-18" && report.playerId === highLoadPlayerId);
assert(highLoadGps && highLoadGps.gpsLoad >= 800 && highRpe?.rpe >= 8, "high GPS load plus high RPE example is missing");

assert(Object.keys(data.calendarLoadPlans).length === 5, "future load plans are missing");
assert(new Set(data.gpsSessions.map((session) => session.date)).size >= 29, "calendar does not span enough activity dates");

assertUniqueIds(data.players, "players");
assertUniqueIds(data.readinessReports, "readiness reports");
assertUniqueIds(data.reports, "RPE reports");
assertUniqueIds(data.sessions, "sessions");
assertUniqueIds(data.gpsSessions, "GPS sessions");
assertUniqueIds(data.gpsRecords, "GPS records");

console.log("DEMO_DATA_OK", JSON.stringify({
  players: data.players.length,
  completedActivities: completedGpsSessions.length,
  plannedActivities: plannedGpsSessions.length,
  readinessReports: data.readinessReports.length,
  rpeReports: data.reports.length,
  gpsRecords: data.gpsRecords.length,
  hydrationAlertsToday: hydrationAlertsToday.length
}));
