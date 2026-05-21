import {
  addWarning,
  getOptions,
  getOrCreateMetric,
  recordRender,
} from "./PerformanceStore.js";
import { shallowDiffProps } from "../utils/propsAnalyzer.js";
import { estimatePropsSizeBytes } from "../utils/sizeEstimator.js";

/**
 * Called by the React Profiler onRender callback.
 */
export function handleProfilerRender(
  id: string,
  phase: "mount" | "update" | "nested-update",
  actualDurationMs: number
): void {
  const opts = getOptions();

  if (!opts.includeMounts && phase === "mount") return;
  if (!opts.includeUpdates && phase !== "mount") return;

  recordRender(id, phase, actualDurationMs);

  // Slow render warning
  if (actualDurationMs > opts.slowRenderThresholdMs) {
    addWarning({
      type: "slow-render",
      message: `<${id}> slow render detected: ${actualDurationMs.toFixed(2)}ms (threshold: ${opts.slowRenderThresholdMs}ms)`,
      componentId: id,
      timestamp: performance.now(),
    });
  }

  // Frequent re-render warning
  const metric = getOrCreateMetric(id);
  if (metric.renderCount > opts.frequentRenderThreshold) {
    addWarning({
      type: "frequent-render",
      message: `<${id}> has rendered ${metric.renderCount} times. Consider memoization.`,
      componentId: id,
      timestamp: performance.now(),
    });
  }
}

/**
 * Called from useRenderAnalyzer hook to analyze props changes.
 */
export function analyzeProps(
  id: string,
  prevProps: Record<string, unknown> | null,
  nextProps: Record<string, unknown>
): void {
  const opts = getOptions();

  // Large props check
  const sizeBytes = estimatePropsSizeBytes(nextProps);
  if (sizeBytes > opts.largePropsThresholdBytes) {
    addWarning({
      type: "large-props",
      message: `<${id}> has large props object (~${Math.round(sizeBytes / 1024)}KB). Consider reducing prop payload.`,
      componentId: id,
      timestamp: performance.now(),
    });
  }

  if (!prevProps) return;

  if (opts.trackPropChanges) {
    const { changedKeys, unstableFunctionKeys } = shallowDiffProps(
      prevProps,
      nextProps,
      opts.trackFunctionProps
    );

    for (const key of unstableFunctionKeys) {
      addWarning({
        type: "unstable-prop",
        message: `<${id}> prop "${key}" is an unstable function reference. Wrap with useCallback.`,
        componentId: id,
        timestamp: performance.now(),
      });
    }

    if (changedKeys.length === 0 && opts.logToConsole) {
      // Triggered a re-render but no prop changed — possible missing memo
      const metric = getOrCreateMetric(id);
      if (metric.renderCount > 1) {
        console.info(
          `[react-performance-analyzer] <${id}> re-rendered with identical props. Consider React.memo.`
        );
      }
    }
  }
}
