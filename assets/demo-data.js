export const DEMO_DATA_PREFIX = "demo-month-";
export const DEMO_DATASET_VERSION = 1;

export const MONTH_DEMO_PLAYERS = [
  demoPlayer(1, "נועם לוי", "שוער", 82.4),
  demoPlayer(2, "איתי פרץ", "שוער", 85.1),
  demoPlayer(3, "עומר כהן", "בלם", 79.6),
  demoPlayer(4, "דניאל ביטון", "בלם", 82.2),
  demoPlayer(5, "רועי אברהם", "בלם", 80.4),
  demoPlayer(6, "יונתן מזרחי", "בלם", 83.1),
  demoPlayer(7, "יואב דהן", "מגן", 74.5),
  demoPlayer(8, "אביב אזולאי", "מגן", 72.8),
  demoPlayer(9, "שחר בן דוד", "מגן", 75.2),
  demoPlayer(10, "תומר מלכה", "מגן", 73.6),
  demoPlayer(11, "אלון גבאי", "קשר", 72.4),
  demoPlayer(12, "גיא שלום", "קשר", 76.1),
  demoPlayer(13, "ברק סויסה", "קשר", 74.8),
  demoPlayer(14, "רז חדד", "קשר", 71.9),
  demoPlayer(15, "יהלי אוחנה", "קשר", 73.3),
  demoPlayer(16, "ליאם אדרי", "כנף", 69.7),
  demoPlayer(17, "איתמר בוסקילה", "כנף", 70.5),
  demoPlayer(18, "עידו דיין", "כנף", 68.9),
  demoPlayer(19, "ניב אלקיים", "חלוץ", 78.2),
  demoPlayer(20, "מאור יצחק", "חלוץ", 76.4),
  demoPlayer(21, "אריאל חזן", "חלוץ", 80.1),
  demoPlayer(22, "דור רפאלי", "חלוץ", 77.3)
];

const POSITION_GPS_PROFILE = {
  "שוער": { dpm: 55, hsrPerMinute: 0.3, sprintShare: 0.08, maxSpeed: 27.2, accelPerMinute: 0.28 },
  "בלם": { dpm: 101, hsrPerMinute: 3.1, sprintShare: 0.2, maxSpeed: 30.4, accelPerMinute: 0.43 },
  "מגן": { dpm: 112, hsrPerMinute: 6.4, sprintShare: 0.32, maxSpeed: 33.1, accelPerMinute: 0.55 },
  "קשר": { dpm: 118, hsrPerMinute: 4.8, sprintShare: 0.23, maxSpeed: 32.1, accelPerMinute: 0.58 },
  "כנף": { dpm: 111, hsrPerMinute: 7.1, sprintShare: 0.36, maxSpeed: 34.2, accelPerMinute: 0.57 },
  "חלוץ": { dpm: 106, hsrPerMinute: 6.5, sprintShare: 0.38, maxSpeed: 34.6, accelPerMinute: 0.51 }
};

const MATCH_DEFINITIONS = [
  { competition: "ליגה", round: "מחזור 8", opponent: "הפועל השרון", homeAway: "בית", result: "2-1", activityType: "match" },
  { competition: "גביע המדינה", round: "סיבוב ח׳", opponent: "מכבי העמק", homeAway: "חוץ", result: "1-0", activityType: "match" },
  { competition: "ידידות / משחק אימון", round: "הכנה", opponent: "עירוני הדרום", homeAway: "בית", result: "3-2", activityType: "training_match" },
  { competition: "ליגה", round: "מחזור 9", opponent: "מכבי החוף", homeAway: "חוץ", result: "1-1", activityType: "match" }
];

const PHASE_DEFINITIONS = [
  { key: "md4", relation: "MD-4", dayOffset: -4, duration: 78, factor: 0.84, title: "כוח, משחקונים ועבודה אירובית", sessionType: "אימון" },
  { key: "md3", relation: "MD-3", dayOffset: -3, duration: 82, factor: 1.04, title: "אימון עצימות גבוהה", sessionType: "אימון" },
  { key: "md2", relation: "MD-2", dayOffset: -2, duration: 70, factor: 0.78, title: "טקטיקה וקצב משחק", sessionType: "אימון" },
  { key: "md1", relation: "MD-1", dayOffset: -1, duration: 52, factor: 0.55, title: "הכנה טקטית ומצבים נייחים", sessionType: "אימון" },
  { key: "match", relation: "MATCH", dayOffset: 0, duration: 90, factor: 1.12, title: "משחק", sessionType: "משחק" },
  { key: "mdp1", relation: "MD+1", dayOffset: 1, duration: 46, factor: 0.44, title: "התאוששות והשלמת נפח", sessionType: "השלמת נפח" }
];

