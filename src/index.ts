// Public API — react-performance-analyzer

// Components
export { PerformanceAnalyzerProvider, usePerformanceAnalyzerContext } from "./components/PerformanceAnalyzerProvider.js";
export { AnalyzeRender } from "./components/AnalyzeRender.js";

// Hooks
export { useRenderAnalyzer } from "./hooks/useRenderAnalyzer.js";
export { useRenderCount } from "./hooks/useRenderCount.js";

// HOC
export { withPerformanceAnalyzer } from "./hoc/withPerformanceAnalyzer.js";

// Utility APIs
export {
  clearMetrics as clearPerformanceReport,
  configureStore as configurePerformanceAnalyzer,
  getMetric,
  subscribeToStore,
} from "./core/PerformanceStore.js";

export {
  // getPerformanceReport() returns the full PerformanceReport object (with totals
  // and generatedAt), consistent with the PerformanceReport type contract.
  buildReport as getPerformanceReport,
  printReport as printPerformanceReport,
  exportReportJSON,
  buildReport,
} from "./core/MetricsReporter.js";

export type { ExportReportOptions, PrintReportOptions, SortBy } from "./core/MetricsReporter.js";

// Types
export type {
  PerformanceAnalyzerOptions,
  ComponentPerformanceMetric,
  PerformanceWarning,
  PerformanceReport,
} from "./types/index.js";
