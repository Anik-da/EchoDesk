import { useState } from "react";
import { Settings, Minus, Square, X, Clock, ShieldCheck, Activity, Cpu } from "lucide-react";
import { useEchoDesk } from "@/store/EchoDeskContext";
import { Tooltip } from "@/components/ui/Tooltip";
import { StatusDot } from "@/components/ui/StatusDot";
import { BackgroundPopover } from "@/components/BackgroundPopover";
import { cn } from "@/utils/cn";
import { useEffect } from "react";

export function TopBar() {
  const { privacy, aiRuntime, liveSimulation, toggleLiveSimulation } = useEchoDesk();
  const [time, setTime] = useState("");
  const [bgOpen, setBgOpen] = useState(false);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }));
    };
    update();
    const i = setInterval(update, 1000);
    return () => clearInterval(i);
  }, []);

  const sensingActive = !privacy.privateMode;

  return (
    <header className="flex h-12 items-center justify-between border-b border-zinc-800 bg-zinc-950/90 px-3 backdrop-blur">
      {/* Left: Logo */}
      <div className="flex items-center gap-2.5">
        <div className="flex h-6 w-6 items-center justify-center rounded bg-gradient-to-br from-emerald-400 to-emerald-600">
          <Activity className="h-3.5 w-3.5 text-zinc-950" strokeWidth={2.5} />
        </div>
        <div className="flex flex-col leading-none">
          <span className="text-sm font-bold tracking-wide text-zinc-100">ECHODESK</span>
          <span className="text-[8px] font-medium uppercase tracking-[0.2em] text-emerald-400/70">Context Engine</span>
        </div>
      </div>

      {/* Right: Status indicators + controls */}
      <div className="flex items-center gap-4">
        {/* Live Simulation toggle */}
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] uppercase tracking-wider text-zinc-500">Live Sim</span>
          <button
            onClick={toggleLiveSimulation}
            className={cn(
              "rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider transition-colors",
              liveSimulation ? "bg-emerald-500/20 text-emerald-300" : "bg-zinc-800 text-zinc-500"
            )}
          >
            {liveSimulation ? "ON" : "OFF"}
          </button>
        </div>

        {/* LOCAL AI indicator */}
        <div className="flex items-center gap-1.5">
          <StatusDot state="active" />
          <span className="text-[9px] uppercase tracking-wider text-zinc-400">Local AI</span>
        </div>

        {/* SENSING indicator */}
        <div className="flex items-center gap-1.5">
          <StatusDot state={sensingActive ? "active" : "off"} />
          <span className="text-[9px] uppercase tracking-wider text-zinc-400">Sensing</span>
        </div>

        {/* PRIVATE MODE */}
        <div className={cn(
          "flex items-center gap-1.5 rounded px-2 py-0.5 transition-colors",
          privacy.privateMode ? "bg-emerald-500/15 ring-1 ring-emerald-500/30" : ""
        )}>
          <ShieldCheck className={cn("h-3 w-3", privacy.privateMode ? "text-emerald-400" : "text-zinc-500")} />
          <span className={cn(
            "text-[9px] font-semibold uppercase tracking-wider",
            privacy.privateMode ? "text-emerald-300" : "text-zinc-500"
          )}>Private Mode</span>
        </div>

        {/* AI Runtime quick indicator */}
        <div className="flex items-center gap-1.5">
          <Cpu className="h-3 w-3 text-cyan-400/70" />
          <span className="text-[9px] uppercase tracking-wider text-zinc-400">{aiRuntime.accelerator}</span>
        </div>

        {/* Time */}
        <div className="flex items-center gap-1 text-zinc-400">
          <Clock className="h-3 w-3" />
          <span className="mono text-xs tabular-nums">{time}</span>
        </div>

        {/* Settings */}
        <Tooltip label="Settings" side="bottom">
          <button className="rounded p-1 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300">
            <Settings className="h-3.5 w-3.5" />
          </button>
        </Tooltip>

        {/* Background running control */}
        <BackgroundPopover open={bgOpen} onToggle={() => setBgOpen(!bgOpen)} />

        {/* Window controls */}
        <div className="flex items-center gap-1 border-l border-zinc-800 pl-3">
          <button className="rounded p-1 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300">
            <Minus className="h-3 w-3" />
          </button>
          <button className="rounded p-1 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300">
            <Square className="h-2.5 w-2.5" />
          </button>
          <button className="rounded p-1 text-zinc-500 transition-colors hover:bg-red-500/80 hover:text-white">
            <X className="h-3 w-3" />
          </button>
        </div>
      </div>
    </header>
  );
}
