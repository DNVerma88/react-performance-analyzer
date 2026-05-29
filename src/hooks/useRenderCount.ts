import { useSyncExternalStore } from "react";
import { subscribeToStore, getMetric } from "../core/PerformanceStore.js";
import { sanitizeComponentId } from "../utils/environment.js";

/**
 * Returns the live render count for a component tracked by AnalyzeRender or
 * useRenderAnalyzer. Re-renders the consuming component only when the count
 * for that specific id changes — other components updating the store cause no
 * extra renders here.
 *
 * Useful for building zero-dependency in-app performance overlays:
 *
 * @example
 * function DebugBadge({ id }: { id: string }) {
 *   const count = useRenderCount(id);
 *   return <span className="debug-badge">{count}×</span>;
 * }
 *
 * @param id  The component ID as passed to AnalyzeRender or useRenderAnalyzer.
 */
export function useRenderCount(id: string): number {
  const safeId = sanitizeComponentId(id);
  return useSyncExternalStore(
    subscribeToStore,
    () => getMetric(safeId)?.renderCount ?? 0,
    () => 0 // server-side rendering snapshot
  );
}
