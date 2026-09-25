import { useEffect, useRef } from "react";
import { useEchoDesk } from "@/store/EchoDeskContext";
import { BackendBridge, BackendSnapshot } from "@/services/backendBridge";

export function useLiveSimulation() {
  const {
    telemetryMode,
    liveSimulation,
    systemStatus,
    setSystemStatus,
    aiRuntime,
    setAIRuntime,
    setDeviceInfo,
    contextMode,
    setProtectedApps,
    setTimelineEvents,
    setEngineConnectionStatus
  } = useEchoDesk();

  const phaseRef = useRef(0);

  // 1. Live Python backend connection via SSE
  useEffect(() => {
    BackendBridge.subscribeToUpdates(
      (snapshot: BackendSnapshot) => {
        const isLive = snapshot.telemetryMode === "LIVE HARDWARE";
        setEngineConnectionStatus(isLive ? "ONLINE (LIVE HARDWARE)" : "ONLINE (DEV SIMULATION)");

        if (snapshot.system) {
          setDeviceInfo(snapshot.system);
        }

        // Sync system status directly from real hardware telemetry
        setSystemStatus((prev) => ({
          ...prev,
          cpu: snapshot.telemetry.cpu,
          cpuName: snapshot.telemetry.cpuName,
          cpuCores: snapshot.telemetry.cpuCores,
          cpuThreads: snapshot.telemetry.cpuThreads,
          gpu: snapshot.telemetry.gpu,
          ramUsed: snapshot.telemetry.ramUsed,
          ramTotal: snapshot.telemetry.ramTotal,
          ramPercent: snapshot.telemetry.ramPercent,
          storageUsed: snapshot.telemetry.storageUsed,
          storageTotal: snapshot.telemetry.storageTotal,
          storagePercent: snapshot.telemetry.storagePercent,
          cpuTemp: snapshot.telemetry.cpuTemp, // null if unavailable
          gpuTemp: snapshot.telemetry.gpuTemp, // real GPU temp if available, else null
          cpuFanRpm: snapshot.telemetry.cpuFanRpm, // null if unavailable
          gpuFanRpm: snapshot.telemetry.gpuFanRpm, // null if unavailable
          battery: snapshot.telemetry.battery,
          powerConnected: snapshot.telemetry.powerConnected,
          powerState: snapshot.telemetry.powerState,
        }));

        // Sync real AI Runtime
        setAIRuntime((prev) => ({
          ...prev,
          inferenceLatency: snapshot.inferenceLatency,
          accelerator: (snapshot.telemetry.aiProvider as any) || "CPU",
          status: snapshot.telemetry.npuAvailable ? "ACTIVE" : "FALLBACK",
          npuAvailable: snapshot.telemetry.npuAvailable,
          qnnAvailable: snapshot.telemetry.qnnAvailable,
          provider: snapshot.telemetry.aiProvider || "CPU",
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
        setEngineConnectionStatus("OFFLINE");
      }
    );

    return () => BackendBridge.disconnect();
  }, [setSystemStatus, setAIRuntime, setDeviceInfo, setProtectedApps, setTimelineEvents, setEngineConnectionStatus]);

  // 2. Simulated telemetry loop - ONLY runs in explicit DEVELOPMENT SIMULATION mode!
  useEffect(() => {
    // In LIVE mode, NEVER run simulated telemetry!
    if (telemetryMode === "LIVE" || !liveSimulation || contextMode === "PRIVATE") return;

    const interval = setInterval(() => {
      phaseRef.current += 0.2;
      const p = phaseRef.current;

      const simCpu = Math.round((18 + Math.sin(p * 0.4) * 6) * 10) / 10;
      const simGpu = Math.round((12 + Math.sin(p * 0.5) * 4) * 10) / 10;
      const simRam = Math.round((8.4 + Math.sin(p * 0.2) * 0.3) * 10) / 10;

      setSystemStatus((prev) => ({
        ...prev,
        cpu: simCpu,
        gpu: simGpu,
        ramUsed: simRam,
        ramTotal: 16.0,
        ramPercent: Math.round((simRam / 16.0) * 100),
        storageUsed: 287,
        storageTotal: 512,
        storagePercent: 56,
        cpuTemp: 45,
        gpuTemp: 43,
        cpuFanRpm: 2396,
        gpuFanRpm: 2100,
        battery: 85,
        powerConnected: true,
      }));

      setAIRuntime((prev) => ({
        ...prev,
        inferenceLatency: Math.round(28 + Math.sin(p * 0.6) * 4),
        cpuOverhead: Math.round(14 + Math.cos(p * 0.4) * 3),
        memory: Math.round(186 + Math.sin(p * 0.2) * 8),
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, [telemetryMode, liveSimulation, contextMode, setSystemStatus, setAIRuntime]);
}
