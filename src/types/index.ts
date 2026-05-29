// Types and Interfaces for react-performance-analyzer

export interface PerformanceAnalyzerOptions {
  enabled?: boolean;
  logToConsole?: boolean;
  slowRenderThresholdMs?: number;
  frequentRenderThreshold?: number;
  largePropsThresholdBytes?: number;
  trackPropChanges?: boolean;
  trackFunctionProps?: boolean;
  includeMounts?: boolean;
  includeUpdates?: boolean;
  allowProduction?: boolean;
  /**
   * Called synchronously whenever a warning is generated.
   * Use this to route warnings to Sentry, Datadog, custom loggers, etc.
   * Errors thrown inside this callback are silently caught so they never
   * crash the profiler.
   */
  onWarning?: (warning: PerformanceWarning) => void;
}

export interface ComponentPerformanceMetric {
  id: string;
  renderCount: number;
  mountCount: number;
  updateCount: number;
  totalDurationMs: number;
  averageDurationMs: number;
  /** Fastest single render observed. Set on the first render. */
  minDurationMs: number;
  maxDurationMs: number;
  lastDurationMs: number;
  lastRenderAt: number;
  /** Circular buffer of the last 10 render durations (oldest → newest). */
  renderHistory: number[];
  /** Prop keys that changed on the most recent re-render (sanitized). */
  lastChangedProps: string[];
  warnings: PerformanceWarning[];
}

export interface PerformanceWarning {
  type: "slow-render" | "frequent-render" | "unstable-prop" | "large-props";
  message: string;
  componentId: string;
  timestamp: number;
}

export interface PerformanceReport {
  generatedAt: number;
  metrics: ComponentPerformanceMetric[];
  totalComponents: number;
  totalRenders: number;
  totalWarnings: number;
}