export function createMonthDemoDataset(baseDate) {
  const players = MONTH_DEMO_PLAYERS.map((player) => ({ ...player }));
  const schedule = buildMonthSchedule(baseDate);
  const completedActivities = schedule.filter((activity) => !activity.planned);
  const minutesByActivity = new Map(schedule.map((activity) => [activity.id, buildPlayerMinutes(activity, players)]));
  const gpsSessions = schedule.map((activity) => buildGpsSession(activity));
  const sessions = schedule.map((activity) => buildCoachSession(activity, minutesByActivity.get(activity.id)));
  const gpsRecords = [];
  const readinessReports = [];
  const reports = [];

  completedActivities.forEach((activity) => {
    players.forEach((player) => {
      const minutes = minutesByActivity.get(activity.id)[player.id] || 0;
      if (shouldCreateGpsRecord(activity, player, minutes)) {
        const fullRecord = buildGpsRecord(activity, player, minutes, "משחק מלא", baseDate);
        gpsRecords.push(fullRecord);
        if (activity.phase === "match" && minutes >= 45) {
          gpsRecords.push(...buildMatchHalfRecords(fullRecord, activity, player));
        }
      }
      if (!shouldSkipReadiness(activity, player)) {
        readinessReports.push(buildReadinessReport(activity, player, baseDate));
      }
      if (!shouldSkipRpe(activity, player)) {
        reports.push(buildRpeReport(activity, player, minutes, baseDate));
      }
    });
  });

  return {
    schemaVersion: 3,
    seededAt: new Date().toISOString(),
    demoDataset: {
      id: `${DEMO_DATA_PREFIX}full-squad-v${DEMO_DATASET_VERSION}`,
      version: DEMO_DATASET_VERSION,
      anchorDate: baseDate,
      label: "חודש דמו מלא"
    },
    players,
    readinessReports,
    reports,
    sessions,
    gpsSessions,
    gpsRecords,
    calendarLoadPlans: buildFutureLoadPlans(baseDate)
  };
}

export function isMonthDemoId(value) {
  return String(value || "").startsWith(DEMO_DATA_PREFIX);
}

export function isLegacyBuiltInDemoId(value) {
  const id = String(value || "");
  return /^p[1-9]$/.test(id)
    || /^(pre-demo-|post-demo-|gps-demo-|gps-full-|gps-first-|gps-second-|s-today|s-yesterday|s-game|s-rest|s-train-5|s-prev)/.test(id);
}

function demoPlayer(index, name, position, baseWeight) {
  return {
    id: `${DEMO_DATA_PREFIX}player-${String(index).padStart(2, "0")}`,
    name,
    active: true,
    pin: String(1000 + index),
    position,
    baseWeight,
    demo: true
  };
}

