import { describe, it, expect } from "vitest";
import { shallowDiffProps } from "../src/utils/propsAnalyzer";

describe("shallowDiffProps", () => {
  it("detects changed string prop", () => {
    const diff = shallowDiffProps({ name: "Alice" }, { name: "Bob" }, false);
    expect(diff.changedKeys).toContain("name");
  });

  it("returns empty when props are identical", () => {
    const diff = shallowDiffProps({ count: 1 }, { count: 1 }, false);
    expect(diff.changedKeys).toHaveLength(0);
  });

  it("detects new prop added", () => {
    const diff = shallowDiffProps({}, { extra: true }, false);
    expect(diff.changedKeys).toContain("extra");
  });

  it("detects unstable function when trackFunctions true", () => {
    const diff = shallowDiffProps(
      { onClick: () => {} },
      { onClick: () => {} },
      true
    );
    expect(diff.unstableFunctionKeys).toContain("onClick");
  });

  it("does not flag function when same reference", () => {
    const fn = () => {};
    const diff = shallowDiffProps({ onClick: fn }, { onClick: fn }, true);
    expect(diff.unstableFunctionKeys).toHaveLength(0);
  });

  it("ignores children key", () => {
    const diff = shallowDiffProps(
      { children: "a" },
      { children: "b" },
      false
    );
    expect(diff.changedKeys).not.toContain("children");
  });
});
