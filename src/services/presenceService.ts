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
        console.log(`[Presence] Marking user ${userId} as ONLINE in Firestore`);
        await setDoc(userProfileDocRef, {
          status: 'online'
          // We NO LONGER update lastSeen here to keep it "fixed" until they go offline
        }, { merge: true });
      } catch (e) {
        console.debug("Firestore presence setDoc fail:", e);
      }
    };

    const markOfflineFirestore = async () => {
      try {
        console.log(`[Presence] Marking user ${userId} as OFFLINE in Firestore`);
        await setDoc(userProfileDocRef, {
          status: 'offline',
          lastSeen: firestoreTimestamp() // This is the REAL last seen time
        }, { merge: true });
      } catch (e) {
        // Ignore
      }
    };

    markOnlineFirestore();

    // 2. RTDB Lifecycle Monitoring (The main presence authoritative source)
    const unsubscribe = onValue(connectedRef, (snap) => {
      if (snap.val() === false) return;

      // When connected, set up onDisconnect to flip status to offline with a SERVER FIXED TIMESTAMP
      onDisconnect(userStatusDatabaseRef)
        .set({
          state: 'offline',
          lastChanged: serverTimestamp(),
        })
        .then(() => {
          // Set live status to online
          set(userStatusDatabaseRef, {
            state: 'online',
            lastChanged: serverTimestamp(),
          });
        });
    });

    return () => {
      unsubscribe();
      // Manual cleanup when hook unmounts (e.g. app closing/tab switching)
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
        lastSeen: firestoreTimestamp()
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
