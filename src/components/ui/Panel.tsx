import { type ReactNode } from "react";
import { cn } from "@/utils/cn";

interface PanelProps {
  title?: string;
  children: ReactNode;
  className?: string;
  accent?: boolean;
  rightSlot?: ReactNode;
}

export function Panel({ title, children, className, accent, rightSlot }: PanelProps) {
  return (
    <div
      className={cn(
        "border border-zinc-800 bg-zinc-900/60 backdrop-blur-sm",
        "transition-colors duration-200 hover:border-zinc-700",
        className
      )}
    >
      {title && (
        <div className="flex items-center justify-between border-b border-zinc-800 px-3 py-2">
          <h3 className="text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-400">
            {accent && <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />}
            {title}
          </h3>
          {rightSlot}
        </div>
      )}
      <div className="px-3 py-2.5">{children}</div>
    </div>
  );
}
