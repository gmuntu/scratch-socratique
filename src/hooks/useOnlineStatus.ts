import { useEffect, useState } from 'react';
import { onConnectivityChange } from '../services/aiRouter';

/** Hook React reflétant navigator.onLine en temps réel. */
export function useOnlineStatus(): boolean {
  const [online, setOnline] = useState<boolean>(() => navigator.onLine);
  useEffect(() => onConnectivityChange(setOnline), []);
  return online;
}
