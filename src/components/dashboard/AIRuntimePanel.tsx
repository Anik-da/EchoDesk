import { useEchoDesk } from "@/store/EchoDeskContext";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { Switch } from "@/components/ui/Switch";
import { cn } from "@/utils/cn";

export function AIRuntimePanel() {
  const { aiRuntime } = useEchoDesk();

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <RuntimeItem label="Runtime" value={aiRuntime.accelerator} highlight />
        <RuntimeItem label="Status" value={aiRuntime.status} highlight={aiRuntime.status === "ACTIVE"} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <RuntimeItem label="Inference" value={<><AnimatedNumber value={aiRuntime.inferenceLatency} unit=" ms" /></>} />
        <RuntimeItem label="CPU Overhead" value={<><AnimatedNumber value={aiRuntime.cpuOverhead} unit="%" /></>} />
        <RuntimeItem label="Memory" value={<><AnimatedNumber value={aiRuntime.memory} unit=" MB" /></>} />
        <RuntimeItem label="Models" value={`${aiRuntime.modelCount} local`} />
      </div>
      <div className="flex items-center justify-between border-t border-zinc-800 pt-2">
        <span className="text-[10px] uppercase tracking-wider text-zinc-500">CPU Fallback</span>
        <span className={cn("text-[10px] font-medium uppercase tracking-wider", "text-emerald-400")}>Ready</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-wider text-zinc-500">Cloud</span>
        <div className="flex items-center gap-2">
          <span className={cn("text-[10px] font-medium uppercase tracking-wider", aiRuntime.cloudEnabled ? "text-zinc-400" : "text-zinc-600")}>
            {aiRuntime.cloudEnabled ? "ON" : "OFF"}
          </span>
          <Switch checked={false} onChange={() => {}} size="sm" disabled />
        </div>
      </div>
    </div>
  );
}

function RuntimeItem({ label, value, highlight }: { label: string; value: React.ReactNode; highlight?: boolean }) {
  return (
    <div className="rounded border border-zinc-800 bg-zinc-950/40 px-2 py-1.5">
      <div className="text-[8px] uppercase tracking-wider text-zinc-600">{label}</div>
      <div className={cn(
        "mt-0.5 text-xs font-semibold tabular-nums",
        highlight ? "text-emerald-400" : "text-zinc-300"
      )}>{value}</div>
    </div>
  );
}
