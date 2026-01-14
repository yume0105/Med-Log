
import React from 'react';
import { Medication } from '../types';
import { CheckCircle2, Clock } from 'lucide-react';

interface WidgetProps {
  // Fix: nextMed needs a single time string for display in the widget context, extending Medication.
  nextMed?: Medication & { time: string };
  onTake: (id: string) => void;
  isTaken: boolean;
}

const Widget: React.FC<WidgetProps> = ({ nextMed, onTake, isTaken }) => {
  if (!nextMed) {
    return (
      <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 mb-6">
        <p className="text-slate-400 text-sm text-center py-2">予定されている薬はありません</p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-5 rounded-3xl shadow-lg mb-6 text-white relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <Clock size={80} />
      </div>
      <div className="relative z-10">
        <p className="text-blue-100 text-xs font-semibold uppercase tracking-wider mb-1">NEXT MEDICATION</p>
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-2xl font-bold">{nextMed.name}</h2>
            <p className="text-blue-100 flex items-center gap-1 mt-1">
              <Clock size={14} /> {nextMed.time} • {nextMed.dosage}
            </p>
          </div>
          <button
            onClick={() => onTake(nextMed.id)}
            disabled={isTaken}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl font-semibold transition-all ${
              isTaken 
                ? 'bg-white/20 text-white cursor-default' 
                : 'bg-white text-blue-600 active:scale-95 shadow-md'
            }`}
          >
            {isTaken ? (
              <><CheckCircle2 size={18} /> 完了</>
            ) : (
              '今すぐ服用'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Widget;
