import { useEffect, useRef } from "react";
import { useEchoDesk } from "@/store/EchoDeskContext";
import { BackendBridge, BackendSnapshot } from "@/services/backendBridge";

export function useLiveSimulation() {
  const {
    liveSimulation,
    samplingMode,
    systemStatus,
    setSystemStatus,
    aiRuntime,
    setAIRuntime,
    contextMode,
    privacy,
    setPrivacy,
    setBackground,
    setProtectedApps,
    setTimelineEvents,
    setEngineConnectionStatus
  } = useEchoDesk();

  const phaseRef = useRef(0);

  // 1. Try real Python backend connection via SSE
  useEffect(() => {
    let connected = false;

    BackendBridge.subscribeToUpdates(
      (snapshot: BackendSnapshot) => {
        connected = true;
        setEngineConnectionStatus("ONLINE (PYTHON BACKEND)");
        
        // Sync system status
        setSystemStatus((prev) => ({
          ...prev,
          cpu: snapshot.telemetry.cpu,
          gpu: snapshot.telemetry.gpu,
          ramUsed: snapshot.telemetry.ram,
          cpuTemp: snapshot.telemetry.temp,
        }));

        // Sync AI Runtime
        setAIRuntime((prev) => ({
          ...prev,
          inferenceLatency: snapshot.inferenceLatency,
          accelerator: "NPU",
          status: "ACTIVE"
        }));

        // Sync Privacy & Apps if available
        if (snapshot.protectedApps && snapshot.protectedApps.length > 0) {
          setProtectedApps(snapshot.protectedApps);
        }
        if (snapshot.timelineEvents && snapshot.timelineEvents.length > 0) {
          setTimelineEvents(snapshot.timelineEvents);
        }
      },
      () => {
        connected = false;
        setEngineConnectionStatus("OFFLINE (DEV SIMULATION)");
      }
    );

    return () => BackendBridge.disconnect();
  }, [setSystemStatus, setAIRuntime, setProtectedApps, setTimelineEvents, setEngineConnectionStatus]);

  // 2. Smooth simulated telemetry loop for Dev mode fallback
  useEffect(() => {
    if (!liveSimulation || contextMode === "PRIVATE") return;

    const interval = setInterval(() => {
      phaseRef.current += 0.2;
      const p = phaseRef.current;

      const smoothCpu = Math.round((18 + Math.sin(p * 0.4) * 6 + Math.cos(p * 0.7) * 2) * 10) / 10;
      const smoothGpu = Math.round((12 + Math.sin(p * 0.5) * 4) * 10) / 10;
      const smoothRam = Math.round((8.1 + Math.sin(p * 0.2) * 0.3) * 10) / 10;

      setSystemStatus((prev) => ({
        ...prev,
        cpu: smoothCpu,
        gpu: smoothGpu,
        ramUsed: smoothRam,
        cpuTemp: Math.round(44 + Math.sin(p * 0.3) * 3),
        gpuTemp: Math.round(41 + Math.cos(p * 0.3) * 2),
      }));

      setAIRuntime((prev) => ({
        ...prev,
        inferenceLatency: Math.round(28 + Math.sin(p * 0.6) * 4),
        cpuOverhead: Math.round(14 + Math.cos(p * 0.4) * 3),
        memory: Math.round(186 + Math.sin(p * 0.2) * 8),
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, [liveSimulation, contextMode, setSystemStatus, setAIRuntime]);
}
