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
