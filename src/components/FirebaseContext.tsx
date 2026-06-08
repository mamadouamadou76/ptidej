import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  User, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  getDocFromServer,
  setDoc, 
  updateDoc,
  collection,
  onSnapshot
} from 'firebase/firestore';
import { auth, db, OperationType, handleFirestoreError } from '../utils/firebase';
import { Colleague, Absence, ShiftSettings, ManualOverride } from '../types';

interface UserProfile {
  uid: string;
  displayName: string;
  photoURL?: string;
  activeTeamId?: string;
}

export type UserRole = 'admin' | 'member' | 'viewer';

interface FirebaseContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  connError: boolean;
  isNewUser: boolean;
  activeTeamId: string | null;
  teamName: string | null;
  isSyncing: boolean;
  currentUserRole: UserRole | null;
  
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, displayName: string) => Promise<void>;
  signOutUser: () => Promise<void>;
  
  createTeam: (name: string, initialData: { colleagues: Colleague[], absences: Absence[], settings: ShiftSettings, overrides: ManualOverride }) => Promise<string>;
  joinTeam: (teamId: string) => Promise<void>;
  leaveTeam: () => Promise<void>;
  
  // Directly sync modifications back to DB
  updateSettingsInDB: (settings: ShiftSettings) => Promise<void>;
  updateOverridesInDB: (overrides: ManualOverride) => Promise<void>;
  addColleagueInDB: (col: Colleague) => Promise<void>;
  updateColleagueInDB: (col: Colleague) => Promise<void>;
  deleteColleagueInDB: (colId: string, associatedAbsenceIds: string[]) => Promise<void>;
  addAbsenceInDB: (absence: Absence) => Promise<void>;
  deleteAbsenceInDB: (absenceId: string) => Promise<void>;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

