import { useState, type ReactNode } from "react";
import { cn } from "@/utils/cn";

interface TooltipProps {
  label: string;
  children: ReactNode;
  side?: "right" | "left" | "bottom" | "top";
  className?: string;
}

export function Tooltip({ label, children, side = "right", className }: TooltipProps) {
  const [show, setShow] = useState(false);

  const posClasses = {
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
  };

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <div
          className={cn(
            "pointer-events-none absolute z-50 whitespace-nowrap rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-[10px] font-medium text-zinc-200 shadow-xl",
            posClasses[side],
            className
          )}
        >
          {label}
        </div>
      )}
    </div>
  );
}
