import { useState, useEffect, useRef } from "react";
import { Cpu, Zap, MemoryStick, Cloud, ChevronRight } from "lucide-react";
import { useEchoDesk } from "@/store/EchoDeskContext";
import { Panel } from "@/components/ui/Panel";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { Switch } from "@/components/ui/Switch";
import { cn } from "@/utils/cn";

export function AIRuntimePage() {
  const { aiRuntime, setAIRuntime, models, selectedModel, setSelectedModel } = useEchoDesk();
  const [useNPU, setUseNPU] = useState(aiRuntime.accelerator === "NPU");

  const toggleAccelerator = () => {
    const newAcc = useNPU ? "CPU" : "NPU";
    setUseNPU(!useNPU);
    setAIRuntime({
      ...aiRuntime,
      accelerator: newAcc as "NPU" | "CPU",
      status: newAcc === "NPU" ? "ACTIVE" : "FALLBACK",
      inferenceLatency: newAcc === "NPU" ? 32 : 68,
      cpuOverhead: newAcc === "NPU" ? 14 : 42,
    });
  };

  return (
    <div className="flex h-full flex-col gap-3 overflow-y-auto p-4">
      <div>
        <h1 className="text-lg font-bold tracking-wide text-zinc-100">LOCAL AI RUNTIME</h1>
        <p className="text-xs text-zinc-500">On-device model execution and hardware acceleration.</p>
      </div>

      {/* Top status */}
      <div className="grid grid-cols-4 gap-3">
        <StatCard icon={Zap} label="Inference Latency" value={<AnimatedNumber value={aiRuntime.inferenceLatency} unit=" ms" />} />
        <StatCard icon={Cpu} label="CPU Overhead" value={<AnimatedNumber value={aiRuntime.cpuOverhead} unit="%" />} />
        <StatCard icon={MemoryStick} label="Memory" value={<AnimatedNumber value={aiRuntime.memory} unit=" MB" />} />
        <StatCard icon={Cloud} label="Cloud Requests" value={<AnimatedNumber value={aiRuntime.cloudRequests} />} />
      </div>

      {/* Acceleration toggle */}
      <div className="flex items-center justify-between rounded border border-zinc-800 bg-zinc-900/40 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className={cn(
            "flex h-8 w-8 items-center justify-center rounded",
            useNPU ? "bg-emerald-500/15" : "bg-cyan-500/15"
          )}>
            <Zap className={cn("h-4 w-4", useNPU ? "text-emerald-400" : "text-cyan-400")} />
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
              Acceleration: {useNPU ? "NPU" : "CPU Fallback"}
            </div>
            <div className="text-[10px] text-zinc-500">
              {useNPU ? "Hardware neural processing unit active" : "Running on CPU — higher latency"}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={cn("text-[10px] font-semibold uppercase tracking-wider", useNPU ? "text-emerald-400" : "text-cyan-400")}>
            {aiRuntime.status}
          </span>
          <Switch checked={useNPU} onChange={toggleAccelerator} />
        </div>
      </div>

      {/* Processing Pipeline */}
      <Panel title="Processing Pipeline" accent>
        <div className="flex items-center gap-2">
          {["SENSOR", "MODEL", "ACCELERATOR", "CONTEXT", "EVENT"].map((step, i) => (
            <div key={step} className="flex items-center gap-2 flex-1">
              <div className="flex-1 rounded border border-zinc-800 bg-zinc-950/30 px-2 py-1.5 text-center">
                <span className="text-[9px] font-semibold uppercase tracking-wider text-zinc-400">{step}</span>
              </div>
              {i < 4 && <ChevronRight className="h-3 w-3 text-emerald-500/30 flex-shrink-0" />}
            </div>
          ))}
        </div>
      </Panel>

      <div className="grid grid-cols-2 gap-3">
        {/* Models */}
        <Panel title="Models" accent>
          <div className="space-y-1.5">
            {models.map((m) => (
              <button
                key={m.id}
                onClick={() => setSelectedModel(selectedModel?.id === m.id ? null : m)}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded border px-3 py-2 transition-all text-left",
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
                  <div className="text-xs font-medium text-zinc-300">{m.name}</div>
                  <div className="text-[10px] text-zinc-600">{m.runtime} · {m.latency}ms · {m.memory}MB</div>
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
              <div className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400">{selectedModel.name}</div>
              <div className="grid grid-cols-2 gap-2">
                <ModelDetail label="Status" value={selectedModel.status} />
                <ModelDetail label="Runtime" value={selectedModel.runtime} />
                <ModelDetail label="Latency" value={`${selectedModel.latency} ms`} />
                <ModelDetail label="Memory" value={`${selectedModel.memory} MB`} />
              </div>
              <div>
                <div className="text-[9px] uppercase tracking-wider text-zinc-600">State</div>
                <div className="text-[11px] text-zinc-400 mt-0.5">{selectedModel.state}</div>
              </div>
            </div>
          )}
        </Panel>

        {/* Performance Graphs */}
        <Panel title="Performance" accent>
          <div className="space-y-3">
            <Graph title="Inference Latency" unit="ms" color="#34d399" baseValue={aiRuntime.inferenceLatency} range={[15, 70]} />
            <Graph title="Memory Usage" unit="MB" color="#22d3ee" baseValue={aiRuntime.memory} range={[160, 220]} />
            <Graph title="CPU Activity" unit="%" color="#f59e0b" baseValue={aiRuntime.cpuOverhead} range={[8, 50]} />
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
        <span className="text-[9px] uppercase tracking-wider text-zinc-600">{label}</span>
      </div>
      <div className="mt-1.5 text-lg font-bold tabular-nums text-zinc-200">{value}</div>
    </div>
  );
}

function ModelDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-zinc-800 bg-zinc-950/40 px-2 py-1">
      <div className="text-[8px] uppercase tracking-wider text-zinc-600">{label}</div>
      <div className="text-xs font-medium text-zinc-300 mt-0.5">{value}</div>
    </div>
  );
}

function Graph({ title, unit, color, baseValue, range }: { title: string; unit: string; color: string; baseValue: number; range: [number, number] }) {
  const [data, setData] = useState<number[]>(() => Array.from({ length: 40 }, () => baseValue));
  const dataRef = useRef(data);
  dataRef.current = data;

  useEffect(() => {
    const interval = setInterval(() => {
      const val = Math.max(range[0], Math.min(range[1], baseValue + (Math.random() - 0.5) * (range[1] - range[0]) * 0.15));
      setData((prev) => [...prev.slice(1), val]);
    }, 1500);
    return () => clearInterval(interval);
  }, [baseValue, range]);

  const min = range[0];
  const max = range[1];
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - ((v - min) / (max - min)) * 100;
    return `${x},${y}`;
  }).join(" ");

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] uppercase tracking-wider text-zinc-500">{title}</span>
        <span className="mono text-[10px] tabular-nums text-zinc-300">
          {Math.round(data[data.length - 1])}{unit}
        </span>
      </div>
      <div className="relative h-12 rounded border border-zinc-800 bg-zinc-950/40 overflow-hidden">
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
