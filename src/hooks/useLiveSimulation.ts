import { useEffect, useRef } from "react";
import { useEchoDesk } from "@/store/EchoDeskContext";
import { BackendBridge, BackendSnapshot } from "@/services/backendBridge";

export function useLiveSimulation() {
  const {
    telemetryMode,
    liveSimulation,
    contextMode,
    setContextMode,
    setLiveContextInfo,
    setSignals,
    setEvents,
    setSystemStatus,
    setAIRuntime,
    setDeviceInfo,
    setPrivacy,
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

        // Sync real-time Context Engine state
        if (snapshot.contextMode) {
          setContextMode(snapshot.contextMode as any);
        }
        if (snapshot.contextSubtitle !== undefined) {
          setLiveContextInfo(
            snapshot.contextSubtitle,
            snapshot.contextConfidence ?? 85,
            snapshot.contextSignals || []
          );
        }

        // Sync real-time sensor adapter signals if provided
        if (snapshot.signals && Array.isArray(snapshot.signals)) {
          const cam = snapshot.signals[0] || {};
          const aud = snapshot.signals[1] || {};
          const scr = snapshot.signals[2] || {};
          const act = snapshot.signals[3] || {};

          setSignals([
            {
              id: "camera",
              label: "Vision",
              icon: "Camera",
              state: cam.enabled === false ? "off" : (cam.available === false ? "off" : (cam.state || "low")),
              description: cam.description || (cam.state === "active" ? "User present" : "No person detected"),
              enabled: cam.enabled !== false,
              activityLevel: cam.activityLevel ?? cam.activity_level ?? 0,
            },
            {
              id: "microphone",
              label: "Audio",
              icon: "Mic",
              state: aud.enabled === false ? "off" : (aud.available === false ? "off" : (aud.state || "low")),
              description: aud.description || "Microphone silent",
              enabled: aud.enabled !== false,
              activityLevel: aud.activityLevel ?? aud.activity_level ?? 0,
            },
            {
              id: "screen",
              label: "Screen",
              icon: "Monitor",
              state: scr.enabled === false ? "off" : (scr.state || "active"),
              description: scr.description || (scr.activeApp ? `${scr.activeApp} active` : "System Desktop"),
              enabled: scr.enabled !== false,
              activityLevel: scr.activityLevel ?? scr.activity_level ?? 70,
            },
            {
              id: "activity",
              label: "Activity",
              icon: "Keyboard",
              state: act.enabled === false ? "off" : (act.state || "active"),
              description: act.description || "System active",
              enabled: act.enabled !== false,
              activityLevel: act.activityLevel ?? act.activity_level ?? 50,
            },
          ]);
        }

        // Sync real semantic events
        if (snapshot.events && Array.isArray(snapshot.events) && snapshot.events.length > 0) {
          setEvents(
            snapshot.events.map((e: any, idx: number) => ({
              id: e.id || `evt-${idx}`,
              label: e.label || e.type,
              source: e.source || "system",
              detected: Boolean(e.detected),
              confidence: e.confidence ?? 90,
            }))
          );
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

        // Sync Privacy state
        if (snapshot.privacy) {
          setPrivacy({
            privateMode: snapshot.privacy.privateMode,
            cameraActive: snapshot.privacy.cameraActive,
            microphoneActive: snapshot.privacy.microphoneActive,
            screenActive: snapshot.privacy.screenActive,
            cloudProcessing: snapshot.privacy.cloudProcessing ?? false,
            rawVideoStored: false,
            rawAudioStored: false,
            historyPaused: snapshot.privacy.historyPaused,
            retention: (snapshot.privacy.retention as any) || "30 days",
          });
        }

        // Sync Protected Apps & Timeline Events
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
  }, [setSystemStatus, setAIRuntime, setDeviceInfo, setPrivacy, setProtectedApps, setTimelineEvents, setEngineConnectionStatus]);

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
