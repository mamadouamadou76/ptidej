import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../utils/firebase';

interface AdminContextType {
  isAdmin: boolean;
  isLoading: boolean;
  adminUser: User | null;
  signOutAdmin: () => Promise<void>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: ReactNode }) {
  const [adminUser, setAdminUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const tokenResult = await user.getIdTokenResult(true);
          console.log('Token claims:', tokenResult.claims);
          console.log('Admin claim:', tokenResult.claims['admin']);
          setIsAdmin(tokenResult.claims['admin'] === true);
        } catch {
          setIsAdmin(false);
        }
        setAdminUser(user);
      } else {
        setIsAdmin(false);
        setAdminUser(null);
      }
      setIsLoading(false);
    });
    return unsubscribe;
  }, []);

  const signOutAdmin = async () => {
    await signOut(auth);
    setAdminUser(null);
    setIsAdmin(false);
  };

  return (
    <AdminContext.Provider value={{ isAdmin, isLoading, adminUser, signOutAdmin }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error('useAdmin must be used inside AdminProvider');
  return ctx;
}
