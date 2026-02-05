import { useState, useEffect } from 'react';
import { getSavedToken, subscribeToTokenChanges } from '../services/replicateToken';

/**
 * React hook that exposes the current saved runtime token
 * and updates when the token changes (without page reload)
 */
export function useReplicateToken() {
  const [token, setToken] = useState<string | null>(() => getSavedToken());

  useEffect(() => {
    const unsubscribe = subscribeToTokenChanges(() => {
      setToken(getSavedToken());
    });

    return unsubscribe;
  }, []);

  return token;
}
