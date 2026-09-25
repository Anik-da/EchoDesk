import { LayoutDashboard, GitBranch, Clock, ShieldCheck, Cpu, Radio, Settings } from "lucide-react";
import { useEchoDesk } from "@/store/EchoDeskContext";
import { Tooltip } from "@/components/ui/Tooltip";
import { cn } from "@/utils/cn";

const navItems = [
  { id: "system", label: "System", icon: LayoutDashboard },
  { id: "context", label: "Context", icon: GitBranch },
  { id: "timeline", label: "Timeline", icon: Clock },
  { id: "privacy", label: "Privacy", icon: ShieldCheck },
  { id: "runtime", label: "AI Runtime", icon: Cpu },
  { id: "sensors", label: "Sensors", icon: Radio },
  { id: "settings", label: "Settings", icon: Settings },
];

export function IconRail() {
  const { activeNav, setActiveNav } = useEchoDesk();

  return (
    <nav className="flex w-14 flex-col items-center gap-1 border-r border-zinc-800 bg-zinc-950/80 py-2">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = activeNav === item.id;
        return (
          <Tooltip key={item.id} label={item.label} side="right">
            <button
              onClick={() => setActiveNav(item.id)}
              className={cn(
                "relative flex h-10 w-10 items-center justify-center rounded transition-all",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/50",
                active
                  ? "bg-emerald-500/10 text-emerald-400"
                  : "text-zinc-500 hover:bg-zinc-800/60 hover:text-zinc-300"
              )}
            >
              {active && (
                <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r bg-emerald-400" />
              )}
              <Icon className="h-4.5 w-4.5" strokeWidth={active ? 2.2 : 1.8} />
            </button>
          </Tooltip>
        );
      })}
    </nav>
  );
}
