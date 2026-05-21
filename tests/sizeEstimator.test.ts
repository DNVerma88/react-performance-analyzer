import { describe, it, expect } from "vitest";
import { estimatePropsSizeBytes } from "../src/utils/sizeEstimator";

describe("estimatePropsSizeBytes", () => {
  it("returns a positive number for non-empty props", () => {
    const size = estimatePropsSizeBytes({ name: "hello", count: 42 });
    expect(size).toBeGreaterThan(0);
  });

  it("handles empty object", () => {
    const size = estimatePropsSizeBytes({});
    expect(size).toBeGreaterThanOrEqual(0);
  });

  it("handles function props without throwing", () => {
    const size = estimatePropsSizeBytes({ onClick: () => {} });
    expect(size).toBeGreaterThan(0);
  });

  it("handles circular references without throwing", () => {
    const obj: Record<string, unknown> = { name: "test" };
    obj["self"] = obj;
    expect(() => estimatePropsSizeBytes(obj)).not.toThrow();
  });

  it("larger objects yield larger estimates", () => {
    const small = estimatePropsSizeBytes({ a: "x" });
    const large = estimatePropsSizeBytes({ a: "x".repeat(5000) });
    expect(large).toBeGreaterThan(small);
  });
});
