import { cn } from "@/utils/cn";

interface ModeOption {
  label: string;
  value: string;
}

interface ModeSelectorProps {
  options: ModeOption[];
  value: string;
  onChange: (v: string) => void;
  className?: string;
  size?: "sm" | "md";
}

export function ModeSelector({ options, value, onChange, className, size = "md" }: ModeSelectorProps) {
  const pad = size === "sm" ? "px-2 py-1 text-[9px]" : "px-3 py-1.5 text-[10px]";

  return (
    <div className={cn("flex gap-1", className)}>
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            "ed-mode-btn rounded font-semibold uppercase tracking-wider transition-all",
            pad,
            value === opt.value
              ? "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/40"
              : "bg-zinc-800/50 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
