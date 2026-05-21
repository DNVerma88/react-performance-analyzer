/**
 * Shallow comparison of two props objects.
 * Returns arrays of changed and added/removed keys.
 */
export interface PropDiff {
  changedKeys: string[];
  unstableFunctionKeys: string[];
}

export function shallowDiffProps(
  prevProps: Record<string, unknown>,
  nextProps: Record<string, unknown>,
  trackFunctions: boolean
): PropDiff {
  const changedKeys: string[] = [];
  const unstableFunctionKeys: string[] = [];

  const allKeys = new Set([
    ...Object.keys(prevProps),
    ...Object.keys(nextProps),
  ]);

  for (const key of allKeys) {
    if (key === "children") continue; // children changes are expected
    const prev = prevProps[key];
    const next = nextProps[key];
    if (!Object.is(prev, next)) {
      changedKeys.push(key);
      if (trackFunctions && typeof next === "function") {
        unstableFunctionKeys.push(key);
      }
    }
  }

  return { changedKeys, unstableFunctionKeys };
}
