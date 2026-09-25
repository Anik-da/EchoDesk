import { ArrowRight } from "lucide-react";
import { useEchoDesk } from "@/store/EchoDeskContext";
import { cn } from "@/utils/cn";

const contextColors: Record<string, string> = {
  FOCUS: "text-emerald-400 border-emerald-500/20 bg-emerald-500/5",
  CONVERSATION: "text-cyan-400 border-cyan-500/20 bg-cyan-500/5",
  COLLABORATION: "text-blue-400 border-blue-500/20 bg-blue-500/5",
  MEETING: "text-amber-400 border-amber-500/20 bg-amber-500/5",
  BREAK: "text-zinc-400 border-zinc-700 bg-zinc-800/30",
};

export function RecentContext() {
  const { timeline, setActiveNav } = useEchoDesk();
  const recent = timeline.slice(0, 5);

  return (
    <div className="flex items-center gap-3">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 flex-shrink-0">Recent Context</span>
      <div className="flex flex-1 items-center gap-2 overflow-x-auto">
        {recent.map((event) => (
          <div
            key={event.id}
            className={cn(
              "flex items-center gap-2 rounded border px-2 py-1 flex-shrink-0 transition-colors hover:border-zinc-600",
              contextColors[event.context] ?? "text-zinc-400 border-zinc-700 bg-zinc-800/30"
            )}
          >
            <span className="mono text-[10px] tabular-nums text-zinc-500">{event.time}</span>
            <span className="text-[10px] font-semibold uppercase tracking-wider">{event.context}</span>
          </div>
        ))}
      </div>
      <button
        onClick={() => setActiveNav("timeline")}
        className="flex items-center gap-1 rounded px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300 flex-shrink-0"
      >
        View Timeline
        <ArrowRight className="h-3 w-3" />
      </button>
    </div>
  );
}
