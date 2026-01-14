
import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Settings2, X, LayoutGrid, Trash2, Clock, Info, ChevronRight, Bell } from 'lucide-react';
import { Medication, DailyLog, AppState } from './types';
import { getTodayStr, MED_COLORS } from './constants';
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
  const [times, setTimes] = useState<string[]>(['08:00']);

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
    logs.find(l => l.date === selectedDate) || { date: selectedDate, takenIds: [] },
  [logs, selectedDate]);

  const dailyDoses = useMemo(() => {
    const doses: { med: Medication; time: string; doseId: string }[] = [];
    meds.forEach(m => {
      m.times.forEach(t => {
        doses.push({ med: m, time: t, doseId: `${m.id}_${t}` });
      });
    });
    return doses.sort((a, b) => a.time.localeCompare(b.time));
  }, [meds]);

  const toggleMed = (id: string, time: string) => {
    const doseId = id.includes('_') ? id : `${id}_${time}`;
    setLogs(prev => {
      const existing = prev.find(l => l.date === selectedDate);
      if (existing) {
        const alreadyTaken = existing.takenIds.includes(doseId);
        const newTakenIds = alreadyTaken 
          ? existing.takenIds.filter(tid => tid !== doseId)
          : [...existing.takenIds, doseId];
        return prev.map(l => l.date === selectedDate ? { ...l, takenIds: newTakenIds } : l);
      } else {
        return [...prev, { date: selectedDate, takenIds: [doseId] }];
      }
    });
  };

  const handleAddMed = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !dosage || times.some(t => !t)) return;

    if (editingMed) {
      setMeds(prev => prev.map(m => m.id === editingMed.id ? { ...m, name, dosage, times: [...times].sort() } : m));
    } else {
      const newMed: Medication = {
        id: crypto.randomUUID(),
        name,
        dosage,
        times: [...times].sort(),
        color: MED_COLORS[Math.floor(Math.random() * MED_COLORS.length)]
      };
      setMeds(prev => [...prev, newMed]);
    }
    
    resetForm();
  };

  const resetForm = () => {
    setName('');
    setDosage('');
    setTimes(['08:00']);
    setEditingMed(null);
    setIsModalOpen(false);
  };

  const handleEdit = (med: Medication) => {
    setEditingMed(med);
    setName(med.name);
    setDosage(med.dosage);
    setTimes(med.times);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('本当に削除しますか？設定されたすべての時間が削除されます。')) {
      setMeds(prev => prev.filter(m => m.id !== id));
      setLogs(prev => prev.map(l => ({ ...l, takenIds: l.takenIds.filter(tid => !tid.startsWith(id)) })));
    }
  };

  const nextDose = useMemo(() => {
    const today = getTodayStr();
    if (selectedDate !== today) return undefined;
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    return dailyDoses.find(d => d.time >= currentTime && !selectedLog.takenIds.includes(d.doseId)) 
           || dailyDoses.find(d => !selectedLog.takenIds.includes(d.doseId));
  }, [dailyDoses, selectedLog.takenIds, selectedDate]);

  const progress = dailyDoses.length > 0 
    ? Math.round((selectedLog.takenIds.length / dailyDoses.length) * 100) 
    : 0;

  const calendarMeds = useMemo(() => {
    return dailyDoses.map(d => ({ id: d.doseId })) as any;
  }, [dailyDoses]);

  const isSelectedDateToday = selectedDate === getTodayStr();

  return (
    <div className="max-w-md mx-auto min-h-screen pb-24 bg-slate-50 relative overflow-x-hidden">
      
      {/* Tracker Content */}
      {activeTab === 'tracker' && (
        <>
          {/* Header */}
          <header className="px-6 pt-8 pb-4 flex justify-between items-center sticky top-0 bg-slate-50/80 backdrop-blur-md z-30">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Medy</h1>
              <p className="text-slate-500 text-sm font-medium">
                {isSelectedDateToday ? '今日' : selectedDate} の服薬管理
              </p>
            </div>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100 text-blue-600 hover:bg-slate-50 transition-colors"
            >
              <Plus size={24} />
            </button>
          </header>

          <main className="px-6">
            {/* NEXT MEDICATION widget at top */}
            {isSelectedDateToday && nextDose && (
              <Widget 
                nextMed={{ ...nextDose.med, time: nextDose.time }} 
                onTake={() => toggleMed(nextDose.med.id, nextDose.time)} 
                isTaken={selectedLog.takenIds.includes(nextDose.doseId)} 
              />
            )}

            <HistoryCalendar 
              logs={logs} 
              medications={calendarMeds} 
              selectedDate={selectedDate} 
              onDateSelect={setSelectedDate} 
            />

            <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 mb-6 flex items-center justify-between">
              <div className="flex-grow">
                <div className="flex justify-between items-end mb-2.5 px-1">
                  <span className="text-sm font-semibold text-slate-400">達成率</span>
                  <span className="text-xl font-black text-slate-800 tracking-tight">{progress}%</span>
                </div>
                <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-700 ease-out ${progress === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                    style={{ width: `${progress}%` }} 
                  />
                </div>
              </div>
              <div className="ml-5 pl-5 border-l border-slate-100 flex flex-col items-center">
                 <div className="text-2xl font-black text-slate-800 leading-none">
                  {selectedLog.takenIds.length}<span className="text-xs text-slate-300 font-bold ml-0.5">/ {dailyDoses.length}</span>
                 </div>
                 <p className="text-[9px] font-bold text-slate-400 mt-1.5 uppercase tracking-widest">RECORDED</p>
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-lg font-bold text-slate-800 mb-4 px-1">服用リスト</h2>
              <div className="space-y-1">
                {dailyDoses.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-slate-200">
                    <p className="text-slate-400 font-medium">薬を登録して管理を開始しましょう</p>
                  </div>
                ) : (
                  dailyDoses.map(({ med, time, doseId }) => (
                    <MedicationItem 
                      key={doseId} 
                      med={med}
                      displayTime={time}
                      isTaken={selectedLog.takenIds.includes(doseId)}
                      onToggle={toggleMed}
                      onDelete={handleDelete}
                      onEdit={handleEdit}
                    />
                  ))
                )}
              </div>
            </div>
          </main>
        </>
      )}

      {/* Settings Content */}
      {activeTab === 'settings' && (
        <>
          <header className="px-6 pt-8 pb-4 flex justify-between items-center sticky top-0 bg-slate-50/80 backdrop-blur-md z-30">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">設定</h1>
              <p className="text-slate-500 text-sm font-medium">アプリの管理と薬の一覧</p>
            </div>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-100 text-white hover:bg-blue-700 transition-colors"
            >
              <Plus size={24} />
            </button>
          </header>

          <main className="px-6 space-y-6">
            <section className="bg-white rounded-[2rem] p-5 shadow-sm border border-slate-100">
              <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 ml-1">登録されている薬</h2>
              {meds.length === 0 ? (
                <p className="text-slate-400 text-sm py-4 text-center">登録されている薬はありません</p>
              ) : (
                <div className="divide-y divide-slate-50">
                  {meds.map(med => (
                    <div key={med.id} className="py-4 flex justify-between items-center group">
                      <div>
                        <h3 className="font-bold text-slate-800">{med.name}</h3>
                        <p className="text-xs text-slate-400">{med.dosage} • {med.times.join(', ')}</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleEdit(med)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-full transition-colors">
                          <Clock size={18} />
                        </button>
                        <button onClick={() => handleDelete(med.id)} className="p-2 text-rose-400 hover:bg-rose-50 rounded-full transition-colors">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="space-y-3">
              <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 ml-1">アプリ設定</h2>
              <button className="w-full bg-white p-4 rounded-2xl flex items-center justify-between border border-slate-100 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center">
                    <Bell size={20} />
                  </div>
                  <span className="font-bold text-slate-700">通知設定</span>
                </div>
                <ChevronRight className="text-slate-300" size={20} />
              </button>
              <button className="w-full bg-white p-4 rounded-2xl flex items-center justify-between border border-slate-100 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-500 flex items-center justify-center">
                    <Info size={20} />
                  </div>
                  <span className="font-bold text-slate-700">Medyについて</span>
                </div>
                <ChevronRight className="text-slate-300" size={20} />
              </button>
            </section>
            
            <div className="text-center pb-8">
              <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em]">Version 1.2.0</p>
            </div>
          </main>
        </>
      )}

      {/* Modal for Add/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-sm p-0 sm:p-4">
          <div className="bg-white w-full max-w-md rounded-t-[2.5rem] sm:rounded-[2.5rem] p-8 animate-in slide-in-from-bottom duration-300 max-h-[90vh] overflow-y-auto no-scrollbar">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-black text-slate-800">{editingMed ? '薬を編集' : '新しい薬を追加'}</h2>
              <button onClick={resetForm} className="p-2 text-slate-300 hover:bg-slate-50 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleAddMed} className="space-y-5">
              <div>
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">薬の名前</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="例: パブロン"
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-semibold"
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
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">服用時間</label>
                <div className="space-y-3">
                  {times.map((t, idx) => (
                    <div key={idx} className="flex gap-2">
                      <div className="relative flex-grow">
                        <input 
                          type="time" 
                          value={t}
                          onChange={(e) => {
                            const newTimes = [...times];
                            newTimes[idx] = e.target.value;
                            setTimes(newTimes);
                          }}
                          className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-semibold"
                          required
                        />
                      </div>
                      {times.length > 1 && (
                        <button 
                          type="button" 
                          onClick={() => setTimes(times.filter((_, i) => i !== idx))}
                          className="p-4 bg-rose-50 text-rose-500 rounded-2xl hover:bg-rose-100 transition-colors"
                        >
                          <Trash2 size={20} />
                        </button>
                      )}
                    </div>
                  ))}
                  <button 
                    type="button"
                    onClick={() => setTimes([...times, '12:00'])}
                    className="w-full py-3 border-2 border-dashed border-slate-100 rounded-2xl text-slate-400 text-xs font-bold flex items-center justify-center gap-2 hover:border-blue-100 hover:text-blue-400 transition-all"
                  >
                    <Plus size={16} /> 時間を追加する
                  </button>
                </div>
              </div>

              <button 
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-5 rounded-2xl shadow-xl shadow-blue-100 transition-all active:scale-[0.98] mt-6 tracking-wider uppercase text-sm"
              >
                {editingMed ? '変更を保存' : '保存する'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Persistent Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-slate-100 px-12 py-5 flex justify-around items-center max-w-md mx-auto z-40">
        <button 
          onClick={() => {
            setActiveTab('tracker');
            // Homeに戻ったときに最新の今日の日付にリセットする
            setSelectedDate(getTodayStr());
          }}
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
          <span className="text-[10px] font-black uppercase tracking-widest">Settings</span>
        </button>
      </nav>
    </div>
  );
};

export default App;
