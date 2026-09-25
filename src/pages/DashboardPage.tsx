import { useEchoDesk } from "@/store/EchoDeskContext";
import { ModeSelector } from "@/components/ui/ModeSelector";
import { ContextCore } from "@/components/ContextCore";
import { Panel } from "@/components/ui/Panel";
import { SystemStatus } from "@/components/dashboard/SystemStatus";
import { AIRuntimePanel } from "@/components/dashboard/AIRuntimePanel";
import { ContextSignals } from "@/components/dashboard/ContextSignals";
import { PrivacyPanel } from "@/components/dashboard/PrivacyPanel";
import { SamplingControl } from "@/components/dashboard/SamplingControl";
import { RecentContext } from "@/components/dashboard/RecentContext";
import { cn } from "@/utils/cn";

export function DashboardPage() {
  const { contextMode, setContextMode, currentContext, contextSubtitle, contextConfidence, contextSignals } = useEchoDesk();

  return (
    <div className="flex h-full flex-col gap-3 overflow-y-auto p-3">
      {/* Top section: current state header */}
      <div className="flex items-center justify-between rounded border border-zinc-800 bg-zinc-900/40 px-4 py-2.5">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-500">Current System State</div>
          <div className="mt-0.5 flex items-baseline gap-3">
            <span className={cn(
              "text-xl font-bold tracking-wide",
              contextMode === "PRIVATE" ? "text-zinc-500" : "text-emerald-400"
            )}>{currentContext}</span>
            <span className="text-xs text-zinc-500">{contextSubtitle}</span>
          </div>
          <div className="mt-1 flex items-center gap-3">
            <span className="text-[10px] uppercase tracking-wider text-zinc-600">
              Confidence <span className="mono text-zinc-400">{contextConfidence}%</span>
            </span>
            <div className="flex items-center gap-1.5">
              {contextSignals.map((sig) => (
                <span key={sig} className="rounded bg-zinc-800/60 px-1.5 py-0.5 text-[8px] uppercase tracking-wider text-zinc-500">
                  {sig}
                </span>
              ))}
            </div>
          </div>
        </div>
        {/* Mode selector */}
        <div className="flex flex-col items-end gap-1.5">
          <span className="text-[9px] uppercase tracking-wider text-zinc-600">Context Mode</span>
          <ModeSelector
            options={[
              { label: "Deep Focus", value: "DEEP FOCUS" },
              { label: "Balanced", value: "BALANCED" },
              { label: "Collaboration", value: "COLLABORATION" },
              { label: "Meeting", value: "MEETING" },
              { label: "Private", value: "PRIVATE" },
            ]}
            value={contextMode}
            onChange={(v) => setContextMode(v as typeof contextMode)}
            size="sm"
          />
        </div>
      </div>

      {/* Main content: Context Core + Right panels */}
      <div className="flex gap-3 flex-1 min-h-0">
        {/* Left: Context Core */}
        <div className="flex flex-1 flex-col items-center justify-center rounded border border-zinc-800 bg-zinc-900/30 p-4">
          <ContextCore />
        </div>

        {/* Right: Stacked modules */}
        <div className="flex w-[340px] flex-col gap-3 flex-shrink-0 overflow-y-auto">
          <Panel title="System Status" accent>
            <SystemStatus />
          </Panel>
          <Panel title="AI Runtime" accent>
            <AIRuntimePanel />
          </Panel>
          <Panel title="Context Signals" accent>
            <ContextSignals />
          </Panel>
          <Panel title="Privacy" accent>
            <PrivacyPanel />
          </Panel>
        </div>
      </div>

      {/* Bottom: Controls + Recent Context */}
      <div className="flex gap-3 flex-shrink-0">
        <div className="flex-1 rounded border border-zinc-800 bg-zinc-900/40 px-4 py-2.5">
          <SamplingControl />
        </div>
        <div className="flex-[2] rounded border border-zinc-800 bg-zinc-900/40 px-4 py-2.5">
          <RecentContext />
        </div>
      </div>
    </div>
  );
}
