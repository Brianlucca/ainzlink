import { useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider, isFirebaseConfigured } from '../config/firebase';
import { AuthContext } from './authContextStore';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => onAuthStateChanged(auth, (currentUser) => {
    setUser(currentUser);
    setLoading(false);
  }), []);

  const value = useMemo(() => ({
    user,
    loading,
    configured: isFirebaseConfigured,
    login: () => {
      if (!isFirebaseConfigured) {
        throw new Error('Preencha as variaveis VITE_FIREBASE_* no .env.');
      }
      return signInWithPopup(auth, googleProvider);
    },
    logout: () => signOut(auth),
  }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
