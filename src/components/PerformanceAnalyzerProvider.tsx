import {
  createContext,
  useContext,
  useMemo,
  type JSX,
  type ReactNode,
} from "react";
import { configureStore, getOptions } from "../core/PerformanceStore.js";
import { isDevelopment } from "../utils/environment.js";
import type { PerformanceAnalyzerOptions } from "../types/index.js";

interface PerformanceAnalyzerContextValue {
  isEnabled: boolean;
  options: Required<PerformanceAnalyzerOptions>;
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

  // Synchronize options to the module-level store on every render so that
  // dynamic prop changes (e.g. toggling `enabled`) take effect immediately.
  // configureStore only writes to a plain JS object — safe to call during render.
  configureStore({ ...resolvedOpts, enabled: isEnabled });

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
