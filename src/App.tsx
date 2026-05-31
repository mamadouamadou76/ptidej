/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Colleague, Absence, ShiftSettings, ManualOverride, CalendarDay } from './types';
import { MobileFrame } from './components/MobileFrame';
import { PlanningView } from './components/PlanningView';
import { ColleaguesView } from './components/ColleaguesView';
import { SettingsView } from './components/SettingsView';
import { AuthView } from './components/AuthView';
import { TeamMgmtView } from './components/TeamMgmtView';
import { FirebaseProvider, useAuth } from './components/FirebaseContext';
import { generateSchedule, computeStats } from './utils/scheduler';
import { getInitialDemoData } from './utils/demoData';
import { 
  Coffee, Calendar, Users, Settings, Cloud, CloudOff, Info, 
  Sparkles, LogOut, Copy, Check, Users2, Shield, Share2
} from 'lucide-react';

export default function App() {
  const [colleagues, setColleagues] = useState<Colleague[]>([]);
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [settings, setSettings] = useState<ShiftSettings>({
    startWeekDate: '',
    workDays: [1, 2, 3, 4, 5],
    morningWeeks: [true, true, true, true, true, true],
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
  // Navigation Tabs state
  const [activeTab, setActiveTab] = useState<'planning' | 'colleagues' | 'settings'>('planning');

  // Firebase auth state and functions
  const { 
    user, 
    profile, 
    loading: authLoading, 
    activeTeamId, 
    teamName, 
    isSyncing,
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

  // Modals UI States
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showTeamPanel, setShowTeamPanel] = useState(false);
  const [copied, setCopied] = useState(false);

  // Flag to know when local state is initially loaded from storage
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount (only triggers for offline or initial sync fallback)
  useEffect(() => {
    try {
      const storedColleagues = localStorage.getItem('breakfast_colleagues');
      const storedAbsences = localStorage.getItem('breakfast_absences');
      const storedSettings = localStorage.getItem('breakfast_settings');
      const storedOverrides = localStorage.getItem('breakfast_overrides');

      if (storedColleagues && storedSettings) {
        setColleagues(JSON.parse(storedColleagues));
        setAbsences(storedAbsences ? JSON.parse(storedAbsences) : []);
        setSettings(JSON.parse(storedSettings));
        setOverrides(storedOverrides ? JSON.parse(storedOverrides) : {});
      } else {
        // Fallback to beautiful built-in French demo data so the app doesn't look empty!
        const demo = getInitialDemoData();
        setColleagues(demo.colleagues);
        setAbsences(demo.absences);
        setSettings(demo.settings);
        setOverrides({});
      }
    } catch (e) {
      console.warn("Could not load from localStorage, initializing with demo standard.", e);
      const demo = getInitialDemoData();
      setColleagues(demo.colleagues);
      setAbsences(demo.absences);
      setSettings(demo.settings);
    }
    setIsLoaded(true);
  }, [setColleagues, setAbsences, setSettings, setOverrides]);

  // Save to localStorage when state changes (only for active offline usage)
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

  // Actions routing (DB if user in team, or Local State if in isolated sandbox mode)
  const handleAddColleague = (name: string, color: string) => {
    const totalPlannedBefore = colleagues.length > 0 
      ? Math.round(colleagues.reduce((acc, c) => acc + c.initialCount, 0) / colleagues.length)
      : 0;

    const newCol: Colleague = {
      id: Date.now().toString(),
      name,
      color,
      isActive: true,
      initialCount: totalPlannedBefore,
    };

    if (activeTeamId) {
      addColleagueInDB(newCol);
    } else {
      setColleagues([...colleagues, newCol]);
    }
  };

  const handleUpdateColleague = (updatedCol: Colleague) => {
    if (activeTeamId) {
      updateColleagueInDB(updatedCol);
    } else {
      setColleagues(colleagues.map((c) => (c.id === updatedCol.id ? updatedCol : c)));
    }
  };

  const handleDeleteColleague = (id: string) => {
    const assocAbsIds = absences.filter((abs) => abs.colleagueId === id).map(abs => abs.id);
    if (activeTeamId) {
      // Clean overrides in DB first
      const newOverrides = { ...overrides };
      let overridesChanged = false;
      Object.keys(newOverrides).forEach((dateKey) => {
        if (newOverrides[dateKey] === id) {
          delete newOverrides[dateKey];
          overridesChanged = true;
        }
      });
      if (overridesChanged) {
        updateOverridesInDB(newOverrides);
      }
      deleteColleagueInDB(id, assocAbsIds);
    } else {
      setColleagues(colleagues.filter((c) => c.id !== id));
      setAbsences(absences.filter((abs) => abs.colleagueId !== id));
      const newOverrides = { ...overrides };
      Object.keys(newOverrides).forEach((dateKey) => {
        if (newOverrides[dateKey] === id) {
          delete newOverrides[dateKey];
        }
      });
      setOverrides(newOverrides);
    }
  };

  const handleAddAbsence = (colleagueId: string, startDate: string, endDate: string, reason: string) => {
    const newAbs: Absence = {
      id: Date.now().toString(),
      colleagueId,
      startDate,
      endDate,
      reason,
    };

    if (activeTeamId) {
      addAbsenceInDB(newAbs);
    } else {
      setAbsences([...absences, newAbs]);
    }
  };

  const handleDeleteAbsence = (id: string) => {
    if (activeTeamId) {
      deleteAbsenceInDB(id);
    } else {
      setAbsences(absences.filter((abs) => abs.id !== id));
    }
  };

  const handleSetOverride = (dateString: string, colleagueId: string | null) => {
    const newOverrides = {
      ...overrides,
      [dateString]: colleagueId,
    };

    if (activeTeamId) {
      updateOverridesInDB(newOverrides);
    } else {
      setOverrides(newOverrides);
    }
  };

  const handleClearOverride = (dateString: string) => {
    const newOverrides = { ...overrides };
    delete newOverrides[dateString];

    if (activeTeamId) {
      updateOverridesInDB(newOverrides);
    } else {
      setOverrides(newOverrides);
    }
  };

  const handleUpdateSettings = (newSettings: ShiftSettings) => {
    if (activeTeamId) {
      updateSettingsInDB(newSettings);
    } else {
      setSettings(newSettings);
    }
  };

  const handleResetDemoData = () => {
    if (activeTeamId) {
      if (window.confirm("Action désactivée en mode synchronisé. Souhaitez-vous d'abord quitter l'équipe pour travailler en mode démo hors-ligne ?")) {
        leaveTeam();
      }
      return;
    }
    if (window.confirm("Voulez-vous charger l'équipe et les absences de démonstration ? Cela écrasera vos modifications actuelles.")) {
      const demo = getInitialDemoData();
      setColleagues(demo.colleagues);
      setAbsences(demo.absences);
      setSettings(demo.settings);
      setOverrides({});
    }
  };

  const handleClearAll = () => {
    if (activeTeamId) {
      if (window.confirm("Action désactivée en mode synchronisé. Souhaitez-vous quitter l'équipe pour vider vos données locales ?")) {
        leaveTeam();
      }
      return;
    }
    if (window.confirm("Êtes-vous sûr de vouloir tout effacer ? Toutes les données locales seront supprimées définitivement.")) {
      setColleagues([]);
      setAbsences([]);
      setOverrides({});
      const monday = new Date();
      const day = monday.getDay();
      const diff = monday.getDate() - day + (day === 0 ? -6 : 1);
      monday.setDate(diff);
      const startMondayStr = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`;
      
      setSettings({
        startWeekDate: startMondayStr,
        workDays: [1, 2, 3, 4, 5],
        morningWeeks: [true, true, true, true, true, true],
      });
    }
  };

  const handleCopyCode = () => {
    if (!activeTeamId) return;
    navigator.clipboard.writeText(activeTeamId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Wait for settings loading block on initial startup
  if (!settings.startWeekDate && !authLoading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <div className="text-center space-y-3">
          <Coffee className="w-12 h-12 text-amber-500 animate-bounce mx-auto" />
          <p className="text-sm text-stone-600 font-medium">Chargement du planning...</p>
        </div>
      </div>
    );
  }

  // 1. Calculate dynamic schedule using priority rotative algorithm
  const schedule = generateSchedule(colleagues, absences, settings, overrides);

  // 2. Compute live statistics (scores of croissant inputs)
  const stats = computeStats(colleagues, schedule);

  // 3. User Router: If logged in but activeTeamId is unoccupied, require team workspace assignment
  const needsTeamSetup = user && !activeTeamId;

  return (
    <MobileFrame>
      {/* App Header */}
      <div className="bg-white border-b border-stone-200 px-4 py-3 flex items-center justify-between z-10 select-none shadow-xs">
        <div className="flex items-center gap-2">
          <div className="bg-amber-500 text-white p-1.5 rounded-xl flex items-center justify-center shadow-xs">
            <Coffee className="w-4 h-4 fill-current" />
          </div>
          <div>
            <h1 className="font-sans font-extrabold text-sm.5 tracking-tight text-stone-900 leading-none">
              P'tit Déj Matinal 🥐
            </h1>
            <span className="text-[9px] font-mono text-amber-700 font-bold uppercase tracking-wider">
              {activeTeamId ? `Sync Cloud - ${teamName}` : "Mode Local Autonome"}
            </span>
          </div>
        </div>

        {/* Sync / Authentication Status Indicator */}
        <div className="flex items-center gap-1.5">
          {activeTeamId ? (
            <button
              onClick={() => setShowTeamPanel(true)}
              className="flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-xl border bg-emerald-50 text-emerald-800 border-emerald-200 shadow-3xs active:scale-95 transition-all text-left max-w-[130px] truncate"
            >
              <Cloud className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
              <span className="truncate">{teamName || "Équipe"}</span>
            </button>
          ) : user ? (
            <button
              onClick={() => setShowTeamPanel(true)}
              className="flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-xl border bg-amber-50 text-amber-800 border-amber-200 shadow-3xs active:scale-95 transition-all"
            >
              <CloudOff className="w-3.5 h-3.5 text-amber-600" />
              <span>Sans Équipe</span>
            </button>
          ) : (
            <button
              onClick={() => setShowAuthModal(true)}
              className="flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-xl border border-stone-200 bg-white text-stone-700 hover:bg-stone-50 transition-all select-none active:scale-95 hover:border-amber-400"
            >
              <Cloud className="w-3.5 h-3.5 text-stone-400" />
              <span>S'enregistrer</span>
            </button>
          )}
        </div>
      </div>

      {/* Main routers */}
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
              />
            )}
          </>
        )}
      </div>

      {/* App Bottom Navigation Bar */}
      {!needsTeamSetup && !showAuthModal && (
        <div className="h-16 bg-white border-t border-stone-200 grid grid-cols-3 z-10 shadow-lg select-none">
          <button
            onClick={() => setActiveTab('planning')}
            className={`flex flex-col items-center justify-center gap-1 transition-all ${
              activeTab === 'planning' ? 'text-amber-600' : 'text-stone-400 hover:text-stone-600'
            }`}
          >
            <Calendar className={`w-5 h-5 ${activeTab === 'planning' ? 'stroke-[2.5]' : 'stroke-2'}`} />
            <span className="text-[10px] font-bold">Calendrier</span>
          </button>

          <button
            onClick={() => setActiveTab('colleagues')}
            className={`flex flex-col items-center justify-center gap-1 transition-all ${
              activeTab === 'colleagues' ? 'text-amber-600' : 'text-stone-400 hover:text-stone-600'
            }`}
          >
            <Users className={`w-5 h-5 ${activeTab === 'colleagues' ? 'stroke-[2.5]' : 'stroke-2'}`} />
            <span className="text-[10px] font-bold">Équipe/Abs</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex flex-col items-center justify-center gap-1 transition-all ${
              activeTab === 'settings' ? 'text-amber-600' : 'text-stone-400 hover:text-stone-600'
            }`}
          >
            <Settings className={`w-5 h-5 ${activeTab === 'settings' ? 'stroke-[2.5]' : 'stroke-2'}`} />
            <span className="text-[10px] font-bold">Réglages</span>
          </button>
        </div>
      )}

      {/* Slide-Up Interactive Settings panel sheet for Team/Sync info */}
      {showTeamPanel && (
        <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-3xs z-50 flex items-end justify-center select-none animate-fadeIn">
          <div className="w-full max-w-lg md:max-w-2xl bg-white rounded-t-3xl border-t border-stone-200 p-6 space-y-6 animate-slideUp">
            
            {/* Header */}
            <div className="flex justify-between items-center border-b border-stone-100 pb-4">
              <div className="flex items-center gap-2">
                <Cloud className="w-5 h-5 text-emerald-600 animate-pulse" />
                <h3 className="font-extrabold text-stone-900 text-sm.5">Espace Equipe Cloud</h3>
              </div>
              <button 
                onClick={() => setShowTeamPanel(false)}
                className="text-stone-400 hover:text-stone-700 font-bold font-mono text-xs p-1"
              >
                [ Fermer ]
              </button>
            </div>

            {/* Profile Detail */}
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
                onClick={async () => {
                  await signOutUser();
                  setShowTeamPanel(false);
                }}
                className="bg-stone-200 hover:bg-stone-300 hover:text-stone-900 text-stone-700 font-bold text-[11px] font-mono px-3 py-1.5 rounded-lg transition-all"
              >
                Déconnexion
              </button>
            </div>

            {/* Active Team Detail */}
            {activeTeamId ? (
              <div className="space-y-4">
                <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[10px] font-bold text-emerald-800 font-mono uppercase tracking-wider">Équipe Connectée</p>
                      <h4 className="text-sm.5 font-extrabold text-stone-900 mt-0.5">{teamName}</h4>
                    </div>
                    <span className="bg-emerald-100 text-emerald-800 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border border-emerald-200 uppercase">
                      Actif
                    </span>
                  </div>

                  <div className="space-y-1 bg-white border border-emerald-100 rounded-xl p-3">
                    <p className="text-[10.5px] font-bold text-stone-500 block uppercase tracking-wide">
                      Identifiant d'accès (Code pour vos collègues) :
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <code className="flex-1 bg-stone-50 border border-stone-200 px-3 py-2 rounded-lg text-xs font-mono font-bold block select-all text-amber-700 text-center tracking-wide">
                        {activeTeamId}
                      </code>
                      <button
                        onClick={handleCopyCode}
                        className="bg-stone-900 hover:bg-stone-800 text-white font-bold p-2.5 rounded-lg border border-stone-950 active:scale-95 transition-all"
                        title="Copier le code"
                      >
                        {copied ? <Check className="w-4 h-4 text-emerald-400 stroke-[3]" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <p className="text-[11px] text-emerald-800 leading-normal text-center italic">
                    💡 Partagez ce code avec vos co-équipiers ! En se connectant et en saisissant ce code, ils verront le même planning et pourront gérer les absences en binôme !
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={async () => {
                      if (window.confirm("Voulez-vous vraiment quitter cette équipe ? Vous reviendrez en mode local autonome.")) {
                        await leaveTeam();
                        setShowTeamPanel(false);
                      }
                    }}
                    className="flex-1 bg-rose-50 hover:bg-rose-100/85 text-rose-700 py-3 rounded-2xl text-xs font-bold border border-rose-200 outline-none select-none active:scale-98 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <span>Quitter l'équipe</span>
                  </button>
                  <button
                    onClick={() => setShowTeamPanel(false)}
                    className="flex-1 bg-stone-900 hover:bg-stone-800 text-white py-3 rounded-2xl text-xs font-bold outline-none select-none active:scale-98 transition-colors"
                  >
                    Rester dans l'équipe
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 text-center py-2">
                <p className="text-xs text-stone-500 leading-relaxed max-w-sm mx-auto">
                  Vous n'êtes actuellement raccordé à aucune équipe Cloud. Votre planification n'est stockée que sur votre téléphone.
                </p>
                <button
                  onClick={() => {
                    setShowTeamPanel(false);
                  }}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 rounded-2xl text-xs select-none shadow-xs transition-colors"
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
