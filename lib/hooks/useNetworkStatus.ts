/**
 * useNetworkStatus hook
 *
 * Monitors network connectivity state using NetInfo.
 * Returns isConnected and isInternetReachable with automatic subscription cleanup.
 */

import { useState, useEffect, useRef } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { processQueue } from '@/lib/services/analytics';

export function useNetworkStatus(): {
  isConnected: boolean;
  isInternetReachable: boolean | null;
} {
  const [isConnected, setIsConnected] = useState(true);
  const [isInternetReachable, setIsInternetReachable] = useState<boolean | null>(null);
  const wasConnected = useRef(true);

  useEffect(() => {
    // Fetch initial state
    NetInfo.fetch().then(state => {
      const connected = !!state.isConnected;
      setIsConnected(connected);
      setIsInternetReachable(state.isInternetReachable);
      wasConnected.current = connected;
    });

    // Subscribe to network state changes
    const unsubscribe = NetInfo.addEventListener(state => {
      const connected = !!state.isConnected;
      setIsConnected(connected);
      setIsInternetReachable(state.isInternetReachable);

      // Process analytics queue when reconnecting
      if (connected && !wasConnected.current) {
        processQueue();
      }
      wasConnected.current = connected;
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  return {
    isConnected,
    isInternetReachable,
  };
}
