import {
  Profiler,
  useCallback,
  type JSX,
  type ProfilerOnRenderCallback,
  type ReactNode,
} from "react";
import { handleProfilerRender } from "../core/PerformanceAnalyzer.js";
import { getOptions } from "../core/PerformanceStore.js";
import { isDevelopment } from "../utils/environment.js";

interface AnalyzeRenderProps {
  id: string;
  children: ReactNode;
}

export function AnalyzeRender({ id, children }: AnalyzeRenderProps): JSX.Element {
  // useCallback must be called before any conditional returns (Rules of Hooks).
  // The callback has a stable reference because handleProfilerRender reads
  // options from module-level state rather than via closure.
  const onRender = useCallback<ProfilerOnRenderCallback>(
    (profId, phase, actualDuration) => {
      handleProfilerRender(profId, phase, actualDuration);
    },
    [] // stable — no captured reactive values
  );

  const opts = getOptions();
  const active =
    (opts.allowProduction ? true : isDevelopment()) && opts.enabled !== false;

  if (!active) {
    return <>{children}</>;
  }

  return (
    <Profiler id={id} onRender={onRender}>
      {children}
    </Profiler>
  );
}
