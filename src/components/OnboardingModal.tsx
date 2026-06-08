import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from './FirebaseContext';
import { Coffee, Plus, X, ChevronRight, RefreshCw, Users, Link } from 'lucide-react';
import { Colleague, ShiftSettings } from '../types';

const COLORS = ['amber', 'emerald', 'blue', 'rose', 'violet', 'pink', 'orange', 'teal'];

const COLOR_BG: Record<string, string> = {
  amber: 'bg-amber-400',
  emerald: 'bg-emerald-400',
  blue: 'bg-blue-400',
  rose: 'bg-rose-400',
  violet: 'bg-violet-400',
  pink: 'bg-pink-400',
  orange: 'bg-orange-400',
  teal: 'bg-teal-400',
};

type Frequency = 'weekly' | 'biweekly' | 'monthly';
type View = 'choice' | 'join' | 'create';

function getStartMonday(): string {
  const d = new Date();
  const day = d.getDay();
  d.setDate(d.getDate() - day + (day === 0 ? -6 : 1));
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function buildSettings(frequency: Frequency): ShiftSettings {
  const numberOfWeeks = 6;
  let morningWeeks: boolean[];
  if (frequency === 'weekly') {
    morningWeeks = Array(numberOfWeeks).fill(true);
  } else if (frequency === 'biweekly') {
    morningWeeks = Array.from({ length: numberOfWeeks }, (_, i) => i % 2 === 0);
  } else {
    morningWeeks = Array.from({ length: numberOfWeeks }, (_, i) => i % 4 === 0);
  }
  return { startWeekDate: getStartMonday(), workDays: [1, 2, 3, 4, 5], morningWeeks, numberOfWeeks };
}

const variants = {
  enter: (dir: number) => ({ x: dir > 0 ? 50 : -50, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -50 : 50, opacity: 0 }),
};

const STEPS = 4;

export function OnboardingModal() {
  const { createTeam, joinTeam } = useAuth();

  const [view, setView] = useState<View>('choice');
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);

  // Create team state
  const [teamName, setTeamName] = useState('');
  const [colleagueName, setColleagueName] = useState('');
  const [colleagues, setColleagues] = useState<Colleague[]>([]);
  const [frequency, setFrequency] = useState<Frequency>('weekly');

  // Join team state
  const [teamCode, setTeamCode] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const goTo = (next: number) => {
    setDirection(next > step ? 1 : -1);
    setStep(next);
  };

  const startCreate = () => {
    setError(null);
    setDirection(1);
    setStep(1);
    setView('create');
  };

  const startJoin = () => {
    setError(null);
    setTeamCode('');
    setDirection(1);
    setView('join');
  };

  const backToChoice = () => {
    setError(null);
    setDirection(-1);
    setView('choice');
  };

  const addColleague = () => {
    const trimmed = colleagueName.trim();
    if (!trimmed) return;
    setColleagues(prev => [...prev, {
      id: Date.now().toString(),
      name: trimmed,
      color: COLORS[prev.length % COLORS.length],
      isActive: true,
      initialCount: 0,
    }]);
    setColleagueName('');
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      await createTeam(teamName, {
        colleagues,
        absences: [],
        settings: buildSettings(frequency),
        overrides: {},
      });
    } catch (err: any) {
      setError(err.message || "Une erreur s'est produite.");
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!teamCode.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await joinTeam(teamCode.trim());
      // FirebaseContext updates activeTeamId → App.tsx closes modal automatically
    } catch (err: any) {
      setError(err.message || "Code d'équipe invalide.");
      setLoading(false);
    }
  };

  const showBack =
    !loading && (
      view === 'join' ||
      (view === 'create' && step >= 1)
    );

  return (
    <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden">

        {/* Progress bar — only visible during create flow */}
        <div className="h-1.5 bg-stone-100">
          <div
            className="h-full bg-amber-500 transition-all duration-500 ease-out"
            style={{ width: view === 'create' ? `${(step / STEPS) * 100}%` : '0%' }}
          />
        </div>

        {/* Step dots — only visible during create flow */}
        {view === 'create' && (
          <div className="flex items-center justify-center gap-2 pt-4 select-none">
            {Array.from({ length: STEPS }, (_, i) => i + 1).map(n => (
              <div
                key={n}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  n < step ? 'bg-amber-500' :
                  n === step ? 'bg-amber-500 scale-125' :
                  'bg-stone-200'
                }`}
              />
            ))}
          </div>
        )}

        {/* Step content */}
        <div className="px-6 py-5 min-h-[300px] overflow-hidden relative">
          <AnimatePresence mode="wait" custom={direction}>

            {/* ── CHOICE screen ── */}
            {view === 'choice' && (
              <motion.div
                key="choice"
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.22, ease: 'easeInOut' }}
                className="space-y-6 text-center"
              >
                <div className="pt-3 space-y-2">
                  <div className="inline-flex bg-amber-500 text-white p-4 rounded-2xl shadow-md">
                    <Coffee className="w-8 h-8 fill-white" />
                  </div>
                  <h2 className="text-xl font-extrabold text-stone-900">Bienvenue sur P'tit Déj ! 🥐</h2>
                  <p className="text-sm text-stone-500">Comment souhaitez-vous commencer ?</p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-left">
                  <button
                    onClick={startCreate}
                    className="flex flex-col items-center gap-3 p-4 rounded-2xl border-2 border-stone-200 hover:border-amber-400 hover:bg-amber-50 transition-all group"
                  >
                    <div className="p-3 bg-amber-100 rounded-xl group-hover:bg-amber-200 transition-colors">
                      <Users className="w-6 h-6 text-amber-600" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold text-stone-900">Créer mon équipe</p>
                      <p className="text-xs text-stone-500 mt-0.5 leading-relaxed">Configurez votre équipe et invitez vos collègues</p>
                    </div>
                  </button>

                  <button
                    onClick={startJoin}
                    className="flex flex-col items-center gap-3 p-4 rounded-2xl border-2 border-stone-200 hover:border-blue-400 hover:bg-blue-50 transition-all group"
                  >
                    <div className="p-3 bg-blue-100 rounded-xl group-hover:bg-blue-200 transition-colors">
                      <Link className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold text-stone-900">Rejoindre une équipe</p>
                      <p className="text-xs text-stone-500 mt-0.5 leading-relaxed">Entrez le code partagé par votre responsable</p>
                    </div>
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── JOIN screen ── */}
            {view === 'join' && (
              <motion.div
                key="join"
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.22, ease: 'easeInOut' }}
                className="space-y-5 pt-3"
              >
                <div className="space-y-1">
                  <h2 className="text-lg font-extrabold text-stone-900">Rejoindre une équipe</h2>
                  <p className="text-xs text-stone-500">Entrez le code partagé par votre responsable.</p>
                </div>

                <input
                  type="text"
                  autoFocus
                  placeholder="Code équipe (ex : team-XXXXXX)"
                  value={teamCode}
                  onChange={e => setTeamCode(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && teamCode.trim() && handleJoin()}
                  className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-mono tracking-wide"
                />

                {error && (
                  <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2 font-medium">{error}</p>
                )}

                <button
                  onClick={handleJoin}
                  disabled={!teamCode.trim() || loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl text-sm transition-all active:scale-98 flex items-center justify-center gap-2 shadow-sm disabled:opacity-40"
                >
                  {loading ? (
                    <><RefreshCw className="w-4 h-4 animate-spin" /> Vérification…</>
                  ) : (
                    <>Rejoindre <Link className="w-4 h-4" /></>
                  )}
                </button>
              </motion.div>
            )}

            {/* ── CREATE step 1 — Welcome ── */}
            {view === 'create' && step === 1 && (
              <motion.div
                key="step1"
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.22, ease: 'easeInOut' }}
                className="space-y-6 text-center"
              >
                <div className="pt-3 space-y-3">
                  <div className="inline-flex bg-amber-500 text-white p-4 rounded-2xl shadow-md">
                    <Coffee className="w-8 h-8 fill-white" />
                  </div>
                  <h2 className="text-xl font-extrabold text-stone-900">Créer mon équipe</h2>
                  <p className="text-sm text-stone-500 leading-relaxed max-w-xs mx-auto">
                    Organisez les petits-déjeuners de votre équipe en 2 minutes.
                  </p>
                </div>
                <button
                  onClick={() => goTo(2)}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 rounded-xl text-sm transition-all active:scale-98 flex items-center justify-center gap-2 shadow-sm"
                >
                  Commencer <ChevronRight className="w-4 h-4" />
                </button>
              </motion.div>
            )}

            {/* ── CREATE step 2 — Team name ── */}
            {view === 'create' && step === 2 && (
              <motion.div
                key="step2"
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.22, ease: 'easeInOut' }}
                className="space-y-5"
              >
                <div className="space-y-1">
                  <h2 className="text-lg font-extrabold text-stone-900">Comment s'appelle votre équipe ?</h2>
                  <p className="text-xs text-stone-500">Ce nom sera visible par tous vos coéquipiers.</p>
                </div>
                <input
                  type="text"
                  autoFocus
                  placeholder="Ex : Équipe Marketing"
                  value={teamName}
                  onChange={e => setTeamName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && teamName.trim() && goTo(3)}
                  className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all font-medium"
                />
                <button
                  onClick={() => goTo(3)}
                  disabled={!teamName.trim()}
                  className="w-full bg-stone-900 hover:bg-stone-800 text-white font-bold py-3 rounded-xl text-sm transition-all active:scale-98 flex items-center justify-center gap-2 disabled:opacity-40"
                >
                  Suivant <ChevronRight className="w-4 h-4" />
                </button>
              </motion.div>
            )}

            {/* ── CREATE step 3 — Colleagues ── */}
            {view === 'create' && step === 3 && (
              <motion.div
                key="step3"
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.22, ease: 'easeInOut' }}
                className="space-y-3"
              >
                <div className="space-y-1">
                  <h2 className="text-lg font-extrabold text-stone-900">Ajoutez vos collègues</h2>
                  <p className="text-xs text-stone-500">Minimum 2 personnes pour démarrer la rotation.</p>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    autoFocus
                    placeholder="Nom du collègue"
                    value={colleagueName}
                    onChange={e => setColleagueName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addColleague()}
                    className="flex-1 px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all font-medium"
                  />
                  <button
                    onClick={addColleague}
                    disabled={!colleagueName.trim()}
                    className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-3 py-2.5 rounded-xl transition-all active:scale-95 disabled:opacity-40"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {colleagues.length > 0 && (
                  <div className="space-y-1.5 max-h-[120px] overflow-y-auto pr-0.5">
                    {colleagues.map(c => (
                      <div key={c.id} className="flex items-center gap-2 bg-stone-50 border border-stone-100 rounded-xl px-3 py-2">
                        <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${COLOR_BG[c.color] ?? 'bg-stone-300'}`} />
                        <span className="text-sm font-medium text-stone-800 flex-1 truncate">{c.name}</span>
                        <button
                          onClick={() => setColleagues(prev => prev.filter(x => x.id !== c.id))}
                          className="text-stone-300 hover:text-rose-500 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {colleagues.length < 2 && (
                  <p className="text-xs text-amber-700 font-medium bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    {colleagues.length === 0
                      ? '👋 Ajoutez au moins 2 collègues pour continuer.'
                      : '➕ Encore 1 collègue pour continuer.'}
                  </p>
                )}

                <button
                  onClick={() => goTo(4)}
                  disabled={colleagues.length < 2}
                  className="w-full bg-stone-900 hover:bg-stone-800 text-white font-bold py-3 rounded-xl text-sm transition-all active:scale-98 flex items-center justify-center gap-2 disabled:opacity-40"
                >
                  Suivant <ChevronRight className="w-4 h-4" />
                </button>
              </motion.div>
            )}

            {/* ── CREATE step 4 — Frequency ── */}
            {view === 'create' && step === 4 && (
              <motion.div
                key="step4"
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.22, ease: 'easeInOut' }}
                className="space-y-4"
              >
                <div className="space-y-1">
                  <h2 className="text-lg font-extrabold text-stone-900">À quelle fréquence organisez-vous le p'tit déj ?</h2>
                </div>

                <div className="space-y-2">
                  {([
                    { value: 'weekly' as const, label: 'Chaque semaine', desc: 'Rotation hebdomadaire' },
                    { value: 'biweekly' as const, label: 'Toutes les 2 semaines', desc: 'Une semaine sur deux' },
                    { value: 'monthly' as const, label: 'Chaque mois', desc: 'Environ une fois par mois' },
                  ]).map(({ value, label, desc }) => (
                    <button
                      key={value}
                      onClick={() => setFrequency(value)}
                      className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all ${
                        frequency === value
                          ? 'border-amber-500 bg-amber-50'
                          : 'border-stone-200 bg-stone-50 hover:border-stone-300'
                      }`}
                    >
                      <p className={`text-sm font-bold ${frequency === value ? 'text-amber-800' : 'text-stone-800'}`}>{label}</p>
                      <p className="text-xs text-stone-500 mt-0.5">{desc}</p>
                    </button>
                  ))}
                </div>

                {error && (
                  <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2 font-medium">{error}</p>
                )}

                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 rounded-xl text-sm transition-all active:scale-98 flex items-center justify-center gap-2 shadow-sm disabled:opacity-70"
                >
                  {loading ? (
                    <><RefreshCw className="w-4 h-4 animate-spin" /> Création en cours…</>
                  ) : (
                    <>Créer mon équipe <Coffee className="w-4 h-4" /></>
                  )}
                </button>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Back navigation */}
        {showBack && (
          <div className="px-6 pb-5 -mt-1">
            <button
              onClick={() => {
                if (view === 'join') { backToChoice(); return; }
                if (view === 'create' && step === 1) { backToChoice(); return; }
                goTo(step - 1);
              }}
              className="text-xs text-stone-400 hover:text-stone-700 font-mono font-bold transition-colors"
            >
              ← Retour
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
