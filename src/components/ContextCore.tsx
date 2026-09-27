import { useEffect, useState } from "react";
import { useEchoDesk } from "@/store/EchoDeskContext";
import { useAnimatedNumber } from "@/hooks/useAnimatedNumber";
import { cn } from "@/utils/cn";
import { CheckCircle2, ShieldAlert, Cpu } from "lucide-react";

export function ContextCore() {
  const {
    currentContext,
    contextConfidence,
    contextMode,
    setContextMode,
    signals,
    contextSubtitle,
    aiRuntime,
    systemStatus,
    autoModeEnabled,
    setAutoMode,
    modeReasons,
    systemChanges,
    activeAppInfo
  } = useEchoDesk();

  const animatedConf = useAnimatedNumber(contextConfidence);
  const isPrivate = contextMode === "PRIVATE";

  const userStatus = isPrivate ? "PAUSED" : (signals[0]?.state === "active" ? "PRESENT" : (signals[0]?.state === "off" ? "OFF" : "AWAY"));
  const appDisplay = isPrivate ? "N/A" : (activeAppInfo?.application || "DESKTOP");
  const envStatus = isPrivate ? "N/A" : (signals[1]?.state === "active" ? "SPEECH" : (signals[1]?.state === "off" ? "OFF" : "QUIET"));
  const actStatus = isPrivate ? "NONE" : (signals[3]?.state === "active" ? "ACTIVE" : (signals[3]?.state === "idle" ? "IDLE" : "OFF"));
  const tempDisplay = isPrivate ? "PAUSED" : (systemStatus.gpuTemp !== null ? `${systemStatus.gpuTemp}°C` : (systemStatus.cpuTemp !== null ? `${systemStatus.cpuTemp}°C` : "Unavailable"));

  // Dynamic Color Palette for Every Mode
  const modeThemes: Record<string, { main: string; glow: string; text: string; bg: string; border: string }> = {
    "DEEP FOCUS": { main: "#84cc16", glow: "rgba(132, 204, 22, 0.4)", text: "text-lime-400", bg: "bg-lime-500/20", border: "border-lime-500/40" },
    "BALANCED": { main: "#06b6d4", glow: "rgba(6, 182, 212, 0.4)", text: "text-cyan-400", bg: "bg-cyan-500/20", border: "border-cyan-500/40" },
    "COLLABORATION": { main: "#3b82f6", glow: "rgba(59, 130, 246, 0.4)", text: "text-blue-400", bg: "bg-blue-500/20", border: "border-blue-500/40" },
    "MEETING": { main: "#f59e0b", glow: "rgba(245, 158, 11, 0.4)", text: "text-amber-400", bg: "bg-amber-500/20", border: "border-amber-500/40" },
    "PRIVATE": { main: "#ef4444", glow: "rgba(239, 68, 68, 0.4)", text: "text-red-400", bg: "bg-red-500/20", border: "border-red-500/40" },
  };

  const theme = modeThemes[contextMode] || modeThemes["DEEP FOCUS"];

  const modeOptions = [
    { label: "Deep Focus", value: "DEEP FOCUS" },
    { label: "Balanced", value: "BALANCED" },
    { label: "Collaboration", value: "COLLABORATION" },
    { label: "Meeting", value: "MEETING" },
    { label: "Private", value: "PRIVATE" },
  ];

  return (
    <div className="relative flex flex-col items-center justify-between w-full h-full p-2 select-none font-mono">
      {/* 1. TOP MODE SELECTOR & AUTO MODE TOGGLE BAR */}
      <div className="flex items-center justify-between w-full mb-1">
        <div className="flex items-center gap-1.5 rounded-full bg-[#0a0b0e] p-1 border border-zinc-800/80">
          {modeOptions.map((opt) => {
            const active = contextMode === opt.value;
            const optTheme = modeThemes[opt.value];
            return (
              <button
                key={opt.value}
                onClick={() => setContextMode(opt.value as any)}
                className={cn(
                  "rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider transition-all duration-200",
                  active
                    ? `${optTheme.bg} ${optTheme.text} ${optTheme.border} border shadow-lg`
                    : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900"
                )}
                style={active ? { boxShadow: `0 0 12px ${optTheme.glow}` } : {}}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        {/* Auto Mode Toggle */}
        <button
          onClick={() => setAutoMode(!autoModeEnabled)}
          className={cn(
            "px-2.5 py-1 rounded-full text-[9px] font-bold tracking-wider uppercase border transition-all",
            autoModeEnabled
              ? "bg-lime-950/80 border-lime-500/60 text-lime-400 shadow-sm"
              : "bg-zinc-900 border-zinc-700 text-zinc-500 hover:text-zinc-300"
          )}
          title="Toggle Automatic Mode Selection driven by Context Engine"
        >
          {autoModeEnabled ? "● AUTO MODE: ON" : "○ AUTO MODE: OFF"}
        </button>
      </div>

      {/* 2. CENTRAL SYSTEM DIAL GAUGE */}
      <div className="relative flex-1 w-full flex items-center justify-center min-h-[260px]">
        {/* Radial burst lines */}
        <div className="absolute inset-0 flex items-center justify-center opacity-25 pointer-events-none">
          <svg viewBox="0 0 400 400" className="w-[380px] h-[380px]">
            {Array.from({ length: 72 }).map((_, i) => {
              const angle = (i / 72) * 360;
              const rad = (angle * Math.PI) / 180;
              const x1 = 200 + Math.cos(rad) * 140;
              const y1 = 200 + Math.sin(rad) * 140;
              const x2 = 200 + Math.cos(rad) * 180;
              const y2 = 200 + Math.sin(rad) * 180;
              return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={theme.main} strokeWidth="0.8" opacity="0.4" />;
            })}
          </svg>
        </div>

        {/* MAIN SVG GAUGE */}
        <svg viewBox="0 0 340 340" className="w-full h-full max-w-[320px] max-h-[320px] z-10">
          <defs>
            <filter id="gaugeGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Outer Tachometer Ticks */}
          {[1, 2, 3, 4, 5].map((num, i) => {
            const startAngle = 140;
            const endAngle = 400;
            const angle = startAngle + (i / 4) * (endAngle - startAngle);
            const rad = (angle * Math.PI) / 180;
            const tx = 170 + Math.cos(rad) * 135;
            const ty = 170 + Math.sin(rad) * 135;
            return (
              <text
                key={num}
                x={tx} y={ty}
                fill={theme.main}
                fontSize="12"
                fontWeight="bold"
                fontFamily="monospace"
                textAnchor="middle"
                dominantBaseline="central"
                opacity="0.9"
              >
                {num}
              </text>
            );
          })}

          {/* Outer Tick Mark Ring */}
          {Array.from({ length: 45 }).map((_, i) => {
            const startAngle = 140;
            const endAngle = 400;
            const angle = startAngle + (i / 44) * (endAngle - startAngle);
            const rad = (angle * Math.PI) / 180;
            const isMajor = i % 11 === 0;
            const r1 = 118;
            const r2 = isMajor ? 106 : 112;
            const x1 = 170 + Math.cos(rad) * r1;
            const y1 = 170 + Math.sin(rad) * r1;
            const x2 = 170 + Math.cos(rad) * r2;
            const y2 = 170 + Math.sin(rad) * r2;
            return (
              <line
                key={i}
                x1={x1} y1={y1} x2={x2} y2={y2}
                stroke={isMajor ? theme.main : "#272a33"}
                strokeWidth={isMajor ? "2" : "1"}
              />
            );
          })}

          {/* Dark Background Arc Track */}
          <path
            d="M 75,230 A 100,100 0 1,1 265,230"
            fill="none"
            stroke="#161820"
            strokeWidth="8"
            strokeLinecap="round"
          />

          {/* Colored Active Arc */}
          <path
            d="M 75,230 A 100,100 0 1,1 265,230"
            fill="none"
            stroke={theme.main}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={628}
            strokeDashoffset={628 - (animatedConf / 100) * 440}
            filter="url(#gaugeGlow)"
            className="ed-arc"
          />

          {/* Inner Dial Face Circle */}
          <circle cx="170" cy="170" r="75" fill="#090a0d" stroke="#1f2229" strokeWidth="2" />
          <circle cx="170" cy="170" r="68" fill="none" stroke="#14161d" strokeWidth="1" strokeDasharray="3 3" />

          {/* Center Digital Display Text */}
          <text
            x="170" y="142"
            textAnchor="middle"
            fill={theme.main}
            fontSize="12"
            fontWeight="800"
            fontFamily="sans-serif"
            letterSpacing="2"
          >
            {isPrivate ? "PAUSED" : currentContext}
          </text>

          <text
            x="170" y="178"
            textAnchor="middle"
            fill={isPrivate ? "#ef4444" : "#f4f4f5"}
            fontSize="36"
            fontWeight="900"
            fontFamily="monospace"
          >
            {isPrivate ? "--" : `${Math.round(animatedConf)}%`}
          </text>

          <text
            x="170" y="196"
            textAnchor="middle"
            fill="#71717a"
            fontSize="8"
            fontWeight="700"
            fontFamily="sans-serif"
            letterSpacing="1.5"
          >
            {isPrivate ? "PRIVACY ENGAGED" : "DERIVED CONFIDENCE"}
          </text>

          {/* Needle Indicator */}
          {!isPrivate && (
            <g transform={`rotate(${140 + (animatedConf / 100) * 260}, 170, 170)`} className="transition-transform duration-500 ease-out">
              <line x1="170" y1="170" x2="170" y2="78" stroke={theme.main} strokeWidth="2" filter="url(#gaugeGlow)" />
              <circle cx="170" cy="170" r="5" fill={theme.main} />
            </g>
          )}

          {/* Left Readout */}
          <text x="65" y="275" textAnchor="middle" fill="#e4e4e7" fontSize="13" fontWeight="bold" fontFamily="monospace">
            {aiRuntime.inferenceLatency !== null ? `${aiRuntime.inferenceLatency} ms` : "N/A"}
          </text>
          <text x="65" y="290" textAnchor="middle" fill="#71717a" fontSize="7" className="uppercase" fontFamily="sans-serif">
            PIPELINE LATENCY
          </text>

          {/* Right Readout */}
          <text x="275" y="275" textAnchor="middle" fill="#e4e4e7" fontSize="12" fontWeight="bold" fontFamily="monospace">
            {tempDisplay}
          </text>
          <text x="275" y="290" textAnchor="middle" fill="#71717a" fontSize="8" className="uppercase" fontFamily="sans-serif">
            ENGINE TEMP
          </text>
        </svg>

        {/* 4 Supporting Signal Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-0.5">
          <span className="text-[8px] font-mono uppercase text-zinc-500">USER</span>
          <span className={cn("text-[10px] font-mono font-bold uppercase", userStatus === "PRESENT" ? "text-lime-400" : "text-zinc-500")}>
            {userStatus}
          </span>
        </div>

        <div className="absolute top-2 right-2 flex flex-col items-end gap-0.5 max-w-[120px]">
          <span className="text-[8px] font-mono uppercase text-zinc-500">ACTIVE APP</span>
          <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase truncate" title={activeAppInfo?.windowTitle}>
            {appDisplay}
          </span>
          <span className="text-[8px] text-zinc-500 font-mono truncate">{activeAppInfo?.process || "explorer.exe"}</span>
        </div>

        <div className="absolute bottom-2 left-2 flex flex-col gap-0.5">
          <span className="text-[8px] font-mono uppercase text-zinc-500">ENVIRONMENT</span>
          <span className={cn("text-[10px] font-mono font-bold uppercase", envStatus === "SPEECH" ? "text-amber-400" : "text-cyan-400")}>
            {envStatus}
          </span>
        </div>

        <div className="absolute bottom-2 right-2 flex flex-col items-end gap-0.5">
          <span className="text-[8px] font-mono uppercase text-zinc-500">ACTIVITY</span>
          <span className={cn("text-[10px] font-mono font-bold uppercase", actStatus === "ACTIVE" ? "text-amber-400" : "text-zinc-500")}>
            {actStatus}
          </span>
        </div>
      </div>

      {/* 3. EVENT-DERIVED AUTO MODE REASONS & SYSTEM INTEGRATIONS PANEL */}
      <div className="w-full bg-[#0a0b0d] border border-zinc-800/80 rounded p-2 text-[10px] font-mono mt-1 space-y-1">
        <div className="flex items-center justify-between text-[9px] uppercase font-bold text-zinc-400 border-b border-zinc-800/60 pb-1">
          <span className="flex items-center gap-1">
            <Cpu className="w-3 h-3 text-cyan-400" />
            <span>AUTO MODE SELECTION EVIDENCE ({contextMode})</span>
          </span>
          <span className={theme.text}>{contextSubtitle}</span>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-0.5">
          {/* Left: Mode Reasons */}
          <div>
            <span className="text-[8px] uppercase text-zinc-500 block mb-0.5">EVENT-DERIVED REASONS:</span>
            <div className="space-y-0.5">
              {modeReasons.length > 0 ? (
                modeReasons.map((reason, idx) => (
                  <div key={idx} className="text-zinc-300 text-[9px] flex items-center gap-1 truncate">
                    <span>{reason}</span>
                  </div>
                ))
              ) : (
                <div className="text-zinc-500 italic text-[9px]">Analyzing live context signals...</div>
              )}
            </div>
          </div>

          {/* Right: Windows OS System Integrations */}
          <div>
            <span className="text-[8px] uppercase text-zinc-500 block mb-0.5">WINDOWS SYSTEM INTEGRATION:</span>
            <div className="space-y-0.5">
              {systemChanges.length > 0 ? (
                systemChanges.map((change, idx) => (
                  <div key={idx} className="text-lime-400 text-[9px] flex items-center gap-1 truncate">
                    <CheckCircle2 className="w-2.5 h-2.5 text-lime-400 flex-shrink-0" />
                    <span>{change}</span>
                  </div>
                ))
              ) : (
                <div className="text-zinc-500 text-[9px] italic">Normal OS Profile (Balanced)</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
