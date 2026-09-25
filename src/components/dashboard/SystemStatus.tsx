import { Cpu, HardDrive, MemoryStick, Battery, Plug, Fan, Thermometer, Zap } from "lucide-react";
import { useEchoDesk } from "@/store/EchoDeskContext";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { cn } from "@/utils/cn";

export function SystemStatus() {
  const { systemStatus: s } = useEchoDesk();

  return (
    <div className="space-y-2.5">
      <BarRow icon={Cpu} label="CPU" value={<AnimatedNumber value={s.cpu} unit="%" />} pct={s.cpu} />
      <BarRow icon={Zap} label="GPU" value={<AnimatedNumber value={s.gpu} unit="%" />} pct={s.gpu} />

      {/* RAM */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <MemoryStick className="h-3 w-3 text-zinc-500" />
            <span className="text-[10px] uppercase tracking-wider text-zinc-500">RAM</span>
          </div>
          <span className="mono text-[11px] tabular-nums text-zinc-300">
            <AnimatedNumber value={s.ramUsed} decimals={1} /> / {s.ramTotal} GB
          </span>
        </div>
        <MiniBar pct={(s.ramUsed / s.ramTotal) * 100} />
      </div>

      {/* Storage */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <HardDrive className="h-3 w-3 text-zinc-500" />
            <span className="text-[10px] uppercase tracking-wider text-zinc-500">Storage</span>
          </div>
          <span className="mono text-[11px] tabular-nums text-zinc-300">
            <AnimatedNumber value={s.storageUsed} unit=" GB" /> / {s.storageTotal} GB
          </span>
        </div>
        <MiniBar pct={(s.storageUsed / s.storageTotal) * 100} />
      </div>

      {/* Battery + Power */}
      <div className="flex items-center justify-between border-t border-zinc-800 pt-2">
        <div className="flex items-center gap-1.5">
          <Battery className="h-3 w-3 text-zinc-500" />
          <span className="text-[10px] uppercase tracking-wider text-zinc-500">Battery</span>
        </div>
        <span className="mono text-[11px] tabular-nums text-zinc-300">
          <AnimatedNumber value={s.battery} unit="%" />
        </span>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Plug className="h-3 w-3 text-zinc-500" />
          <span className="text-[10px] uppercase tracking-wider text-zinc-500">Power</span>
        </div>
        <span className={cn("text-[10px] font-medium uppercase tracking-wider", s.powerConnected ? "text-emerald-400" : "text-zinc-400")}>
          AC Connected
        </span>
      </div>

      {/* Fan + Temp */}
      <div className="grid grid-cols-2 gap-2 border-t border-zinc-800 pt-2">
        <div>
          <div className="flex items-center gap-1 text-zinc-500">
            <Fan className="h-3 w-3" />
            <span className="text-[9px] uppercase tracking-wider">Fan</span>
          </div>
          <div className="mt-0.5 mono text-[10px] tabular-nums text-zinc-300">
            CPU <AnimatedNumber value={s.cpuFanRpm} /> RPM
          </div>
          <div className="mono text-[10px] tabular-nums text-zinc-500">
            GPU {s.gpuFanRpm} RPM
          </div>
        </div>
        <div>
          <div className="flex items-center gap-1 text-zinc-500">
            <Thermometer className="h-3 w-3" />
            <span className="text-[9px] uppercase tracking-wider">Temp</span>
          </div>
          <div className="mt-0.5 mono text-[10px] tabular-nums text-zinc-300">
            CPU <AnimatedNumber value={s.cpuTemp} unit="°C" />
          </div>
          <div className="mono text-[10px] tabular-nums text-zinc-500">
            GPU <AnimatedNumber value={s.gpuTemp} unit="°C" />
          </div>
        </div>
      </div>
    </div>
  );
}

function BarRow({ icon: Icon, label, value, pct }: { icon: React.ComponentType<{ className?: string }>; label: string; value: React.ReactNode; pct: number }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Icon className="h-3 w-3 text-zinc-500" />
          <span className="text-[10px] uppercase tracking-wider text-zinc-500">{label}</span>
        </div>
        <span className="mono text-[11px] tabular-nums text-zinc-300">{value}</span>
      </div>
      <MiniBar pct={pct} />
    </div>
  );
}

function MiniBar({ pct }: { pct: number }) {
  return (
    <div className="h-1 w-full overflow-hidden rounded-full bg-zinc-800">
      <div
        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-700"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
