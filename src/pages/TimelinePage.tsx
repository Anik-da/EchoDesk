import { useState, useMemo } from "react";
import { Calendar, Filter, Clock } from "lucide-react";
import { useEchoDesk } from "@/store/EchoDeskContext";
import { Panel } from "@/components/ui/Panel";
import { cn } from "@/utils/cn";
import { formatDuration } from "@/utils/cn";

const contextColors: Record<string, string> = {
  FOCUS: "bg-emerald-500/80",
  CONVERSATION: "bg-cyan-500/80",
  COLLABORATION: "bg-blue-500/80",
  MEETING: "bg-amber-500/80",
  BREAK: "bg-zinc-600",
};

const contextTextColors: Record<string, string> = {
  FOCUS: "text-emerald-400",
  CONVERSATION: "text-cyan-400",
  COLLABORATION: "text-blue-400",
  MEETING: "text-amber-400",
  BREAK: "text-zinc-400",
};

const filters = ["ALL", "FOCUS", "MEETING", "COLLABORATION", "CONVERSATION", "BREAK"];

export function TimelinePage() {
  const { timeline, selectedTimelineEvent, setSelectedTimelineEvent } = useEchoDesk();
  const [activeFilter, setActiveFilter] = useState("ALL");

  const filtered = useMemo(() => {
    if (activeFilter === "ALL") return timeline;
    return timeline.filter((e) => e.context === activeFilter);
  }, [activeFilter, timeline]);

  // Calculate timeline range
  const startHour = 9;
  const endHour = 12;
  const totalMinutes = (endHour - startHour) * 60;

  return (
    <div className="flex h-full flex-col gap-3 overflow-y-auto p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold tracking-wide text-zinc-100">CONTEXT TIMELINE</h1>
          <p className="text-xs text-zinc-500">Semantic activity, not recordings.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 rounded border border-zinc-800 bg-zinc-900/50 px-3 py-1.5 text-xs text-zinc-400 hover:border-zinc-700 hover:text-zinc-200 transition-colors">
            <Calendar className="h-3.5 w-3.5" />
            Today
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <Filter className="h-3.5 w-3.5 text-zinc-600" />
        <div className="flex gap-1">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={cn(
                "rounded px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider transition-all",
                activeFilter === f
                  ? "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/40"
                  : "bg-zinc-800/50 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div className="flex-1 rounded border border-zinc-800 bg-zinc-900/30 p-4">
        {/* Hour labels */}
        <div className="flex justify-between mb-2 px-2">
          {[9, 10, 11, 12].map((h) => (
            <span key={h} className="mono text-[9px] text-zinc-600">{String(h).padStart(2, "0")}:00</span>
          ))}
        </div>

        {/* Timeline bar */}
        <div className="relative h-16 rounded border border-zinc-800 bg-zinc-950/40 overflow-hidden">
          {/* Hour grid lines */}
          {[0, 25, 50, 75].map((pct) => (
            <div key={pct} className="absolute top-0 bottom-0 border-l border-zinc-800/50" style={{ left: `${pct}%` }} />
          ))}
          {filtered.map((event) => {
            const startMin = (event.hour - startHour) * 60 + event.minute;
            const leftPct = (startMin / totalMinutes) * 100;
            const widthPct = (event.duration / totalMinutes) * 100;
            return (
              <button
                key={event.id}
                onClick={() => setSelectedTimelineEvent(event)}
                className={cn(
                  "absolute top-2 bottom-2 rounded transition-all hover:opacity-80 hover:ring-2 hover:ring-zinc-500/40",
                  contextColors[event.context] ?? "bg-zinc-600",
                  selectedTimelineEvent?.id === event.id && "ring-2 ring-white/30"
                )}
                style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                title={`${event.time} — ${event.context} (${formatDuration(event.duration)})`}
              >
                <span className="absolute left-1 top-1 text-[9px] font-semibold uppercase tracking-wider text-zinc-950/90 truncate">
                  {event.context}
                </span>
              </button>
            );
          })}
        </div>

        {/* Event list */}
        <div className="mt-4 space-y-1">
          {filtered.map((event) => (
            <button
              key={event.id}
              onClick={() => setSelectedTimelineEvent(event)}
              className={cn(
                "flex w-full items-center gap-3 rounded border px-3 py-2 transition-all text-left",
                selectedTimelineEvent?.id === event.id
                  ? "border-zinc-600 bg-zinc-800/40"
                  : "border-zinc-800/60 bg-zinc-950/20 hover:border-zinc-700 hover:bg-zinc-900/30"
              )}
            >
              <span className="mono text-xs tabular-nums text-zinc-400 w-12">{event.time}</span>
              <span className={cn("text-xs font-semibold uppercase tracking-wider w-32", contextTextColors[event.context])}>
                {event.context}
              </span>
              <span className="flex items-center gap-1 text-[10px] text-zinc-500">
                <Clock className="h-3 w-3" />
                {formatDuration(event.duration)}
              </span>
              <span className="mono text-[10px] text-zinc-600 ml-auto">{event.confidence}% confidence</span>
            </button>
          ))}
        </div>
      </div>

      {/* Event detail panel */}
      {selectedTimelineEvent && (
        <Panel title="Event Detail" accent className="ed-fade-enter">
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <div>
                <div className="text-[9px] uppercase tracking-wider text-zinc-600">State</div>
                <div className={cn("text-sm font-bold", contextTextColors[selectedTimelineEvent.context])}>
                  {selectedTimelineEvent.context}
                </div>
              </div>
              <div>
                <div className="text-[9px] uppercase tracking-wider text-zinc-600">Time</div>
                <div className="mono text-sm text-zinc-300">{selectedTimelineEvent.time}</div>
              </div>
              <div>
                <div className="text-[9px] uppercase tracking-wider text-zinc-600">Duration</div>
                <div className="mono text-sm text-zinc-300">{formatDuration(selectedTimelineEvent.duration)}</div>
              </div>
              <div>
                <div className="text-[9px] uppercase tracking-wider text-zinc-600">Confidence</div>
                <div className="mono text-sm text-zinc-300">{selectedTimelineEvent.confidence}%</div>
              </div>
            </div>

            <div>
              <div className="text-[9px] uppercase tracking-wider text-zinc-600 mb-1">Contributing Signals</div>
              <div className="flex flex-wrap gap-1.5">
                {selectedTimelineEvent.signals.map((sig) => (
                  <span key={sig} className="rounded bg-zinc-800/60 px-2 py-0.5 text-[10px] text-zinc-400">
                    {sig}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <div className="text-[9px] uppercase tracking-wider text-zinc-600 mb-1">Explanation</div>
              <p className="text-xs text-zinc-400 leading-relaxed">{selectedTimelineEvent.explanation}</p>
            </div>
          </div>
        </Panel>
      )}
    </div>
  );
}
