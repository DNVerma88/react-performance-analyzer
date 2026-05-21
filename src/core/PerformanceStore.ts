import type {
  ComponentPerformanceMetric,
  PerformanceAnalyzerOptions,
  PerformanceWarning,
} from "../types/index.js";

const DEFAULT_OPTIONS: Required<PerformanceAnalyzerOptions> = {
  enabled: true,
  logToConsole: true,
  slowRenderThresholdMs: 16,
  frequentRenderThreshold: 10,
  largePropsThresholdBytes: 50_000,
  trackPropChanges: true,
  trackFunctionProps: true,
  includeMounts: true,
  includeUpdates: true,
  allowProduction: false,
};

// Module-level store — kept outside React state to avoid triggering renders
const metricsMap = new Map<string, ComponentPerformanceMetric>();
// Throttle warning logs per component+type to avoid console spam
const warnThrottle = new Map<string, number>();
const WARN_THROTTLE_MS = 2_000;

let options: Required<PerformanceAnalyzerOptions> = { ...DEFAULT_OPTIONS };

export function configureStore(opts: PerformanceAnalyzerOptions): void {
  options = { ...DEFAULT_OPTIONS, ...opts };
}

export function getOptions(): Required<PerformanceAnalyzerOptions> {
  return options;
}

export function getOrCreateMetric(id: string): ComponentPerformanceMetric {
  if (!metricsMap.has(id)) {
    metricsMap.set(id, {
      id,
      renderCount: 0,
      mountCount: 0,
      updateCount: 0,
      totalDurationMs: 0,
      averageDurationMs: 0,
      maxDurationMs: 0,
      lastDurationMs: 0,
      lastRenderAt: 0,
      warnings: [],
    });
  }
  return metricsMap.get(id)!;
}

export function recordRender(
  id: string,
  phase: "mount" | "update" | "nested-update",
  durationMs: number
): void {
  const metric = getOrCreateMetric(id);
  metric.renderCount += 1;
  if (phase === "mount") {
    metric.mountCount += 1;
  } else {
    metric.updateCount += 1;
  }
  metric.totalDurationMs += durationMs;
  metric.averageDurationMs = metric.totalDurationMs / metric.renderCount;
  if (durationMs > metric.maxDurationMs) {
    metric.maxDurationMs = durationMs;
  }
  metric.lastDurationMs = durationMs;
  metric.lastRenderAt = performance.now();
}

export function addWarning(warning: PerformanceWarning): void {
  const metric = getOrCreateMetric(warning.componentId);
  const throttleKey = `${warning.componentId}:${warning.type}`;
  const now = performance.now();
  const lastWarn = warnThrottle.get(throttleKey) ?? -Infinity;

  if (now - lastWarn < WARN_THROTTLE_MS) return; // throttle
  warnThrottle.set(throttleKey, now);

  metric.warnings.push(warning);

  if (options.logToConsole) {
    console.warn(`[react-performance-analyzer] ${warning.message}`);
  }
}

export function getAllMetrics(): ComponentPerformanceMetric[] {
  return Array.from(metricsMap.values());
}

export function clearMetrics(): void {
  metricsMap.clear();
  warnThrottle.clear();
}
