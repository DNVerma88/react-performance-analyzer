import {
  createContext,
  useContext,
  useLayoutEffect,
  useMemo,
  type JSX,
  type ReactNode,
} from "react";
import { configureStore, getOptions } from "../core/PerformanceStore.js";
import { isDevelopment } from "../utils/environment.js";
import type { PerformanceAnalyzerOptions } from "../types/index.js";

interface PerformanceAnalyzerContextValue {
  isEnabled: boolean;
  options: ReturnType<typeof getOptions>;
}

const PerformanceAnalyzerContext =
  createContext<PerformanceAnalyzerContextValue>({
    isEnabled: false,
    options: getOptions(),
  });

export function usePerformanceAnalyzerContext(): PerformanceAnalyzerContextValue {
  return useContext(PerformanceAnalyzerContext);
}

interface PerformanceAnalyzerProviderProps extends PerformanceAnalyzerOptions {
  children: ReactNode;
}

export function PerformanceAnalyzerProvider({
  children,
  ...opts
}: PerformanceAnalyzerProviderProps): JSX.Element {
  const resolvedOpts: PerformanceAnalyzerOptions = opts;

  const isEnabled =
    (resolvedOpts.allowProduction ? true : isDevelopment()) &&
    (resolvedOpts.enabled !== false);

  // Synchronize options to the module-level store after each commit.
  // Using useLayoutEffect avoids writing to shared state during React's render
  // phase, which prevents race conditions in Concurrent Mode (VULN-04).
  useLayoutEffect(() => {
    configureStore({ ...resolvedOpts, enabled: isEnabled });
  });

  const contextValue = useMemo<PerformanceAnalyzerContextValue>(
    () => ({ isEnabled, options: getOptions() }),
    [isEnabled]
  );

  return (
    <PerformanceAnalyzerContext.Provider value={contextValue}>
      {children}
    </PerformanceAnalyzerContext.Provider>
  );
}
