/**
 * useNetworkStatus hook
 *
 * Monitors network connectivity state using NetInfo.
 * Returns isConnected and isInternetReachable with automatic subscription cleanup.
 */

import { useState, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';

export function useNetworkStatus(): {
  isConnected: boolean;
  isInternetReachable: boolean | null;
} {
  const [isConnected, setIsConnected] = useState(true);
  const [isInternetReachable, setIsInternetReachable] = useState<boolean | null>(null);

  useEffect(() => {
    // Fetch initial state
    NetInfo.fetch().then(state => {
      setIsConnected(!!state.isConnected);
      setIsInternetReachable(state.isInternetReachable);
    });

    // Subscribe to network state changes
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(!!state.isConnected);
      setIsInternetReachable(state.isInternetReachable);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  return {
    isConnected,
    isInternetReachable,
  };
}