function buildMonthSchedule(baseDate) {
  const matchOffsets = [-22, -15, -8, -1];
  const activities = [];
  matchOffsets.forEach((matchOffset, weekIndex) => {
    const match = MATCH_DEFINITIONS[weekIndex];
    PHASE_DEFINITIONS.forEach((phase, phaseIndex) => {
      const date = addDays(baseDate, matchOffset + phase.dayOffset);
      const isMatch = phase.key === "match";
      const activityType = isMatch ? match.activityType : "training";
      const sessionName = isMatch
        ? `${match.competition === "ידידות / משחק אימון" ? "משחק אימון" : `משחק ${match.competition}`} · ${match.round} מול ${match.opponent}`
        : `${phase.relation} · ${phase.title}`;
      activities.push({
        id: `${DEMO_DATA_PREFIX}activity-w${weekIndex + 1}-${phase.key}`,
        sequence: weekIndex * PHASE_DEFINITIONS.length + phaseIndex,
        weekIndex,
        phase: phase.key,
        relation: phase.relation,
        date,
        duration: phase.duration,
        factor: phase.factor,
        sessionType: phase.sessionType,
        sessionName,
        activityType,
        competition: isMatch ? match.competition : "",
        matchRound: isMatch ? match.round : "",
        opponent: isMatch ? match.opponent : "",
        homeAway: isMatch ? match.homeAway : "",
        result: isMatch ? match.result : "",
        format: isMatch && match.activityType === "training_match" ? "11v11" : "",
        planned: false
      });
    });
  });

  const futureMatch = { competition: "ליגה", round: "מחזור 10", opponent: "הפועל הגליל", homeAway: "בית", result: "", activityType: "match" };
  [
    { phase: "md4", offset: 2, duration: 78, factor: 0.84, title: "MD-4 · כוח ומשחקונים", sessionType: "אימון" },
    { phase: "md3", offset: 3, duration: 82, factor: 1.02, title: "MD-3 · עצימות גבוהה", sessionType: "אימון" },
    { phase: "md2", offset: 4, duration: 70, factor: 0.78, title: "MD-2 · טקטיקה", sessionType: "אימון" },
    { phase: "md1", offset: 5, duration: 52, factor: 0.55, title: "MD-1 · הכנה למשחק", sessionType: "אימון" },
    { phase: "match", offset: 6, duration: 90, factor: 1.12, title: `משחק ליגה · ${futureMatch.round} מול ${futureMatch.opponent}`, sessionType: "משחק" }
  ].forEach((item, index) => {
    const isMatch = item.phase === "match";
    activities.push({
      id: `${DEMO_DATA_PREFIX}planned-${item.phase}`,
      sequence: 100 + index,
      weekIndex: 4,
      phase: item.phase,
      relation: isMatch ? "MATCH" : item.phase.toUpperCase().replace("MD", "MD-"),
      date: addDays(baseDate, item.offset),
      duration: item.duration,
      factor: item.factor,
      sessionType: item.sessionType,
      sessionName: item.title,
      activityType: isMatch ? "match" : "training",
      competition: isMatch ? futureMatch.competition : "",
      matchRound: isMatch ? futureMatch.round : "",
      opponent: isMatch ? futureMatch.opponent : "",
      homeAway: isMatch ? futureMatch.homeAway : "",
      result: "",
      format: "",
      planned: true
    });
  });
  return activities.sort((a, b) => a.date.localeCompare(b.date));
}

function buildGpsSession(activity) {
  return {
    id: `${DEMO_DATA_PREFIX}gps-${activity.id.replace(DEMO_DATA_PREFIX, "")}`,
    date: activity.date,
    sessionName: activity.sessionName,
    type: activity.activityType === "match" ? "match" : "training",
    activityType: activity.activityType,
    competition: activity.competition,
    matchRound: activity.matchRound,
    opponent: activity.opponent,
    homeAway: activity.homeAway,
    result: activity.result,
    matchDayRelation: activity.relation,
    format: activity.format,
    notes: `[DEMO חודש מלא] ${activity.planned ? "פעילות מתוכננת" : "נתוני GPS סינתטיים לצורכי הדגמה"}`,
    demo: true,
    planned: activity.planned
  };
}

function buildCoachSession(activity, playerMinutes) {
  return {
    id: `${DEMO_DATA_PREFIX}session-${activity.id.replace(DEMO_DATA_PREFIX, "")}`,
    date: activity.date,
    sessionType: activity.sessionType,
    defaultMinutes: activity.duration,
    notes: `[DEMO חודש מלא] ${activity.sessionName}`,
    playerMinutes,
    demo: true,
    planned: activity.planned
  };
}

function buildPlayerMinutes(activity, players) {
  return Object.fromEntries(players.map((player) => [player.id, getPlayerMinutes(activity, player)]));
}

function getPlayerMinutes(activity, player) {
  const number = playerNumber(player);
  if (activity.phase === "match") return getMatchMinutes(activity.weekIndex, number);
  if (activity.phase === "mdp1") {
    const previousMinutes = getMatchMinutes(activity.weekIndex, number);
    return previousMinutes >= 60 ? 42 : previousMinutes > 0 ? 50 : 60;
  }
  let minutes = activity.duration - Math.round(deterministicRange(`${activity.id}-${player.id}-minutes`, 0, 7));
  if (number === 5) {
    if (activity.weekIndex === 0) return Math.round(activity.duration * 0.25);
    if (activity.weekIndex === 1) return Math.round(activity.duration * 0.5);
    if (activity.weekIndex === 2) return Math.round(activity.duration * 0.75);
  }
  if (number === 14 && activity.weekIndex === 3) minutes = Math.round(minutes * 0.62);
  return Math.max(20, minutes);
}

