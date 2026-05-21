/**
 * Estimates the approximate byte size of a props object without external dependencies.
 * Uses JSON.stringify selectively and handles circular references safely.
 */
export function estimatePropsSizeBytes(props: Record<string, unknown>): number {
  try {
    const seen = new WeakSet<object>();
    const json = JSON.stringify(props, (_key, value: unknown) => {
      if (value !== null && typeof value === "object") {
        if (seen.has(value as object)) {
          return "[Circular]";
        }
        seen.add(value as object);
      }
      if (typeof value === "function") {
        return "[Function]";
      }
      return value;
    });
    // UTF-16 approximation: each char ~ 2 bytes
    return json.length * 2;
  } catch {
    return 0;
  }
}
