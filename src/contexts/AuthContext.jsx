import { useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider, isFirebaseConfigured } from '../config/firebase';
import { AuthContext } from './authContextStore';
import { getAuthErrorMessage } from './authErrorMessage';

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
    login: async () => {
      if (!isFirebaseConfigured) {
        throw Object.assign(new Error('O login está temporariamente indisponível.'), {
          code: 'auth/user-facing',
        });
      }
      try {
        return await signInWithPopup(auth, googleProvider);
      } catch (error) {
        throw Object.assign(new Error(getAuthErrorMessage(error)), {
          code: 'auth/user-facing',
        });
      }
    },
    logout: () => signOut(auth),
  }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
