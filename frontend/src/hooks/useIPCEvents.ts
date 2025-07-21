import { useEffect } from 'react';

export function useIPCEvents() {
  useEffect(() => {
    // Check if we're in Electron environment
    if (!window.electronAPI || !window.electronAPI.events) {
      console.warn('Electron API not available, events will not work');
      return;
    }

    // Set up IPC event listeners
    const unsubscribeFunctions: (() => void)[] = [];

    // For now, we don't need any event listeners for this simplified app
    // The frontend can poll for updates when needed

    // Clean up all event listeners when component unmounts
    return () => {
      unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
    };
  }, []);
}