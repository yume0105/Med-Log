
import React from 'react';
import { Medication } from '../types';
import { Check, Trash2, Edit2 } from 'lucide-react';

interface MedicationItemProps {
  med: Medication;
  displayTime: string;
  isTaken: boolean;
  onToggle: (id: string, time: string) => void;
  onDelete: (id: string) => void;
  onEdit: (med: Medication) => void;
}

const MedicationItem: React.FC<MedicationItemProps> = ({ med, displayTime, isTaken, onToggle, onDelete, onEdit }) => {
  return (
    <div className={`flex items-center p-4 rounded-2xl bg-white border transition-all mb-3 ${
      isTaken ? 'border-emerald-100 bg-emerald-50/30' : 'border-slate-100'
    }`}>
      <button
        onClick={() => onToggle(med.id, displayTime)}
        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all flex-shrink-0 ${
          isTaken 
            ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' 
            : 'bg-slate-100 text-slate-300 hover:bg-slate-200'
        }`}
      >
        <Check size={20} strokeWidth={3} />
      </button>

      <div className="ml-4 flex-grow" onClick={() => onToggle(med.id, displayTime)}>
        <h3 className={`font-semibold text-lg leading-tight ${isTaken ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
          {med.name}
        </h3>
        <p className="text-slate-400 text-sm">
          <span className="font-bold text-slate-500">{displayTime}</span> • {med.dosage}
        </p>
      </div>

      <div className="flex gap-2 group-hover:opacity-100 transition-opacity">
        <button 
          onClick={(e) => { e.stopPropagation(); onEdit(med); }}
          className="p-2 text-slate-300 hover:text-blue-500 transition-colors"
        >
          <Edit2 size={16} />
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); onDelete(med.id); }}
          className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
};

export default MedicationItem;
