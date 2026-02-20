
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, Task, AppState, AppUsage, Circle, CircleMember } from './types';
import { Icons, DEFAULT_LIMIT, MIN_LIMIT, MAX_LIMIT, MIN_LIMIT_MINUTES, MAX_LIMIT_MINUTES, DAILY_DEFAULTS, BREAK_INTERVAL, AVAILABLE_APPS } from './constants';

// Define avatar colors for the settings selection
const AVATAR_COLORS = ['#A7BBC7', '#D8E2DC', '#EAE4E9', '#FDE2E4', '#FAD2E1', '#E2ECE9', '#BEE1E6'];

const App: React.FC = () => {
  const [view, setView] = useState<View>(View.DUTIES);
  const [activeRotting, setActiveRotting] = useState(false);
  const [socialTab, setSocialTab] = useState<'WORLD' | 'CIRCLE'>('WORLD');
  
  // Modals / Interstitials
  const [showSettings, setShowSettings] = useState(false);
  const [showBreathingBreak, setShowBreathingBreak] = useState(false);
  const [isManualBreath, setIsManualBreath] = useState(false);
  const [isCountingDownToDive, setIsCountingDownToDive] = useState(false);
  const [countdownSeconds, setCountdownSeconds] = useState(10);
  const [rotStartTime, setRotStartTime] = useState<number | null>(null);

  // Circle UI Local State
  const [newCircleName, setNewCircleName] = useState('');
  const [joinCircleCode, setJoinCircleCode] = useState('');
  
  // Fix: Added missing state for new task input (lines 316-317)
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [addingAppTo, setAddingAppTo] = useState<'distraction' | 'recovery' | null>(null);
  const [newAppName, setNewAppName] = useState('');

  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('potto_v9_state');
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...parsed,
        // Backward-compat for older saved states
        customApps: parsed.customApps ?? [],
        rotLastUpdatedAt: parsed.rotLastUpdatedAt ?? null,
        distractionApps: parsed.distractionApps ?? ['Instagram', 'Rednote', 'Facebook', 'Wechat', 'Twitter', 'YouTube'],
        recoveryApps: parsed.recoveryApps ?? ['Anki', 'Duolingo', 'Books', 'Notes', 'Calendar'],
      };
    }
    
    return {
      dailyAllowanceRemaining: DEFAULT_LIMIT,
      totalDebt: 0,
      tasks: DAILY_DEFAULTS.map(d => ({
        id: Math.random().toString(36).substr(2, 9),
        title: d.title,
        description: d.description,
        difficulty: 'Medium',
        creditMinutes: d.credit,
        isCompleted: false
      })),
      appUsage: [
        { name: 'Instagram', minutesUsed: 0, limitMinutes: 30 },
        { name: 'Reddit', minutesUsed: 0, limitMinutes: 30 }
      ],
      lastUsedTimestamp: Date.now(),
      rotLastUpdatedAt: null,
      dailyLimitSeconds: DEFAULT_LIMIT,
      distractionApps: ['Instagram', 'Rednote', 'Facebook', 'Wechat', 'Twitter', 'YouTube'],
      recoveryApps: ['Anki', 'Duolingo', 'Books', 'Notes', 'Calendar'],
      customApps: [],
      userName: 'Potter',
      userColor: '#A7BBC7',
      userAddedTaskHistory: [],
      activeCircleId: null,
      circles: []
    };
  });

  const [settingsName, setSettingsName] = useState(state.userName);
  const [settingsLimit, setSettingsLimit] = useState(state.dailyLimitSeconds / 60);
  const [settingsColor, setSettingsColor] = useState(state.userColor);
  const [settingsDistraction, setSettingsDistraction] = useState(state.distractionApps);
  const [settingsRecovery, setSettingsRecovery] = useState(state.recoveryApps);
  const [customAppsDraft, setCustomAppsDraft] = useState<string[]>(state.customApps ?? []);

  // Track if we've already restored the rotting state on mount
  const hasRestoredRotting = useRef(false);

  const selectableApps = useMemo(() => {
    const combined = [...AVAILABLE_APPS, ...customAppsDraft];
    const seen = new Set<string>();
    const out: string[] = [];
    for (const a of combined) {
      const key = a.trim().toLowerCase();
      if (!key) continue;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(a.trim());
    }
    return out;
  }, [customAppsDraft]);

  useEffect(() => {
    localStorage.setItem('potto_v9_state', JSON.stringify(state));
  }, [state]);

  // Restore activeRotting state when app loads if there was an active rotting session
  useEffect(() => {
    // Only restore once on mount
    if (hasRestoredRotting.current) return;
    hasRestoredRotting.current = true;

    // Check if there was an active rotting session when the tab was closed
    const rotLastUpdatedAt = state.rotLastUpdatedAt;
    const dailyAllowanceRemaining = state.dailyAllowanceRemaining;
    
    if (rotLastUpdatedAt && dailyAllowanceRemaining > 0) {
      const now = Date.now();
      const last = rotLastUpdatedAt;
      const deltaSeconds = Math.floor((now - last) / 1000);
      
      // If less than 6 minutes passed, restore the rotting session
      // This prevents restoring sessions that were closed a long time ago
      // Using 6 minutes to account for time switching between apps and websites
      if (deltaSeconds > 0 && deltaSeconds < 360) {
        // Immediately account for time that passed while tab was closed
        setState(prev => {
          const remaining = Math.max(0, prev.dailyAllowanceRemaining - deltaSeconds);
          const updatedUsage = prev.appUsage.map(app => ({
            ...app,
            minutesUsed: app.minutesUsed + deltaSeconds / 60
          }));
          return {
            ...prev,
            dailyAllowanceRemaining: remaining,
            appUsage: updatedUsage,
            rotLastUpdatedAt: now
          };
        });
        
        // Restore activeRotting state
        setActiveRotting(true);
      } else if (deltaSeconds >= 360) {
        // If more than 6 minutes passed, clear the rotting session
        setState(prev => ({ ...prev, rotLastUpdatedAt: null }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  useEffect(() => {
    if (showSettings) {
      setSettingsName(state.userName);
      const limitMinutes = state.dailyLimitSeconds / 60;
      setSettingsLimit(Math.min(MAX_LIMIT_MINUTES, Math.max(MIN_LIMIT_MINUTES, limitMinutes)));
      setSettingsColor(state.userColor);
      setSettingsDistraction(state.distractionApps);
      setSettingsRecovery(state.recoveryApps);
      setCustomAppsDraft(state.customApps ?? []);
      setAddingAppTo(null);
      setNewAppName('');
    }
  }, [showSettings, state]);

  // Main Rotting Logic
  useEffect(() => {
    let interval: any;
    if (activeRotting && state.dailyAllowanceRemaining > 0 && !showBreathingBreak) {
      interval = setInterval(() => {
        setState(prev => {
          const now = Date.now();
          const last = prev.rotLastUpdatedAt ?? now;
          const deltaSeconds = Math.floor((now - last) / 1000);
          if (deltaSeconds <= 0) {
            return { ...prev, rotLastUpdatedAt: now };
          }
          const remaining = Math.max(0, prev.dailyAllowanceRemaining - deltaSeconds);
          const updatedUsage = prev.appUsage.map(app => ({
            ...app,
            minutesUsed: app.minutesUsed + deltaSeconds / 60
          }));
          return {
            ...prev,
            dailyAllowanceRemaining: remaining,
            appUsage: updatedUsage,
            rotLastUpdatedAt: now
          };
        });
      }, 1000);
    } else if (state.dailyAllowanceRemaining <= 0 && activeRotting) {
      setActiveRotting(false);
    }
    return () => clearInterval(interval);
  }, [activeRotting, state.dailyAllowanceRemaining, showBreathingBreak]);

  // When a break ends while still rotting, reset the timing baseline so break time doesn't consume air
  useEffect(() => {
    if (!showBreathingBreak && activeRotting) {
      setState(prev => ({ ...prev, rotLastUpdatedAt: Date.now() }));
    }
  }, [showBreathingBreak, activeRotting]);

  useEffect(() => {
    let breakInterval: any;
    if (activeRotting && !showBreathingBreak) {
      breakInterval = setInterval(() => {
        setShowBreathingBreak(true);
        setIsManualBreath(false); // Auto-triggered
        setCountdownSeconds(10);
      }, BREAK_INTERVAL * 1000);
    }
    return () => clearInterval(breakInterval);
  }, [activeRotting, showBreathingBreak]);

  useEffect(() => {
    let timer: any;
    if ((isCountingDownToDive || showBreathingBreak) && countdownSeconds > 0) {
      timer = setTimeout(() => setCountdownSeconds(s => s - 1), 1000);
    } else if (countdownSeconds === 0) {
      if (isCountingDownToDive) {
        setIsCountingDownToDive(false);
        setActiveRotting(true);
      } else if (showBreathingBreak && !isManualBreath) {
        // Auto-triggered breathing break - auto close
        setShowBreathingBreak(false);
      }
      // Manual breathing break stays open until user chooses
    }
    return () => clearTimeout(timer);
  }, [isCountingDownToDive, showBreathingBreak, countdownSeconds, isManualBreath]);

  const addTask = (title: string, description?: string, credit: number = 5) => {
    if (!title.trim()) return;
    const newTask: Task = {
      id: Math.random().toString(36).substr(2, 9),
      title,
      description,
      difficulty: 'Medium',
      creditMinutes: credit,
      isCompleted: false
    };
    setState(prev => ({
      ...prev,
      tasks: [newTask, ...prev.tasks],
      userAddedTaskHistory: (!DAILY_DEFAULTS.some(d => d.title === title) && !prev.userAddedTaskHistory.includes(title))
        ? [title, ...prev.userAddedTaskHistory].slice(0, 8) 
        : prev.userAddedTaskHistory
    }));
    // Fix: Clear the task input title after successful creation
    setNewTaskTitle('');
  };

  const toggleTaskComplete = (taskId: string) => {
    setState(prev => {
      const task = prev.tasks.find(t => t.id === taskId);
      if (!task) return prev;
      const newIsCompleted = !task.isCompleted;
      const timeAdjustment = newIsCompleted ? (task.creditMinutes * 60) : -(task.creditMinutes * 60);
      return {
        ...prev,
        tasks: prev.tasks.map(t => t.id === taskId ? { ...t, isCompleted: newIsCompleted } : t),
        dailyAllowanceRemaining: Math.max(0, prev.dailyAllowanceRemaining + timeAdjustment)
      };
    });
  };

  const skipTaskWithDeduction = (taskId: string) => {
    setState(prev => ({
      ...prev,
      tasks: prev.tasks.filter(t => t.id !== taskId),
      dailyAllowanceRemaining: Math.max(0, prev.dailyAllowanceRemaining - (5 * 60))
    }));
  };

  const skipProcess = () => {
    setState(prev => ({ ...prev, dailyAllowanceRemaining: Math.max(0, prev.dailyAllowanceRemaining - (5 * 60)) }));
    setIsCountingDownToDive(false);
    setShowBreathingBreak(false);
    if (isCountingDownToDive) setActiveRotting(true);
  };

  const handleManualBreath = () => {
    setShowBreathingBreak(true);
    setIsManualBreath(true);
    setCountdownSeconds(10);
  };

  const startNewDay = () => {
    setState(prev => ({
      ...prev,
      dailyAllowanceRemaining: prev.dailyLimitSeconds,
      tasks: DAILY_DEFAULTS.map(d => ({
        id: Math.random().toString(36).substr(2, 9),
        title: d.title,
        description: d.description,
        difficulty: 'Medium' as const,
        creditMinutes: d.credit,
        isCompleted: false
      })),
      appUsage: prev.appUsage.map(app => ({ ...app, minutesUsed: 0 })),
      lastUsedTimestamp: Date.now(),
      rotLastUpdatedAt: null
    }));
    setActiveRotting(false);
    setShowBreathingBreak(false);
    setIsManualBreath(false);
    setIsCountingDownToDive(false);
  };

  const saveSettings = () => {
    const clampedMinutes = Math.min(MAX_LIMIT_MINUTES, Math.max(MIN_LIMIT_MINUTES, Math.round(settingsLimit)));
    setState(prev => ({
      ...prev,
      userName: settingsName,
      dailyLimitSeconds: clampedMinutes * 60,
      userColor: settingsColor,
      distractionApps: settingsDistraction,
      recoveryApps: settingsRecovery,
      customApps: customAppsDraft,
    }));
    setShowSettings(false);
  };

  const addCustomApp = (listType: 'distraction' | 'recovery') => {
    const cleaned = newAppName.trim().replace(/\s+/g, ' ');
    if (!cleaned) return;
    const key = cleaned.toLowerCase();

    setCustomAppsDraft(prev => {
      const has = prev.some(a => a.trim().toLowerCase() === key) || AVAILABLE_APPS.some(a => a.trim().toLowerCase() === key);
      return has ? prev : [cleaned, ...prev];
    });

    if (listType === 'distraction') {
      setSettingsDistraction(prev => (prev.some(a => a.trim().toLowerCase() === key) ? prev : [cleaned, ...prev]));
    } else {
      setSettingsRecovery(prev => (prev.some(a => a.trim().toLowerCase() === key) ? prev : [cleaned, ...prev]));
    }

    setNewAppName('');
    setAddingAppTo(null);
  };

  const toggleAppSelection = (listType: 'distraction' | 'recovery', appName: string) => {
    if (listType === 'distraction') {
      setSettingsDistraction(prev => prev.includes(appName) ? prev.filter(a => a !== appName) : [...prev, appName]);
    } else {
      setSettingsRecovery(prev => prev.includes(appName) ? prev.filter(a => a !== appName) : [...prev, appName]);
    }
  };

  // Social Circle Actions
  const createCircle = () => {
    if (!newCircleName.trim()) return;
    const newId = Math.random().toString(36).substr(2, 6).toUpperCase();
    const newCircle: Circle = {
      id: newId,
      name: newCircleName,
      inviteCode: newId,
      members: [{
        name: state.userName,
        tasksCompleted: state.tasks.filter(t => t.isCompleted).length,
        screenTimeHours: 0.1,
        userColor: state.userColor,
        isMe: true
      }]
    };
    setState(prev => ({
      ...prev,
      circles: [...prev.circles, newCircle],
      activeCircleId: newId
    }));
    setNewCircleName('');
  };

  const joinCircle = () => {
    if (!joinCircleCode.trim()) return;
    // In a real app, this would fetch from a backend. Simulated here.
    const found = state.circles.find(c => c.inviteCode === joinCircleCode.toUpperCase());
    if (found) {
      setState(prev => ({ ...prev, activeCircleId: found.id }));
    } else {
      // Create a dummy one for simulation if not found locally
      const mockCircle: Circle = {
        id: joinCircleCode.toUpperCase(),
        name: `Circle ${joinCircleCode}`,
        inviteCode: joinCircleCode.toUpperCase(),
        members: [
          { name: 'Ji-won', tasksCompleted: 15, screenTimeHours: 0.2, userColor: '#D8E2DC' },
          { name: 'Sora', tasksCompleted: 8, screenTimeHours: 1.1, userColor: '#EAE4E9' },
          { name: state.userName, tasksCompleted: state.tasks.filter(t => t.isCompleted).length, screenTimeHours: 0.4, userColor: state.userColor, isMe: true }
        ]
      };
      setState(prev => ({
        ...prev,
        circles: [...prev.circles, mockCircle],
        activeCircleId: mockCircle.id
      }));
    }
    setJoinCircleCode('');
  };

  const activeTasksCount = state.tasks.filter(t => !t.isCompleted).length;
  const isLocked = activeTasksCount >= 10;
  const isTimeOut = state.dailyAllowanceRemaining <= 0;

  const activeCircle = state.circles.find(c => c.id === state.activeCircleId);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-[#F9F9F9] text-[#4A4A4A] pb-24 transition-opacity duration-500">
      
      {/* Block Access View */}
      {isTimeOut && !activeRotting && (view === View.ANCHOR || view === View.SOCIAL) && (
        <div className="fixed inset-0 bg-white/95 backdrop-blur-md z-[1000] flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
           <div className="w-24 h-24 text-rose-300 mb-8 drop-shadow-sm">
              <Icons.Anchor className="w-full h-full" />
           </div>
           <h2 className="text-2xl font-light tracking-widest text-slate-400 mb-4 uppercase">Your App is Blocked</h2>
           <p className="text-slate-400 text-xs max-w-xs leading-loose mb-12">
              You've exhausted your allowed screen time. <br/>
              <span className="font-bold text-potto-blue">Gain more by surfacing and completing your pending duties!</span>
           </p>
           <button onClick={() => setView(View.DUTIES)} className="px-10 py-4 bg-potto-blue text-white rounded-full text-xs font-bold uppercase tracking-widest soft-shadow active:scale-95 transition-all">
             Go to Duties Hub
           </button>
        </div>
      )}

      {/* Header */}
      <header className="pt-12 pb-6 flex flex-col items-center gap-2 relative">
        {view === View.DUTIES && (
          <button onClick={startNewDay} className="absolute right-6 top-14 text-[10px] font-bold uppercase tracking-widest text-slate-300 hover:text-potto-blue transition-colors py-2 px-3">
            New Day to Sail
          </button>
        )}
        {view === View.SOCIAL && (
          <button onClick={() => setShowSettings(true)} className="absolute left-6 top-14 text-slate-300 hover:text-potto-blue transition-colors p-2">
            <Icons.Settings className="w-5 h-5" />
          </button>
        )}
        <div className="w-16 h-16 text-[#4A4A4A] animate-drift">
          <Icons.Octopus />
        </div>
        <h1 className="text-xl font-light tracking-[0.2em] lowercase text-slate-300">potto</h1>
      </header>

      <main className="max-w-md mx-auto px-6">
        {/* VIEW 1: DUTIES */}
        {view === View.DUTIES && (
          <div className="space-y-8 animate-in slide-in-from-left duration-500">
            <div className="space-y-3">
              <div className="flex justify-between items-center ml-1">
                <h2 className="text-[10px] uppercase font-bold tracking-widest text-slate-300">Active Duty Board</h2>
                <span className={`text-[10px] font-bold ${isLocked ? 'text-rose-300' : 'text-slate-300'}`}>{activeTasksCount}/10 Pending</span>
              </div>
              <div className="space-y-3">
                {[...state.tasks].sort((a,b) => (a.isCompleted === b.isCompleted ? 0 : a.isCompleted ? 1 : -1)).map(task => (
                  <div key={task.id} className={`bg-white p-5 rounded-4xl flex items-center justify-between border transition-all ${task.isCompleted ? 'opacity-30 border-transparent bg-slate-50/50 grayscale' : 'border-white soft-shadow'}`}>
                    <div className="flex items-start gap-4 flex-1">
                      <input type="checkbox" className="mt-1" checked={task.isCompleted} onChange={() => toggleTaskComplete(task.id)} />
                      <div className={`flex-1 ${task.isCompleted ? 'line-through decoration-slate-300 text-slate-400' : ''}`}>
                        <h3 className="text-sm font-semibold leading-tight">{task.title}</h3>
                        {task.description && <p className="text-[11px] text-slate-400 mt-0.5">{task.description}</p>}
                        {!task.isCompleted && (
                          <button onClick={() => skipTaskWithDeduction(task.id)} className="mt-2 text-[9px] uppercase font-bold text-rose-300/70 hover:text-rose-400 transition-colors">
                            Skip Duty (-5m Air)
                          </button>
                        )}
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold ml-2 ${task.isCompleted ? 'text-slate-300' : 'text-potto-blue'}`}>+{task.creditMinutes}m</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-4xl p-6 soft-shadow border border-white">
              <h2 className="text-[10px] uppercase font-bold tracking-widest text-slate-300 mb-4 ml-1">New Anchor</h2>
              <div className="space-y-3">
                <input type="text" placeholder="Title of the duty" className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm outline-none placeholder:text-slate-300 focus:ring-1 ring-potto-blue/20" value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} />
                <button onClick={() => addTask(newTaskTitle)} className="w-full bg-potto-blue text-white py-4 rounded-full text-xs font-bold uppercase tracking-widest soft-shadow active:scale-95 transition-all">Confirm Duty</button>
              </div>
            </div>

            <div className="space-y-3">
              <h2 className="text-[10px] uppercase font-bold tracking-widest text-slate-300 ml-1">Suggested Anchors</h2>
              <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar">
                {[...state.userAddedTaskHistory.map(title => ({ title, credit: 5, description: 'User added' })), ...DAILY_DEFAULTS].map((task, idx) => (
                  <button key={idx} onClick={() => addTask(task.title, task.description, task.credit)} className="flex-shrink-0 bg-white border border-slate-50 rounded-3xl p-4 soft-shadow text-left w-40 hover:border-potto-blue transition-colors group">
                    <div className="text-[10px] font-bold text-potto-blue mb-1">+{task.credit}m</div>
                    <div className="text-xs font-bold truncate">{task.title}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: ANCHOR */}
        {view === View.ANCHOR && (
          <div className="space-y-10 animate-in fade-in duration-500">
            <div className="flex flex-col items-center justify-center pt-8">
              <div className="w-56 h-56 rounded-full bg-white soft-shadow flex items-center justify-center relative overflow-hidden">
                <svg viewBox="0 0 224 224" className="absolute inset-0 w-full h-full -rotate-90">
                  <circle cx="112" cy="112" r="100" fill="none" stroke="#F1F5F9" strokeWidth="8" />
                  <circle cx="112" cy="112" r="100" fill="none" stroke={isTimeOut ? "#FDA4AF" : "#A7BBC7"} strokeWidth="8" strokeDasharray="628" strokeDashoffset={628 - (628 * (state.dailyAllowanceRemaining / state.dailyLimitSeconds))} className="transition-all duration-1000" strokeLinecap="round" />
                </svg>
                <div className="text-center z-10">
                  <span className={`text-5xl font-light block tabular-nums tracking-tighter ${isTimeOut ? 'text-rose-300' : 'text-slate-600'}`}>{formatTime(state.dailyAllowanceRemaining)}</span>
                  <span className="text-[10px] uppercase tracking-widest text-slate-300 font-bold mt-1 block">Air Remaining to Dive</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-[10px] uppercase font-bold tracking-widest text-slate-300 ml-1">Distraction Usage</h2>
              <div className="bg-white rounded-4xl p-6 soft-shadow space-y-4 border border-white">
                {state.distractionApps.map(name => (
                  <div key={name} className="flex justify-between items-center group">
                    <span className="text-xs font-bold text-slate-500 group-hover:text-potto-blue transition-colors">{name}</span>
                    <span className="text-[10px] text-slate-400 font-bold tabular-nums">active monitor</span>
                  </div>
                ))}
              </div>
            </div>

            <button disabled={isLocked || isTimeOut} onClick={() => { setIsCountingDownToDive(true); setCountdownSeconds(10); }} className={`w-full py-5 rounded-full soft-shadow flex items-center justify-center gap-3 border transition-all ${isLocked || isTimeOut ? 'bg-slate-50 text-slate-200 border-slate-100 opacity-50' : 'bg-white border-slate-100 text-slate-400 hover:text-potto-blue active:scale-95'}`}>
              <Icons.Anchor className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-widest">{isLocked ? 'Duty Lock Active' : isTimeOut ? 'Out of Air' : 'Dive into Socials'}</span>
            </button>
            {activeRotting && (
              <>
                <button onClick={handleManualBreath} className="w-full py-4 bg-white border border-slate-200 text-slate-500 rounded-full soft-shadow text-xs font-bold uppercase tracking-widest hover:text-potto-blue hover:border-potto-blue/30 transition-all active:scale-95">
                  Take a Breath
                </button>
                <button onClick={() => { setActiveRotting(false); setShowBreathingBreak(false); setIsManualBreath(false); }} className="w-full py-5 bg-potto-blue text-white rounded-full soft-shadow animate-pulse text-xs font-bold uppercase tracking-widest">Surface for Air</button>
              </>
            )}
          </div>
        )}

        {/* VIEW 3: SOCIAL BOARD */}
        {view === View.SOCIAL && (
          <div className="space-y-6 animate-in slide-in-from-right duration-500">
            <div className="flex justify-center mt-4">
              <div className="bg-white p-1 rounded-full flex soft-shadow border border-slate-50">
                <button onClick={() => setSocialTab('WORLD')} className={`px-8 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${socialTab === 'WORLD' ? 'bg-potto-blue text-white shadow-sm' : 'text-slate-300'}`}>The World</button>
                <button onClick={() => setSocialTab('CIRCLE')} className={`px-8 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${socialTab === 'CIRCLE' ? 'bg-potto-blue text-white shadow-sm' : 'text-slate-300'}`}>My Circle</button>
              </div>
            </div>
            
            {socialTab === 'WORLD' ? (
              <div className="space-y-3">
                {[{ name: state.userName, tasks: state.tasks.filter(t => t.isCompleted).length, color: state.userColor, isMe: true }, { name: 'Ji-won', tasks: 15, color: '#D8E2DC' }, { name: 'Sora', tasks: 8, color: '#EAE4E9' }].map((u, i) => (
                  <div key={i} className={`bg-white/70 p-4 rounded-4xl flex items-center gap-4 border transition-transform ${u.isMe ? 'border-potto-blue/40 scale-[1.02] bg-white' : 'border-white'} soft-shadow`}>
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shadow-inner" style={{ backgroundColor: u.color }}>{u.name[0]}</div>
                    <div className="flex-1">
                      <div className="text-xs font-bold">{u.name}</div>
                      <div className="text-[10px] text-slate-400">{u.tasks} duties completed</div>
                    </div>
                    <div className="text-xs font-bold text-potto-blue">#{i+1}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-6">
                {!state.activeCircleId ? (
                  <div className="space-y-6">
                    <div className="bg-white rounded-4xl p-6 soft-shadow border border-white space-y-4">
                      <h3 className="text-[10px] uppercase font-bold text-slate-300 tracking-widest">Join a Circle</h3>
                      <div className="flex gap-2">
                        <input type="text" placeholder="Circle Code" className="flex-1 bg-slate-50 rounded-xl p-3 text-xs outline-none focus:ring-1 ring-potto-blue/20" value={joinCircleCode} onChange={e => setJoinCircleCode(e.target.value)} />
                        <button onClick={joinCircle} className="px-5 bg-potto-blue text-white rounded-xl text-xs font-bold">Join</button>
                      </div>
                    </div>
                    <div className="bg-white rounded-4xl p-6 soft-shadow border border-white space-y-4">
                      <h3 className="text-[10px] uppercase font-bold text-slate-300 tracking-widest">Start New Circle</h3>
                      <div className="flex gap-2">
                        <input type="text" placeholder="Circle Name" className="flex-1 bg-slate-50 rounded-xl p-3 text-xs outline-none focus:ring-1 ring-potto-blue/20" value={newCircleName} onChange={e => setNewCircleName(e.target.value)} />
                        <button onClick={createCircle} className="px-5 bg-slate-100 text-slate-400 rounded-xl text-xs font-bold">Create</button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center px-2">
                      <div>
                        <h3 className="text-sm font-bold text-slate-600">{activeCircle?.name}</h3>
                        <span className="text-[10px] text-slate-300 uppercase tracking-widest font-bold">Invite Code: {activeCircle?.inviteCode}</span>
                      </div>
                      <button onClick={() => setState(prev => ({ ...prev, activeCircleId: null }))} className="text-rose-300 text-[10px] font-bold uppercase tracking-widest">Leave</button>
                    </div>
                    <div className="space-y-3">
                      {activeCircle?.members.map((m, i) => (
                        <div key={i} className={`bg-white p-4 rounded-4xl flex items-center gap-4 border ${m.isMe ? 'border-potto-blue/40' : 'border-white'} soft-shadow`}>
                          <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: m.userColor }}>{m.name[0]}</div>
                          <div className="flex-1">
                            <div className="text-xs font-bold">{m.name}</div>
                            <div className="text-[10px] text-slate-400">{m.tasksCompleted} duties</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Breathing Overlay - Fixed Alignment */}
      {(isCountingDownToDive || showBreathingBreak) && (
        <div className="fixed inset-0 bg-[#F9F9F9]/95 z-[200] flex flex-col items-center justify-center p-8 text-center backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-48 h-48 rounded-full bg-white soft-shadow flex items-center justify-center animate-drift mb-12 relative">
            <svg viewBox="0 0 160 160" className="absolute inset-0 w-full h-full -rotate-90">
               <circle cx="80" cy="80" r="70" fill="none" stroke="#F1F5F9" strokeWidth="6" />
               <circle cx="80" cy="80" r="70" fill="none" stroke="#A7BBC7" strokeWidth="6" strokeDasharray="440" strokeDashoffset={440 - (440 * (countdownSeconds / 10))} className="transition-all duration-1000" strokeLinecap="round" />
            </svg>
            <span className="text-5xl font-light text-potto-blue z-10 tabular-nums">{countdownSeconds}</span>
          </div>
          <h2 className="text-xl font-light tracking-widest mb-4">Quiet Breath.</h2>
          <p className="text-slate-400 text-xs max-w-xs leading-loose mb-12">Take a moment to center yourself before moving forward.</p>
          <div className="flex flex-col gap-3 items-center">
            {showBreathingBreak && isManualBreath && countdownSeconds === 0 && (
              <div className="flex gap-3">
                <button onClick={() => { setShowBreathingBreak(false); setIsManualBreath(false); }} className="px-6 py-3 bg-white border border-slate-200 text-slate-500 rounded-full text-xs font-bold uppercase tracking-widest hover:text-potto-blue hover:border-potto-blue/30 transition-all">
                  Return to Socials
                </button>
                <button onClick={() => { 
                  // Reward 2 minutes for choosing to surface after breathing break
                  setState(prev => ({
                    ...prev,
                    dailyAllowanceRemaining: Math.min(prev.dailyLimitSeconds, prev.dailyAllowanceRemaining + (2 * 60))
                  }));
                  setActiveRotting(false); 
                  setShowBreathingBreak(false); 
                  setIsManualBreath(false); 
                }} className="px-6 py-3 bg-potto-blue text-white rounded-full text-xs font-bold uppercase tracking-widest">
                  Surface for Air (+2m)
                </button>
              </div>
            )}
            {countdownSeconds > 0 && (
              <button onClick={() => {
                skipProcess();
                setIsManualBreath(false);
              }} className="text-[10px] font-bold uppercase tracking-widest text-slate-300 hover:text-rose-300 p-4">Skip Countdown (-5m Air)</button>
            )}
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/10 z-[300] flex items-end">
          <div className="w-full bg-white rounded-t-[48px] p-8 soft-shadow max-w-md mx-auto animate-in slide-in-from-bottom duration-500 max-h-[90vh] overflow-y-auto no-scrollbar">
            <div className="flex justify-between items-center mb-8 sticky top-0 bg-white z-10 py-2">
              <h2 className="text-xl font-light tracking-widest">Configuration</h2>
              <button onClick={() => setShowSettings(false)} className="text-slate-300 p-2">✕</button>
            </div>
            
            <div className="space-y-8">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-slate-300 tracking-widest">Identity</label>
                  <input type="text" value={settingsName} onChange={e => setSettingsName(e.target.value)} className="w-full bg-slate-50 rounded-2xl p-4 text-sm outline-none focus:ring-1 ring-potto-blue/30" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-slate-300 tracking-widest">Avatar Color</label>
                  <div className="flex gap-3">
                    {AVATAR_COLORS.map(c => (
                      <button key={c} onClick={() => setSettingsColor(c)} className={`w-9 h-9 rounded-full border-2 transition-all ${settingsColor === c ? 'border-potto-blue scale-110' : 'border-transparent scale-100'}`} style={{ backgroundColor: c }} />
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-slate-300 tracking-widest">Daily Social Time</label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min={MIN_LIMIT_MINUTES}
                      max={MAX_LIMIT_MINUTES}
                      value={Math.min(MAX_LIMIT_MINUTES, Math.max(MIN_LIMIT_MINUTES, Math.round(settingsLimit)))}
                      onChange={e => setSettingsLimit(Number(e.target.value))}
                      className="flex-1 h-2 bg-slate-100 rounded-full appearance-none cursor-pointer accent-potto-blue [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#A7BBC7] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-[#A7BBC7] [&::-moz-range-thumb]:border-0"
                    />
                    <span className="text-sm font-bold text-slate-500 tabular-nums w-10">{Math.min(MAX_LIMIT_MINUTES, Math.max(MIN_LIMIT_MINUTES, Math.round(settingsLimit)))} min</span>
                  </div>
                  <p className="text-[10px] text-slate-400">Min {MIN_LIMIT_MINUTES} · Max {MAX_LIMIT_MINUTES} minutes per day</p>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] uppercase font-bold text-slate-300 tracking-widest">Distraction Apps</label>
                <div className="flex flex-wrap gap-2">
                  {selectableApps.map(app => (
                    <button key={app} onClick={() => toggleAppSelection('distraction', app)} className={`px-3 py-1.5 rounded-full text-[10px] font-bold border transition-all ${settingsDistraction.includes(app) ? 'bg-rose-50 border-rose-100 text-rose-400' : 'bg-white border-slate-100 text-slate-300'}`}>
                      {app}
                    </button>
                  ))}
                  <button onClick={() => { setAddingAppTo('distraction'); setNewAppName(''); }} className="px-3 py-1.5 rounded-full text-[10px] font-bold border border-slate-100 text-slate-300 bg-white hover:border-potto-blue/30 hover:text-potto-blue transition-all">
                    +
                  </button>
                </div>
                {addingAppTo === 'distraction' && (
                  <div className="flex gap-2">
                    <input value={newAppName} onChange={e => setNewAppName(e.target.value)} placeholder="Add app name" className="flex-1 bg-slate-50 rounded-xl p-3 text-xs outline-none focus:ring-1 ring-potto-blue/20" />
                    <button onClick={() => addCustomApp('distraction')} className="px-4 bg-potto-blue text-white rounded-xl text-xs font-bold">Add</button>
                    <button onClick={() => { setAddingAppTo(null); setNewAppName(''); }} className="px-4 bg-slate-100 text-slate-400 rounded-xl text-xs font-bold">Cancel</button>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <label className="text-[10px] uppercase font-bold text-slate-300 tracking-widest">Safe Apps</label>
                <div className="flex flex-wrap gap-2">
                  {selectableApps.map(app => (
                    <button key={app} onClick={() => toggleAppSelection('recovery', app)} className={`px-3 py-1.5 rounded-full text-[10px] font-bold border transition-all ${settingsRecovery.includes(app) ? 'bg-potto-blue/10 border-potto-blue/20 text-potto-blue' : 'bg-white border-slate-100 text-slate-300'}`}>
                      {app}
                    </button>
                  ))}
                  <button onClick={() => { setAddingAppTo('recovery'); setNewAppName(''); }} className="px-3 py-1.5 rounded-full text-[10px] font-bold border border-slate-100 text-slate-300 bg-white hover:border-potto-blue/30 hover:text-potto-blue transition-all">
                    +
                  </button>
                </div>
                {addingAppTo === 'recovery' && (
                  <div className="flex gap-2">
                    <input value={newAppName} onChange={e => setNewAppName(e.target.value)} placeholder="Add app name" className="flex-1 bg-slate-50 rounded-xl p-3 text-xs outline-none focus:ring-1 ring-potto-blue/20" />
                    <button onClick={() => addCustomApp('recovery')} className="px-4 bg-potto-blue text-white rounded-xl text-xs font-bold">Add</button>
                    <button onClick={() => { setAddingAppTo(null); setNewAppName(''); }} className="px-4 bg-slate-100 text-slate-400 rounded-xl text-xs font-bold">Cancel</button>
                  </div>
                )}
              </div>

              <button onClick={saveSettings} className="w-full py-5 bg-potto-blue text-white rounded-full text-xs font-bold uppercase tracking-widest mb-4">Save Configuration</button>
            </div>
          </div>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-slate-100 p-6 z-50">
        <div className="max-w-md mx-auto flex justify-around items-center">
          <NavButton active={view === View.DUTIES} onClick={() => setView(View.DUTIES)} icon={<Icons.Home />} />
          <NavButton active={view === View.ANCHOR} onClick={() => setView(View.ANCHOR)} icon={<Icons.Anchor />} />
          <NavButton active={view === View.SOCIAL} onClick={() => setView(View.SOCIAL)} icon={<Icons.Social />} />
        </div>
      </nav>
    </div>
  );
};

const NavButton: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode }> = ({ active, onClick, icon }) => (
  <button onClick={onClick} className={`transition-all duration-300 p-2 ${active ? 'text-potto-blue scale-125' : 'text-slate-300'}`}>
    {React.cloneElement(icon as React.ReactElement, { className: 'w-6 h-6' })}
  </button>
);

export default App;
