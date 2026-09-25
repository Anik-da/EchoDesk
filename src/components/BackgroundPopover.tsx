import { Pause, ShieldCheck, LayoutDashboard, X } from "lucide-react";
import { useEchoDesk } from "@/store/EchoDeskContext";
import { StatusDot } from "@/components/ui/StatusDot";
import { cn } from "@/utils/cn";

interface BackgroundPopoverProps {
  open: boolean;
  onToggle: () => void;
}

export function BackgroundPopover({ open, onToggle }: BackgroundPopoverProps) {
  const { background, setBackground, togglePrivateMode, setActiveNav, privacy } = useEchoDesk();

  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className={cn(
          "flex items-center gap-1.5 rounded px-2 py-0.5 transition-colors",
          "bg-zinc-800/60 hover:bg-zinc-800",
          open && "bg-zinc-800"
        )}
      >
        <span className={cn(
          "inline-block h-1.5 w-1.5 rounded-full ed-pulse",
          background.running ? "bg-emerald-400" : "bg-zinc-500"
        )} />
        <span className="text-[9px] uppercase tracking-wider text-zinc-400">Running</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={onToggle} />
          <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-lg border border-zinc-700 bg-zinc-950 shadow-2xl ed-fade-enter">
            <div className="border-b border-zinc-800 px-4 py-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold tracking-wide text-zinc-100">ECHODESK</div>
                  <div className="text-[8px] uppercase tracking-[0.2em] text-emerald-400/70">Context Engine</div>
                </div>
                <button onClick={onToggle} className="text-zinc-500 hover:text-zinc-300">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div className="px-4 py-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-400">Background Engine</span>
                <span className="text-xs font-medium text-emerald-400">Running</span>
              </div>

              <div className="space-y-1.5 pt-1">
                <PopoverRow label="Camera" state={privacy.cameraActive ? "active" : "off"} />
                <PopoverRow label="Microphone" state={privacy.microphoneActive ? "active" : "off"} />
                <PopoverRow label="Screen" state={privacy.screenActive ? "active" : "off"} />
                <PopoverRow label="Cloud" state={background.cloud ? "active" : "off"} text={background.cloud ? "Enabled" : "Disabled"} />
              </div>
            </div>

            <div className="border-t border-zinc-800 p-2 space-y-1">
              <button
                onClick={() => {
                  setBackground({ ...background, running: !background.running });
                }}
                className="flex w-full items-center gap-2 rounded px-3 py-1.5 text-xs text-zinc-300 transition-colors hover:bg-zinc-800"
              >
                <Pause className="h-3 w-3" />
                {background.running ? "Pause" : "Resume"}
              </button>
              <button
                onClick={() => {
                  togglePrivateMode();
                  onToggle();
                }}
                className="flex w-full items-center gap-2 rounded px-3 py-1.5 text-xs text-zinc-300 transition-colors hover:bg-zinc-800"
              >
                <ShieldCheck className="h-3 w-3" />
                Private Mode
              </button>
              <button
                onClick={() => {
                  setActiveNav("system");
                  onToggle();
                }}
                className="flex w-full items-center gap-2 rounded px-3 py-1.5 text-xs text-zinc-300 transition-colors hover:bg-zinc-800"
              >
                <LayoutDashboard className="h-3 w-3" />
                Open Dashboard
              </button>
              <button
                className="flex w-full items-center gap-2 rounded px-3 py-1.5 text-xs text-zinc-300 transition-colors hover:bg-zinc-800"
              >
                <X className="h-3 w-3" />
                Exit
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function PopoverRow({ label, state, text }: { label: string; state: "active" | "off"; text?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[11px] text-zinc-500">{label}</span>
      <div className="flex items-center gap-1.5">
        <StatusDot state={state} />
        <span className={cn("text-[11px]", state === "active" ? "text-zinc-300" : "text-zinc-600")}>
          {text ?? (state === "active" ? "Active" : "Off")}
        </span>
      </div>
    </div>
  );
}
