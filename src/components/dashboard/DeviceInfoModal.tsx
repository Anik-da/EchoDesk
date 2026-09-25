import { X, Cpu, HardDrive, MemoryStick, Shield, Battery, Gauge, Laptop } from "lucide-react";
import { useEchoDesk } from "@/store/EchoDeskContext";

export function DeviceInfoModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { deviceInfo, systemStatus, aiRuntime, telemetryMode, setTelemetryMode } = useEchoDesk();

  if (!isOpen) return null;

  const d = deviceInfo;
  const isLive = telemetryMode === "LIVE";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 font-mono select-none">
      <div className="w-full max-w-2xl rounded-lg border border-zinc-800 bg-[#0d0f12] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3 bg-[#11141a]">
          <div className="flex items-center gap-2">
            <Laptop className="w-4 h-4 text-lime-400" />
            <span className="text-xs font-bold text-zinc-100 uppercase tracking-wider">
              Windows Hardware Telemetry & Device Information
            </span>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Switcher Banner */}
        <div className="flex items-center justify-between px-4 py-2 bg-zinc-950 border-b border-zinc-800/80 text-[11px]">
          <div className="flex items-center gap-2">
            <span className="text-zinc-400 uppercase">Current Telemetry Mode:</span>
            {isLive ? (
              <span className="px-2 py-0.5 rounded bg-lime-950 border border-lime-500/60 text-lime-400 font-bold">
                ● LIVE HARDWARE
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded bg-amber-950 border border-amber-500/60 text-amber-400 font-bold">
                ▲ DEVELOPMENT SIMULATION (DEMO)
              </span>
            )}
          </div>
          <button
            onClick={() => setTelemetryMode(isLive ? "SIMULATION" : "LIVE")}
            className="px-2.5 py-1 rounded border border-zinc-700 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 text-[10px] transition-colors"
          >
            Switch to {isLive ? "Development Simulation" : "Live Hardware"}
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-4 space-y-4 overflow-y-auto text-xs">
          {/* 1. Device Identification */}
          <div>
            <div className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider mb-2 border-l-2 border-lime-400 pl-2">
              Device Identity
            </div>
            <div className="grid grid-cols-2 gap-2">
              <SpecItem label="Manufacturer" value={d?.manufacturer || "Detecting..."} />
              <SpecItem label="Model" value={d?.model || "Detecting..."} />
              <SpecItem label="Operating System" value={d?.os_name || d?.os || "Desktop OS"} />
              <SpecItem label="System Architecture" value={d?.architecture || "Detecting..."} />
            </div>
          </div>

          {/* 2. Processor & Memory */}
          <div>
            <div className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider mb-2 border-l-2 border-cyan-400 pl-2">
              Processor & Memory
            </div>
            <div className="grid grid-cols-2 gap-2">
              <SpecItem label="CPU Processor" value={d?.cpu?.name || "Detecting..."} colSpan={2} />
              <SpecItem label="Physical Cores" value={d?.cpu?.cores ? `${d.cpu.cores} Physical Cores` : "Unavailable"} />
              <SpecItem label="Logical Threads" value={d?.cpu?.threads ? `${d.cpu.threads} Threads` : "Unavailable"} />
              <SpecItem
                label="RAM Memory"
                value={d?.memory ? `${d.memory.used_gb} / ${d.memory.total_gb} GB (${d.memory.usage_percent}%)` : "Unavailable"}
              />
              <SpecItem
                label="Available Memory"
                value={d?.memory?.available_gb ? `${d.memory.available_gb} GB free` : "Unavailable"}
              />
            </div>
          </div>

          {/* 3. Graphics & Storage */}
          <div>
            <div className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider mb-2 border-l-2 border-amber-400 pl-2">
              Graphics & Storage Volumes
            </div>
            <div className="space-y-2">
              {d?.gpu && d.gpu.length > 0 ? (
                d.gpu.map((g: any, idx: number) => (
                  <div key={idx} className="rounded border border-zinc-800 bg-zinc-950/60 p-2 text-[11px] flex justify-between items-center">
                    <div>
                      <span className="font-bold text-zinc-200">{g.name}</span>
                      <span className="ml-2 text-zinc-500 text-[10px]">({g.status})</span>
                    </div>
                    <div className="text-right">
                      {g.usage_percent !== null ? (
                        <span className="text-lime-400 font-bold mr-3">{g.usage_percent}% Load</span>
                      ) : (
                        <span className="text-zinc-500 mr-3">Load: Unavailable</span>
                      )}
                      {g.temperature_c !== null ? (
                        <span className="text-cyan-400 font-bold">{g.temperature_c}°C</span>
                      ) : (
                        <span className="text-zinc-500">Temp: Unavailable</span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <SpecItem label="GPU" value="Standard Display Controller" />
              )}

              {d?.storage && d.storage.length > 0 ? (
                d.storage.map((disk: any, idx: number) => (
                  <div key={idx} className="rounded border border-zinc-800 bg-zinc-950/60 p-2 text-[11px] flex justify-between items-center">
                    <div>
                      <span className="font-bold text-zinc-200">{disk.drive || disk.mount}</span>
                      <span className="ml-2 text-zinc-500 text-[10px]">{disk.used_gb} GB used of {disk.total_gb} GB</span>
                    </div>
                    <span className="text-lime-400 font-bold">{disk.usage_percent}% full</span>
                  </div>
                ))
              ) : (
                <SpecItem label="Storage" value="Local Fixed Disk" />
              )}
            </div>
          </div>

          {/* 4. AI Hardware & Acceleration */}
          <div>
            <div className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider mb-2 border-l-2 border-purple-400 pl-2">
              AI Hardware & Accelerator
            </div>
            <div className="grid grid-cols-2 gap-2">
              <SpecItem
                label="Snapdragon NPU"
                value={d?.ai_runtime?.npu_available ? "Active" : "Not detected"}
                highlight={d?.ai_runtime?.npu_available ? "green" : "zinc"}
              />
              <SpecItem
                label="Qualcomm QNN SDK"
                value={d?.ai_runtime?.qnn_available ? "Available" : "Not supported on host"}
                highlight={d?.ai_runtime?.qnn_available ? "green" : "zinc"}
              />
              <SpecItem
                label="Execution Provider"
                value={`${d?.ai_runtime?.provider ?? "CPU"} Provider`}
              />
              <SpecItem
                label="Inference Latency"
                value={aiRuntime.inferenceLatency !== null ? `${aiRuntime.inferenceLatency} ms (measured)` : "Unavailable"}
              />
            </div>
          </div>

          {/* 5. Thermal & Power Telemetry */}
          <div>
            <div className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider mb-2 border-l-2 border-rose-400 pl-2">
              Thermal & Power Telemetry
            </div>
            <div className="grid grid-cols-2 gap-2">
              <SpecItem
                label="Battery"
                value={
                  d?.battery?.available && d?.battery?.percent !== null
                    ? `${d.battery.percent}% (${d.battery.charging ? "Charging" : "Discharging"})`
                    : "Not available (Desktop/No battery)"
                }
              />
              <SpecItem label="Power Connection" value={d?.battery?.power_state ?? "AC Connected"} />
              <SpecItem
                label="CPU Temperature"
                value={systemStatus.cpuTemp !== null ? `${systemStatus.cpuTemp}°C` : "Unavailable"}
              />
              <SpecItem
                label="GPU Temperature"
                value={systemStatus.gpuTemp !== null ? `${systemStatus.gpuTemp}°C` : "Unavailable"}
              />
              <SpecItem
                label="CPU Fan Speed"
                value={systemStatus.cpuFanRpm !== null ? `${systemStatus.cpuFanRpm} RPM` : "Unavailable"}
              />
              <SpecItem
                label="GPU Fan Speed"
                value={systemStatus.gpuFanRpm !== null ? `${systemStatus.gpuFanRpm} RPM` : "Unavailable"}
              />
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="border-t border-zinc-800 px-4 py-2.5 bg-[#11141a] flex justify-between items-center text-[10px] text-zinc-500">
          <span>Real-time telemetry queries verified against Windows native APIs & hardware drivers.</span>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded font-bold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function SpecItem({
  label,
  value,
  colSpan = 1,
  highlight = "zinc",
}: {
  label: string;
  value: string;
  colSpan?: number;
  highlight?: "green" | "zinc" | "amber";
}) {
  const textColor =
    highlight === "green"
      ? "text-lime-400 font-bold"
      : highlight === "amber"
      ? "text-amber-400 font-bold"
      : "text-zinc-200 font-semibold";

  return (
    <div
      className={`rounded border border-zinc-800/80 bg-zinc-950/60 p-2 ${
        colSpan === 2 ? "col-span-2" : "col-span-1"
      }`}
    >
      <div className="text-[9px] uppercase text-zinc-500">{label}</div>
      <div className={`mt-0.5 text-[11px] truncate ${textColor}`}>{value}</div>
    </div>
  );
}
