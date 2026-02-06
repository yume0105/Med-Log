
export const MED_COLORS = [
  'bg-blue-500',
  'bg-emerald-500',
  'bg-rose-500',
  'bg-amber-500',
  'bg-purple-500',
  'bg-indigo-500'
];

export const TIME_SLOT_LABELS: Record<string, string> = {
  morning: '朝',
  afternoon: '昼',
  evening: '夜'
};

export const SLOT_TIMES: Record<string, string> = {
  morning: '08:00',
  afternoon: '12:00',
  evening: '20:00'
};

export const MED_TYPE_LABELS: Record<string, string> = {
  continuous: '期間なし',
  period: '期間あり',
  temporary: '一時的'
};

export const getTodayStr = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
