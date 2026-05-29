import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  clearMetrics,
  configureStore,
  getAllMetrics,
  getOrCreateMetric,
  getMetric,
  recordRender,
  recordPropChange,
  addWarning,
  subscribeToStore,
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

  // ── Feature #3: minDurationMs ─────────────────────────────────────────────
  it("tracks minDurationMs correctly", () => {
    recordRender("MinTest", "mount", 20);
    recordRender("MinTest", "update", 5);
    recordRender("MinTest", "update", 15);
    const metric = getOrCreateMetric("MinTest");
    expect(metric.minDurationMs).toBe(5);
  });

  it("sets minDurationMs on first render", () => {
    recordRender("FirstMin", "mount", 42);
    const metric = getOrCreateMetric("FirstMin");
    expect(metric.minDurationMs).toBe(42);
  });

  // ── Feature #3: renderHistory ring buffer ─────────────────────────────────
  it("maintains renderHistory ring buffer of last 10 entries", () => {
    for (let i = 1; i <= 12; i++) {
      recordRender("Ring", "update", i * 10);
    }
    const metric = getOrCreateMetric("Ring");
    expect(metric.renderHistory).toHaveLength(10);
    // First two (10, 20) are evicted; remaining: 30..120
    expect(metric.renderHistory[0]).toBe(30);
    expect(metric.renderHistory[9]).toBe(120);
  });

  it("renderHistory grows up to 10 then stays capped", () => {
    for (let i = 0; i < 5; i++) recordRender("SmallRing", "update", i);
    expect(getOrCreateMetric("SmallRing").renderHistory).toHaveLength(5);
    for (let i = 0; i < 10; i++) recordRender("SmallRing", "update", i);
    expect(getOrCreateMetric("SmallRing").renderHistory).toHaveLength(10);
  });

  // ── Feature #2: getMetric ─────────────────────────────────────────────────
  it("getMetric returns undefined for unknown id", () => {
    expect(getMetric("Unknown")).toBeUndefined();
  });

  it("getMetric returns a defensive copy of the metric", () => {
    recordRender("GM", "mount", 5);
    const copy = getMetric("GM");
    expect(copy).toBeDefined();
    expect(copy!.renderCount).toBe(1);
    // Mutating the copy must not affect the store
    copy!.renderCount = 999;
    expect(getMetric("GM")!.renderCount).toBe(1);
  });

  // ── Feature #6: subscribeToStore ──────────────────────────────────────────
  it("subscribeToStore notifies on recordRender and stops after unsubscribe", () => {
    let notified = 0;
    const unsub = subscribeToStore(() => { notified++; });
    recordRender("Sub", "mount", 1);
    expect(notified).toBe(1);
    unsub();
    recordRender("Sub", "update", 1); // should NOT notify after unsubscribe
    expect(notified).toBe(1);
  });

  it("subscribeToStore notifies on clearMetrics", () => {
    let notified = 0;
    const unsub = subscribeToStore(() => { notified++; });
    recordRender("SubClear", "mount", 1);
    clearMetrics();
    unsub();
    expect(notified).toBeGreaterThanOrEqual(2); // once for render, once for clear
  });

  // ── Feature #1: onWarning callback ────────────────────────────────────────
  it("onWarning callback is invoked when a warning fires", () => {
    const received: string[] = [];
    configureStore({
      logToConsole: false,
      onWarning: (w) => received.push(w.type),
    });
    addWarning({ type: "slow-render", message: "Slow", componentId: "CB", timestamp: 0 });
    expect(received).toContain("slow-render");
  });

  it("onWarning callback error does not crash the profiler", () => {
    configureStore({
      logToConsole: false,
      onWarning: () => { throw new Error("callback error"); },
    });
    // Must not throw
    expect(() =>
      addWarning({ type: "slow-render", message: "Slow", componentId: "CB2", timestamp: 0 })
    ).not.toThrow();
  });

  // ── Feature #4: lastChangedProps ──────────────────────────────────────────
  it("recordPropChange stores lastChangedProps on the metric", () => {
    recordRender("PC", "mount", 1);
    recordPropChange("PC", ["count", "name"]);
    const m = getOrCreateMetric("PC");
    expect(m.lastChangedProps).toEqual(["count", "name"]);
  });

  it("recordPropChange is a no-op for untracked components", () => {
    // Should not throw or create a metric
    expect(() => recordPropChange("Untracked", ["x"])).not.toThrow();
    expect(getMetric("Untracked")).toBeUndefined();
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
