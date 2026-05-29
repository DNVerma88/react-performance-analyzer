import { type ComponentType, type FC, type JSX } from "react";
import { AnalyzeRender } from "../components/AnalyzeRender.js";
import { sanitizeComponentId } from "../utils/environment.js";

interface WithPerformanceAnalyzerOptions {
  id: string;
}

/**
 * Higher-order component that wraps a component with AnalyzeRender profiling.
 */
export function withPerformanceAnalyzer<P extends object>(
  Component: ComponentType<P>,
  options: WithPerformanceAnalyzerOptions
): FC<P> {
  const displayName = sanitizeComponentId(
    options.id ||
    Component.displayName ||
    Component.name ||
    "Component"
  );

  const Wrapped: FC<P> = (props: P): JSX.Element => (
    <AnalyzeRender id={displayName}>
      <Component {...props} />
    </AnalyzeRender>
  );

  Wrapped.displayName = `WithPerformanceAnalyzer(${displayName})`;
  return Wrapped;
}
