import { useState } from "react";
import { useEchoDesk } from "@/store/EchoDeskContext";
import { ContextCore } from "@/components/ContextCore";
import { SystemStatus } from "@/components/dashboard/SystemStatus";
import { AIRuntimePanel } from "@/components/dashboard/AIRuntimePanel";
import { ContextSignals } from "@/components/dashboard/ContextSignals";
import { SamplingControl } from "@/components/dashboard/SamplingControl";
import { RecentContext } from "@/components/dashboard/RecentContext";
import { DeviceInfoModal } from "@/components/dashboard/DeviceInfoModal";
import { Info, Laptop } from "lucide-react";

export function DashboardPage() {
  const { currentContext, telemetryMode, setTelemetryMode, deviceInfo } = useEchoDesk();
  const [showDeviceModal, setShowDeviceModal] = useState(false);

  const isLive = telemetryMode === "LIVE";
  const mfg = deviceInfo?.manufacturer || "Detecting Device...";
  const model = deviceInfo?.model || "";
  const osName = deviceInfo?.os_name || deviceInfo?.os || "Desktop OS";
  const arch = deviceInfo?.architecture || "";
  const cpu = deviceInfo?.cpu?.name || "Detecting CPU...";
  const primaryGpu = deviceInfo?.gpu?.[0]?.name;

  return (
    <div className="flex h-full flex-col gap-2 overflow-y-auto p-3 select-none">
      {/* Hardware Subheader Banner */}
      <div className="flex items-center justify-between border-b border-[#1f2229] pb-1.5 px-1 font-mono text-[10px] text-zinc-400">
        <div className="flex items-center gap-2">
          <span className="text-cyan-400 font-bold uppercase tracking-wider">THIS DEVICE:</span>
          <span className="text-zinc-200 font-semibold">{mfg} {model}</span>
          <span className="text-zinc-600">|</span>
          <span className="text-zinc-300">{osName} {arch ? `(${arch})` : ""}</span>
          <span className="text-zinc-600">|</span>
          <span className="text-zinc-400 truncate max-w-xs">{cpu}</span>
          {primaryGpu && (
            <>
              <span className="text-zinc-600">|</span>
              <span className="text-zinc-400 truncate max-w-xs">{primaryGpu}</span>
            </>
          )}
          <button
            onClick={() => setShowDeviceModal(true)}
            className="ml-2 inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-zinc-700 bg-zinc-800/80 hover:bg-zinc-700 text-[9px] text-zinc-200 transition-colors"
            title="View complete device hardware specifications"
          >
            <Info className="w-3 h-3 text-cyan-400" />
            <span>DEVICE SPECS</span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          {/* Obvious Telemetry Mode Badge */}
          {isLive ? (
            <span
              onClick={() => setTelemetryMode("SIMULATION")}
              className="cursor-pointer px-2 py-0.5 rounded bg-lime-950/80 border border-lime-500/60 text-lime-400 font-bold tracking-wider hover:bg-lime-900/60 transition-colors"
              title="Click to switch to Development Simulation Mode"
            >
              ● LIVE HARDWARE
            </span>
          ) : (
            <span
              onClick={() => setTelemetryMode("LIVE")}
              className="cursor-pointer px-2 py-0.5 rounded bg-amber-950/80 border border-amber-500/60 text-amber-400 font-bold tracking-wider hover:bg-amber-900/60 transition-colors"
              title="Click to switch to Live Hardware Mode"
            >
              ▲ DEMO DATA (SIMULATION)
            </span>
          )}

          <span className="text-zinc-600">|</span>
          <span className="text-zinc-500">STATE: <span className="text-lime-400 font-bold">{currentContext}</span></span>
        </div>
      </div>

      <DeviceInfoModal isOpen={showDeviceModal} onClose={() => setShowDeviceModal(false)} />

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
