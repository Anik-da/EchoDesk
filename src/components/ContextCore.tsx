import { useEffect, useState } from "react";
import { useEchoDesk } from "@/store/EchoDeskContext";
import { useAnimatedNumber } from "@/hooks/useAnimatedNumber";
import { cn } from "@/utils/cn";

export function ContextCore() {
  const { currentContext, contextConfidence, contextMode, signals } = useEchoDesk();
  const animatedConf = useAnimatedNumber(contextConfidence);
  const isPrivate = contextMode === "PRIVATE";

  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (animatedConf / 100) * circumference;

  // tick marks
  const ticks = Array.from({ length: 60 }, (_, i) => i);
  const innerTicks = Array.from({ length: 24 }, (_, i) => i);

  const [pulsePhase, setPulsePhase] = useState(0);
  useEffect(() => {
    if (isPrivate) return;
    const i = setInterval(() => setPulsePhase((p) => (p + 1) % 100), 100);
    return () => clearInterval(i);
  }, [isPrivate]);

  return (
    <div className="relative flex items-center justify-center">
      <svg viewBox="0 0 300 300" className="w-full max-w-[320px]">
        {/* Outer decorative ring */}
        <circle cx="150" cy="150" r="145" fill="none" stroke="#27272a" strokeWidth="0.5" />

        {/* Slow rotating outer tick ring */}
        <g className="ed-slow-rotate" style={{ transformOrigin: "150px 150px" }}>
          {ticks.map((i) => {
            const angle = (i / 60) * 360;
            const rad = (angle * Math.PI) / 180;
            const inner = 138;
            const outer = i % 5 === 0 ? 130 : 134;
            const x1 = 150 + Math.cos(rad) * inner;
            const y1 = 150 + Math.sin(rad) * inner;
            const x2 = 150 + Math.cos(rad) * outer;
            const y2 = 150 + Math.sin(rad) * outer;
            return (
              <line
                key={i}
                x1={x1} y1={y1} x2={x2} y2={y2}
                stroke={i % 5 === 0 ? "#52525b" : "#3f3f46"}
                strokeWidth={i % 5 === 0 ? 1 : 0.5}
              />
            );
          })}
        </g>

        {/* Inner tick ring (counter-rotate) */}
        <g className="ed-slow-rotate-rev" style={{ transformOrigin: "150px 150px" }}>
          {innerTicks.map((i) => {
            const angle = (i / 24) * 360;
            const rad = (angle * Math.PI) / 180;
            const x1 = 150 + Math.cos(rad) * 115;
            const y1 = 150 + Math.sin(rad) * 115;
            const x2 = 150 + Math.cos(rad) * 110;
            const y2 = 150 + Math.sin(rad) * 110;
            return (
              <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#3f3f46" strokeWidth="0.5" />
            );
          })}
        </g>

        {/* Background ring */}
        <circle cx="150" cy="150" r={radius} fill="none" stroke="#27272a" strokeWidth="6" />

        {/* Progress arc */}
        {!isPrivate && (
          <circle
            cx="150"
            cy="150"
            r={radius}
            fill="none"
            stroke="url(#edGrad)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            className="ed-arc"
            transform="rotate(-90 150 150)"
          />
        )}

        {/* Radial signal lines */}
        {!isPrivate &&
          signals.filter((s) => s.enabled).map((s, i) => {
            const angle = (i / signals.filter((s) => s.enabled).length) * 360 - 90;
            const rad = (angle * Math.PI) / 180;
            const wave = Math.sin(pulsePhase * 0.06 + i) * 3;
            const r1 = 98 + wave;
            const r2 = 108 + wave;
            const x1 = 150 + Math.cos(rad) * r1;
            const y1 = 150 + Math.sin(rad) * r1;
            const x2 = 150 + Math.cos(rad) * r2;
            const y2 = 150 + Math.sin(rad) * r2;
            return (
              <line
                key={s.id}
                x1={x1} y1={y1} x2={x2} y2={y2}
                stroke="#34d399"
                strokeWidth="1.5"
                opacity={0.3 + (s.activityLevel / 100) * 0.5}
              />
            );
          })}

        {/* Inner circle */}
        <circle cx="150" cy="150" r="92" fill="#131316" stroke="#27272a" strokeWidth="0.5" />
        <circle cx="150" cy="150" r="85" fill="none" stroke="#1e1e22" strokeWidth="0.5" />

        {/* Gradient def */}
        <defs>
          <linearGradient id="edGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#22d3ee" />
          </linearGradient>
          <radialGradient id="edCoreGlow">
            <stop offset="0%" stopColor={isPrivate ? "#52525b" : "#34d399"} stopOpacity="0.08" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>

        {/* Center glow */}
        <circle cx="150" cy="150" r="85" fill="url(#edCoreGlow)" />

        {/* Center text */}
        <text
          x="150" y="135"
          textAnchor="middle"
          fill={isPrivate ? "#71717a" : "#34d399"}
          fontSize="18"
          fontWeight="700"
          fontFamily="Inter, sans-serif"
          letterSpacing="1"
        >
          {isPrivate ? "PAUSED" : currentContext}
        </text>
        <text
          x="150" y="170"
          textAnchor="middle"
          fill={isPrivate ? "#52525b" : "#e4e4e7"}
          fontSize="36"
          fontWeight="800"
          fontFamily="Inter, sans-serif"
        >
          {isPrivate ? "--" : Math.round(animatedConf)}
        </text>
        <text
          x="150" y="188"
          textAnchor="middle"
          fill="#71717a"
          fontSize="8"
          fontWeight="500"
          fontFamily="Inter, sans-serif"
          letterSpacing="2"
        >
          {isPrivate ? "PRIVACY MODE" : "CONFIDENCE"}
        </text>
      </svg>

      {/* Context labels around the gauge */}
      <ContextLabels isPrivate={isPrivate} signals={signals} />
    </div>
  );
}

