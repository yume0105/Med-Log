
export interface Medication {
  id: string;
  name: string;
  dosage: string;
  times: string[]; // Changed from time: string to times: string[]
  color: string;
}

export interface DailyLog {
  date: string; // YYYY-MM-DD
  takenIds: string[]; // Format: "medId_time" (e.g., "uuid_08:00")
}

export interface AppState {
  medications: Medication[];
  logs: DailyLog[];
}
