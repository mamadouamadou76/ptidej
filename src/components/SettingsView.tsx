import React, { useState } from 'react';
import emailjs from '@emailjs/browser';
import { ShiftSettings } from '../types';
import {
  Calendar, RotateCcw, Check, RefreshCw, AlertTriangle,
  HelpCircle, Sparkles, Clock, Hammer, Clipboard, Mail, Bug, Send
} from 'lucide-react';
import { getMonday, formatLocalDate, getISOWeekNumber } from '../utils/scheduler';

interface SettingsViewProps {
  settings: ShiftSettings;
  onUpdateSettings: (settings: ShiftSettings) => void;
  onResetDemoData: () => void;
  onClearAll: () => void;
  teamCode?: string | null;
  readOnly?: boolean;
}

function ContactForm() {
  const [type, setType] = useState<'bug' | 'message'>('bug');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setSending(true);
    setError(null);
    try {
      await emailjs.send(
        import.meta.env.VITE_EMAILJS_SERVICE_ID,
        import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
        {
          type: type === 'bug' ? 'Signalement de bug' : 'Message',
          message: message.trim(),
          app: "P'tit Déj",
        },
        { publicKey: import.meta.env.VITE_EMAILJS_PUBLIC_KEY }
      );
      setSent(true);
      setMessage('');
      setTimeout(() => setSent(false), 4000);
    } catch (err) {
      console.error('EmailJS error:', err);
      setError("Envoi échoué. Réessayez plus tard.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-white border border-stone-200/80 p-4 rounded-2xl shadow-xs space-y-3">
      <h3 className="font-bold text-stone-900 text-sm flex items-center gap-2">
        <Mail className="w-4 h-4 text-amber-600" />
        <span>Nous contacter</span>
      </h3>

      {/* Type toggle */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setType('bug')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border text-xs font-bold transition-all ${
            type === 'bug'
              ? 'border-rose-400 bg-rose-50 text-rose-700'
              : 'border-stone-200 bg-stone-50 text-stone-400 hover:text-stone-600'
          }`}
        >
          <Bug className="w-3.5 h-3.5" />
          Signaler un bug
        </button>
        <button
          type="button"
          onClick={() => setType('message')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border text-xs font-bold transition-all ${
            type === 'message'
              ? 'border-amber-400 bg-amber-50 text-amber-700'
              : 'border-stone-200 bg-stone-50 text-stone-400 hover:text-stone-600'
          }`}
        >
          <Mail className="w-3.5 h-3.5" />
          Message
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-2">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={type === 'bug'
            ? 'Décrivez le problème rencontré, les étapes pour le reproduire…'
            : 'Votre suggestion, question ou retour…'}
          rows={4}
          disabled={sending || sent}
          className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:bg-white resize-none transition-all disabled:opacity-50"
        />
        {error && (
          <p className="text-xs text-rose-600 font-medium px-1">{error}</p>
        )}
        <button
          type="submit"
          disabled={!message.trim() || sending || sent}
          className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all disabled:opacity-40 ${
            sent
              ? 'border border-emerald-300 bg-emerald-50 text-emerald-700'
              : type === 'bug'
              ? 'border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-700'
              : 'border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-700'
          }`}
        >
          {sent ? (
            <><Check className="w-4 h-4" /> Message envoyé, merci !</>
          ) : sending ? (
            <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Envoi en cours…</>
          ) : (
            <><Send className="w-3.5 h-3.5" /> Envoyer</>
          )}
        </button>
      </form>
    </div>
  );
}

export function SettingsView({
  settings,
  onUpdateSettings,
  onResetDemoData,
  onClearAll,
  teamCode,
  readOnly = false,
}: SettingsViewProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    if (!teamCode) return;
    navigator.clipboard.writeText(teamCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  // Compute the Monday date and ISO week number for each week in the cycle
  const weekMetas = Array.from({ length: settings.numberOfWeeks }, (_, i) => {
    const monday = new Date(settings.startWeekDate);
    monday.setDate(monday.getDate() + i * 7);
    return { monday, isoWeek: getISOWeekNumber(monday) };
  });

  // Handle number of weeks modification
  const handleNumberOfWeeksChange = (num: number) => {
    if (num < 1 || num > 52) return;
    onUpdateSettings({
      ...settings,
      numberOfWeeks: num,
      // Adjust morningWeeks array size if needed
      morningWeeks: settings.morningWeeks.slice(0, num).concat(Array(Math.max(0, num - settings.morningWeeks.length)).fill(true))
    });
  };

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

  // Quick presets for morning weeks
  type WeekPreset = 'all' | 'odd' | 'even';

  const getActivePreset = (): WeekPreset | null => {
    const { morningWeeks, numberOfWeeks } = settings;
    const allTrue = morningWeeks.slice(0, numberOfWeeks).every((v) => v);
    const oddOnly = morningWeeks.slice(0, numberOfWeeks).every((v, i) => v === (i % 2 === 0));
    const evenOnly = morningWeeks.slice(0, numberOfWeeks).every((v, i) => v === (i % 2 === 1));
    if (allTrue) return 'all';
    if (oddOnly) return 'odd';
    if (evenOnly) return 'even';
    return null;
  };

  const handleApplyPreset = (preset: WeekPreset) => {
    const updatedMorningWeeks = Array.from({ length: settings.numberOfWeeks }, (_, i) => {
      if (preset === 'all') return true;
      if (preset === 'odd') return i % 2 === 0; // Semaine 1, 3, 5... (index 0, 2, 4...)
      if (preset === 'even') return i % 2 === 1; // Semaine 2, 4, 6... (index 1, 3, 5...)
      return true;
    });
    onUpdateSettings({ ...settings, morningWeeks: updatedMorningWeeks });
  };

  const activePreset = getActivePreset();

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-5">

      {/* Code équipe — partage avec les collègues */}
      {teamCode && (
        <div className="bg-emerald-500/5 border border-emerald-500/20 p-4 rounded-2xl space-y-2">
          <p className="text-xs font-bold text-emerald-800 uppercase tracking-wide">Code de votre équipe</p>
          <p className="text-[11px] text-stone-500">Partagez ce code avec vos collègues pour qu'ils rejoignent votre équipe.</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-white border border-emerald-200 px-3 py-2 rounded-xl text-sm font-mono font-bold text-emerald-700 text-center tracking-wide select-all">
              {teamCode}
            </code>
            <button
              onClick={handleCopyCode}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold transition-all flex-shrink-0"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Clipboard className="w-3.5 h-3.5" />}
              {copied ? 'Copié !' : 'Copier'}
            </button>
          </div>
        </div>
      )}

      {/* Read-only notice for viewers */}
      {readOnly && (
        <div className="bg-amber-50 border border-amber-200 px-4 py-3 rounded-2xl text-xs text-amber-800 flex items-center gap-2">
          <span className="text-base">🔒</span>
          <span>En tant que membre, vous pouvez consulter les paramètres mais seul l'administrateur peut les modifier.</span>
        </div>
      )}

      {/* Nombre de semaines à programmer */}
      <div className="bg-white border border-stone-200/80 p-4 rounded-2xl shadow-xs space-y-3">
        <h3 className="font-bold text-stone-900 text-sm flex items-center gap-2">
          <Calendar className="w-4 h-4 text-amber-600" />
          <span>Nombre de semaines à programmer</span>
        </h3>
        <p className="text-xs text-stone-500">
          Définissez le nombre de semaines pour lesquelles le planning doit être généré (entre 1 et 52).
        </p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => handleNumberOfWeeksChange(settings.numberOfWeeks - 1)}
            disabled={readOnly || settings.numberOfWeeks <= 1}
            className="w-10 h-10 flex items-center justify-center rounded-xl border border-stone-200 bg-stone-50 text-stone-700 text-lg font-bold hover:bg-stone-100 active:bg-stone-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors select-none"
            aria-label="Diminuer le nombre de semaines"
          >
            −
          </button>
          <span className="flex-1 text-center text-2xl font-bold font-mono text-stone-800 tabular-nums">
            {settings.numberOfWeeks}
          </span>
          <button
            type="button"
            onClick={() => handleNumberOfWeeksChange(settings.numberOfWeeks + 1)}
            disabled={readOnly || settings.numberOfWeeks >= 52}
            className="w-10 h-10 flex items-center justify-center rounded-xl border border-stone-200 bg-stone-50 text-stone-700 text-lg font-bold hover:bg-stone-100 active:bg-stone-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors select-none"
            aria-label="Augmenter le nombre de semaines"
          >
            +
          </button>
        </div>
      </div>

      {/* Date de départ */}
      <div className="bg-white border border-stone-200/80 p-4 rounded-2xl shadow-xs space-y-3">
        <h3 className="font-bold text-stone-900 text-sm flex items-center gap-2">
          <Calendar className="w-4 h-4 text-amber-600" />
          <span>Date de début du cycle</span>
        </h3>
        <p className="text-xs text-stone-500">
          Choisissez la date de démarrage de vos prévisions sur {settings.numberOfWeeks} semaines. La date sera automatiquement calée sur le Lundi de la semaine sélectionnée.
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
        <div className="grid grid-cols-3 gap-1.5 pt-1">
          {([
            { preset: 'odd' as const, label: 'Sem. impaires', sub: '1, 3, 5…' },
            { preset: 'even' as const, label: 'Sem. paires', sub: '2, 4, 6…' },
            { preset: 'all' as const, label: 'Toutes', sub: '1, 2, 3…' },
          ]).map(({ preset, label, sub }) => (
            <button
              key={preset}
              onClick={() => handleApplyPreset(preset)}
              className={`flex flex-col items-center justify-center gap-0.5 p-2 rounded-xl border text-[11px] font-semibold transition-all ${
                activePreset === preset
                  ? 'border-amber-500 bg-amber-50 text-amber-900'
                  : 'border-stone-200 bg-stone-50 text-stone-500 hover:border-amber-300 hover:bg-amber-50/30 hover:text-stone-700'
              }`}
            >
              <span>{label}</span>
              <span className={`text-[10px] font-mono font-normal ${activePreset === preset ? 'text-amber-600' : 'text-stone-400'}`}>{sub}</span>
            </button>
          ))}
        </div>
        <div className="space-y-2 pt-1">
          {weekMetas.map(({ monday, isoWeek }, index) => {
            const isMorning = settings.morningWeeks[index];
            const dateStr = monday.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });

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
                  <span>Semaine {isoWeek}</span>
                  <span className={`text-[10px] font-mono ${isMorning ? 'text-amber-700/80' : 'text-stone-400'}`}>
                    Du {dateStr}
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

      {/* Contact & Bug Report */}
      <ContactForm />

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
