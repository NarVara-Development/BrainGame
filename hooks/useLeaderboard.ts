import { useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { useLeaderboardStore } from '@/stores/leaderboardStore';

/** Auto-syncs pending scores whenever connectivity returns. */
export function useLeaderboardSync() {
  const syncPending = useLeaderboardStore((s) => s.syncPending);

  useEffect(() => {
    syncPending();
    const unsubscribe = NetInfo.addEventListener((state) => {
      if (state.isConnected) syncPending();
    });
    return unsubscribe;
  }, [syncPending]);
}

export { useLeaderboardStore };
