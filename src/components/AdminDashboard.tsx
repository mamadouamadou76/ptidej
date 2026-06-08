import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  collection, doc, getDoc, getDocs, setDoc,
  query, orderBy, limit, onSnapshot, deleteDoc
} from 'firebase/firestore';
import { db } from '../utils/firebase';
import { useAdmin } from './AdminContext';
import {
  Coffee, Users, Building2, Activity, Search, ChevronLeft, ChevronRight,
  LogOut, Shield, RefreshCw, Trash2, AlertTriangle, X,
  TrendingUp, UserCheck, Calendar, Crown, Eye, ExternalLink, FileText
} from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────────────────

interface UserRecord {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  createdAt: string;
  activeTeamId?: string;
}

interface TeamRecord {
  id: string;
  name: string;
  ownerId: string;
  ownerEmail: string;
  createdAt: string;
  updatedAt?: string;
  colleagueCount: number;
}

interface ActivityItem {
  id: string;
  teamName: string;
  action: string;
  at: string;
}

const PAGE_SIZE = 20;

// ── Sub-components ───────────────────────────────────────────────────────────

function KpiCard({
  label, value, icon: Icon, accent, loading, delay = 0
}: {
  label: string;
  value: number | string;
  icon: React.ElementType;
  accent: string;
  loading: boolean;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35, ease: 'easeOut' }}
      className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex items-center gap-4"
    >
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${accent}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-widest truncate">{label}</p>
        <p className="text-2xl font-black text-white mt-0.5 leading-none">
          {loading
            ? <span className="inline-block w-10 h-6 bg-zinc-800 rounded animate-pulse" />
            : value}
        </p>
      </div>
    </motion.div>
  );
}

function AccessDenied() {
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center justify-center mx-auto">
          <Shield className="w-8 h-8 text-rose-500" />
        </div>
        <h1 className="text-xl font-bold text-white">Accès refusé</h1>
        <p className="text-sm text-zinc-500 max-w-xs mx-auto">
          Cette page est réservée aux super-administrateurs.<br />
          Contactez l'équipe si vous pensez avoir accès.
        </p>
        <a href="/" className="inline-block mt-2 text-xs text-amber-400 hover:text-amber-300 underline">
          Retour à l'application
        </a>
      </div>
    </div>
  );
}

// ── Content CMS Tab ──────────────────────────────────────────────────────────

type CmsFields = {
  hero_title: string;
  hero_subtitle: string;
  hero_quote: string;
  features_title: string;
  features_subtitle: string;
  how_title: string;
  cta_title: string;
};

const CMS_DEFAULTS: CmsFields = {
  hero_title: '',
  hero_subtitle: '',
  hero_quote: '',
  features_title: '',
  features_subtitle: '',
  how_title: '',
  cta_title: '',
};

const CMS_FIELD_CONFIG: { key: keyof CmsFields; label: string; type: 'input' | 'textarea' }[] = [
  { key: 'hero_title',         label: 'Titre principal',                       type: 'input' },
  { key: 'hero_subtitle',      label: 'Sous-titre',                            type: 'textarea' },
  { key: 'hero_quote',         label: 'Citation',                              type: 'input' },
  { key: 'features_title',     label: 'Titre section fonctionnalités',         type: 'input' },
  { key: 'features_subtitle',  label: 'Sous-titre section fonctionnalités',    type: 'textarea' },
  { key: 'how_title',          label: 'Titre section comment ça marche',       type: 'input' },
  { key: 'cta_title',          label: 'Titre section CTA',                     type: 'input' },
];

