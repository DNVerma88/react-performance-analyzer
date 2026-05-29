/**
 * Utilities to detect runtime environment.
 *
 * Uses globalThis to access process.env.NODE_ENV without requiring @types/node.
 * Bundlers (Vite, webpack, Rollup, tsup) replace process.env.NODE_ENV with a
 * string literal at build time, so this is a safe runtime fallback.
 */

export function isDevelopment(): boolean {
  // Access process via globalThis to avoid a @types/node dependency while
  // remaining compatible with all modern bundlers that replace this expression
  // with a string literal at build time.
  const env = (
    globalThis as { process?: { env?: { NODE_ENV?: string } } }
  ).process?.env?.NODE_ENV;

  // Returns true for "development", "test", undefined, or any non-production
  // value. Defaults to true (development) when process is not available.
  return env !== "production";
}

export function isProduction(): boolean {
  return !isDevelopment();
}

/**
 * Pattern for safe component identifiers: alphanumeric, spaces, hyphens, underscores, dots.
 * Max 128 characters. Rejects characters that could cause injection in message strings
 * or HTML rendering contexts (VULN-02).
 */
const SAFE_ID_PATTERN = /^[a-zA-Z0-9_\-. ]{1,128}$/;

/**
 * Sanitizes a component ID to prevent injection into warning messages and exported JSON.
 * Replaces disallowed characters with underscores and truncates to 128 chars.
 */
export function sanitizeComponentId(id: string): string {
  if (typeof id !== "string" || id.length === 0) return "UnknownComponent";
  if (SAFE_ID_PATTERN.test(id)) return id;
  return id.replace(/[^a-zA-Z0-9_\-. ]/g, "_").slice(0, 128);
}
