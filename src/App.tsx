/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Colleague, Absence, ShiftSettings, ManualOverride, CalendarDay } from './types';
import { MobileFrame } from './components/MobileFrame';
import { PlanningView } from './components/PlanningView';
import { DesktopPlanningView } from './components/DesktopPlanningView';
import { ColleaguesView } from './components/ColleaguesView';
import { SettingsView } from './components/SettingsView';
import { AuthView } from './components/AuthView';
import { OnboardingModal } from './components/OnboardingModal';
import { TeamMgmtView } from './components/TeamMgmtView';
import { FirebaseProvider, useAuth } from './components/FirebaseContext';
import { AdminProvider } from './components/AdminContext';
import { AdminDashboard } from './components/AdminDashboard';
import { generateSchedule, computeStats, getISOWeekNumber } from './utils/scheduler';
import { getInitialDemoData } from './utils/demoData';
import {
  Coffee, Calendar, Users, Settings, Cloud, CloudOff,
  Copy, Check, Share2, LayoutGrid
} from 'lucide-react';

export default function App() {
  if (window.location.pathname === '/admin') {
    return (
      <AdminProvider>
        <AdminDashboard />
      </AdminProvider>
    );
  }
  return <AppFirebase />;
}

function AppFirebase() {
  const [colleagues, setColleagues] = useState<Colleague[]>([]);
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [settings, setSettings] = useState<ShiftSettings>({
    startWeekDate: '',
    workDays: [1, 2, 3, 4, 5],
    morningWeeks: [true, true, true, true, true, true],
    numberOfWeeks: 6,
  });
  const [overrides, setOverrides] = useState<ManualOverride>({});

  return (
    <FirebaseProvider
      onSyncColleagues={setColleagues}
      onSyncAbsences={setAbsences}
      onSyncSettings={setSettings}
      onSyncOverrides={setOverrides}
    >
      <AppContent
        colleagues={colleagues}
        setColleagues={setColleagues}
        absences={absences}
        setAbsences={setAbsences}
        settings={settings}
        setSettings={setSettings}
        overrides={overrides}
        setOverrides={setOverrides}
      />
    </FirebaseProvider>
  );
}

interface AppContentProps {
  colleagues: Colleague[];
  setColleagues: React.Dispatch<React.SetStateAction<Colleague[]>>;
  absences: Absence[];
  setAbsences: React.Dispatch<React.SetStateAction<Absence[]>>;
  settings: ShiftSettings;
  setSettings: React.Dispatch<React.SetStateAction<ShiftSettings>>;
  overrides: ManualOverride;
  setOverrides: React.Dispatch<React.SetStateAction<ManualOverride>>;
}

