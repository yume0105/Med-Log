
import React from 'react';
import { Medication, TimeSlot } from '../types';
import { CheckCircle2, Clock, Sparkles } from 'lucide-react';
import { TIME_SLOT_LABELS } from '../constants';

interface WidgetProps {
  nextMed?: Medication & { slot: TimeSlot };
  onTake: (id: string, slot: TimeSlot) => void;
  allCompleted?: boolean;
  hasMeds?: boolean;
}

const Widget: React.FC<WidgetProps> = ({ nextMed, onTake, allCompleted, hasMeds }) => {
  if (!hasMeds) {
    return (
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 mb-6 flex flex-col items-center justify-center text-center">
        <div className="w-12 h-12 bg-slate-50 text-slate-300 rounded-2xl flex items-center justify-center mb-3">
            <Clock size={24} />
        </div>
        <p className="text-slate-400 text-sm font-medium">まずは「設定」から薬を登録しましょう</p>
      </div>
    );
  }

  if (allCompleted) {
    return (
      <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-6 rounded-3xl shadow-lg mb-6 text-white text-center relative overflow-hidden animate-in zoom-in duration-300">
        <div className="absolute top-0 right-0 p-4 opacity-10">
            <Sparkles size={80} />
        </div>
        <div className="relative z-10">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 size={28} />
            </div>
            <h2 className="text-xl font-black mb-1">ALL COMPLETED!</h2>
            <p className="text-emerald-50 text-sm font-medium">今日の服用はすべて完了しました！<br/>お疲れ様でした。</p>
        </div>
      </div>
    );
  }

  if (!nextMed) return null;

  return (
    <div className={`bg-gradient-to-br from-blue-600 to-indigo-700 p-5 rounded-3xl shadow-lg mb-6 text-white relative overflow-hidden transition-colors duration-500`}>
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <Clock size={80} />
      </div>
      <div className="relative z-10">
        <p className="text-white/70 text-[10px] font-black uppercase tracking-[0.2em] mb-1">
            NEXT MEDICATION
        </p>
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-2xl font-black tracking-tight">{nextMed.name}</h2>
            <p className="text-white/80 flex items-center gap-1.5 mt-1 font-bold text-sm">
              <span className="bg-white/20 px-2 py-0.5 rounded text-[10px]">{TIME_SLOT_LABELS[nextMed.slot]}</span>
              <span>{nextMed.dosage}</span>
            </p>
          </div>
          <button
            onClick={() => onTake(nextMed.id, nextMed.slot)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-black transition-all bg-white text-blue-600 active:scale-95 shadow-xl shadow-black/10 text-sm`}
          >
            服用する
          </button>
        </div>
      </div>
    </div>
  );
};

export default Widget;
