import type {
  ComponentPerformanceMetric,
  PerformanceAnalyzerOptions,
  PerformanceWarning,
} from "../types/index.js";
import { isDevelopment } from "../utils/environment.js";

/**
 * Internal resolved options: all fields required except the optional callback.
 * Using Omit+Pick keeps `onWarning` optional so `DEFAULT_OPTIONS` can omit it.
 */
type StoreOptions = Omit<Required<PerformanceAnalyzerOptions>, "onWarning"> &
  Pick<PerformanceAnalyzerOptions, "onWarning">;

const DEFAULT_OPTIONS: StoreOptions = {
  enabled: true,
  logToConsole: false, // default off — avoids leaking component names to production console
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

// Safety caps to prevent unbounded memory growth (VULN-03)
const MAX_TRACKED_COMPONENTS = 500;
const MAX_WARNINGS_PER_COMPONENT = 100;
/** Max entries in each component's render duration ring buffer. */
const RENDER_HISTORY_LIMIT = 10;

// Subscriber set used by useSyncExternalStore (useRenderCount hook)
const subscribers = new Set<() => void>();

function notifySubscribers(): void {
  for (const listener of subscribers) listener();
}

let options: StoreOptions = { ...DEFAULT_OPTIONS };

export function configureStore(opts: PerformanceAnalyzerOptions): void {
  options = {
    ...DEFAULT_OPTIONS,
    ...opts,
    // Clamp numeric thresholds to sensible minimums to prevent threshold abuse (VULN-07)
    slowRenderThresholdMs: Math.max(
      1,
      opts.slowRenderThresholdMs ?? DEFAULT_OPTIONS.slowRenderThresholdMs
    ),
    frequentRenderThreshold: Math.max(
      1,
      opts.frequentRenderThreshold ?? DEFAULT_OPTIONS.frequentRenderThreshold
    ),
    largePropsThresholdBytes: Math.max(
      1024,
      opts.largePropsThresholdBytes ?? DEFAULT_OPTIONS.largePropsThresholdBytes
    ),
  };
}

export function getOptions(): StoreOptions {
  // Return a shallow copy so callers cannot mutate internal store state directly
  return { ...options };
}

function createEmptyMetric(id: string): ComponentPerformanceMetric {
  return {
    id,
    renderCount: 0,
    mountCount: 0,
    updateCount: 0,
    totalDurationMs: 0,
    averageDurationMs: 0,
    minDurationMs: 0,
    maxDurationMs: 0,
    lastDurationMs: 0,
    lastRenderAt: 0,
    renderHistory: [],
    lastChangedProps: [],
    warnings: [],
  };
}

export function getOrCreateMetric(id: string): ComponentPerformanceMetric {
  if (!metricsMap.has(id)) {
    // Cap total tracked components to prevent unbounded map growth (VULN-03)
    if (metricsMap.size >= MAX_TRACKED_COMPONENTS) {
      // Return a transient metric — data is not persisted to the store
      return createEmptyMetric(id);
    }
    metricsMap.set(id, createEmptyMetric(id));
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
  // Track minimum: initialise on first render, then only update when lower
  if (metric.renderCount === 1 || durationMs < metric.minDurationMs) {
    metric.minDurationMs = durationMs;
  }
  // Circular render-duration buffer — capped at RENDER_HISTORY_LIMIT entries
  metric.renderHistory.push(durationMs);
  if (metric.renderHistory.length > RENDER_HISTORY_LIMIT) {
    metric.renderHistory.shift();
  }
  metric.lastDurationMs = durationMs;
  metric.lastRenderAt = performance.now();
  // Notify useSyncExternalStore subscribers (zero cost when hook is unused)
  if (subscribers.size > 0) notifySubscribers();
}

export function addWarning(warning: PerformanceWarning): void {
  // Skip warnings for overflow (untracked) components to avoid polluting warnThrottle (VULN-03)
  if (!metricsMap.has(warning.componentId) && metricsMap.size >= MAX_TRACKED_COMPONENTS) return;

  const metric = getOrCreateMetric(warning.componentId);

  // Cap warnings per component to prevent unbounded array growth (VULN-03)
  if (metric.warnings.length >= MAX_WARNINGS_PER_COMPONENT) return;

  const throttleKey = `${warning.componentId}:${warning.type}`;
  const now = performance.now();
  const lastWarn = warnThrottle.get(throttleKey) ?? -Infinity;

  if (now - lastWarn < WARN_THROTTLE_MS) return; // throttle
  warnThrottle.set(throttleKey, now);

  // Evict stale throttle entries to prevent unbounded map growth (VULN-08)
  for (const [k, ts] of warnThrottle) {
    if (now - ts > WARN_THROTTLE_MS * 10) warnThrottle.delete(k);
  }

  metric.warnings.push(warning);

  // Invoke the user-supplied callback (feature #1: onWarning)
  if (options.onWarning) {
    try {
      options.onWarning(warning);
    } catch {
      // Never let an onWarning error crash the profiler
    }
  }

  // Gate console output on development mode regardless of logToConsole (VULN-05)
  if (options.logToConsole && isDevelopment()) {
    console.warn(`[react-performance-analyzer] ${warning.message}`);
  }
}

export function getAllMetrics(): ComponentPerformanceMetric[] {
  // Return shallow copies so callers cannot mutate the internal store state (VULN-06)
  return Array.from(metricsMap.values()).map((m) => ({
    ...m,
    warnings: [...m.warnings],
    renderHistory: [...m.renderHistory],
    lastChangedProps: [...m.lastChangedProps],
  }));
}

/**
 * Returns a copy of a single component's metric by ID, or undefined if not tracked.
 * Useful for targeted CI performance budget checks without building a full report.
 */
export function getMetric(id: string): ComponentPerformanceMetric | undefined {
  const m = metricsMap.get(id);
  if (!m) return undefined;
  return {
    ...m,
    warnings: [...m.warnings],
    renderHistory: [...m.renderHistory],
    lastChangedProps: [...m.lastChangedProps],
  };
}

/**
 * Records which prop keys changed on the most recent render.
 * Called from analyzeProps after shallowDiffProps (keys are already sanitized).
 */
export function recordPropChange(id: string, changedKeys: string[]): void {
  // Only update persisted (tracked) components, skip overflow transients
  const m = metricsMap.get(id);
  if (!m) return;
  m.lastChangedProps = changedKeys.slice();
}

/**
 * Subscribes to store mutations. Designed for use with useSyncExternalStore.
 * Returns an unsubscribe function.
 */
export function subscribeToStore(listener: () => void): () => void {
  subscribers.add(listener);
  return () => subscribers.delete(listener);
}

export function clearMetrics(): void {
  metricsMap.clear();
  warnThrottle.clear();
  // Notify subscribers so useRenderCount components update to 0
  if (subscribers.size > 0) notifySubscribers();
}