function ContextLabels({ isPrivate, signals }: { isPrivate: boolean; signals: ReturnType<typeof useEchoDesk>["signals"] }) {
  const labelData = [
    { label: "USER", value: isPrivate ? "OFF" : "PRESENT", state: isPrivate ? "off" : "active" },
    { label: "APPLICATION", value: isPrivate ? "N/A" : "VS CODE", state: isPrivate ? "off" : "active" },
    { label: "ENVIRONMENT", value: isPrivate ? "N/A" : "QUIET", state: isPrivate ? "off" : "low" },
    { label: "ACTIVITY", value: isPrivate ? "NONE" : "TYPING", state: isPrivate ? "off" : "active" },
  ];

  return (
    <div className="absolute inset-0 pointer-events-none">
      {labelData.map((item, i) => {
        const positions = [
          { top: "8%", left: "50%", transform: "translateX(-50%)" },
          { top: "50%", right: "0%", transform: "translateY(-50%)" },
          { bottom: "8%", left: "50%", transform: "translateX(-50%)" },
          { top: "50%", left: "0%", transform: "translateY(-50%)" },
        ];
        const pos = positions[i];
        return (
          <div
            key={item.label}
            className="absolute flex flex-col items-center gap-0.5"
            style={pos}
          >
            <span className="text-[8px] uppercase tracking-[0.15em] text-zinc-600">{item.label}</span>
            <span className={cn(
              "text-[10px] font-semibold uppercase tracking-wider",
              isPrivate ? "text-zinc-700" : "text-zinc-300"
            )}>{item.value}</span>
            <span className={cn(
              "inline-block h-1 w-1 rounded-full",
              item.state === "active" ? "bg-emerald-400" : item.state === "low" ? "bg-cyan-400" : "bg-zinc-700"
            )} />
          </div>
        );
      })}
    </div>
  );
}
