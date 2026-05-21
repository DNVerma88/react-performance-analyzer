# react-performance-analyzer

A lightweight, **zero-runtime-dependency** React performance analyzer that helps you detect unnecessary re-renders, slow components, unstable props, and missing memoization opportunities — all in development, without touching production.

> **This package does not send telemetry, does not make network calls, and does not collect user data.**

---

## Why zero runtime dependencies?

Every runtime dependency you add becomes part of your users' bundle. It also expands the supply-chain attack surface. `react-performance-analyzer` uses only:

- React's built-in `Profiler` API
- The browser `Performance` API
- Native JavaScript

No lodash. No deep-equal. No analytics. No external network calls. Just React and the browser.

---

## Installation

```bash
npm install --save-dev react-performance-analyzer
```

> Recommended as a `devDependency`. Use `allowProduction: true` only if you intentionally want to run analysis in production.

---

## Quick Start

Wrap your application root:

```tsx
import { PerformanceAnalyzerProvider } from "react-performance-analyzer";

createRoot(document.getElementById("root")!).render(
  <PerformanceAnalyzerProvider enabled={true}>
    <App />
  </PerformanceAnalyzerProvider>
);
```

Open your browser console. Warnings appear automatically as your app runs.

---

## Usage

### Provider

```tsx
import { PerformanceAnalyzerProvider } from "react-performance-analyzer";

<PerformanceAnalyzerProvider
  enabled={true}
  slowRenderThresholdMs={16}
  frequentRenderThreshold={10}
  trackPropChanges={true}
  trackFunctionProps={true}
  logToConsole={true}
>
  <App />
</PerformanceAnalyzerProvider>
```

### AnalyzeRender wrapper

```tsx
import { AnalyzeRender } from "react-performance-analyzer";

<AnalyzeRender id="UserList">
  <UserList />
</AnalyzeRender>
```

Uses React's `Profiler` internally. Reports render duration, mount/update phase, and slow render warnings.

### useRenderAnalyzer hook

```tsx
import { useRenderAnalyzer } from "react-performance-analyzer";

function UserList(props) {
  useRenderAnalyzer("UserList", props);
  return <div>...</div>;
}
```

Tracks prop changes, detects unstable function references, and detects large prop objects.

### Higher-Order Component (HOC)

```tsx
import { withPerformanceAnalyzer } from "react-performance-analyzer";

export default withPerformanceAnalyzer(UserList, { id: "UserList" });
```

---

## Utility APIs

```ts
import {
  getPerformanceReport,
  clearPerformanceReport,
  printPerformanceReport,
  exportReportJSON,
  configurePerformanceAnalyzer,
} from "react-performance-analyzer";

// Print a console table summary
printPerformanceReport();

// Get the full PerformanceReport object (metrics + totals + generatedAt)
const report = getPerformanceReport();
// report.metrics — ComponentPerformanceMetric[]
// report.totalComponents, report.totalRenders, report.totalWarnings

// Export as JSON string
const json = exportReportJSON();

// Reset all collected data
clearPerformanceReport();

// Reconfigure at runtime
configurePerformanceAnalyzer({ slowRenderThresholdMs: 8 });
```

---

## Configuration Options

| Option | Type | Default | Description |
|---|---|---|---|
| `enabled` | `boolean` | `true` | Enable/disable the analyzer |
| `logToConsole` | `boolean` | `true` | Print warnings to console |
| `slowRenderThresholdMs` | `number` | `16` | Warn when render exceeds this (ms) |
| `frequentRenderThreshold` | `number` | `10` | Warn when render count exceeds this |
| `largePropsThresholdBytes` | `number` | `50000` | Warn when props exceed this size |
| `trackPropChanges` | `boolean` | `true` | Track which props changed between renders |
| `trackFunctionProps` | `boolean` | `true` | Warn on unstable function references |
| `includeMounts` | `boolean` | `true` | Track initial mounts |
| `includeUpdates` | `boolean` | `true` | Track subsequent updates |
| `allowProduction` | `boolean` | `false` | Enable in production builds |

---

## Example Console Output

