import { describe, it, expect, beforeEach } from "vitest";
import { handleProfilerRender, analyzeProps } from "../src/core/PerformanceAnalyzer";
import {
  clearMetrics,
  configureStore,
  getAllMetrics,
  getOrCreateMetric,
} from "../src/core/PerformanceStore";

beforeEach(() => {
  clearMetrics();
  configureStore({
    enabled: true,
    logToConsole: false,
    slowRenderThresholdMs: 16,
    frequentRenderThreshold: 5,
    trackPropChanges: true,
    trackFunctionProps: true,
    largePropsThresholdBytes: 100,
  });
});

describe("PerformanceAnalyzer - handleProfilerRender", () => {
  it("records render and no warning below threshold", () => {
    handleProfilerRender("Fast", "mount", 5);
    const metric = getOrCreateMetric("Fast");
    expect(metric.renderCount).toBe(1);
    expect(metric.warnings.filter((w) => w.type === "slow-render")).toHaveLength(0);
  });

  it("creates slow-render warning above threshold", () => {
    handleProfilerRender("Slow", "mount", 100);
    const metric = getOrCreateMetric("Slow");
    const slowWarns = metric.warnings.filter((w) => w.type === "slow-render");
    expect(slowWarns.length).toBeGreaterThan(0);
  });

  it("creates frequent-render warning after threshold exceeded", () => {
    for (let i = 0; i < 7; i++) {
      handleProfilerRender("Frequent", "update", 5);
    }
    const metric = getOrCreateMetric("Frequent");
    const freqWarns = metric.warnings.filter((w) => w.type === "frequent-render");
    expect(freqWarns.length).toBeGreaterThan(0);
  });

  it("skips mount phase when includeMounts is false", () => {
    configureStore({ enabled: true, logToConsole: false, includeMounts: false });
    handleProfilerRender("NoMount", "mount", 5);
    const found = getAllMetrics().find((m) => m.id === "NoMount");
    expect(found).toBeUndefined();
  });
});

describe("PerformanceAnalyzer - analyzeProps", () => {
  it("warns on large props", () => {
    // build an object that serializes large enough
    const bigProps: Record<string, unknown> = { data: "x".repeat(10_000) };
    analyzeProps("BigPropsComp", null, bigProps);
    const metric = getOrCreateMetric("BigPropsComp");
    const bigWarns = metric.warnings.filter((w) => w.type === "large-props");
    expect(bigWarns.length).toBeGreaterThan(0);
  });

  it("warns on unstable function prop", () => {
    const prev = { onClick: () => {} };
    const next = { onClick: () => {} }; // new reference
    analyzeProps("BtnComp", prev as Record<string, unknown>, next as Record<string, unknown>);
    const metric = getOrCreateMetric("BtnComp");
    const unstableWarns = metric.warnings.filter((w) => w.type === "unstable-prop");
    expect(unstableWarns.length).toBeGreaterThan(0);
  });

  it("does not warn on stable function prop", () => {
    const fn = () => {};
    const prev = { onClick: fn };
    const next = { onClick: fn }; // same reference
    analyzeProps("StableBtn", prev as Record<string, unknown>, next as Record<string, unknown>);
    const metric = getOrCreateMetric("StableBtn");
    expect(metric.warnings.filter((w) => w.type === "unstable-prop")).toHaveLength(0);
  });
});
