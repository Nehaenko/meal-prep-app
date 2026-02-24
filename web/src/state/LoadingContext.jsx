import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

const LoadingContext = createContext(null);

export function LoadingProvider({ children }) {
  const counter = useRef(0);
  const [isLoading, setIsLoading] = useState(false);
  const [label, setLabel] = useState("");
  const isLoadingRef = useRef(false);
  const showTimerRef = useRef(null);
  const hideTimerRef = useRef(null);
  const shownAtRef = useRef(0);
  const SHOW_DELAY_MS = 200;
  const MIN_VISIBLE_MS = 200;

  useEffect(() => {
    return () => {
      if (showTimerRef.current) {
        clearTimeout(showTimerRef.current);
        showTimerRef.current = null;
      }
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }
    };
  }, []);

  const setLoadingState = useCallback((next) => {
    isLoadingRef.current = next;
    setIsLoading(next);
    if (!next) setLabel("");
  }, []);

  const start = useCallback(() => {
    counter.current += 1;
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
    if (isLoadingRef.current || showTimerRef.current) return;
    showTimerRef.current = setTimeout(() => {
      showTimerRef.current = null;
      shownAtRef.current = Date.now();
      setLoadingState(true);
    }, SHOW_DELAY_MS);
  }, [setLoadingState]);

  const stop = useCallback(() => {
    counter.current = Math.max(0, counter.current - 1);
    if (counter.current > 0) return;
    if (showTimerRef.current) {
      clearTimeout(showTimerRef.current);
      showTimerRef.current = null;
      return;
    }
    if (!isLoadingRef.current) return;
    const elapsed = Date.now() - shownAtRef.current;
    const remaining = MIN_VISIBLE_MS - elapsed;
    if (remaining > 0) {
      hideTimerRef.current = setTimeout(() => {
        hideTimerRef.current = null;
        setLoadingState(false);
      }, remaining);
      return;
    }
    setLoadingState(false);
  }, [setLoadingState]);

  const withLoading = useCallback(async (promise, nextLabel = "") => {
    if (nextLabel) setLabel(nextLabel);
    start();
    try {
      return await promise;
    } finally {
      stop();
    }
  }, [start, stop]);

  const value = useMemo(
    () => ({ isLoading, label, start, stop, withLoading }),
    [isLoading, label, start, stop, withLoading]
  );
  return (
    <LoadingContext.Provider value={value}>{children}</LoadingContext.Provider>
  );
}

export function useLoading() {
  const context = useContext(LoadingContext);
  if (!context)
    throw new Error("useLoading must be used within LoadingProvider");
  return context;
}
