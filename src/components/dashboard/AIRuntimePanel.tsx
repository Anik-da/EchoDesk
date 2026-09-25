import { useEchoDesk } from "@/store/EchoDeskContext";

export function AIRuntimePanel() {
  const { aiRuntime } = useEchoDesk();

  return (
    <div className="gcc-module rounded p-2.5 font-mono text-xs select-none space-y-2">
      <div className="text-[9px] uppercase tracking-wider text-zinc-400 border-l-2 border-cyan-400 pl-1.5 font-bold">
        AI Runtime Information
      </div>

      <div className="grid grid-cols-2 gap-2 text-[10px]">
        <div className="rounded border border-zinc-800/80 bg-zinc-950/60 p-1.5">
          <div className="text-[8px] uppercase text-zinc-500">ACCELERATOR</div>
          <div className="text-cyan-400 font-bold mt-0.5">{aiRuntime.accelerator}</div>
        </div>
        <div className="rounded border border-zinc-800/80 bg-zinc-950/60 p-1.5">
          <div className="text-[8px] uppercase text-zinc-500">STATE</div>
          <div className="text-lime-400 font-bold mt-0.5">{aiRuntime.status}</div>
        </div>
      </div>

      {/* Progress Bars for Latency & Overhead (GIGABYTE GPU Style) */}
      <div className="space-y-1.5 border-t border-zinc-800/80 pt-1.5">
        <div className="flex items-center justify-between text-[9px]">
          <span className="text-zinc-400 uppercase">INFERENCE LATENCY</span>
          <span className="text-zinc-200 font-bold">{aiRuntime.inferenceLatency} ms</span>
        </div>
        <div className="h-1.5 w-full bg-zinc-900 rounded-sm overflow-hidden">
          <div className="h-full bg-cyan-400 transition-all duration-300" style={{ width: `${Math.min(100, aiRuntime.inferenceLatency * 1.5)}%` }} />
        </div>

        <div className="flex items-center justify-between text-[9px] pt-1">
          <span className="text-zinc-400 uppercase">CPU OVERHEAD</span>
          <span className="text-zinc-200 font-bold">{aiRuntime.cpuOverhead}%</span>
        </div>
        <div className="h-1.5 w-full bg-zinc-900 rounded-sm overflow-hidden">
          <div className="h-full bg-amber-400 transition-all duration-300" style={{ width: `${aiRuntime.cpuOverhead}%` }} />
        </div>
      </div>

      <div className="flex items-center justify-between text-[9px] border-t border-zinc-800/80 pt-1.5">
        <span className="text-zinc-500 uppercase">MEMORY FOOTPRINT</span>
        <span className="text-zinc-300 font-bold">{aiRuntime.memory} MB</span>
      </div>
    </div>
  );
}