function getMatchMinutes(weekIndex, playerNumberValue) {
  if (playerNumberValue <= 2) {
    const startingGoalkeeper = weekIndex === 2 ? 2 : 1;
    return playerNumberValue === startingGoalkeeper ? 90 : 0;
  }
  if (playerNumberValue === 5) return [0, 20, 45, 70][weekIndex] || 0;
  const outfieldIndex = playerNumberValue - 3;
  const rotatedRank = (outfieldIndex - weekIndex * 3 + 20) % 20;
  let minutes = rotatedRank < 10 ? 90 : rotatedRank < 13 ? 30 : rotatedRank < 16 ? 15 : 0;
  if (weekIndex === 2 && minutes === 90) minutes = 60;
  if (weekIndex === 3) {
    const overrides = { 11: 90, 14: 35, 16: 80, 17: 90, 19: 65, 20: 25, 22: 20 };
    if (overrides[playerNumberValue] !== undefined) minutes = overrides[playerNumberValue];
  }
  return minutes;
}

function shouldCreateGpsRecord(activity, player, minutes) {
  if (minutes <= 0) return false;
  return !(activity.phase === "mdp1" && activity.weekIndex === 3 && playerNumber(player) === 11);
}

function buildGpsRecord(activity, player, minutes, period, baseDate) {
  const profile = POSITION_GPS_PROFILE[player.position];
  const offset = dayDifference(baseDate, activity.date);
  const key = `${activity.id}-${player.id}`;
  let performanceFactor = deterministicRange(`${key}-performance`, 0.94, 1.07);
  const number = playerNumber(player);
  if (number === 14 && activity.weekIndex === 3) performanceFactor *= 0.72;
  if (number === 11 && offset === -3) performanceFactor *= 0.76;
  if (number === 11 && offset === -2) performanceFactor *= 1.25;
  if (number === 11 && offset === -1) performanceFactor *= 1.14;
  if (number === 17 && activity.phase === "match") performanceFactor *= 1.08;

  const phaseFactor = activity.phase === "match" ? activity.factor : activity.phase === "mdp1" ? 0.64 : activity.factor;
  const distancePerMinute = round(profile.dpm * phaseFactor * performanceFactor, 1);
  const totalDistance = Math.round(distancePerMinute * minutes);
  const highSpeedRunning = Math.round(minutes * profile.hsrPerMinute * phaseFactor * performanceFactor);
  const distanceAbove18 = Math.round(highSpeedRunning * deterministicRange(`${key}-above18`, 0.74, 0.84));
  const distanceAbove25 = Math.round(highSpeedRunning * profile.sprintShare * deterministicRange(`${key}-sprint`, 0.88, 1.12));
  const intensity = round(clamp(phaseFactor * 7.2 * deterministicRange(`${key}-intensity`, 0.96, 1.05), 2.2, 9.5), 1);
  const maxSpeed = round(profile.maxSpeed + (activity.phase === "match" ? 0.8 : activity.phase === "mdp1" ? -2.2 : 0) + deterministicRange(`${key}-speed`, -0.7, 0.8), 1);
  const accelerations = Math.max(3, Math.round(minutes * profile.accelPerMinute * Math.sqrt(phaseFactor) * deterministicRange(`${key}-acc`, 0.9, 1.12)));
  const decelerations = Math.max(3, Math.round(accelerations * deterministicRange(`${key}-dec`, 0.88, 1.12)));
  const metabolicActivity = round(totalDistance * (intensity / 10) * 0.0028, 1);
  const hmld = Math.round(highSpeedRunning * 1.14 + (accelerations + decelerations) * 4.5);
  const gpsLoad = Math.round(totalDistance * 0.05 + highSpeedRunning * 0.38 + (accelerations + decelerations) * 2.2 + intensity * 10);
  const workRestRatio = round(clamp(0.75 + phaseFactor * 0.72 + deterministicRange(`${key}-wr`, -0.08, 0.1), 0.8, 2.1), 2);
  return {
    id: `${DEMO_DATA_PREFIX}gps-record-${activity.sequence}-${String(number).padStart(2, "0")}-full`,
    gpsSessionId: `${DEMO_DATA_PREFIX}gps-${activity.id.replace(DEMO_DATA_PREFIX, "")}`,
    playerId: player.id,
    playerName: player.name,
    position: player.position,
    period,
    minutesPlayed: minutes,
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
    decelerations,
    demo: true
  };
}

