import { Camera, Mic, Monitor, Cloud, Video, AudioLines, ShieldCheck } from "lucide-react";
import { useEchoDesk } from "@/store/EchoDeskContext";
import { cn } from "@/utils/cn";

export function PrivacyPanel() {
  const { privacy, togglePrivateMode } = useEchoDesk();

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-1.5">
        <PrivacyItem icon={Camera} label="Camera" active={privacy.cameraActive} />
        <PrivacyItem icon={Mic} label="Microphone" active={privacy.microphoneActive} />
        <PrivacyItem icon={Monitor} label="Screen" active={privacy.screenActive} />
      </div>

      <div className="grid grid-cols-2 gap-1.5 border-t border-zinc-800 pt-2">
        <PrivacyRow icon={Cloud} label="Cloud Processing" active={privacy.cloudProcessing} />
        <PrivacyRow icon={Video} label="Raw Video Storage" active={privacy.rawVideoStored} never={!privacy.rawVideoStored} />
        <PrivacyRow icon={AudioLines} label="Raw Audio Storage" active={privacy.rawAudioStored} never={!privacy.rawAudioStored} />
      </div>

      <button
        onClick={togglePrivateMode}
        className={cn(
          "flex w-full items-center justify-center gap-2 rounded px-3 py-2 text-[11px] font-semibold uppercase tracking-wider transition-all",
          privacy.privateMode
            ? "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/40"
            : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200"
        )}
      >
        <ShieldCheck className="h-3.5 w-3.5" />
        {privacy.privateMode ? "Private Mode Active" : "Activate Private Mode"}
      </button>
    </div>
  );
}

function PrivacyItem({ icon: Icon, label, active }: { icon: React.ComponentType<{ className?: string }>; label: string; active: boolean }) {
  return (
    <div className={cn(
      "flex flex-col items-center gap-1 rounded border px-1 py-1.5 transition-colors",
      active ? "border-zinc-700 bg-zinc-900/50" : "border-zinc-800/40 bg-zinc-950/20"
    )}>
      <Icon className={cn("h-3.5 w-3.5", active ? "text-emerald-400" : "text-zinc-700")} />
      <span className="text-[8px] uppercase tracking-wider text-zinc-600">{label}</span>
      <span className={cn("text-[9px] font-semibold", active ? "text-emerald-400" : "text-zinc-600")}>
        {active ? "ACTIVE" : "OFF"}
      </span>
    </div>
  );
}

function PrivacyRow({ icon: Icon, label, active, never }: { icon: React.ComponentType<{ className?: string }>; label: string; active: boolean; never?: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon className="h-3 w-3 text-zinc-600" />
      <span className="text-[9px] uppercase tracking-wider text-zinc-500">{label}</span>
      <span className={cn(
        "ml-auto text-[9px] font-semibold",
        never ? "text-zinc-600" : active ? "text-zinc-400" : "text-zinc-600"
      )}>
        {never ? "NEVER" : active ? "ON" : "OFF"}
      </span>
    </div>
  );
}
