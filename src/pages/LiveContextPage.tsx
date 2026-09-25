import { useState } from "react";
import { Camera, Mic, Monitor, Keyboard, ArrowDown, Brain, Sparkles } from "lucide-react";
import { useEchoDesk } from "@/store/EchoDeskContext";
import { Panel } from "@/components/ui/Panel";
import { StatusDot } from "@/components/ui/StatusDot";
import { cn } from "@/utils/cn";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Camera,
  Mic,
  Monitor,
  Keyboard,
};

const eventSourceMap: Record<string, string[]> = {
  camera: ["person"],
  microphone: ["speech", "noise"],
  screen: ["vscode"],
  activity: ["typing"],
};

export function LiveContextPage() {
  const { signals, events, currentContext, contextConfidence, contextMode, selectedSignal, setSelectedSignal } = useEchoDesk();
  const [hoveredSignal, setHoveredSignal] = useState<string | null>(null);

  const isPrivate = contextMode === "PRIVATE";

  return (
    <div className="flex h-full flex-col gap-3 overflow-y-auto p-4">
      {/* Header */}
      <div>
        <h1 className="text-lg font-bold tracking-wide text-zinc-100">CONTEXT ENGINE</h1>
        <p className="text-xs text-zinc-500">What EchoDesk currently understands.</p>
      </div>

      {/* Signal → Event → Context flow */}
      <div className="flex-1 rounded border border-zinc-800 bg-zinc-900/30 p-4">
        <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-4">
          {/* Layer 1: Signals */}
          <div className="space-y-2">
            <div className="text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-500 mb-2">Layer 1 — Signals</div>
            {signals.map((s) => {
              const Icon = iconMap[s.icon] ?? Camera;
              const active = hoveredSignal === s.id || selectedSignal?.id === s.id;
              return (
                <div
                  key={s.id}
                  onClick={() => setSelectedSignal(selectedSignal?.id === s.id ? null : s)}
                  onMouseEnter={() => setHoveredSignal(s.id)}
                  onMouseLeave={() => setHoveredSignal(null)}
                  className={cn(
                    "flex items-center gap-2.5 rounded border px-3 py-2 cursor-pointer transition-all",
                    active ? "border-emerald-500/40 bg-emerald-500/5" : "border-zinc-800 bg-zinc-950/30 hover:border-zinc-700",
                    !s.enabled && "opacity-40"
                  )}
                >
                  <Icon className={cn("h-4 w-4", active ? "text-emerald-400" : "text-zinc-500")} />
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold uppercase tracking-wider text-zinc-300">{s.label}</span>
                      <StatusDot state={s.state} />
                    </div>
                    <div className="text-[10px] text-zinc-600">{s.description}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Arrow column */}
          <div className="flex flex-col gap-3 pt-8">
            {signals.map((s) => (
              <ArrowDown key={s.id} className={cn(
                "h-4 w-4 transition-opacity",
                s.enabled ? "text-emerald-500/40" : "text-zinc-800"
              )} style={{ transform: "rotate(-90deg)" }} />
            ))}
          </div>

          {/* Layer 2: Semantic Events */}
          <div className="space-y-2">
            <div className="text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-500 mb-2">Layer 2 — Semantic Events</div>
            {events.map((e) => {
              const sourceActive = signals.find((s) => s.id === e.source)?.enabled;
              return (
                <div
                  key={e.id}
                  className={cn(
                    "flex items-center gap-2.5 rounded border px-3 py-2 transition-all",
                    e.detected && sourceActive
                      ? "border-cyan-500/30 bg-cyan-500/5"
                      : "border-zinc-800 bg-zinc-950/30",
                    !sourceActive && "opacity-40"
                  )}
                >
                  <div className={cn(
                    "flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold",
                    e.detected && sourceActive ? "bg-cyan-500/20 text-cyan-400" : "bg-zinc-800 text-zinc-600"
                  )}>
                    {e.detected ? "✓" : "—"}
                  </div>
                  <div className="flex-1">
                    <span className="text-xs font-medium text-zinc-300">{e.label}</span>
                    <span className="ml-2 mono text-[10px] text-zinc-600">{e.confidence}%</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Arrow to context */}
          <div className="flex flex-col items-center gap-2 pt-8">
            <ArrowDown key="arrow" className="h-5 w-5 text-emerald-500/40" style={{ transform: "rotate(-90deg)" }} />
          </div>

          {/* Layer 3: Current Context */}
          <div className="space-y-2">
            <div className="text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-500 mb-2">Layer 3 — Current Context</div>
            <div className={cn(
              "rounded border p-4 transition-all",
              isPrivate ? "border-zinc-800 bg-zinc-950/30" : "border-emerald-500/30 bg-emerald-500/5"
            )}>
              <div className="flex items-center gap-2 mb-2">
                <Brain className={cn("h-4 w-4", isPrivate ? "text-zinc-600" : "text-emerald-400")} />
                <span className="text-[10px] uppercase tracking-wider text-zinc-500">Context Engine</span>
              </div>
              <div className={cn(
                "text-base font-bold tracking-wide",
                isPrivate ? "text-zinc-600" : "text-emerald-400"
              )}>
                {isPrivate ? "PAUSED" : `${currentContext} SESSION`}
              </div>
              <div className="mt-1 flex items-center gap-1.5">
                <Sparkles className="h-3 w-3 text-zinc-600" />
                <span className="mono text-[10px] text-zinc-500">
                  {isPrivate ? "No inference" : `${contextConfidence}% confidence`}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Signal detail panel */}
      {selectedSignal && (
        <Panel title={`Signal Detail — ${selectedSignal.label}`} accent className="ed-fade-enter">
          <div className="grid grid-cols-4 gap-3">
            <DetailItem label="State" value={selectedSignal.state.toUpperCase()} />
            <DetailItem label="Activity" value={`${selectedSignal.activityLevel}%`} />
            <DetailItem label="Enabled" value={selectedSignal.enabled ? "Yes" : "No"} />
            <DetailItem label="Description" value={selectedSignal.description} />
          </div>
        </Panel>
      )}
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-zinc-800 bg-zinc-950/40 px-2.5 py-1.5">
      <div className="text-[8px] uppercase tracking-wider text-zinc-600">{label}</div>
      <div className="mt-0.5 text-xs font-medium text-zinc-300">{value}</div>
    </div>
  );
}