function buildMatchHalfRecords(full, activity, player) {
  const firstMinutes = Math.ceil(full.minutesPlayed / 2);
  const secondMinutes = Math.floor(full.minutesPlayed / 2);
  const number = playerNumber(player);
  const drop = number === 17 && activity.weekIndex === 3 ? 0.76 : deterministicRange(`${activity.id}-${player.id}-half-drop`, 0.88, 0.98);
  const firstDpm = round((full.distancePerMinute * 2) / (1 + drop), 1);
  const secondDpm = round(firstDpm * drop, 1);
  const firstShare = firstMinutes / Math.max(1, full.minutesPlayed);
  return [
    scaleGpsRecord(full, "מחצית ראשונה", "first", firstMinutes, firstDpm, firstShare * 1.04, 1),
    scaleGpsRecord(full, "מחצית שנייה", "second", secondMinutes, secondDpm, (1 - firstShare) * 0.96, drop)
  ];
}

function scaleGpsRecord(full, period, suffix, minutes, distancePerMinute, share, intensityFactor) {
  const scale = (value) => Math.max(0, Math.round(Number(value) * share));
  return {
    ...full,
    id: full.id.replace(/-full$/, `-${suffix}`),
    period,
    minutesPlayed: minutes,
    totalDistance: Math.round(distancePerMinute * minutes),
    distancePerMinute,
    intensity: round(full.intensity * intensityFactor, 1),
    gpsLoad: scale(full.gpsLoad),
    metabolicActivity: round(full.metabolicActivity * share, 1),
    hmld: scale(full.hmld),
    highSpeedRunning: scale(full.highSpeedRunning),
    distanceAbove18: scale(full.distanceAbove18),
    distanceAbove25: scale(full.distanceAbove25),
    maxSpeed: round(full.maxSpeed * (suffix === "second" ? 0.97 : 1), 1),
    accelerations: scale(full.accelerations),
    decelerations: scale(full.decelerations)
  };
}

function shouldSkipReadiness(activity, player) {
  const number = playerNumber(player);
  if (number === 22) return activity.sequence % 3 !== 0 || activity.weekIndex === 3;
  if (number === 10 && activity.weekIndex === 3 && activity.phase === "mdp1") return true;
  return number === 10 && activity.sequence % 11 === 0;
}

function shouldSkipRpe(activity, player) {
  const number = playerNumber(player);
  if (number === 22) return activity.sequence % 4 !== 0 || activity.weekIndex === 3;
  if (number === 9 && activity.weekIndex === 3 && activity.phase === "mdp1") return true;
  return number === 9 && activity.sequence % 13 === 0;
}

