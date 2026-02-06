
import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Settings2, X, LayoutGrid, Trash2, Clock, Info, ChevronRight, Bell, AlertCircle, Save, History, Calendar as CalendarIcon, Edit2 } from 'lucide-react';
import { Medication, DailyLog, AppState, SideEffect, MedicationType, TimeSlot, TemporaryTake } from './types';
import { getTodayStr, MED_COLORS, TIME_SLOT_LABELS, MED_TYPE_LABELS, SLOT_TIMES } from './constants';
import Widget from './components/Widget';
import MedicationItem from './components/MedicationItem';
import HistoryCalendar from './components/HistoryCalendar';

type Tab = 'tracker' | 'settings';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('tracker');
  const [selectedDate, setSelectedDate] = useState<string>(getTodayStr());
  const [meds, setMeds] = useState<Medication[]>([]);
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMed, setEditingMed] = useState<Medication | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [medType, setMedType] = useState<MedicationType>('continuous');
  const [selectedSlots, setSelectedSlots] = useState<TimeSlot[]>(['morning']);
  const [endDate, setEndDate] = useState(getTodayStr());
  
  // Side effect temp state
  const [sideEffectText, setSideEffectText] = useState('');

  // Auto-refresh logic (checks current time every minute to update "Next Medication")
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Load from LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem('medy_app_state');
    if (saved) {
      try {
        const parsed: AppState = JSON.parse(saved);
        setMeds(parsed.medications || []);
        setLogs(parsed.logs || []);
      } catch (e) {
        console.error("Failed to parse saved state", e);
      }
    }
  }, []);

  // Save to LocalStorage
  useEffect(() => {
    const state: AppState = { medications: meds, logs };
    localStorage.setItem('medy_app_state', JSON.stringify(state));
  }, [meds, logs]);

  const selectedLog = useMemo(() => 
    logs.find(l => l.date === selectedDate) || { date: selectedDate, takenIds: [], sideEffects: [], temporaryTakes: [] },
  [logs, selectedDate]);

  // Filter meds visible on the selected date (for the tracker)
  const visibleScheduledDoses = useMemo(() => {
    const doses: { med: Medication; slot: TimeSlot; doseId: string }[] = [];
    meds.forEach(m => {
      if (m.type === 'temporary') return;
      if (m.type === 'period' && m.endDate && selectedDate > m.endDate) return;

      m.slots.forEach(slot => {
        doses.push({ med: m, slot, doseId: `${m.id}_${slot}` });
      });
    });
    
    // Order based on the internal defined times (morning < afternoon < evening)
    return doses.sort((a, b) => SLOT_TIMES[a.slot].localeCompare(SLOT_TIMES[b.slot]));
  }, [meds, selectedDate]);

  // For Setting Tab: Filter out expired period meds
  const activeMedsForSettings = useMemo(() => {
    const today = getTodayStr();
    return meds.filter(m => {
      if (m.type === 'period' && m.endDate) {
        // Only show if the end date is today or in the future
        return m.endDate >= today;
      }
      return true;
    });
  }, [meds]);

  const visibleTemporaryMeds = useMemo(() => {
    return meds.filter(m => m.type === 'temporary');
  }, [meds]);

  const toggleMed = (id: string, slot: TimeSlot) => {
    const doseId = `${id}_${slot}`;
    setLogs(prev => {
      const existing = prev.find(l => l.date === selectedDate);
      if (existing) {
        const alreadyTaken = existing.takenIds.includes(doseId);
        const newTakenIds = alreadyTaken 
          ? existing.takenIds.filter(tid => tid !== doseId)
          : [...existing.takenIds, doseId];
        return prev.map(l => l.date === selectedDate ? { ...l, takenIds: newTakenIds } : l);
      } else {
        return [...prev, { date: selectedDate, takenIds: [doseId], sideEffects: [], temporaryTakes: [] }];
      }
    });
  };

  const handleRecordTemporary = (medId: string) => {
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const newTake: TemporaryTake = { id: crypto.randomUUID(), medId, time: timeStr };

    setLogs(prev => {
      const existing = prev.find(l => l.date === selectedDate);
      if (existing) {
        const currentTakes = existing.temporaryTakes || [];
        return prev.map(l => l.date === selectedDate ? { ...l, temporaryTakes: [...currentTakes, newTake] } : l);
      } else {
        return [...prev, { date: selectedDate, takenIds: [], sideEffects: [], temporaryTakes: [newTake] }];
      }
    });
  };

  const handleDeleteTempTake = (id: string) => {
    setLogs(prev => prev.map(l => 
      l.date === selectedDate 
        ? { ...l, temporaryTakes: (l.temporaryTakes || []).filter(t => t.id !== id) } 
        : l
    ));
  };

  const handleSaveSideEffect = () => {
    if (!sideEffectText.trim()) return;
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const newEntry: SideEffect = { id: crypto.randomUUID(), time: timeStr, text: sideEffectText.trim() };

    setLogs(prev => {
      const existing = prev.find(l => l.date === selectedDate);
      if (existing) {
        const currentEffects = existing.sideEffects || [];
        return prev.map(l => l.date === selectedDate ? { ...l, sideEffects: [...currentEffects, newEntry] } : l);
      } else {
        return [...prev, { date: selectedDate, takenIds: [], sideEffects: [newEntry], temporaryTakes: [] }];
      }
    });
    setSideEffectText('');
  };

  const handleAddMed = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !dosage) return;

    const medData: Medication = {
      id: editingMed ? editingMed.id : crypto.randomUUID(),
      name,
      dosage,
      type: medType,
      slots: medType === 'temporary' ? [] : selectedSlots,
      endDate: medType === 'period' ? endDate : undefined,
      color: editingMed ? editingMed.color : MED_COLORS[Math.floor(Math.random() * MED_COLORS.length)]
    };

    if (editingMed) {
      setMeds(prev => prev.map(m => m.id === editingMed.id ? medData : m));
    } else {
      setMeds(prev => [...prev, medData]);
    }
    resetForm();
  };

  const resetForm = () => {
    setName('');
    setDosage('');
    setMedType('continuous');
    setSelectedSlots(['morning']);
    setEndDate(getTodayStr());
    setEditingMed(null);
    setIsModalOpen(false);
  };

  const handleEdit = (med: Medication) => {
    setEditingMed(med);
    setName(med.name);
    setDosage(med.dosage);
    setMedType(med.type);
    setSelectedSlots(med.slots);
    if (med.endDate) setEndDate(med.endDate);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('この薬の情報を完全に削除しますか？')) {
      setMeds(prev => prev.filter(m => m.id !== id));
    }
  };

  const nextDoseInfo = useMemo(() => {
    const today = getTodayStr();
    if (selectedDate !== today) return undefined;
    
    const untakenDoses = visibleScheduledDoses.filter(d => !selectedLog.takenIds.includes(d.doseId));
    if (untakenDoses.length === 0) return undefined;

    const nowStr = `${currentTime.getHours().toString().padStart(2, '0')}:${currentTime.getMinutes().toString().padStart(2, '0')}`;
    const futureDoses = untakenDoses.filter(d => SLOT_TIMES[d.slot] >= nowStr);
    
    return futureDoses.length > 0 ? futureDoses[0] : untakenDoses[0];
  }, [visibleScheduledDoses, selectedLog.takenIds, selectedDate, currentTime]);

  const progress = visibleScheduledDoses.length > 0 
    ? Math.round((selectedLog.takenIds.length / visibleScheduledDoses.length) * 100) 
    : 0;

  const isSelectedDateToday = selectedDate === getTodayStr();

  // Helper to get color class based on type
  const getTypeColor = (type: MedicationType) => {
    switch (type) {
      case 'continuous': return 'bg-emerald-500';
      case 'period': return 'bg-blue-500';
      case 'temporary': return 'bg-rose-500';
      default: return 'bg-slate-500';
    }
  };

  const getTypeTextColor = (type: MedicationType) => {
    switch (type) {
      case 'continuous': return 'text-emerald-500';
      case 'period': return 'text-blue-500';
      case 'temporary': return 'text-rose-500';
      default: return 'text-slate-500';
    }
  };

  const getTypeBgColor = (type: MedicationType) => {
    switch (type) {
      case 'continuous': return 'bg-emerald-50';
      case 'period': return 'bg-blue-50';
      case 'temporary': return 'bg-rose-50';
      default: return 'bg-slate-50';
    }
  };

  return (
    <div className="max-w-md mx-auto min-h-screen pb-24 bg-slate-50 relative overflow-x-hidden">
      
      {activeTab === 'tracker' && (
        <>
          <header className="px-6 pt-8 pb-4 flex justify-between items-center sticky top-0 bg-slate-50/80 backdrop-blur-md z-30">
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Medy</h1>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                {isSelectedDateToday ? 'TODAY' : selectedDate}
              </p>
            </div>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="p-3 bg-blue-600 rounded-2xl shadow-xl shadow-blue-100 text-white hover:bg-blue-700 transition-all active:scale-95"
            >
              <Plus size={24} />
            </button>
          </header>

          <main className="px-6">
            {isSelectedDateToday && (
              <Widget 
                nextMed={nextDoseInfo ? { ...nextDoseInfo.med, slot: nextDoseInfo.slot } : undefined} 
                onTake={toggleMed} 
                allCompleted={visibleScheduledDoses.length > 0 && selectedLog.takenIds.length === visibleScheduledDoses.length}
                hasMeds={visibleScheduledDoses.length > 0}
              />
            )}

            <HistoryCalendar 
              logs={logs} 
              medications={visibleScheduledDoses as any} 
              selectedDate={selectedDate} 
              onDateSelect={setSelectedDate} 
            />

            {visibleScheduledDoses.length > 0 && (
              <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 mb-6 flex items-center justify-between">
                <div className="flex-grow">
                  <div className="flex justify-between items-end mb-2.5 px-1">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">予定の達成率</span>
                    <span className="text-xl font-black text-slate-800">{progress}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-700 ease-out ${progress === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                      style={{ width: `${progress}%` }} 
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="mb-8">
              <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 px-1">服用予定</h2>
              <div className="space-y-1">
                {visibleScheduledDoses.length === 0 ? (
                  <div className="text-center py-8 bg-white/50 rounded-3xl border border-dashed border-slate-200">
                    <p className="text-slate-400 text-xs font-medium">本日の予定はありません</p>
                  </div>
                ) : (
                  visibleScheduledDoses.map(({ med, slot, doseId }) => (
                    <MedicationItem 
                      key={doseId} 
                      med={med}
                      slot={slot}
                      isTaken={selectedLog.takenIds.includes(doseId)}
                      onToggle={toggleMed}
                      onDelete={handleDelete}
                      onEdit={handleEdit}
                    />
                  ))
                )}
              </div>
            </div>

            {visibleTemporaryMeds.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 px-1">一時的な服薬</h2>
                <div className="space-y-1">
                  {visibleTemporaryMeds.map(med => (
                    <MedicationItem 
                      key={med.id} 
                      med={med}
                      onRecordTemporary={handleRecordTemporary}
                      onDelete={handleDelete}
                      onEdit={handleEdit}
                    />
                  ))}
                </div>

                {selectedLog.temporaryTakes && selectedLog.temporaryTakes.length > 0 && (
                  <div className="mt-4 space-y-2 bg-white/40 p-3 rounded-2xl border border-slate-100">
                     <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mb-2 px-1">記録</p>
                     {selectedLog.temporaryTakes.slice().reverse().map(take => {
                        const med = meds.find(m => m.id === take.medId);
                        return (
                          <div key={take.id} className="flex items-center justify-between text-xs font-bold text-slate-500 bg-white p-2 rounded-xl shadow-sm">
                            <div className="flex items-center gap-2">
                              <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px] text-slate-400">{take.time}</span>
                              <span>{med?.name || '不明な薬'} を服用</span>
                            </div>
                            <button onClick={() => handleDeleteTempTake(take.id)} className="text-slate-300 hover:text-rose-400 transition-colors">
                              <X size={14} />
                            </button>
                          </div>
                        );
                     })}
                  </div>
                )}
              </div>
            )}

            <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 mb-8">
              <div className="flex items-center gap-2 mb-3 px-1">
                <AlertCircle className="text-rose-500" size={18} />
                <h2 className="text-sm font-bold text-slate-800">副作用の記録</h2>
              </div>
              <div className="flex gap-2 mb-4">
                <input 
                  type="text" 
                  value={sideEffectText}
                  onChange={(e) => setSideEffectText(e.target.value)}
                  placeholder="例: 眠気がある"
                  className="flex-grow bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/10 focus:border-rose-300 transition-all font-medium"
                />
                <button 
                  onClick={handleSaveSideEffect}
                  className={`p-3 rounded-xl transition-all ${!sideEffectText.trim() ? 'bg-slate-100 text-slate-400' : 'bg-rose-500 text-white shadow-lg shadow-rose-200 hover:bg-rose-600 active:scale-95'}`}
                  disabled={!sideEffectText.trim()}
                >
                  <Save size={20} />
                </button>
              </div>

              {selectedLog.sideEffects && selectedLog.sideEffects.length > 0 && (
                <div className="space-y-2 border-t border-slate-50 pt-4">
                  {selectedLog.sideEffects.slice().reverse().map(se => (
                    <div key={se.id} className="flex items-center justify-between bg-rose-50/30 p-2.5 rounded-xl">
                      <div className="flex items-start gap-3">
                        <span className="text-[10px] font-black text-rose-400 bg-white px-1.5 py-0.5 rounded border border-rose-100 mt-0.5">{se.time}</span>
                        <p className="text-sm text-slate-700 font-medium">{se.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </main>
        </>
      )}

      {activeTab === 'settings' && (
        <>
          <header className="px-6 pt-8 pb-4 sticky top-0 bg-slate-50/80 backdrop-blur-md z-30">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">設定</h1>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-0.5">Application Settings</p>
          </header>

          <main className="px-6 pb-12">
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden divide-y divide-slate-50">
              <div className="px-5 py-4 bg-slate-50/50">
                <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">登録済みの薬</h2>
              </div>
              
              {activeMedsForSettings.length === 0 ? (
                <div className="px-8 py-12 text-center">
                   <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-3 text-slate-300">
                     <Clock size={24} />
                   </div>
                   <p className="text-slate-400 text-sm font-medium">登録されている薬はありません</p>
                </div>
              ) : (
                activeMedsForSettings.map(med => (
                  <div key={med.id} className="flex items-center justify-between px-5 py-4 bg-white hover:bg-slate-50 transition-colors group">
                    <div className="flex items-center gap-4">
                      <div className={`w-1.5 h-10 rounded-full ${getTypeColor(med.type)}`} />
                      <div>
                        <h3 className="font-bold text-slate-800">{med.name}</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-[10px] font-black uppercase tracking-tighter ${getTypeTextColor(med.type)}`}>
                            {MED_TYPE_LABELS[med.type]}
                          </span>
                          <span className="w-1 h-1 bg-slate-200 rounded-full" />
                          <span className="text-[10px] font-black text-slate-500 uppercase">{med.dosage}</span>
                          {med.type === 'period' && (
                            <>
                              <span className="w-1 h-1 bg-slate-200 rounded-full" />
                              <span className="text-[10px] font-black text-rose-400 uppercase">~{med.endDate?.split('-').slice(1).join('/')}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button 
                        onClick={() => handleEdit(med)}
                        className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(med.id)}
                        className="p-2.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))
              )}

              <div className="p-4 bg-slate-50/20">
                <button 
                  onClick={() => { resetForm(); setIsModalOpen(true); }}
                  className="w-full flex items-center justify-center gap-2 py-4 bg-white border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 font-bold text-sm hover:border-blue-400 hover:text-blue-500 transition-all active:scale-[0.98]"
                >
                  <Plus size={18} />
                  <span>新しい薬を追加する</span>
                </button>
              </div>
            </div>

            <div className="mt-8 bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
               <div className="px-5 py-4 bg-slate-50/50 border-b border-slate-50">
                  <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">アプリ情報</h2>
               </div>
               <div className="px-5 py-4 flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-600">バージョン</span>
                  <span className="text-xs font-black text-slate-400">1.2.0</span>
               </div>
               <div className="px-5 py-4 flex justify-between items-center border-t border-slate-50">
                  <span className="text-sm font-bold text-slate-600">データ保存場所</span>
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Local Storage</span>
               </div>
            </div>
          </main>
        </>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-t-[2.5rem] sm:rounded-[2.5rem] p-8 animate-in slide-in-from-bottom duration-300 max-h-[95vh] overflow-y-auto no-scrollbar">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-black text-slate-800 tracking-tight">{editingMed ? '薬を編集' : '新しい薬を追加'}</h2>
              <button onClick={resetForm} className="p-2 text-slate-300 hover:bg-slate-50 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleAddMed} className="space-y-6">
              <div>
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">薬の名前</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="例: パブロン"
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">用量</label>
                <input 
                  type="text" 
                  value={dosage}
                  onChange={(e) => setDosage(e.target.value)}
                  placeholder="例: 1錠"
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">種類</label>
                <div className="flex gap-2">
                  {(['continuous', 'period', 'temporary'] as MedicationType[]).map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setMedType(type)}
                      className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${medType === type ? 'bg-slate-800 text-white shadow-lg' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                    >
                      {MED_TYPE_LABELS[type]}
                    </button>
                  ))}
                </div>
              </div>

              {medType !== 'temporary' && (
                <div>
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">服用タイミング</label>
                  <div className="flex gap-2">
                    {(['morning', 'afternoon', 'evening'] as TimeSlot[]).map(slot => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => {
                          setSelectedSlots(prev => 
                            prev.includes(slot) ? prev.filter(s => s !== slot) : [...prev, slot]
                          );
                        }}
                        className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${selectedSlots.includes(slot) ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                      >
                        {TIME_SLOT_LABELS[slot]}
                      </button>
                    ))}
                  </div>
                  {selectedSlots.length === 0 && <p className="text-rose-400 text-[10px] font-bold mt-2 ml-1">※少なくとも1つ選択してください</p>}
                </div>
              )}

              {medType === 'period' && (
                <div className="animate-in slide-in-from-top-2">
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">いつまで表示しますか？</label>
                  <div className="relative">
                    <input 
                      type="date" 
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold"
                      required
                    />
                    <CalendarIcon size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
                  </div>
                </div>
              )}

              <button 
                type="submit"
                disabled={medType !== 'temporary' && selectedSlots.length === 0}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-30 text-white font-black py-5 rounded-[1.5rem] shadow-2xl shadow-blue-100 transition-all active:scale-[0.98] mt-4 tracking-widest uppercase text-sm"
              >
                {editingMed ? '変更を保存' : '登録する'}
              </button>
            </form>
          </div>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-slate-100 px-12 py-5 flex justify-around items-center max-w-md mx-auto z-40">
        <button 
          onClick={() => { setActiveTab('tracker'); setSelectedDate(getTodayStr()); }}
          className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === 'tracker' ? 'text-blue-600' : 'text-slate-300'}`}
        >
          <div className={`p-2 rounded-xl transition-all ${activeTab === 'tracker' ? 'bg-blue-50' : 'bg-transparent'}`}>
            <LayoutGrid size={24} strokeWidth={activeTab === 'tracker' ? 2.5 : 2} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest">Home</span>
        </button>

        <button 
          onClick={() => setActiveTab('settings')}
          className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === 'settings' ? 'text-blue-600' : 'text-slate-300'}`}
        >
          <div className={`p-2 rounded-xl transition-all ${activeTab === 'settings' ? 'bg-blue-50' : 'bg-transparent'}`}>
            <Settings2 size={24} strokeWidth={activeTab === 'settings' ? 2.5 : 2} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest">SETTING</span>
        </button>
      </nav>
    </div>
  );
};

export default App;
