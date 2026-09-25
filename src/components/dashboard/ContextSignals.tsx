import { Camera, Mic, Monitor, Keyboard, Shield } from "lucide-react";
import { useEchoDesk } from "@/store/EchoDeskContext";
import { cn } from "@/utils/cn";

export function ContextSignals() {
  const { signals, toggleSensor, privacy, togglePrivateMode } = useEchoDesk();

  return (
    <div className="gcc-module rounded p-2.5 font-mono text-xs select-none space-y-2">
      <div className="text-[9px] uppercase tracking-wider text-zinc-400 border-l-2 border-lime-400 pl-1.5 font-bold">
        Context Signals Preference
      </div>

      {/* Grid of Square Toggle Tiles (GIGABYTE Preference Module Style) */}
      <div className="grid grid-cols-2 gap-2">
        {signals.map((sig) => {
          const icons: Record<string, any> = { camera: Camera, microphone: Mic, screen: Monitor, activity: Keyboard };
          const Icon = icons[sig.id] || Camera;
          const active = sig.enabled && !privacy.privateMode;

          return (
            <button
              key={sig.id}
              onClick={() => toggleSensor(sig.id)}
              className={cn(
                "flex flex-col items-center justify-center p-2 rounded border transition-all duration-150",
                active
                  ? "border-lime-500/50 bg-lime-500/10 text-lime-400 shadow-sm"
                  : "border-zinc-800/80 bg-zinc-950/40 text-zinc-600 hover:border-zinc-700"
              )}
            >
              <Icon className="h-4 w-4 mb-1" />
              <span className="text-[9px] font-bold uppercase truncate">{sig.label}</span>
              <span className={cn(
                "mt-0.5 rounded px-1 text-[8px] font-bold uppercase",
                active ? "bg-lime-500/20 text-lime-400" : "bg-zinc-900 text-zinc-600"
              )}>
                {active ? "ACTIVE" : "OFF"}
              </span>
            </button>
          );
        })}
      </div>

      {/* Private Mode Tile */}
      <button
        onClick={togglePrivateMode}
        className={cn(
          "w-full flex items-center justify-between p-2 rounded border transition-all duration-150 text-[9px] uppercase font-bold",
          privacy.privateMode
            ? "border-red-500/50 bg-red-500/10 text-red-400"
            : "border-zinc-800 bg-zinc-950/40 text-zinc-400 hover:border-zinc-700"
        )}
      >
        <div className="flex items-center gap-1.5">
          <Shield className="h-3.5 w-3.5" />
          <span>PRIVATE MODE</span>
        </div>
        <span className={cn(
          "rounded px-1.5 py-0.5 text-[8px]",
          privacy.privateMode ? "bg-red-500/20 text-red-400" : "bg-zinc-900 text-zinc-500"
        )}>
          {privacy.privateMode ? "ON" : "OFF"}
        </span>
      </button>
    </div>
  );
}
