import React, { useState } from 'react';
import { CalendarDay, Colleague } from '../types';
import { getColors } from '../utils/colorMapper';
import { getISOWeekNumber } from '../utils/scheduler';
import {
  Coffee, Share2, Check, AlertTriangle, ChevronDown, RefreshCw,
  CalendarOff, Pencil, HelpCircle
} from 'lucide-react';

interface PlanningViewProps {
  schedule: CalendarDay[];
  colleagues: Colleague[];
  onSetOverride: (dateString: string, colleagueId: string | null) => void;
  onClearOverride: (dateString: string) => void;
  startWeekDate: string;
  numberOfWeeks: number;
  onCopySummary: () => void;
  coApporteurs: Record<string, string>;
  setCoApporteurs: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  autoRecalculate: boolean;
  onToggleAutoRecalculate: (value: boolean) => void;
  pendingRecalculate: boolean;
  onForceRecalculate: () => void;
  currentUserRole: 'admin' | 'member' | 'viewer' | null;
  userDisplayName: string | null;
}

export function PlanningView({
  schedule,
  colleagues,
  onSetOverride,
  onClearOverride,
  startWeekDate,
  numberOfWeeks,
  onCopySummary,
  coApporteurs,
  setCoApporteurs,
  autoRecalculate,
  onToggleAutoRecalculate,
  pendingRecalculate,
  onForceRecalculate,
  currentUserRole,
  userDisplayName,
}: PlanningViewProps) {
  const [editingDate, setEditingDate] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState(false);
  const [collapsedWeeks, setCollapsedWeeks] = useState<Set<number>>(new Set());
  const [correctionMode, setCorrectionMode] = useState(false);
  const [showCorrectionInfo, setShowCorrectionInfo] = useState(false);

  const toggleWeek = (wIdx: number) => {
    setCollapsedWeeks(prev => {
      const next = new Set(prev);
      if (next.has(wIdx)) next.delete(wIdx);
      else next.add(wIdx);
      return next;
    });
  };

  const canEditDay = (day: { colleagueName?: string | null }): boolean => {
    if (!currentUserRole || currentUserRole === 'admin') return true;
    if (currentUserRole === 'viewer') return false;
    return day.colleagueName === userDisplayName;
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  const canEditDayNow = (day: { dateString: string; colleagueName?: string | null }): boolean => {
    const isDayPast = day.dateString < todayStr;
    if (isDayPast && !correctionMode) return false;
    return canEditDay(day);
  };

  // Group schedule by weekIndex, keep only morning-shift weeks
  const maxWeekIndex = Math.max(...schedule.map(d => d.weekIndex), 0);
  const allWeeks: CalendarDay[][] = [];
  for (let i = 0; i <= maxWeekIndex; i++) {
    allWeeks.push(schedule.filter((day) => day.weekIndex === i));
  }
  const weeks = allWeeks.filter(w => w[0]?.isMorningShift);

  // Quick formatter to display day names in French
  const getDayLabelFr = (dayOfWeek: number) => {
    const labels = ['', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
    return labels[dayOfWeek] || '';
  };

  const formatDateLabelFr = (date: Date) => {
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
    });
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Top Banner Toolbar */}
      <div className="px-4 py-3 bg-white border-b border-stone-200/80 flex justify-between items-center z-10 shadow-3xs">
        <div>
          <h2 className="font-bold text-stone-900 text-sm">Prévisions {weeks.length} semaines</h2>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className="text-[10px] text-stone-500 font-medium">Recalcul auto</span>
            <button
              onClick={() => onToggleAutoRecalculate(!autoRecalculate)}
              className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors flex-shrink-0 ${
                autoRecalculate ? 'bg-amber-500' : 'bg-stone-300'
              }`}
            >
              <span
                className={`inline-block h-3 w-3 transform rounded-full bg-white shadow-sm transition-transform ${
                  autoRecalculate ? 'translate-x-4' : 'translate-x-0.5'
                }`}
              />
            </button>
            {!autoRecalculate && pendingRecalculate && (
              <button
                onClick={onForceRecalculate}
                className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold rounded-lg bg-orange-500 text-white hover:bg-orange-600 active:scale-95 transition-all"
              >
                <RefreshCw className="w-3 h-3" />
                Recalculer maintenant
              </button>
            )}
          </div>
        </div>

        <div className="flex gap-2 items-center">
          <div className="relative flex items-center gap-1">
            <button
              onClick={() => setCorrectionMode(!correctionMode)}
              className={`flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-bold border transition-all ${
                correctionMode
                  ? 'bg-amber-600 text-white border-amber-700'
                  : 'bg-white text-stone-600 border-stone-200 hover:border-stone-400'
              }`}
            >
              <Pencil className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{correctionMode ? 'Correction ON' : 'Mode correction'}</span>
            </button>
            <button
              onClick={() => setShowCorrectionInfo(!showCorrectionInfo)}
              className="text-stone-400 hover:text-stone-600 p-1 rounded-full transition-colors"
              title="Qu'est-ce que le mode correction ?"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
            {showCorrectionInfo && (
              <div className="absolute top-full right-0 mt-2 w-60 bg-white border border-stone-200 rounded-xl shadow-lg p-3 z-50 text-left">
                <div className="flex justify-between items-start mb-1.5">
                  <p className="text-[10px] font-bold text-stone-700 uppercase tracking-wide">Mode correction</p>
                  <button onClick={() => setShowCorrectionInfo(false)} className="text-stone-400 hover:text-stone-600 text-xs">✕</button>
                </div>
                <p className="text-xs text-stone-600 leading-relaxed">
                  🔒 Par défaut, les jours déjà passés sont verrouillés pour éviter les erreurs. Active ce mode pour les rendre modifiables et corriger qui était de service un jour donné.
                </p>
              </div>
            )}
          </div>
          <button
            id="btn-copy-summary"
            onClick={() => {
              onCopySummary();
              setCopiedText(true);
              setTimeout(() => setCopiedText(false), 2500);
            }}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl shadow-xs transition-all ${
              copiedText
                ? 'bg-emerald-600 text-white'
                : 'bg-amber-500 hover:bg-amber-600 text-white'
            }`}
          >
            {copiedText ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Copié !</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5" />
                <span>Copier résumé</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main lists scrollable container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        <div className="flex justify-end gap-3">
          <button
            onClick={() => setCollapsedWeeks(new Set(weeks.map((_, i) => i)))}
            className="text-[10px] text-stone-400 hover:text-stone-600 font-medium transition-colors"
          >
            Tout réduire
          </button>
          <button
            onClick={() => setCollapsedWeeks(new Set())}
            className="text-[10px] text-stone-400 hover:text-stone-600 font-medium transition-colors"
          >
            Tout développer
          </button>
        </div>
        {weeks.map((weekDays, wIdx) => {
          const weekMonday = new Date(weekDays[0]?.date);
          const formattedMon = weekMonday.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
          const isoWeek = getISOWeekNumber(weekMonday);

          return (
            <div
              key={wIdx}
              className="border rounded-2xl overflow-hidden transition-colors border-amber-100 bg-white shadow-3xs"
            >
              {/* Week header banner */}
              <div
                className="px-4 py-3 border-b flex justify-between items-center bg-amber-500/10 border-amber-100 cursor-pointer"
                onClick={() => toggleWeek(wIdx)}
              >
                <div>
                  <span className="text-xs font-bold text-stone-700">Semaine {isoWeek}</span>
                  <span className="text-[11px] text-stone-500 font-mono ml-1.5">— Lun. {formattedMon}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1 border bg-amber-500/15 text-amber-900 border-amber-200">
                    <Coffee className="w-3.5 h-3.5 text-amber-600" />
                    <span>🌞 Matin</span>
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-amber-700 transition-transform duration-200 ${collapsedWeeks.has(wIdx) ? 'rotate-180' : ''}`}
                  />
                </div>
              </div>

              {/* Days inside the week */}
              {!collapsedWeeks.has(wIdx) && (
              <div className="divide-y divide-stone-150">
                {weekDays
                  .filter((day) => day.isWorkDay)
                  .map((day) => {
                    const isEditing = editingDate === day.dateString;
                    const colors = getColors(day.colleagueColor);
                    const coApporteurId = coApporteurs[day.dateString];
                    const coApporteur = coApporteurId ? colleagues.find(c => c.id === coApporteurId) : null;
                    const coColors = coApporteur ? getColors(coApporteur.color) : null;

                    return (
                      <div key={day.dateString} className="p-3.5 flex flex-col gap-2.5">
                        {/* Main Row */}
                        <div className="flex items-center justify-between">
                          <div className="flex flex-col">
                            <span className="font-bold text-xs.5 text-stone-900">
                              {getDayLabelFr(day.dayOfWeek)}
                            </span>
                            <span className="text-[10.5px] text-stone-500 font-medium select-none">
                              {formatDateLabelFr(day.date)}
                            </span>
                          </div>

                          {/* Assignee + co-apporteur */}
                          <div className="flex flex-col items-end gap-1">
                            {canEditDayNow(day) ? (
                              day.colleagueId ? (
                                <button
                                  id={`btn-edit-day-${day.dateString}`}
                                  onClick={() => setEditingDate(isEditing ? null : day.dateString)}
                                  className={`flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl border transition-all ${
                                    day.isManualOverride
                                      ? 'border-amber-400 bg-amber-50 text-amber-950 shadow-3xs'
                                      : `${colors.border} ${colors.background} ${colors.text} hover:opacity-90`
                                  }`}
                                >
                                  <span className={`w-6 h-6 rounded-lg font-bold text-[10px] flex items-center justify-center bg-white border ${colors.border}`}>
                                    {day.colleagueName?.slice(0, 2).toUpperCase()}
                                  </span>
                                  <span className="text-xs font-bold leading-none">{day.colleagueName}</span>
                                  <ChevronDown className="w-3.5 h-3.5 opacity-60 flex-shrink-0" />
                                </button>
                              ) : (
                                <button
                                  id={`btn-edit-day-empty-${day.dateString}`}
                                  onClick={() => setEditingDate(isEditing ? null : day.dateString)}
                                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-rose-200/80 bg-rose-50/50 text-rose-800 hover:bg-rose-50 transition-colors"
                                >
                                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                                  <span className="text-xs font-semibold">⚠️ Aucun volontaire</span>
                                  <ChevronDown className="w-3.5 h-3.5 opacity-60" />
                                </button>
                              )
                            ) : (
                              day.colleagueId ? (
                                <div className={`flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl border ${colors.border} ${colors.background} ${colors.text}`}>
                                  <span className={`w-6 h-6 rounded-lg font-bold text-[10px] flex items-center justify-center bg-white border ${colors.border}`}>
                                    {day.colleagueName?.slice(0, 2).toUpperCase()}
                                  </span>
                                  <span className="text-xs font-bold leading-none">{day.colleagueName}</span>
                                </div>
                              ) : (
                                <span className="text-xs text-rose-500 font-medium">⚠️ Non assigné</span>
                              )
                            )}
                            {coApporteur && coColors && (
                              <div className="flex items-center gap-1">
                                <span className="text-stone-300 text-xs font-bold">+</span>
                                <span className={`w-4 h-4 rounded text-white text-[9px] font-bold flex items-center justify-center ${coColors.background}`}>
                                  {coApporteur.name.slice(0, 2).toUpperCase()}
                                </span>
                                <span className="text-[10px] text-stone-500">{coApporteur.name}</span>
                              </div>
                            )}
                          </div>
                        </div>

                          {/* Override Selector Panel (displays below when clicked) */}
                          {isEditing && canEditDayNow(day) && (
                            <div className="bg-stone-50/80 border border-stone-200 rounded-xl p-3 space-y-2 text-xs">
                              <div className="flex justify-between items-center pb-1 border-b border-stone-150">
                                <span className="font-bold text-stone-700 text-[10px] uppercase tracking-wider">
                                  Assignation manuelle (Ajuster)
                                </span>
                                <button
                                  onClick={() => setEditingDate(null)}
                                  className="text-stone-400 hover:text-stone-600 font-bold"
                                >
                                  Fermer
                                </button>
                              </div>

                              <div className="grid grid-cols-2 gap-1.5">
                                {/* Reset to Automatic Option */}
                                <button
                                  onClick={() => {
                                    onClearOverride(day.dateString);
                                    setEditingDate(null);
                                  }}
                                  className={`p-2 rounded-lg text-left text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                                    !day.isManualOverride
                                      ? 'bg-amber-500 text-white border-amber-600'
                                      : 'bg-white hover:bg-stone-50 border-stone-200 text-stone-600'
                                  }`}
                                >
                                  <RefreshCw className={`w-3.5 h-3.5 ${!day.isManualOverride ? 'animate-spin-once' : ''}`} />
                                  <div className="flex flex-col leading-none">
                                    <span>Automatique</span>
                                    <span className="text-[8px] opacity-75 mt-0.5">Calculé par rotation</span>
                                  </div>
                                </button>

                                {/* Unassigned Option */}
                                <button
                                  onClick={() => {
                                    onSetOverride(day.dateString, null);
                                    setEditingDate(null);
                                  }}
                                  className={`p-2 rounded-lg text-left text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                                    day.isManualOverride && day.colleagueId === null
                                      ? 'bg-rose-600 text-white border-rose-700'
                                      : 'bg-white hover:bg-stone-50 border-stone-200 text-stone-600'
                                  }`}
                                >
                                  <CalendarOff className="w-3.5 h-3.5" />
                                  <div className="flex flex-col leading-none">
                                    <span>Sauter / Repos</span>
                                    <span className="text-[8px] opacity-75 mt-0.5">Pas de p'tit déj</span>
                                  </div>
                                </button>

                                {/* List of Active Colleagues */}
                                {colleagues
                                  .filter((col) => col.isActive)
                                  .map((col) => {
                                    const colColors = getColors(col.color);
                                    const isSelected = day.colleagueId === col.id && day.isManualOverride;

                                    return (
                                      <button
                                        key={col.id}
                                        id={`select-colleague-${col.id}-for-override`}
                                        onClick={() => {
                                          onSetOverride(day.dateString, col.id);
                                          setEditingDate(null);
                                        }}
                                        className={`p-2 rounded-lg text-left text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                                          isSelected
                                            ? 'bg-amber-600 text-white border-amber-700'
                                            : 'bg-white hover:bg-stone-50 border-stone-200 text-stone-700'
                                        }`}
                                      >
                                        <span className={`w-2.5 h-2.5 rounded-full ${colColors.background} ${colColors.text} border ${colColors.border}`} />
                                        <span>{col.name}</span>
                                      </button>
                                    );
                                  })}
                              </div>

                              {/* Co-apporteur */}
                              <div className="pt-2 border-t border-stone-150">
                                <p className="text-[10px] font-bold text-stone-500 uppercase mb-1.5">Co-apporteur</p>
                                <select
                                  value={coApporteurs[day.dateString] ?? ''}
                                  onChange={e => {
                                    const val = e.target.value;
                                    setCoApporteurs(prev => {
                                      const next = { ...prev };
                                      if (val) next[day.dateString] = val;
                                      else delete next[day.dateString];
                                      return next;
                                    });
                                  }}
                                  className="w-full text-xs border border-stone-200 rounded px-2 py-1.5 bg-white text-stone-700 focus:outline-none focus:ring-1 focus:ring-amber-400"
                                >
                                  <option value="">Aucun</option>
                                  {colleagues
                                    .filter(c => c.isActive && c.id !== day.colleagueId)
                                    .map(col => (
                                      <option key={col.id} value={col.id}>{col.name}</option>
                                    ))
                                  }
                                </select>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
              </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
