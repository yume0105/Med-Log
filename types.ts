
export interface Medication {
  id: string;
  name: string;
  dosage: string;
  times: string[];
  color: string;
}

export interface SideEffect {
  id: string;
  time: string;
  text: string;
}

export interface DailyLog {
  date: string; // YYYY-MM-DD
  takenIds: string[]; // Format: "medId_time" (e.g., "uuid_08:00")
  sideEffects?: SideEffect[]; // List of side effects with timestamps
}

export interface AppState {
  medications: Medication[];
  logs: DailyLog[];
}
