
export interface Task {
  id: string;
  title: string;
  description?: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  creditMinutes: number;
  completedAt?: number;
  isPunishment?: boolean;
  isCompleted?: boolean;
}

export interface AppUsage {
  name: string;
  minutesUsed: number;
  limitMinutes: number;
}

export interface CircleMember {
  name: string;
  tasksCompleted: number;
  screenTimeHours: number;
  userColor: string;
  isMe?: boolean;
}

export interface Circle {
  id: string;
  name: string;
  inviteCode: string;
  members: CircleMember[];
}

export interface AppState {
  dailyAllowanceRemaining: number;
  totalDebt: number;
  tasks: Task[];
  appUsage: AppUsage[];
  lastUsedTimestamp: number;
  // Rotting session timing
  rotLastUpdatedAt: number | null;
  // New Settings
  dailyLimitSeconds: number;
  distractionApps: string[];
  recoveryApps: string[];
  customApps: string[];
  userName: string;
  userColor: string;
  userAddedTaskHistory: string[];
  // Social Circles
  activeCircleId: string | null;
  circles: Circle[];
}

export enum View {
  DUTIES = 'DUTIES',
  ANCHOR = 'ANCHOR',
  SOCIAL = 'SOCIAL'
}
