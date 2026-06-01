import React, { useState } from 'react';
import { CalendarDay, Colleague, ManualOverride } from '../types';
import { getColors } from '../utils/colorMapper';
import { 
  Coffee, Share2, Check, AlertTriangle, ChevronDown, RefreshCw, 
  User, Calendar, Landmark, Info, CalendarOff, Smile, Copy, CheckCircle
} from 'lucide-react';

interface PlanningViewProps {
  schedule: CalendarDay[];
  colleagues: Colleague[];
  onSetOverride: (dateString: string, colleagueId: string | null) => void;
  onClearOverride: (dateString: string) => void;
  startWeekDate: string;
}

export function PlanningView({
  schedule,
  colleagues,
  onSetOverride,
  onClearOverride,
  startWeekDate,
}: PlanningViewProps) {
  const [editingDate, setEditingDate] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState(false);

  // Group schedule by weekIndex (dynamic based on schedule length)
  const maxWeekIndex = Math.max(...schedule.map(d => d.weekIndex), 0);
  const weeks: CalendarDay[][] = [];
  for (let i = 0; i <= maxWeekIndex; i++) {
    weeks.push(schedule.filter((day) => day.weekIndex === i));
  }

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

  // Generate plain text summary for easy coffee-room copying
  const handleCopySummary = () => {
    const numWeeks = Math.max(...schedule.map(d => d.weekIndex), 0) + 1;
    let summary = `☕ *PLANNING PETITS DÉJEUNERS (${numWeeks} SEMAINES)* 🥐\n`;
    const start = new Date(schedule[0].date);
    const end = new Date(schedule[schedule.length - 1].date);
    summary += `Période : du Lundi ${start.toLocaleDateString('fr-FR')} au Dimanche ${end.toLocaleDateString('fr-FR')}\n\n`;

    weeks.forEach((weekDays, wIdx) => {
      const isMorning = weekDays[0]?.isMorningShift;
      const weekMonday = new Date(weekDays[0]?.date);
      const formattedMon = weekMonday.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
      
      summary += `*Semaine ${wIdx + 1} (du ${formattedMon})* : ${
        isMorning ? '🌞 Matin' : '💤 Repos / Autre poste (Pas de p\'tit déj)'
      }\n`;

      if (isMorning) {
        weekDays.forEach((day) => {
          if (day.isWorkDay) {
            const dayName = getDayLabelFr(day.dayOfWeek);
            const dateNum = day.date.toLocaleDateString('fr-FR', { day: 'numeric', month: '2-digit' });
            const name = day.colleagueName || '⚠️ Aucun volontairepo';
            summary += `  - ${dayName} ${dateNum} : *${name}* ${day.isManualOverride ? '✍️' : '🔄'}\n`;
          }
        });
      }
      summary += `\n`;
    });

    summary += `_Généré automatiquement par Planning Petit Déj._`;

    navigator.clipboard.writeText(summary);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2500);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Top Banner Toolbar */}
      <div className="px-4 py-3 bg-white border-b border-stone-200/80 flex justify-between items-center z-10 shadow-3xs">
        <div>
          <h2 className="font-bold text-stone-900 text-sm">Prévisions {weeks.length} semaines</h2>
          <p className="text-[10px] text-stone-500 font-medium">Cycle recalculé à chaque modification</p>
        </div>

        <button
          id="btn-copy-summary"
          onClick={handleCopySummary}
          className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl shadow-xs transition-all ${
            copiedText
              ? 'bg-emerald-600 text-white'
              : 'bg-amber-500 hover:bg-amber-600 text-white'
          }`}
        >
          {copiedText ? (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>Copié dans le presse-pap !</span>
            </>
          ) : (
            <>
              <Share2 className="w-3.5 h-3.5" />
              <span>Exporter WhatsApp / Slack</span>
            </>
          )}
        </button>
      </div>

      {/* Main lists scrollable container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {weeks.map((weekDays, wIdx) => {
          const isMorning = weekDays[0]?.isMorningShift;
          const weekMonday = new Date(weekDays[0]?.date);
          const formattedMon = weekMonday.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });

          return (
            <div
              key={wIdx}
              className={`border rounded-2xl overflow-hidden transition-colors ${
                isMorning
                  ? 'border-amber-100 bg-white shadow-3xs'
                  : 'border-stone-200/50 bg-stone-50/55'
              }`}
            >
              {/* Week header banner */}
              <div
                className={`px-4 py-3 border-b flex justify-between items-center ${
                  isMorning
                    ? 'bg-amber-500/10 border-amber-100'
                    : 'bg-stone-100/50 border-stone-150'
                }`}
              >
                <div>
                  <h4 className="font-bold text-stone-900 text-xs tracking-tight">
                    Semaine {wIdx + 1}
                  </h4>
                  <span className="text-[10px] text-stone-500 font-mono">
                    Débute le Lun. {formattedMon}
                  </span>
                </div>

                <span
                  className={`text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1 border ${
                    isMorning
                      ? 'bg-amber-500/15 text-amber-900 border-amber-200'
                      : 'bg-stone-200/50 text-stone-500 border-stone-300'
                  }`}
                >
                  {isMorning ? (
                    <>
                      <Coffee className="w-3.5 h-3.5 text-amber-600" />
                      <span>🌞 Matin</span>
                    </>
                  ) : (
                    <>
                      <CalendarOff className="w-3.5 h-3.5 text-stone-400" />
                      <span>💤 Autre / Repos</span>
                    </>
                  )}
                </span>
              </div>

              {/* Days inside the week */}
              <div className="divide-y divide-stone-150">
                {!isMorning ? (
                  <div className="p-4 text-center">
                    <p className="text-xs text-stone-400 font-medium">
                      Pas d'équipe du matin cette semaine-ci. Les petits déjeuners sont mis en pause.
                    </p>
                  </div>
                ) : (
                  weekDays
                    .filter((day) => day.isWorkDay)
                    .map((day) => {
                      const isEditing = editingDate === day.dateString;
                      const colors = getColors(day.colleagueColor);

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

                            {/* Assignee trigger box */}
                            <div className="relative">
                              {day.colleagueId ? (
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
                              )}
                            </div>
                          </div>

                          {/* Override Selector Panel (displays below when clicked) */}
                          {isEditing && (
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
                            </div>
                          )}
                        </div>
                      );
                    })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
