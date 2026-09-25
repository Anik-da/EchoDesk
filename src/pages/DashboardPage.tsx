import { useEchoDesk } from "@/store/EchoDeskContext";
import { ContextCore } from "@/components/ContextCore";
import { SystemStatus } from "@/components/dashboard/SystemStatus";
import { AIRuntimePanel } from "@/components/dashboard/AIRuntimePanel";
import { ContextSignals } from "@/components/dashboard/ContextSignals";
import { SamplingControl } from "@/components/dashboard/SamplingControl";
import { RecentContext } from "@/components/dashboard/RecentContext";

export function DashboardPage() {
  const { currentContext } = useEchoDesk();

  return (
    <div className="flex h-full flex-col gap-2 overflow-y-auto p-3 select-none">
      {/* Hardware Subheader Banner (GIGABYTE Control Center Style) */}
      <div className="flex items-center justify-between border-b border-[#1f2229] pb-1 px-1 font-mono text-[10px] text-zinc-400">
        <div>
          <span className="text-zinc-200 font-bold">System</span>
          <span className="ml-3 text-zinc-400">EchoDesk Runtime — Intel CPU / NVIDIA GPU (GIGABYTE G6 Host)</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-zinc-500">STATE: <span className="text-lime-400 font-bold">{currentContext}</span></span>
          <span className="text-zinc-600">|</span>
          <span className="text-zinc-500">MODE: <span className="text-cyan-400 font-bold">G6 CONTROL CENTER</span></span>
        </div>
      </div>

      {/* Main Grid: Left-Center Context Core Dial + Right 2x3 Stacked Modules */}
      <div className="grid grid-cols-12 gap-3 flex-1 min-h-0">
        {/* Left-Center Column (7 cols): Main Context Core Dial */}
        <div className="col-span-7 gcc-module rounded p-3 flex flex-col justify-between">
          <ContextCore />
        </div>

        {/* Right Column (5 cols): Stacked GIGABYTE Control Modules */}
        <div className="col-span-5 flex flex-col gap-2.5 overflow-y-auto pr-1">
          <SystemStatus />
          <AIRuntimePanel />
          <ContextSignals />
        </div>
      </div>

      {/* Bottom Area: Sliders & History Strip */}
      <div className="grid grid-cols-12 gap-3 flex-shrink-0">
        <div className="col-span-7">
          <SamplingControl />
        </div>
        <div className="col-span-5">
          <RecentContext />
        </div>
      </div>
    </div>
  );
}
