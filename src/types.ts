export type SessionType = "אימון" | "משחק" | "השלמת נפח" | "מנוחה" | "פציעה";
export type FullSessionStatus = "מלא" | "חלקי" | "לא";

export interface Team {
  id: string;
  name: string;
  slug: string;
  active: boolean;
}

export interface Coach {
  id: string;
  teamId: string;
  userId: string | null;
  name: string;
  email: string | null;
  role: "owner" | "coach" | "viewer";
  active: boolean;
}

export interface Player {
  id: string;
  teamId?: string;
  name: string;
  active: boolean;
  pin: string;
  position?: string | null;
}

export interface ReadinessReport {
  id: string;
  playerId: string;
  playerName: string;
  createdAt: string;
  date: string;
  sleepHours: number;
  sleepQuality: number;
  energy: number;
  mood: number;
  soreness: number;
  painArea: string;
  loadFeeling: number;
  bodyWeight: number | null;
  medicalLimitation: boolean;
  comments: string;
}

export interface PostTrainingReport {
  id: string;
  playerId: string;
  playerName: string;
  createdAt: string;
  date: string;
  sessionType: SessionType;
  rpe: number;
  fatigue: number;
  soreness: number;
  painArea: string;
  completedFullSession: FullSessionStatus;
  bodyWeightAfter: number | null;
  comments: string;
}

export interface Session {
  id: string;
  date: string;
  sessionType: SessionType;
  defaultMinutes: number;
  notes: string;
  playerMinutes: Record<string, number>;
}

export interface GpsSession {
  id: string;
  date: string;
  sessionName: string;
  type: "match" | "training" | "training_match";
  activityType?: "match" | "training" | "training_match";
  competition?: string;
  matchRound?: string;
  opponent?: string;
  homeAway?: string;
  result?: string;
  matchDayRelation?: string;
  format?: string;
  notes: string;
}

export interface GpsRecord {
  id: string;
  gpsSessionId: string;
  playerId: string;
  playerName: string;
  position: string;
  period: "משחק מלא" | "מחצית ראשונה" | "מחצית שנייה";
  minutesPlayed: number;
  totalDistance: number;
  distancePerMinute: number;
  intensity: number;
  gpsLoad: number;
  metabolicActivity: number;
  hmld: number;
  highSpeedRunning: number;
  distanceAbove18: number;
  distanceAbove25: number;
  maxSpeed: number;
  workRestRatio: number;
  accelerations: number;
  decelerations: number;
}

export interface Injury {
  id: string;
  teamId: string;
  playerId: string;
  injuryDate: string;
  painArea: string;
  severity: "monitoring" | "attention" | "risk";
  status: "open" | "limited" | "resolved";
  notes: string;
}

export interface CoachNote {
  id: string;
  teamId: string;
  coachId: string | null;
  playerId: string | null;
  noteDate: string;
  category: string;
  note: string;
}

export interface Settings {
  rpeHigh: number;
  fatigueHigh: number;
  sorenessHigh: number;
  sleepHoursLow: number;
  sleepQualityLow: number;
  weeklyLoadJumpPercent: number;
  readinessRiskScore: number;
}

export interface ComputedReadinessReport extends ReadinessReport {
  hydration: HydrationResult | null;
  readinessScore: number;
  readinessStatus: StatusResult;
  riskFlags: string[];
}

export interface ComputedPostTrainingReport extends PostTrainingReport {
  minutes: number;
  trainingLoad: number;
  loadCategory: StatusResult;
  preTrainingWeight: number | null;
  sleepHours: number | null;
  sleepQuality: number | null;
  hydration: HydrationResult | null;
  riskFlags: string[];
}

export interface HydrationResult {
  preTrainingWeight: number;
  postTrainingWeight: number;
  lossKg: number;
  lossPercent: number;
  status: string;
  tone: "green" | "yellow" | "red";
}

export interface StatusResult {
  label: string;
  short?: string;
  tone: "green" | "yellow" | "red" | "neutral";
}

export interface AppState {
  schemaVersion: number;
  seededAt: string;
  team?: Team;
  players: Player[];
  painAreas: string[];
  settings: Settings;
  readinessReports: ReadinessReport[];
  reports: PostTrainingReport[];
  sessions: Session[];
  gpsSessions: GpsSession[];
  gpsRecords: GpsRecord[];
}
