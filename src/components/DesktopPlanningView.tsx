import React, { useState } from 'react';
import { CalendarDay, Colleague } from '../types';
import { getColors } from '../utils/colorMapper';
import { getISOWeekNumber } from '../utils/scheduler';
import { Coffee, CalendarOff, RefreshCw, History, Calendar } from 'lucide-react';

interface DesktopPlanningViewProps {
  schedule: CalendarDay[];
  colleagues: Colleague[];
  onSetOverride: (dateString: string, colleagueId: string | null) => void;
  onClearOverride: (dateString: string) => void;
  startWeekDate: string;
  numberOfWeeks: number;
}

export function DesktopPlanningView({
  schedule,
  colleagues,
  onSetOverride,
  onClearOverride,
  startWeekDate,
  numberOfWeeks,
}: DesktopPlanningViewProps) {
  const [editingDate, setEditingDate] = useState<string | null>(null);
  const [showPast, setShowPast] = useState(false);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  const maxWeekIndex = Math.max(...schedule.map(d => d.weekIndex), 0);
  const allWeeks: CalendarDay[][] = [];
  for (let i = 0; i <= maxWeekIndex; i++) {
    allWeeks.push(schedule.filter((day) => day.weekIndex === i));
  }

  // Filtre 1 : uniquement les semaines actives (équipe du matin)
  const activeWeeks = allWeeks.filter(w => w[0]?.isMorningShift);

  // Filtre 2 : sépare passé et futur/présent
  const pastWeeks = activeWeeks.filter(w => {
    const lastDay = w.filter(d => d.isWorkDay).at(-1);
    return lastDay && lastDay.dateString < todayStr;
  });

  const currentAndFutureWeeks = activeWeeks.filter(w => {
    const lastDay = w.filter(d => d.isWorkDay).at(-1);
    return lastDay && lastDay.dateString >= todayStr;
  });

  const weeksToShow = showPast
    ? [...pastWeeks, ...currentAndFutureWeeks]
    : currentAndFutureWeeks;

  const DAY_LABELS: Record<number, string> = {
    1: 'Lundi', 2: 'Mardi', 3: 'Mercredi',
    4: 'Jeudi', 5: 'Vendredi', 6: 'Samedi', 7: 'Dimanche'
  };

  const formatFullDate = (date: Date) =>
    date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });

  const formatWeekRange = (days: CalendarDay[]) => {
    const workDays = days.filter(d => d.isWorkDay);
    if (workDays.length === 0) return '';
    const first = workDays[0].date;
    const last = workDays[workDays.length - 1].date;
    return `du ${first.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })} au ${last.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}`;
  };

  const isWeekPast = (weekDays: CalendarDay[]) => {
    const lastDay = weekDays.filter(d => d.isWorkDay).at(-1);
    return lastDay && lastDay.dateString < todayStr;
  };

  return (
      <div className="flex-1 flex flex-col overflow-auto bg-stone-50">    {/* Barre d'action historique */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-stone-200 bg-white">
        <p className="text-xs text-stone-500">
          {currentAndFutureWeeks.length} semaine{currentAndFutureWeeks.length > 1 ? 's' : ''} à venir
          {pastWeeks.length > 0 && ` · ${pastWeeks.length} semaine${pastWeeks.length > 1 ? 's' : ''} passée${pastWeeks.length > 1 ? 's' : ''}`}
        </p>
        {pastWeeks.length > 0 && (
          <button
            onClick={() => setShowPast(!showPast)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
              showPast
                ? 'bg-stone-800 text-white border-stone-900'
                : 'bg-white text-stone-600 border-stone-200 hover:border-stone-400'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            {showPast ? 'Masquer l\'historique' : 'Voir l\'historique'}
          </button>
        )}
      </div>

      <div className="flex-1 overflow-auto p-6 scrollbar-thin scrollbar-thumb-amber-300 scrollbar-track-stone-100">
        {weeksToShow.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-stone-400 gap-3">
            <Calendar className="w-10 h-10" />
            <p className="text-sm">Aucune semaine active à afficher</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 xl:grid-cols-3 gap-6">
            {weeksToShow.map((weekDays, weekIdx) => {
              const weekMonday = new Date(weekDays[0]?.date);
              const isoWeek = getISOWeekNumber(weekMonday);
              const weekRange = formatWeekRange(weekDays);
              const isPast = isWeekPast(weekDays);
              const assignedDays = weekDays.filter(
                d => d.isWorkDay && d.colleagueId !== null
              );

              return (
                <div
                  key={weekIdx}
                  className={`bg-white border rounded-xl overflow-hidden shadow-sm transition-all ${
                    isPast
                      ? 'border-stone-200 opacity-60'
                      : 'border-stone-200'
                  }`}
                >
                  {/* Header tuile */}
                  <div className={`border-b px-4 py-3 flex items-center gap-2 ${
                    isPast ? 'bg-stone-50 border-stone-100' : 'bg-amber-50 border-amber-100'
                  }`}>
                    {isPast
                      ? <History className="w-4 h-4 text-stone-400 flex-shrink-0" />
                      : <Coffee className="w-4 h-4 text-amber-600 flex-shrink-0" />
                    }
                    <div>
                      <p className={`text-sm font-bold ${isPast ? 'text-stone-500' : 'text-stone-900'}`}>
                        Semaine {isoWeek}
                      </p>
                      <p className="text-xs text-stone-400">{weekRange}</p>
                    </div>
                    {isPast && (
                      <span className="ml-auto text-[10px] font-bold text-stone-400 uppercase tracking-wide">
                        Passé
                      </span>
                    )}
                  </div>

                  {/* Tableau */}
                  {assignedDays.length === 0 ? (
                    <div className="p-4 text-center text-xs text-stone-400">
                      Aucune assignation
                    </div>
                  ) : (
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-stone-100 bg-stone-50/50">
                          <th className="px-4 py-2 text-left text-xs font-bold text-stone-500 uppercase tracking-wide">Jour</th>
                          <th className="px-4 py-2 text-left text-xs font-bold text-stone-500 uppercase tracking-wide">Collègue</th>
                        </tr>
                      </thead>
                      <tbody>
                        {assignedDays.map(day => {
                          const colleague = colleagues.find(c => c.id === day.colleagueId);
                          if (!colleague) return null;
                          const colors = getColors(colleague.color);
                          const isEditing = editingDate === day.dateString;
                          const isDayPast = day.dateString < todayStr;

                          return (
                            <tr
                              key={day.dateString}
                              className="border-b border-stone-100 last:border-0 hover:bg-stone-50 transition-colors"
                            >
                              <td className="px-4 py-3">
                                <div className={`text-sm font-semibold ${isDayPast ? 'text-stone-400' : 'text-stone-800'}`}>
                                  {DAY_LABELS[day.dayOfWeek]}
                                </div>
                                <div className="text-xs text-stone-400">
                                  {formatFullDate(day.date)}
                                </div>
                              </td>

                              <td className="px-4 py-3 relative">
                                <button
                                  onClick={() => !isDayPast && setEditingDate(isEditing ? null : day.dateString)}
                                  disabled={isDayPast}
                                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                                    isDayPast
                                      ? 'opacity-50 cursor-default border-stone-200 bg-stone-50 text-stone-500'
                                      : day.isManualOverride
                                        ? 'border-amber-400 bg-amber-50 text-amber-900 cursor-pointer'
                                        : `${colors.border} ${colors.background} ${colors.text} cursor-pointer`
                                  }`}
                                >
                                  <div className={`w-5 h-5 rounded flex items-center justify-center text-white text-[10px] font-bold ${colors.background}`}>
                                    {colleague.name.slice(0, 2).toUpperCase()}
                                  </div>
                                  {colleague.name}
                                  {day.isManualOverride && !isDayPast && (
                                    <span className="text-amber-500 text-[10px]">✍️</span>
                                  )}
                                </button>

                                {isEditing && !isDayPast && (
                                  <div className="absolute top-full mt-1 left-0 bg-white border border-stone-200 rounded-lg shadow-lg p-3 z-50 min-w-44 text-left">
                                    <div className="flex justify-between items-center mb-2 pb-2 border-b border-stone-100">
                                      <p className="text-[10px] font-bold text-stone-600 uppercase">Modifier</p>
                                      <button onClick={() => setEditingDate(null)} className="text-stone-400 text-xs">✕</button>
                                    </div>
                                    <div className="space-y-1">
                                      <button
                                        onClick={() => { onClearOverride(day.dateString); setEditingDate(null); }}
                                        className="w-full p-2 rounded text-xs font-medium border bg-white hover:bg-stone-50 border-stone-200 text-stone-600 text-left flex items-center gap-1"
                                      >
                                        <RefreshCw className="w-3 h-3" /> Automatique
                                      </button>
                                      <button
                                        onClick={() => { onSetOverride(day.dateString, null); setEditingDate(null); }}
                                        className="w-full p-2 rounded text-xs font-medium border bg-white hover:bg-stone-50 border-stone-200 text-stone-600 text-left flex items-center gap-1"
                                      >
                                        <CalendarOff className="w-3 h-3" /> Sauter
                                      </button>
                                      {colleagues.filter(c => c.isActive).map(col => (
                                        <button
                                          key={col.id}
                                          onClick={() => { onSetOverride(day.dateString, col.id); setEditingDate(null); }}
                                          className={`w-full p-2 rounded text-xs font-medium border text-left transition-all ${
                                            col.id === day.colleagueId && day.isManualOverride
                                              ? 'bg-amber-500 text-white border-amber-600'
                                              : 'bg-white hover:bg-stone-50 border-stone-200 text-stone-700'
                                          }`}
                                        >
                                          {col.name}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}