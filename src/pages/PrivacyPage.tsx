import { useState } from "react";
import { ShieldCheck, Plus, Trash2, Camera, Mic, Monitor, Brain, Clock, Eye, EyeOff } from "lucide-react";
import { useEchoDesk } from "@/store/EchoDeskContext";
import { Panel } from "@/components/ui/Panel";
import { Switch } from "@/components/ui/Switch";
import { cn } from "@/utils/cn";
import type { RetentionPeriod } from "@/types";

const retentionOptions: RetentionPeriod[] = ["1 day", "7 days", "30 days", "Never"];

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Landmark: ShieldCheck,
  KeyRound: ShieldCheck,
  Globe: ShieldCheck,
  MessageSquare: ShieldCheck,
  Shield: ShieldCheck,
};

export function PrivacyPage() {
  const { privacy, togglePrivateMode, protectedApps, toggleProtectedApp, removeProtectedApp, addProtectedApp, setPrivacy } = useEchoDesk();
  const [showAdd, setShowAdd] = useState(false);
  const [newAppName, setNewAppName] = useState("");
  const [hoveredStep, setHoveredStep] = useState<string | null>(null);

  const pipelineSteps = [
    { id: "raw", label: "RAW SENSOR INPUT", icon: Camera, desc: "Camera frame, audio buffer, screen context, keyboard input" },
    { id: "process", label: "LOCAL PROCESSING", icon: Brain, desc: "On-device model extracts semantic events only" },
    { id: "event", label: "SEMANTIC EVENT", icon: Eye, desc: "User present, speech detected, typing activity" },
    { id: "discard", label: "RAW INPUT DISCARDED", icon: EyeOff, desc: "All raw data is immediately deleted after processing" },
  ];

  const examples = [
    { input: "CAMERA FRAME", output: "USER PRESENT", discard: "RAW FRAME DISCARDED" },
    { input: "AUDIO BUFFER", output: "SPEECH DETECTED", discard: "RAW AUDIO DISCARDED" },
    { input: "SCREEN CONTEXT", output: "VS CODE ACTIVE", discard: "RAW SCREENSHOT DISCARDED" },
  ];

  return (
    <div className="flex h-full flex-col gap-3 overflow-y-auto p-4">
      <div>
        <h1 className="text-lg font-bold tracking-wide text-zinc-100">PRIVACY CONTROL</h1>
        <p className="text-xs text-zinc-500">On-device processing. Raw data never leaves your machine.</p>
      </div>

      {/* Private Mode main panel */}
      <div className={cn(
        "rounded border p-4 transition-all",
        privacy.privateMode ? "border-emerald-500/40 bg-emerald-500/5" : "border-zinc-800 bg-zinc-900/40"
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "flex h-10 w-10 items-center justify-center rounded-lg transition-colors",
              privacy.privateMode ? "bg-emerald-500/20" : "bg-zinc-800"
            )}>
              <ShieldCheck className={cn("h-5 w-5", privacy.privateMode ? "text-emerald-400" : "text-zinc-500")} />
            </div>
            <div>
              <div className="text-sm font-bold tracking-wide text-zinc-100">PRIVATE MODE</div>
              <div className={cn(
                "text-xs",
                privacy.privateMode ? "text-emerald-400" : "text-zinc-500"
              )}>
                {privacy.privateMode ? "PRIVATE MODE ACTIVE" : "SENSING ACTIVE"}
              </div>
            </div>
          </div>
          <button
            onClick={togglePrivateMode}
            className={cn(
              "rounded px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-all",
              privacy.privateMode
                ? "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/40 hover:bg-emerald-500/30"
                : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
            )}
          >
            {privacy.privateMode ? "Resume Sensing" : "Pause Sensing"}
          </button>
        </div>

        {/* Status grid */}
        <div className="mt-4 grid grid-cols-5 gap-2">
          <PrivacyStatusItem icon={Camera} label="Camera" active={privacy.cameraActive} />
          <PrivacyStatusItem icon={Mic} label="Microphone" active={privacy.microphoneActive} />
          <PrivacyStatusItem icon={Monitor} label="Screen" active={privacy.screenActive} />
          <PrivacyStatusItem icon={Brain} label="Context Engine" active={!privacy.historyPaused} />
          <PrivacyStatusItem icon={Clock} label="History" active={!privacy.historyPaused} />
        </div>
      </div>

      {/* Privacy Pipeline */}
      <Panel title="Privacy Pipeline" accent>
        <div className="space-y-3">
          {/* Flow steps */}
          <div className="flex items-center gap-2">
            {pipelineSteps.map((step, i) => {
              const Icon = step.icon;
              const active = hoveredStep === step.id;
              return (
                <div key={step.id} className="flex items-center gap-2 flex-1">
                  <div
                    onMouseEnter={() => setHoveredStep(step.id)}
                    onMouseLeave={() => setHoveredStep(null)}
                    className={cn(
                      "flex flex-1 flex-col items-center gap-1.5 rounded border px-2 py-2.5 transition-all cursor-pointer",
                      active ? "border-emerald-500/40 bg-emerald-500/5" : "border-zinc-800 bg-zinc-950/30"
                    )}
                  >
                    <Icon className={cn("h-4 w-4", active ? "text-emerald-400" : "text-zinc-500")} />
                    <span className="text-[9px] font-semibold uppercase tracking-wider text-zinc-400 text-center">{step.label}</span>
                  </div>
                  {i < pipelineSteps.length - 1 && (
                    <span className="text-emerald-500/30 text-lg">→</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Hovered step description */}
          {hoveredStep && (
            <div className="rounded border border-zinc-800 bg-zinc-950/40 px-3 py-2 text-xs text-zinc-400 ed-fade-enter">
              {pipelineSteps.find((s) => s.id === hoveredStep)?.desc}
            </div>
          )}

          {/* Examples */}
          <div className="grid grid-cols-3 gap-2 border-t border-zinc-800 pt-2">
            {examples.map((ex) => (
              <div key={ex.input} className="rounded border border-zinc-800 bg-zinc-950/30 p-2 space-y-1">
                <div className="text-[9px] uppercase tracking-wider text-zinc-600">{ex.input}</div>
                <div className="text-[10px] text-emerald-400">→ {ex.output}</div>
                <div className="text-[9px] text-zinc-600">→ {ex.discard}</div>
              </div>
            ))}
          </div>
        </div>
      </Panel>

      <div className="grid grid-cols-2 gap-3">
        {/* Protected Applications */}
        <Panel title="Protected Applications" accent>
          <div className="space-y-1.5">
            {protectedApps.map((app) => {
              const Icon = iconMap[app.icon] ?? ShieldCheck;
              return (
                <div
                  key={app.id}
                  className="group flex items-center gap-2.5 rounded border border-zinc-800/60 bg-zinc-950/30 px-2.5 py-2 transition-colors hover:border-zinc-700"
                >
                  <Icon className={cn("h-3.5 w-3.5", app.protected ? "text-emerald-400" : "text-zinc-600")} />
                  <span className="flex-1 text-xs text-zinc-300">{app.name}</span>
                  <span className={cn(
                    "text-[9px] font-semibold uppercase tracking-wider",
                    app.protected ? "text-emerald-400" : "text-zinc-600"
                  )}>
                    {app.protected ? "Protected" : "Unprotected"}
                  </span>
                  <div onClick={(e) => e.stopPropagation()}>
                    <Switch checked={app.protected} onChange={() => toggleProtectedApp(app.id)} size="sm" />
                  </div>
                  <button
                    onClick={() => removeProtectedApp(app.id)}
                    className="text-zinc-700 opacity-0 transition-all hover:text-red-400 group-hover:opacity-100"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              );
            })}

            {showAdd ? (
              <div className="flex gap-1.5">
                <input
                  autoFocus
                  value={newAppName}
                  onChange={(e) => setNewAppName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newAppName.trim()) {
                      addProtectedApp(newAppName.trim());
                      setNewAppName("");
                      setShowAdd(false);
                    }
                  }}
                  placeholder="Application name..."
                  className="flex-1 rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50"
                />
                <button
                  onClick={() => {
                    if (newAppName.trim()) {
                      addProtectedApp(newAppName.trim());
                      setNewAppName("");
                      setShowAdd(false);
                    }
                  }}
                  className="rounded bg-emerald-500/20 px-2 py-1 text-[10px] font-semibold text-emerald-300 hover:bg-emerald-500/30"
                >
                  Add
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowAdd(true)}
                className="flex w-full items-center justify-center gap-1.5 rounded border border-dashed border-zinc-800 px-2.5 py-2 text-[10px] text-zinc-500 transition-colors hover:border-zinc-700 hover:text-zinc-300"
              >
                <Plus className="h-3 w-3" />
                Add Application
              </button>
            )}
          </div>
        </Panel>

        {/* Data Retention */}
        <Panel title="Data Retention" accent>
          <div className="space-y-3">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1.5">Context History</div>
              <div className="flex gap-1">
                {retentionOptions.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setPrivacy({ ...privacy, retention: opt })}
                    className={cn(
                      "rounded px-2 py-1 text-[10px] font-semibold uppercase tracking-wider transition-all",
                      privacy.retention === opt
                        ? "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/40"
                        : "bg-zinc-800/50 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
                    )}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5 border-t border-zinc-800 pt-2">
              <RetentionRow label="Semantic events" value="LOCAL ONLY" />
              <RetentionRow label="Raw video" value="NEVER STORED" />
              <RetentionRow label="Raw audio" value="NEVER STORED" />
              <RetentionRow label="Screenshots" value="NEVER STORED" />
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}

function PrivacyStatusItem({ icon: Icon, label, active }: { icon: React.ComponentType<{ className?: string }>; label: string; active: boolean }) {
  return (
    <div className={cn(
      "flex flex-col items-center gap-1 rounded border px-1 py-2 transition-colors",
      active ? "border-zinc-700 bg-zinc-900/50" : "border-zinc-800/40 bg-zinc-950/20"
    )}>
      <Icon className={cn("h-3.5 w-3.5", active ? "text-emerald-400" : "text-zinc-700")} />
      <span className="text-[8px] uppercase tracking-wider text-zinc-600 text-center">{label}</span>
      <span className={cn("text-[9px] font-semibold", active ? "text-emerald-400" : "text-zinc-600")}>
        {active ? "ACTIVE" : "OFF"}
      </span>
    </div>
  );
}

function RetentionRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[10px] uppercase tracking-wider text-zinc-500">{label}</span>
      <span className="text-[10px] font-semibold text-zinc-400">{value}</span>
    </div>
  );
}
