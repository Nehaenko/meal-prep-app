import { createContext, useContext, useMemo, useRef, useState } from "react";

const LoadingContext = createContext(null);

export function LoadingProvider({ children }) {
  const counter = useRef(0);
  const [isLoading, setIsLoading] = useState(false);

  const start = () => {
    counter.current += 1;
    if (!isLoading) setIsLoading(true);
  };
  const stop = () => {
    counter.current = Math.max(0, counter.current - 1);
    if (counter.current === 0) setIsLoading(false);
  };

  const withLoading = async (promise) => {
    start();
    try {
      return await promise;
    } finally {
      stop();
    }
  };

  const value = useMemo(
    () => ({ isLoading, start, stop, withLoading }),
    [isLoading]
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
