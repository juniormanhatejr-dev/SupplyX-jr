import React from 'react';
import { usePresence, formatLastSeen } from '../hooks/usePresence';
import { auth } from '../lib/firebase';

interface UserPresenceIndicatorProps {
  userId: string | null | undefined;
  language?: 'PT' | 'EN';
  showLastSeen?: boolean;
  className?: string;
  onlineClassName?: string;
  offlineClassName?: string;
}

/**
 * Professional Real-time Presence Indicator
 */
export default function UserPresenceIndicator({ 
  userId, 
  language = 'PT', 
  showLastSeen = true,
  className = "text-[11px] font-black uppercase tracking-widest",
  onlineClassName = "text-emerald-500",
  offlineClassName = "text-zinc-500"
}: UserPresenceIndicatorProps) {
  const presence = usePresence(userId);
  const isMe = auth.currentUser?.uid === userId;

  if (!userId) return null;

  // If it's the current user, they are "Online" by definition of being in the app
  const isOnline = isMe || presence?.state === 'online';

  if (!presence && !isMe) {
    return <div className={`h-3 w-8 bg-zinc-100 dark:bg-zinc-800 animate-pulse rounded ${className}`} />;
  }

  if (isOnline) {
    return (
      <div className="flex items-center gap-1.5">
        <div className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </div>
        <p className={`${className} ${onlineClassName}`}>
          {language === 'PT' ? 'Online' : 'Online'}
        </p>
      </div>
    );
  }

  return (
    <p className={`${className} ${offlineClassName}`}>
      {showLastSeen 
        ? formatLastSeen(presence?.lastChanged, language) 
        : (language === 'PT' ? 'Offline' : 'Offline')}
    </p>
  );
}
