import { useState, useEffect, useRef } from "react";
import { Cpu, Zap, MemoryStick, Cloud, ChevronRight, Server, ShieldAlert } from "lucide-react";
import { useEchoDesk } from "@/store/EchoDeskContext";
import { Panel } from "@/components/ui/Panel";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { Switch } from "@/components/ui/Switch";
import { cn } from "@/utils/cn";

export function AIRuntimePage() {
  const { aiRuntime, setAIRuntime, models, selectedModel, setSelectedModel, deviceInfo, systemStatus } = useEchoDesk();
  const [useNPU, setUseNPU] = useState(false);

  const toggleAccelerator = () => {
    const newUseNpu = !useNPU;
    setUseNPU(newUseNpu);
    setAIRuntime({
      ...aiRuntime,
      accelerator: newUseNpu ? "NPU" : "CPU",
      status: newUseNpu ? "ACTIVE" : "FALLBACK",
      inferenceLatency: newUseNpu ? 22 : 36,
      cpuOverhead: newUseNpu ? 10 : 18,
    });
  };

  const detectedMfg = deviceInfo?.manufacturer || "Detecting";
  const detectedModel = deviceInfo?.model || "Device";
  const detectedCpu = deviceInfo?.cpu?.name || "Host CPU";
  const detectedGpu = deviceInfo?.gpu?.[0]?.name || "Integrated Graphics";
  const aiProvider = deviceInfo?.ai_runtime?.provider || aiRuntime.accelerator;
  const isNpuAvailable = deviceInfo?.ai_runtime?.npu_available || false;
  const execMode = isNpuAvailable ? "NPU Native" : (deviceInfo?.ai_runtime?.device_type === "GPU" ? "GPU Acceleration" : "CPU Fallback");

  return (
    <div className="flex h-full flex-col gap-3 overflow-y-auto p-4 select-none">
      <div>
        <h1 className="text-lg font-bold tracking-wide text-zinc-100 font-mono">LOCAL AI RUNTIME</h1>
        <p className="text-xs text-zinc-500">On-device context classification & hardware accelerator status.</p>
      </div>

      {/* Dynamic Host Hardware Profile */}
      <div className="rounded border border-cyan-500/40 bg-cyan-500/5 p-3 flex items-center justify-between">
        <div className="space-y-1 w-full">
          <div className="flex items-center gap-2">
            <Server className="h-4 w-4 text-cyan-400" />
            <span className="text-xs font-mono font-bold text-cyan-300 uppercase tracking-wider">
              EchoDesk Runtime — Host Environment
            </span>
          </div>
          <div className="grid grid-cols-4 gap-4 text-xs font-mono pt-1">
            <div>
              <span className="text-zinc-500 text-[9px] block uppercase">HARDWARE</span>
              <span className="text-zinc-200 font-semibold truncate block" title={`${detectedCpu} / ${detectedGpu}`}>
                {detectedMfg} {detectedModel}
              </span>
              <span className="text-zinc-500 text-[9px] block truncate">{detectedCpu}</span>
            </div>
            <div>
              <span className="text-zinc-500 text-[9px] block uppercase">AI ACCELERATOR</span>
              <span className="text-cyan-400 font-semibold truncate block">{aiProvider}</span>
            </div>
            <div>
              <span className="text-zinc-500 text-[9px] block uppercase">SNAPDRAGON NPU</span>
              <span className={cn("text-xs", isNpuAvailable ? "text-emerald-400 font-bold" : "text-zinc-500 italic")}>
                {isNpuAvailable ? "Active (HTP Backend)" : "Not detected on this device"}
              </span>
            </div>
            <div>
              <span className="text-zinc-500 text-[9px] block uppercase">EXECUTION MODE</span>
              <span className={cn("font-semibold", isNpuAvailable ? "text-emerald-400" : (execMode.includes("GPU") ? "text-cyan-400" : "text-amber-400"))}>
                {execMode}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Top telemetry cards */}
      <div className="grid grid-cols-4 gap-3">
        <StatCard
          icon={Zap}
          label="Inference Latency"
          value={aiRuntime.inferenceLatency !== null ? <AnimatedNumber value={aiRuntime.inferenceLatency} unit=" ms" /> : "Unavailable"}
        />
        <StatCard icon={Cpu} label="CPU Overhead" value={<AnimatedNumber value={aiRuntime.cpuOverhead} unit="%" />} />
        <StatCard icon={MemoryStick} label="Memory Footprint" value={<AnimatedNumber value={aiRuntime.memory} unit=" MB" />} />
        <StatCard icon={Cloud} label="Cloud Requests" value="0 (ZERO CLOUD)" />
      </div>

      {/* Processing Pipeline */}
      <Panel title="Execution Pipeline (On-Device)" accent>
        <div className="flex items-center gap-2">
          {["SENSOR ADAPTERS", "PRIVACY REDACTION", "VECTORIZER", "TINYLLAMA ONNX", "CONTEXT STATE"].map((step, i) => (
            <div key={step} className="flex items-center gap-2 flex-1">
              <div className="flex-1 rounded border border-zinc-800 bg-zinc-950/60 px-2 py-2 text-center">
                <span className="text-[9px] font-mono font-semibold uppercase tracking-wider text-zinc-300">{step}</span>
              </div>
              {i < 4 && <ChevronRight className="h-3.5 w-3.5 text-emerald-500/40 flex-shrink-0" />}
            </div>
          ))}
        </div>
      </Panel>

      <div className="grid grid-cols-2 gap-3">
        {/* Models */}
        <Panel title="On-Device Classifier Models" accent>
          <div className="space-y-1.5">
            {models.map((m) => (
              <button
                key={m.id}
                onClick={() => setSelectedModel(selectedModel?.id === m.id ? null : m)}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded border px-3 py-2 transition-all text-left font-mono",
                  selectedModel?.id === m.id
                    ? "border-emerald-500/40 bg-emerald-500/5"
                    : "border-zinc-800 bg-zinc-950/30 hover:border-zinc-700"
                )}
              >
                <div className={cn(
                  "flex h-6 w-6 items-center justify-center rounded text-[10px] font-bold",
                  m.status === "loaded" ? "bg-emerald-500/15 text-emerald-400" : "bg-zinc-800 text-zinc-600"
                )}>
                  M
                </div>
                <div className="flex-1">
                  <div className="text-xs font-semibold text-zinc-200">{m.name}</div>
                  <div className="text-[10px] text-zinc-500">{m.runtime} · {m.latency}ms · {m.memory}MB</div>
                </div>
                <span className={cn(
                  "text-[9px] font-semibold uppercase tracking-wider",
                  m.status === "loaded" ? "text-emerald-400" : "text-zinc-600"
                )}>
                  {m.status}
                </span>
              </button>
            ))}
          </div>

          {selectedModel && (
            <div className="mt-3 rounded border border-zinc-800 bg-zinc-950/40 p-3 space-y-2 ed-fade-enter">
              <div className="text-[10px] font-mono font-semibold uppercase tracking-wider text-emerald-400">{selectedModel.name}</div>
              <div className="grid grid-cols-2 gap-2">
                <ModelDetail label="Status" value={selectedModel.status} />
                <ModelDetail label="Runtime" value={selectedModel.runtime} />
                <ModelDetail label="Latency" value={`${selectedModel.latency} ms`} />
                <ModelDetail label="Memory" value={`${selectedModel.memory} MB`} />
              </div>
            </div>
          )}
        </Panel>

        {/* Real-time Benchmark Graphs */}
        <Panel title="Performance Metrics" accent>
          <div className="space-y-3">
            <Graph title="Inference Latency" unit=" ms" color="#10b981" currentValue={aiRuntime.inferenceLatency} range={[0, 50]} />
            <Graph title="CPU Load" unit="%" color="#06b6d4" currentValue={systemStatus.cpu} range={[0, 100]} />
            <Graph title="RAM Consumption" unit=" GB" color="#f59e0b" currentValue={systemStatus.ramUsed} range={[0, systemStatus.ramTotal || 16]} />
          </div>
        </Panel>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: React.ReactNode }) {
  return (
    <div className="rounded border border-zinc-800 bg-zinc-900/40 p-3">
      <div className="flex items-center gap-1.5">
        <Icon className="h-3 w-3 text-zinc-500" />
        <span className="text-[9px] font-mono uppercase tracking-wider text-zinc-500">{label}</span>
      </div>
      <div className="mt-1 text-base font-bold font-mono text-zinc-200">{value}</div>
    </div>
  );
}

function ModelDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-zinc-800 bg-zinc-950/40 px-2 py-1">
      <div className="text-[8px] font-mono uppercase tracking-wider text-zinc-600">{label}</div>
      <div className="text-xs font-mono text-zinc-300 mt-0.5">{value}</div>
    </div>
  );
}

function Graph({
  title,
  unit,
  color,
  currentValue,
  range,
}: {
  title: string;
  unit: string;
  color: string;
  currentValue: number | null;
  range: [number, number];
}) {
  const [data, setData] = useState<number[]>(() => Array.from({ length: 30 }, () => currentValue ?? range[0]));

  useEffect(() => {
    if (currentValue !== null && typeof currentValue === "number") {
      setData((prev) => [...prev.slice(1), currentValue]);
    }
  }, [currentValue]);

  if (currentValue === null) {
    return (
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-mono uppercase text-zinc-500">{title}</span>
          <span className="font-mono text-[10px] text-zinc-500">Unavailable</span>
        </div>
        <div className="relative h-10 rounded border border-zinc-800 bg-zinc-950/60 flex items-center justify-center text-[10px] font-mono text-zinc-600">
          Telemetry unavailable from hardware
        </div>
      </div>
    );
  }

  const min = range[0];
  const max = range[1];
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - Math.max(0, Math.min(100, ((v - min) / (max - min || 1)) * 100));
    return `${x},${y}`;
  }).join(" ");

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-mono uppercase text-zinc-500">{title}</span>
        <span className="font-mono text-[10px] tabular-nums text-zinc-300">
          {Math.round(currentValue * 10) / 10}{unit}
        </span>
      </div>
      <div className="relative h-12 rounded border border-zinc-800 bg-zinc-950/60 overflow-hidden">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
          <polyline
            points={points}
            fill="none"
            stroke={color}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>
    </div>
  );
}
