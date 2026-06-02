import React, { useState } from 'react';
import { CalendarDay, Colleague } from '../types';
import { getColors } from '../utils/colorMapper';
import { exportPlanningToExcel } from '../utils/excelExport';
import { getISOWeekNumber } from '../utils/scheduler';
import { 
  FileDown, Share2, Check, Coffee, CalendarOff, AlertTriangle, RefreshCw, ChevronDown
} from 'lucide-react';

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
  const [copiedText, setCopiedText] = useState(false);
  const [exportedExcel, setExportedExcel] = useState(false);
  const [editingDate, setEditingDate] = useState<string | null>(null);

  // Group schedule by week
  const maxWeekIndex = Math.max(...schedule.map(d => d.weekIndex), 0);
  const weeks: CalendarDay[][] = [];
  for (let i = 0; i <= maxWeekIndex; i++) {
    weeks.push(schedule.filter((day) => day.weekIndex === i));
  }

  // Helper functions
  const getDayLabelFr = (dayOfWeek: number) => {
    const labels = ['', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    return labels[dayOfWeek] || '';
  };

  const formatDateLabelFr = (date: Date) => {
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'numeric',
    });
  };

  const handleCopySummary = () => {
    const summary = weeks
      .map((weekDays, wIdx) => {
        const isMorning = weekDays[0]?.isMorningShift;
        if (!isMorning) return null;
        const weekData = weekDays
          .filter(d => d.isWorkDay)
          .map(d => `${getDayLabelFr(d.dayOfWeek)}: ${d.colleagueName || '⚠️ Personne'}`)
          .join(' • ');
        return weekData;
      })
      .filter(Boolean)
      .join('\n\n');

    navigator.clipboard.writeText(summary);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2500);
  };

  const handleExportExcel = () => {
    exportPlanningToExcel(schedule, colleagues, numberOfWeeks, startWeekDate);
    setExportedExcel(true);
    setTimeout(() => setExportedExcel(false), 2500);
  };

  // Get all workdays across all weeks for column headers
  const allWorkDays: { date: Date; dateString: string; dayOfWeek: number; weekIndex: number }[] = [];
  weeks.forEach((weekDays, wIdx) => {
    const isMorning = weekDays[0]?.isMorningShift;
    if (isMorning) {
      weekDays
        .filter(d => d.isWorkDay)
        .forEach(d => {
          allWorkDays.push({
            date: d.date,
            dateString: d.dateString,
            dayOfWeek: d.dayOfWeek,
            weekIndex: wIdx,
          });
        });
    }
  });

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-stone-50">
      {/* Top toolbar */}
      <div className="px-6 py-4 bg-white border-b border-stone-200/80 flex justify-between items-center z-10 shadow-sm">
        <div>
          <h2 className="font-bold text-stone-900 text-lg">Planification ({numberOfWeeks} semaines)</h2>
          <p className="text-xs text-stone-500 font-medium">Affichage calendrier haute résolution</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleCopySummary}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg shadow-xs transition-all ${
              copiedText
                ? 'bg-emerald-600 text-white'
                : 'bg-amber-500 hover:bg-amber-600 text-white'
            }`}
          >
            {copiedText ? (
              <>
                <Check className="w-4 h-4" />
                <span>Copié!</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4" />
                <span>Copier résumé</span>
              </>
            )}
          </button>

          <button
            onClick={handleExportExcel}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg shadow-xs transition-all ${
              exportedExcel
                ? 'bg-emerald-600 text-white'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            {exportedExcel ? (
              <>
                <Check className="w-4 h-4" />
                <span>Téléchargé!</span>
              </>
            ) : (
              <>
                <FileDown className="w-4 h-4" />
                <span>Excel</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Scrollable table area */}
      <div className="flex-1 overflow-auto p-6">
        {weeks.length === 0 ? (
          <div className="flex items-center justify-center h-full text-stone-500">
            <p>Aucune semaine planifiée</p>
          </div>
        ) : (
          <div className="space-y-8">
            {weeks.map((weekDays, weekIdx) => {
              const isMorning = weekDays[0]?.isMorningShift;
              const weekMonday = new Date(weekDays[0]?.date);
              const formattedMon = weekMonday.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
              const isoWeek = getISOWeekNumber(weekMonday);

              if (!isMorning) {
                return (
                  <div key={weekIdx} className="bg-stone-100/50 border border-stone-200 rounded-lg p-6 text-center">
                    <p className="text-xs text-stone-500 font-medium">
                      <CalendarOff className="inline w-4 h-4 mr-2" />
                      Semaine {isoWeek} (du {formattedMon}) : Pas d'équipe du matin cette semaine
                    </p>
                  </div>
                );
              }

              // Work days in this week
              const workDaysInWeek = weekDays.filter(d => d.isWorkDay);

              return (
                <div key={weekIdx} className="bg-white border border-stone-200 rounded-lg overflow-hidden shadow-sm">
                  {/* Week header */}
                  <div className="bg-amber-50/50 border-b border-stone-200 px-6 py-4 flex items-center gap-3">
                    <Coffee className="w-5 h-5 text-amber-600" />
                    <div>
                      <p className="text-sm font-bold text-stone-900">Semaine {isoWeek} <span className="font-normal text-stone-500">— du {formattedMon}</span></p>
                      <p className="text-xs text-stone-500">🌞 Équipe du matin</p>
                    </div>
                  </div>

                  {/* Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-stone-200 bg-stone-50/50">
                          <th className="px-4 py-3 text-left text-xs font-bold text-stone-700 w-32">Collègue</th>
                          {workDaysInWeek.map(day => (
                            <th
                              key={day.dateString}
                              className="px-3 py-3 text-center text-xs font-bold text-stone-700 min-w-24"
                            >
                              <div>{getDayLabelFr(day.dayOfWeek)}</div>
                              <div className="text-stone-500 font-normal text-[10px] mt-1">
                                {formatDateLabelFr(day.date)}
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {colleagues
                          .filter(col => col.isActive)
                          .map(colleague => (
                            <tr key={colleague.id} className="border-b border-stone-150 hover:bg-stone-50/50 transition-colors">
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <div className={`w-8 h-8 rounded-lg font-bold text-xs flex items-center justify-center text-white ${getColors(colleague.color).background}`}>
                                    {colleague.name.slice(0, 2).toUpperCase()}
                                  </div>
                                  <span className="text-sm font-semibold text-stone-900">{colleague.name}</span>
                                </div>
                              </td>
                              {workDaysInWeek.map(day => {
                                const assignedDay = schedule.find(
                                  d => d.dateString === day.dateString && d.colleagueId === colleague.id
                                );
                                const isEditing = editingDate === day.dateString;
                                const colors = getColors(colleague.color);

                                if (!assignedDay) {
                                  return <td key={day.dateString} className="px-3 py-3 text-center" />;
                                }

                                return (
                                  <td
                                    key={day.dateString}
                                    className="px-3 py-3 text-center relative"
                                  >
                                    <button
                                      onClick={() => setEditingDate(isEditing ? null : day.dateString)}
                                      className={`w-full px-2 py-1.5 rounded text-xs font-semibold transition-all border relative ${
                                        assignedDay.isManualOverride
                                          ? 'border-amber-400 bg-amber-50 text-amber-950'
                                          : `${colors.border} ${colors.background} ${colors.text}`
                                      }`}
                                      title={assignedDay.isManualOverride ? 'Manuel' : 'Auto'}
                                    >
                                      ✓
                                      {assignedDay.isManualOverride && (
                                        <span className="absolute top-0 right-0 text-amber-500 text-[10px]">✍️</span>
                                      )}
                                    </button>

                                    {/* Edit popup */}
                                    {isEditing && (
                                      <div className="absolute top-full mt-2 left-0 bg-white border border-stone-200 rounded-lg shadow-lg p-3 z-50 min-w-48 text-left">
                                        <div className="flex justify-between items-center mb-2 pb-2 border-b border-stone-200">
                                          <p className="text-[10px] font-bold text-stone-700 uppercase">Modifier</p>
                                          <button
                                            onClick={() => setEditingDate(null)}
                                            className="text-stone-400 hover:text-stone-600 text-xs"
                                          >
                                            ✕
                                          </button>
                                        </div>
                                        <div className="space-y-1.5">
                                          <button
                                            onClick={() => {
                                              onClearOverride(day.dateString);
                                              setEditingDate(null);
                                            }}
                                            className={`w-full p-2 rounded text-xs font-semibold border text-left transition-all ${
                                              !assignedDay.isManualOverride
                                                ? 'bg-amber-500 text-white border-amber-600'
                                                : 'bg-white hover:bg-stone-50 border-stone-200 text-stone-600'
                                            }`}
                                          >
                                            <RefreshCw className="inline w-3 h-3 mr-1" />
                                            Automatique
                                          </button>
                                          <button
                                            onClick={() => {
                                              onSetOverride(day.dateString, null);
                                              setEditingDate(null);
                                            }}
                                            className="w-full p-2 rounded text-xs font-semibold border bg-white hover:bg-stone-50 border-stone-200 text-stone-600 text-left"
                                          >
                                            <CalendarOff className="inline w-3 h-3 mr-1" />
                                            Sauter
                                          </button>
                                          {colleagues
                                            .filter(c => c.isActive)
                                            .map(col => (
                                              <button
                                                key={col.id}
                                                onClick={() => {
                                                  onSetOverride(day.dateString, col.id);
                                                  setEditingDate(null);
                                                }}
                                                className={`w-full p-2 rounded text-xs font-semibold border text-left transition-all ${
                                                  day.dateString === assignedDay.dateString && col.id === colleague.id && assignedDay.isManualOverride
                                                    ? 'bg-amber-600 text-white border-amber-700'
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
                                );
                              })}
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