function AppContent({
  colleagues,
  setColleagues,
  absences,
  setAbsences,
  settings,
  setSettings,
  overrides,
  setOverrides
}: AppContentProps) {
  const [activeTab, setActiveTab] = useState<'planning' | 'colleagues' | 'settings'>('planning');
  const [showNav, setShowNav] = useState(true);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [autoRecalculate, setAutoRecalculate] = useState(true);
  const [pendingRecalculate, setPendingRecalculate] = useState(false);
  const cachedScheduleRef = useRef<CalendarDay[]>([]);

  // Mark pending when data changes while auto-recalc is disabled
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!autoRecalculate) setPendingRecalculate(true);
  }, [colleagues, absences, settings, overrides]);

  // Clear pending when auto-recalc is re-enabled
  useEffect(() => {
    if (autoRecalculate) setPendingRecalculate(false);
  }, [autoRecalculate]);

  const {
    user,
    profile,
    loading: authLoading,
    activeTeamId,
    teamName,
    currentUserRole,
    signOutUser,
    leaveTeam,
    updateSettingsInDB,
    updateOverridesInDB,
    addColleagueInDB,
    updateColleagueInDB,
    deleteColleagueInDB,
    addAbsenceInDB,
    deleteAbsenceInDB
  } = useAuth();

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showTeamPanel, setShowTeamPanel] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [coApporteurs, setCoApporteurs] = useState<Record<string, string>>({});

  useEffect(() => {
    try {
      const storedColleagues = localStorage.getItem('breakfast_colleagues');
      const storedAbsences = localStorage.getItem('breakfast_absences');
      const storedSettings = localStorage.getItem('breakfast_settings');
      const storedOverrides = localStorage.getItem('breakfast_overrides');

      if (storedColleagues && storedSettings) {
        setColleagues(JSON.parse(storedColleagues));
        setAbsences(storedAbsences ? JSON.parse(storedAbsences) : []);
        const parsedSettings = JSON.parse(storedSettings);
        if (!parsedSettings.numberOfWeeks) parsedSettings.numberOfWeeks = 6;
        setSettings(parsedSettings);
        setOverrides(storedOverrides ? JSON.parse(storedOverrides) : {});
      } else {
        const demo = getInitialDemoData();
        setColleagues(demo.colleagues);
        setAbsences(demo.absences);
        setSettings({ ...demo.settings, numberOfWeeks: 6 });
        setOverrides({});
      }
    } catch (e) {
      const demo = getInitialDemoData();
      setColleagues(demo.colleagues);
      setAbsences(demo.absences);
      setSettings({ ...demo.settings, numberOfWeeks: 6 });
      setOverrides({});
    }
    setIsLoaded(true);
  }, [setColleagues, setAbsences, setSettings, setOverrides]);

  useEffect(() => {
    if (!isLoaded || activeTeamId) return;
    try {
      localStorage.setItem('breakfast_colleagues', JSON.stringify(colleagues));
      localStorage.setItem('breakfast_absences', JSON.stringify(absences));
      localStorage.setItem('breakfast_settings', JSON.stringify(settings));
      localStorage.setItem('breakfast_overrides', JSON.stringify(overrides));
    } catch (e) {
      console.error("Could not write to localStorage", e);
    }
  }, [colleagues, absences, settings, overrides, isLoaded, activeTeamId]);

  const handleAddColleague = (name: string, color: string) => {
    const totalPlannedBefore = colleagues.length > 0
      ? Math.round(colleagues.reduce((acc, c) => acc + c.initialCount, 0) / colleagues.length)
      : 0;
    const newCol: Colleague = {
      id: Date.now().toString(),
      name, color,
      isActive: true,
      initialCount: totalPlannedBefore,
    };
    if (activeTeamId) addColleagueInDB(newCol);
    else setColleagues([...colleagues, newCol]);
  };

  const handleUpdateColleague = (updatedCol: Colleague) => {
    if (activeTeamId) updateColleagueInDB(updatedCol);
    else setColleagues(colleagues.map((c) => (c.id === updatedCol.id ? updatedCol : c)));
  };

  const handleDeleteColleague = (id: string) => {
    const assocAbsIds = absences.filter((abs) => abs.colleagueId === id).map(abs => abs.id);
    if (activeTeamId) {
      const newOverrides = { ...overrides };
      let overridesChanged = false;
      Object.keys(newOverrides).forEach((dateKey) => {
        if (newOverrides[dateKey] === id) { delete newOverrides[dateKey]; overridesChanged = true; }
      });
      if (overridesChanged) updateOverridesInDB(newOverrides);
      deleteColleagueInDB(id, assocAbsIds);
    } else {
      setColleagues(colleagues.filter((c) => c.id !== id));
      setAbsences(absences.filter((abs) => abs.colleagueId !== id));
      const newOverrides = { ...overrides };
      Object.keys(newOverrides).forEach((dateKey) => {
        if (newOverrides[dateKey] === id) delete newOverrides[dateKey];
      });
      setOverrides(newOverrides);
    }
  };

  const handleAddAbsence = (colleagueId: string, startDate: string, endDate: string, reason: string) => {
    const newAbs: Absence = { id: Date.now().toString(), colleagueId, startDate, endDate, reason };
    if (activeTeamId) addAbsenceInDB(newAbs);
    else setAbsences([...absences, newAbs]);
  };

  const handleDeleteAbsence = (id: string) => {
    if (activeTeamId) deleteAbsenceInDB(id);
    else setAbsences(absences.filter((abs) => abs.id !== id));
  };

  const handleSetOverride = (dateString: string, colleagueId: string | null) => {
    const newOverrides = { ...overrides, [dateString]: colleagueId };
    if (activeTeamId) updateOverridesInDB(newOverrides);
    else setOverrides(newOverrides);
  };

  const handleClearOverride = (dateString: string) => {
    const newOverrides = { ...overrides };
    delete newOverrides[dateString];
    if (activeTeamId) updateOverridesInDB(newOverrides);
    else setOverrides(newOverrides);
  };

  const handleUpdateSettings = (newSettings: ShiftSettings) => {
    if (activeTeamId && currentUserRole === 'viewer') return;
    setSettings(newSettings);
    if (activeTeamId) updateSettingsInDB(newSettings);
  };

  const handleResetDemoData = () => {
    if (activeTeamId) {
      if (window.confirm("Action désactivée en mode synchronisé. Souhaitez-vous d'abord quitter l'équipe ?")) leaveTeam();
      return;
    }
    if (window.confirm("Voulez-vous charger les données de démonstration ?")) {
      const demo = getInitialDemoData();
      setColleagues(demo.colleagues);
      setAbsences(demo.absences);
      setSettings(demo.settings);
      setOverrides({});
    }
  };

  const handleClearAll = () => {
    if (activeTeamId) {
      if (window.confirm("Action désactivée en mode synchronisé. Souhaitez-vous quitter l'équipe ?")) leaveTeam();
      return;
    }
    if (window.confirm("Êtes-vous sûr de vouloir tout effacer ?")) {
      setColleagues([]);
      setAbsences([]);
      setOverrides({});
      const monday = new Date();
      const day = monday.getDay();
      monday.setDate(monday.getDate() - day + (day === 0 ? -6 : 1));
      const startMondayStr = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`;
      setSettings({ startWeekDate: startMondayStr, workDays: [1, 2, 3, 4, 5], morningWeeks: [true, true, true, true, true, true], numberOfWeeks: 6 });
    }
  };

  const handleCopyCode = () => {
    if (!activeTeamId) return;
    navigator.clipboard.writeText(activeTeamId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <div className="text-center space-y-3">
          <Coffee className="w-12 h-12 text-amber-500 animate-bounce mx-auto" />
          <p className="text-sm text-stone-600 font-medium">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthView onClose={() => {}} />;
  }

  if (!activeTeamId) {
    return <OnboardingModal />;
  }

  if (!settings.startWeekDate) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <div className="text-center space-y-3">
          <Coffee className="w-12 h-12 text-amber-500 animate-bounce mx-auto" />
          <p className="text-sm text-stone-600 font-medium">Chargement du planning...</p>
        </div>
      </div>
    );
  }

  const handleForceRecalculate = () => {
    cachedScheduleRef.current = generateSchedule(colleagues, absences, settings, overrides);
    setPendingRecalculate(false);
  };

  if (autoRecalculate) {
    cachedScheduleRef.current = generateSchedule(colleagues, absences, settings, overrides);
  }
  const schedule = cachedScheduleRef.current;
  const stats = computeStats(colleagues, schedule);
  const needsTeamSetup = user && !activeTeamId;

  const handleCopySummary = () => {
    const maxWeekIndex = Math.max(...schedule.map(d => d.weekIndex), 0);
    const weeks: CalendarDay[][] = [];
    for (let i = 0; i <= maxWeekIndex; i++) {
      weeks.push(schedule.filter((day) => day.weekIndex === i));
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    const DAY_FULL: Record<number, string> = {
      1: 'Lundi', 2: 'Mardi', 3: 'Mercredi',
      4: 'Jeudi', 5: 'Vendredi', 6: 'Samedi', 7: 'Dimanche'
    };

    const activeWeeks = weeks
      .filter(w => w[0]?.isMorningShift)
      .filter(w => {
        const lastDay = w.filter(d => d.isWorkDay).at(-1);
        return lastDay && lastDay.dateString >= todayStr;
      });

    const weekLines = activeWeeks.map(weekDays => {
      const workDays = weekDays.filter(d => d.isWorkDay);
      const firstDay = workDays[0]?.date;
      const lastDay = workDays[workDays.length - 1]?.date;
      const weekRange = firstDay && lastDay
        ? `du ${firstDay.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })} au ${lastDay.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}`
        : '';
      const isoWeek = getISOWeekNumber(new Date(weekDays[0]?.date));
      const assignedDays = workDays
        .filter(d => d.colleagueId !== null)
        .map(d => {
          const coApporteurId = coApporteurs[d.dateString];
          const coApporteur = coApporteurId ? colleagues.find(c => c.id === coApporteurId) : null;
          const coStr = coApporteur ? ` + ${coApporteur.name}` : '';
          return `  - ${DAY_FULL[d.dayOfWeek]} ${d.date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })} : ${d.colleagueName || '⚠️ Personne'}${coStr}`;
        })
        .join('\n');
      return `📅 Semaine ${isoWeek} (${weekRange})\n${assignedDays}`;
    }).join('\n\n');

    const dateAujourdhui = today.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

    const email = `Bonjour à tous,

