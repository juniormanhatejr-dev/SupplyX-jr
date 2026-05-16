import { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { doc, onSnapshot } from 'firebase/firestore';
import { rtdb, db, auth } from '../lib/firebase';

export interface PresenceState {
  state: 'online' | 'offline';
  lastChanged: number | any;
}

/**
 * Hook to listen to a specific user's presence status in real-time
 * Uses RTDB with Firestore fallback for persistence
 */
export function usePresence(userId: string | null | undefined) {
  const [presence, setPresence] = useState<PresenceState | null>(null);

  useEffect(() => {
    if (!userId) {
      setPresence(null);
      return;
    }

    const presenceRef = ref(rtdb, `/status/${userId}`);
    const profileRef = doc(db, 'users', userId);
    
    // RTDB Listener (Primary Real-time Source)
    let unsubscribeRTDB: () => void = () => {};
    if (auth.currentUser) {
      unsubscribeRTDB = onValue(presenceRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          setPresence({
            state: data.state,
            lastChanged: data.lastChanged
          });
        }
      }, (error) => {
        if (error.message.includes('permission_denied')) {
          console.debug("RTDB Read restricted for path /status/", userId);
        } else {
          console.debug("RTDB Read fail:", error);
        }
      });
    }

    // Firestore Listener (Persistence Fallback)
    let unsubscribeFirestore: () => void = () => {};
    if (auth.currentUser) {
      unsubscribeFirestore = onSnapshot(profileRef, (docSnap) => {
        if (!docSnap.exists()) return;

        const data = docSnap.data();
        const effectiveStatus = data.status || 'offline';

        setPresence(prev => {
          const lastSeenTime = data.lastSeen?.toMillis ? data.lastSeen.toMillis() : null;
          const lastActiveTime = data.lastActive?.toMillis ? data.lastActive.toMillis() : null;
          const bestTime = lastActiveTime || lastSeenTime;
          
          // Stale check: If online but no activity for 3 minutes, mark as offline
          const isStale = effectiveStatus === 'online' && bestTime && (Date.now() - bestTime > 180000);
          const finalStatus = isStale ? 'offline' : effectiveStatus;

          if (finalStatus === 'online') {
            return { state: 'online', lastChanged: bestTime };
          }
          
          if (prev?.state === 'online' && prev.lastChanged && (Date.now() - prev.lastChanged < 120000)) {
             return prev;
          }
          
          return { state: finalStatus as 'online' | 'offline', lastChanged: bestTime };
        });
      }, (error) => {
        console.debug("Firestore Read fail:", error);
      });
    }

    return () => {
      unsubscribeRTDB();
      unsubscribeFirestore();
    };
  }, [userId]);

  return presence;
}

/**
 * Utility to format the "last seen" text
 */
export function formatLastSeen(timestamp: any, language: 'PT' | 'EN' = 'PT') {
  if (!timestamp) return '';
  
  // Handle Firestore Timestamp objects or regular numbers/dates
  let timeMillis: number;
  if (typeof timestamp?.toMillis === 'function') {
    timeMillis = timestamp.toMillis();
  } else if (timestamp instanceof Date) {
    timeMillis = timestamp.getTime();
  } else if (typeof timestamp === 'number') {
    timeMillis = timestamp;
  } else if (typeof timestamp === 'string') {
    timeMillis = new Date(timestamp).getTime();
  } else {
    // If it's a server timestamp that hasn't resolved yet (null/undefined/object)
    // We return empty to avoid showing a "now" fallback
    return ''; 
  }

  const date = new Date(timeMillis);
  const now = new Date();
  
  // Create normalized date objects for comparison (ignore time)
  const dateStr = date.toLocaleDateString();
  const nowStr = now.toLocaleDateString();
  
  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);
  const yesterdayStr = yesterday.toLocaleDateString();

  const isToday = dateStr === nowStr;
  const isYesterday = dateStr === yesterdayStr;
  
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const timeStr = `${hours}:${minutes}`;
  
  const t = {
    PT: {
      online: 'Online',
      offline: 'Offline',
      today: 'hoje às',
      yesterday: 'ontem às',
      at: 'às',
      lastSeen: 'Visto por último '
    },
    EN: {
      online: 'Online',
      offline: 'Offline',
      today: 'today at',
      yesterday: 'yesterday at',
      at: 'at',
      lastSeen: 'Last seen '
    }
  }[language];

  if (isToday) {
    return `${t.lastSeen}${t.today} ${timeStr}`;
  }
  
  if (isYesterday) {
    return `${t.lastSeen}${t.yesterday} ${timeStr}`;
  }

  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  
  return `${t.lastSeen}${day}/${month}/${year} ${t.at} ${timeStr}`;
}
