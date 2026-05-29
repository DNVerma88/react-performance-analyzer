import { getAllMetrics } from "./PerformanceStore.js";
import type { ComponentPerformanceMetric, PerformanceReport } from "../types/index.js";

/** Options for capping the size of the exported JSON report (VULN-09). */
export interface ExportReportOptions {
  /** Maximum number of components to include. Default: 200. */
  maxComponents?: number;
  /** Maximum warnings to include per component. Default: 50. */
  maxWarningsPerComponent?: number;
  /** Sort components by this metric, descending. Default: "renders". */
  sortBy?: SortBy;
}

/** Options for printReport output. */
export interface PrintReportOptions {
  /** Sort components by this metric, descending. Default: "renders". */
  sortBy?: SortBy;
}

/** Dimension to sort components by in report output. */
export type SortBy = "renders" | "avgDuration" | "maxDuration" | "warnings";

function sortMetrics(
  metrics: ComponentPerformanceMetric[],
  sortBy: SortBy
): ComponentPerformanceMetric[] {
  return [...metrics].sort((a, b) => {
    switch (sortBy) {
      case "renders":     return b.renderCount - a.renderCount;
      case "avgDuration": return b.averageDurationMs - a.averageDurationMs;
      case "maxDuration": return b.maxDurationMs - a.maxDurationMs;
      case "warnings":    return b.warnings.length - a.warnings.length;
    }
  });
}

export function buildReport(): PerformanceReport {
  const metrics = getAllMetrics();
  return {
    generatedAt: Date.now(),
    metrics,
    totalComponents: metrics.length,
    totalRenders: metrics.reduce((sum, m) => sum + m.renderCount, 0),
    totalWarnings: metrics.reduce((sum, m) => sum + m.warnings.length, 0),
  };
}

export function printReport(opts?: PrintReportOptions): void {
  const report = buildReport();
  const metrics = sortMetrics(report.metrics, opts?.sortBy ?? "renders");
  console.group("[react-performance-analyzer] Performance Report");
  console.log(
    `Generated at: ${new Date(report.generatedAt).toISOString()}`
  );
  console.log(`Components tracked: ${report.totalComponents}`);
  console.log(`Total renders: ${report.totalRenders}`);
  console.log(`Total warnings: ${report.totalWarnings}`);

  if (metrics.length > 0) {
    console.table(
      metrics.map((m) => ({
        id: m.id,
        renders: m.renderCount,
        mounts: m.mountCount,
        updates: m.updateCount,
        avgMs: m.averageDurationMs.toFixed(2),
        minMs: m.minDurationMs.toFixed(2),
        maxMs: m.maxDurationMs.toFixed(2),
        lastMs: m.lastDurationMs.toFixed(2),
        warnings: m.warnings.length,
      }))
    );
  } else {
    console.log("No components tracked yet.");
  }

  console.groupEnd();
}

export function exportReportJSON(opts?: ExportReportOptions): string {
  const maxComponents = opts?.maxComponents ?? 200;
  const maxWarnings = opts?.maxWarningsPerComponent ?? 50;
  const sortBy = opts?.sortBy ?? "renders";
  const report = buildReport();
  const sorted = sortMetrics(report.metrics, sortBy);
  const capped: PerformanceReport = {
    ...report,
    metrics: sorted.slice(0, maxComponents).map((m) => ({
      ...m,
      warnings: m.warnings.slice(0, maxWarnings),
    })),
  };
  // Recompute totals to match the capped slice
  capped.totalComponents = capped.metrics.length;
  capped.totalRenders = capped.metrics.reduce((s, m) => s + m.renderCount, 0);
  capped.totalWarnings = capped.metrics.reduce((s, m) => s + m.warnings.length, 0);
  return JSON.stringify(capped, null, 2);
}
