import { useEchoDesk } from "@/store/EchoDeskContext";
import { ModeSelector } from "@/components/ui/ModeSelector";
import { cn } from "@/utils/cn";

const samplingInfo: Record<string, { hz: string; latency: string; desc: string }> = {
  "LOW POWER": { hz: "1 Hz", latency: "50 ms", desc: "Conservative sampling" },
  "BALANCED": { hz: "5 Hz", latency: "32 ms", desc: "Optimal balance" },
  "REAL-TIME": { hz: "10 Hz", latency: "22 ms", desc: "Maximum responsiveness" },
};

export function SamplingControl() {
  const { samplingMode, setSamplingMode } = useEchoDesk();
  const info = samplingInfo[samplingMode];

  return (
    <div className="flex items-center gap-4">
      <div className="flex-shrink-0">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">AI Sampling</div>
        <div className="mono text-xs text-emerald-400">{info.hz}</div>
      </div>
      <div className="flex-1">
        <ModeSelector
          options={[
            { label: "Low Power", value: "LOW POWER" },
            { label: "Balanced", value: "BALANCED" },
            { label: "Real-Time", value: "REAL-TIME" },
          ]}
          value={samplingMode}
          onChange={(v) => setSamplingMode(v as typeof samplingMode)}
        />
      </div>
      <div className="flex-shrink-0 text-right">
        <div className="text-[9px] uppercase tracking-wider text-zinc-600">{info.desc}</div>
        <div className="mono text-[10px] text-zinc-500">~{info.latency} inference</div>
      </div>
    </div>
  );
}
