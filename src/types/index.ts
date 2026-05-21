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
}

export interface ComponentPerformanceMetric {
  id: string;
  renderCount: number;
  mountCount: number;
  updateCount: number;
  totalDurationMs: number;
  averageDurationMs: number;
  maxDurationMs: number;
  lastDurationMs: number;
  lastRenderAt: number;
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