export function FirebaseProvider({ 
  children,
  onSyncColleagues,
  onSyncAbsences,
  onSyncSettings,
  onSyncOverrides
}: { 
  children: React.ReactNode;
  onSyncColleagues: (cols: Colleague[]) => void;
  onSyncAbsences: (abs: Absence[]) => void;
  onSyncSettings: (settings: ShiftSettings) => void;
  onSyncOverrides: (overrides: ManualOverride) => void;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeTeamId, setActiveTeamId] = useState<string | null>(null);
  const [teamName, setTeamName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [connError, setConnError] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState<UserRole | null>(null);
  const [isNewUser, setIsNewUser] = useState(false);

  // 1. Mandatory Core Constraint: test the connection upon boot using doc get from server
  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if (error instanceof Error && error.message.toLowerCase().includes('offline')) {
          console.error("Please check your Firebase configuration or network status.");
          setConnError(true);
        }
      }
    }
    testConnection();
  }, []);

  // 2. Track Firebase Auth users changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await syncUserProfile(currentUser);
      } else {
        setProfile(null);
        setActiveTeamId(null);
        setTeamName(null);
        setLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  // 3. Sync User Profile from firestore database
  const syncUserProfile = async (currentUser: User) => {
    const profilePath = `users/${currentUser.uid}/public/profile`;
    const infoPath = `users/${currentUser.uid}/private/info`;
    
    try {
      const profileDoc = await getDoc(doc(db, profilePath));
      let currentActiveTeam = '';
      
      if (!profileDoc.exists()) {
        // Create full specs on first time registration
        const newProfile: UserProfile = {
          uid: currentUser.uid,
          displayName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Inconnu',
          photoURL: currentUser.photoURL || `https://api.dicebear.com/7.x/identicon/svg?seed=${currentUser.uid}`,
          activeTeamId: ''
        };
        
        await setDoc(doc(db, profilePath), newProfile);
        await setDoc(doc(db, infoPath), {
          email: currentUser.email || '',
          createdAt: new Date().toISOString()
        });
        
        setProfile(newProfile);
        setIsNewUser(true);
      } else {
        const data = profileDoc.data() as UserProfile;
        setProfile(data);
        currentActiveTeam = data.activeTeamId || '';
        setIsNewUser(false);
      }
      
      setActiveTeamId(currentActiveTeam);

      if (currentActiveTeam) {
        try {
          const memberSnap = await getDoc(doc(db, `teams/${currentActiveTeam}/members/${currentUser.uid}`));
          setCurrentUserRole(memberSnap.exists() ? (memberSnap.data().role as UserRole) : null);
        } catch {
          setCurrentUserRole(null);
        }
      } else {
        setCurrentUserRole(null);
      }

      setLoading(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, profilePath);
      setLoading(false);
    }
  };

  // 4. Real-time active team listener
  useEffect(() => {
    if (!user || !activeTeamId) {
      setTeamName(null);
      setIsSyncing(false);
      return;
    }

    setIsSyncing(true);
    const teamRefPath = `teams/${activeTeamId}`;
    
    // Listen for Team Base settings/overrides
    const unsubTeam = onSnapshot(doc(db, teamRefPath), (snap) => {
      if (snap.exists()) {
        const teamData = snap.data();
        setTeamName(teamData.name || '');
        if (teamData.settings) onSyncSettings(teamData.settings);
        if (teamData.overrides) onSyncOverrides(teamData.overrides);
      } else {
        console.warn("Équipe introuvable dans le Cloud.");
        setActiveTeamId(null);
      }
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, teamRefPath);
    });

    // Listen for Colleagues
    const colleaguesCollPath = `teams/${activeTeamId}/colleagues`;
    const unsubColleagues = onSnapshot(collection(db, colleaguesCollPath), (snap) => {
      const list: Colleague[] = [];
      snap.forEach((docSnap) => {
        list.push(docSnap.data() as Colleague);
      });
      onSyncColleagues(list);
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, colleaguesCollPath);
    });

    // Listen for Absences
    const absencesCollPath = `teams/${activeTeamId}/absences`;
    const unsubAbsences = onSnapshot(collection(db, absencesCollPath), (snap) => {
      const list: Absence[] = [];
      snap.forEach((docSnap) => {
        list.push(docSnap.data() as Absence);
      });
      onSyncAbsences(list);
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, absencesCollPath);
    });

    const unsubMember = onSnapshot(
      doc(db, `teams/${activeTeamId}/members/${user.uid}`),
      (snap) => setCurrentUserRole(snap.exists() ? (snap.data().role as UserRole) : null),
      () => setCurrentUserRole(null)
    );

    return () => {
      unsubTeam();
      unsubColleagues();
      unsubAbsences();
      unsubMember();
    };
  }, [user, activeTeamId]);

  // Auth Functions
  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error('Google Sign-In Failed:', err);
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      console.error('Email Sign-In Failed:', err);
      throw err;
    }
  };

  const signUpWithEmail = async (email: string, password: string, displayName: string) => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      // Wait to populate details
      await updateProfile(cred.user, { displayName });
      await syncUserProfile(cred.user);
    } catch (err) {
      console.error('Sign-Up Failed:', err);
      throw err;
    }
  };

  const signOutUser = async () => {
    try {
      await signOut(auth);
      setProfile(null);
      setActiveTeamId(null);
      setTeamName(null);
      setCurrentUserRole(null);
    } catch (err) {
      console.error('Sign-Out Failed:', err);
    }
  };

  // Team Management functions
  const createTeam = async (
    name: string, 
    initialData: { colleagues: Colleague[], absences: Absence[], settings: ShiftSettings, overrides: ManualOverride }
  ) => {
    if (!user) throw new Error("Veuillez vous authentifier d'abord.");
    
    // Generate a beautiful, clean 6 character code
    const generatedTeamId = `team-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const p = `teams/${generatedTeamId}`;
    
    try {
      // 1. Create team doc
      await setDoc(doc(db, p), {
        name,
        ownerId: user.uid,
        settings: initialData.settings,
        overrides: initialData.overrides,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      // 2. Populate colleagues
      for (const col of initialData.colleagues) {
        const colPath = `teams/${generatedTeamId}/colleagues/${col.id}`;
        await setDoc(doc(db, colPath), col);
      }

      // 3. Populate absences
      for (const abs of initialData.absences) {
        const absPath = `teams/${generatedTeamId}/absences/${abs.id}`;
        await setDoc(doc(db, absPath), abs);
      }

      // 4. Link user profile to activeTeamId
      const profilePath = `users/${user.uid}/public/profile`;
      await updateDoc(doc(db, profilePath), {
        activeTeamId: generatedTeamId
      });

      // 5. Register creator as admin member
      await setDoc(doc(db, `teams/${generatedTeamId}/members/${user.uid}`), {
        userId: user.uid,
        displayName: user.displayName || user.email?.split('@')[0] || 'Inconnu',
        email: user.email || '',
        role: 'admin' as UserRole,
        joinedAt: new Date().toISOString()
      });
      setCurrentUserRole('admin');

      setActiveTeamId(generatedTeamId);
      return generatedTeamId;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, p);
    }
  };

  const joinTeam = async (teamId: string) => {
    if (!user) throw new Error("Veuillez vous authentifier d'abord.");
    let normalized = teamId.trim();
    if (!normalized) throw new Error("L'ID d'équipe est invalide.");
    normalized = normalized.replace(/^team-?/i, '').toUpperCase();
    normalized = 'team-' + normalized;
    const formattedId = normalized;
    
    const teamDocPath = `teams/${formattedId}`;

    // Confirm which Firestore instance is used (debug)
    console.log('[joinTeam] db databaseId:', (db as any)._databaseId?.database ?? '(default)');
    console.log('[joinTeam] target doc:', teamDocPath, '| user:', user.uid);

    // 1. Verify team exists
    const docSnap = await getDoc(doc(db, teamDocPath))
      .catch(err => handleFirestoreError(err, OperationType.GET, teamDocPath));
    if (!docSnap.exists()) {
      throw new Error("Équipe inexistante pour cet identifiant.");
    }

    // 2. Link team to user profile
    const profilePath = `users/${user.uid}/public/profile`;
    await updateDoc(doc(db, profilePath), { activeTeamId: formattedId })
      .catch(err => handleFirestoreError(err, OperationType.UPDATE, profilePath));

    // 3. Register as viewer member
    const memberPath = `teams/${formattedId}/members/${user.uid}`;
    await setDoc(doc(db, memberPath), {
      userId: user.uid,
      displayName: user.displayName || user.email?.split('@')[0] || 'Inconnu',
      email: user.email || '',
      role: 'viewer' as UserRole,
      joinedAt: new Date().toISOString()
    }).catch(err => handleFirestoreError(err, OperationType.CREATE, memberPath));

    setCurrentUserRole('viewer');
    setActiveTeamId(formattedId);
  };

  const leaveTeam = async () => {
    if (!user) return;
    const profilePath = `users/${user.uid}/public/profile`;
    try {
      await updateDoc(doc(db, profilePath), {
        activeTeamId: ''
      });
      setActiveTeamId(null);
      setTeamName(null);
      setCurrentUserRole(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, profilePath);
    }
  };

  // Directly sync single actions back to DB
  const updateSettingsInDB = async (settings: ShiftSettings) => {
    if (!activeTeamId) return;
    const path = `teams/${activeTeamId}`;
    try {
      await updateDoc(doc(db, path), {
        settings,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  const updateOverridesInDB = async (overrides: ManualOverride) => {
    if (!activeTeamId) return;
    const path = `teams/${activeTeamId}`;
    try {
      await updateDoc(doc(db, path), {
        overrides,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  const addColleagueInDB = async (col: Colleague) => {
    if (!activeTeamId) return;
    const path = `teams/${activeTeamId}/colleagues/${col.id}`;
    try {
      await setDoc(doc(db, path), col);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  };

  const updateColleagueInDB = async (col: Colleague) => {
    if (!activeTeamId) return;
    const path = `teams/${activeTeamId}/colleagues/${col.id}`;
    try {
      await setDoc(doc(db, path), col);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  const deleteColleagueInDB = async (colId: string, associatedAbsenceIds: string[]) => {
    if (!activeTeamId) return;
    
    // Notice Firestore rules do not protect internal batching from custom server endpoints,
    // so we execute them sequentially or through clear individual calls.
    const colPath = `teams/${activeTeamId}/colleagues/${colId}`;
    try {
      // 1. Delete colleagues
      const { deleteDoc } = await import('firebase/firestore');
      await deleteDoc(doc(db, colPath));
      
      // 2. Clear related instances
      for (const absId of associatedAbsenceIds) {
        const absPath = `teams/${activeTeamId}/absences/${absId}`;
        await deleteDoc(doc(db, absPath));
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, colPath);
    }
  };

  const addAbsenceInDB = async (absence: Absence) => {
    if (!activeTeamId) return;
    const path = `teams/${activeTeamId}/absences/${absence.id}`;
    try {
      await setDoc(doc(db, path), absence);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  };

  const deleteAbsenceInDB = async (absenceId: string) => {
    if (!activeTeamId) return;
    const path = `teams/${activeTeamId}/absences/${absenceId}`;
    try {
      const { deleteDoc } = await import('firebase/firestore');
      await deleteDoc(doc(db, path));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  return (
    <FirebaseContext.Provider value={{
      user,
      profile,
      loading,
      connError,
      isNewUser,
      activeTeamId,
      teamName,
      isSyncing,
      currentUserRole,
      signInWithGoogle,
      signInWithEmail,
      signUpWithEmail,
      signOutUser,
      createTeam,
      joinTeam,
      leaveTeam,
      updateSettingsInDB,
      updateOverridesInDB,
      addColleagueInDB,
      updateColleagueInDB,
      deleteColleagueInDB,
      addAbsenceInDB,
      deleteAbsenceInDB
    }}>
      {children}
    </FirebaseContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(FirebaseContext);
  if (!context) throw new Error('useAuth must be used inside a FirebaseProvider');
  return context;
}
