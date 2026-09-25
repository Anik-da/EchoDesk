import { Camera, Mic, Monitor, Keyboard } from "lucide-react";
import { useEchoDesk } from "@/store/EchoDeskContext";
import { Switch } from "@/components/ui/Switch";
import { StatusDot } from "@/components/ui/StatusDot";
import { cn } from "@/utils/cn";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Camera,
  Mic,
  Monitor,
  Keyboard,
};

export function ContextSignals() {
  const { signals, toggleSensor, setSelectedSignal } = useEchoDesk();

  return (
    <div className="space-y-1.5">
      {signals.map((s) => {
        const Icon = iconMap[s.icon] ?? Camera;
        return (
          <div
            key={s.id}
            className="group flex items-center gap-2.5 rounded border border-zinc-800/60 bg-zinc-950/30 px-2 py-1.5 transition-colors hover:border-zinc-700"
            onClick={() => setSelectedSignal(s)}
            role="button"
          >
            <Icon className={cn("h-3.5 w-3.5 flex-shrink-0", s.enabled ? "text-zinc-400" : "text-zinc-700")} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">{s.label}</span>
                <StatusDot state={s.state} />
              </div>
              <div className="text-[9px] text-zinc-600 truncate">{s.description}</div>
            </div>
            {/* Activity bar */}
            <div className="w-8 h-1 rounded-full bg-zinc-800 overflow-hidden flex-shrink-0">
              <div
                className="h-full rounded-full bg-emerald-400/60 transition-all duration-500"
                style={{ width: `${s.activityLevel}%` }}
              />
            </div>
            <div onClick={(e) => e.stopPropagation()}>
              <Switch checked={s.enabled} onChange={() => toggleSensor(s.id)} size="sm" />
            </div>
          </div>
        );
      })}
    </div>
  );
}
