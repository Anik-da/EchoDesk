import { useEffect, useState } from "react";
import { useEchoDesk } from "@/store/EchoDeskContext";
import { useAnimatedNumber } from "@/hooks/useAnimatedNumber";
import { cn } from "@/utils/cn";

export function ContextCore() {
  const { currentContext, contextConfidence, contextMode, setContextMode, signals, contextSubtitle, aiRuntime } = useEchoDesk();
  const animatedConf = useAnimatedNumber(contextConfidence);
  const isPrivate = contextMode === "PRIVATE";

  // Dynamic Color Palette for Every Mode
  const modeThemes: Record<string, { main: string; glow: string; text: string; bg: string; border: string }> = {
    "DEEP FOCUS": { main: "#84cc16", glow: "rgba(132, 204, 22, 0.4)", text: "text-lime-400", bg: "bg-lime-500/20", border: "border-lime-500/40" },
    "BALANCED": { main: "#06b6d4", glow: "rgba(6, 182, 212, 0.4)", text: "text-cyan-400", bg: "bg-cyan-500/20", border: "border-cyan-500/40" },
    "COLLABORATION": { main: "#3b82f6", glow: "rgba(59, 130, 246, 0.4)", text: "text-blue-400", bg: "bg-blue-500/20", border: "border-blue-500/40" },
    "MEETING": { main: "#f59e0b", glow: "rgba(245, 158, 11, 0.4)", text: "text-amber-400", bg: "bg-amber-500/20", border: "border-amber-500/40" },
    "PRIVATE": { main: "#ef4444", glow: "rgba(239, 68, 68, 0.4)", text: "text-red-400", bg: "bg-red-500/20", border: "border-red-500/40" },
  };

  const theme = modeThemes[contextMode] || modeThemes["DEEP FOCUS"];

  // Gauge calculations (220 degree arc from 160 deg to 380 deg)
  const radius = 100;
  const maxArcAngle = 220;
  const currentAngle = (animatedConf / 100) * maxArcAngle;

  const modeOptions = [
    { label: "Deep Focus", value: "DEEP FOCUS" },
    { label: "Balanced", value: "BALANCED" },
    { label: "Collaboration", value: "COLLABORATION" },
    { label: "Meeting", value: "MEETING" },
    { label: "Private", value: "PRIVATE" },
  ];

  const [bottomProfile, setBottomProfile] = useState("Custom");

  return (
    <div className="relative flex flex-col items-center justify-between w-full h-full p-2 select-none">
      {/* 1. TOP MODE SELECTOR BAR (GIGABYTE style) */}
      <div className="flex items-center gap-1.5 rounded-full bg-[#0a0b0e] p-1 border border-zinc-800/80 mb-2">
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

      {/* 2. CENTRAL SYSTEM DIAL GAUGE (Authentic GIGABYTE Control Center Style) */}
      <div className="relative flex-1 w-full flex items-center justify-center min-h-[300px]">
        {/* Radial burst lines behind gauge (like GIGABYTE UI) */}
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
        <svg viewBox="0 0 340 340" className="w-full h-full max-w-[340px] max-h-[340px] z-10">
          <defs>
            <filter id="gaugeGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Outer Tachometer Ticks (1, 2, 3, 4, 5) */}
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

          {/* Colored Active Arc (CHANGES COLOR WITH EVERY MODE!) */}
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
            {isPrivate ? "PRIVACY ENGAGED" : "CONFIDENCE SCORE"}
          </text>

          {/* Needle Indicator */}
          {!isPrivate && (
            <g transform={`rotate(${140 + (animatedConf / 100) * 260}, 170, 170)`} className="transition-transform duration-500 ease-out">
              <line x1="170" y1="170" x2="170" y2="78" stroke={theme.main} strokeWidth="2" filter="url(#gaugeGlow)" />
              <circle cx="170" cy="170" r="5" fill={theme.main} />
            </g>
          )}

          {/* Left Readout: Clock Speed / Latency */}
          <text x="65" y="275" textAnchor="middle" fill="#e4e4e7" fontSize="13" fontWeight="bold" fontFamily="monospace">
            {aiRuntime.inferenceLatency} ms
          </text>
          <text x="65" y="290" textAnchor="middle" fill="#71717a" fontSize="8" className="uppercase" fontFamily="sans-serif">
            INFERENCE LATENCY
          </text>

          {/* Right Readout: Temperature / Activity */}
          <text x="275" y="275" textAnchor="middle" fill="#e4e4e7" fontSize="13" fontWeight="bold" fontFamily="monospace">
            {isPrivate ? "0%" : "45°C"}
          </text>
          <text x="275" y="290" textAnchor="middle" fill="#71717a" fontSize="8" className="uppercase" fontFamily="sans-serif">
            ENGINE TEMP
          </text>
        </svg>

        {/* 4 Supporting Signals Cards (GIGABYTE Style Positioned Around Dial) */}
        <div className="absolute top-4 left-2 flex flex-col gap-1">
          <span className="text-[8px] font-mono uppercase text-zinc-500">USER</span>
          <span className={cn("text-[10px] font-mono font-bold uppercase", isPrivate ? "text-zinc-600" : "text-lime-400")}>
            {isPrivate ? "OFF" : "PRESENT"}
          </span>
        </div>

        <div className="absolute top-4 right-2 flex flex-col items-end gap-1">
          <span className="text-[8px] font-mono uppercase text-zinc-500">APPLICATION</span>
          <span className="text-[10px] font-mono font-bold text-zinc-200 uppercase">
            {isPrivate ? "N/A" : "VS CODE"}
          </span>
        </div>

        <div className="absolute bottom-4 left-2 flex flex-col gap-1">
          <span className="text-[8px] font-mono uppercase text-zinc-500">ENVIRONMENT</span>
          <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase">
            {isPrivate ? "N/A" : "QUIET"}
          </span>
        </div>

        <div className="absolute bottom-4 right-2 flex flex-col items-end gap-1">
          <span className="text-[8px] font-mono uppercase text-zinc-500">ACTIVITY</span>
          <span className="text-[10px] font-mono font-bold text-amber-400 uppercase">
            {isPrivate ? "NONE" : "TYPING"}
          </span>
        </div>
      </div>

      {/* 3. BOTTOM PROFILE SELECTOR STRIP (Automatic / Maximum / Custom) */}
      <div className="flex items-center gap-2 mt-1">
        {["Automatic", "Maximum", "Custom"].map((p) => {
          const active = bottomProfile === p;
          return (
            <button
              key={p}
              onClick={() => setBottomProfile(p)}
              className={cn(
                "rounded px-3 py-1 text-[9px] font-mono font-bold uppercase transition-all",
                active
                  ? `${theme.bg} ${theme.text} ${theme.border} border shadow-md`
                  : "bg-zinc-900/60 text-zinc-500 border border-zinc-800 hover:text-zinc-300"
              )}
            >
              {p}
            </button>
          );
        })}
      </div>
    </div>
  );
}