```
[react-performance-analyzer] <UserList> slow render detected: 34.21ms (threshold: 16ms)
[react-performance-analyzer] <Counter> prop "onIncrement" is an unstable function reference. Wrap with useCallback.
[react-performance-analyzer] <FrequentComp> has rendered 11 times. Consider memoization.

[react-performance-analyzer] Performance Report
  Generated at: 2026-05-21T10:30:00.000Z
  Components tracked: 3
  Total renders: 24
  Total warnings: 4
  ┌──────────────┬─────────┬────────┬─────────┬───────┬───────┬────────┬──────────┐
  │ id           │ renders │ mounts │ updates │ avgMs │ maxMs │ lastMs │ warnings │
  ├──────────────┼─────────┼────────┼─────────┼───────┼───────┼────────┼──────────┤
  │ UserList     │       3 │      1 │       2 │  5.10 │ 34.21 │   4.20 │        1 │
  │ Counter      │      12 │      1 │      11 │  2.30 │  3.10 │   2.10 │        3 │
  │ FrequentComp │       9 │      1 │       8 │  1.80 │  2.50 │   1.90 │        0 │
  └──────────────┴─────────┴────────┴─────────┴───────┴───────┴────────┴──────────┘
```

---

## Metrics Model

```ts
interface ComponentPerformanceMetric {
  id: string;
  renderCount: number;
  mountCount: number;
  updateCount: number;
  totalDurationMs: number;
  averageDurationMs: number;
  maxDurationMs: number;
  lastDurationMs: number;
  lastRenderAt: number;
  warnings: PerformanceWarning[];
}

interface PerformanceWarning {
  type: "slow-render" | "frequent-render" | "unstable-prop" | "large-props";
  message: string;
  componentId: string;
  timestamp: number;
}
```

---

## Security and Privacy

- **Zero runtime dependencies** — minimal supply-chain risk
- **No network calls** — all data stays in the browser
- **No telemetry** — nothing is tracked or sent anywhere
- **No user data** — only component performance metrics are collected
- `npm audit` runs in CI on every push
- Dependabot monitors npm and GitHub Actions dependencies weekly
- CodeQL static analysis runs on every push

---

## Compatibility

| React Version | Supported |
|---|---|
| React 18.x | ✅ |
| React 19.x | ✅ |
| React 20.x | Planned (if stable APIs remain compatible) |

**Compatibility policy:** This package supports the latest React major version and selected prior major versions where stable React APIs remain compatible. Only stable React APIs are used (`Profiler`, hooks, `memo`-safe patterns). Experimental APIs are not used.

---

## Limitations

- Render duration reported by React `Profiler` may differ from browser DevTools flame charts (React Profiler measures React-controlled time only).
- The `useRenderAnalyzer` hook measures duration from render call to `useEffect`, which includes browser layout work. Use `AnalyzeRender` for more accurate profiler-based timing.
- Large prop size estimation uses `JSON.stringify` which may undercount non-serializable values.
- Warning throttling (2 seconds per component/type) prevents console flooding but may suppress some occurrences.
- This package detects potential issues — it does not automatically fix them. All warnings are advisory.

---

## Best Practices

- Use `AnalyzeRender` for the most accurate render duration measurement.
- Use `useRenderAnalyzer` when you want prop change tracking without wrapping JSX.
- Wrap only the components you want to analyze, not the entire tree, to reduce overhead.
- Use `clearPerformanceReport()` between test scenarios to get clean data.
- Disable the analyzer (`enabled: false`) in performance benchmarks to avoid measurement interference.
- Never enable `allowProduction: true` in user-facing production builds unless you have a specific reason.

---

## When NOT to Use This Package

- As a replacement for browser DevTools Performance tab or React DevTools Profiler — use those for detailed flame charts.
- In automated performance benchmarks — the analyzer adds a small overhead.
- As a production monitoring tool — it was designed for development.
- As a substitute for proper profiling in CI — it does not produce machine-readable pass/fail thresholds for CI gating.

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes with tests
4. Run: `npm run lint && npm run build && npm test`
5. Submit a pull request

All PRs must pass CI including type check, build, tests, and `npm audit`.

---

## Versioning Policy

This package follows [Semantic Versioning](https://semver.org/).

- **Patch** — bug fixes, no API changes
- **Minor** — new features, backwards compatible
- **Major** — breaking API changes

React major version support is added in **minor** releases when the new version becomes stable and existing APIs remain compatible. Support for old React versions is dropped in **major** releases only.

---

## License

MIT
