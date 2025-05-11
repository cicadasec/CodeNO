import { useState, useEffect, useCallback } from 'react';

function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  // Initialize state with initialValue on both server and client's first render pass.
  // This ensures the server-rendered HTML matches the client's initial render.
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  // Effect to load from localStorage on client mount, after the first render.
  useEffect(() => {
    // This effect runs only on the client side.
    if (typeof window !== 'undefined') {
      try {
        const item = window.localStorage.getItem(key);
        if (item !== null) { // Check if item actually exists in localStorage
          setStoredValue(JSON.parse(item));
        }
        // If item is not in localStorage, state remains `initialValue`, which is correct.
      } catch (error) {
        console.error(`Error reading localStorage key "${key}" on mount:`, error);
        // Fallback to initialValue if error occurs during parsing or reading.
        // Note: storedValue is already initialValue, so this explicit set might be redundant
        // unless an error corrupts the state, but it's safer.
        setStoredValue(initialValue);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]); // Only re-run if the key changes. initialValue is not needed as a dep for initial load.

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    if (typeof window === 'undefined') {
      console.warn(`Tried to set localStorage key "${key}" on the server. This operation will be ignored.`);
      // Update in-memory state even if window is not defined, so server-side logic relying on this state
      // (if any, though unlikely for localStorage hook) sees the change.
      // However, typical use of this hook is client-side.
      setStoredValue(prev => value instanceof Function ? value(prev) : value);
      return;
    }
    try {
      // Allow value to be a function so we have same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);
  
  // Effect to update state if localStorage changes in another tab/window
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === key) {
        try {
          if (event.newValue !== null) {
            setStoredValue(JSON.parse(event.newValue));
          } else {
            // Item was removed or cleared from localStorage
            setStoredValue(initialValue);
          }
        } catch (error) {
          console.error(`Error parsing localStorage change for key "${key}":`, error);
          setStoredValue(initialValue);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [key, initialValue]); // initialValue is a dependency here, if it changes and storage is cleared, we revert to the new initialValue.

  return [storedValue, setValue];
}

export default useLocalStorage;
