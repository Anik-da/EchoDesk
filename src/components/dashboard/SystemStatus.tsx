import { Cpu, Zap, HardDrive, MemoryStick, Fan, Thermometer } from "lucide-react";
import { useEchoDesk } from "@/store/EchoDeskContext";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";

export function SystemStatus() {
  const { systemStatus: s, deviceInfo } = useEchoDesk();

  const ramPct = s.ramTotal > 0 ? Math.round((s.ramUsed / s.ramTotal) * 100) : 0;
  const storagePct = (s.storageUsed !== null && s.storageTotal && s.storageTotal > 0)
    ? Math.round((s.storageUsed / s.storageTotal) * 100)
    : null;

  return (
    <div className="space-y-3 font-mono text-xs select-none">
      {/* 1. Memory and Storage (Dual Circular Meters - GIGABYTE Style) */}
      <div className="gcc-module rounded p-2.5">
        <div className="text-[9px] uppercase tracking-wider text-zinc-400 mb-2 border-l-2 border-lime-400 pl-1.5 font-bold">
          Memory & Storage
        </div>
        <div className="grid grid-cols-2 gap-2">
          {/* Memory Circle Meter */}
          <div className="flex items-center gap-2">
            <div className="relative flex items-center justify-center w-12 h-12">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                <circle cx="18" cy="18" r="14" fill="none" stroke="#1c1f28" strokeWidth="3" />
                <circle
                  cx="18" cy="18" r="14" fill="none" stroke="#84cc16" strokeWidth="3"
                  strokeDasharray="88"
                  strokeDashoffset={88 - (88 * (ramPct / 100))}
                />
              </svg>
              <span className="absolute text-[10px] font-bold text-zinc-100">{ramPct}%</span>
            </div>
            <div>
              <div className="text-[9px] uppercase text-zinc-400">Memory</div>
              <div className="text-[11px] font-bold text-zinc-200">{s.ramUsed} / {s.ramTotal} GB</div>
            </div>
          </div>

          {/* Storage Circle Meter */}
          <div className="flex items-center gap-2">
            <div className="relative flex items-center justify-center w-12 h-12">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                <circle cx="18" cy="18" r="14" fill="none" stroke="#1c1f28" strokeWidth="3" />
                <circle
                  cx="18" cy="18" r="14" fill="none" stroke="#84cc16" strokeWidth="3"
                  strokeDasharray="88"
                  strokeDashoffset={storagePct !== null ? 88 - (88 * (storagePct / 100)) : 88}
                />
              </svg>
              <span className="absolute text-[10px] font-bold text-zinc-100">{storagePct !== null ? `${storagePct}%` : "--"}</span>
            </div>
            <div>
              <div className="text-[9px] uppercase text-zinc-400 truncate max-w-[100px]" title={deviceInfo?.storage?.[0]?.drive || "Primary Volume"}>
                {deviceInfo?.storage?.[0]?.drive || "Storage"}
              </div>
              <div className="text-[10px] font-bold text-zinc-200">
                {s.storageUsed !== null && s.storageTotal ? `${s.storageUsed} / ${s.storageTotal} GB` : "Unavailable"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Fan Speed & Temperature Meters (Dual Circular Meters - GIGABYTE Style) */}
      <div className="gcc-module rounded p-2.5">
        <div className="text-[9px] uppercase tracking-wider text-zinc-400 mb-2 border-l-2 border-cyan-400 pl-1.5 font-bold">
          Fan Speed & Thermal
        </div>
        <div className="grid grid-cols-2 gap-2">
          {/* CPU Fan Circle */}
          <div className="flex items-center gap-2">
            <div className="relative flex items-center justify-center w-12 h-12">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                <circle cx="18" cy="18" r="14" fill="none" stroke="#1c1f28" strokeWidth="3" />
                <circle
                  cx="18" cy="18" r="14" fill="none" stroke="#06b6d4" strokeWidth="3"
                  strokeDasharray="88"
                  strokeDashoffset={s.cpuFanRpm !== null ? 88 - (88 * (s.cpuFanRpm / 6000)) : 88}
                />
              </svg>
              <span className="absolute text-[9px] font-bold text-cyan-400">
                {s.cpuFanRpm !== null ? `${Math.round((s.cpuFanRpm / 6000) * 100)}%` : "--"}
              </span>
            </div>
            <div>
              <div className="text-[8px] uppercase text-zinc-400">CPU FAN</div>
              <div className="text-[10px] font-bold text-zinc-200">
                {s.cpuFanRpm !== null ? `${s.cpuFanRpm} RPM` : "Unavailable"}
              </div>
            </div>
          </div>

          {/* GPU Fan Circle */}
          <div className="flex items-center gap-2">
            <div className="relative flex items-center justify-center w-12 h-12">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                <circle cx="18" cy="18" r="14" fill="none" stroke="#1c1f28" strokeWidth="3" />
                <circle
                  cx="18" cy="18" r="14" fill="none" stroke="#06b6d4" strokeWidth="3"
                  strokeDasharray="88"
                  strokeDashoffset={s.gpuFanRpm !== null ? 88 - (88 * (s.gpuFanRpm / 6000)) : 88}
                />
              </svg>
              <span className="absolute text-[9px] font-bold text-cyan-400">
                {s.gpuFanRpm !== null ? `${Math.round((s.gpuFanRpm / 6000) * 100)}%` : "--"}
              </span>
            </div>
            <div>
              <div className="text-[8px] uppercase text-zinc-400">GPU FAN</div>
              <div className="text-[10px] font-bold text-zinc-200">
                {s.gpuFanRpm !== null ? `${s.gpuFanRpm} RPM` : "Unavailable"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. GPU / System Telemetry Bars */}
      <div className="gcc-module rounded p-2.5 space-y-2">
        <div className="text-[9px] uppercase tracking-wider text-zinc-400 border-l-2 border-amber-400 pl-1.5 font-bold">
          System Information
        </div>
        <BarItem label="CPU Clock / Load" value={s.cpu !== null ? `${s.cpu}%` : "Unavailable"} pct={s.cpu || 0} />
        <BarItem label="GPU Clock / Utilization" value={s.gpu !== null ? `${s.gpu}%` : "Detected"} pct={s.gpu || 0} />
        <div className="flex items-center justify-between text-[10px] border-t border-zinc-800/80 pt-1.5">
          <span className="text-zinc-500 uppercase">CPU TEMP</span>
          <span className="text-zinc-200 font-bold">{s.cpuTemp !== null ? `${s.cpuTemp}°C` : "Unavailable"}</span>
          <span className="text-zinc-500 uppercase">GPU TEMP</span>
          <span className="text-zinc-200 font-bold">{s.gpuTemp !== null ? `${s.gpuTemp}°C` : "Unavailable"}</span>
        </div>
      </div>
    </div>
  );
}

function BarItem({ label, value, pct }: { label: string; value: string; pct: number }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[9px]">
        <span className="text-zinc-400 uppercase">{label}</span>
        <span className="text-zinc-200 font-bold">{value}</span>
      </div>
      <div className="h-1.5 w-full bg-zinc-900 rounded-sm overflow-hidden">
        <div className="h-full bg-lime-400 transition-all duration-300" style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} />
      </div>
    </div>
  );
}
