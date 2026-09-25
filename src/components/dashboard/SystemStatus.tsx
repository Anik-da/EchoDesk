import { Cpu, Zap, HardDrive, MemoryStick, Fan, Thermometer } from "lucide-react";
import { useEchoDesk } from "@/store/EchoDeskContext";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";

export function SystemStatus() {
  const { systemStatus: s } = useEchoDesk();

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
                  strokeDashoffset={88 - (88 * (s.ramUsed / s.ramTotal))}
                />
              </svg>
              <span className="absolute text-[10px] font-bold text-zinc-100">{Math.round((s.ramUsed / s.ramTotal) * 100)}%</span>
            </div>
            <div>
              <div className="text-[9px] uppercase text-zinc-400">Memory</div>
              <div className="text-[11px] font-bold text-zinc-200">{s.ramUsed}GB</div>
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
                  strokeDashoffset={88 - (88 * (s.storageUsed / s.storageTotal))}
                />
              </svg>
              <span className="absolute text-[10px] font-bold text-zinc-100">{Math.round((s.storageUsed / s.storageTotal) * 100)}%</span>
            </div>
            <div>
              <div className="text-[9px] uppercase text-zinc-400">Storage</div>
              <div className="text-[11px] font-bold text-zinc-200">{s.storageUsed}GB</div>
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
                  strokeDashoffset={88 - (88 * (s.cpuFanRpm / 6000))}
                />
              </svg>
              <span className="absolute text-[9px] font-bold text-cyan-400">{Math.round((s.cpuFanRpm / 6000) * 100)}%</span>
            </div>
            <div>
              <div className="text-[8px] uppercase text-zinc-400">CPU FAN</div>
              <div className="text-[10px] font-bold text-zinc-200">{s.cpuFanRpm} RPM</div>
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
                  strokeDashoffset={88 - (88 * (s.gpuFanRpm / 6000))}
                />
              </svg>
              <span className="absolute text-[9px] font-bold text-cyan-400">{Math.round((s.gpuFanRpm / 6000) * 100)}%</span>
            </div>
            <div>
              <div className="text-[8px] uppercase text-zinc-400">GPU FAN</div>
              <div className="text-[10px] font-bold text-zinc-200">{s.gpuFanRpm} RPM</div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. GPU / System Telemetry Bars */}
      <div className="gcc-module rounded p-2.5 space-y-2">
        <div className="text-[9px] uppercase tracking-wider text-zinc-400 border-l-2 border-amber-400 pl-1.5 font-bold">
          System Information
        </div>
        <BarItem label="CPU Clock / Load" value={`${s.cpu}%`} pct={s.cpu} />
        <BarItem label="GPU Clock / Utilization" value={`${s.gpu}%`} pct={s.gpu} />
        <div className="flex items-center justify-between text-[10px] border-t border-zinc-800/80 pt-1.5">
          <span className="text-zinc-500 uppercase">CPU TEMP</span>
          <span className="text-zinc-200 font-bold">{s.cpuTemp}°C</span>
          <span className="text-zinc-500 uppercase">GPU TEMP</span>
          <span className="text-zinc-200 font-bold">{s.gpuTemp}°C</span>
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
        <div className="h-full bg-lime-400 transition-all duration-300" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
