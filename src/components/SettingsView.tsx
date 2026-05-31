import React from 'react';
import { ShiftSettings } from '../types';
import { 
  Calendar, RotateCcw, Check, RefreshCw, AlertTriangle, 
  HelpCircle, Sparkles, Clock, Hammer
} from 'lucide-react';
import { getMonday, formatLocalDate } from '../utils/scheduler';

interface SettingsViewProps {
  settings: ShiftSettings;
  onUpdateSettings: (settings: ShiftSettings) => void;
  onResetDemoData: () => void;
  onClearAll: () => void;
}

export function SettingsView({
  settings,
  onUpdateSettings,
  onResetDemoData,
  onClearAll,
}: SettingsViewProps) {
  
  // List of weeks helper
  const weekLabels = [
    'Semaine 1 (Début)',
    'Semaine 2',
    'Semaine 3',
    'Semaine 4',
    'Semaine 5',
    'Semaine 6',
  ];

  // Workdays helper
  const DAYS_LIST = [
    { value: 1, label: 'Lundi' },
    { value: 2, label: 'Mardi' },
    { value: 3, label: 'Mercredi' },
    { value: 4, label: 'Jeudi' },
    { value: 5, label: 'Vendredi' },
    { value: 6, label: 'Samedi' },
    { value: 7, label: 'Dimanche' },
  ];

  // Handle start date modification
  const handleStartDateChange = (dateString: string) => {
    if (!dateString) return;
    const selectedDate = new Date(dateString);
    // Align to the Monday of that week
    const alignedMonday = getMonday(selectedDate);
    const alignedMondayStr = formatLocalDate(alignedMonday);
    
    onUpdateSettings({
      ...settings,
      startWeekDate: alignedMondayStr,
    });
  };

  // Toggle standard work days
  const handleToggleDay = (dayValue: number) => {
    let updatedWorkDays = [...settings.workDays];
    if (updatedWorkDays.includes(dayValue)) {
      // Remove unless it is the last one
      if (updatedWorkDays.length > 1) {
        updatedWorkDays = updatedWorkDays.filter((d) => d !== dayValue);
      }
    } else {
      updatedWorkDays.push(dayValue);
      updatedWorkDays.sort((a, b) => a - b);
    }
    onUpdateSettings({
      ...settings,
      workDays: updatedWorkDays,
    });
  };

  // Toggle morning shift weeks
  const handleToggleMorningWeek = (index: number) => {
    const updatedMorningWeeks = [...settings.morningWeeks];
    updatedMorningWeeks[index] = !updatedMorningWeeks[index];
    onUpdateSettings({
      ...settings,
      morningWeeks: updatedMorningWeeks,
    });
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-5">
      {/* Date de départ */}
      <div className="bg-white border border-stone-200/80 p-4 rounded-2xl shadow-xs space-y-3">
        <h3 className="font-bold text-stone-900 text-sm flex items-center gap-2">
          <Calendar className="w-4 h-4 text-amber-600" />
          <span>Date de début du cycle</span>
        </h3>
        <p className="text-xs text-stone-500">
          Choisissez la date de démarrage de vos prévisions sur 6 semaines. La date sera automatiquement calée sur le Lundi de la semaine sélectionnée.
        </p>
        <div className="relative">
          <input
            type="date"
            id="start-date-input"
            value={settings.startWeekDate}
            onChange={(e) => handleStartDateChange(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl text-sm border border-stone-200 outline-none focus:border-amber-500 bg-stone-50/50 font-mono"
          />
        </div>
        <div className="bg-amber-50 text-[11px] text-amber-800 p-2.5 rounded-xl border border-amber-100 flex gap-2">
          <HelpCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600" />
          <span>
            Le cycle de 6 semaines débutera le <strong>Lundi {new Date(settings.startWeekDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>.
          </span>
        </div>
      </div>

      {/* Jours du matin travaillés */}
      <div className="bg-white border border-stone-200/80 p-4 rounded-2xl shadow-xs space-y-3">
        <h3 className="font-bold text-stone-900 text-sm flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-600" />
          <span>Jours d'équipe travaillés</span>
        </h3>
        <p className="text-xs text-stone-500">
          Sélectionnez les jours de la semaine pour lesquels un petit-déjeuner doit être planifié (par défaut du Lundi au Vendredi).
        </p>
        <div className="grid grid-cols-2 gap-2 pt-1">
          {DAYS_LIST.map((day) => {
            const isSelected = settings.workDays.includes(day.value);
            return (
              <button
                key={day.value}
                id={`toggle-day-${day.value}`}
                onClick={() => handleToggleDay(day.value)}
                className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                  isSelected
                    ? 'border-amber-500/80 bg-amber-50/40 text-amber-900'
                    : 'border-stone-150 bg-white text-stone-500 hover:bg-stone-50'
                }`}
              >
                <span>{day.label}</span>
                {isSelected ? (
                  <Check className="w-3.5 h-3.5 text-amber-600" />
                ) : (
                  <span className="w-3.5 h-3.5" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Choix des semaines d'alerte matin du quart */}
      <div className="bg-white border border-stone-200/80 p-4 rounded-2xl shadow-xs space-y-3">
        <h3 className="font-bold text-stone-900 text-sm flex items-center gap-2">
          <Hammer className="w-4 h-4 text-amber-600" />
          <span>Semaines de Matin (Quart)</span>
        </h3>
        <p className="text-xs text-stone-500">
          Cochez les semaines où votre sous-équipe est d'équipe "Matin". Les semaines décochées n'auront aucune planification (Repos ou autre poste).
        </p>
        <div className="space-y-2 pt-1">
          {weekLabels.map((label, index) => {
            const isMorning = settings.morningWeeks[index];
            const weekMonday = new Date(settings.startWeekDate);
            weekMonday.setDate(weekMonday.getDate() + index * 7);
            const dateStr = weekMonday.toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'short',
            });

            return (
              <button
                key={index}
                id={`toggle-week-${index}`}
                onClick={() => handleToggleMorningWeek(index)}
                className={`w-full flex items-center justify-between p-3 rounded-xl border text-xs font-semibold transition-all ${
                  isMorning
                    ? 'border-amber-500 bg-amber-50/20 text-stone-900'
                    : 'border-stone-150 bg-stone-50/30 text-stone-400 line-through'
                }`}
              >
                <div className="flex flex-col items-start gap-0.5">
                  <span>{label}</span>
                  <span className={`text-[10px] font-mono ${isMorning ? 'text-amber-700/80' : 'text-stone-400'}`}>
                    Semaine du {dateStr}
                  </span>
                </div>
                <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                  isMorning ? 'bg-amber-500 text-white border-amber-600' : 'bg-white border-stone-300'
                }`}>
                  {isMorning && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* PWA Information & Tips */}
      <div className="bg-gradient-to-br from-amber-500/10 via-amber-600/5 to-transparent border border-amber-500/20 p-4 rounded-2xl shadow-xs space-y-3">
        <h3 className="font-bold text-amber-950 text-sm flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-600" />
          <span>Informations PWA (Mode App Hors-Ligne)</span>
        </h3>
        <p className="text-xs text-stone-600 leading-relaxed">
          Cette application de planification fonctionne de manière 100% autonome et sécurisée. Elle a été construite comme <strong>Progressive Web App (PWA)</strong>, ce qui vous permet de :
        </p>
        <ul className="text-xs text-stone-600 list-disc list-inside space-y-1.5 pl-1.5">
          <li><strong>Consulter hors-ligne</strong> pendant vos quarts de travail sans réseau.</li>
          <li><strong>L'enregistrer directement</strong> sur l'écran d'accueil de votre smartphone.</li>
          <li>Avoir un raccourci fluide dans vos applications sans passer par l'App Store.</li>
        </ul>
        <div className="bg-white/80 border border-amber-100 p-3 rounded-xl text-xs space-y-1 text-stone-700">
          <p className="font-bold text-stone-900">💡 Installation Smartphone :</p>
          <p className="text-[11px]">
            Sur <strong>iPhone</strong> (Safari) : Bouton <strong>Partager</strong> en bas, puis tapotez <strong>"Sur l'écran d'accueil"</strong>.<br/>
            Sur <strong>Android</strong> : Menu Chromes (les 3 points), puis <strong>"Ajouter à l'écran d'accueil"</strong>.
          </p>
        </div>
      </div>

      {/* Outils & Reset */}
      <div className="bg-white border border-stone-200/80 p-4 rounded-2xl shadow-xs space-y-3">
        <h3 className="font-bold text-stone-900 text-sm flex items-center gap-2 text-rose-800">
          <AlertTriangle className="w-4 h-4 text-rose-500" />
          <span>Zone de danger & Outils</span>
        </h3>
        <p className="text-xs text-stone-500">
          Utilisez ces fonctions pour rétablir une configuration initiale ou réinitialiser complètement l'application.
        </p>
        <div className="space-y-2 pt-2">
          <button
            type="button"
            id="btn-import-demo-data"
            onClick={onResetDemoData}
            className="w-full flex items-center justify-center gap-2 py-2.5 border border-amber-200 hover:border-amber-400 text-amber-800 hover:text-amber-900 bg-amber-50/30 hover:bg-amber-50/60 rounded-xl text-xs font-bold transition-all"
          >
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span>Charger des données démo réalistes</span>
          </button>
          
          <button
            type="button"
            id="btn-clear-all"
            onClick={onClearAll}
            className="w-full flex items-center justify-center gap-2 py-2.5 border border-rose-200 hover:border-rose-400 text-rose-700 hover:text-rose-900 bg-rose-50/30 hover:bg-rose-50/60 rounded-xl text-xs font-bold transition-all"
          >
            <RotateCcw className="w-4 h-4 text-rose-500" />
            <span>Effacer tout et repartir à zéro</span>
          </button>
        </div>
      </div>
    </div>
  );
}
