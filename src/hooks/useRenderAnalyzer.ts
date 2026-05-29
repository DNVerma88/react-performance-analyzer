import { useRef, useEffect } from "react";
import {
  analyzeProps,
  handleProfilerRender,
} from "../core/PerformanceAnalyzer.js";
import { getOptions } from "../core/PerformanceStore.js";
import { isDevelopment, sanitizeComponentId } from "../utils/environment.js";

/**
 * Drop-in hook to track renders and prop changes for a given component.
 *
 * @param id   Unique identifier for the component.
 * @param props The component's props object.
 */
export function useRenderAnalyzer(
  id: string,
  props: Record<string, unknown>
): void {
  const safeId = sanitizeComponentId(id);
  const opts = getOptions();
  const active =
    (opts.allowProduction ? true : isDevelopment()) && opts.enabled !== false;

  const prevPropsRef = useRef<Record<string, unknown> | null>(null);
  const renderStartRef = useRef<number>(0);
  const mountedRef = useRef(false);

  if (active) {
    renderStartRef.current = performance.now();
  }

  useEffect(() => {
    if (!active) return;

    const duration = performance.now() - renderStartRef.current;
    const phase = mountedRef.current ? "update" : "mount";
    mountedRef.current = true;

    handleProfilerRender(safeId, phase, duration);
    analyzeProps(safeId, prevPropsRef.current, props);
    prevPropsRef.current = props;
  });
}
