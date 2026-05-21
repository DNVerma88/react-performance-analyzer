import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { PerformanceAnalyzerProvider } from "react-performance-analyzer";
import App from "./App";

const root = document.getElementById("root");
if (!root) throw new Error("No root element");

createRoot(root).render(
  <StrictMode>
    {/* 1. Wrap your application with the provider */}
    <PerformanceAnalyzerProvider
      enabled={true}
      slowRenderThresholdMs={16}
      frequentRenderThreshold={8}
      trackPropChanges={true}
      trackFunctionProps={true}
      logToConsole={true}
    >
      <App />
    </PerformanceAnalyzerProvider>
  </StrictMode>
);
