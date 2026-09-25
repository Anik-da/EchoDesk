import { useState, useEffect } from "react";
import { Settings, Minus, Square, X, Info, ShieldCheck, Cpu } from "lucide-react";
import { useEchoDesk } from "@/store/EchoDeskContext";
import { Tooltip } from "@/components/ui/Tooltip";
import { BackendBridge } from "@/services/backendBridge";

export function TopBar() {
  const { privacy, aiRuntime, engineConnectionStatus, setActiveNav } = useEchoDesk();
  const [time, setTime] = useState("");

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }));
    };
    update();
    const i = setInterval(update, 1000);
    return () => clearInterval(i);
  }, []);

  const isElectron = BackendBridge.isElectronAvailable();

  const handleMinimize = () => {
    if (isElectron) (window as any).echoDeskAPI.minimizeWindow();
  };
  const handleMaximize = () => {
    if (isElectron) (window as any).echoDeskAPI.maximizeWindow();
  };
  const handleClose = () => {
    if (isElectron) (window as any).echoDeskAPI.closeWindow();
  };

  return (
    <header className="flex h-10 items-center justify-between border-b border-[#1f2229] bg-[#070709] px-3 select-none">
      {/* Left Status Tag */}
      <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-400">
        <span className="h-1.5 w-1.5 rounded-full bg-lime-400 animate-pulse" />
        <span className="font-bold text-zinc-200">ECHODESK RUNTIME</span>
        <span className="text-zinc-600">|</span>
        <span className="text-zinc-400">{engineConnectionStatus}</span>
      </div>

      {/* Center Title (GIGABYTE Control Center Style) */}
      <div className="text-xs font-mono font-bold tracking-widest text-zinc-100">
        ECHODESK Control Center
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 rounded border border-zinc-800 bg-zinc-900/60 px-2 py-0.5 text-[9px] font-mono text-zinc-300">
          <Cpu className="h-3 w-3 text-cyan-400" />
          <span>{aiRuntime.accelerator}</span>
        </div>

        <div className="flex items-center gap-1.5 text-[9px] font-mono text-zinc-400">
          <ShieldCheck className={privacy.privateMode ? "text-red-400" : "text-lime-400"} />
          <span>{privacy.privateMode ? "PRIVATE MODE" : "ZERO CLOUD"}</span>
        </div>

        <span className="font-mono text-xs text-zinc-300 tabular-nums">{time}</span>

        <Tooltip label="Settings" side="bottom">
          <button onClick={() => setActiveNav("settings")} className="rounded p-1 text-zinc-400 hover:text-white transition-colors">
            <Settings className="h-3.5 w-3.5" />
          </button>
        </Tooltip>

        {/* Window controls */}
        <div className="flex items-center gap-1.5 border-l border-zinc-800 pl-2">
          <button className="text-zinc-400 hover:text-white p-1">
            <Info className="h-3.5 w-3.5" />
          </button>
          <button onClick={handleMinimize} className="text-zinc-400 hover:text-white p-1">
            <Minus className="h-3.5 w-3.5" />
          </button>
          <button onClick={handleMaximize} className="text-zinc-400 hover:text-white p-1">
            <Square className="h-3 w-3" />
          </button>
          <button onClick={handleClose} className="text-zinc-400 hover:text-red-400 p-1">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
}
