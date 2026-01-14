
import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';
import { Medication, DailyLog } from '../types';

interface HistoryCalendarProps {
  logs: DailyLog[];
  medications: Medication[];
  selectedDate: string;
  onDateSelect: (date: string) => void;
}

const HistoryCalendar: React.FC<HistoryCalendarProps> = ({ logs, medications, selectedDate, onDateSelect }) => {
  const [viewDate, setViewDate] = useState(new Date(selectedDate));

  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();

  const prevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const getDayData = (day: number) => {
    const dateStr = `${viewDate.getFullYear()}-${(viewDate.getMonth() + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    const log = logs.find(l => l.date === dateStr);
    
    let status: 'none' | 'partial' | 'complete' = 'none';
    if (log && log.takenIds.length > 0) {
      status = (medications.length > 0 && log.takenIds.length >= medications.length) ? 'complete' : 'partial';
    }
    
    return { dateStr, status };
  };

  const weekDays = ['日', '月', '火', '水', '木', '金', '土'];

  return (
    <div className="bg-white rounded-[2rem] p-5 shadow-sm border border-slate-100 mb-6">
      <div className="flex justify-between items-center mb-5 px-1">
        <h2 className="text-lg font-bold text-slate-800">
          {viewDate.getFullYear()}年 {viewDate.getMonth() + 1}月
        </h2>
        <div className="flex gap-1">
          <button onClick={prevMonth} className="p-2 hover:bg-slate-50 rounded-full text-slate-400 transition-colors">
            <ChevronLeft size={18} />
          </button>
          <button onClick={nextMonth} className="p-2 hover:bg-slate-50 rounded-full text-slate-400 transition-colors">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-y-2 text-center">
        {weekDays.map(day => (
          <div key={day} className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mb-2">
            {day}
          </div>
        ))}
        
        {Array.from({ length: firstDayOfMonth }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}

        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const { dateStr, status } = getDayData(day);
          const isSelected = selectedDate === dateStr;
          const isToday = new Date().toISOString().split('T')[0] === dateStr;

          let bgColor = 'bg-transparent';
          let textColor = 'text-slate-600';
          
          if (status === 'complete') {
            bgColor = 'bg-emerald-500';
            textColor = 'text-white';
          } else if (status === 'partial') {
            bgColor = 'bg-amber-400';
            textColor = 'text-white';
          } else if (isToday) {
            bgColor = 'bg-blue-50';
            textColor = 'text-blue-600';
          }

          return (
            <div key={day} className="flex flex-col items-center justify-center py-1">
              <button
                onClick={() => onDateSelect(dateStr)}
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all relative ${bgColor} ${textColor} ${
                  isSelected ? 'ring-2 ring-blue-400 ring-offset-2 scale-110 z-10' : 'hover:scale-105'
                } ${status === 'none' && !isToday ? 'hover:bg-slate-50' : ''}`}
              >
                {day}
                {status === 'complete' && <div className="absolute -top-1 -right-1 bg-white rounded-full p-0.5"><CheckCircle2 size={10} className="text-emerald-500" /></div>}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default HistoryCalendar;
