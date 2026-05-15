import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { presenceService } from '../services/presenceService';

interface UserProfile {
  uid: string;
  name: string;
  userName?: string;
  nuit: string;
  address: string;
  phone: string;
  email: string;
  type: 'buyer' | 'supplier' | 'logistics';
  sector: string;
  bio?: string;
  photoURL?: string;
  coverURL?: string;
  city?: string;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  refreshProfile: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;
    let unsubscribePresence: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      // If we HAD a user and NOW we don't, they logged out
      // We should try to set them as offline explicitly
      if (!user && auth.currentUser) {
        try {
          await presenceService.setOffline(auth.currentUser.uid);
        } catch (e) {
          console.warn("Could not set offline on logout:", e);
        }
      }

      setUser(user);
      
      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = null;
      }
      
      if (unsubscribePresence) {
        unsubscribePresence();
        unsubscribePresence = null;
      }

      if (user) {
        // Professional Presence Initialization
        const unsub = presenceService.initializePresence(user.uid);
        if (typeof unsub === 'function') {
          unsubscribePresence = unsub;
        }

        const docPath = `users/${user.uid}`;
        const docRef = doc(db, 'users', user.uid);
        unsubscribeProfile = onSnapshot(docRef, (docSnap) => {
          if (docSnap.exists()) {
            setProfile(docSnap.data() as UserProfile);
          } else {
            setProfile(null);
          }
          setLoading(false);
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, docPath);
          setLoading(false);
        });
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
      if (unsubscribePresence) unsubscribePresence();
    };
  }, []);

  const refreshProfile = async () => {
    if (user) {
      const docPath = `users/${user.uid}`;
      try {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProfile(docSnap.data() as UserProfile);
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, docPath);
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
