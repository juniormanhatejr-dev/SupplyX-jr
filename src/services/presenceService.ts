import { ref, onValue, onDisconnect, set, serverTimestamp, goOffline, goOnline } from 'firebase/database';
import { doc, setDoc, serverTimestamp as firestoreTimestamp } from 'firebase/firestore';
import { rtdb, auth, db, handleFirestoreError, OperationType } from '../lib/firebase';

/**
 * Professional Presence Service (Industry Standard with Fallback)
 * Architecture: Realtime Database (RTDB) for socket connection monitoring
 * Fallback: Firestore for persistent "Last Seen" tracking when RTDB rules are denied
 */
export const presenceService = {
  /**
   * Initializes the presence monitoring for the current user
   */
  initializePresence: (userId: string) => {
    if (!userId || !auth.currentUser) {
      console.warn("Presence initialization aborted: No user/auth context");
      return;
    }

    const userStatusDatabaseRef = ref(rtdb, `/status/${userId}`);
    const userProfileDocRef = doc(db, 'users', userId);
    const connectedRef = ref(rtdb, '.info/connected');

    // 1. Initial ONLINE marker in Firestore (Only once at startup)
    const markOnlineFirestore = async () => {
      try {
        console.log(`[Presence DEBUG] Attempting Firestore markOnline for: ${userId}`);
        if (!auth.currentUser || auth.currentUser.uid !== userId) {
          throw new Error(`Auth mismatch: current=${auth.currentUser?.uid}, target=${userId}`);
        }
        await setDoc(userProfileDocRef, {
          status: 'online',
          lastSeen: firestoreTimestamp(),
          updatedAt: firestoreTimestamp()
        }, { merge: true });
        console.log(`[Presence SUCCESS] User ${userId} is now ONLINE in Firestore`);
      } catch (e: any) {
        console.error(`[Presence FAILURE] Firestore setDoc failed for ${userId}:`, e?.message || e);
      }
    };

    const markOfflineFirestore = async () => {
      try {
        console.log(`[Presence] Marking user ${userId} as OFFLINE in Firestore`);
        await setDoc(userProfileDocRef, {
          status: 'offline',
          lastSeen: firestoreTimestamp(),
          updatedAt: firestoreTimestamp()
        }, { merge: true });
      } catch (e) {
        // Ignore
      }
    };

    markOnlineFirestore();

    // 2. RTDB Lifecycle Monitoring (The main presence authoritative source)
    console.log(`[Presence DEBUG] Mounting RTDB listeners for: /status/${userId}`);
    
    const setupRTDB = async () => {
      if (!auth.currentUser) return;

      const unsubscribe = onValue(connectedRef, (snap) => {
        const isConnected = snap.val();
        if (isConnected === false) return;

        onDisconnect(userStatusDatabaseRef)
          .set({
            state: 'offline',
            lastChanged: serverTimestamp(),
          })
          .then(() => {
            return set(userStatusDatabaseRef, {
              state: 'online',
              lastChanged: serverTimestamp(),
            });
          })
          .catch((err) => {
            if (err.message.includes("PERMISSION_DENIED")) {
              // Silently fallback to Firestore-only presence if RTDB is not setup/accessible
              unsubscribe();
            }
          });
      });

      return unsubscribe;
    };

    // 3. Firestore Heartbeat (Fallback for RTDB)
    const heartbeatInterval = setInterval(() => {
      if (auth.currentUser && auth.currentUser.uid === userId) {
        setDoc(userProfileDocRef, {
          status: 'online',
          lastActive: firestoreTimestamp(),
          updatedAt: firestoreTimestamp()
        }, { merge: true }).catch(() => {});
      }
    }, 60000); // Every minute

    let rtdbUnsuscribe: (() => void) | null = null;
    setupRTDB().then(unsub => {
      if (unsub) rtdbUnsuscribe = unsub;
    });

    return () => {
      if (rtdbUnsuscribe) rtdbUnsuscribe();
      clearInterval(heartbeatInterval);
      markOfflineFirestore();
    };
  },

  /**
   * Manual signaling
   */
  setOffline: async (userId: string) => {
    if (!userId) return;
    const userStatusDatabaseRef = ref(rtdb, `/status/${userId}`);
    const userProfileDocRef = doc(db, 'users', userId);
    
    // Attempt both
    try {
      await set(userStatusDatabaseRef, {
        state: 'offline',
        lastChanged: serverTimestamp(),
      });
    } catch(e) {}

    try {
      await setDoc(userProfileDocRef, {
        status: 'offline',
        lastSeen: firestoreTimestamp(),
        updatedAt: firestoreTimestamp()
      }, { merge: true });
    } catch(err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${userId}`);
    }
  },

  goOffline: () => {
    goOffline(rtdb);
  },

  goOnline: () => {
    goOnline(rtdb);
  }
};
