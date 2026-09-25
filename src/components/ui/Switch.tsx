import { cn } from "@/utils/cn";

interface SwitchProps {
  checked: boolean;
  onChange: () => void;
  label?: string;
  size?: "sm" | "md";
  disabled?: boolean;
}

export function Switch({ checked, onChange, label, size = "md", disabled }: SwitchProps) {
  const w = size === "sm" ? "w-7" : "w-9";
  const h = size === "sm" ? "h-4" : "h-5";
  const knob = size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5";
  const translate = size === "sm" ? (checked ? "translate-x-3" : "translate-x-0.5") : (checked ? "translate-x-4" : "translate-x-0.5");

  return (
    <div className="flex items-center gap-2">
      {label && <span className="text-xs text-zinc-400">{label}</span>}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={onChange}
        className={cn(
          "relative inline-flex items-center rounded-full transition-colors duration-200",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/50",
          w, h,
          checked ? "bg-emerald-500/80" : "bg-zinc-700",
          disabled && "opacity-40 cursor-not-allowed"
        )}
      >
        <span className={cn("inline-block rounded-full bg-white transition-transform duration-200", knob, translate)} />
      </button>
    </div>
  );
}