Voici le planning des petits-déjeuners de l'équipe du matin pour les prochaines semaines.

${weekLines}

N'hésitez pas à me contacter si vous avez un empêchement ou souhaitez échanger votre créneau.

Bonne journée,
${profile?.displayName || 'L\'équipe'}

--
Planning généré le ${dateAujourdhui} via P'tit Déj Matinal 🥐`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
  navigator.clipboard.writeText(email).catch(() => {
    const ta = document.createElement('textarea');
    ta.value = email;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  });
} else {
  const ta = document.createElement('textarea');
  ta.value = email;
  document.body.appendChild(ta);
  ta.select();
  document.execCommand('copy');
  document.body.removeChild(ta);
}
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2500);
  };

  // ===== DESKTOP LAYOUT =====
  if (isDesktop) {
    const navItems = [
      { id: 'planning' as const, label: 'Planning', icon: Calendar },
      { id: 'colleagues' as const, label: 'Équipe', icon: Users },
      { id: 'settings' as const, label: 'Réglages', icon: Settings },
    ];

    return (
      <>
        <div className="flex h-screen overflow-hidden bg-[#FAF8F5] font-sans text-stone-800">
          <div className="fixed inset-0 bg-radial from-amber-50/30 via-stone-50/10 to-stone-100/10 -z-10 pointer-events-none" />

          {/* Sidebar */}
          <aside className="w-[250px] flex-shrink-0 bg-white border-r border-stone-200 flex flex-col h-screen">
            <div className="px-5 py-5 border-b border-stone-100 select-none">
              <div className="flex items-center gap-3">
                <div className="bg-amber-500 text-white p-1.5 rounded-xl flex items-center justify-center shadow-xs">
                  <Coffee className="w-5 h-5 fill-current" />
                </div>
                <div>
                  <h1 className="font-sans font-extrabold tracking-tight text-stone-900 leading-none text-base">
                    P'tit Déj 🥐
                  </h1>
                  {activeTeamId && (
                    <span className="font-mono font-bold uppercase tracking-wider text-emerald-700 text-[9px]">
                      Sync Cloud · {teamName}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <nav className="flex-1 px-3 py-4 space-y-0.5 select-none">
              {navItems.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all text-left ${
                    activeTab === id
                      ? 'bg-amber-100 text-amber-700 border border-amber-200'
                      : 'text-stone-500 hover:text-stone-900 hover:bg-stone-50'
                  }`}
                >
                  <Icon className={`w-4 h-4 flex-shrink-0 ${activeTab === id ? 'stroke-[2.5]' : 'stroke-2'}`} />
                  {label}
                </button>
              ))}
            </nav>

            <div className="p-3 border-t border-stone-100 select-none">
              {user ? (
                <button
                  onClick={() => setShowTeamPanel(true)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-stone-50 active:scale-98 transition-all text-left"
                >
                  <img
                    src={profile?.photoURL || `https://api.dicebear.com/7.x/identicon/svg?seed=${profile?.uid}`}
                    alt="Avatar"
                    className="w-8 h-8 rounded-full border border-stone-200 flex-shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-stone-900 truncate leading-tight">
                      {profile?.displayName || user.email}
                    </p>
                    <p className="text-[10px] text-stone-500 truncate">{user?.email}</p>
                  </div>
                  {activeTeamId
                    ? <Cloud className="w-3.5 h-3.5 text-emerald-500 animate-pulse flex-shrink-0" />
                    : <CloudOff className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                  }
                </button>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border border-stone-200 hover:bg-stone-50 hover:border-amber-300 active:scale-98 transition-all text-left"
                >
                  <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center flex-shrink-0">
                    <Cloud className="w-4 h-4 text-stone-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-stone-700">S'enregistrer</p>
                    <p className="text-[10px] text-stone-500">Activer la sync cloud</p>
                  </div>
                </button>
              )}
            </div>
          </aside>

          {/* Main area */}
          <div className="flex-1 flex flex-col overflow-hidden min-w-0">
            {!needsTeamSetup && !showAuthModal && (
              <header className="bg-white border-b border-stone-200 px-6 py-4 flex items-center justify-between z-10 shadow-xs flex-shrink-0 select-none">
                <div>
                  <h2 className="font-bold text-stone-900 text-lg leading-none">
                    {activeTab === 'planning' && `Planning — ${settings.numberOfWeeks} semaines`}
                    {activeTab === 'colleagues' && 'Équipe & Absences'}
                    {activeTab === 'settings' && 'Paramètres'}
                  </h2>
                  <p className="text-xs text-stone-500 font-medium mt-0.5">
                    {activeTab === 'planning' && 'Affichage calendrier haute résolution'}
                    {activeTab === 'colleagues' && 'Gestion des collaborateurs et congés'}
                    {activeTab === 'settings' && 'Configuration du planning'}
                  </p>
                </div>

                {activeTab === 'planning' && (
                  <button
                    onClick={handleCopySummary}
                    className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg shadow-xs transition-all ${
                      copiedText
                        ? 'bg-emerald-600 text-white'
                        : 'bg-amber-500 hover:bg-amber-600 text-white active:scale-95'
                    }`}
                  >
                    {copiedText ? (
                      <><Check className="w-4 h-4" /><span>Copié !</span></>
                    ) : (
                      <><Share2 className="w-4 h-4" /><span>Copier résumé</span></>
                    )}
                  </button>
                )}
              </header>
            )}

            <div className="flex-1 overflow-auto">
              {needsTeamSetup ? (
                <TeamMgmtView
                  localColleagues={colleagues}
                  localAbsences={absences}
                  localSettings={settings}
                  localOverrides={overrides}
                />
              ) : showAuthModal ? (
                <AuthView onClose={() => setShowAuthModal(false)} />
              ) : (
                <>
                  {activeTab === 'planning' && (
                    <DesktopPlanningView
                      schedule={schedule}
                      colleagues={colleagues}
                      onSetOverride={handleSetOverride}
                      onClearOverride={handleClearOverride}
                      startWeekDate={settings.startWeekDate}
                      numberOfWeeks={settings.numberOfWeeks}
                      coApporteurs={coApporteurs}
                      setCoApporteurs={setCoApporteurs}
                      currentUserRole={currentUserRole}
                      userDisplayName={profile?.displayName || null}
                    />
                  )}
                  {activeTab === 'colleagues' && (
                    <ColleaguesView
                      colleagues={colleagues}
                      absences={absences}
                      onAddColleague={handleAddColleague}
                      onUpdateColleague={handleUpdateColleague}
                      onDeleteColleague={handleDeleteColleague}
                      onAddAbsence={handleAddAbsence}
                      onDeleteAbsence={handleDeleteAbsence}
                      stats={stats}
                    />
                  )}
                  {activeTab === 'settings' && (
                    <SettingsView
                      settings={settings}
                      onUpdateSettings={handleUpdateSettings}
                      onResetDemoData={handleResetDemoData}
                      onClearAll={handleClearAll}
                      teamCode={activeTeamId}
                      readOnly={!!activeTeamId && currentUserRole === 'viewer'}
                    />
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Team panel */}
        {showTeamPanel && (
          <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-3xs z-50 flex items-center justify-center select-none">
            <div className="w-full max-w-md mx-4 bg-white rounded-3xl border border-stone-200 p-6 space-y-6 shadow-2xl">
              <div className="flex justify-between items-center border-b border-stone-100 pb-4">
                <div className="flex items-center gap-2">
                  <Cloud className="w-5 h-5 text-emerald-600 animate-pulse" />
                  <h3 className="font-extrabold text-stone-900">Espace Equipe Cloud</h3>
                </div>
                <button onClick={() => setShowTeamPanel(false)} className="text-stone-400 hover:text-stone-700 font-bold font-mono text-xs p-1">
                  [ Fermer ]
                </button>
              </div>

              <div className="flex items-center gap-3 bg-stone-50 border border-stone-200 p-4 rounded-2xl">
                <img
                  src={profile?.photoURL || `https://api.dicebear.com/7.x/identicon/svg?seed=${profile?.uid}`}
                  alt="Avatar"
                  className="w-10 h-10 rounded-full border border-stone-200 shadow-2xs"
                  referrerPolicy="no-referrer"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold text-stone-400 font-mono uppercase tracking-wider">Compte validé</p>
                  <h4 className="text-sm font-extrabold text-stone-900 truncate leading-tight">{profile?.displayName}</h4>
                  <p className="text-[11px] text-stone-500 truncate">{user?.email}</p>
                </div>
                <button
                  onClick={async () => { await signOutUser(); setShowTeamPanel(false); }}
                  className="bg-stone-200 hover:bg-stone-300 text-stone-700 font-bold text-[11px] font-mono px-3 py-1.5 rounded-lg transition-all"
                >
                  Déconnexion
                </button>
              </div>

              {activeTeamId ? (
                <div className="space-y-4">
                  <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-[10px] font-bold text-emerald-800 font-mono uppercase tracking-wider">Équipe Connectée</p>
                        <h4 className="font-extrabold text-stone-900 mt-0.5">{teamName}</h4>
                      </div>
                      <span className="bg-emerald-100 text-emerald-800 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border border-emerald-200 uppercase">Actif</span>
                    </div>
                    <div className="space-y-1 bg-white border border-emerald-100 rounded-xl p-3">
                      <p className="text-[10.5px] font-bold text-stone-500 block uppercase tracking-wide">Code pour vos collègues :</p>
                      <div className="flex items-center gap-2 pt-1">
                        <code className="flex-1 bg-stone-50 border border-stone-200 px-3 py-2 rounded-lg text-xs font-mono font-bold block select-all text-amber-700 text-center tracking-wide">
                          {activeTeamId}
                        </code>
                        <button
                          onClick={handleCopyCode}
                          className="bg-stone-900 hover:bg-stone-800 text-white font-bold p-2.5 rounded-lg border border-stone-950 active:scale-95 transition-all"
                        >
                          {copied ? <Check className="w-4 h-4 text-emerald-400 stroke-[3]" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <p className="text-[11px] text-emerald-800 leading-normal text-center italic">
                      💡 Partagez ce code avec vos co-équipiers !
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={async () => {
                        if (window.confirm("Voulez-vous vraiment quitter cette équipe ?")) {
                          await leaveTeam();
                          setShowTeamPanel(false);
                        }
                      }}
                      className="flex-1 bg-rose-50 hover:bg-rose-100 text-rose-700 py-3 rounded-2xl text-xs font-bold border border-rose-200 transition-colors"
                    >
                      Quitter l'équipe
                    </button>
                    <button
                      onClick={() => setShowTeamPanel(false)}
                      className="flex-1 bg-stone-900 hover:bg-stone-800 text-white py-3 rounded-2xl text-xs font-bold transition-colors"
                    >
                      Rester dans l'équipe
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 text-center py-2">
                  <p className="text-xs text-stone-500 leading-relaxed max-w-sm mx-auto">
                    Vous n'êtes raccordé à aucune équipe Cloud.
                  </p>
                  <button
                    onClick={() => setShowTeamPanel(false)}
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 rounded-2xl text-xs transition-colors"
                  >
                    Raccorder mon équipe maintenant
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </>
    );
  }

  // ===== MOBILE LAYOUT =====
  return (
    <MobileFrame>
      <div className="bg-white border-b border-stone-200 flex items-center justify-between z-10 select-none shadow-xs px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="bg-amber-500 text-white p-1.5 rounded-xl flex items-center justify-center shadow-xs">
            <Coffee className="w-4 h-4 fill-current" />
          </div>
          <div>
            <h1 className="font-sans font-extrabold tracking-tight text-stone-900 leading-none text-sm">
              P'tit Déj Matinal 🥐
            </h1>
            {activeTeamId && (
              <span className="font-mono font-bold uppercase tracking-wider text-emerald-700 text-[9px]">
                Sync Cloud · {teamName}
              </span>
            )}
          </div>
          <button
            onClick={() => setShowNav(v => !v)}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 active:scale-95 transition-all"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          {activeTeamId ? (
            <button
              onClick={() => setShowTeamPanel(true)}
              className="flex items-center gap-1.5 font-bold rounded-xl border bg-emerald-50 text-emerald-800 border-emerald-200 active:scale-95 transition-all text-[10px] px-3 py-1.5"
            >
              <Cloud className="w-3.5 h-3.5 text-emerald-600 animate-pulse flex-shrink-0" />
              <span className="truncate max-w-[100px]">{teamName || "Équipe"}</span>
            </button>
          ) : user ? (
            <button
              onClick={() => setShowTeamPanel(true)}
              className="flex items-center gap-1.5 font-bold rounded-xl border bg-amber-50 text-amber-800 border-amber-200 active:scale-95 transition-all text-[10px] px-3 py-1.5"
            >
              <CloudOff className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
              <span>Sans Équipe</span>
            </button>
          ) : (
            <button
              onClick={() => setShowAuthModal(true)}
              className="flex items-center gap-1.5 font-bold rounded-xl border border-stone-200 bg-white text-stone-700 hover:bg-stone-50 active:scale-95 transition-all text-[10px] px-3 py-1.5"
            >
              <Cloud className="w-3.5 h-3.5 text-stone-400 flex-shrink-0" />
              <span>S'enregistrer</span>
            </button>
          )}
        </div>
      </div>

      {!needsTeamSetup && !showAuthModal && showNav && (
        <div className="bg-white border-b border-stone-200 z-10 select-none h-12 grid grid-cols-3">
          <button
            onClick={() => setActiveTab('planning')}
            className={`flex items-center flex-col gap-0.5 transition-all font-bold ${activeTab === 'planning' ? 'text-amber-600' : 'text-stone-400'}`}
          >
            <Calendar className={`w-4 h-4 ${activeTab === 'planning' ? 'stroke-[2.5]' : 'stroke-2'}`} />
            <span className="text-[10px] font-bold">Calendrier</span>
          </button>
          <button
            onClick={() => setActiveTab('colleagues')}
            className={`flex items-center flex-col gap-0.5 transition-all font-bold ${activeTab === 'colleagues' ? 'text-amber-600' : 'text-stone-400'}`}
          >
            <Users className={`w-4 h-4 ${activeTab === 'colleagues' ? 'stroke-[2.5]' : 'stroke-2'}`} />
            <span className="text-[10px] font-bold">Équipe/Abs</span>
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center flex-col gap-0.5 transition-all font-bold ${activeTab === 'settings' ? 'text-amber-600' : 'text-stone-400'}`}
          >
            <Settings className={`w-4 h-4 ${activeTab === 'settings' ? 'stroke-[2.5]' : 'stroke-2'}`} />
            <span className="text-[10px] font-bold">Réglages</span>
          </button>
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden bg-[#FAF8F5]">
        {needsTeamSetup ? (
          <TeamMgmtView
            localColleagues={colleagues}
            localAbsences={absences}
            localSettings={settings}
            localOverrides={overrides}
          />
        ) : showAuthModal ? (
          <AuthView onClose={() => setShowAuthModal(false)} />
        ) : (
          <>
            {activeTab === 'planning' && (
              <PlanningView
                schedule={schedule}
                colleagues={colleagues}
                onSetOverride={handleSetOverride}
                onClearOverride={handleClearOverride}
                startWeekDate={settings.startWeekDate}
                numberOfWeeks={settings.numberOfWeeks}
                onCopySummary={handleCopySummary}
                coApporteurs={coApporteurs}
                setCoApporteurs={setCoApporteurs}
                autoRecalculate={autoRecalculate}
                onToggleAutoRecalculate={setAutoRecalculate}
                pendingRecalculate={pendingRecalculate}
                onForceRecalculate={handleForceRecalculate}
                currentUserRole={currentUserRole}
                userDisplayName={profile?.displayName || null}
              />
            )}
            {activeTab === 'colleagues' && (
              <ColleaguesView
                colleagues={colleagues}
                absences={absences}
                onAddColleague={handleAddColleague}
                onUpdateColleague={handleUpdateColleague}
                onDeleteColleague={handleDeleteColleague}
                onAddAbsence={handleAddAbsence}
                onDeleteAbsence={handleDeleteAbsence}
                stats={stats}
              />
            )}
            {activeTab === 'settings' && (
              <SettingsView
                settings={settings}
                onUpdateSettings={handleUpdateSettings}
                onResetDemoData={handleResetDemoData}
                onClearAll={handleClearAll}
                teamCode={activeTeamId}
                readOnly={!!activeTeamId && currentUserRole === 'viewer'}
              />
            )}
          </>
        )}
      </div>


      {showTeamPanel && (
        <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-3xs z-50 flex items-end justify-center select-none">
          <div className="w-full max-w-lg bg-white rounded-t-3xl border-t border-stone-200 p-6 space-y-6">
            <div className="flex justify-between items-center border-b border-stone-100 pb-4">
              <div className="flex items-center gap-2">
                <Cloud className="w-5 h-5 text-emerald-600 animate-pulse" />
                <h3 className="font-extrabold text-stone-900">Espace Equipe Cloud</h3>
              </div>
              <button onClick={() => setShowTeamPanel(false)} className="text-stone-400 hover:text-stone-700 font-bold font-mono text-xs">
                [ Fermer ]
              </button>
            </div>

            <div className="flex items-center gap-3 bg-stone-50 border border-stone-200 p-4 rounded-2xl">
              <img
                src={profile?.photoURL || `https://api.dicebear.com/7.x/identicon/svg?seed=${profile?.uid}`}
                alt="Avatar"
                className="w-10 h-10 rounded-full border border-stone-200"
                referrerPolicy="no-referrer"
              />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-stone-400 font-mono uppercase tracking-wider">Compte validé</p>
                <h4 className="text-sm font-extrabold text-stone-900 truncate">{profile?.displayName}</h4>
                <p className="text-[11px] text-stone-500 truncate">{user?.email}</p>
              </div>
              <button
                onClick={async () => { await signOutUser(); setShowTeamPanel(false); }}
                className="bg-stone-200 hover:bg-stone-300 text-stone-700 font-bold text-[11px] font-mono px-3 py-1.5 rounded-lg transition-all"
              >
                Déconnexion
              </button>
            </div>

            {activeTeamId ? (
              <div className="space-y-4">
                <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[10px] font-bold text-emerald-800 font-mono uppercase">Équipe Connectée</p>
                      <h4 className="font-extrabold text-stone-900 mt-0.5">{teamName}</h4>
                    </div>
                    <span className="bg-emerald-100 text-emerald-800 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border border-emerald-200 uppercase">Actif</span>
                  </div>
                  <div className="bg-white border border-emerald-100 rounded-xl p-3">
                    <p className="text-[10.5px] font-bold text-stone-500 uppercase tracking-wide mb-2">Code pour vos collègues :</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 bg-stone-50 border border-stone-200 px-3 py-2 rounded-lg text-xs font-mono font-bold select-all text-amber-700 text-center">
                        {activeTeamId}
                      </code>
                      <button
                        onClick={handleCopyCode}
                        className="bg-stone-900 hover:bg-stone-800 text-white font-bold p-2.5 rounded-lg active:scale-95 transition-all"
                      >
                        {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <p className="text-[11px] text-emerald-800 text-center italic">
                    💡 Partagez ce code avec vos co-équipiers !
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={async () => {
                      if (window.confirm("Voulez-vous vraiment quitter cette équipe ?")) {
                        await leaveTeam();
                        setShowTeamPanel(false);
                      }
                    }}
                    className="flex-1 bg-rose-50 hover:bg-rose-100 text-rose-700 py-3 rounded-2xl text-xs font-bold border border-rose-200 transition-colors"
                  >
                    Quitter l'équipe
                  </button>
                  <button
                    onClick={() => setShowTeamPanel(false)}
                    className="flex-1 bg-stone-900 hover:bg-stone-800 text-white py-3 rounded-2xl text-xs font-bold transition-colors"
                  >
                    Rester dans l'équipe
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 text-center py-2">
                <p className="text-xs text-stone-500 leading-relaxed max-w-sm mx-auto">
                  Vous n'êtes raccordé à aucune équipe Cloud.
                </p>
                <button
                  onClick={() => setShowTeamPanel(false)}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 rounded-2xl text-xs transition-colors"
                >
                  Raccorder mon équipe maintenant
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </MobileFrame>
  );
}