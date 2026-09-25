import { useState } from "react";
import { Camera, Mic, Monitor, Keyboard, ArrowDown, Brain, Cpu } from "lucide-react";
import { useEchoDesk } from "@/store/EchoDeskContext";
import { Panel } from "@/components/ui/Panel";
import { StatusDot } from "@/components/ui/StatusDot";
import { cn } from "@/utils/cn";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  camera: Camera,
  microphone: Mic,
  screen: Monitor,
  activity: Keyboard,
  Camera: Camera,
  Mic: Mic,
  Monitor: Monitor,
  Keyboard: Keyboard
};

export function LiveContextPage() {
  const { signals, events, currentContext, contextConfidence, contextMode, selectedSignal, setSelectedSignal } = useEchoDesk();
  const [hoveredSignal, setHoveredSignal] = useState<string | null>(null);

  const isPrivate = contextMode === "PRIVATE";

  return (
    <div className="flex h-full flex-col gap-3 overflow-y-auto p-4 select-none">
      {/* Header */}
      <div>
        <h1 className="text-lg font-bold tracking-wide text-zinc-100 font-mono">CONTEXT PIPELINE ARCHITECTURE</h1>
        <p className="text-xs text-zinc-500">Live 3-Layer pipeline: Signals → Semantic Events → Context State Inference.</p>
      </div>

      {/* Signal → Event → Context flow */}
      <div className="flex-1 rounded border border-zinc-800 bg-zinc-900/30 p-4">
        <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-4">
          {/* Layer 1: Signals */}
          <div className="space-y-2">
            <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-500 mb-2 border-l-2 border-emerald-500 pl-2">
              Layer 1 — Hardware Signals
            </div>
            {signals.map((s) => {
              const Icon = iconMap[s.id] || iconMap[s.icon] || Camera;
              const active = hoveredSignal === s.id || selectedSignal?.id === s.id;
              return (
                <div
                  key={s.id}
                  onClick={() => setSelectedSignal(selectedSignal?.id === s.id ? null : s)}
                  onMouseEnter={() => setHoveredSignal(s.id)}
                  onMouseLeave={() => setHoveredSignal(null)}
                  className={cn(
                    "flex items-center gap-2.5 rounded border px-3 py-2 cursor-pointer transition-all font-mono",
                    active ? "border-emerald-500/40 bg-emerald-500/5" : "border-zinc-800 bg-zinc-950/40 hover:border-zinc-700",
                    !s.enabled && "opacity-40"
                  )}
                >
                  <Icon className={cn("h-4 w-4", active ? "text-emerald-400" : "text-zinc-500")} />
                  <div className="flex-1 overflow-hidden">
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="text-xs font-semibold uppercase tracking-wider text-zinc-200 truncate">{s.label}</span>
                      <StatusDot state={s.state} />
                    </div>
                    <div className="text-[9px] text-zinc-500 truncate">{s.description}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Arrow column */}
          <div className="flex flex-col gap-4 pt-6">
            {signals.map((s) => (
              <ArrowDown key={s.id} className={cn(
                "h-4 w-4 transition-opacity",
                s.enabled ? "text-emerald-500/50" : "text-zinc-800"
              )} style={{ transform: "rotate(-90deg)" }} />
            ))}
          </div>

          {/* Layer 2: Semantic Events */}
          <div className="space-y-2">
            <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-500 mb-2 border-l-2 border-cyan-500 pl-2">
              Layer 2 — Semantic Events
            </div>
            {events.length > 0 ? (
              events.map((e, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2.5 rounded border border-cyan-500/30 bg-cyan-500/5 px-3 py-2 transition-all font-mono"
                >
                  <div className="flex h-5 w-5 items-center justify-center rounded bg-cyan-500/20 text-cyan-400 text-[10px] font-bold">
                    ✓
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-semibold text-zinc-200">{(e as any).type || e.label}</div>
                    <div className="text-[9px] text-zinc-500">Confidence: <span className="text-cyan-400 font-bold">{e.confidence}%</span></div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded border border-zinc-800 bg-zinc-950/40 p-3 text-[10px] font-mono text-zinc-500 text-center">
                {isPrivate ? "PAUSED (PRIVACY)" : "NO ACTIVE SEMANTIC EVENTS"}
              </div>
            )}
          </div>

          {/* Arrow to context */}
          <div className="flex flex-col items-center gap-2 pt-6">
            <ArrowDown key="arrow" className="h-5 w-5 text-emerald-500/50" style={{ transform: "rotate(-90deg)" }} />
          </div>

          {/* Layer 3: Current Context */}
          <div className="space-y-2">
            <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-500 mb-2 border-l-2 border-emerald-500 pl-2">
              Layer 3 — Inferred Context
            </div>
            <div className={cn(
              "rounded border p-4 transition-all font-mono",
              isPrivate ? "border-red-500/40 bg-red-500/5" : "border-emerald-500/30 bg-emerald-500/5"
            )}>
              <div className="flex items-center gap-2 mb-2">
                <Brain className={cn("h-4 w-4", isPrivate ? "text-red-400" : "text-emerald-400")} />
                <span className="text-[9px] uppercase tracking-wider text-zinc-500">Context Engine</span>
              </div>
              <div className={cn(
                "text-base font-bold tracking-wide",
                isPrivate ? "text-red-400" : "text-emerald-400"
              )}>
                {isPrivate ? "PAUSED (PRIVACY)" : currentContext}
              </div>
              <div className="mt-2 flex items-center gap-1.5 border-t border-zinc-800/80 pt-2 text-[10px] text-zinc-400">
                <Cpu className="h-3.5 w-3.5 text-cyan-400" />
                <span>
                  {isPrivate ? "Zero Inference" : `${contextConfidence}% CONFIDENCE · TEMPORAL SMOOTHING`}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Signal detail panel */}
      {selectedSignal && (
        <Panel title={`Signal Detail — ${selectedSignal.label}`} accent className="ed-fade-enter">
          <div className="grid grid-cols-4 gap-3 font-mono">
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
      <div className="mt-0.5 text-xs font-semibold text-zinc-300">{value}</div>
    </div>
  );
}
