import { getAllMetrics } from "./PerformanceStore.js";
import type { PerformanceReport } from "../types/index.js";

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

export function printReport(): void {
  const report = buildReport();
  console.group("[react-performance-analyzer] Performance Report");
  console.log(
    `Generated at: ${new Date(report.generatedAt).toISOString()}`
  );
  console.log(`Components tracked: ${report.totalComponents}`);
  console.log(`Total renders: ${report.totalRenders}`);
  console.log(`Total warnings: ${report.totalWarnings}`);

  if (report.metrics.length > 0) {
    console.table(
      report.metrics.map((m) => ({
        id: m.id,
        renders: m.renderCount,
        mounts: m.mountCount,
        updates: m.updateCount,
        avgMs: m.averageDurationMs.toFixed(2),
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

export function exportReportJSON(): string {
  return JSON.stringify(buildReport(), null, 2);
}
