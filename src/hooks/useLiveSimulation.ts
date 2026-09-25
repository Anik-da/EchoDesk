import { useEffect } from "react";
import { useEchoDesk } from "@/store/EchoDeskContext";

const samplingHz: Record<string, number> = { "LOW POWER": 1, BALANCED: 5, "REAL-TIME": 10 };
const latencyRange: Record<string, [number, number]> = { "LOW POWER": [45, 60], BALANCED: [28, 38], "REAL-TIME": [18, 28] };

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function jitter(base: number, range: number, min: number, max: number) {
  return clamp(base + (Math.random() - 0.5) * range, min, max);
}

export function useLiveSimulation() {
  const { liveSimulation, samplingMode, systemStatus, setSystemStatus, aiRuntime, setAIRuntime, contextMode, contextConfidence } = useEchoDesk();

  useEffect(() => {
    if (!liveSimulation || contextMode === "PRIVATE") return;
    const interval = setInterval(() => {
      const hz = samplingHz[samplingMode];
      const [latMin, latMax] = latencyRange[samplingMode];

      setSystemStatus({
        ...systemStatus,
        cpu: jitter(systemStatus.cpu, 6, 8, 35),
        gpu: jitter(systemStatus.gpu, 4, 5, 25),
        ramUsed: jitter(systemStatus.ramUsed, 0.3, 7.8, 9.2),
        cpuFanRpm: Math.round(jitter(systemStatus.cpuFanRpm, 200, 2000, 3200)),
        cpuTemp: Math.round(jitter(systemStatus.cpuTemp, 3, 42, 52)),
        gpuTemp: Math.round(jitter(systemStatus.gpuTemp, 2, 40, 48)),
      });

      setAIRuntime({
        ...aiRuntime,
        inferenceLatency: Math.round(jitter(aiRuntime.inferenceLatency, 4, latMin, latMax)),
        cpuOverhead: Math.round(jitter(aiRuntime.cpuOverhead, 3, 10, 20)),
        memory: Math.round(jitter(aiRuntime.memory, 8, 170, 210)),
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [liveSimulation, samplingMode, contextMode, systemStatus, aiRuntime, setSystemStatus, setAIRuntime]);
}
