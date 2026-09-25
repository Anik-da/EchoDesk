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
    <nav className="flex w-14 flex-col items-center gap-2 border-r border-[#1f2229] bg-[#090a0d] py-3 select-none">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = activeNav === item.id;
        return (
          <Tooltip key={item.id} label={item.label} side="right">
            <button
              onClick={() => setActiveNav(item.id)}
              className={cn(
                "relative flex h-10 w-10 items-center justify-center rounded transition-all duration-150",
                active
                  ? "bg-lime-500/20 text-lime-400 border border-lime-500/50 shadow-md shadow-lime-500/10"
                  : "text-zinc-500 hover:bg-zinc-800/60 hover:text-zinc-200"
              )}
            >
              {active && (
                <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r bg-lime-400" />
              )}
              <Icon className="h-4.5 w-4.5" strokeWidth={active ? 2.2 : 1.8} />
            </button>
          </Tooltip>
        );
      })}
    </nav>
  );
}
