import React, { useState } from 'react';
import { Colleague, Absence } from '../types';
import { getColors, COLOR_MAP } from '../utils/colorMapper';
import { 
  Plus, Trash2, Calendar, UserPlus, ToggleLeft, ToggleRight, 
  UserMinus, RefreshCw, CalendarX, ShieldAlert, CheckCircle2, ChevronRight
} from 'lucide-react';

interface ColleaguesViewProps {
  colleagues: Colleague[];
  absences: Absence[];
  onAddColleague: (name: string, color: string) => void;
  onUpdateColleague: (colleague: Colleague) => void;
  onDeleteColleague: (id: string) => void;
  onAddAbsence: (colleagueId: string, startDate: string, endDate: string, reason: string) => void;
  onDeleteAbsence: (id: string) => void;
  stats: any[];
}

export function ColleaguesView({
  colleagues,
  absences,
  onAddColleague,
  onUpdateColleague,
  onDeleteColleague,
  onAddAbsence,
  onDeleteAbsence,
  stats,
}: ColleaguesViewProps) {
  const [subTab, setSubTab] = useState<'members' | 'absences'>('members');

  // Colleagues States
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberColor, setNewMemberColor] = useState('blue');
  const [showAddMember, setShowAddMember] = useState(false);

  // Absence States
  const [absColleagueId, setAbsColleagueId] = useState('');
  const [absStart, setAbsStart] = useState('');
  const [absEnd, setAbsEnd] = useState('');
  const [absReason, setAbsReason] = useState('Congé');
  const [showAddAbsence, setShowAddAbsence] = useState(false);

  // Error/Success feedbacks
  const [memberError, setMemberError] = useState('');
  const [absenceError, setAbsenceError] = useState('');

  // Handle adding a new colleague
  const handleCreateColleague = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim()) {
      setMemberError('Le nom est requis');
      return;
    }
    onAddColleague(newMemberName.trim(), newMemberColor);
    setNewMemberName('');
    setNewMemberColor('blue');
    setShowAddMember(false);
    setMemberError('');
  };

  // Handle adding an absence
  const handleCreateAbsence = (e: React.FormEvent) => {
    e.preventDefault();
    if (!absColleagueId) {
      setAbsenceError('Sélectionnez un collègue');
      return;
    }
    if (!absStart) {
      setAbsenceError('Sélectionnez une date de début');
      return;
    }
    const end = absEnd || absStart; // single day if empty
    if (end < absStart) {
      setAbsenceError('La date de fin doit être après le début');
      return;
    }

    onAddAbsence(absColleagueId, absStart, end, absReason.trim());
    setAbsColleagueId('');
    setAbsStart('');
    setAbsEnd('');
    setAbsReason('Congé');
    setShowAddAbsence(false);
    setAbsenceError('');
  };

  // Helper to format date nicely
  const formatDateFr = (dateStr: string) => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
    });
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Sub tabs switches */}
      <div className="px-4 py-2 bg-stone-50 border-b border-stone-200/80 flex gap-2">
        <button
          onClick={() => setSubTab('members')}
          className={`flex-1 py-2 text-center rounded-xl text-sm font-semibold transition-all ${
            subTab === 'members'
              ? 'bg-white text-amber-900 shadow-sm border border-stone-200/50'
              : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <UserPlus className="w-4 h-4 text-amber-600" />
            <span>Membres ({colleagues.length})</span>
          </div>
        </button>
        <button
          onClick={() => setSubTab('absences')}
          className={`flex-1 py-2 text-center rounded-xl text-sm font-semibold transition-all ${
            subTab === 'absences'
              ? 'bg-white text-amber-900 shadow-sm border border-stone-200/50'
              : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <CalendarX className="w-4 h-4 text-rose-500" />
            <span>Absences ({absences.length})</span>
          </div>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* SUBTAB 1: MEMBERS */}
        {subTab === 'members' && (
          <div className="space-y-4">
            {/* Quick Stats Summary */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50/50 border border-amber-100/65 rounded-2xl p-4">
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800/80">
                  Répartition des tours (Équité)
                </h4>
                <span className="text-[10px] font-mono bg-amber-150/70 text-amber-900 px-2 py-0.5 rounded-full font-semibold">
                  Ajustable
                </span>
              </div>
              <p className="text-xs text-stone-600 mb-4">
                L'algorithme répartit les tours en priorité sur les personnes ayant le moins apporté. Vous pouvez ajuster le score initial pour équilibrer les nouveaux arrivants.
              </p>
              <div className="space-y-2.5">
                {stats.map((colStat) => {
                  const colors = getColors(colStat.color);
                  const totalCountMultiplier = colStat.totalPlanned + colStat.initialAdjust;
                  const coll = colleagues.find((c) => c.id === colStat.colleagueId);
                  const isInactive = coll ? !coll.isActive : false;

                  return (
                    <div key={colStat.colleagueId} className="space-y-1">
                      <div className="flex justify-between text-xs font-medium">
                        <span className={`flex items-center gap-1.5 ${isInactive ? 'text-stone-400 line-through' : 'text-stone-800'}`}>
                          <span className={`w-2 h-2 rounded-full ${colors.text} bg-current`} />
                          {colStat.name}
                        </span>
                        <div className="text-stone-500">
                          <span className="font-semibold text-stone-800 font-mono">{colStat.totalPlanned}</span> planifiés
                          {colStat.initialAdjust > 0 && (
                            <span className="text-[10px] text-amber-700 ml-1">
                              (+{colStat.initialAdjust} réglé)
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="h-1.5 w-full bg-stone-100 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${Math.min(100, Math.max(8, totalCountMultiplier * 15))}%` }}
                          className={`h-full rounded-full bg-linear-to-r ${colors.gradient}`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* List Header & Trigger */}
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-stone-900 text-sm">Liste des Collègues</h3>
              {!showAddMember && (
                <button
                  id="btn-show-add-colleague"
                  onClick={() => setShowAddMember(true)}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl bg-amber-500 text-white shadow-sm hover:bg-amber-600 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Ajouter</span>
                </button>
              )}
            </div>

            {/* Form Add Member */}
            {showAddMember && (
              <form
                id="form-add-colleague"
                onSubmit={handleCreateColleague}
                className="bg-white border border-stone-200 p-4 rounded-2xl shadow-sm space-y-3"
              >
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-stone-800 text-xs">Nouveau collègue</h4>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddMember(false);
                      setMemberError('');
                    }}
                    className="text-stone-400 hover:text-stone-600 text-xs"
                  >
                    Annuler
                  </button>
                </div>

                {memberError && (
                  <div className="text-rose-600 text-xs bg-rose-50 p-2 rounded-lg border border-rose-100 flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{memberError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-semibold text-stone-500 uppercase tracking-wider mb-1">
                    Nom / Prénom
                  </label>
                  <input
                    type="text"
                    required
                    id="input-colleague-name"
                    placeholder="Saisir un prénom..."
                    value={newMemberName}
                    onChange={(e) => setNewMemberName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-sm border border-stone-200 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-stone-500 uppercase tracking-wider mb-2">
                    Couleur d'identification
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {Object.keys(COLOR_MAP).map((colorKey) => {
                      const colors = COLOR_MAP[colorKey];
                      return (
                        <button
                          key={colorKey}
                          type="button"
                          onClick={() => setNewMemberColor(colorKey)}
                          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all border ${
                            newMemberColor === colorKey
                              ? 'border-stone-900 scale-110 shadow-sm ring-4 ring-amber-100'
                              : 'border-transparent hover:scale-105'
                          }`}
                        >
                          <span className={`w-6 h-6 rounded-full bg-linear-to-r ${colors.gradient}`} />
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button
                  type="submit"
                  id="submit-add-colleague"
                  className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors mt-2"
                >
                  Ajouter à l'équipe
                </button>
              </form>
            )}

            {/* Colleagues Card List */}
            {colleagues.length === 0 ? (
              <div className="text-center py-8 bg-stone-50 rounded-2xl border border-stone-100 p-4">
                <UserMinus className="w-8 h-8 mx-auto text-stone-300 mb-2" />
                <p className="text-xs text-stone-500">Aucun collègue enregistré dans l'équipe pour le moment.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {colleagues.map((col) => {
                  const colors = getColors(col.color);
                  const initials = col.name.slice(0, 2).toUpperCase();

                  return (
                    <div
                      key={col.id}
                      className={`p-3 bg-white border rounded-2xl shadow-xs flex items-center justify-between transition-all ${
                        col.isActive ? 'border-stone-150' : 'border-stone-200 bg-stone-50/50 opacity-75'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {/* Custom Avatar */}
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs font-mono border ${colors.background} ${colors.text} ${colors.border}`}>
                          {initials}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`font-semibold text-sm ${col.isActive ? 'text-stone-900' : 'text-stone-400 line-through'}`}>
                              {col.name}
                            </span>
                            {!col.isActive && (
                              <span className="text-[9px] bg-stone-100 text-stone-500 px-1.5 py-0.5 rounded-full font-medium">
                                Inactif
                              </span>
                            )}
                          </div>
                          {/* Ajustement count form */}
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] text-stone-400">Plein départ :</span>
                            <input
                              type="number"
                              min="0"
                              max="20"
                              value={col.initialCount}
                              onChange={(e) =>
                                onUpdateColleague({ ...col, initialCount: Math.max(0, parseInt(e.target.value) || 0) })
                              }
                              className="w-10 text-center text-xs font-mono font-semibold bg-stone-50 border border-stone-200 rounded px-1 py-0.5 text-stone-700 font-mono"
                            />
                            <span className="text-[9px] text-stone-400 italic">(équité)</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Toggle Active status */}
                        <button
                          type="button"
                          onClick={() => onUpdateColleague({ ...col, isActive: !col.isActive })}
                          className={`p-1.5 rounded-xl transition-colors ${
                            col.isActive ? 'text-emerald-600 hover:bg-emerald-50' : 'text-stone-400 hover:bg-stone-100'
                          }`}
                          title={col.isActive ? 'Désactiver' : 'Activer'}
                        >
                          {col.isActive ? (
                            <ToggleRight className="w-5 h-5" />
                          ) : (
                            <ToggleLeft className="w-5 h-5" />
                          )}
                        </button>

                        {/* Delete member */}
                        <button
                          type="button"
                          onClick={() => onDeleteColleague(col.id)}
                          className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* SUBTAB 2: ABSENCES */}
        {subTab === 'absences' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-stone-900 text-sm">Absences Planifiées</h3>
              {!showAddAbsence && (
                <button
                  id="btn-show-add-absence"
                  onClick={() => setShowAddAbsence(true)}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl bg-rose-500 text-white shadow-sm hover:bg-rose-600 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Enregistrer une Absence</span>
                </button>
              )}
            </div>

            {/* Form Add Absence */}
            {showAddAbsence && (
              <form
                id="form-add-absence"
                onSubmit={handleCreateAbsence}
                className="bg-white border-2 border-rose-100 p-4 rounded-2xl shadow-xs space-y-3"
              >
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-rose-900 text-xs">Signaler une absence</h4>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddAbsence(false);
                      setAbsenceError('');
                    }}
                    className="text-stone-400 hover:text-stone-600 text-xs"
                  >
                    Annuler
                  </button>
                </div>

                {absenceError && (
                  <div className="text-rose-600 text-xs bg-rose-50 p-2 rounded-lg border border-rose-100 flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>{absenceError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-semibold text-stone-500 uppercase tracking-wider mb-1">
                    Membre de l'équipe
                  </label>
                  <select
                    id="select-absence-colleague"
                    value={absColleagueId}
                    onChange={(e) => setAbsColleagueId(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl text-sm border border-stone-200 bg-white outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-200"
                  >
                    <option value="">-- Choisir un collègue --</option>
                    {colleagues.filter(c => c.isActive).map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-stone-500 uppercase tracking-wider mb-1">
                      Date de début
                    </label>
                    <input
                      type="date"
                      required
                      id="input-absence-start"
                      value={absStart}
                      onChange={(e) => setAbsStart(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl text-xs border border-stone-200 outline-none focus:border-rose-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-stone-500 uppercase tracking-wider mb-1">
                      Date de fin (Inclus)
                    </label>
                    <input
                      type="date"
                      id="input-absence-end"
                      value={absEnd}
                      placeholder="Identique au début"
                      onChange={(e) => setAbsEnd(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl text-xs border border-stone-200 outline-none focus:border-rose-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-stone-500 uppercase tracking-wider mb-1">
                    Motif (Optionnel)
                  </label>
                  <input
                    type="text"
                    id="input-absence-reason"
                    placeholder="Ex: Vacances, Maladie, Repos..."
                    value={absReason}
                    onChange={(e) => setAbsReason(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-sm border border-stone-200 outline-none focus:border-rose-500"
                  />
                </div>

                <button
                  type="submit"
                  id="submit-add-absence"
                  className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors mt-2"
                >
                  Enregistrer l'Indisponibilité
                </button>
              </form>
            )}

            {/* Absences List */}
            {absences.length === 0 ? (
              <div className="text-center py-8 bg-stone-50 rounded-2xl border border-stone-100 p-4">
                <Calendar className="w-8 h-8 mx-auto text-stone-300 mb-2" />
                <p className="text-xs text-stone-500">Aucune absence n'est actuellement programmée.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {[...absences].sort((a,b) => a.startDate.localeCompare(b.startDate)).map((abs) => {
                  const col = colleagues.find((c) => c.id === abs.colleagueId);
                  if (!col) return null;
                  const colors = getColors(col.color);

                  return (
                    <div
                      key={abs.id}
                      className="p-3 bg-white border border-stone-150 rounded-2xl shadow-xs flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`w-2.5 h-2.5 rounded-full ${colors.background} ${colors.text} border ${colors.border}`} />
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-xs text-stone-900">{col.name}</span>
                            <span className="text-[10px] bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded font-mono">
                              {abs.reason || 'Absent'}
                            </span>
                          </div>
                          <p className="text-[11px] text-stone-500 mt-0.5 flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-stone-400" />
                            {abs.startDate === abs.endDate ? (
                              <span>Le {formatDateFr(abs.startDate)}</span>
                            ) : (
                              <span>
                                Du {formatDateFr(abs.startDate)} au {formatDateFr(abs.endDate)}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => onDeleteAbsence(abs.id)}
                        className="p-1.5 rounded-xl text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition"
                        title="Supprimer l'absence"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
