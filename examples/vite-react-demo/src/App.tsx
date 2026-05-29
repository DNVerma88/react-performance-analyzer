import { useState, useCallback } from "react";
import {
  AnalyzeRender,
  useRenderAnalyzer,
  withPerformanceAnalyzer,
  printPerformanceReport,
  clearPerformanceReport,
} from "react-performance-analyzer";

// ─── 1. AnalyzeRender wrapper usage ────────────────────────────────────────

function UserList({ users }: { users: string[] }) {
  return (
    <ul>
      {users.map((u) => (
        <li key={u}>{u}</li>
      ))}
    </ul>
  );
}

// ─── 2. useRenderAnalyzer hook usage ────────────────────────────────────────

function Counter({ count, onIncrement }: { count: number; onIncrement: () => void }) {
  useRenderAnalyzer("Counter", { count, onIncrement } as Record<string, unknown>);
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={onIncrement}>Increment</button>
    </div>
  );
}

// ─── 3. HOC usage ────────────────────────────────────────────────────────────

function SlowComponent({ label }: { label: string }) {
  // Simulate CPU work with measurable array computation — avoids blocking the event loop
  const items = Array.from({ length: 10_000 }, (_, i) => i * Math.random());
  const sum = items.reduce((a, b) => a + b, 0);
  return <div>Slow: {label} ({Math.round(sum)})</div>;
}

const AnalyzedSlowComponent = withPerformanceAnalyzer(SlowComponent, {
  id: "SlowComponent",
});

// ─── 4. Frequent re-render example ───────────────────────────────────────────

function FrequentUpdater({ tick }: { tick: number }) {
  useRenderAnalyzer("FrequentUpdater", { tick } as Record<string, unknown>);
  return <div>Tick: {tick}</div>;
}

// ─── App ─────────────────────────────────────────────────────────────────────

export default function App() {
  const [count, setCount] = useState(0);
  const [tick, setTick] = useState(0);
  const users = ["Alice", "Bob", "Charlie"];

  // Stable callback — no unstable prop warning
  const handleIncrement = useCallback(() => setCount((c) => c + 1), []);

  // Unstable callback — will trigger unstable-prop warning in analyzer
  const unstableHandler = () => setCount((c) => c + 1);

  return (
    <div style={{ fontFamily: "sans-serif", padding: "2rem" }}>
      <h1>React Performance Analyzer — Demo</h1>
      <p>Open your browser console and interact with the components below.</p>

      <hr />
      <h2>AnalyzeRender wrapper</h2>
      <AnalyzeRender id="UserList">
        <UserList users={users} />
      </AnalyzeRender>

      <hr />
      <h2>useRenderAnalyzer hook (stable callback)</h2>
      <Counter count={count} onIncrement={handleIncrement} />

      <hr />
      <h2>useRenderAnalyzer hook (unstable callback — intentional warning)</h2>
      <Counter count={count} onIncrement={unstableHandler} />

      <hr />
      <h2>HOC — Slow Component</h2>
      <AnalyzedSlowComponent label={`render-${count}`} />

      <hr />
      <h2>Frequent Re-render Example</h2>
      <button onClick={() => setTick((t) => t + 1)}>Trigger Re-render</button>
      <FrequentUpdater tick={tick} />

      <hr />
      <h2>Report Controls</h2>
      <button
        onClick={() => printPerformanceReport()}
        style={{ marginRight: "1rem" }}
      >
        Print Report to Console
      </button>
      <button onClick={() => clearPerformanceReport()}>
        Clear Report
      </button>
    </div>
  );
}
