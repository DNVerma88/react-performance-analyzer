/**
 * Prop key names that commonly hold sensitive data and must never be serialized.
 * Uses substring matching (no anchors) to catch compound names such as
 * `userPassword`, `authToken`, or `apiSecret` in addition to exact matches.
 * Deliberately excludes overly short/common substrings like "key" and "auth"
 * to avoid excessive false-positive redaction.
 */
const SENSITIVE_KEY_PATTERN =
  /password|passwd|secret|token|credential|apikey|api_key|access_token|refresh_token|ssn|cvv/i;

/**
 * Estimates the approximate byte size of a props object without external dependencies.
 * Uses JSON.stringify selectively, handles circular references safely, and redacts
 * keys that match common sensitive-data patterns (VULN-01).
 */
export function estimatePropsSizeBytes(props: Record<string, unknown>): number {
  try {
    const seen = new WeakSet<object>();
    const json = JSON.stringify(props, (key, value: unknown) => {
      // Redact sensitive keys — the root call has key === ""
      if (key !== "" && SENSITIVE_KEY_PATTERN.test(key)) {
        return "[Redacted]";
      }
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
