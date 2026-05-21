import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  clearMetrics,
  configureStore,
  getAllMetrics,
  getOrCreateMetric,
  recordRender,
  addWarning,
} from "../src/core/PerformanceStore";

beforeEach(() => {
  clearMetrics();
  configureStore({ enabled: true, logToConsole: false });
});

describe("PerformanceStore", () => {
  it("creates a metric on first access", () => {
    const metric = getOrCreateMetric("TestComponent");
    expect(metric.id).toBe("TestComponent");
    expect(metric.renderCount).toBe(0);
  });

  it("records mount render", () => {
    recordRender("TestComponent", "mount", 5);
    const metric = getOrCreateMetric("TestComponent");
    expect(metric.renderCount).toBe(1);
    expect(metric.mountCount).toBe(1);
    expect(metric.updateCount).toBe(0);
    expect(metric.lastDurationMs).toBe(5);
  });

  it("records update render", () => {
    recordRender("TestComponent", "mount", 3);
    recordRender("TestComponent", "update", 4);
    const metric = getOrCreateMetric("TestComponent");
    expect(metric.renderCount).toBe(2);
    expect(metric.updateCount).toBe(1);
  });

  it("computes average duration", () => {
    recordRender("A", "mount", 10);
    recordRender("A", "update", 20);
    const metric = getOrCreateMetric("A");
    expect(metric.averageDurationMs).toBe(15);
  });

  it("tracks max duration", () => {
    recordRender("B", "mount", 5);
    recordRender("B", "update", 30);
    recordRender("B", "update", 10);
    const metric = getOrCreateMetric("B");
    expect(metric.maxDurationMs).toBe(30);
  });

  it("getAllMetrics returns all tracked components", () => {
    recordRender("X", "mount", 1);
    recordRender("Y", "mount", 2);
    expect(getAllMetrics()).toHaveLength(2);
  });

  it("clearMetrics resets the store", () => {
    recordRender("Z", "mount", 1);
    clearMetrics();
    expect(getAllMetrics()).toHaveLength(0);
  });

  it("addWarning stores warning on metric", () => {
    configureStore({ logToConsole: false });
    addWarning({
      type: "slow-render",
      message: "Slow",
      componentId: "SlowComp",
      timestamp: 0,
    });
    const metric = getOrCreateMetric("SlowComp");
    expect(metric.warnings).toHaveLength(1);
    expect(metric.warnings[0].type).toBe("slow-render");
  });

  it("throttles duplicate warnings within window", () => {
    configureStore({ logToConsole: false });
    const now = performance.now();
    vi.spyOn(performance, "now").mockReturnValue(now);
    addWarning({ type: "slow-render", message: "A", componentId: "C", timestamp: now });
    addWarning({ type: "slow-render", message: "A", componentId: "C", timestamp: now });
    vi.restoreAllMocks();
    const metric = getOrCreateMetric("C");
    // Second warning should be throttled
    expect(metric.warnings).toHaveLength(1);
  });
});
