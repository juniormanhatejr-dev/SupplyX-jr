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
  license?: string;
  phone: string;
  email: string;
  role?: 'user' | 'moderator' | 'admin' | 'superadmin';
  emailVerified: boolean;
  type: 'buyer' | 'supplier' | 'logistics';
  userType?: string;
  nuitStatus?: 'pending' | 'verified' | 'rejected';
  verificationStatus?: 'pending' | 'verified' | 'rejected';
  sector: string;
  bio?: string;
  photoURL?: string;
  coverURL?: string;
  city?: string;
  createdAt: string;
  bankAccounts?: { bankName: string; accountNumber: string; nib: string }[];
  mobileWallets?: { provider: string; number: string; name: string }[];
  signatureURL?: string;
  stampURL?: string;
  fleetSize?: string | number;
  specialization?: string;
  companyName?: string;
  id?: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  isAdmin: boolean;
  loading: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  isAdmin: false,
  loading: true,
  refreshProfile: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;
    let unsubscribePresence: (() => void) | null = null;
    let unsubscribeAdmin: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      setUser(user);
      
      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = null;
      }
      
      if (unsubscribePresence) {
        unsubscribePresence();
        unsubscribePresence = null;
      }

      if (unsubscribeAdmin) {
        unsubscribeAdmin();
        unsubscribeAdmin = null;
      }

      if (user) {
        const docPath = `users/${user.uid}`;
        const docRef = doc(db, 'users', user.uid);
        
        // Check Admin Role
        const adminRef = doc(db, 'admins', user.uid);
        unsubscribeAdmin = onSnapshot(adminRef, (docSnap) => {
          setIsAdmin(docSnap.exists());
        }, (error) => {
          console.debug("Admin check restricted or failed:", error.message);
          setIsAdmin(false);
        });

        unsubscribeProfile = onSnapshot(docRef, async (docSnap) => {
          if (docSnap.exists()) {
            const profileData = docSnap.data() as UserProfile;
            
            // Sync emailVerified with Firestore
            if (user.emailVerified && !profileData.emailVerified) {
              try {
                await setDoc(docRef, { emailVerified: true }, { merge: true });
              } catch (e) {
                console.error("Failed to sync emailVerified to firestore:", e);
              }
            }

            setProfile({ 
              ...profileData, 
              emailVerified: user.emailVerified || profileData.emailVerified || false 
            });

            // Presence Initialization - ONLY if profile exists
            if (!unsubscribePresence) {
              const unsub = presenceService.initializePresence(user.uid);
              if (typeof unsub === 'function') {
                unsubscribePresence = unsub;
              }
            }
          } else {
            setProfile(null);
            // If profile is deleted/non-existent, stop presence monitoring
            if (unsubscribePresence) {
              unsubscribePresence();
              unsubscribePresence = null;
            }
          }
          setLoading(false);
        }, (error) => {
          console.error("[AuthContext] Profile subscription failed:", error.message || error);
          setProfile(null);
          setLoading(false);
        });
      } else {
        setProfile(null);
        setIsAdmin(false);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
      if (unsubscribePresence) unsubscribePresence();
      if (unsubscribeAdmin) unsubscribeAdmin();
    };
  }, []);

  const refreshProfile = async () => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      const docPath = `users/${currentUser.uid}`;
      try {
        try {
          await currentUser.reload();
          setUser(auth.currentUser);
        } catch (reloadErr: any) {
          console.warn('[AuthContext] Client-side currentUser.reload() failed in refreshProfile:', reloadErr.message || reloadErr);
        }

        const docRef = doc(db, 'users', currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const profileData = docSnap.data();
          const liveUser = auth.currentUser;
          if (liveUser?.emailVerified && !profileData.emailVerified) {
            await setDoc(docRef, { emailVerified: true }, { merge: true });
            profileData.emailVerified = true;
          }
          setProfile({ 
            ...profileData, 
            emailVerified: liveUser?.emailVerified || profileData.emailVerified || false
          } as UserProfile);
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, docPath);
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, isAdmin, loading, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
