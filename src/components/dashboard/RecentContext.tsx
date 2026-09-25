import { ArrowRight, Clock } from "lucide-react";
import { useEchoDesk } from "@/store/EchoDeskContext";
import { cn } from "@/utils/cn";

const contextColors: Record<string, string> = {
  FOCUS: "text-lime-400 border-lime-500/30 bg-lime-500/10",
  "DEEP FOCUS": "text-lime-400 border-lime-500/30 bg-lime-500/10",
  CONVERSATION: "text-cyan-400 border-cyan-500/30 bg-cyan-500/10",
  COLLABORATION: "text-blue-400 border-blue-500/30 bg-blue-500/10",
  MEETING: "text-amber-400 border-amber-500/30 bg-amber-500/10",
  BREAK: "text-zinc-400 border-zinc-700 bg-zinc-800/30",
};

export function RecentContext() {
  const { timeline, setActiveNav } = useEchoDesk();
  const recent = timeline.slice(0, 5);

  return (
    <div className="gcc-module rounded p-2.5 font-mono text-xs select-none space-y-2">
      <div className="flex items-center justify-between border-b border-zinc-800/80 pb-1.5">
        <div className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 text-lime-400" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-300">
            Recent Context History
          </span>
        </div>
        <button
          onClick={() => setActiveNav("timeline")}
          className="flex items-center gap-1 rounded bg-zinc-900 border border-zinc-800 px-2 py-0.5 text-[8px] uppercase font-bold text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          <span>View Timeline</span>
          <ArrowRight className="h-3 w-3" />
        </button>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto">
        {recent.map((event) => (
          <div
            key={event.id}
            className={cn(
              "flex items-center gap-2 rounded border px-2 py-1 flex-shrink-0 font-mono transition-colors hover:border-zinc-500",
              contextColors[event.context] ?? "text-zinc-400 border-zinc-800 bg-zinc-950/40"
            )}
          >
            <span className="text-[9px] text-zinc-500 tabular-nums">{event.time}</span>
            <span className="text-[9px] font-bold uppercase">{event.context}</span>
            <span className="text-[8px] text-zinc-500">({event.duration}m)</span>
          </div>
        ))}
      </div>
    </div>
  );
}
