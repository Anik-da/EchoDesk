import { useEchoDesk } from "@/store/EchoDeskContext";

export function AIRuntimePanel() {
  const { aiRuntime, deviceInfo } = useEchoDesk();

  const isNpuActive = aiRuntime.npuAvailable === true;
  const provider = aiRuntime.provider || (deviceInfo?.ai_runtime?.provider ?? "CPU");
  const latencyStr = aiRuntime.inferenceLatency !== null ? `${aiRuntime.inferenceLatency} ms` : "Unavailable";

  return (
    <div className="gcc-module rounded p-2.5 font-mono text-xs select-none space-y-2">
      <div className="text-[9px] uppercase tracking-wider text-zinc-400 border-l-2 border-cyan-400 pl-1.5 font-bold flex items-center justify-between">
        <span>AI Runtime Information</span>
        <span className="text-[8px] font-normal text-zinc-500">
          NPU: {isNpuActive ? <span className="text-lime-400 font-bold">Active</span> : <span className="text-zinc-400">Not detected</span>}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-[10px]">
        <div className="rounded border border-zinc-800/80 bg-zinc-950/60 p-1.5">
          <div className="text-[8px] uppercase text-zinc-500">ACCELERATOR</div>
          <div className="text-cyan-400 font-bold mt-0.5">{provider} {isNpuActive ? "" : "(Fallback)"}</div>
        </div>
        <div className="rounded border border-zinc-800/80 bg-zinc-950/60 p-1.5">
          <div className="text-[8px] uppercase text-zinc-500">STATE</div>
          <div className={isNpuActive ? "text-lime-400 font-bold mt-0.5" : "text-amber-400 font-bold mt-0.5"}>
            {isNpuActive ? "ACTIVE" : "FALLBACK"}
          </div>
        </div>
      </div>

      {/* Progress Bars for Latency & Overhead */}
      <div className="space-y-1.5 border-t border-zinc-800/80 pt-1.5">
        <div className="flex items-center justify-between text-[9px]">
          <span className="text-zinc-400 uppercase">INFERENCE LATENCY</span>
          <span className="text-zinc-200 font-bold">{latencyStr}</span>
        </div>
        <div className="h-1.5 w-full bg-zinc-900 rounded-sm overflow-hidden">
          <div
            className="h-full bg-cyan-400 transition-all duration-300"
            style={{ width: `${aiRuntime.inferenceLatency !== null ? Math.min(100, aiRuntime.inferenceLatency * 1.5) : 0}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[9px] pt-1">
          <span className="text-zinc-400 uppercase">QUALCOMM / QNN</span>
          <span className="text-zinc-400 font-bold">
            {aiRuntime.qnnAvailable ? "Available" : "Not supported on host"}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between text-[9px] border-t border-zinc-800/80 pt-1.5">
        <span className="text-zinc-500 uppercase">EXECUTION PROVIDER</span>
        <span className="text-zinc-300 font-bold">{provider} Provider</span>
      </div>
    </div>
  );
}