function ContentTab() {
  const [fields, setFields] = useState<CmsFields>(CMS_DEFAULTS);
  const [cmsLoading, setCmsLoading] = useState(true);
  const [cmsSaving, setCmsSaving] = useState(false);
  const [cmsSaved, setCmsSaved] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'cms', 'landing'));
        if (snap.exists()) {
          setFields(prev => ({ ...prev, ...(snap.data() as Partial<CmsFields>) }));
        }
      } catch (err) {
        console.error('CMS fetch error:', err);
      } finally {
        setCmsLoading(false);
      }
    })();
  }, []);

  const handleSave = async () => {
    setCmsSaving(true);
    setCmsSaved(false);
    try {
      await setDoc(doc(db, 'cms', 'landing'), fields);
      setCmsSaved(true);
      setTimeout(() => setCmsSaved(false), 3000);
    } catch (err) {
      console.error('CMS save error:', err);
    } finally {
      setCmsSaving(false);
    }
  };

  return (
    <motion.div
      key="content"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden"
    >
      <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-amber-400" />
          <h2 className="font-bold text-sm">Contenu de la landing page</h2>
        </div>
        {cmsSaved && (
          <span className="text-xs text-emerald-400 font-semibold">Contenu mis à jour ✓</span>
        )}
      </div>

      {cmsLoading ? (
        <div className="p-6 space-y-4">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="space-y-1.5">
              <div className="h-3 w-32 bg-zinc-800 rounded animate-pulse" />
              <div className="h-10 bg-zinc-800 rounded-xl animate-pulse" />
            </div>
          ))}
        </div>
      ) : (
        <div className="p-6 space-y-5">
          {CMS_FIELD_CONFIG.map(({ key, label, type }) => (
            <div key={key} className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">
                {label}
              </label>
              {type === 'textarea' ? (
                <textarea
                  value={fields[key]}
                  onChange={e => setFields(prev => ({ ...prev, [key]: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 transition-colors resize-none"
                />
              ) : (
                <input
                  type="text"
                  value={fields[key]}
                  onChange={e => setFields(prev => ({ ...prev, [key]: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 transition-colors"
                />
              )}
            </div>
          ))}

          <div className="pt-2">
            <button
              onClick={handleSave}
              disabled={cmsSaving}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition-colors"
            >
              {cmsSaving ? 'Sauvegarde…' : 'Sauvegarder'}
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

export function AdminDashboard() {
  const { isAdmin, isLoading: authLoading, adminUser, signOutAdmin } = useAdmin();

  const [users, setUsers] = useState<UserRecord[]>([]);
  const [teams, setTeams] = useState<TeamRecord[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [tab, setTab] = useState<'overview' | 'users' | 'teams' | 'content'>('overview');
  const [search, setSearch] = useState('');
  const [userPage, setUserPage] = useState(0);
  const [teamPage, setTeamPage] = useState(0);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // ── Data fetching ──────────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Teams
      const teamsSnap = await getDocs(query(collection(db, 'teams'), orderBy('createdAt', 'desc')));

      const teamList: TeamRecord[] = [];
      for (const snap of teamsSnap.docs) {
        const d = snap.data();
        let colleagueCount = 0;
        try {
          const colSnap = await getDocs(collection(db, 'teams', snap.id, 'colleagues'));
          colleagueCount = colSnap.size;
        } catch { /* skip */ }
        teamList.push({
          id: snap.id,
          name: d.name || snap.id,
          ownerId: d.ownerId || '',
          ownerEmail: d.ownerId || '—',
          createdAt: d.createdAt || '',
          updatedAt: d.updatedAt || '',
          colleagueCount,
        });
      }
      setTeams(teamList);

      // Users: public profile for each unique ownerId
      const ownerIds = [...new Set(teamList.map(t => t.ownerId).filter(Boolean))];
      const userList: UserRecord[] = [];
      for (const uid of ownerIds) {
        const profileDoc = await getDoc(doc(db, 'users', uid, 'public', 'profile'));
        const p = profileDoc.exists() ? profileDoc.data() : {};
        userList.push({
          uid,
          displayName: p.displayName || uid,
          email: p.email || '',
          photoURL: p.photoURL,
          createdAt: p.createdAt || '',
          activeTeamId: teamList.find(t => t.ownerId === uid)?.id ?? '',
        });
      }
      setUsers(userList);

    } catch (err) {
      console.error('Admin fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    fetchData();
  }, [isAdmin, fetchData]);

  // Real-time activity feed: last 10 teams by updatedAt
  useEffect(() => {
    if (!isAdmin) return;
    const q = query(collection(db, 'teams'), orderBy('updatedAt', 'desc'), limit(10));
    const unsub = onSnapshot(q, { includeMetadataChanges: true }, (snap) => {
      if (snap.metadata.fromCache) return;
      const items: ActivityItem[] = snap.docs.map(d => ({
        id: d.id,
        teamName: d.data().name || d.id,
        action: 'Mise à jour planning',
        at: d.data().updatedAt || d.data().createdAt || '',
      }));
      setActivity(items);
    }, () => { /* silent fail */ });
    return unsub;
  }, [isAdmin]);

  // ── Derived stats ──────────────────────────────────────────────────────────

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const activeCount = users.filter(u => u.createdAt >= sevenDaysAgo).length;
  const newThisMonth = users.filter(u => u.createdAt >= monthStart).length;

  // ── Filtered / paginated data ──────────────────────────────────────────────

  const filteredUsers = users.filter(u =>
    !search ||
    u.displayName.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );
  const filteredTeams = teams.filter(t =>
    !search ||
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.ownerEmail.toLowerCase().includes(search.toLowerCase())
  );

  const userPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const teamPages = Math.max(1, Math.ceil(filteredTeams.length / PAGE_SIZE));
  const pagedUsers = filteredUsers.slice(userPage * PAGE_SIZE, (userPage + 1) * PAGE_SIZE);
  const pagedTeams = filteredTeams.slice(teamPage * PAGE_SIZE, (teamPage + 1) * PAGE_SIZE);

  // ── Delete team ────────────────────────────────────────────────────────────

  const handleDeleteTeam = async (teamId: string) => {
    try {
      await deleteDoc(doc(db, 'teams', teamId));
      setTeams(prev => prev.filter(t => t.id !== teamId));
      setConfirmDelete(null);
    } catch (err) {
      console.error('Delete team error:', err);
    }
  };

  // ── Format helpers ─────────────────────────────────────────────────────────

  const formatDate = (iso: string) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  };
  const formatRelative = (iso: string) => {
    if (!iso) return '—';
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'À l\'instant';
    if (mins < 60) return `il y a ${mins} min`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `il y a ${hrs}h`;
    return formatDate(iso);
  };

  // ── Guard ─────────────────────────────────────────────────────────────────

  if (authLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAdmin) return <AccessDenied />;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col">

      {/* ── Header ── */}
      <header className="sticky top-0 z-50 bg-zinc-950/90 backdrop-blur border-b border-zinc-800">
        <div className="max-w-screen-xl mx-auto px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <Coffee className="w-4 h-4 text-white fill-white" />
            </div>
            <span className="font-extrabold text-sm tracking-tight">P'tit Déj</span>
            <span className="bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full flex items-center gap-1">
              <Crown className="w-2.5 h-2.5" />
              Super Admin
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-zinc-500 hidden sm:block">{adminUser?.email}</span>
            <button
              onClick={signOutAdmin}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-700 hover:border-zinc-500 text-xs font-medium text-zinc-400 hover:text-white transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
              Déconnexion
            </button>
            <a href="/" className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors">← App</a>
          </div>
        </div>
      </header>

      <div className="max-w-screen-xl mx-auto px-6 py-8 flex-1 w-full space-y-8">

        {/* ── KPI Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard label="Utilisateurs" value={users.length} icon={Users} accent="bg-blue-500" loading={loading} delay={0} />
          <KpiCard label="Équipes créées" value={teams.length} icon={Building2} accent="bg-amber-500" loading={loading} delay={0.05} />
          <KpiCard label="Actifs 7 jours" value={activeCount} icon={UserCheck} accent="bg-emerald-500" loading={loading} delay={0.1} />
          <KpiCard label="Inscrits ce mois" value={newThisMonth} icon={TrendingUp} accent="bg-violet-500" loading={loading} delay={0.15} />
        </div>

        {/* ── Tabs ── */}
        <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-xl p-1 w-fit flex-wrap">
          {(['overview', 'users', 'teams', 'content'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                tab === t
                  ? 'bg-white text-zinc-900'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {t === 'overview' ? "Vue d'ensemble" : t === 'users' ? 'Utilisateurs' : t === 'teams' ? 'Équipes' : 'Contenu'}
            </button>
          ))}
        </div>

        {/* ── Search bar (shared for users/teams tabs) ── */}
        {tab !== 'overview' && tab !== 'content' && (
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
            <input
              type="text"
              placeholder={tab === 'users' ? 'Chercher un utilisateur…' : 'Chercher une équipe…'}
              value={search}
              onChange={e => { setSearch(e.target.value); setUserPage(0); setTeamPage(0); }}
              className="w-full pl-9 pr-4 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 transition-colors"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-300">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        <AnimatePresence mode="wait">

          {/* ── OVERVIEW tab ── */}
          {tab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid lg:grid-cols-3 gap-6"
            >
              {/* Recent teams (quick list) */}
              <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
                  <h2 className="font-bold text-sm">Équipes récentes</h2>
                  <button onClick={() => setTab('teams')} className="text-[10px] text-zinc-500 hover:text-amber-400 transition-colors">
                    Voir tout →
                  </button>
                </div>
                {loading ? (
                  <div className="p-6 space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-10 bg-zinc-800 rounded-lg animate-pulse" />
                    ))}
                  </div>
                ) : teams.length === 0 ? (
                  <div className="p-8 text-center text-zinc-600 text-sm">Aucune équipe</div>
                ) : (
                  <table className="w-full">
                    <tbody>
                      {teams.slice(0, 8).map((team, i) => (
                        <motion.tr
                          key={team.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.04 }}
                          className="border-b border-zinc-800 last:border-0 hover:bg-zinc-800/50 transition-colors"
                        >
                          <td className="px-5 py-3">
                            <p className="text-sm font-semibold">{team.name}</p>
                            <p className="text-xs text-zinc-500">{team.ownerEmail}</p>
                          </td>
                          <td className="px-5 py-3 text-right">
                            <span className="text-xs text-zinc-500">{team.colleagueCount} collègues</span>
                          </td>
                          <td className="px-5 py-3 text-right">
                            <span className="text-xs text-zinc-600">{formatDate(team.createdAt)}</span>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Activity log */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-zinc-800 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <h2 className="font-bold text-sm">Activité récente</h2>
                </div>
                <div className="p-4 space-y-2">
                  {activity.length === 0 ? (
                    <p className="text-xs text-zinc-600 text-center py-4">Aucune activité</p>
                  ) : activity.map(item => (
                    <div key={item.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-zinc-800 transition-colors">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-medium truncate">{item.teamName}</p>
                        <p className="text-[10px] text-zinc-600">{item.action} · {formatRelative(item.at)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* ── USERS tab ── */}
          {tab === 'users' && (
            <motion.div
              key="users"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden"
            >
              <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
                <h2 className="font-bold text-sm">{filteredUsers.length} utilisateur{filteredUsers.length !== 1 ? 's' : ''}</h2>
                <button
                  onClick={fetchData}
                  className="p-1.5 rounded-lg border border-zinc-700 hover:border-zinc-500 text-zinc-500 hover:text-white transition-all"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>

              {loading ? (
                <div className="p-6 space-y-3">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="h-12 bg-zinc-800 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : pagedUsers.length === 0 ? (
                <div className="p-8 text-center text-zinc-600 text-sm">Aucun utilisateur trouvé</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-zinc-800 bg-zinc-950/50">
                        <th className="px-5 py-3 text-left text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Utilisateur</th>
                        <th className="px-5 py-3 text-left text-[10px] font-bold text-zinc-500 uppercase tracking-widest hidden md:table-cell">UID</th>
                        <th className="px-5 py-3 text-left text-[10px] font-bold text-zinc-500 uppercase tracking-widest hidden lg:table-cell">Inscription</th>
                        <th className="px-5 py-3 text-left text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Équipe</th>
                        <th className="px-5 py-3 text-right text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagedUsers.map((user, i) => (
                        <motion.tr
                          key={user.uid}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: i * 0.03 }}
                          className="border-b border-zinc-800 last:border-0 hover:bg-zinc-800/40 transition-colors"
                        >
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <img
                                src={user.photoURL || `https://api.dicebear.com/7.x/identicon/svg?seed=${user.uid}`}
                                alt=""
                                className="w-8 h-8 rounded-lg flex-shrink-0 bg-zinc-800"
                              />
                              <div className="min-w-0">
                                <p className="text-sm font-semibold truncate">{user.displayName}</p>
                                <p className="text-xs text-zinc-500 truncate">{user.email || '—'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3 hidden md:table-cell">
                            <span className="text-xs font-mono text-zinc-600">{user.uid.slice(0, 12)}…</span>
                          </td>
                          <td className="px-5 py-3 hidden lg:table-cell">
                            <span className="text-xs text-zinc-500">{formatDate(user.createdAt)}</span>
                          </td>
                          <td className="px-5 py-3">
                            {user.activeTeamId ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded-full">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                Actif
                              </span>
                            ) : (
                              <span className="text-xs text-zinc-600">Sans équipe</span>
                            )}
                          </td>
                          <td className="px-5 py-3 text-right">
                            <button
                              onClick={() => {
                                const url = `https://console.firebase.google.com/u/0/project/_/authentication/users?search=${encodeURIComponent(user.email)}`;
                                window.open(url, '_blank');
                              }}
                              className="p-1.5 rounded-lg border border-zinc-700 hover:border-zinc-500 text-zinc-500 hover:text-white transition-all"
                              title="Voir dans Firebase Console"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination */}
              {userPages > 1 && (
                <div className="px-5 py-3 border-t border-zinc-800 flex items-center justify-between">
                  <span className="text-xs text-zinc-600">
                    Page {userPage + 1} / {userPages}
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setUserPage(p => Math.max(0, p - 1))}
                      disabled={userPage === 0}
                      className="p-1.5 rounded-lg border border-zinc-700 hover:border-zinc-500 text-zinc-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setUserPage(p => Math.min(userPages - 1, p + 1))}
                      disabled={userPage >= userPages - 1}
                      className="p-1.5 rounded-lg border border-zinc-700 hover:border-zinc-500 text-zinc-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* ── TEAMS tab ── */}
          {tab === 'teams' && (
            <motion.div
              key="teams"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden"
            >
              <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
                <h2 className="font-bold text-sm">{filteredTeams.length} équipe{filteredTeams.length !== 1 ? 's' : ''}</h2>
                <button
                  onClick={fetchData}
                  className="p-1.5 rounded-lg border border-zinc-700 hover:border-zinc-500 text-zinc-500 hover:text-white transition-all"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>

              {loading ? (
                <div className="p-6 space-y-3">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-14 bg-zinc-800 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : pagedTeams.length === 0 ? (
                <div className="p-8 text-center text-zinc-600 text-sm">Aucune équipe trouvée</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-zinc-800 bg-zinc-950/50">
                        <th className="px-5 py-3 text-left text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Équipe</th>
                        <th className="px-5 py-3 text-left text-[10px] font-bold text-zinc-500 uppercase tracking-widest hidden md:table-cell">Propriétaire</th>
                        <th className="px-5 py-3 text-left text-[10px] font-bold text-zinc-500 uppercase tracking-widest hidden sm:table-cell">Collègues</th>
                        <th className="px-5 py-3 text-left text-[10px] font-bold text-zinc-500 uppercase tracking-widest hidden lg:table-cell">Création</th>
                        <th className="px-5 py-3 text-right text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagedTeams.map((team, i) => (
                        <motion.tr
                          key={team.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: i * 0.03 }}
                          className="border-b border-zinc-800 last:border-0 hover:bg-zinc-800/40 transition-colors"
                        >
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Building2 className="w-4 h-4 text-amber-400" />
                              </div>
                              <div>
                                <p className="text-sm font-semibold">{team.name}</p>
                                <p className="text-[10px] font-mono text-zinc-600">{team.id}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3 hidden md:table-cell">
                            <span className="text-xs text-zinc-400">{team.ownerEmail}</span>
                          </td>
                          <td className="px-5 py-3 hidden sm:table-cell">
                            <span className="text-xs text-zinc-400">{team.colleagueCount}</span>
                          </td>
                          <td className="px-5 py-3 hidden lg:table-cell">
                            <span className="text-xs text-zinc-500">{formatDate(team.createdAt)}</span>
                          </td>
                          <td className="px-5 py-3 text-right">
                            {confirmDelete === team.id ? (
                              <div className="flex items-center justify-end gap-1">
                                <span className="text-[10px] text-rose-400 mr-1">Confirmer ?</span>
                                <button
                                  onClick={() => handleDeleteTeam(team.id)}
                                  className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold rounded-lg transition-colors"
                                >
                                  Oui
                                </button>
                                <button
                                  onClick={() => setConfirmDelete(null)}
                                  className="px-2.5 py-1 bg-zinc-700 hover:bg-zinc-600 text-white text-[10px] font-bold rounded-lg transition-colors"
                                >
                                  Non
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setConfirmDelete(team.id)}
                                className="p-1.5 rounded-lg border border-zinc-700 hover:border-rose-500 text-zinc-500 hover:text-rose-400 transition-all"
                                title="Supprimer l'équipe"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination */}
              {teamPages > 1 && (
                <div className="px-5 py-3 border-t border-zinc-800 flex items-center justify-between">
                  <span className="text-xs text-zinc-600">
                    Page {teamPage + 1} / {teamPages}
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setTeamPage(p => Math.max(0, p - 1))}
                      disabled={teamPage === 0}
                      className="p-1.5 rounded-lg border border-zinc-700 hover:border-zinc-500 text-zinc-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setTeamPage(p => Math.min(teamPages - 1, p + 1))}
                      disabled={teamPage >= teamPages - 1}
                      className="p-1.5 rounded-lg border border-zinc-700 hover:border-zinc-500 text-zinc-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* ── CONTENT tab ── */}
          {tab === 'content' && <ContentTab />}

        </AnimatePresence>
      </div>
    </div>
  );
}
