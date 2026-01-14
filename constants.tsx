
export const MED_COLORS = [
  'bg-blue-500',
  'bg-emerald-500',
  'bg-rose-500',
  'bg-amber-500',
  'bg-purple-500',
  'bg-indigo-500'
];

export const getTodayStr = () => {
  const now = new Date();
  return now.toISOString().split('T')[0];
};

export const formatTime = (time: string) => {
  return time; // Simple pass-through for now, can be enhanced
};
