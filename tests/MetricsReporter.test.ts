import { describe, it, expect, beforeEach, vi } from "vitest";
import { buildReport, printReport, exportReportJSON } from "../src/core/MetricsReporter";
import {
  clearMetrics,
  configureStore,
  recordRender,
  addWarning,
} from "../src/core/PerformanceStore";

beforeEach(() => {
  clearMetrics();
  configureStore({ enabled: true, logToConsole: false });
});

describe("MetricsReporter", () => {
  it("buildReport returns empty report when no metrics", () => {
    const report = buildReport();
    expect(report.totalComponents).toBe(0);
    expect(report.totalRenders).toBe(0);
    expect(report.totalWarnings).toBe(0);
    expect(report.metrics).toHaveLength(0);
  });

  it("buildReport aggregates totals", () => {
    recordRender("A", "mount", 5);
    recordRender("A", "update", 10);
    recordRender("B", "mount", 3);
    addWarning({ type: "slow-render", message: "Slow", componentId: "A", timestamp: 0 });

    const report = buildReport();
    expect(report.totalComponents).toBe(2);
    expect(report.totalRenders).toBe(3);
    expect(report.totalWarnings).toBe(1);
  });

  it("buildReport includes generatedAt timestamp", () => {
    const before = Date.now();
    const report = buildReport();
    const after = Date.now();
    expect(report.generatedAt).toBeGreaterThanOrEqual(before);
    expect(report.generatedAt).toBeLessThanOrEqual(after);
  });

  it("exportReportJSON returns valid JSON string with PerformanceReport shape", () => {
    recordRender("Comp", "mount", 5);
    const json = exportReportJSON();
    const parsed = JSON.parse(json) as Record<string, unknown>;
    expect(parsed).toHaveProperty("generatedAt");
    expect(parsed).toHaveProperty("metrics");
    expect(parsed).toHaveProperty("totalComponents");
    expect(parsed).toHaveProperty("totalRenders");
    expect(parsed).toHaveProperty("totalWarnings");
  });

  it("printReport calls console methods without throwing", () => {
    const groupSpy = vi.spyOn(console, "group").mockImplementation(() => {});
    const tableSpy = vi.spyOn(console, "table").mockImplementation(() => {});
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const groupEndSpy = vi.spyOn(console, "groupEnd").mockImplementation(() => {});

    recordRender("Comp", "mount", 5);
    expect(() => printReport()).not.toThrow();

    groupSpy.mockRestore();
    tableSpy.mockRestore();
    logSpy.mockRestore();
    groupEndSpy.mockRestore();
  });

  // ── Feature #5: sortBy ───────────────────────────────────────────────────
  it("exportReportJSON sorts by renders descending", () => {
    recordRender("A", "mount", 1);
    recordRender("B", "mount", 1);
    recordRender("B", "update", 1);
    recordRender("B", "update", 1); // B: 3 renders, A: 1 render
    const json = exportReportJSON({ sortBy: "renders" });
    const parsed = JSON.parse(json) as { metrics: Array<{ id: string }> };
    expect(parsed.metrics[0].id).toBe("B");
    expect(parsed.metrics[1].id).toBe("A");
  });

  it("exportReportJSON sorts by maxDuration descending", () => {
    recordRender("Slow", "mount", 100);
    recordRender("Fast", "mount", 5);
    const json = exportReportJSON({ sortBy: "maxDuration" });
    const parsed = JSON.parse(json) as { metrics: Array<{ id: string }> };
    expect(parsed.metrics[0].id).toBe("Slow");
  });

  it("printReport accepts sortBy option without throwing", () => {
    const groupSpy = vi.spyOn(console, "group").mockImplementation(() => {});
    const tableSpy = vi.spyOn(console, "table").mockImplementation(() => {});
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const groupEndSpy = vi.spyOn(console, "groupEnd").mockImplementation(() => {});
    recordRender("Comp", "mount", 5);
    expect(() => printReport({ sortBy: "maxDuration" })).not.toThrow();
    groupSpy.mockRestore();
    tableSpy.mockRestore();
    logSpy.mockRestore();
    groupEndSpy.mockRestore();
  });

  it("exportReportJSON includes minDurationMs in each metric", () => {
    recordRender("M", "mount", 10);
    recordRender("M", "update", 3);
    const json = exportReportJSON();
    const parsed = JSON.parse(json) as { metrics: Array<Record<string, unknown>> };
    expect(parsed.metrics[0]).toHaveProperty("minDurationMs", 3);
  });
});