function buildReadinessReport(activity, player, baseDate) {
  const number = playerNumber(player);
  const offset = dayDifference(baseDate, activity.date);
  const key = `${activity.id}-${player.id}-readiness`;
  let sleepHours = round(deterministicRange(`${key}-sleep`, 6.6, 8.3), 1);
  let sleepQuality = sleepHours >= 7.3 ? 4 : sleepHours >= 6.2 ? 3 : 2;
  let energy = activity.phase === "mdp1" ? 3 : 4;
  let mood = 4;
  let soreness = activity.phase === "mdp1" ? 3 : activity.phase === "match" ? 2 : 2;
  let loadFeeling = activity.phase === "mdp1" ? 3 : 2;
  let painArea = "אין כאב";
  let detailedPainArea = "";
  let painSide = "";
  let painIntensity = null;
  let medicalLimitation = false;
  let comments = "";

  if (number === 12 && offset >= -3) {
    const trend = { "-3": 6.6, "-2": 6, "-1": 5.5, "0": 5 };
    sleepHours = trend[String(offset)] ?? 5;
    sleepQuality = offset >= -1 ? 2 : 3;
    energy = offset >= -1 ? 2 : 3;
    comments = "כמה לילות עם שינה לא רציפה";
  }
  if (number === 16 && offset >= -5) {
    painArea = "המסטרינג";
    detailedPainArea = "המסטרינג אחורי";
    painSide = "ימין";
    painIntensity = offset === -1 ? 7 : offset === 0 ? 6 : 4;
    soreness = Math.max(soreness, 4);
    loadFeeling = 4;
    comments = "רגישות חוזרת בריצה מהירה";
  }
  if (number === 19 && (offset === -7 || offset === 0)) {
    painArea = "מפשעה";
    detailedPainArea = "מקרבים / מפשעה";
    painSide = "שמאל";
    painIntensity = offset === 0 ? 6 : 4;
    soreness = 4;
    comments = "רגישות לאחר המשחק";
  }
  if (number === 5 && offset <= -14) {
    painArea = "ברך";
    detailedPainArea = "ברך קדמית";
    painSide = "ימין";
    painIntensity = offset < -20 ? 6 : 4;
    medicalLimitation = true;
    energy = 3;
    loadFeeling = 4;
    comments = "חזרה הדרגתית לפעילות לפי התוכנית";
  }
  if (number === 14 && offset >= -4) {
    sleepHours = Math.min(sleepHours, 5.7);
    sleepQuality = 2;
    energy = 2;
    mood = 2;
    soreness = 4;
    loadFeeling = 4;
    comments = "מרגיש עייפות כללית אבל ללא כאב נקודתי";
  }
  if (number === 11 && offset >= -2) {
    sleepHours = 8.1;
    sleepQuality = 5;
    energy = 5;
    mood = 5;
    soreness = 1;
    loadFeeling = 1;
    comments = "מרגיש חד ומוכן";
  }

  return {
    id: `${DEMO_DATA_PREFIX}readiness-${activity.date}-${String(number).padStart(2, "0")}`,
    playerId: player.id,
    playerName: player.name,
    createdAt: createdAt(activity.date, 8, number),
    date: activity.date,
    sleepHours,
    sleepQuality,
    energy,
    mood,
    soreness,
    painArea,
    detailedPainArea,
    painSide,
    painIntensity,
    loadFeeling,
    bodyWeight: getDemoBodyWeight(activity, player),
    medicalLimitation,
    comments,
    demo: true
  };
}

function buildRpeReport(activity, player, minutes, baseDate) {
  const number = playerNumber(player);
  const offset = dayDifference(baseDate, activity.date);
  const key = `${activity.id}-${player.id}-rpe`;
  const didNotParticipate = activity.phase === "match" && minutes === 0;
  const baseRpe = { md4: 6, md3: 7, md2: 5, md1: 3, match: 8, mdp1: 3 }[activity.phase] || 5;
  let rpe = didNotParticipate ? 1 : clamp(Math.round(baseRpe + deterministicRange(`${key}-rpe`, -0.7, 0.8)), 1, 10);
  let fatigue = didNotParticipate ? 1 : clamp(Math.round(1 + rpe / 2.5 + deterministicRange(`${key}-fatigue`, -0.6, 0.5)), 1, 5);
  let soreness = activity.phase === "match" || activity.phase === "mdp1" ? 3 : 2;
  let painArea = "אין כאב";
  let detailedPainArea = "";
  let painSide = "";
  let painIntensity = null;
  let completedFullSession = didNotParticipate ? "לא" : "מלא";
  let comments = "";

  if (number === 11 && offset === -1) {
    rpe = 9;
    fatigue = 4;
    comments = "משחק בעצימות גבוהה מאוד";
  }
  if (number === 17 && activity.phase === "match" && activity.weekIndex === 3) {
    rpe = 9;
    fatigue = 5;
    comments = "ירידה בקצב לקראת הסיום";
  }
  if (number === 16 && offset >= -5) {
    painArea = "המסטרינג";
    detailedPainArea = "המסטרינג אחורי";
    painSide = "ימין";
    painIntensity = offset === -1 ? 8 : offset === 0 ? 6 : 5;
    soreness = 4;
    completedFullSession = offset >= -1 ? "חלקי" : completedFullSession;
    comments = "רגישות בספרינטים";
  }
  if (number === 19 && activity.phase === "match" && (offset === -8 || offset === -1)) {
    painArea = "מפשעה";
    detailedPainArea = "מקרבים / מפשעה";
    painSide = "שמאל";
    painIntensity = offset === -1 ? 7 : 5;
    soreness = 4;
    completedFullSession = "חלקי";
    comments = "הרגשתי משיכה קלה אחרי שינוי כיוון";
  }
  if (number === 5 && offset <= -14) {
    painArea = "ברך";
    detailedPainArea = "ברך קדמית";
    painSide = "ימין";
    painIntensity = 4;
    completedFullSession = "חלקי";
    rpe = Math.min(rpe, 5);
    comments = "עבודה מדורגת במסגרת חזרה לפעילות";
  }
  if (number === 14 && offset >= -4) {
    fatigue = 4;
    soreness = 4;
    comments = "עייפות כללית, ללא כאב נקודתי";
  }

  const hydrationLossPercent = getHydrationLossPercent(activity, number, key, offset);
  const preTrainingWeight = getDemoBodyWeight(activity, player);
  const bodyWeightAfter = round(preTrainingWeight * (1 - hydrationLossPercent / 100), 2);
  return {
    id: `${DEMO_DATA_PREFIX}rpe-${activity.date}-${String(number).padStart(2, "0")}`,
    playerId: player.id,
    playerName: player.name,
    createdAt: createdAt(activity.date, 18, number),
    date: activity.date,
    sessionType: activity.sessionType,
    rpe,
    fatigue,
    soreness,
    painArea,
    detailedPainArea,
    painSide,
    painIntensity,
    completedFullSession,
    bodyWeightAfter,
    comments,
    demo: true
  };
}

