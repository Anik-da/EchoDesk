import { cn } from "@/utils/cn";

interface StatusDotProps {
  state: "active" | "low" | "idle" | "off";
  className?: string;
}

const colors: Record<string, string> = {
  active: "bg-emerald-400 shadow-[0_0_4px_rgba(52,211,153,0.6)]",
  low: "bg-cyan-400 shadow-[0_0_4px_rgba(34,211,238,0.4)]",
  idle: "bg-zinc-500",
  off: "bg-zinc-700",
};

export function StatusDot({ state, className }: StatusDotProps) {
  return (
    <span
      className={cn(
        "ed-dot inline-block h-1.5 w-1.5 rounded-full",
        colors[state],
        (state === "active" || state === "low") && "ed-pulse",
        className
      )}
    />
  );
}
