
import React from 'react';
import { Medication, TimeSlot } from '../types';
import { Check, Trash2, Edit2, Plus, Clock } from 'lucide-react';
import { TIME_SLOT_LABELS } from '../constants';

interface MedicationItemProps {
  med: Medication;
  slot?: TimeSlot; // Only for scheduled ones
  isTaken?: boolean;
  onToggle?: (id: string, slot: TimeSlot) => void;
  onRecordTemporary?: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (med: Medication) => void;
}

const MedicationItem: React.FC<MedicationItemProps> = ({ 
  med, slot, isTaken, onToggle, onRecordTemporary, onDelete, onEdit 
}) => {
  const isTemporary = med.type === 'temporary';

  return (
    <div className={`flex items-center p-4 rounded-2xl bg-white border transition-all mb-3 ${
      isTaken ? 'border-emerald-100 bg-emerald-50/30' : 'border-slate-100 shadow-sm'
    }`}>
      {isTemporary ? (
        <button
          onClick={() => onRecordTemporary?.(med.id)}
          className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center transition-all flex-shrink-0 hover:bg-blue-100 active:scale-95"
        >
          <Plus size={20} strokeWidth={3} />
        </button>
      ) : (
        <button
          onClick={() => slot && onToggle?.(med.id, slot)}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all flex-shrink-0 ${
            isTaken 
              ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' 
              : 'bg-slate-100 text-slate-300 hover:bg-slate-200'
          }`}
        >
          <Check size={20} strokeWidth={3} />
        </button>
      )}

      <div className="ml-4 flex-grow">
        <h3 className={`font-bold text-lg leading-tight ${isTaken ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
          {med.name}
        </h3>
        <p className="text-slate-400 text-sm flex items-center gap-1.5">
          {!isTemporary && slot && (
            <span className={`font-black ${med.type === 'period' ? 'text-blue-500 bg-blue-50' : 'text-emerald-500 bg-emerald-50'} px-2 py-0.5 rounded text-[10px] uppercase`}>
              {TIME_SLOT_LABELS[slot]}
            </span>
          )}
          {isTemporary && (
            <span className="font-black text-rose-500 bg-rose-50 px-2 py-0.5 rounded text-[10px] uppercase">
              一時的
            </span>
          )}
          <span>{med.dosage}</span>
          {med.type === 'period' && med.endDate && (
            <span className="text-[10px] text-rose-400 font-bold border-l pl-2 ml-1">
              ~{med.endDate.split('-').slice(1).join('/')}まで
            </span>
          )}
        </p>
      </div>

      <div className="flex gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
        <button 
          onClick={(e) => { e.stopPropagation(); onEdit(med); }}
          className="p-2 text-slate-400 hover:text-blue-500 transition-colors"
        >
          <Edit2 size={16} />
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); onDelete(med.id); }}
          className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
};

export default MedicationItem;
