import React, { useState } from 'react';
import { useAuth } from './FirebaseContext';
import { PlusCircle, Link, Users, LogOut, ArrowRight, Clipboard, Check, RefreshCw, Coffee } from 'lucide-react';
import { Colleague, Absence, ShiftSettings, ManualOverride } from '../types';

interface TeamMgmtViewProps {
  localColleagues: Colleague[];
  localAbsences: Absence[];
  localSettings: ShiftSettings;
  localOverrides: ManualOverride;
}

export function TeamMgmtView({ localColleagues, localAbsences, localSettings, localOverrides }: TeamMgmtViewProps) {
  const { createTeam, joinTeam, signOutUser, profile } = useAuth();
  
  const [teamName, setTeamName] = useState('');
  const [teamCode, setTeamCode] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim()) return;
    
    setLoading(true);
    setError(null);
    try {
      // Export current sandbox configuration smoothly to cloud!
      await createTeam(teamName, {
        colleagues: localColleagues,
        absences: localAbsences,
        settings: localSettings,
        overrides: localOverrides
      });
    } catch (err: any) {
      setError(err.message || "Erreur lors de la création de l'équipe.");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamCode.trim()) return;
    
    setLoading(true);
    setError(null);
    try {
      await joinTeam(teamCode);
    } catch (err: any) {
      setError(err.message || "Erreur lors du raccordement au groupe.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-center items-center px-4 py-8 overflow-y-auto bg-[#FDFBF7]">
      <div className="w-full max-w-md bg-white rounded-3xl border border-stone-200/80 p-6 md:p-8 shadow-xl space-y-6 relative">
        
        {/* Profile info header */}
        <div className="border-b border-stone-100 pb-5 flex justify-between items-center select-none">
          <div className="flex items-center gap-2.5">
            <img 
              src={profile?.photoURL || `https://api.dicebear.com/7.x/identicon/svg?seed=${profile?.uid}`}
              alt="Avatar" 
              className="w-8.5 h-8.5 rounded-full border border-stone-200 shadow-xs"
              referrerPolicy="no-referrer"
            />
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider font-mono text-stone-400">Connecté en tant que</p>
              <h3 className="text-xs.5 font-bold text-stone-800 leading-tight">{profile?.displayName}</h3>
            </div>
          </div>
          <button
            onClick={() => signOutUser()}
            className="text-stone-400 hover:text-stone-700 flex items-center gap-1 text-[11px] font-bold font-mono py-1 px-1.5 rounded transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Déconnexion</span>
          </button>
        </div>

        {/* Info label */}
        <div className="text-center space-y-1">
          <h2 className="text-sm.5 font-extrabold text-stone-900 tracking-tight flex items-center justify-center gap-2">
            <Users className="w-4.5 h-4.5 text-amber-600" />
            <span>Configurer votre Équipe</span>
          </h2>
          <p className="text-xs leading-relaxed text-stone-500 max-w-[325px] mx-auto">
            Pour commencer à planifier à plusieurs, créez un espace ou rejoignez l'espace autonome de votre équipe !
          </p>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-100 p-3 rounded-xl text-xs text-rose-800 leading-relaxed font-semibold">
            {error}
          </div>
        )}

        {/* Wizard choices */}
        <div className="space-y-4 pt-1">
          {/* Card 1: Create team */}
          <div className="p-4 bg-stone-50 border border-stone-200 rounded-2xl flex flex-col gap-3">
            <div>
              <h4 className="text-xs font-extrabold text-stone-800 flex items-center gap-1.5">
                <PlusCircle className="w-4 h-4 text-amber-600" />
                <span>Créer une nouvelle équipe</span>
              </h4>
              <p className="text-[11px] text-stone-500 mt-0.5 leading-normal">
                Donne un nom à ton équipe. Vos collègues et absences locaux seront automatiquement sauvegardés sur le Cloud.
              </p>
            </div>
            
            <form onSubmit={handleCreateTeam} className="flex gap-2">
              <input
                type="text"
                required
                disabled={loading}
                placeholder="Ex: Équipe A - Matin"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                className="flex-1 px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-1.5 focus:ring-amber-500 transition-all font-sans font-medium"
              />
              <button
                type="submit"
                disabled={loading || !teamName.trim()}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-3 py-2 rounded-xl text-xs transition-colors flex items-center gap-1 disabled:opacity-50 select-none"
              >
                {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ArrowRight className="w-3.5 h-3.5" />}
              </button>
            </form>
          </div>

          {/* Card 2: Join Team */}
          <div className="p-4 bg-stone-50 border border-stone-200 rounded-2xl flex flex-col gap-3">
            <div>
              <h4 className="text-xs font-extrabold text-stone-800 flex items-center gap-1.5">
                <Link className="w-4 h-4 text-amber-600" />
                <span>Rejoindre une équipe existante</span>
              </h4>
              <p className="text-[11px] text-stone-500 mt-0.5 leading-normal">
                Saisissez l'identifiant (Code Équipe) communiqué par vos équipiers pour synchroniser le calendrier.
              </p>
            </div>
            
            <form onSubmit={handleJoinTeam} className="flex gap-2">
              <input
                type="text"
                required
                disabled={loading}
                placeholder="Codes format: team-XXXXXX"
                value={teamCode}
                onChange={(e) => setTeamCode(e.target.value)}
                className="flex-1 px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-1.5 focus:ring-amber-500 uppercase transition-all font-sans font-medium"
              />
              <button
                type="submit"
                disabled={loading || !teamCode.trim()}
                className="bg-stone-900 hover:bg-stone-800 text-white font-bold px-3 py-2 rounded-xl text-xs transition-colors flex items-center gap-1 disabled:opacity-50 select-none"
              >
                {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <span>Rejoindre</span>}
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
