export interface Activity {
  id: string;
  appName: string;
  windowTitle: string;
  processId: number;
  executablePath: string;
  startTime: string;
  endTime: string;
  activeTime: number;
  idleTime: number;
  category: string;
  createdAt: string;
}

export interface Heartbeat {
  appName: string;
  windowTitle: string;
  processId: number;
  executablePath: string;
  idleSeconds: number;
  isIdle: boolean;
  currentSessionActiveSeconds: number;
  isMonitoring: boolean;
  timestamp: string;
}

export interface StatsSummary {
  totalActiveSeconds: number;
  totalIdleSeconds: number;
  totalTrackedSeconds: number;
  productivityScore: number;
  activitiesCount: number;
  topAppName: string;
}

export interface HourlyStat {
  hour: number;
  activeSeconds: number;
  idleSeconds: number;
}

export interface TopApp {
  appName: string;
  activeSeconds: number;
  idleSeconds: number;
  percentage: number;
  category: string;
}

export interface CategoryStat {
  category: string;
  activeSeconds: number;
  percentage: number;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  matchPattern: string;
  productive: boolean;
  weight: number;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  roleTitle: string;
  dailyGoalHours: number;
  workStartHour: number;
  workEndHour: number;
  theme: string;
}

export interface DeepWorkStats {
  deepWorkSeconds: number;
  longestStreakSeconds: number;
  longestStreakApp: string;
  contextSwitchesPerHour: number;
  focusRating: string;
  flowScore: number;
}

export interface ProjectBreakdown {
  projectName: string;
  category: string;
  activeSeconds: number;
  percentage: number;
  primaryApp: string;
}

export interface WellbeingStats {
  coreHoursSeconds: number;
  overtimeSeconds: number;
  longestStretchWithoutBreakSeconds: number;
  breakCount: number;
  burnoutRisk: string;
  fatigueWarning: boolean;
}

export interface ProcessResource {
  pid: number;
  name: string;
  cpuPercent: number;
  memoryMb: number;
  isForeground: boolean;
}

export interface SystemResourceSummary {
  timestamp: string;
  totalCpuPercent: number;
  totalMemoryMb: number;
  usedMemoryMb: number;
  totalMemoryPercent: number;
  foregroundCpuPercent: number;
  backgroundCpuPercent: number;
  foregroundMemoryMb: number;
  backgroundMemoryMb: number;
  backgroundDrainRatio: number;
  resourceHogsCount: number;
  topProcesses: ProcessResource[];
}

export interface UpdateInfo {
  currentVersion: string;
  latestVersion: string;
  hasUpdate: boolean;
  releaseName: string;
  releaseNotes: string;
  publishedAt: string;
  releaseUrl: string;
  downloadUrl: string;
  assetName: string;
  assetSize: number;
  checkedAt: string;
}