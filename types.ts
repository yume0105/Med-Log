
export type MedicationType = 'continuous' | 'period' | 'temporary';
export type TimeSlot = 'morning' | 'afternoon' | 'evening';

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  type: MedicationType;
  slots: TimeSlot[]; // For scheduled meds
  endDate?: string;  // For 'period' type
  color: string;
}

export interface SideEffect {
  id: string;
  time: string;
  text: string;
}

export interface TemporaryTake {
  id: string;
  medId: string;
  time: string;
}

export interface DailyLog {
  date: string; // YYYY-MM-DD
  takenIds: string[]; // Format: "medId_slot"
  sideEffects?: SideEffect[];
  temporaryTakes?: TemporaryTake[]; // History of temporary med takes
}

export interface AppState {
  medications: Medication[];
  logs: DailyLog[];
}