function getHydrationLossPercent(activity, playerNumberValue, key, offset) {
  if (offset === 0 && playerNumberValue === 8) return 1.45;
  if (offset === 0 && playerNumberValue === 17) return 2.35;
  if (offset === 0 && playerNumberValue === 20) return 1.68;
  if (offset === -8 && playerNumberValue === 8) return 2.18;
  if (offset === -15 && playerNumberValue === 20) return 2.42;
  const base = activity.phase === "match" ? 1.05 : activity.phase === "md3" ? 0.82 : activity.phase === "mdp1" ? 0.42 : 0.62;
  return round(clamp(base + deterministicRange(`${key}-hydration`, -0.25, 0.3), 0.15, 1.35), 2);
}

function buildFutureLoadPlans(baseDate) {
  return {
    [addDays(baseDate, 2)]: { gpsLoad: 3, rpeLoad: 3 },
    [addDays(baseDate, 3)]: { gpsLoad: 4, rpeLoad: 4 },
    [addDays(baseDate, 4)]: { gpsLoad: 3, rpeLoad: 3 },
    [addDays(baseDate, 5)]: { gpsLoad: 2, rpeLoad: 2 },
    [addDays(baseDate, 6)]: { gpsLoad: 5, rpeLoad: 5 }
  };
}

function getDemoBodyWeight(activity, player) {
  return round(player.baseWeight + deterministicRange(`${activity.id}-${player.id}-body-weight`, -0.35, 0.35), 2);
}

function playerNumber(player) {
  return Number(String(player.id).slice(-2)) || 0;
}

function createdAt(date, hour, playerNumberValue) {
  const minute = String((playerNumberValue * 3) % 60).padStart(2, "0");
  return new Date(`${date}T${String(hour).padStart(2, "0")}:${minute}:00Z`).toISOString();
}

function addDays(isoDate, amount) {
  const date = new Date(`${isoDate}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
}

function dayDifference(baseDate, date) {
  const base = new Date(`${baseDate}T12:00:00Z`).getTime();
  const current = new Date(`${date}T12:00:00Z`).getTime();
  return Math.round((current - base) / 86400000);
}

function deterministicRange(key, minimum, maximum) {
  let hash = 2166136261;
  for (let index = 0; index < key.length; index += 1) {
    hash ^= key.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  const unit = (hash >>> 0) / 4294967295;
  return minimum + (maximum - minimum) * unit;
}

function round(value, digits = 0) {
  const factor = 10 ** digits;
  return Math.round(Number(value) * factor) / factor;
}

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}
